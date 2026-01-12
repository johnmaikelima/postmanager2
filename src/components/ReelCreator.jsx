import React, { useState, useEffect } from 'react';
import { Video, Wand2, Loader2, Check, X, Play, Calendar } from 'lucide-react';

function ReelCreator() {
  const [mode, setMode] = useState('batch');
  const [script, setScript] = useState('');
  const [phraseCount, setPhraseCount] = useState(5);
  const [generatedPhrases, setGeneratedPhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [userPages, setUserPages] = useState([]);
  const [availableVideos, setAvailableVideos] = useState([]);
  
  // Configurações de Reel
  const [duration, setDuration] = useState(15);
  const [textPosition, setTextPosition] = useState('center');
  const [fontSize, setFontSize] = useState(60);
  const [fontColor, setFontColor] = useState('white');

  useEffect(() => {
    loadUserPages();
    loadAvailableVideos();
  }, []);

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

  const loadAvailableVideos = async () => {
    try {
      const response = await fetch('/api/reels/videos');
      const data = await response.json();
      if (data.success) {
        setAvailableVideos(data.videos);
      }
    } catch (err) {
      console.error('Error loading videos:', err);
    }
  };

  const togglePageSelection = (pageId) => {
    setSelectedPageIds(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const generatePhrases = async () => {
    if (!script.trim()) {
      alert('Por favor, insira um script/tema para gerar as frases');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/content/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: script.trim(),
          count: phraseCount
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedPhrases(data.phrases.map(p => ({
          text: p,
          approved: false
        })));
        alert(`✅ ${data.phrases.length} frases geradas com sucesso!`);
      } else {
        alert('Erro ao gerar frases: ' + data.error);
      }
    } catch (err) {
      console.error('Error generating phrases:', err);
      alert('Erro ao gerar frases');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = (index) => {
    setGeneratedPhrases(prev => {
      const updated = [...prev];
      updated[index].approved = !updated[index].approved;
      return updated;
    });
  };

  const addToReelQueue = async () => {
    const approved = generatedPhrases.filter(p => p.approved);
    
    if (approved.length === 0) {
      alert('Selecione pelo menos uma frase para adicionar à fila');
      return;
    }

    if (!confirm(`Adicionar ${approved.length} frases à fila de Reels?\n\nElas serão transformadas em Reels automaticamente todos os dias.`)) {
      return;
    }

    setLoading(true);
    try {
      // Preparar frases com contentType
      const phrasesWithType = approved.map(p => ({
        text: p.text,
        contentType: 'reel'
      }));

      const response = await fetch('/api/content/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: phrasesWithType
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.added} frases adicionadas à fila de Reels!\n\nVá em "Fila Automática" para processar.`);
        setGeneratedPhrases([]);
        setScript('');
      } else {
        alert('Erro ao adicionar à fila: ' + data.error);
      }
    } catch (err) {
      console.error('Error adding to queue:', err);
      alert('Erro ao adicionar à fila');
    } finally {
      setLoading(false);
    }
  };

  const generateReelNow = async () => {
    const approved = generatedPhrases.filter(p => p.approved);
    
    if (approved.length === 0) {
      alert('Selecione pelo menos uma frase');
      return;
    }

    if (selectedPageIds.length === 0) {
      alert('Selecione pelo menos uma página');
      return;
    }

    if (!confirm(`Gerar ${approved.length} Reels agora?\n\nIsso pode levar alguns minutos.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reels/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: approved,
          duration,
          textPosition,
          fontSize,
          fontColor
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.successful}/${data.total} Reels gerados com sucesso!`);
        
        // Publicar Reels gerados
        for (const result of data.results) {
          if (result.success) {
            await publishReel(result.path);
          }
        }
      } else {
        alert('Erro ao gerar Reels: ' + data.error);
      }
    } catch (err) {
      console.error('Error generating reels:', err);
      alert('Erro ao gerar Reels');
    } finally {
      setLoading(false);
    }
  };

  const publishReel = async (videoPath) => {
    try {
      const response = await fetch('/api/facebook/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: videoPath.replace(/^\//, ''),
          targetPageIds: selectedPageIds,
          isReel: true
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Reel publicado com sucesso');
      }
    } catch (err) {
      console.error('Error publishing reel:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Video className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Criar Reels</h1>
        </div>
        <p className="text-purple-100">Gere Reels automaticamente com vídeos de fundo e frases inspiracionais</p>
      </div>

      {/* Videos Info */}
      {availableVideos.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-700">
            📹 <strong>{availableVideos.length} vídeo(s)</strong> disponível(is) na pasta fundovideo
          </p>
        </div>
      )}

      {availableVideos.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">
            ⚠️ Nenhum vídeo encontrado na pasta <strong>fundovideo</strong>. Adicione vídeos .mp4 para gerar Reels.
          </p>
        </div>
      )}

      {/* Batch Mode */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 Geração em Lote com IA</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Script/Tema para IA
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Ex: Gere frases motivacionais sobre superação e força interior"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de Frases: {phraseCount}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={phraseCount}
              onChange={(e) => setPhraseCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={generatePhrases}
            disabled={loading || !script.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
            <span>{loading ? 'Gerando...' : 'Gerar Frases com IA'}</span>
          </button>
        </div>
      </div>

      {/* Generated Phrases */}
      {generatedPhrases.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📝 Frases Geradas ({generatedPhrases.filter(p => p.approved).length}/{generatedPhrases.length} aprovadas)
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-auto">
              {generatedPhrases.map((phrase, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    phrase.approved
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                  onClick={() => toggleApproval(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      phrase.approved ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {phrase.approved && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className="flex-1 text-gray-900">{phrase.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setGeneratedPhrases(prev => prev.map(p => ({ ...p, approved: true })))}
                className="px-4 py-2 text-sm border border-green-300 text-green-700 rounded-lg bg-white hover:bg-green-50"
              >
                Aprovar Todas
              </button>
              <button
                onClick={() => setGeneratedPhrases(prev => prev.map(p => ({ ...p, approved: false })))}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg bg-white hover:bg-gray-50"
              >
                Desaprovar Todas
              </button>
            </div>
          </div>

          {/* Reel Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Configurações do Reel</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração: {duration}s
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posição do Texto
                </label>
                <select
                  value={textPosition}
                  onChange={(e) => setTextPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="top">Topo</option>
                  <option value="center">Centro</option>
                  <option value="bottom">Baixo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho da Fonte: {fontSize}px
                </label>
                <input
                  type="range"
                  min="40"
                  max="80"
                  step="5"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor do Texto
                </label>
                <select
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="white">Branco</option>
                  <option value="black">Preto</option>
                  <option value="yellow">Amarelo</option>
                  <option value="red">Vermelho</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pages Selection */}
          {userPages.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📱 Páginas</h2>
              <div className="space-y-2">
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPageIds(userPages.map(p => p.id))}
                    className="px-3 py-1 text-xs border border-purple-300 text-purple-700 rounded-lg bg-white hover:bg-purple-50"
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPageIds([])}
                    className="px-3 py-1 text-xs border border-purple-300 text-purple-700 rounded-lg bg-white hover:bg-purple-50"
                  >
                    Limpar
                  </button>
                  <div className="text-xs text-gray-600 flex items-center">
                    Selecionadas: {selectedPageIds.length}
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-auto">
                  {userPages.map(page => (
                    <label key={page.id} className="flex items-center gap-2 text-sm cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPageIds.includes(page.id)}
                        onChange={() => togglePageSelection(page.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{page.name}</div>
                        <div className="text-xs text-gray-600">
                          {page.fan_count ? `${page.fan_count.toLocaleString()} seguidores` : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {generatedPhrases.filter(p => p.approved).length > 0 && (
            <div className="space-y-3">
              <button
                onClick={generateReelNow}
                disabled={loading || selectedPageIds.length === 0 || availableVideos.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
                <span>
                  {loading ? 'Gerando...' : `Gerar e Publicar ${generatedPhrases.filter(p => p.approved).length} Reels Agora`}
                </span>
              </button>

              <button
                onClick={addToReelQueue}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Calendar className="w-6 h-6" />
                )}
                <span>
                  {loading ? 'Adicionando...' : `Adicionar ${generatedPhrases.filter(p => p.approved).length} Frases à Fila de Reels`}
                </span>
              </button>
              
              <p className="text-xs text-center text-gray-600">
                💡 <strong>Fila de Reels:</strong> As frases serão transformadas em Reels automaticamente todos os dias
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReelCreator;
