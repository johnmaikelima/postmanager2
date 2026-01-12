import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ScraperService {
  /**
   * Extrai texto recursivamente de dados JSON do Facebook
   */
  extractTextFromFacebookData(data, depth = 0) {
    if (depth > 10) return ''; // Evita recursão infinita
    
    if (typeof data === 'string') {
      // Filtrar IDs, tokens e códigos do Facebook
      const isValidText = 
        data.length > 100 && 
        !data.startsWith('http') && 
        !data.includes('{') && 
        !data.includes('[') &&
        !data.match(/^[A-Za-z0-9_-]{50,}$/) && // Não é um token/ID
        data.includes(' ') && // Tem espaços (texto real)
        !data.startsWith('Aa') && // Não começa com padrão de ID do FB
        !/^[A-Z][a-z0-9_-]{100,}$/.test(data); // Não é código base64-like
      
      if (isValidText) {
        return data;
      }
      return '';
    }
    
    if (Array.isArray(data)) {
      for (const item of data) {
        const text = this.extractTextFromFacebookData(item, depth + 1);
        if (text && text.length > 100) return text;
      }
      return '';
    }
    
    if (typeof data === 'object' && data !== null) {
      // Procurar por campos que geralmente contêm o texto
      if (data.message && typeof data.message === 'string' && data.message.length > 100) {
        return data.message;
      }
      if (data.text && typeof data.text === 'string' && data.text.length > 100) {
        return data.text;
      }
      if (data.body && typeof data.body === 'string' && data.body.length > 100) {
        return data.body;
      }
      
      // Procurar recursivamente
      for (const key in data) {
        if (key === 'message' || key === 'text' || key === 'body' || key === 'content') {
          const text = this.extractTextFromFacebookData(data[key], depth + 1);
          if (text && text.length > 100) return text;
        }
      }
      
      // Se não encontrou, procurar em todos os campos
      for (const key in data) {
        const text = this.extractTextFromFacebookData(data[key], depth + 1);
        if (text && text.length > 100) return text;
      }
    }
    
    return '';
  }

  /**
   * Tenta extrair ID do post da URL
   */
  extractPostIdFromUrl(url) {
    // Tentar diferentes formatos de URL
    const patterns = [
      /fbid=(\d+)/,                              // photo?fbid=123
      /posts\/(\d+)/,                            // /posts/123
      /permalink\.php\?story_fbid=(\d+)/,        // permalink.php?story_fbid=123
      /photo\.php\?fbid=(\d+)/,                  // photo.php?fbid=123
      /\/(\d+)$/                                 // /123
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        console.log(`✅ ID extraído: ${match[1]}`);
        return match[1];
      }
    }
    
    console.log('⚠️  Não foi possível extrair ID da URL');
    return null;
  }

  /**
   * Tenta buscar post via Graph API (se token estiver disponível)
   */
  async tryGraphAPI(postId) {
    const token = process.env.FACEBOOK_ACCESS_TOKEN;
    if (!token || !postId) return null;

    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${postId}`, {
        params: {
          access_token: token,
          fields: 'message,full_picture,created_time'
        }
      });

      return response.data;
    } catch (error) {
      console.log('⚠️  Graph API não disponível, usando scraping...');
      return null;
    }
  }

  /**
   * Extrai informações de uma notícia ou post pelo link
   */
  async extractPostFromUrl(postUrl) {
    try {
      console.log('🔍 Extraindo conteúdo de:', postUrl);
      
      // Detectar se é Facebook ou site de notícias
      const isFacebook = postUrl.includes('facebook.com') || postUrl.includes('fb.com');
      
      if (isFacebook) {
        console.log('📘 Detectado: Facebook');
        // Tentar Graph API para Facebook
        const postId = this.extractPostIdFromUrl(postUrl);
        if (postId) {
          console.log('📱 Tentando Graph API com ID:', postId);
          const apiData = await this.tryGraphAPI(postId);
          
          if (apiData && apiData.message) {
            console.log('✅ Dados obtidos via Graph API!');
            
            let imagePath = null;
            if (apiData.full_picture) {
              imagePath = await this.downloadImage(apiData.full_picture);
            }
            
            return {
              success: true,
              text: apiData.message,
              imageUrl: apiData.full_picture,
              imagePath,
              sourceUrl: postUrl
            };
          }
        }
      } else {
        console.log('📰 Detectado: Site de notícias');
      }

      // Fazer scraping HTML (funciona para Facebook e sites de notícias)
      console.log('🌐 Usando scraping HTML...');
      
      // Fazer requisição para obter o HTML
      const response = await axios.get(postUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 10000
      });

      console.log('✅ Página carregada, tamanho:', response.data.length, 'bytes');

      const html = response.data;
      const $ = cheerio.load(html);

      // Extrair texto da notícia
      let text = '';
      
      // 1. Tentar meta tags (título + descrição)
      const title = $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('title').text() || '';
      
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content') || '';
      
      console.log('📰 Título:', title.substring(0, 80));
      console.log('📝 Descrição:', description.substring(0, 100));
      
      // 2. Tentar extrair conteúdo do artigo
      let articleContent = '';
      
      // Seletores comuns para conteúdo de notícias
      const articleSelectors = [
        'article',
        '[itemprop="articleBody"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content-text',
        'main article',
        '.story-body'
      ];
      
      for (const selector of articleSelectors) {
        const article = $(selector).first();
        if (article.length) {
          // Pegar todos os parágrafos
          const paragraphs = article.find('p').map((i, el) => $(el).text().trim()).get();
          articleContent = paragraphs.join('\n\n');
          
          if (articleContent.length > 200) {
            console.log('✅ Conteúdo do artigo encontrado!');
            break;
          }
        }
      }
      
      // Montar texto final formatado para Facebook
      if (articleContent) {
        // Pegar todos os parágrafos (sem limite)
        const paragraphs = articleContent.split('\n\n').filter(p => p.trim().length > 0);
        const fullContent = paragraphs.join('\n\n');
        
        // Formato otimizado para Facebook
        text = title ? `📰 ${title}\n\n${fullContent}` : fullContent;
      } else if (description) {
        // Se não tem conteúdo, usar título + descrição
        text = title ? `📰 ${title}\n\n${description}` : description;
      } else {
        // Último recurso: só o título
        text = title ? `📰 ${title}` : title;
      }

      // Extrair imagem (og:image)
      let imageUrl = $('meta[property="og:image"]').attr('content') || 
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('meta[itemprop="image"]').attr('content') ||
                     null;
      
      // Se não encontrou, tentar primeira imagem do artigo
      if (!imageUrl) {
        const firstImg = $('article img').first().attr('src') ||
                        $('.article-content img').first().attr('src') ||
                        $('.post-content img').first().attr('src');
        
        if (firstImg && firstImg.startsWith('http')) {
          imageUrl = firstImg;
        }
      }
      
      // Limpar e formatar o texto
      if (text) {
        text = text
          .replace(/\s+/g, ' ') // Múltiplos espaços → 1 espaço
          .replace(/\n /g, '\n') // Remove espaços após quebra de linha
          .replace(/ \n/g, '\n') // Remove espaços antes de quebra de linha
          .replace(/\n{3,}/g, '\n\n') // Múltiplas quebras → 2 quebras
          .trim();
      }

      console.log('📝 Texto extraído:', text ? `${text.length} caracteres - ${text.substring(0, 100)}...` : 'Nenhum');
      console.log('🖼️  Imagem encontrada:', imageUrl ? 'Sim' : 'Não');
      
      // Se não conseguiu extrair texto adequado, avisar
      if (!text || text.length < 100) {
        console.log('⚠️  Não foi possível extrair texto automaticamente.');
        console.log('💡 Sugestão: Copie o texto manualmente e cole no editor.');
      }

      // Baixar imagem se encontrou
      let imagePath = null;
      if (imageUrl) {
        console.log('⬇️  Baixando imagem...');
        imagePath = await this.downloadImage(imageUrl);
      }

      const result = {
        success: text && text.length > 50, // Só considera sucesso se tiver texto válido
        text: text || '',
        title: title || '', // Adicionar título original
        imageUrl,
        imagePath,
        sourceUrl: postUrl,
        message: !text || text.length < 50 ? 
          'Não foi possível extrair o texto automaticamente. Por favor, copie o texto manualmente do Facebook e cole no editor.' : 
          undefined
      };

      console.log('✅ Extração concluída:', {
        temTexto: !!text,
        temImagem: !!imagePath
      });

      return result;

    } catch (error) {
      console.error('Erro ao extrair post:', error.message);
      
      // Se falhar, retornar estrutura básica para o usuário colar manualmente
      return {
        success: false,
        error: error.message,
        text: '',
        imageUrl: null,
        imagePath: null,
        sourceUrl: postUrl,
        message: 'Não foi possível extrair automaticamente. Por favor, copie o texto e imagem manualmente.'
      };
    }
  }

  /**
   * Baixa uma imagem de uma URL
   */
  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      // Criar diretório se não existir
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Gerar nome único
      const timestamp = Date.now();
      const extension = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg';
      const filename = `scraped_${timestamp}.${extension}`;
      const filepath = path.join(uploadsDir, filename);

      // Salvar imagem
      fs.writeFileSync(filepath, response.data);

      console.log('✅ Imagem baixada:', filename);
      return `/uploads/${filename}`;

    } catch (error) {
      console.error('Erro ao baixar imagem:', error.message);
      return null;
    }
  }

  /**
   * Extrai múltiplos posts de uma página do Facebook
   */
  async extractPostsFromPage(pageUrl, limit = 5) {
    try {
      console.log('🔍 Extraindo posts da página:', pageUrl);

      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const posts = [];
      
      // Tentar encontrar links de posts
      $('a[href*="/posts/"], a[href*="/photos/"]').slice(0, limit).each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('facebook.com')) {
          posts.push({
            url: href.startsWith('http') ? href : `https://facebook.com${href}`,
            preview: $(elem).text().trim().substring(0, 100)
          });
        }
      });

      return {
        success: true,
        posts,
        count: posts.length
      };

    } catch (error) {
      console.error('Erro ao extrair posts da página:', error.message);
      return {
        success: false,
        error: error.message,
        posts: []
      };
    }
  }
}

export default new ScraperService();
