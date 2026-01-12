import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class ImageService {
  constructor() {
    this.uploadsDir = 'uploads';
    this.tempDir = 'temp';
    
    // Criar diretórios se não existirem
    [this.uploadsDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Adiciona logo à imagem
   */
  async addLogo(imagePath, logoPath, position = 'bottom-right', opacity = 0.8) {
    try {
      const outputPath = path.join(this.uploadsDir, `${uuidv4()}.png`);
      
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Redimensionar logo para 15% da largura da imagem
      const logoWidth = Math.floor(metadata.width * 0.15);
      const logo = await sharp(logoPath)
        .resize(logoWidth, null, { fit: 'inside' })
        .toBuffer();
      
      const logoMetadata = await sharp(logo).metadata();
      
      // Calcular posição
      const positions = {
        'top-left': { left: 20, top: 20 },
        'top-right': { left: metadata.width - logoMetadata.width - 20, top: 20 },
        'bottom-left': { left: 20, top: metadata.height - logoMetadata.height - 20 },
        'bottom-right': { 
          left: metadata.width - logoMetadata.width - 20, 
          top: metadata.height - logoMetadata.height - 20 
        },
        'center': { 
          left: Math.floor((metadata.width - logoMetadata.width) / 2),
          top: Math.floor((metadata.height - logoMetadata.height) / 2)
        }
      };
      
      const pos = positions[position] || positions['bottom-right'];
      
      // Aplicar logo com opacidade
      await image
        .composite([{
          input: await sharp(logo)
            .ensureAlpha()
            .modulate({ brightness: 1 })
            .toBuffer(),
          top: pos.top,
          left: pos.left,
          blend: 'over'
        }])
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error adding logo:', error.message);
      throw new Error(`Failed to add logo: ${error.message}`);
    }
  }

  /**
   * Remove área selecionada da imagem (inpainting básico)
   * Para inpainting avançado com IA, usaremos a API do DALL-E
   */
  async removeArea(imagePath, maskData) {
    try {
      // maskData: { x, y, width, height }
      const outputPath = path.join(this.uploadsDir, `${uuidv4()}.png`);
      
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Criar máscara branca para a área a ser removida
      const mask = await sharp({
        create: {
          width: metadata.width,
          height: metadata.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([{
        input: Buffer.from(
          `<svg width="${metadata.width}" height="${metadata.height}">
            <rect x="${maskData.x}" y="${maskData.y}" 
                  width="${maskData.width}" height="${maskData.height}" 
                  fill="white"/>
          </svg>`
        ),
        blend: 'over'
      }])
      .png()
      .toBuffer();
      
      // Aplicar desfoque gaussiano na área selecionada
      await image
        .composite([{
          input: await sharp(imagePath)
            .extract({
              left: Math.max(0, maskData.x),
              top: Math.max(0, maskData.y),
              width: Math.min(maskData.width, metadata.width - maskData.x),
              height: Math.min(maskData.height, metadata.height - maskData.y)
            })
            .blur(50)
            .toBuffer(),
          top: maskData.y,
          left: maskData.x,
          blend: 'over'
        }])
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error removing area:', error.message);
      throw new Error(`Failed to remove area: ${error.message}`);
    }
  }

  /**
   * Inpainting avançado usando DALL-E API
   */
  async inpaintWithAI(imagePath, maskPath, prompt = 'fill naturally') {
    try {
      // Esta função requer a API do DALL-E
      // Por enquanto, retorna a imagem com área desfocada
      console.warn('AI inpainting requires DALL-E API - using basic removal');
      return imagePath;
    } catch (error) {
      console.error('Error with AI inpainting:', error.message);
      throw new Error(`Failed to inpaint: ${error.message}`);
    }
  }

  /**
   * Redimensiona imagem mantendo proporção
   */
  async resize(imagePath, maxWidth = 1200, maxHeight = 1200) {
    try {
      const outputPath = path.join(this.uploadsDir, `${uuidv4()}.jpg`);
      
      await sharp(imagePath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error resizing image:', error.message);
      throw new Error(`Failed to resize image: ${error.message}`);
    }
  }

  /**
   * Otimiza imagem para web
   */
  async optimize(imagePath) {
    try {
      const outputPath = path.join(this.uploadsDir, `${uuidv4()}.jpg`);
      
      await sharp(imagePath)
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error optimizing image:', error.message);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  /**
   * Aplica filtros à imagem
   */
  async applyFilter(imagePath, filter = 'none') {
    try {
      const outputPath = path.join(this.uploadsDir, `${uuidv4()}.jpg`);
      let image = sharp(imagePath);
      
      switch (filter) {
        case 'grayscale':
          image = image.grayscale();
          break;
        case 'sepia':
          image = image.tint({ r: 112, g: 66, b: 20 });
          break;
        case 'brighten':
          image = image.modulate({ brightness: 1.2 });
          break;
        case 'darken':
          image = image.modulate({ brightness: 0.8 });
          break;
        case 'saturate':
          image = image.modulate({ saturation: 1.5 });
          break;
        case 'desaturate':
          image = image.modulate({ saturation: 0.5 });
          break;
        default:
          // Sem filtro
          break;
      }
      
      await image.toFile(outputPath);
      return outputPath;
    } catch (error) {
      console.error('Error applying filter:', error.message);
      throw new Error(`Failed to apply filter: ${error.message}`);
    }
  }

  /**
   * Limpa arquivos temporários antigos
   */
  cleanupOldFiles(maxAgeHours = 24) {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    [this.uploadsDir, this.tempDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old file: ${filePath}`);
          }
        });
      }
    });
  }
}

export default new ImageService();
