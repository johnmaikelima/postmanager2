import express from 'express';
import videoEditorService from '../services/video/videoEditor.js';
import textToSpeechService from '../services/video/textToSpeech.js';
import videoGeneratorService from '../services/video/videoGenerator.js';
import videoLibraryService from '../services/video/videoLibrary.js';
import videoAutomationService from '../services/video/videoAutomation.js';

const router = express.Router();

/**
 * POST /api/video/generate-audio
 * Gera áudio a partir de texto
 */
router.post('/generate-audio', async (req, res) => {
  try {
    const { text, language = 'pt-BR', voiceName = 'pt-BR-Neural2-C', speakingRate = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Texto é obrigatório'
      });
    }

    console.log('🎤 Gerando áudio via API...');

    const audioResult = await textToSpeechService.generateAudio(text, {
      language,
      voiceName,
      speakingRate
    });

    res.json({
      success: true,
      audio: audioResult
    });
  } catch (error) {
    console.error('Erro ao gerar áudio:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/preview-voice
 * Gera preview de uma voz
 */
router.post('/preview-voice', async (req, res) => {
  try {
    const { language = 'pt-BR', voiceName = 'pt-BR-Neural2-C', speakingRate = 1.0 } = req.body;

    const previewText = 'Este é um preview da voz. Você pode ouvir como ela soa antes de gerar o vídeo completo.';

    console.log('🎤 Gerando preview de voz...');
    console.log('   Voz:', voiceName);
    console.log('   Velocidade:', speakingRate);

    const audioResult = await textToSpeechService.generateAudio(previewText, {
      language,
      voiceName,
      speakingRate
    });

    res.json({
      success: true,
      audio: audioResult
    });
  } catch (error) {
    console.error('Erro ao gerar preview de voz:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/voices
 * Lista vozes disponíveis
 */
router.get('/voices', async (req, res) => {
  try {
    const { language = 'pt-BR' } = req.query;

    const voices = await textToSpeechService.listVoices(language);

    res.json({
      success: true,
      voices
    });
  } catch (error) {
    console.error('Erro ao listar vozes:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/create-project
 * Cria um novo projeto de vídeo
 */
router.post('/create-project', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.name || !projectData.content) {
      return res.status(400).json({
        success: false,
        error: 'Nome e conteúdo são obrigatórios'
      });
    }

    console.log('📁 Criando projeto de vídeo...');

    const result = await videoEditorService.createProject(projectData);

    res.json(result);
  } catch (error) {
    console.error('Erro ao criar projeto:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/projects
 * Lista todos os projetos
 */
router.get('/projects', async (req, res) => {
  try {
    const result = await videoEditorService.listProjects();

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar projetos:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/projects/:projectId
 * Carrega um projeto específico
 */
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await videoEditorService.loadProject(projectId);

    res.json(result);
  } catch (error) {
    console.error('Erro ao carregar projeto:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/video/projects/:projectId
 * Atualiza um projeto
 */
router.put('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;

    const result = await videoEditorService.updateProject(projectId, updates);

    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/video/projects/:projectId
 * Deleta um projeto
 */
router.delete('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await videoEditorService.deleteProject(projectId);

    res.json(result);
  } catch (error) {
    console.error('Erro ao deletar projeto:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/generate
 * Gera vídeo a partir de um projeto
 */
router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId é obrigatório'
      });
    }

    console.log('🎬 Gerando vídeo...');
    console.log('   projectId:', projectId);

    const result = await videoEditorService.generateFromProject(projectId);

    console.log('✅ Vídeo gerado com sucesso!');
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao gerar vídeo:', error.message);
    console.error('Stack completo:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * POST /api/video/generate-direct
 * Gera vídeo diretamente (sem projeto)
 */
router.post('/generate-direct', async (req, res) => {
  try {
    const newsData = req.body;

    if (!newsData.content || !newsData.images || newsData.images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo e imagens são obrigatórios'
      });
    }

    console.log('🎬 Gerando vídeo direto...');

    const result = await videoEditorService.createNewsVideo(newsData);

    res.json({
      success: true,
      video: result.video,
      audio: result.audio,
      duration: result.duration
    });
  } catch (error) {
    console.error('Erro ao gerar vídeo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/info/:filename
 * Obtém informações de um vídeo
 */
router.get('/info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const videoPath = `uploads/videos/${filename}`;

    const info = await videoGeneratorService.getVideoInfo(videoPath);

    res.json({
      success: true,
      info
    });
  } catch (error) {
    console.error('Erro ao obter informações do vídeo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/library
 * Lista todos os vídeos gerados
 */
router.get('/library', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = videoLibraryService.listVideos(limit);

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar vídeos:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video/library/:videoId
 * Obtém informações de um vídeo específico
 */
router.get('/library/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const result = videoLibraryService.getVideo(videoId);

    res.json(result);
  } catch (error) {
    console.error('Erro ao obter vídeo:', error.message);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/video/library/:videoId
 * Deleta um vídeo
 */
router.delete('/library/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const result = videoLibraryService.deleteVideo(videoId);

    res.json(result);
  } catch (error) {
    console.error('Erro ao deletar vídeo:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/automation/scenario
 * Gera roteiro automático
 */
router.post('/automation/scenario', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo é obrigatório'
      });
    }

    const result = videoAutomationService.generateScenario(content);

    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/automation/suggest-images
 * Sugere imagens para as cenas
 */
router.post('/automation/suggest-images', async (req, res) => {
  try {
    const { scenes } = req.body;

    if (!scenes || !Array.isArray(scenes)) {
      return res.status(400).json({
        success: false,
        error: 'Cenas é obrigatório'
      });
    }

    const result = videoAutomationService.suggestImages(scenes);

    res.json(result);
  } catch (error) {
    console.error('Erro ao sugerir imagens:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/automation/search-images
 * Busca imagens para uma query
 */
router.post('/automation/search-images', async (req, res) => {
  try {
    const { query, count = 1 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query é obrigatória'
      });
    }

    const result = await videoAutomationService.searchImages(query, count);

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar imagens:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/video/automation/automate
 * Automatiza todo o processo
 */
router.post('/automation/automate', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo é obrigatório'
      });
    }

    const result = await videoAutomationService.automateVideoCreation(content);

    res.json(result);
  } catch (error) {
    console.error('Erro na automação:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
