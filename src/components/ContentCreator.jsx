import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Send, Clock, Download, Loader2, Wand2, CheckCircle, XCircle, Calendar } from 'lucide-react';

function ContentCreator() {
  const [mode, setMode] = useState('single'); // 'single' ou 'batch'
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [template, setTemplate] = useState('dark');
  const [templates, setTemplates] = useState([]);
  const [watermark, setWatermark] = useState('');
  const [userPages, setUserPages] = useState([]);
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Batch mode
  const [script, setScript] = useState('');
  const [phraseCount, setPhraseCount] = useState(10);
  const [generatedPhrases, setGeneratedPhrases] = useState([]);
  const [approvedPhrases, setApprovedPhrases] = useState([]);
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [startHour, setStartHour] = useState(6);
  const [endHour, setEndHour] = useState(23);

  useEffect(() => {
    loadTemplates();
    loadUserPages();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/content/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const loadUserPages = async () => {
    try {
      const response = await fetch('/api/facebook/pages');
      const data = await response.json();
      if (data.success && data.pages.length > 0) {
        setUserPages(data.pages);
        setSelectedPageIds([data.pages[0].id]);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    }
  };

  const togglePageSelection = (pageId) => {
    setSelectedPageIds((prev) => {
      const set = new Set(prev);
      if (set.has(pageId)) set.delete(pageId);
      else set.add(pageId);
      return Array.from(set);
    });
  };

  const generateImage = async () => {
    if (!text.trim()) {
      alert('Digite um texto para gerar a imagem');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/content/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          author,
          template,
          pageId: selectedPageIds[0],
          watermark
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedImage(data.path);
        alert('✅ Imagem gerada com sucesso!');
      } else {
        alert('Erro ao gerar imagem: ' + data.error);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Erro ao gerar imagem');
    } finally {
      setLoading(false);
    }
  };

  const publishNow = async () => {
    if (!generatedImage) {
      alert('Gere uma imagem primeiro');
      return;
    }

    if (selectedPageIds.length === 0) {
      alert('Selecione pelo menos uma página');
      return;
    }

    if (!confirm('Deseja publicar esta imagem agora?')) return;

    setLoading(true);
    try {
      const results = [];
      for (const pageId of selectedPageIds) {
        const response = await fetch('/api/facebook/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text + (author ? `\n\n— ${author}` : ''),
            imagePath: generatedImage.replace(/^\//, ''),
            targetPageId: pageId
          })
        });

        const data = await response.json();
        results.push({ pageId, success: !!data.success, data });
      }

      const ok = results.every(r => r.success);
      if (ok) {
        alert('✅ Publicado com sucesso em todas as páginas!');
        setText('');
        setAuthor('');
        setGeneratedImage(null);
      } else {
        alert('⚠️ Algumas páginas falharam. Verifique o console.');
      }
    } catch (err) {
      console.error('Error publishing:', err);
      alert('Erro ao publicar');
    } finally {
      setLoading(false);
    }
  };

  const schedulePost = async () => {
    if (!generatedImage) {
      alert('Gere uma imagem primeiro');
      return;
    }

    if (!scheduledTime) {
      alert('Escolha uma data/hora para agendar');
      return;
    }

    if (selectedPageIds.length === 0) {
      alert('Selecione pelo menos uma página');
      return;
    }

    setLoading(true);
    try {
      for (const pageId of selectedPageIds) {
        const response = await fetch('/api/posts/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text + (author ? `\n\n— ${author}` : ''),
            imagePath: generatedImage.replace(/^\//, ''),
            scheduledTime,
            targetPageId: pageId
          })
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Erro ao agendar');
        }
      }

      alert('✅ Agendado com sucesso para todas as páginas!');
      setScheduledTime('');
      setText('');
      setAuthor('');
      setGeneratedImage(null);
    } catch (err) {
      console.error('Error scheduling:', err);
      alert('Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  const generateBatchPhrases = async () => {
    if (!script.trim()) {
      alert('Digite um script/prompt para gerar frases');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/content/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          count: phraseCount
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedPhrases(data.phrases.map((phrase, i) => ({ id: i, text: phrase, approved: false })));
        alert(`✅ ${data.phrases.length} frases geradas! Revise e aprove as que deseja publicar.`);
      } else {
        alert('Erro ao gerar frases: ' + data.error);
      }
    } catch (err) {
      console.error('Error generating batch:', err);
      alert('Erro ao gerar frases');
    } finally {
      setLoading(false);
    }
  };

  const togglePhraseApproval = (id) => {
    setGeneratedPhrases(prev => 
      prev.map(p => p.id === id ? { ...p, approved: !p.approved } : p)
    );
  };

  const scheduleBatchPosts = async () => {
    const approved = generatedPhrases.filter(p => p.approved);
    
    if (approved.length === 0) {
      alert('Aprove pelo menos uma frase');
      return;
    }

    if (selectedPageIds.length === 0) {
      alert('Selecione pelo menos uma página');
      return;
    }

    if (!confirm(`Agendar ${approved.length} posts automaticamente?\n\nIntervalo: ${intervalMinutes} minutos\nHorário: ${startHour}h - ${endHour}h (BRT)`)) {
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Enviando requisição de agendamento em lote...');
      console.log('Dados:', {
        phrasesCount: approved.length,
        template,
        pageIds: selectedPageIds,
        intervalMinutes,
        startHour,
        endHour
      });

      // Criar timeout de 60 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('/api/content/schedule-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: approved.map(p => p.text),
          template,
          pageIds: selectedPageIds,
          watermark,
          intervalMinutes,
          startHour,
          endHour
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 Resposta recebida:', response.status);

      // Ler resposta uma única vez
      const responseText = await response.text();
      console.log('📄 Resposta bruta:', responseText);

      if (!response.ok) {
        let errorMessage = 'Erro desconhecido';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || JSON.stringify(errorData);
          console.error('❌ Erro JSON:', errorData);
        } catch (e) {
          errorMessage = responseText || 'Sem mensagem de erro';
          console.error('❌ Erro texto:', errorMessage);
        }
        throw new Error(`Erro ${response.status}: ${errorMessage}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Dados recebidos:', data);

      if (data.success) {
        alert(`✅ ${data.count} posts agendados com sucesso!\n\nVerifique a aba "Posts Agendados" para mais detalhes.`);
        setGeneratedPhrases([]);
        setScript('');
      } else {
        alert('Erro ao agendar: ' + data.error);
      }
    } catch (err) {
      console.error('❌ Error scheduling batch:', err);
      alert('Erro ao agendar posts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToRecurringQueue = async () => {
    const approved = generatedPhrases.filter(p => p.approved);
    
    if (approved.length === 0) {
      alert('Selecione pelo menos uma frase para adicionar à fila');
      return;
    }

    if (!confirm(`Adicionar ${approved.length} frases à fila recorrente?\n\nElas serão postadas automaticamente todos os dias nos horários configurados na aba "Fila Automática".`)) {
      return;
    }

    setLoading(true);
    try {
      // Enviar apenas o texto (sem contentType) para que seja tratado como imagem
      const response = await fetch('/api/content/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: approved.map(p => p.text) // String simples = Imagem
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.added} frases de IMAGEM adicionadas à fila!\n\nVá em "Fila Automática" para configurar horários e páginas.`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Criação de Conteúdo</h1>
              <p className="text-purple-100">Crie imagens com frases e citações inspiradoras</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              <ImageIcon className="w-5 h-5 inline mr-2" />
              Único
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'batch'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              <Wand2 className="w-5 h-5 inline mr-2" />
              Em Lote (IA)
            </button>
          </div>
        </div>
      </div>

      {mode === 'batch' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Wand2 className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Modo em Lote:</strong> Gere múltiplas frases com IA, aprove as que deseja e agende automaticamente com intervalo inteligente!
              </p>
            </div>
          </div>
        </div>
      )}

      {mode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✍️ Texto</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frase / Citação
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite sua frase ou citação aqui..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor (opcional)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Epicuro, Albert Einstein..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca d'água (opcional)
                </label>
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  placeholder="Ex: @suapagina"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎨 Template</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    template === t.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded mb-2"
                    style={{ background: t.preview }}
                  />
                  <div className="text-sm font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-600">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pages */}
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

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
            <span>{loading ? 'Gerando...' : 'Gerar Imagem'}</span>
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👁️ Preview</h2>
            
            {generatedImage ? (
              <div className="space-y-4">
                <img
                  src={generatedImage}
                  alt="Imagem gerada"
                  className="w-full rounded-lg shadow-lg"
                />
                
                <div className="flex gap-2">
                  <a
                    href={generatedImage}
                    download
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Baixar</span>
                  </a>
                  
                  <button
                    onClick={generateImage}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Regerar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
                <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center">
                  Sua imagem aparecerá aqui<br />
                  <span className="text-sm">Preencha os campos e clique em "Gerar Imagem"</span>
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {generatedImage && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Publicar</h2>
              
              <div className="space-y-3">
                <button
                  onClick={publishNow}
                  disabled={loading || selectedPageIds.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Send className="w-5 h-5" />
                  <span>Publicar Agora</span>
                </button>

                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={schedulePost}
                    disabled={loading || !scheduledTime || selectedPageIds.length === 0}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Agendar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="space-y-6">
          {/* Batch Script */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 Script / Prompt para IA</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descreva o tipo de conteúdo que deseja gerar
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Exemplo: Gere frases motivacionais sobre superação pessoal, com tom inspirador e positivo. Inclua citações de filósofos e pensadores famosos."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de frases
                  </label>
                  <input
                    type="number"
                    value={phraseCount}
                    onChange={(e) => setPhraseCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo (minutos)
                  </label>
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Math.max(30, parseInt(e.target.value) || 120))}
                    min="30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora inicial (BRT)
                  </label>
                  <input
                    type="number"
                    value={startHour}
                    onChange={(e) => setStartHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 6)))}
                    min="0"
                    max="23"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora final (BRT)
                  </label>
                  <input
                    type="number"
                    value={endHour}
                    onChange={(e) => setEndHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 23)))}
                    min="0"
                    max="23"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={generateBatchPhrases}
                disabled={loading || !script.trim()}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Wand2 className="w-6 h-6" />
                )}
                <span>{loading ? 'Gerando...' : `Gerar ${phraseCount} Frases com IA`}</span>
              </button>
            </div>
          </div>

          {/* Generated Phrases */}
          {generatedPhrases.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">✅ Frases Geradas ({generatedPhrases.filter(p => p.approved).length}/{generatedPhrases.length} aprovadas)</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGeneratedPhrases(prev => prev.map(p => ({ ...p, approved: true })))}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Aprovar Todas
                  </button>
                  <button
                    onClick={() => setGeneratedPhrases(prev => prev.map(p => ({ ...p, approved: false })))}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-auto">
                {generatedPhrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    onClick={() => togglePhraseApproval(phrase.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      phrase.approved
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {phrase.approved ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{phrase.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template & Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎨 Template</h2>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      template === t.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded mb-2"
                      style={{ background: t.preview }}
                    />
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca d'água (opcional)
                </label>
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  placeholder="Ex: @suapagina"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

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
          </div>

          {/* Action Buttons */}
          {generatedPhrases.filter(p => p.approved).length > 0 && (
            <div className="space-y-3">
              <button
                onClick={scheduleBatchPosts}
                disabled={loading || selectedPageIds.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Calendar className="w-6 h-6" />
                )}
                <span>
                  {loading ? 'Agendando...' : `Agendar ${generatedPhrases.filter(p => p.approved).length} Posts Automaticamente`}
                </span>
              </button>

              <button
                onClick={addToRecurringQueue}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Wand2 className="w-6 h-6" />
                )}
                <span>
                  {loading ? 'Adicionando...' : `Adicionar ${generatedPhrases.filter(p => p.approved).length} Frases à Fila Recorrente`}
                </span>
              </button>
              
              <p className="text-xs text-center text-gray-600">
                💡 <strong>Fila Recorrente:</strong> As frases serão postadas automaticamente todos os dias nos horários configurados
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContentCreator;
