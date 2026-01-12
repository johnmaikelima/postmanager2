import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import contentGenerator from './contentGenerator.js';
import reelGenerator from './reelGenerator.js';
import pageLogoConfigService from './pageLogoConfig.js';
import simpleScheduler from './simpleScheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUEUE_FILE = path.join(__dirname, '../data/content-queue.json');

/**
 * Serviço de fila recorrente de conteúdo
 * Gerencia fila de frases que são postadas automaticamente todos os dias
 */
class ContentQueueService {
  constructor() {
    this.ensureQueueFile();
    this.cronJob = null;
  }

  /**
   * Garante que o arquivo de fila existe
   */
  ensureQueueFile() {
    const dir = path.dirname(QUEUE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(QUEUE_FILE)) {
      const initialData = {
        enabled: false,
        phrases: [],
        config: {
          scheduleHours: [8, 12, 18, 21], // Horários padrão
          pageIds: [],
          template: 'dark',
          watermark: '',
          postsPerDay: 4
        },
        stats: {
          totalAdded: 0,
          totalScheduled: 0,
          totalPublished: 0,
          lastRun: null
        }
      };
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(initialData, null, 2));
    }
  }

  /**
   * Lê dados da fila
   */
  readQueue() {
    this.ensureQueueFile();
    try {
      const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      console.error('Erro ao ler fila:', error);
      return {
        enabled: false,
        phrases: [],
        config: {
          scheduleHours: [8, 12, 18, 21],
          pageIds: [],
          template: 'dark',
          watermark: '',
          postsPerDay: 4
        },
        stats: {
          totalAdded: 0,
          totalScheduled: 0,
          totalPublished: 0,
          lastRun: null
        }
      };
    }
  }

  /**
   * Salva dados da fila
   */
  writeQueue(data) {
    this.ensureQueueFile();
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Adiciona frases à fila
   */
  addPhrases(phrases) {
    const queue = this.readQueue();
    const newPhrases = phrases.map((phraseData, index) => {
      // Suportar tanto string quanto objeto
      const text = typeof phraseData === 'string' ? phraseData : phraseData.text;
      const contentType = typeof phraseData === 'object' ? phraseData.contentType : undefined;
      
      return {
        id: Date.now() + index,
        text,
        contentType, // 'reel' ou undefined (para imagens)
        status: 'pending', // pending, scheduled, published, failed
        addedAt: new Date().toISOString(),
        scheduledAt: null,
        publishedAt: null,
        jobIds: []
      };
    });

    queue.phrases.push(...newPhrases);
    queue.stats.totalAdded += newPhrases.length;
    this.writeQueue(queue);

    console.log(`✅ ${newPhrases.length} frases adicionadas à fila (${newPhrases.filter(p => p.contentType === 'reel').length} Reels)`);
    return newPhrases;
  }

  /**
   * Remove frase da fila
   */
  removePhrase(phraseId) {
    const queue = this.readQueue();
    queue.phrases = queue.phrases.filter(p => p.id !== phraseId);
    this.writeQueue(queue);
    return true;
  }

  /**
   * Atualiza configuração da fila
   */
  updateConfig(config) {
    const queue = this.readQueue();
    queue.config = { ...queue.config, ...config };
    this.writeQueue(queue);
    return queue.config;
  }

  /**
   * Liga/desliga fila automática
   */
  setEnabled(enabled) {
    const queue = this.readQueue();
    queue.enabled = enabled;
    this.writeQueue(queue);

    if (enabled) {
      this.startCronJob();
      console.log('✅ Fila automática ATIVADA');
    } else {
      this.stopCronJob();
      console.log('⏸️  Fila automática PAUSADA');
    }

    return enabled;
  }

  /**
   * Obtém status da fila
   */
  getStatus() {
    try {
      const queue = this.readQueue();
      const pending = queue.phrases.filter(p => p.status === 'pending').length;
      const scheduled = queue.phrases.filter(p => p.status === 'scheduled').length;
      const published = queue.phrases.filter(p => p.status === 'published').length;
      const failed = queue.phrases.filter(p => p.status === 'failed').length;

      return {
        success: true,
        enabled: queue.enabled,
        config: queue.config,
        stats: {
          ...queue.stats,
          pending,
          scheduled,
          published,
          failed,
          total: queue.phrases.length
        },
        phrases: queue.phrases,
        nextRun: this.getNextRunTime()
      };
    } catch (error) {
      console.error('Error in getStatus:', error);
      throw error;
    }
  }

  /**
   * Calcula próxima execução
   */
  getNextRunTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 00:01 do próximo dia
    return tomorrow.toISOString();
  }

  /**
   * Processa fila - agenda posts do dia
   */
  async processQueue() {
    const queue = this.readQueue();

    if (!queue.enabled) {
      console.log('⏸️  Fila desabilitada, pulando processamento');
      return { success: false, message: 'Fila desabilitada' };
    }

    const { scheduleHours, pageIds, template, watermark, postsPerDay } = queue.config;

    if (pageIds.length === 0) {
      console.log('⚠️  Nenhuma página configurada');
      return { success: false, message: 'Nenhuma página configurada' };
    }

    // Pegar frases pendentes
    const pendingPhrases = queue.phrases.filter(p => p.status === 'pending');

    if (pendingPhrases.length === 0) {
      console.log('⚠️  Fila vazia - sem frases pendentes');
      return { success: false, message: 'Fila vazia' };
    }

    // Pegar apenas as frases necessárias para hoje
    const phrasesToSchedule = pendingPhrases.slice(0, postsPerDay);
    const scheduledCount = phrasesToSchedule.length;

    console.log(`📅 Agendando ${scheduledCount} posts para hoje...`);

    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < phrasesToSchedule.length; i++) {
      const phrase = phrasesToSchedule[i];
      const hourIndex = i % scheduleHours.length;
      const hour = scheduleHours[hourIndex];

      // Criar data/hora de agendamento
      const scheduleTime = new Date(today);
      scheduleTime.setHours(hour, 0, 0, 0);

      // Extrair texto e autor
      const phraseText = typeof phrase.text === 'string' ? phrase.text : phrase.text?.text || '';
      const parts = phraseText.split('—').map(p => p.trim());
      const text = parts[0];
      const author = parts.length > 1 ? parts[1] : '';

      // Verificar se é Reel ou Imagem (suportar ambos os formatos)
      const isReel = phrase.contentType === 'reel' || phrase.text?.contentType === 'reel';
      
      console.log(`\n📋 Processando frase ${i + 1}:`);
      console.log(`   Texto: ${text}`);
      console.log(`   contentType (raiz): ${phrase.contentType}`);
      console.log(`   contentType (text): ${phrase.text?.contentType}`);
      console.log(`   É Reel? ${isReel ? '✅ SIM' : '❌ NÃO'}`);
      
      let mediaResult;

      try {
        if (isReel) {
          console.log(`🎬 Gerando Reel...`);
          
          // Gerar Reel
          mediaResult = await reelGenerator.generateReel({
            text,
            author,
            duration: 15,
            textPosition: 'center',
            fontSize: 60,
            fontColor: 'white'
          });
        } else {
          console.log(`🎨 Gerando imagem de citação...`);
          
          // Gerar imagem
          let logoUrl = null;
          if (pageIds[0]) {
            const configuredLogo = pageLogoConfigService.getForPage(pageIds[0]);
            if (configuredLogo) {
              logoUrl = `/logos/${configuredLogo}`;
            }
          }

          mediaResult = await contentGenerator.generateQuoteImage({
            text,
            author,
            template,
            logoUrl,
            watermark
          });
        }

        // Agendar para cada página
        const jobIds = [];
        for (const pageId of pageIds) {
          const message = text + (author ? `\n\n— ${author}` : '');
          
          const result = simpleScheduler.schedulePost(
            {
              message,
              imagePath: isReel ? null : mediaResult.path.replace(/^\//, ''),
              videoPath: isReel ? mediaResult.path.replace(/^\//, '') : null,
              targetPageId: pageId,
              isReel
            },
            scheduleTime.toISOString()
          );

          jobIds.push(result.jobId);
        }

        // Atualizar status da frase
        phrase.status = 'scheduled';
        phrase.scheduledAt = scheduleTime.toISOString();
        phrase.jobIds = jobIds;

        results.push({
          phraseId: phrase.id,
          success: true,
          jobIds
        });

        console.log(`✅ ${isReel ? 'Reel' : 'Imagem'} agendado(a) com sucesso!`);
      } catch (error) {
        console.error(`❌ Erro ao processar frase ${i + 1}:`, error.message);
        console.error(`Stack:`, error.stack);
        phrase.status = 'failed';
        results.push({
          phraseId: phrase.id,
          success: false,
          error: error.message
        });
      }
    }

    // Atualizar estatísticas
    queue.stats.totalScheduled += results.filter(r => r.success).length;
    queue.stats.lastRun = new Date().toISOString();

    this.writeQueue(queue);

    console.log(`✅ Processamento concluído: ${results.filter(r => r.success).length}/${scheduledCount} agendados`);

    return {
      success: true,
      scheduled: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Inicia CRON job (roda todo dia às 00:01)
   */
  startCronJob() {
    if (this.cronJob) {
      console.log('⚠️  CRON job já está rodando');
      return;
    }

    // Roda todo dia às 00:01 (horário do servidor)
    this.cronJob = cron.schedule('1 0 * * *', async () => {
      console.log('🤖 CRON: Processando fila automática...');
      try {
        await this.processQueue();
      } catch (error) {
        console.error('❌ Erro no CRON job:', error);
      }
    });

    console.log('✅ CRON job iniciado - roda todo dia às 00:01');
  }

  /**
   * Para CRON job
   */
  stopCronJob() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('⏹️  CRON job parado');
    }
  }

  /**
   * Inicializa serviço (chamado ao iniciar servidor)
   */
  initialize() {
    const queue = this.readQueue();
    if (queue.enabled) {
      this.startCronJob();
      console.log('✅ Fila automática inicializada e ativada');
    } else {
      console.log('ℹ️  Fila automática inicializada (desativada)');
    }
  }
}

export default new ContentQueueService();
