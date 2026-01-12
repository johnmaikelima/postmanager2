import React, { useState, useEffect } from 'react';
import { Upload, Play, Download, Plus, Trash2, Settings, Loader2, Volume2, Film } from 'lucide-react';

function VideoEditor({ selectedPost }) {
  const [projectName, setProjectName] = useState('');
  const [images, setImages] = useState([]);
  const [voiceOptions, setVoiceOptions] = useState({
    language: 'pt-BR',
    voiceName: 'pt-BR-Neural2-C',
    speakingRate: 1.0
  });
  const [videoOptions, setVideoOptions] = useState({
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: '5000k'
  });
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [voices, setVoices] = useState([]);
  const [draggedImage, setDraggedImage] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [editingContent, setEditingContent] = useState(false);
  const [newsContent, setNewsContent] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [automating, setAutomating] = useState(false);
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    loadVoices();
    if (selectedPost) {
      setNewsContent(selectedPost.content || '');
    }
  }, [selectedPost]);

  const loadVoices = async () => {
    try {
      const response = await fetch('/api/video/voices?language=pt-BR');
      const data = await response.json();
      if (data.success) {
        setVoices(data.voices);
      }
    } catch (error) {
      console.error('Erro ao carregar vozes:', error);
    }
  };

  const playVoicePreview = async () => {
    setPlayingPreview(true);
    try {
      const response = await fetch('/api/video/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: voiceOptions.language,
          voiceName: voiceOptions.voiceName,
          speakingRate: voiceOptions.speakingRate
        })
      });

      const data = await response.json();

      if (data.success && data.audio) {
        setPreviewAudio(data.audio.path);
        
        // Criar e tocar áudio
        const audio = new Audio(data.audio.path);
        audio.onended = () => setPlayingPreview(false);
        audio.play();
      } else {
        alert('Erro ao gerar preview: ' + (data.error || 'Erro desconhecido'));
        setPlayingPreview(false);
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      alert('Erro ao gerar preview de voz');
      setPlayingPreview(false);
    }
  };

  const generateAudio = async () => {
    if (!newsContent.trim()) {
      alert('Digite o conteúdo da notícia primeiro');
      return;
    }

    setGeneratingAudio(true);
    try {
      const response = await fetch('/api/video/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newsContent,
          language: voiceOptions.language,
          voiceName: voiceOptions.voiceName,
          speakingRate: voiceOptions.speakingRate
        })
      });

      const data = await response.json();

      if (data.success && data.audio) {
        setGeneratedAudio(data.audio);
        alert('✅ Áudio gerado com sucesso!');
      } else {
        alert('Erro ao gerar áudio: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      alert('Erro ao gerar áudio');
    } finally {
      setGeneratingAudio(false);
    }
  };

  const playGeneratedAudio = () => {
    if (!generatedAudio) return;
    
    setPlayingAudio(true);
    const audio = new Audio(generatedAudio.path);
    audio.onended = () => setPlayingAudio(false);
    audio.play();
  };

  const automateVideoCreation = async () => {
    if (!newsContent.trim()) {
      alert('Digite o conteúdo da notícia primeiro');
      return;
    }

    setAutomating(true);
    try {
      const response = await fetch('/api/video/automation/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newsContent
        })
      });

      const data = await response.json();

      if (data.success) {
        setScenario(data.scenario);
        
        // Adicionar imagens automaticamente
        if (data.images) {
          const newImages = [];
          for (const [sceneId, imageData] of Object.entries(data.images)) {
            if (imageData && imageData.url) {
              newImages.push({
                id: sceneId,
                path: imageData.url,
                duration: data.scenario.scenes.find(s => s.id === sceneId)?.duration || 3,
                position: { x: 0, y: 0 },
                scale: 1
              });
            }
          }
          setImages(newImages);
        }

        alert('✅ Automação completa! Roteiro gerado e imagens adicionadas!');
      } else {
        alert('Erro na automação: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro na automação:', error);
      alert('Erro ao automatizar vídeo');
    } finally {
      setAutomating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Upload da imagem para o servidor
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/image/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          setImages(prev => [...prev, {
            id: Date.now() + Math.random(),
            path: data.file.path, // Caminho do servidor
            duration: 3,
            position: { x: 0, y: 0 },
            scale: 1
          }]);
        } else {
          alert('Erro ao fazer upload da imagem: ' + data.error);
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        alert('Erro ao fazer upload da imagem');
      }
    }
  };

  const updateImage = (id, updates) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragStart = (e, id) => {
    setDraggedImage(id);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedImage || draggedImage === targetId) return;

    const draggedIndex = images.findIndex(img => img.id === draggedImage);
    const targetIndex = images.findIndex(img => img.id === targetId);

    const newImages = [...images];
    [newImages[draggedIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[draggedIndex]];
    setImages(newImages);
    setDraggedImage(null);
  };

  const generateVideo = async () => {
    console.log('selectedPost:', selectedPost);
    
    if (!selectedPost) {
      alert('Selecione uma notícia primeiro');
      return;
    }

    const content = selectedPost?.content || selectedPost?.text || selectedPost?.message;
    
    if (!content) {
      alert('A notícia não tem conteúdo');
      return;
    }

    if (images.length === 0) {
      alert('Adicione pelo menos uma imagem');
      return;
    }

    if (!projectName.trim()) {
      alert('Digite um nome para o projeto');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar projeto
      const projectResponse = await fetch('/api/video/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          title: selectedPost?.title || 'Vídeo',
          content: content,
          images: images.map(img => ({
            path: img.path,
            duration: img.duration,
            position: img.position,
            scale: img.scale
          })),
          voiceOptions,
          videoOptions
        })
      });

      if (!projectResponse.ok) {
        const text = await projectResponse.text();
        console.error('Erro do servidor:', text);
        throw new Error(`Erro ao criar projeto: ${projectResponse.status}`);
      }

      const projectData = await projectResponse.json();
      if (!projectData.success) {
        throw new Error(projectData.error);
      }

      console.log('✅ Projeto criado:', projectData.projectId);

      // 2. Gerar vídeo
      const videoResponse = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectData.projectId
        })
      });

      if (!videoResponse.ok) {
        const text = await videoResponse.text();
        console.error('Erro do servidor:', text);
        throw new Error(`Erro ao gerar vídeo: ${videoResponse.status}`);
      }

      const videoData = await videoResponse.json();
      if (!videoData.success) {
        throw new Error(videoData.error);
      }

      setGeneratedVideo(videoData.video);
      alert('✅ Vídeo gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar vídeo:', error);
      alert('Erro ao gerar vídeo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    window.open(generatedVideo.path, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gerador de Vídeos</h2>
        <p className="text-gray-600 mt-1">
          Crie vídeos com narração automática a partir de notícias
        </p>
      </div>

      {/* Nome do Projeto */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Projeto
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Ex: Vídeo - Notícia do Dia"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Edição de Conteúdo da Notícia */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 flex items-center space-x-2">
            <span>📝 Conteúdo da Notícia</span>
          </h3>
          <button
            onClick={() => setEditingContent(!editingContent)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {editingContent ? 'Pronto' : 'Editar'}
          </button>
        </div>
        
        {editingContent ? (
          <textarea
            value={newsContent}
            onChange={(e) => setNewsContent(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
            rows="6"
            placeholder="Edite o conteúdo da notícia aqui..."
          />
        ) : (
          <div className="bg-white p-3 rounded-lg border border-green-200 max-h-32 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
            {newsContent || 'Nenhum conteúdo'}
          </div>
        )}
      </div>

      {/* Configurações de Voz */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Configurações de Narração</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voz
            </label>
            <div className="flex gap-2">
              <select
                value={voiceOptions.voiceName}
                onChange={(e) => setVoiceOptions(prev => ({ ...prev, voiceName: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {voices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.displayName}
                  </option>
                ))}
              </select>
              <button
                onClick={playVoicePreview}
                disabled={playingPreview}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                title="Ouvir preview desta voz"
              >
                {playingPreview ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span className="text-sm">Tocando...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Velocidade de Fala
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceOptions.speakingRate}
              onChange={(e) => setVoiceOptions(prev => ({ ...prev, speakingRate: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{voiceOptions.speakingRate.toFixed(1)}x</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Idioma
            </label>
            <select
              value={voiceOptions.language}
              onChange={(e) => setVoiceOptions(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurações de Vídeo */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Configurações de Vídeo</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Largura</label>
            <input
              type="number"
              value={videoOptions.width}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, width: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Altura</label>
            <input
              type="number"
              value={videoOptions.height}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, height: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FPS</label>
            <input
              type="number"
              value={videoOptions.fps}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bitrate</label>
            <input
              type="text"
              value={videoOptions.bitrate}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, bitrate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Automação */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">🤖 Automação Inteligente</h3>
            <p className="text-sm text-gray-600 mt-1">
              Gere roteiro, imagens e organize tudo automaticamente
            </p>
          </div>
          <button
            onClick={automateVideoCreation}
            disabled={automating || !newsContent.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {automating ? (
              <>
                <span className="animate-spin">⏳</span>
                Automatizando...
              </>
            ) : (
              <>
                <span>🚀</span>
                Automatizar Tudo
              </>
            )}
          </button>
        </div>
        {scenario && (
          <div className="mt-3 p-3 bg-white rounded border border-indigo-200 text-sm">
            <p className="text-gray-900">
              <strong>✅ {scenario.scenes.length} cenas</strong> geradas | 
              <strong className="ml-3">⏱️ {scenario.totalDuration}s</strong> de duração
            </p>
          </div>
        )}
      </div>

      {/* Gerar Áudio */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">🎙️ Gerar Narração</h3>
            <p className="text-sm text-gray-600 mt-1">
              {generatedAudio ? `✅ Áudio gerado (${generatedAudio.duration / 1000}s)` : 'Gere o áudio antes de criar o vídeo'}
            </p>
          </div>
          <div className="flex gap-2">
            {generatedAudio && (
              <button
                onClick={playGeneratedAudio}
                disabled={playingAudio}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {playingAudio ? 'Tocando...' : 'Ouvir'}
              </button>
            )}
            <button
              onClick={generateAudio}
              disabled={generatingAudio || !newsContent.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {generatingAudio ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Gerando...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Gerar Áudio
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Visual de Vídeo - Timeline */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4">🎬 Timeline do Vídeo</h3>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-white">
            <Film className="w-12 h-12 text-orange-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Adicione imagens para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline Visual */}
            <div className="bg-black rounded-lg p-4 overflow-x-auto">
              <div className="space-y-2">
                {/* Faixa de Imagens */}
                <div className="flex gap-2 pb-2">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, img.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, img.id)}
                      className={`relative flex-shrink-0 cursor-move transition-all ${
                        draggedImage === img.id ? 'opacity-50' : ''
                      }`}
                      style={{ width: `${Math.max(80, img.duration * 20)}px` }}
                    >
                      {/* Thumbnail */}
                      <div className="w-full h-20 bg-gray-700 rounded border-2 border-orange-500 overflow-hidden relative group">
                        <img
                          src={img.path}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Número */}
                        <div className="absolute top-1 left-1 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </div>

                        {/* Duração */}
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                          {img.duration}s
                        </div>

                        {/* Hover - Deletar */}
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Faixa de Áudio */}
                {generatedAudio && (
                  <div className="flex gap-2">
                    <div 
                      className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded border-2 border-blue-400 flex items-center justify-center text-white text-xs font-bold"
                    >
                      🎙️
                    </div>
                    <div
                      className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-400 rounded border-2 border-blue-300 flex items-center px-3 text-white text-xs font-medium"
                      style={{ width: `${Math.max(100, (generatedAudio.duration / 1000) * 20)}px` }}
                    >
                      Narração ({(generatedAudio.duration / 1000).toFixed(1)}s)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controles de Duração */}
            <div className="bg-white rounded-lg border border-orange-200 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">Ajustar Duração das Imagens</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {images.map((img, index) => (
                  <div key={img.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-12">#{index + 1}</span>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={img.duration}
                      onChange={(e) => updateImage(img.id, { duration: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={img.duration}
                      onChange={(e) => updateImage(img.id, { duration: parseFloat(e.target.value) })}
                      className="w-16 px-2 py-1 border border-orange-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600 w-8">seg</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg border border-orange-300 p-3 text-sm">
              <p className="text-gray-900">
                <strong>📊 Total:</strong> {images.length} imagem{images.length !== 1 ? 'ns' : ''} | 
                <strong className="ml-4">⏱️ Duração:</strong> {images.reduce((sum, img) => sum + (img.duration || 3), 0).toFixed(1)}s
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload de Imagens */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Adicionar Mais Imagens</h3>
          <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Adicionar Imagens</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Clique em "Adicionar Imagens" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => handleDragStart(e, img.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, img.id)}
                className={`bg-white border-2 rounded-lg p-3 cursor-move transition-all ${
                  draggedImage === img.id ? 'opacity-50 border-purple-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <img
                      src={img.path}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Imagem {index + 1}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div>
                        <label className="text-xs text-gray-600">Duração (s)</label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={img.duration}
                          onChange={(e) => updateImage(img.id, { duration: parseFloat(e.target.value) })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Escala</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={img.scale}
                          onChange={(e) => updateImage(img.id, { scale: parseFloat(e.target.value) })}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vídeo Gerado */}
      {generatedVideo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">✅ Vídeo Gerado</h3>
          <div className="space-y-3">
            <video
              src={generatedVideo.path}
              controls
              className="w-full rounded-lg max-h-96"
            />
            <button
              onClick={downloadVideo}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Vídeo</span>
            </button>
          </div>
        </div>
      )}

      {/* Botão Gerar */}
      <div className="flex gap-3">
        <button
          onClick={generateVideo}
          disabled={loading || images.length === 0 || !projectName.trim()}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span>{loading ? 'Gerando...' : 'Gerar Vídeo'}</span>
        </button>
      </div>
    </div>
  );
}

export default VideoEditor;
