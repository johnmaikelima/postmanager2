import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoNewsService {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'server/data');
    this.newsFile = path.join(this.dataDir, 'video-news.json');
    this.ensureDataDir();
    this.loadNews();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadNews() {
    if (fs.existsSync(this.newsFile)) {
      try {
        const data = fs.readFileSync(this.newsFile, 'utf8');
        this.news = JSON.parse(data);
      } catch (error) {
        console.error('Erro ao carregar notícias:', error.message);
        this.news = [];
      }
    } else {
      this.news = [];
    }
  }

  saveNews() {
    fs.writeFileSync(this.newsFile, JSON.stringify(this.news, null, 2));
  }

  /**
   * Adiciona uma nova notícia
   */
  addNews(newsData) {
    try {
      const {
        title,
        content,
        image = null,
        source = 'Manual',
        category = 'Geral'
      } = newsData;

      if (!title || !content) {
        throw new Error('Título e conteúdo são obrigatórios');
      }

      const news = {
        id: `news_${Date.now()}`,
        title,
        content,
        image,
        source,
        category,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      this.news.unshift(news);
      this.saveNews();

      console.log('✅ Notícia adicionada:', news.id);

      return {
        success: true,
        news
      };
    } catch (error) {
      console.error('Erro ao adicionar notícia:', error.message);
      throw error;
    }
  }

  /**
   * Lista todas as notícias
   */
  listNews(limit = 50) {
    try {
      return {
        success: true,
        news: this.news.slice(0, limit),
        total: this.news.length
      };
    } catch (error) {
      console.error('Erro ao listar notícias:', error.message);
      throw error;
    }
  }

  /**
   * Obtém uma notícia específica
   */
  getNews(newsId) {
    try {
      const news = this.news.find(n => n.id === newsId);

      if (!news) {
        throw new Error(`Notícia não encontrada: ${newsId}`);
      }

      return {
        success: true,
        news
      };
    } catch (error) {
      console.error('Erro ao obter notícia:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma notícia
   */
  updateNews(newsId, updates) {
    try {
      const index = this.news.findIndex(n => n.id === newsId);

      if (index === -1) {
        throw new Error(`Notícia não encontrada: ${newsId}`);
      }

      this.news[index] = {
        ...this.news[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveNews();

      console.log('✅ Notícia atualizada:', newsId);

      return {
        success: true,
        news: this.news[index]
      };
    } catch (error) {
      console.error('Erro ao atualizar notícia:', error.message);
      throw error;
    }
  }

  /**
   * Deleta uma notícia
   */
  deleteNews(newsId) {
    try {
      const index = this.news.findIndex(n => n.id === newsId);

      if (index === -1) {
        throw new Error(`Notícia não encontrada: ${newsId}`);
      }

      const deleted = this.news.splice(index, 1);
      this.saveNews();

      console.log('✅ Notícia deletada:', newsId);

      return {
        success: true,
        deleted: deleted[0]
      };
    } catch (error) {
      console.error('Erro ao deletar notícia:', error.message);
      throw error;
    }
  }

  /**
   * Busca notícias por termo
   */
  searchNews(searchTerm) {
    try {
      const term = searchTerm.toLowerCase();
      const results = this.news.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term) ||
        n.category.toLowerCase().includes(term)
      );

      return {
        success: true,
        news: results,
        total: results.length
      };
    } catch (error) {
      console.error('Erro ao buscar notícias:', error.message);
      throw error;
    }
  }

  /**
   * Filtra notícias por categoria
   */
  getNewsByCategory(category) {
    try {
      const results = this.news.filter(n => n.category === category);

      return {
        success: true,
        news: results,
        total: results.length
      };
    } catch (error) {
      console.error('Erro ao filtrar notícias:', error.message);
      throw error;
    }
  }
}

export default new VideoNewsService();
