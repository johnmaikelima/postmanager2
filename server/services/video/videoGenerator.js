import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoGeneratorService {
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
   * Gera vídeo a partir de imagens e áudio
   * @param {object} config - Configuração do vídeo
   * @returns {Promise<{path: string, filename: string, duration: number}>}
   */
  async generateVideo(config) {
    try {
      const {
        images = [],           // Array de {path, duration}
        audioPath,             // Caminho do áudio
        title = 'Vídeo',
        watermark = '@CURIOSONAUTA',
        width = 1920,
        height = 1080,
        fps = 30,
        bitrate = '5000k'
      } = config;

      console.log('🎬 Iniciando geração de vídeo...');
      console.log('   Imagens:', images.length);
      console.log('   Áudio:', audioPath);
      console.log('   Resolução:', `${width}x${height}`);

      if (images.length === 0) {
        throw new Error('Nenhuma imagem fornecida');
      }

      // Normalizar caminho do áudio
      let resolvedAudioPath = audioPath;
      if (resolvedAudioPath.startsWith('/')) {
        resolvedAudioPath = resolvedAudioPath.substring(1);
      }
      if (resolvedAudioPath.startsWith('app/')) {
        resolvedAudioPath = resolvedAudioPath.substring(4);
      }
      if (!resolvedAudioPath.startsWith('/')) {
        resolvedAudioPath = path.join(process.cwd(), resolvedAudioPath);
      }

      console.log('🔊 Áudio original:', audioPath);
      console.log('🔊 Áudio resolvido:', resolvedAudioPath);

      if (!fs.existsSync(resolvedAudioPath)) {
        throw new Error(`Arquivo de áudio não encontrado: ${resolvedAudioPath}`);
      }

      // Validar imagens
      for (const img of images) {
        if (!fs.existsSync(img.path)) {
          throw new Error(`Imagem não encontrada: ${img.path}`);
        }
      }

      // Arquivo de saída
      const outputFilename = `video_${Date.now()}.mp4`;
      const outputPath = path.join(this.videoDir, outputFilename);

      // Calcular duração total das imagens
      const totalImageDuration = images.reduce((sum, img) => sum + (img.duration || 3), 0);
      console.log('⏱️  Duração total das imagens:', totalImageDuration, 'segundos');

      // Se houver apenas uma imagem, usar abordagem simples
      if (images.length === 1) {
        return new Promise((resolve, reject) => {
          const img = images[0];
          const duration = img.duration || 3;

          ffmpeg()
            .input(img.path)
            .inputOptions([`-framerate 1/${duration}`, '-loop 1', `-t ${duration}`])
            .input(resolvedAudioPath)
            .inputOptions([`-t ${duration}`])
            .videoCodec('libx264')
            .audioCodec('aac')
            .size(`${width}x${height}`)
            .fps(fps)
            .outputOptions([
              '-c:v libx264',
              '-preset medium',
              `-b:v ${bitrate}`,
              '-c:a aac',
              '-b:a 128k',
              '-pix_fmt yuv420p',
              '-shortest'
            ])
            .on('start', (cmd) => {
              console.log('🎥 Iniciando FFmpeg');
            })
            .on('progress', (progress) => {
              if (progress.percent) {
                console.log(`📊 Progresso: ${Math.round(progress.percent)}%`);
              }
            })
            .on('end', () => {
              console.log('✅ Vídeo gerado com sucesso!');

              ffmpeg.ffprobe(outputPath, (err, metadata) => {
                if (err) {
                  console.error('Erro ao obter duração:', err.message);
                  resolve({
                    path: `/uploads/videos/${outputFilename}`,
                    filename: outputFilename,
                    duration: Math.round(duration * 1000),
                    size: fs.statSync(outputPath).size
                  });
                } else {
                  const videoDuration = Math.round(metadata.format.duration * 1000);
                  console.log('⏱️  Duração do vídeo gerado:', videoDuration / 1000, 'segundos');
                  resolve({
                    path: `/uploads/videos/${outputFilename}`,
                    filename: outputFilename,
                    duration: videoDuration,
                    size: fs.statSync(outputPath).size
                  });
                }
              });
            })
            .on('error', (err) => {
              console.error('❌ Erro ao gerar vídeo:', err.message);
              reject(new Error(`Failed to generate video: ${err.message}`));
            })
            .save(outputPath);
        });
      }

      // Para múltiplas imagens, usar concat
      const concatFile = path.join(this.videoDir, `concat_${Date.now()}.txt`);
      let concatContent = '';

      for (const img of images) {
        const duration = img.duration || 3;
        concatContent += `file '${img.path}'\nduration ${duration}\n`;
      }

      fs.writeFileSync(concatFile, concatContent);

      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(concatFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .input(resolvedAudioPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(`${width}x${height}`)
          .fps(fps)
          .outputOptions([
            '-c:v libx264',
            '-preset medium',
            `-b:v ${bitrate}`,
            '-c:a aac',
            '-b:a 128k',
            '-pix_fmt yuv420p',
            '-shortest'
          ])
          .on('start', (cmd) => {
            console.log('🎥 Iniciando FFmpeg');
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`📊 Progresso: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log('✅ Vídeo gerado com sucesso!');
            fs.unlinkSync(concatFile);

            ffmpeg.ffprobe(outputPath, (err, metadata) => {
              if (err) {
                console.error('Erro ao obter duração:', err.message);
                resolve({
                  path: `/uploads/videos/${outputFilename}`,
                  filename: outputFilename,
                  duration: Math.round(totalImageDuration * 1000),
                  size: fs.statSync(outputPath).size
                });
              } else {
                const videoDuration = Math.round(metadata.format.duration * 1000);
                console.log('⏱️  Duração do vídeo gerado:', videoDuration / 1000, 'segundos');
                resolve({
                  path: `/uploads/videos/${outputFilename}`,
                  filename: outputFilename,
                  duration: videoDuration,
                  size: fs.statSync(outputPath).size
                });
              }
            });
          })
          .on('error', (err) => {
            console.error('❌ Erro ao gerar vídeo:', err.message);
            if (fs.existsSync(concatFile)) {
              fs.unlinkSync(concatFile);
            }
            reject(new Error(`Failed to generate video: ${err.message}`));
          })
          .save(outputPath);
      });
    } catch (error) {
      console.error('❌ Erro na geração de vídeo:', error.message);
      throw error;
    }
  }

  /**
   * Adiciona efeito de transição entre imagens
   */
  async generateVideoWithTransitions(config) {
    try {
      const {
        images = [],
        audioPath,
        transition = 'fade',
        transitionDuration = 0.5,
        ...otherConfig
      } = config;

      console.log('🎬 Gerando vídeo com transições...');
      console.log('   Transição:', transition);
      console.log('   Duração da transição:', transitionDuration + 's');

      // Por enquanto, usar geração básica
      // Transições avançadas podem ser implementadas depois
      return this.generateVideo(config);
    } catch (error) {
      console.error('Erro ao gerar vídeo com transições:', error.message);
      throw error;
    }
  }

  /**
   * Adiciona overlay de texto no vídeo
   */
  async addTextOverlay(videoPath, text, options = {}) {
    try {
      const {
        fontSize = 48,
        fontColor = 'white',
        position = 'center',
        duration = 5
      } = options;

      console.log('📝 Adicionando texto ao vídeo...');

      const outputFilename = `video_text_${Date.now()}.mp4`;
      const outputPath = path.join(this.videoDir, outputFilename);

      // Calcular posição
      let filterComplex = '';
      switch (position) {
        case 'top':
          filterComplex = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=50`;
          break;
        case 'bottom':
          filterComplex = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=h-100`;
          break;
        case 'center':
        default:
          filterComplex = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=(h-text_h)/2`;
      }

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .videoFilter(filterComplex)
          .output(outputPath)
          .on('end', () => {
            console.log('✅ Texto adicionado ao vídeo!');
            resolve({
              path: `/uploads/videos/${outputFilename}`,
              filename: outputFilename
            });
          })
          .on('error', (err) => {
            reject(new Error(`Failed to add text: ${err.message}`));
          })
          .run();
      });
    } catch (error) {
      console.error('Erro ao adicionar texto:', error.message);
      throw error;
    }
  }

  /**
   * Adiciona marca d'água ao vídeo
   */
  async addWatermark(videoPath, watermarkPath, options = {}) {
    try {
      const {
        position = 'bottom-right',
        opacity = 0.7
      } = options;

      console.log('🏷️  Adicionando marca d\'água...');

      const outputFilename = `video_watermark_${Date.now()}.mp4`;
      const outputPath = path.join(this.videoDir, outputFilename);

      // Calcular posição
      let filterComplex = '';
      switch (position) {
        case 'top-left':
          filterComplex = `overlay=10:10:enable='between(t,0,${options.duration || 10})'`;
          break;
        case 'top-right':
          filterComplex = `overlay=W-w-10:10:enable='between(t,0,${options.duration || 10})'`;
          break;
        case 'bottom-left':
          filterComplex = `overlay=10:H-h-10:enable='between(t,0,${options.duration || 10})'`;
          break;
        case 'bottom-right':
        default:
          filterComplex = `overlay=W-w-10:H-h-10:enable='between(t,0,${options.duration || 10})'`;
      }

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .input(watermarkPath)
          .complexFilter(filterComplex)
          .output(outputPath)
          .on('end', () => {
            console.log('✅ Marca d\'água adicionada!');
            resolve({
              path: `/uploads/videos/${outputFilename}`,
              filename: outputFilename
            });
          })
          .on('error', (err) => {
            reject(new Error(`Failed to add watermark: ${err.message}`));
          })
          .run();
      });
    } catch (error) {
      console.error('Erro ao adicionar marca d\'água:', error.message);
      throw error;
    }
  }

  /**
   * Obtém informações do vídeo
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration,
            bitrate: metadata.format.bit_rate,
            size: metadata.format.size,
            streams: metadata.streams
          });
        }
      });
    });
  }
}

export default new VideoGeneratorService();
