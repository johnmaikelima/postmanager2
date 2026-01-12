import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath.path);

class ReelGenerator {
  constructor() {
    this.videoFolder = path.join(process.cwd(), 'fundovideo');
    this.outputFolder = path.join(process.cwd(), 'uploads', 'reels');
    
    if (!fs.existsSync(this.outputFolder)) {
      fs.mkdirSync(this.outputFolder, { recursive: true });
    }
  }

  /**
   * Lista vídeos disponíveis na pasta fundovideo
   */
  getAvailableVideos() {
    if (!fs.existsSync(this.videoFolder)) {
      console.warn('⚠️  Pasta fundovideo não encontrada');
      return [];
    }

    const files = fs.readdirSync(this.videoFolder);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
    });
  }

  /**
   * Seleciona vídeo aleatório
   */
  getRandomVideo() {
    const videos = this.getAvailableVideos();
    if (videos.length === 0) {
      throw new Error('Nenhum vídeo encontrado na pasta fundovideo');
    }
    const randomIndex = Math.floor(Math.random() * videos.length);
    return path.join(this.videoFolder, videos[randomIndex]);
  }

  /**
   * Quebra texto em linhas com margem de segurança
   */
  wrapText(text, maxCharsPerLine = 25) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      // Se a palavra é muito longa, quebra ela
      if (word.length > maxCharsPerLine) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        // Quebrar palavra longa em pedaços
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          lines.push(word.substring(i, i + maxCharsPerLine));
        }
        continue;
      }

      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Escapa texto para FFmpeg
   */
  escapeText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/,/g, '\\,');
  }

  /**
   * Gera Reel com texto sobre vídeo
   */
  async generateReel(options) {
    const {
      text,
      author = '',
      videoPath = null,
      duration = 15, // segundos
      textPosition = 'center', // top, center, bottom
      fontSize = 60,
      fontColor = 'white',
      backgroundColor = 'black@0.5'
    } = options;

    return new Promise((resolve, reject) => {
      try {
        console.log('🎬 Gerando Reel...');
        console.log('📝 Texto:', text);
        console.log('✍️  Autor:', author);

        // Selecionar vídeo
        const inputVideo = videoPath || this.getRandomVideo();
        console.log('🎥 Vídeo:', path.basename(inputVideo));

        // Nome do arquivo de saída
        const outputFilename = `reel-${Date.now()}.mp4`;
        const outputPath = path.join(this.outputFolder, outputFilename);

        // Quebrar texto em linhas com margem de segurança
        const lines = this.wrapText(text, 22);
        const lineHeight = fontSize * 1.4;

        // Calcular posição Y baseado no textPosition
        let startY;
        const totalHeight = lines.length * lineHeight;
        
        if (textPosition === 'top') {
          startY = 200;
        } else if (textPosition === 'bottom') {
          startY = 1920 - totalHeight - 250; // Assumindo vídeo vertical 1080x1920
        } else { // center
          startY = (1920 - totalHeight) / 2;
        }

        // Usar fonte mais bonita (Segoe UI ou Arial Bold)
        const fontPath = '/Windows/Fonts/segoeuib.ttf'; // Segoe UI Bold

        // Criar filtros de texto para cada linha
        const textFilters = lines.map((line, index) => {
          const escapedLine = this.escapeText(line);
          const y = startY + (index * lineHeight);
          return `drawtext=text='${escapedLine}':fontfile=${fontPath}:fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${y}:box=1:boxcolor=${backgroundColor}:boxborderw=15:borderw=3:bordercolor=black`;
        });

        // Adicionar autor se fornecido
        if (author) {
          const escapedAuthor = this.escapeText(`— ${author}`);
          const authorY = startY + (lines.length * lineHeight) + 80;
          textFilters.push(`drawtext=text='${escapedAuthor}':fontfile=${fontPath}:fontsize=${fontSize * 0.7}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${authorY}:box=1:boxcolor=${backgroundColor}:boxborderw=12:borderw=2:bordercolor=black`);
        }

        // Juntar todos os filtros
        const filterComplex = textFilters.join(',');

        // Processar vídeo com escala para garantir formato vertical
        ffmpeg(inputVideo)
          .outputOptions([
            '-t', duration.toString(), // Duração
            '-vf', `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,${filterComplex}`, // Escala + centraliza + texto
            '-c:v', 'libx264', // Codec de vídeo
            '-preset', 'fast', // Preset de encoding
            '-crf', '23', // Qualidade
            '-c:a', 'aac', // Codec de áudio
            '-b:a', '128k', // Bitrate de áudio
            '-movflags', '+faststart' // Otimização para streaming
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('🔧 FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`⏳ Progresso: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log('✅ Reel gerado:', outputFilename);
            resolve({
              success: true,
              path: `/uploads/reels/${outputFilename}`,
              filename: outputFilename,
              duration
            });
          })
          .on('error', (err) => {
            console.error('❌ Erro ao gerar Reel:', err);
            reject(err);
          })
          .run();

      } catch (error) {
        console.error('❌ Erro ao configurar geração de Reel:', error);
        reject(error);
      }
    });
  }

  /**
   * Obtém informações de um vídeo
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration,
            width: metadata.streams[0].width,
            height: metadata.streams[0].height,
            size: metadata.format.size
          });
        }
      });
    });
  }
}

export default new ReelGenerator();
