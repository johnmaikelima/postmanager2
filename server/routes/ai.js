import express from 'express';
import openaiService from '../services/openai.js';

const router = express.Router();

/**
 * POST /api/ai/rewrite
 * Reescreve um texto usando IA
 */
router.post('/rewrite', async (req, res, next) => {
  try {
    const { text, tone = 'professional', instructions = '' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    console.log('🤖 Reescrevendo texto com IA...');
    console.log('📝 Tamanho do texto:', text.length, 'caracteres');
    console.log('🎨 Tom:', tone);
    
    const rewrittenText = await openaiService.rewriteText(text, tone, instructions);
    
    res.json({
      success: true,
      original: text,
      rewritten: rewrittenText
    });
  } catch (error) {
    console.error('❌ Erro ao reescrever texto:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao reescrever texto'
    });
  }
});

/**
 * POST /api/ai/variations
 * Gera múltiplas variações de um texto
 */
router.post('/variations', async (req, res, next) => {
  try {
    const { text, count = 3 } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const variations = await openaiService.generateVariations(text, parseInt(count));
    
    res.json({
      success: true,
      original: text,
      variations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/hashtags
 * Gera hashtags relevantes
 */
router.post('/hashtags', async (req, res, next) => {
  try {
    const { text, count = 5 } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const hashtags = await openaiService.generateHashtags(text, parseInt(count));
    
    res.json({
      success: true,
      hashtags
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/analyze
 * Analisa texto e fornece sugestões
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const analysis = await openaiService.analyzeAndSuggest(text);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
});

export default router;
