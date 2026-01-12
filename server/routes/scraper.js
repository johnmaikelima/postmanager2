import express from 'express';
import scraperService from '../services/scraper.js';

const router = express.Router();

/**
 * POST /api/scraper/extract
 * Extrai informações de um post do Facebook pelo link
 */
router.post('/extract', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Validar se é uma URL válida
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid URL (must start with http:// or https://)'
      });
    }

    const result = await scraperService.extractPostFromUrl(url);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/scraper/extract-page
 * Extrai múltiplos posts de uma página do Facebook
 */
router.post('/extract-page', async (req, res, next) => {
  try {
    const { url, limit = 5 } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const result = await scraperService.extractPostsFromPage(url, parseInt(limit));
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
