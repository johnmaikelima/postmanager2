import express from 'express';
import fs from 'fs';
import path from 'path';
import facebookService from '../services/facebook.js';

const router = express.Router();

/**
 * GET /api/facebook/posts/:pageId
 * Busca posts de uma página específica
 */
router.get('/posts/:pageId', async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const { limit = 25 } = req.query;
    
    const posts = await facebookService.getPagePosts(pageId, parseInt(limit));
    
    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/facebook/posts
 * Busca posts de múltiplas páginas
 */
router.get('/posts', async (req, res, next) => {
  try {
    const pageIds = process.env.SOURCE_PAGE_IDS?.split(',') || [];
    const { limit = 10 } = req.query;
    
    if (pageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No source pages configured. Add SOURCE_PAGE_IDS to .env'
      });
    }
    
    const posts = await facebookService.getMultiplePagesPosts(pageIds, parseInt(limit));
    
    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/facebook/pages
 * Lista todas as páginas que o usuário administra
 */
router.get('/pages', async (req, res, next) => {
  try {
    const pages = await facebookService.getUserPages();
    
    res.json({
      success: true,
      count: pages.length,
      pages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/facebook/page/:pageId
 * Busca informações de uma página
 */
router.get('/page/:pageId', async (req, res, next) => {
  try {
    const { pageId } = req.params;
    const pageInfo = await facebookService.getPageInfo(pageId);
    
    res.json({
      success: true,
      page: pageInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/facebook/publish
 * Publica um post (suporta múltiplas páginas)
 */
router.post('/publish', async (req, res, next) => {
  try {
    const { message, imagePath, videoPath, targetPageIds, isReel } = req.body;
    
    console.log('📤 Requisição de publicação recebida:');
    console.log('   Mensagem:', message?.substring(0, 50) + '...');
    console.log('   Imagem:', imagePath);
    console.log('   Vídeo:', videoPath);
    console.log('   Página:', targetPageIds);
    console.log('   É Reel?', isReel);

    if (!targetPageIds || targetPageIds.length === 0) {
      console.error('❌ Erro: targetPageIds não fornecido');
      return res.status(400).json({
        success: false,
        error: 'Target page IDs are required'
      });
    }

    if (!imagePath && !videoPath) {
      console.error('❌ Erro: Nem imagePath nem videoPath fornecidos');
      return res.status(400).json({
        success: false,
        error: 'Either imagePath or videoPath is required'
      });
    }
    
    const pageIds = Array.isArray(targetPageIds) && targetPageIds.length > 0
      ? targetPageIds
      : [];

    if (pageIds.length === 0) {
      let result;
      if (imagePath) {
        result = await facebookService.publishPhotoPost(message, imagePath, null);
      } else {
        result = await facebookService.publishTextPost(message, null);
      }
      return res.json({ success: true, post: result });
    }

    const results = [];
    for (const pageId of pageIds) {
      try {
        if (isReel && videoPath) {
          console.log('📤 Publicando Reel na página:', pageId);
          console.log('🎬 Vídeo:', videoPath);

          const videoResult = await facebookService.publishVideoPost(
            pageId,
            message,
            videoPath
          );

          console.log('✅ Reel publicado com sucesso:', videoResult);

          results.push({
            pageId,
            postId: videoResult.id,
            success: true
          });
        } else if (imagePath) {
          console.log('📤 Publicando post com foto na página:', pageId);
          console.log('📸 Imagem:', imagePath);

          const photoResult = await facebookService.publishPhotoPost(
            message,
            imagePath,
            pageId
          );

          console.log('✅ Post com foto publicado com sucesso:', photoResult);

          results.push({
            pageId,
            postId: photoResult.id,
            success: true
          });
        } else {
          const post = await facebookService.publishTextPost(message, pageId);
          results.push({ pageId, success: true, post });
        }
      } catch (e) {
        console.error('❌ Erro ao publicar na página', pageId, ':', e.message);
        results.push({ pageId, success: false, error: e.message });
      }
    }

    res.json({
      success: results.every(r => r.success),
      results
    });
  } catch (error) {
    next(error);
  }
});

export default router;
