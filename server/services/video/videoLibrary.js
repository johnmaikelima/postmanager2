import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoLibraryService {
  constructor() {
    this.videoDir = path.join(process.cwd(), 'uploads/videos');
    this.ensureVideoDir();
  }

  ensureVideoDir() {
    if (!fs.existsSync(this.videoDir)) {
      fs.mkdirSync(this.videoDir, { recursive: true });
    }
  }

  /**
   * Lista todos os vídeos gerados
   */
  listVideos(limit = 50) {
    try {
      const files = fs.readdirSync(this.videoDir);
      const videos = [];

      for (const file of files) {
        if (file.endsWith('.mp4')) {
          const filePath = path.join(this.videoDir, file);
          const stats = fs.statSync(filePath);
          
          videos.push({
            id: file.replace('.mp4', ''),
            filename: file,
            path: `/uploads/videos/${file}`,
            size: stats.size,
            sizeFormatted: this.formatFileSize(stats.size),
            createdAt: stats.birthtime,
            createdAtFormatted: stats.birthtime.toLocaleString('pt-BR'),
            modifiedAt: stats.mtime,
            modifiedAtFormatted: stats.mtime.toLocaleString('pt-BR')
          });
        }
      }

      // Ordenar por data de criação (mais recentes primeiro)
      videos.sort((a, b) => b.createdAt - a.createdAt);

      return {
        success: true,
        videos: videos.slice(0, limit),
        total: videos.length
      };
    } catch (error) {
      console.error('Erro ao listar vídeos:', error.message);
      throw error;
    }
  }

  /**
   * Obtém informações de um vídeo específico
   */
  getVideo(videoId) {
    try {
      const filename = `${videoId}.mp4`;
      const filePath = path.join(this.videoDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Vídeo não encontrado: ${videoId}`);
      }

      const stats = fs.statSync(filePath);

      return {
        success: true,
        video: {
          id: videoId,
          filename: filename,
          path: `/uploads/videos/${filename}`,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
          createdAt: stats.birthtime,
          createdAtFormatted: stats.birthtime.toLocaleString('pt-BR'),
          modifiedAt: stats.mtime,
          modifiedAtFormatted: stats.mtime.toLocaleString('pt-BR')
        }
      };
    } catch (error) {
      console.error('Erro ao obter vídeo:', error.message);
      throw error;
    }
  }

  /**
   * Deleta um vídeo
   */
  deleteVideo(videoId) {
    try {
      const filename = `${videoId}.mp4`;
      const filePath = path.join(this.videoDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Vídeo não encontrado: ${videoId}`);
      }

      fs.unlinkSync(filePath);

      console.log('✅ Vídeo deletado:', videoId);

      return {
        success: true,
        message: 'Vídeo deletado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error.message);
      throw error;
    }
  }

  /**
   * Formata tamanho de arquivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new VideoLibraryService();
