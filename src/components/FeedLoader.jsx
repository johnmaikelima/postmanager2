import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Calendar, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function FeedLoader({ onSelectPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/facebook/posts?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error || 'Erro ao carregar posts');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feed de Posts</h2>
          <p className="text-gray-600 mt-1">
            Carregue posts de páginas do Facebook para repostar
          </p>
        </div>
        <button
          onClick={loadPosts}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && posts.length === 0 && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando posts...</p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum post encontrado</p>
          <p className="text-sm text-gray-500 mt-2">
            Configure as páginas fonte no arquivo .env
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image */}
            {post.full_picture && (
              <div className="aspect-video bg-gray-100">
                <img
                  src={post.full_picture}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Message */}
              {post.message && (
                <p className="text-gray-700 line-clamp-3 text-sm">
                  {post.message}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(post.created_time), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => onSelectPost(post)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Usar este Post
                </button>
                {post.permalink_url && (
                  <a
                    href={post.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-600" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedLoader;
