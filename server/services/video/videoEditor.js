import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import textToSpeechService from './textToSpeech.js';
import videoGeneratorService from './videoGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoEditorService {
  /**
   * Cria um vídeo completo a partir de uma notícia
   */
  async createNewsVideo(newsData, videoConfig = {}) {
    try {
      const {
        title,
        content,
        images = [],
        voiceOptions = {},
        videoOptions = {}
      } = newsData;

      console.log('🎬 Criando vídeo de notícia...');
      console.log('   Título:', title);
      console.log('   Imagens:', images.length);

      if (!content) {
        throw new Error('Conteúdo da notícia é obrigatório');
      }

      if (images.length === 0) {
        throw new Error('Pelo menos uma imagem é obrigatória');
      }

      // 1. Gerar narração
      console.log('🎤 Etapa 1: Gerando narração...');
      let audioResult;
      try {
        audioResult = await textToSpeechService.generateAudio(content, voiceOptions);
        console.log('✅ Narração gerada:', audioResult.filename);
      } catch (audioError) {
        console.error('❌ Erro ao gerar áudio:', audioError.message);
        throw new Error(`Erro ao gerar narração: ${audioError.message}. Verifique se as credenciais do Google Cloud estão configuradas.`);
      }

      // 2. Preparar imagens
      console.log('📸 Etapa 2: Preparando imagens...');
      const preparedImages = this.prepareImages(images, audioResult.duration);
      console.log('✅ Imagens preparadas:', preparedImages.length);

      // 3. Gerar vídeo
      console.log('🎥 Etapa 3: Gerando vídeo...');
      let videoResult;
      try {
        videoResult = await videoGeneratorService.generateVideo({
          images: preparedImages,
          audioPath: audioResult.path,
          title,
          ...videoOptions
        });
        console.log('✅ Vídeo gerado:', videoResult.filename);
      } catch (videoError) {
        console.error('❌ Erro ao gerar vídeo:', videoError.message);
        throw new Error(`Erro ao gerar vídeo: ${videoError.message}`);
      }

      return {
        success: true,
        video: videoResult,
        audio: audioResult,
        images: preparedImages,
        duration: videoResult.duration
      };
    } catch (error) {
      console.error('❌ Erro ao criar vídeo de notícia:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Prepara imagens para o vídeo
   * Faz loop das imagens se necessário para preencher a duração do áudio
   */
  prepareImages(images, audioDurationMs) {
    if (images.length === 0) {
      return [];
    }

    const audioDurationSeconds = audioDurationMs / 1000;
    const preparedImages = [];

    // Calcular duração total das imagens
    let totalImageDuration = 0;
    const baseImages = images.map((img, index) => {
      const duration = img.duration || 3;
      totalImageDuration += duration;
      return {
        path: this.resolvePath(img.path || img),
        duration: duration,
        position: img.position || { x: 0, y: 0 },
        scale: img.scale || 1,
        transition: img.transition || 'fade'
      };
    });

    console.log('📊 Duração do áudio:', audioDurationSeconds, 'segundos');
    console.log('📊 Duração total das imagens:', totalImageDuration, 'segundos');

    // Se a duração das imagens é menor que o áudio, fazer loop
    if (totalImageDuration < audioDurationSeconds) {
      let currentDuration = 0;
      let imageIndex = 0;

      while (currentDuration < audioDurationSeconds) {
        const img = baseImages[imageIndex % baseImages.length];
        preparedImages.push({ ...img });
        currentDuration += img.duration;
        imageIndex++;
      }

      console.log('🔄 Imagens em loop:', preparedImages.length, 'imagens');
    } else {
      // Se a duração é suficiente, usar as imagens como estão
      preparedImages.push(...baseImages);
    }

    return preparedImages;
  }

  /**
   * Resolve caminho da imagem
   */
  resolvePath(imagePath) {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    let cleanPath = imagePath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith('app/')) {
      cleanPath = cleanPath.substring(4);
    }

    if (!cleanPath.startsWith('/')) {
      return path.join(process.cwd(), cleanPath);
    }

    return cleanPath;
  }

  /**
   * Cria um projeto de vídeo (salva configuração)
   */
  async createProject(projectData) {
    try {
      const {
        name,
        newsId,
        title,
        content,
        images = [],
        voiceOptions = {},
        videoOptions = {},
        effects = []
      } = projectData;

      const projectId = `project_${Date.now()}`;
      const projectDir = path.join(process.cwd(), 'uploads/video-projects', projectId);

      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // Salvar configuração do projeto
      const projectConfig = {
        id: projectId,
        name,
        newsId,
        title,
        content,
        images,
        voiceOptions,
        videoOptions,
        effects,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      fs.writeFileSync(
        path.join(projectDir, 'config.json'),
        JSON.stringify(projectConfig, null, 2)
      );

      console.log('✅ Projeto criado:', projectId);

      return {
        success: true,
        projectId,
        config: projectConfig
      };
    } catch (error) {
      console.error('Erro ao criar projeto:', error.message);
      throw error;
    }
  }

  /**
   * Carrega um projeto
   */
  async loadProject(projectId) {
    try {
      const configPath = path.join(
        process.cwd(),
        'uploads/video-projects',
        projectId,
        'config.json'
      );

      if (!fs.existsSync(configPath)) {
        throw new Error(`Projeto não encontrado: ${projectId}`);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return {
        success: true,
        config
      };
    } catch (error) {
      console.error('Erro ao carregar projeto:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza um projeto
   */
  async updateProject(projectId, updates) {
    try {
      const projectDir = path.join(
        process.cwd(),
        'uploads/video-projects',
        projectId
      );
      const configPath = path.join(projectDir, 'config.json');

      if (!fs.existsSync(configPath)) {
        throw new Error(`Projeto não encontrado: ${projectId}`);
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));

      console.log('✅ Projeto atualizado:', projectId);

      return {
        success: true,
        config: updatedConfig
      };
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error.message);
      throw error;
    }
  }

  /**
   * Gera vídeo a partir de um projeto
   */
  async generateFromProject(projectId) {
    try {
      console.log('🎬 Gerando vídeo do projeto:', projectId);

      const projectResult = await this.loadProject(projectId);
      const config = projectResult.config;

      // Gerar vídeo
      const videoResult = await this.createNewsVideo({
        title: config.title,
        content: config.content,
        images: config.images,
        voiceOptions: config.voiceOptions,
        videoOptions: config.videoOptions
      });

      // Atualizar status do projeto
      await this.updateProject(projectId, {
        status: 'completed',
        videoPath: videoResult.video.path,
        videoFilename: videoResult.video.filename
      });

      console.log('✅ Vídeo gerado do projeto!');

      return {
        success: true,
        projectId,
        video: videoResult.video
      };
    } catch (error) {
      console.error('Erro ao gerar vídeo do projeto:', error.message);
      throw error;
    }
  }

  /**
   * Lista todos os projetos
   */
  async listProjects() {
    try {
      const projectsDir = path.join(process.cwd(), 'uploads/video-projects');

      if (!fs.existsSync(projectsDir)) {
        return { success: true, projects: [] };
      }

      const projectIds = fs.readdirSync(projectsDir);
      const projects = [];

      for (const projectId of projectIds) {
        try {
          const result = await this.loadProject(projectId);
          projects.push(result.config);
        } catch (error) {
          console.error(`Erro ao carregar projeto ${projectId}:`, error.message);
        }
      }

      return {
        success: true,
        projects: projects.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      };
    } catch (error) {
      console.error('Erro ao listar projetos:', error.message);
      throw error;
    }
  }

  /**
   * Deleta um projeto
   */
  async deleteProject(projectId) {
    try {
      const projectDir = path.join(
        process.cwd(),
        'uploads/video-projects',
        projectId
      );

      if (!fs.existsSync(projectDir)) {
        throw new Error(`Projeto não encontrado: ${projectId}`);
      }

      // Remover diretório recursivamente
      fs.rmSync(projectDir, { recursive: true, force: true });

      console.log('✅ Projeto deletado:', projectId);

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar projeto:', error.message);
      throw error;
    }
  }
}

export default new VideoEditorService();
