import React, { useState, useEffect } from 'react';
import { Film, ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import VideoEditor from '../components/VideoEditor';

function VideoGenerator() {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/video-news');
      const data = await response.json();

      if (data.success && data.news) {
        setNews(data.news);
      }
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromUrl = async (e) => {
    e.preventDefault();

    if (!urlInput.trim()) {
      alert('Digite uma URL válida');
      return;
    }

    setIsScrapingUrl(true);
    try {
      const response = await fetch('/api/video-news/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });

      const data = await response.json();

      if (data.success) {
        setNews([data.news, ...news]);
        setUrlInput('');
        setShowAddForm(false);
        alert('✅ Notícia importada com sucesso!');
      } else {
        alert('Erro ao importar notícia: ' + data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao importar notícia');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!confirm('Tem certeza que quer deletar esta notícia?')) return;

    try {
      const response = await fetch(`/api/video-news/${newsId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setNews(news.filter(n => n.id !== newsId));
        alert('✅ Notícia deletada!');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar notícia');
    }
  };

  const filteredNews = news.filter(n =>
    (n.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (n.content?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (selectedNews) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedNews(null)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <VideoEditor selectedPost={selectedNews} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
          <Film className="w-8 h-8 text-purple-600" />
          <span>Gerador de Vídeos</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Crie notícias e gere vídeos com narração automática para YouTube
        </p>
      </div>

      {/* Formulário de Importar Notícia por URL */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Importar Notícia de URL</h2>
          <form onSubmit={handleAddFromUrl} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Notícia *
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/noticia"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole a URL completa da notícia que deseja importar
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isScrapingUrl}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isScrapingUrl ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Importando...</span>
                  </>
                ) : (
                  <span>Importar Notícia</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Botão Adicionar */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar Notícia</span>
        </button>
      )}

      {/* Busca */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <input
          type="text"
          placeholder="Buscar notícias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Lista de Notícias */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando notícias...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">Nenhuma notícia encontrada</p>
            <p className="text-sm text-gray-500 mt-1">
              Clique em "Adicionar Notícia" para começar
            </p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>📁 {item.category}</span>
                        <span>📅 {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                    onClick={() => setSelectedNews(item)}
                  >
                    Criar Vídeo
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    onClick={() => handleDeleteNews(item.id)}
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VideoGenerator;
