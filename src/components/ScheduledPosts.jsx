import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ScheduledPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadScheduledPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/posts/scheduled');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error || 'Erro ao carregar posts agendados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelPost = async (jobId) => {
    if (!confirm('Deseja cancelar este post agendado?')) return;
    
    try {
      const response = await fetch(`/api/posts/schedule/${jobId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Post cancelado com sucesso!');
        loadScheduledPosts();
      } else {
        alert('Erro ao cancelar: ' + data.error);
      }
    } catch (err) {
      console.error('Error cancelling post:', err);
      alert('Erro ao cancelar post');
    }
  };

  useEffect(() => {
    loadScheduledPosts();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadScheduledPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Posts Agendados</h2>
          <p className="text-gray-600 mt-1">
            Gerencie seus posts programados para publicação
          </p>
        </div>
        <button
          onClick={loadScheduledPosts}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Erro</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && posts.length === 0 && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando posts agendados...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Nenhum post agendado</p>
          <p className="text-sm text-gray-500 mt-2">
            Agende posts no Editor de Posts para vê-los aqui
          </p>
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'delayed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {post.status === 'delayed' ? 'Agendado' : 'Aguardando'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {post.id}
                    </span>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-gray-900 font-medium mb-1">Mensagem:</p>
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {post.data.message}
                    </p>
                  </div>

                  {/* Scheduled Time */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(post.scheduledTime), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(post.scheduledTime), 'HH:mm', {
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {post.data.imagePath && (
                    <div className="mt-3">
                      <img
                        src={post.data.imagePath}
                        alt="Post preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => cancelPost(post.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancelar post"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      {posts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">ℹ️ Informações</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Posts são publicados automaticamente no horário agendado</li>
            <li>• Você pode cancelar um post antes da publicação</li>
            <li>• A lista é atualizada automaticamente a cada 30 segundos</li>
            <li>• Certifique-se de que o servidor está rodando para publicação automática</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default ScheduledPosts;
