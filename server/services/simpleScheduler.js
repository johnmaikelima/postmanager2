import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import facebookService from './facebook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEDULE_FILE = path.join(__dirname, '../data/scheduled-posts.json');

/**
 * Sistema de agendamento simples sem Redis
 * Usa arquivo JSON + node-cron
 */
class SimpleScheduler {
  constructor() {
    this.ensureScheduleFile();
    this.startCronJob();
  }

  ensureScheduleFile() {
    const dir = path.dirname(SCHEDULE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(SCHEDULE_FILE)) {
      fs.writeFileSync(SCHEDULE_FILE, JSON.stringify({ posts: [] }, null, 2));
    }
  }

  readSchedule() {
    try {
      const raw = fs.readFileSync(SCHEDULE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      console.error('Erro ao ler agendamentos:', error);
      return { posts: [] };
    }
  }

  writeSchedule(data) {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Agenda um post
   */
  schedulePost(postData, scheduledTime) {
    const schedule = this.readSchedule();
    
    const post = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      ...postData,
      scheduledTime: new Date(scheduledTime).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    schedule.posts.push(post);
    this.writeSchedule(schedule);

    console.log(`✅ Post agendado - ID: ${post.id} para ${new Date(scheduledTime).toLocaleString('pt-BR')}`);

    return {
      jobId: post.id,
      scheduledTime: post.scheduledTime,
      status: 'scheduled'
    };
  }

  /**
   * Lista posts agendados
   */
  getScheduledPosts() {
    const schedule = this.readSchedule();
    return schedule.posts
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  }

  /**
   * Cancela um post agendado
   */
  cancelPost(jobId) {
    const schedule = this.readSchedule();
    const postIndex = schedule.posts.findIndex(p => p.id === jobId);
    
    if (postIndex === -1) {
      throw new Error('Post não encontrado');
    }

    schedule.posts.splice(postIndex, 1);
    this.writeSchedule(schedule);

    console.log(`🗑️ Post ${jobId} cancelado`);
    return { success: true };
  }

  /**
   * Processa posts que devem ser publicados
   */
  async processPendingPosts() {
    const schedule = this.readSchedule();
    const now = new Date();
    
    const postsToPublish = schedule.posts.filter(post => {
      if (post.status !== 'pending') return false;
      const scheduledTime = new Date(post.scheduledTime);
      return scheduledTime <= now;
    });

    if (postsToPublish.length === 0) {
      return;
    }

    console.log(`📤 Processando ${postsToPublish.length} posts agendados...`);

    for (const post of postsToPublish) {
      try {
        console.log(`📝 Publicando ${post.isReel ? 'Reel' : 'post'} ${post.id}...`);

        // Buscar páginas do Facebook
        const pagesResponse = await fetch('http://localhost:3006/api/facebook/pages');
        const pagesData = await pagesResponse.json();

        if (!pagesData.success) {
          throw new Error('Erro ao buscar páginas');
        }

        // Preparar dados de publicação
        const publishData = {
          message: post.message,
          targetPageIds: [post.targetPageId]
        };

        // Adicionar imagem ou vídeo
        if (post.isReel && post.videoPath) {
          publishData.videoPath = post.videoPath;
          publishData.isReel = true;
        } else if (post.imagePath) {
          publishData.imagePath = post.imagePath;
        }

        // Publicar post
        const publishResponse = await fetch('http://localhost:3006/api/facebook/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishData)
        });

        const publishData2 = await publishResponse.json();

        if (!publishData2.success) {
          throw new Error('Erro ao publicar post');
        }

        console.log(`✅ Post ${post.id} publicado na página ${post.targetPageId}`);

        // Marcar como publicado
        post.status = 'completed';
        post.publishedAt = new Date().toISOString();
      } catch (error) {
        console.error(`❌ Erro ao publicar post ${post.id}:`, error.message);
        post.status = 'failed';
        post.error = error.message;
      }
    }

    this.writeSchedule(schedule);
  }

  /**
   * Inicia CRON job que verifica a cada minuto
   */
  startCronJob() {
    // Verificar a cada minuto se há posts para publicar
    cron.schedule('* * * * *', async () => {
      try {
        await this.processPendingPosts();
      } catch (error) {
        console.error('❌ Erro no CRON de agendamento:', error);
      }
    });

    console.log('✅ Sistema de agendamento simples inicializado (verifica a cada minuto)');
  }

  /**
   * Limpa posts antigos (completados ou falhos com mais de 7 dias)
   */
  cleanOldPosts() {
    const schedule = this.readSchedule();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const initialCount = schedule.posts.length;
    schedule.posts = schedule.posts.filter(post => {
      if (post.status === 'pending') return true;
      const postDate = new Date(post.publishedAt || post.createdAt);
      return postDate > sevenDaysAgo;
    });

    const removed = initialCount - schedule.posts.length;
    if (removed > 0) {
      this.writeSchedule(schedule);
      console.log(`🧹 ${removed} posts antigos removidos`);
    }
  }
}

export default new SimpleScheduler();
