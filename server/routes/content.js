import express from 'express';
import contentGenerator from '../services/contentGenerator.js';
import pageLogoConfigService from '../services/pageLogoConfig.js';
import openaiService from '../services/openai.js';
import { schedulePost } from '../services/queue.js';
import contentQueue from '../services/contentQueue.js';
import simpleScheduler from '../services/simpleScheduler.js';

const router = express.Router();

/**
 * POST /api/content/generate-quote
 * Gera imagem com citação/frase
 */
router.post('/generate-quote', async (req, res, next) => {
  try {
    const { text, author, template, pageId, watermark } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Texto é obrigatório'
      });
    }

    // Determinar logo baseado na página selecionada
    let logoUrl = null;
    if (pageId) {
      const configuredLogo = pageLogoConfigService.getForPage(pageId);
      if (configuredLogo) {
        logoUrl = `/logos/${configuredLogo}`;
      }
    }

    const result = await contentGenerator.generateQuoteImage({
      text,
      author: author || '',
      template: template || 'dark',
      logoUrl,
      watermark: watermark || ''
    });

    res.json(result);
  } catch (error) {
    console.error('Error generating quote image:', error);
    next(error);
  }
});

/**
 * POST /api/content/generate-batch
 * Gera múltiplas frases com IA baseado em um script/prompt
 */
router.post('/generate-batch', async (req, res, next) => {
  try {
    const { script, count = 10 } = req.body;

    if (!script || !script.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Script/prompt é obrigatório'
      });
    }

    console.log(`🤖 Gerando ${count} frases com IA...`);
    console.log('📝 Script:', script);

    if (!openaiService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'OpenAI API key não configurada. Adicione OPENAI_API_KEY no arquivo .env'
      });
    }

    const prompt = `Você é um especialista em criar frases inspiradoras e citações para redes sociais.

INSTRUÇÕES:
${script}

Gere EXATAMENTE ${count} frases diferentes seguindo as instruções acima.

REGRAS IMPORTANTES:
1. Cada frase deve ser única e impactante
2. Frases devem ter entre 50 e 150 caracteres
3. Use linguagem clara e direta
4. Evite clichês óbvios
5. Seja criativo e original
6. Se for citação, inclua o autor no formato "Frase — Autor"
7. Se não for citação, apenas a frase

FORMATO DE SAÍDA:
Retorne APENAS um array JSON com as frases, sem explicações adicionais.
Exemplo: ["Frase 1", "Frase 2 — Autor", "Frase 3"]`;

    const completion = await openaiService.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é um assistente que retorna apenas JSON válido, sem markdown ou explicações.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;

    let phrases = [];
    try {
      // Tentar extrair JSON da resposta
      const content = response.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        phrases = JSON.parse(jsonMatch[0]);
      } else {
        phrases = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      // Fallback: dividir por linhas
      phrases = response
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('[') && !line.startsWith(']'))
        .map(line => line.replace(/^[0-9]+\.\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter(line => line.length > 10);
    }

    console.log(`✅ ${phrases.length} frases geradas`);

    res.json({
      success: true,
      phrases,
      count: phrases.length
    });
  } catch (error) {
    console.error('Error generating batch:', error);
    next(error);
  }
});

/**
 * POST /api/content/schedule-batch
 * Agenda múltiplas frases automaticamente com intervalo inteligente
 */
router.post('/schedule-batch', async (req, res, next) => {
  try {
    const {
      phrases,
      template,
      pageIds,
      watermark,
      intervalMinutes = 120,
      startHour = 6,
      endHour = 23
    } = req.body;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de frases é obrigatória'
      });
    }

    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Selecione pelo menos uma página'
      });
    }

    console.log(`📅 Agendando ${phrases.length} posts...`);
    console.log(`⏰ Intervalo: ${intervalMinutes} minutos`);
    console.log(`🕐 Horário: ${startHour}h - ${endHour}h (BRT)`);

    const scheduledPosts = [];
    const now = new Date();
    
    // Converter para horário de Brasília (UTC-3)
    const getBRTDate = (date) => {
      const utcDate = new Date(date.getTime());
      utcDate.setHours(utcDate.getHours() - 3); // Ajustar para BRT
      return utcDate;
    };

    let currentScheduleTime = new Date(now.getTime() + 5 * 60 * 1000); // Começar em 5 minutos

    for (const phrase of phrases) {
      // Extrair texto e autor (se houver)
      const parts = phrase.split('—').map(p => p.trim());
      const text = parts[0];
      const author = parts.length > 1 ? parts[1] : '';

      // Ajustar horário para estar dentro do intervalo permitido (BRT)
      let brtTime = getBRTDate(currentScheduleTime);
      let hour = brtTime.getHours();

      // Se estiver fora do horário permitido, mover para o próximo dia no horário inicial
      if (hour < startHour || hour >= endHour) {
        if (hour >= endHour) {
          // Já passou do horário final, mover para o próximo dia
          currentScheduleTime.setDate(currentScheduleTime.getDate() + 1);
        }
        currentScheduleTime.setHours(startHour + 3, 0, 0, 0); // +3 para compensar BRT
      }

      // Gerar imagem para cada frase
      let logoUrl = null;
      if (pageIds[0]) {
        const configuredLogo = pageLogoConfigService.getForPage(pageIds[0]);
        if (configuredLogo) {
          logoUrl = `/logos/${configuredLogo}`;
        }
      }

      const imageResult = await contentGenerator.generateQuoteImage({
        text,
        author,
        template: template || 'dark',
        logoUrl,
        watermark: watermark || ''
      });

      // Agendar para cada página
      for (const pageId of pageIds) {
        const message = text + (author ? `\n\n— ${author}` : '');
        
        console.log(`📤 Agendando para página ${pageId}...`);
        
        try {
          // Usar simpleScheduler em vez de Redis
          const result = simpleScheduler.schedulePost(
            {
              message,
              imagePath: imageResult.path.replace(/^\//, ''),
              targetPageId: pageId
            },
            currentScheduleTime.toISOString()
          );

          console.log(`✅ Agendado com sucesso - Job ID: ${result.jobId}`);

          scheduledPosts.push({
            phrase: text,
            author,
            pageId,
            scheduledTime: currentScheduleTime.toISOString(),
            jobId: result.jobId,
            imagePath: imageResult.path
          });
        } catch (scheduleError) {
          console.error(`❌ Erro ao agendar para página ${pageId}:`, scheduleError.message);
          throw new Error(`Falha ao agendar post: ${scheduleError.message}`);
        }
      }

      // Incrementar tempo para o próximo post
      currentScheduleTime = new Date(currentScheduleTime.getTime() + intervalMinutes * 60 * 1000);
    }

    console.log(`✅ ${scheduledPosts.length} posts agendados com sucesso`);

    res.json({
      success: true,
      scheduled: scheduledPosts,
      count: scheduledPosts.length
    });
  } catch (error) {
    console.error('❌ Error scheduling batch:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Garantir que sempre retorna JSON válido
    return res.status(500).json({
      success: false,
      error: error.message || error.toString() || 'Erro ao agendar posts em lote',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/content/templates
 * Lista templates disponíveis
 */
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'dark',
      name: 'Escuro',
      description: 'Fundo escuro com texto branco',
      preview: '#1a1a1a'
    },
    {
      id: 'light',
      name: 'Claro',
      description: 'Fundo claro com texto escuro',
      preview: '#f5f5f5'
    },
    {
      id: 'gradient',
      name: 'Gradiente Roxo',
      description: 'Gradiente roxo moderno',
      preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'ocean',
      name: 'Oceano',
      description: 'Gradiente azul oceano',
      preview: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)'
    },
    {
      id: 'sunset',
      name: 'Pôr do Sol',
      description: 'Gradiente laranja e vermelho',
      preview: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)'
    }
  ];

  res.json({
    success: true,
    templates
  });
});

/**
 * GET /api/content/queue/status
 * Obtém status da fila recorrente
 */
router.get('/queue/status', (req, res, next) => {
  try {
    const status = contentQueue.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/queue/add
 * Adiciona frases à fila recorrente
 */
router.post('/queue/add', (req, res) => {
  try {
    const { phrases } = req.body;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de frases é obrigatória'
      });
    }

    const added = contentQueue.addPhrases(phrases);
    res.json({
      success: true,
      added: added.length,
      phrases: added
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
 * DELETE /api/content/queue/phrase/:id
 * Remove frase da fila
 */
router.delete('/queue/phrase/:id', (req, res) => {
  try {
    const { id } = req.params;
    const phraseId = parseInt(id);
    
    console.log(`🗑️ Removendo frase ID: ${phraseId}`);
    
    contentQueue.removePhrase(phraseId);
    
    res.json({
      success: true,
      message: 'Frase removida'
    });
  } catch (error) {
    console.error('Error removing phrase:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao remover frase'
    });
  }
});

/**
 * PUT /api/content/queue/config
 * Atualiza configuração da fila
 */
router.put('/queue/config', (req, res) => {
  try {
    const config = contentQueue.updateConfig(req.body);
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/queue/toggle
 * Liga/desliga fila automática
 */
router.post('/queue/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    const newState = contentQueue.setEnabled(enabled);
    res.json({
      success: true,
      enabled: newState
    });
  } catch (error) {
    console.error('Error toggling queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/content/queue/process
 * Processa fila manualmente (para testes)
 */
router.post('/queue/process', async (req, res) => {
  try {
    console.log('🔄 Iniciando processamento manual da fila...');
    const result = await contentQueue.processQueue();
    console.log('✅ Processamento concluído:', result);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Error processing queue:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar fila'
    });
  }
});

export default router;
