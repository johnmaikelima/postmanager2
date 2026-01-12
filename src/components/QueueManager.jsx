import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Settings, RefreshCw, Calendar, CheckCircle, Clock, AlertCircle, Eye, Send, Image, Video } from 'lucide-react';

function QueueManager() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [configMode, setConfigMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, scheduled, published, failed
  const [config, setConfig] = useState({
    scheduleHours: [8, 12, 18, 21],
    pageIds: [],
    template: 'dark',
    watermark: '',
    postsPerDay: 4
  });
  const [userPages, setUserPages] = useState([]);

  useEffect(() => {
    loadStatus();
    loadUserPages();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/content/queue/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data);
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Error loading status:', err);
    }
  };

  const loadUserPages = async () => {
    try {
      const response = await fetch('/api/facebook/pages');
      const data = await response.json();
      if (data.success) {
        setUserPages(data.pages);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    }
  };

  const toggleQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/queue/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !status.enabled })
      });
      const data = await response.json();
      if (data.success) {
        await loadStatus();
        alert(data.enabled ? '✅ Fila automática ATIVADA!' : '⏸️ Fila automática PAUSADA');
      }
    } catch (err) {
      console.error('Error toggling queue:', err);
      alert('Erro ao alterar estado da fila');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/queue/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (data.success) {
        await loadStatus();
        setConfigMode(false);
        alert('✅ Configuração salva!');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const removePhrase = async (phraseId) => {
    if (!confirm('Remover esta frase da fila?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/content/queue/phrase/${phraseId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadStatus();
      }
    } catch (err) {
      console.error('Error removing phrase:', err);
      alert('Erro ao remover frase');
    } finally {
      setLoading(false);
    }
  };

  const processNow = async () => {
    if (!confirm('Processar fila agora? Isso agendará os posts do dia.')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/content/queue/process', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await loadStatus();
        alert(`✅ ${data.scheduled} posts agendados com sucesso!`);
      } else {
        alert(data.message || 'Erro ao processar fila');
      }
    } catch (err) {
      console.error('Error processing queue:', err);
      alert('Erro ao processar fila');
    } finally {
      setLoading(false);
    }
  };

  const togglePageSelection = (pageId) => {
    setConfig(prev => {
      const pageIds = new Set(prev.pageIds);
      if (pageIds.has(pageId)) {
        pageIds.delete(pageId);
      } else {
        pageIds.add(pageId);
      }
      return { ...prev, pageIds: Array.from(pageIds) };
    });
  };

  const generatePreview = async (phrase) => {
    setLoading(true);
    try {
      // Extrair texto e autor
      const phraseText = typeof phrase.text === 'string' ? phrase.text : phrase.text?.text || '';
      const parts = phraseText.split('—').map(p => p.trim());
      const text = parts[0];
      const author = parts.length > 1 ? parts[1] : '';

      // Verificar se é Reel ou Imagem (EXPLICITAMENTE)
      const isReel = phrase.contentType === 'reel' || (typeof phrase.text === 'object' && phrase.text?.contentType === 'reel');
      console.log('Preview - É Reel?', isReel);
      console.log('Preview - phrase.contentType:', phrase.contentType);
      console.log('Preview - phrase.text?.contentType:', phrase.text?.contentType);

      if (isReel) {
        // Gerar Reel de preview
        const response = await fetch('/api/reels/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            author,
            duration: 15,
            textPosition: 'center',
            fontSize: 60,
            fontColor: 'white'
          })
        });

        const data = await response.json();
        if (data.success) {
          setPreviewImage(data.path);
        } else {
          alert('Erro ao gerar preview do Reel: ' + data.error);
        }
      } else {
        // Gerar imagem de preview
        const response = await fetch('/api/content/generate-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            author,
            template: config.template || 'dark',
            watermark: config.watermark || ''
          })
        });

        const data = await response.json();
        if (data.success) {
          setPreviewImage(data.path);
        } else {
          alert('Erro ao gerar preview: ' + data.error);
        }
      }
    } catch (err) {
      console.error('Error generating preview:', err);
      alert('Erro ao gerar preview');
    } finally {
      setLoading(false);
    }
  };

  const postNow = async (phrase) => {
    if (!confirm('Publicar esta frase agora em todas as páginas configuradas?')) return;

    setLoading(true);
    try {
      console.log('📤 Iniciando publicação...');
      console.log('Páginas configuradas:', config.pageIds);
      console.log('Quantidade de páginas:', config.pageIds?.length || 0);

      if (!config.pageIds || config.pageIds.length === 0) {
        alert('❌ Nenhuma página configurada! Vá em "Configurar" e selecione as páginas.');
        return;
      }

      // Extrair texto e autor
      const phraseText = typeof phrase.text === 'string' ? phrase.text : phrase.text?.text || '';
      const parts = phraseText.split('—').map(p => p.trim());
      const text = parts[0];
      const author = parts.length > 1 ? parts[1] : '';

      console.log('Texto:', text);
      console.log('Autor:', author);

      // Verificar se é Reel ou Imagem (EXPLICITAMENTE)
      const isReel = phrase.contentType === 'reel' || (typeof phrase.text === 'object' && phrase.text?.contentType === 'reel');
      console.log('É Reel?', isReel);
      console.log('phrase.contentType:', phrase.contentType);
      console.log('phrase.text?.contentType:', phrase.text?.contentType);

      let mediaData;

      if (isReel) {
        // Gerar Reel
        const reelResponse = await fetch('/api/reels/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            author,
            duration: 15,
            textPosition: 'center',
            fontSize: 60,
            fontColor: 'white'
          })
        });

        mediaData = await reelResponse.json();
        if (!mediaData.success) {
          throw new Error('Erro ao gerar Reel');
        }
      } else {
        // Gerar imagem
        const imageResponse = await fetch('/api/content/generate-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            author,
            template: config.template,
            watermark: config.watermark
          })
        });

        mediaData = await imageResponse.json();
        if (!mediaData.success) {
          throw new Error('Erro ao gerar imagem');
        }
      }

      // Publicar em cada página
      const message = text + (author ? `\n\n— ${author}` : '');
      let publishedCount = 0;

      console.log('Iniciando publicação em', config.pageIds.length, 'página(s)...');

      for (const pageId of config.pageIds) {
        console.log('Publicando na página:', pageId);

        const publishData = {
          message,
          targetPageIds: [pageId]
        };

        if (isReel) {
          publishData.videoPath = mediaData.path.replace(/^\//, '');
          publishData.isReel = true;
          console.log('Enviando Reel:', publishData.videoPath);
        } else {
          publishData.imagePath = mediaData.path.replace(/^\//, '');
          console.log('Enviando Imagem:', publishData.imagePath);
        }

        const publishResponse = await fetch('/api/facebook/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishData)
        });

        const result = await publishResponse.json();
        console.log('Resultado da publicação:', result);

        if (result.success) {
          publishedCount++;
          console.log('✅ Publicado com sucesso na página', pageId);
        } else {
          console.error('❌ Erro ao publicar na página', pageId, ':', result.error);
        }
      }

      console.log('Total publicado:', publishedCount, 'de', config.pageIds.length);

      // Remover da fila
      await removePhrase(phrase.id);

      await loadStatus();
      alert(`✅ ${isReel ? 'Reel' : 'Post'} publicado em ${publishedCount} página(s) com sucesso!`);
    } catch (err) {
      console.error('Error posting now:', err);
      alert('Erro ao publicar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Fila Automática</h1>
              <p className="text-green-100">Sistema de postagem recorrente diária</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleQueue}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                status.enabled
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-green-600'
              }`}
            >
              {status.enabled ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Ativar
                </>
              )}
            </button>
            <button
              onClick={() => setConfigMode(!configMode)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-medium"
            >
              <Settings className="w-5 h-5" />
              Configurar
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-gray-900">{status.stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agendados</p>
              <p className="text-3xl font-bold text-gray-900">{status.stats.scheduled}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Publicados</p>
              <p className="text-3xl font-bold text-gray-900">{status.stats.published}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900">{status.stats.total}</p>
            </div>
            <RefreshCw className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={`border-l-4 p-4 rounded ${
        status.enabled ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {status.enabled ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm ${status.enabled ? 'text-green-700' : 'text-yellow-700'}`}>
              {status.enabled ? (
                <>
                  <strong>Fila Ativa:</strong> Sistema rodará automaticamente todo dia às 00:01 e agendará {config.postsPerDay} posts nos horários configurados.
                  {status.stats.pending < config.postsPerDay && (
                    <span className="block mt-1">⚠️ Atenção: Fila baixa! Adicione mais frases para manter o fluxo.</span>
                  )}
                </>
              ) : (
                <><strong>Fila Pausada:</strong> Ative a fila para iniciar postagens automáticas diárias.</>
              )}
            </p>
            {status.stats.lastRun && (
              <p className="text-xs text-gray-600 mt-1">
                Última execução: {new Date(status.stats.lastRun).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Config Mode */}
      {configMode && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configuração</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horários de Postagem (separados por vírgula)
              </label>
              <input
                type="text"
                value={config.scheduleHours.join(', ')}
                onChange={(e) => setConfig({
                  ...config,
                  scheduleHours: e.target.value.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h))
                })}
                placeholder="8, 12, 18, 21"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Horários em formato 24h. Ex: 8, 12, 18, 21 = 08:00, 12:00, 18:00, 21:00
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posts por dia
              </label>
              <input
                type="number"
                value={config.postsPerDay}
                onChange={(e) => setConfig({ ...config, postsPerDay: parseInt(e.target.value) || 1 })}
                min="1"
                max="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
                <option value="gradient">Gradiente Roxo</option>
                <option value="ocean">Oceano</option>
                <option value="sunset">Pôr do Sol</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca d'água (opcional)
              </label>
              <input
                type="text"
                value={config.watermark}
                onChange={(e) => setConfig({ ...config, watermark: e.target.value })}
                placeholder="@suapagina"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {userPages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Páginas
                </label>
                <div className="space-y-2 max-h-48 overflow-auto border border-gray-200 rounded-lg p-3">
                  {userPages.map(page => (
                    <label key={page.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.pageIds.includes(page.id)}
                        onChange={() => togglePageSelection(page.id)}
                      />
                      <span className="font-medium">{page.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={saveConfig}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                Salvar Configuração
              </button>
              <button
                onClick={() => setConfigMode(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={loadStatus}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          <RefreshCw className="w-5 h-5" />
          Atualizar
        </button>
        <button
          onClick={processNow}
          disabled={loading || status.stats.pending === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          <Play className="w-5 h-5" />
          Processar Agora (Teste)
        </button>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {previewImage.endsWith('.mp4') || previewImage.includes('/reels/') ? 'Preview do Reel' : 'Preview da Imagem'}
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {previewImage.endsWith('.mp4') || previewImage.includes('/reels/') ? (
              <video 
                src={previewImage} 
                controls
                className="w-full rounded-lg shadow-lg"
                autoPlay
              />
            ) : (
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Phrases List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">📝 Frases na Fila</h2>
          
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${
                filterStatus === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({status.phrases.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${
                filterStatus === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendentes ({status.stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${
                filterStatus === 'scheduled' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Agendados ({status.stats.scheduled})
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-3 py-1 text-sm rounded-lg font-medium ${
                filterStatus === 'published' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Publicados ({status.stats.published})
            </button>
            
            <div className="w-px h-6 bg-gray-300 self-center"></div>
            
            <button
              onClick={() => setFilterStatus('reels')}
              className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-lg font-medium ${
                filterStatus === 'reels' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Video className="w-3 h-3" />
              Reels ({status.phrases.filter(p => p.contentType === 'reel').length})
            </button>
            <button
              onClick={() => setFilterStatus('images')}
              className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-lg font-medium ${
                filterStatus === 'images' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Image className="w-3 h-3" />
              Imagens ({status.phrases.filter(p => p.contentType !== 'reel').length})
            </button>
          </div>
        </div>
        
        {status.phrases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhuma frase na fila</p>
            <p className="text-sm mt-2">Vá em "Criar Conteúdo" → "Em Lote" para adicionar frases</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {status.phrases
              .filter(phrase => {
                // Filtro de status
                if (filterStatus === 'reels') return phrase.contentType === 'reel';
                if (filterStatus === 'images') return phrase.contentType !== 'reel';
                if (filterStatus !== 'all' && phrase.status !== filterStatus) return false;
                return true;
              })
              .map((phrase) => (
              <div
                key={phrase.id}
                className={`p-4 rounded-lg border-2 ${
                  phrase.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                  phrase.status === 'scheduled' ? 'border-blue-200 bg-blue-50' :
                  phrase.status === 'published' ? 'border-green-200 bg-green-50' :
                  'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {(phrase.contentType === 'reel' || (typeof phrase.text === 'object' && phrase.text?.contentType === 'reel')) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                          <Video className="w-3 h-3" />
                          Reel
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Image className="w-3 h-3" />
                          Imagem
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900">{typeof phrase.text === 'string' ? phrase.text : phrase.text?.text || 'Texto não disponível'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span className={`px-2 py-1 rounded font-medium ${
                        phrase.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        phrase.status === 'scheduled' ? 'bg-blue-200 text-blue-800' :
                        phrase.status === 'published' ? 'bg-green-200 text-green-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {phrase.status === 'pending' ? 'Pendente' :
                         phrase.status === 'scheduled' ? 'Agendado' :
                         phrase.status === 'published' ? 'Publicado' : 'Falhou'}
                      </span>
                      {phrase.scheduledAt && (
                        <span>📅 {new Date(phrase.scheduledAt).toLocaleString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  {(phrase.status === 'pending' || phrase.status === 'scheduled') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => generatePreview(phrase)}
                        disabled={loading}
                        className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50"
                        title="Gerar Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => postNow(phrase)}
                        disabled={loading || config.pageIds.length === 0}
                        className="flex-shrink-0 p-2 text-green-600 hover:bg-green-100 rounded-lg disabled:opacity-50"
                        title="Postar Agora"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removePhrase(phrase.id)}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueManager;
