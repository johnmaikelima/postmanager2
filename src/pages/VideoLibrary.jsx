import React, { useState, useEffect } from 'react';
import { Film, Download, Trash2, ArrowLeft, Play } from 'lucide-react';

function VideoLibrary({ onBackClick }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/video/library');
      const data = await response.json();

      if (data.success && data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      alert('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este vídeo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/video/library/${videoId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setVideos(videos.filter(v => v.id !== videoId));
        alert('Vídeo deletado com sucesso!');
      } else {
        alert('Erro ao deletar vídeo: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error);
      alert('Erro ao deletar vídeo');
    }
  };

  const handleDownload = (video) => {
    const link = document.createElement('a');
    link.href = video.path;
    link.download = video.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Vídeos</h1>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {videos.length} vídeo{videos.length !== 1 ? 's' : ''} gerado{videos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <Film className="w-8 h-8 text-purple-600" />
            </div>
            <p className="mt-2 text-gray-600">Carregando vídeos...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum vídeo gerado</h2>
            <p className="text-gray-600 mb-6">
              Comece gerando um vídeo na página de Gerador de Vídeos
            </p>
          </div>
        )}

        {/* Videos Grid */}
        {!loading && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Video Thumbnail */}
                <div className="relative bg-black aspect-video flex items-center justify-center group cursor-pointer"
                  onClick={() => {
                    setSelectedVideo(video);
                    setShowPreview(true);
                  }}
                >
                  <video
                    src={video.path}
                    className="w-full h-full object-cover"
                    onMouseEnter={(e) => e.target.play()}
                    onMouseLeave={(e) => {
                      e.target.pause();
                      e.target.currentTime = 0;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center transition-colors">
                    <Play className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-2">
                    {video.filename}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>Tamanho: {video.sizeFormatted}</p>
                    <p>Criado: {video.createdAtFormatted}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(video)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {showPreview && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedVideo.filename}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="bg-black aspect-video flex items-center justify-center">
              <video
                src={selectedVideo.path}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>

            <div className="p-4 border-t space-y-2 text-sm text-gray-600">
              <p>Tamanho: {selectedVideo.sizeFormatted}</p>
              <p>Criado: {selectedVideo.createdAtFormatted}</p>
            </div>

            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => handleDownload(selectedVideo)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedVideo.id);
                  setShowPreview(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Deletar
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoLibrary;
