import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

class FacebookService {
  constructor() {
    // Não inicializar aqui, inicializar quando for usar
  }
  
  get accessToken() {
    return process.env.FACEBOOK_ACCESS_TOKEN;
  }
  
  get pageId() {
    return process.env.FACEBOOK_PAGE_ID;
  }

  /**
   * Busca posts de uma página específica
   */
  async getPagePosts(pageId, limit = 25) {
    try {
      const response = await axios.get(`${GRAPH_API_URL}/${pageId}/posts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,message,full_picture,created_time,permalink_url,attachments{media,type,url}',
          limit
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching page posts:', error.response?.data || error.message);
      throw new Error(`Failed to fetch posts: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Busca posts de múltiplas páginas
   */
  async getMultiplePagesPosts(pageIds, limit = 10) {
    const allPosts = [];
    
    for (const pageId of pageIds) {
      try {
        const posts = await this.getPagePosts(pageId, limit);
        allPosts.push(...posts.map(post => ({ ...post, sourcePageId: pageId })));
      } catch (error) {
        console.error(`Error fetching posts from page ${pageId}:`, error.message);
      }
    }

    // Ordenar por data
    return allPosts.sort((a, b) => 
      new Date(b.created_time) - new Date(a.created_time)
    );
  }

  /**
   * Lista todas as páginas que o usuário administra
   */
  async getUserPages() {
    try {
      console.log('🔍 Buscando páginas com token:', this.accessToken?.substring(0, 20) + '...');
      
      const response = await axios.get(`${GRAPH_API_URL}/me/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,picture,access_token,fan_count,category'
        }
      });

      console.log(`✅ ${response.data.data.length} páginas encontradas`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching user pages:', error.response?.data || error.message);
      
      if (error.response?.data?.error?.code === 2500) {
        console.error('💡 Dica: O token precisa ser um User Access Token, não App Access Token');
        console.error('💡 Gere em: https://developers.facebook.com/tools/explorer/');
      }
      
      throw new Error(`Failed to fetch pages: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Busca o Page Access Token de uma página específica
   */
  async getPageAccessToken(pageId) {
    try {
      const pages = await this.getUserPages();
      const page = pages.find(p => p.id === pageId);
      
      if (!page) {
        throw new Error(`Page ${pageId} not found or you don't have access to it`);
      }
      
      return page.access_token;
    } catch (error) {
      console.error('Error getting page access token:', error.message);
      throw error;
    }
  }

  /**
   * Publica um post de texto
   */
  async publishTextPost(message, targetPageId = null) {
    const pageId = targetPageId || this.pageId;
    
    try {
      // Buscar o Page Access Token específico
      const pageAccessToken = await this.getPageAccessToken(pageId);
      
      console.log('📤 Publicando post de texto na página:', pageId);
      
      const response = await axios.post(
        `${GRAPH_API_URL}/${pageId}/feed`,
        {
          message,
          access_token: pageAccessToken
        }
      );

      console.log('✅ Post publicado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('❌ Error publishing text post:', error.response?.data || error.message);
      throw new Error(`Failed to publish post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publica um post com imagem
   */
  async publishPhotoPost(message, imagePath, targetPageId = null) {
    const pageId = targetPageId || this.pageId;
    
    try {
      // Buscar o Page Access Token específico
      const pageAccessToken = await this.getPageAccessToken(pageId);
      
      console.log('📤 Publicando post com foto na página:', pageId);
      console.log('📸 Imagem:', imagePath);
      
      // Normalizar caminho da imagem
      let resolvedImagePath = imagePath;
      
      // Remover barra inicial se existir
      if (resolvedImagePath.startsWith('/')) {
        resolvedImagePath = resolvedImagePath.substring(1);
      }
      
      // Remover "app/" duplicado se existir
      if (resolvedImagePath.startsWith('app/')) {
        resolvedImagePath = resolvedImagePath.substring(4);
      }
      
      // Se não for caminho absoluto, adicionar cwd
      if (!resolvedImagePath.startsWith('/')) {
        resolvedImagePath = path.join(process.cwd(), resolvedImagePath);
      }
      
      console.log('📸 Caminho resolvido:', resolvedImagePath);
      
      const formData = new FormData();
      formData.append('message', message);
      formData.append('access_token', pageAccessToken);
      formData.append('source', fs.createReadStream(resolvedImagePath));

      const response = await axios.post(
        `${GRAPH_API_URL}/${pageId}/photos`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      console.log('✅ Post com foto publicado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('❌ Error publishing photo post:', error.response?.data || error.message);
      throw new Error(`Failed to publish photo: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publica vídeo/Reel
   */
  async publishVideoPost(pageId, message, videoPath) {
    try {
      if (!pageId) {
        throw new Error('No page ID specified');
      }

      // Buscar o Page Access Token específico
      const pageAccessToken = await this.getPageAccessToken(pageId);

      console.log('📤 Publicando vídeo na página:', pageId);
      console.log('🎬 Vídeo:', videoPath);
      
      // Normalizar caminho do vídeo
      let resolvedVideoPath = videoPath;
      
      // Remover barra inicial se existir
      if (resolvedVideoPath.startsWith('/')) {
        resolvedVideoPath = resolvedVideoPath.substring(1);
      }
      
      // Remover "app/" duplicado se existir
      if (resolvedVideoPath.startsWith('app/')) {
        resolvedVideoPath = resolvedVideoPath.substring(4);
      }
      
      // Se não for caminho absoluto, adicionar cwd
      if (!resolvedVideoPath.startsWith('/')) {
        resolvedVideoPath = path.join(process.cwd(), resolvedVideoPath);
      }
      
      console.log('🎬 Caminho resolvido:', resolvedVideoPath);
      
      const formData = new FormData();
      formData.append('description', message || '');
      formData.append('access_token', pageAccessToken);
      formData.append('source', fs.createReadStream(resolvedVideoPath));

      const response = await axios.post(
        `${GRAPH_API_URL}/${pageId}/videos`,
        formData,
        {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log('✅ Vídeo publicado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('❌ Error publishing video post:', error.response?.data || error.message);
      throw new Error(`Failed to publish video post: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Busca informações de uma página
   */
  async getPageInfo(pageId) {
    try {
      const response = await axios.get(`${GRAPH_API_URL}/${pageId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,picture,fan_count,category'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching page info:', error.response?.data || error.message);
      throw new Error(`Failed to fetch page info: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Baixa uma imagem de URL
   */
  async downloadImage(imageUrl, outputPath) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      fs.writeFileSync(outputPath, response.data);
      return outputPath;
    } catch (error) {
      console.error('Error downloading image:', error.message);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }
}

export default new FacebookService();
