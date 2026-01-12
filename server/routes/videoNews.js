import express from 'express';
import videoNewsService from '../services/video/videoNewsService.js';
import scraperService from '../services/scraper.js';

const router = express.Router();

/**
 * GET /api/video-news
 * Lista todas as notícias do gerador de vídeos
 */
router.get('/', (req, res) => {
  try {
    const { limit = 50, search, category } = req.query;

    let result;

    if (search) {
      result = videoNewsService.searchNews(search);
    } else if (category) {
      result = videoNewsService.getNewsByCategory(category);
    } else {
      result = videoNewsService.listNews(parseInt(limit));
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar notícias:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video-news/:newsId
 * Obtém uma notícia específica
 */
router.get('/:newsId', (req, res) => {
  try {
    const { newsId } = req.params;
    const result = videoNewsService.getNews(newsId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter notícia:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video-news
 * Adiciona uma nova notícia
 */
router.post('/', (req, res) => {
  try {
    const { title, content, image, source, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Título e conteúdo são obrigatórios'
      });
    }

    const result = videoNewsService.addNews({
      title,
      content,
      image,
      source: source || 'Manual',
      category: category || 'Geral'
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao adicionar notícia:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/video-news/:newsId
 * Atualiza uma notícia
 */
router.put('/:newsId', (req, res) => {
  try {
    const { newsId } = req.params;
    const updates = req.body;

    const result = videoNewsService.updateNews(newsId, updates);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/video-news/:newsId
 * Deleta uma notícia
 */
router.delete('/:newsId', (req, res) => {
  try {
    const { newsId } = req.params;
    const result = videoNewsService.deleteNews(newsId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao deletar notícia:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video-news/from-url
 * Faz scraping de uma URL e cria uma notícia
 */
router.post('/from-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL é obrigatória'
      });
    }

    console.log('🌐 Fazendo scraping de URL:', url);

    // Usar o scraper existente
    const scraped = await scraperService.extractPostFromUrl(url);

    if (!scraped || !scraped.success) {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível extrair informações da URL'
      });
    }

    // Criar notícia com os dados extraídos
    const newsData = {
      title: scraped.text ? scraped.text.split('\n')[0] : 'Sem título',
      content: scraped.text || 'Conteúdo não disponível',
      image: scraped.imageUrl,
      source: scraped.sourceUrl ? new URL(scraped.sourceUrl).hostname : 'URL',
      category: 'Geral'
    };

    const result = videoNewsService.addNews(newsData);

    res.status(201).json({
      success: true,
      news: result.news,
      message: '✅ Notícia criada a partir da URL'
    });
  } catch (error) {
    console.error('Erro ao fazer scraping de URL:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
