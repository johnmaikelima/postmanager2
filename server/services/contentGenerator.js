import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentGeneratorService {
  /**
   * Gera imagem com citação/frase
   * @param {Object} options
   * @param {string} options.text - Texto principal da citação
   * @param {string} options.author - Autor da citação (opcional)
   * @param {string} options.template - Template a usar (dark, light, gradient)
   * @param {string} options.logoUrl - URL ou caminho do logo (opcional)
   * @param {string} options.watermark - Marca d'água (opcional)
   */
  async generateQuoteImage(options) {
    const {
      text,
      author = '',
      template = 'dark',
      logoUrl = null,
      watermark = ''
    } = options;

    const width = 1080;
    const height = 1080;

    try {
      console.log('🎨 Gerando imagem de citação...');
      console.log('📝 Texto:', text);
      console.log('✍️  Autor:', author);
      console.log('🎭 Template:', template);

      // Processar logo se fornecido
      let logoBase64 = null;
      if (logoUrl) {
        logoBase64 = await this.processLogo(logoUrl);
      }

      // Selecionar template
      const templateConfig = this.getTemplateConfig(template);

      // Criar SVG com o conteúdo
      const svg = this.createQuoteSVG({
        width,
        height,
        text,
        author,
        templateConfig,
        logoBase64,
        watermark
      });

      // Gerar imagem
      const outputDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `quote-${Date.now()}.png`;
      const outputPath = path.join(outputDir, filename);

      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log('✅ Imagem gerada:', filename);

      return {
        success: true,
        filename,
        path: `/uploads/${filename}`,
        fullPath: outputPath
      };
    } catch (error) {
      console.error('❌ Erro ao gerar imagem:', error);
      throw error;
    }
  }

  /**
   * Processa logo (local ou URL externa)
   */
  async processLogo(logoUrl) {
    try {
      let logoPath = logoUrl;

      // Se começar com /, é caminho local
      if (logoUrl.startsWith('/')) {
        logoPath = path.join(process.cwd(), logoUrl.replace(/^\//, ''));
      }

      // Se for URL localhost
      if (logoUrl.startsWith('http://localhost')) {
        const urlPath = new URL(logoUrl).pathname;
        logoPath = path.join(process.cwd(), urlPath.replace(/^\//, ''));
      }

      // Se for URL externa
      if (logoUrl.startsWith('http') && !logoUrl.startsWith('http://localhost')) {
        const urlPath = new URL(logoUrl).pathname;
        if (urlPath?.startsWith('/logos/') || urlPath?.startsWith('/uploads/')) {
          logoPath = path.join(process.cwd(), urlPath.replace(/^\//, ''));
        } else {
          // Baixar logo externo
          const axios = (await import('axios')).default;
          const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
          return `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
        }
      }

      // Ler arquivo local
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const ext = path.extname(logoPath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
        return `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao processar logo:', error.message);
      return null;
    }
  }

  /**
   * Retorna configuração do template
   */
  getTemplateConfig(template) {
    const templates = {
      dark: {
        background: '#1a1a1a',
        textColor: '#ffffff',
        authorColor: '#cccccc',
        quoteColor: '#ffd700',
        overlay: 'rgba(0, 0, 0, 0.6)'
      },
      light: {
        background: '#f5f5f5',
        textColor: '#2c3e50',
        authorColor: '#7f8c8d',
        quoteColor: '#3498db',
        overlay: 'rgba(255, 255, 255, 0.8)'
      },
      gradient: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#ffffff',
        authorColor: '#e0e0e0',
        quoteColor: '#ffd700',
        overlay: 'rgba(0, 0, 0, 0.3)'
      },
      ocean: {
        background: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
        textColor: '#ffffff',
        authorColor: '#e0f7ff',
        quoteColor: '#ffd700',
        overlay: 'rgba(0, 0, 0, 0.2)'
      },
      sunset: {
        background: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)',
        textColor: '#ffffff',
        authorColor: '#ffe0cc',
        quoteColor: '#fff',
        overlay: 'rgba(0, 0, 0, 0.2)'
      }
    };

    return templates[template] || templates.dark;
  }

  /**
   * Cria SVG com a citação
   */
  createQuoteSVG({ width, height, text, author, templateConfig, logoBase64, watermark }) {
    const { background, textColor, authorColor, quoteColor } = templateConfig;

    // Calcular tamanho da fonte baseado no comprimento do texto
    let fontSize = 48;
    let maxCharsPerLine = 35;
    
    if (text.length > 100) {
      fontSize = 42;
      maxCharsPerLine = 40;
    }
    if (text.length > 150) {
      fontSize = 38;
      maxCharsPerLine = 45;
    }
    if (text.length > 200) {
      fontSize = 34;
      maxCharsPerLine = 50;
    }

    // Quebrar texto em linhas
    const lines = this.wrapText(text, maxCharsPerLine);
    const lineHeight = fontSize * 1.5;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (height - totalTextHeight) / 2 - 50;

    // Criar linhas de texto com fonte ajustada
    const textLines = lines.map((line, i) => {
      const y = startY + (i * lineHeight);
      return `<text x="50%" y="${y}" text-anchor="middle" fill="${textColor}" font-size="${fontSize}" font-weight="600" font-family="Arial, sans-serif">${this.escapeXml(line)}</text>`;
    }).join('\n');

    // Autor
    const authorY = startY + totalTextHeight + 80;
    const authorText = author ? `<text x="50%" y="${authorY}" text-anchor="middle" fill="${authorColor}" font-size="32" font-style="italic" font-family="Arial, sans-serif">${this.escapeXml(author)}</text>` : '';

    // Logo no canto inferior direito
    const logoSize = 120;
    const logoX = width - logoSize - 40;
    const logoY = height - logoSize - 40;
    const logoImage = logoBase64 ? `<image href="${logoBase64}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>` : '';

    // Marca d'água
    const watermarkText = watermark ? `<text x="50%" y="${height - 30}" text-anchor="middle" fill="${authorColor}" font-size="24" opacity="0.7" font-family="Arial, sans-serif">${this.escapeXml(watermark)}</text>` : '';

    // Texto no topo esquerdo com fundo moderno (50% maior)
    const topLeftText = `
      <!-- Fundo semi-transparente com bordas arredondadas -->
      <rect x="30" y="30" width="630" height="60" rx="30" fill="rgba(0, 0, 0, 0.75)" />
      <!-- Texto branco por cima -->
      <text x="345" y="68" text-anchor="middle" fill="white" font-size="27" font-weight="600" font-family="Arial, sans-serif">Quer se manter informado? Siga-nos ⬆️</text>
    `;

    // Aspas decorativas
    const quoteMarkSize = 120;
    const quoteMarkY = startY - 150;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${background.startsWith('linear-gradient') ? this.createGradientDef(background) : ''}
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="${background.startsWith('linear-gradient') ? 'url(#bgGradient)' : background}"/>
        
        <!-- Texto no topo esquerdo -->
        ${topLeftText}
        
        <!-- Aspas decorativas -->
        <text x="50%" y="${quoteMarkY}" text-anchor="middle" fill="${quoteColor}" font-size="${quoteMarkSize}" font-weight="bold" font-family="Georgia, serif" opacity="0.8">"</text>
        
        <!-- Texto principal -->
        ${textLines}
        
        <!-- Autor -->
        ${authorText}
        
        <!-- Logo -->
        ${logoImage}
        
        <!-- Marca d'água -->
        ${watermarkText}
      </svg>
    `;

    return svg;
  }

  /**
   * Cria definição de gradiente para SVG
   */
  createGradientDef(gradientString) {
    // Extrair cores do gradiente CSS
    const match = gradientString.match(/#[0-9A-Fa-f]{6}/g);
    if (!match || match.length < 2) {
      return '<linearGradient id="bgGradient"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient>';
    }

    return `
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${match[0]}"/>
        <stop offset="100%" stop-color="${match[1]}"/>
      </linearGradient>
    `;
  }

  /**
   * Quebra texto em linhas com limite de caracteres mais seguro
   */
  wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    // Reduzir maxChars para ter margem de segurança
    const safeMaxChars = Math.floor(maxChars * 0.85);

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      // Se a palavra sozinha é maior que o limite, forçar quebra
      if (word.length > safeMaxChars) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        // Quebrar palavra grande em pedaços
        for (let i = 0; i < word.length; i += safeMaxChars) {
          lines.push(word.substring(i, i + safeMaxChars));
        }
      } else if (testLine.length <= safeMaxChars) {
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
   * Escapa caracteres especiais XML
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export default new ContentGeneratorService();
