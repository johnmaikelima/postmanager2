import express from 'express';
import reelGenerator from '../services/reelGenerator.js';
import contentQueue from '../services/contentQueue.js';

const router = express.Router();

/**
 * GET /api/reels/videos
 * Lista vídeos disponíveis na pasta fundovideo
 */
router.get('/videos', (req, res) => {
  try {
    const videos = reelGenerator.getAvailableVideos();
    res.json({
      success: true,
      videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reels/generate
 * Gera um Reel com texto sobre vídeo
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      text,
      author,
      videoPath,
      duration = 15,
      textPosition = 'center',
      fontSize = 60,
      fontColor = 'white'
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Texto é obrigatório'
      });
    }

    const result = await reelGenerator.generateReel({
      text: text.trim(),
      author: author?.trim() || '',
      videoPath,
      duration,
      textPosition,
      fontSize,
      fontColor
    });

    res.json(result);
  } catch (error) {
    console.error('Error generating reel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reels/generate-batch
 * Gera múltiplos Reels a partir de frases aprovadas
 */
router.post('/generate-batch', async (req, res) => {
  try {
    const {
      phrases,
      duration = 15,
      textPosition = 'center',
      fontSize = 60,
      fontColor = 'white'
    } = req.body;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma frase fornecida'
      });
    }

    console.log(`🎬 Gerando ${phrases.length} Reels...`);

    const results = [];
    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];
      console.log(`\n📝 Processando frase ${i + 1}/${phrases.length}...`);

      try {
        // Extrair texto e autor
        const parts = phrase.text.split('—').map(p => p.trim());
        const text = parts[0];
        const author = parts.length > 1 ? parts[1] : '';

        // Gerar Reel
        const result = await reelGenerator.generateReel({
          text,
          author,
          duration,
          textPosition,
          fontSize,
          fontColor
        });

        results.push({
          phrase: phrase.text,
          success: true,
          ...result
        });

        console.log(`✅ Reel ${i + 1} gerado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao gerar Reel ${i + 1}:`, error);
        results.push({
          phrase: phrase.text,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ ${successCount}/${phrases.length} Reels gerados com sucesso`);

    res.json({
      success: true,
      results,
      total: phrases.length,
      successful: successCount
    });
  } catch (error) {
    console.error('Error generating batch reels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reels/add-to-queue
 * Adiciona frases à fila de Reels
 */
router.post('/add-to-queue', async (req, res) => {
  try {
    const { phrases } = req.body;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma frase fornecida'
      });
    }

    // Adicionar à fila com tipo 'reel'
    const phrasesWithType = phrases.map(p => ({
      ...p,
      contentType: 'reel'
    }));

    const result = await contentQueue.addPhrases(phrasesWithType);

    res.json({
      success: true,
      added: result.length,
      phrases: result
    });
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reels/video-info/:filename
 * Obtém informações de um vídeo específico
 */
router.get('/video-info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const videoPath = reelGenerator.videoFolder + '/' + filename;

    const info = await reelGenerator.getVideoInfo(videoPath);

    res.json({
      success: true,
      info
    });
  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
