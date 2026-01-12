import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageTemplateService {
  /**
   * Cria uma imagem com degradê e título
   * @param {string} imagePath - Caminho da imagem original
   * @param {string} title - Título para adicionar na imagem
   * @param {object} options - Opções de customização
   */
  async createNewsTemplate(imagePath, title, options = {}) {
    try {
      const {
        width = 1080,
        height = 1350, // Formato 4:5 (Instagram/Facebook Feed)
        imageHeight = 900, // Altura da imagem original (66% do total)
        gradientHeight = 450, // Altura do degradê + texto (33% do total)
        watermark = '@CURIOSONAUTA', // Marca d'água
        pageLogoUrl = null, // URL do logo da página
        pageName = 'PAPEL POP', // Nome da página
        outputPath = null
      } = options;

      console.log('🎨 Criando template de imagem...');
      console.log('📸 Imagem:', imagePath);
      console.log('📝 Título:', title.substring(0, 50) + '...');
      console.log('🏷️  Página:', pageName);
      console.log('🖼️  Logo URL:', pageLogoUrl ? pageLogoUrl : 'Não');
      
      // Converter logo para base64 se for URL local
      let logoBase64 = null;
      if (pageLogoUrl) {
        try {
          let logoPath = pageLogoUrl;
          
          // Se começar com /, é caminho local
          if (pageLogoUrl.startsWith('/')) {
            logoPath = path.join(process.cwd(), pageLogoUrl.replace(/^\//, ''));
          }
          
          // Se for URL local (começa com http://localhost), extrair o caminho
          if (pageLogoUrl.startsWith('http://localhost')) {
            const urlPath = new URL(pageLogoUrl).pathname;
            logoPath = path.join(process.cwd(), urlPath.replace(/^\//, ''));
          }

          // Se for URL http(s) que aponta para um asset local (ex.: domínio + /logos/...)
          if (pageLogoUrl.startsWith('http') && !pageLogoUrl.startsWith('http://localhost')) {
            const urlPath = new URL(pageLogoUrl).pathname;
            if (urlPath?.startsWith('/logos/') || urlPath?.startsWith('/uploads/')) {
              logoPath = path.join(process.cwd(), urlPath.replace(/^\//, ''));
            } else {
              // Caso contrário, considerar que é URL externa (ex.: Facebook) e baixar
              console.log('📥 Baixando logo externo...');
              const axios = (await import('axios')).default;
              const response = await axios.get(pageLogoUrl, { responseType: 'arraybuffer' });
              logoBase64 = `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
              console.log('✅ Logo externo convertido para base64');
            }
          }
          
          // Se for caminho local, ler arquivo
          if (!logoBase64 && fs.existsSync(logoPath)) {
            console.log('📂 Lendo logo local:', logoPath);
            const logoBuffer = fs.readFileSync(logoPath);
            const ext = path.extname(logoPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
            logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
            console.log('✅ Logo local convertido para base64');
          }
        } catch (error) {
          console.error('❌ Erro ao processar logo:', error.message);
        }
      }

      // Resolver caminho da imagem (aceitar relativo ou absoluto)
      let fullImagePath = imagePath;
      
      // Remover barra inicial se existir (para caminhos que começam com /)
      let cleanImagePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      
      // Remover "app/" duplicado se existir (para caminhos que começam com app/)
      if (cleanImagePath.startsWith('app/')) {
        cleanImagePath = cleanImagePath.substring(4);
      }
      
      if (!path.isAbsolute(imagePath)) {
        fullImagePath = path.join(process.cwd(), cleanImagePath);
      }

      console.log('📂 Caminho original:', imagePath);
      console.log('📂 Caminho limpo:', cleanImagePath);
      console.log('📂 Caminho completo:', fullImagePath);

      // Verificar se arquivo existe
      if (!fs.existsSync(fullImagePath)) {
        throw new Error(`Image file not found: ${fullImagePath}`);
      }

      // Carregar imagem original
      const image = sharp(fullImagePath);
      const metadata = await image.metadata();

      // Redimensionar imagem para caber na parte superior
      const resizedImage = await image
        .resize(width, imageHeight, {
          fit: 'cover',
          position: 'top'
        })
        .toBuffer();

      // Criar fundo preto para a parte inferior
      const blackBackground = await sharp({
        create: {
          width: width,
          height: gradientHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
      }).png().toBuffer();

      // Criar SVG com degradê, logo e texto
      const svg = `
        <svg width="${width}" height="${height}">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
              <stop offset="30%" style="stop-color:rgba(0,0,0,0.5);stop-opacity:0.5" />
              <stop offset="100%" style="stop-color:rgba(0,0,0,1);stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- Texto no topo esquerdo da imagem com fundo moderno (50% maior) -->
          <!-- Fundo semi-transparente com bordas arredondadas -->
          <rect x="30" y="30" width="630" height="60" rx="30" fill="rgba(0, 0, 0, 0.75)" />
          <!-- Texto branco por cima -->
          <text 
            x="345" 
            y="68" 
            font-family="Arial, sans-serif" 
            font-size="27" 
            font-weight="600"
            fill="white"
            text-anchor="middle"
          >Quer se manter informado? Siga-nos ⬆️</text>
          
          <!-- Degradê na transição -->
          <rect x="0" y="${imageHeight - 200}" width="${width}" height="200" fill="url(#grad)" />
          
          <!-- Fundo preto sólido embaixo -->
          <rect x="0" y="${imageHeight}" width="${width}" height="${gradientHeight}" fill="rgb(0,0,0)" />
          
          <!-- Logo da página na divisa da imagem com degradê (maior e mais acima) -->
          ${logoBase64 ? `
            <clipPath id="logoClip">
              <circle cx="${width / 2}" cy="${imageHeight - 10}" r="60" />
            </clipPath>
            <image 
              href="${logoBase64}" 
              x="${width / 2 - 60}" 
              y="${imageHeight - 70}" 
              width="120" 
              height="120" 
              clip-path="url(#logoClip)"
            />
            <circle 
              cx="${width / 2}" 
              cy="${imageHeight - 10}" 
              r="60" 
              fill="none" 
              stroke="white" 
              stroke-width="4"
            />
          ` : `
            <circle cx="${width / 2}" cy="${imageHeight - 10}" r="60" fill="#0066FF" />
            <text 
              x="${width / 2}" 
              y="${imageHeight - 20}" 
              font-family="Arial, sans-serif" 
              font-size="20" 
              font-weight="bold"
              fill="white" 
              text-anchor="middle"
            >${this.escapeXml(pageName.split(' ')[0])}</text>
            <text 
              x="${width / 2}" 
              y="${imageHeight + 5}" 
              font-family="Arial, sans-serif" 
              font-size="16" 
              font-weight="bold"
              fill="white" 
              text-anchor="middle"
            >${this.escapeXml(pageName.split(' ')[1] || '')}</text>
          `}
          
          <!-- Título (mais abaixo para dar espaço ao logo) -->
          <text 
            x="${width / 2}" 
            y="${imageHeight + 120}" 
            font-family="Arial, sans-serif" 
            font-size="54" 
            font-weight="bold"
            fill="white"
            text-anchor="middle"
            style="line-height: 1.15;"
          >
            ${this.wrapText(title, 30).map((line, i) => 
              `<tspan x="${width / 2}" dy="${i === 0 ? 0 : 68}">${this.escapeXml(line)}</tspan>`
            ).join('')}
          </text>
        </svg>
      `;

      // Compor imagem final
      const outputFileName = outputPath || path.join(
        __dirname,
        '../../uploads',
        `template_${Date.now()}.jpg`
      );

      // Criar canvas branco do tamanho final
      const canvas = await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
      })
      .composite([
        // Adicionar imagem redimensionada no topo
        {
          input: resizedImage,
          top: 0,
          left: 0
        },
        // Adicionar SVG com degradê e texto
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0
        }
      ])
      .jpeg({ quality: 95 })
      .toFile(outputFileName);

      console.log('✅ Template criado:', outputFileName);

      return {
        success: true,
        path: outputFileName,
        filename: path.basename(outputFileName)
      };

    } catch (error) {
      console.error('❌ Erro ao criar template:', error);
      throw new Error(`Failed to create image template: ${error.message}`);
    }
  }

  /**
   * Quebra texto em linhas de forma inteligente
   */
  wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        // Se a linha atual não está vazia, adiciona ela
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Palavra muito longa, quebra ela
          lines.push(word.substring(0, maxChars));
          currentLine = word.substring(maxChars);
        }
      }
    });

    if (currentLine) lines.push(currentLine);
    
    // Limitar a 4 linhas
    return lines.slice(0, 4);
  }

  /**
   * Escapa caracteres especiais para XML/SVG
   */
  escapeXml(text) {
    if (!text) return '';
    
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
      .trim();
  }
}

export default new ImageTemplateService();
