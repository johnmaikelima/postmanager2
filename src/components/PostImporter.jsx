import React, { useState } from 'react';
import { Link2, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

function PostImporter({ onPostImported }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const extractPost = async () => {
    if (!url.trim()) {
      setError('Por favor, cole o link da notícia');
      return;
    }

    if (!url.startsWith('http')) {
      setError('Por favor, cole um link válido (deve começar com http:// ou https://)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scraper/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (data.success || data.imagePath) {
        setResult(data);
        
        // Mostrar aviso se não conseguiu texto mas conseguiu imagem
        if (data.message) {
          setError(data.message);
        }
        
        // Notificar componente pai com os dados extraídos
        if (onPostImported) {
          onPostImported({
            text: data.text,
            imagePath: data.imagePath,
            sourceUrl: data.sourceUrl
          });
        }
      } else {
        setError(data.message || data.error || 'Erro ao extrair post');
      }
    } catch (err) {
      console.error('Error extracting post:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const useExtractedPost = () => {
    if (result && onPostImported) {
      onPostImported({
        text: result.text,
        imagePath: result.imagePath,
        sourceUrl: result.sourceUrl
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Importar Notícia por Link</h2>
        <p className="text-gray-600 mt-1">
          Cole o link de uma notícia para extrair título, conteúdo e imagem
        </p>
      </div>

      {/* Input de URL */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link da Notícia
          </label>
          <div className="flex space-x-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://g1.globo.com/..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && extractPost()}
            />
            <button
              onClick={extractPost}
              disabled={loading || !url.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extraindo...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Extrair</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Dica: Copie o link completo do post (ex: https://www.facebook.com/pagina/posts/123456)
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Erro ao extrair</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Se não funcionar automaticamente, você pode copiar o texto e imagem manualmente e usar o Editor de Posts.
              </p>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && result.success && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Post extraído com sucesso!</p>
                <p className="text-xs text-green-700 mt-1">
                  Agora você pode editar o texto com IA e publicar nas suas páginas
                </p>
              </div>
            </div>

            {/* Preview do texto */}
            {result.text && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Texto Extraído:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.text.substring(0, 300)}
                  {result.text.length > 300 && '...'}
                </p>
              </div>
            )}

            {/* Preview da imagem */}
            {result.imagePath && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Imagem Extraída:</h3>
                <img
                  src={result.imagePath}
                  alt="Post"
                  className="max-w-md rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* Botão para usar */}
            <button
              onClick={useExtractedPost}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Usar este Post no Editor</span>
            </button>
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">📖 Como usar:</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>Encontre uma notícia interessante (G1, UOL, Folha, etc)</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>Copie o link completo da notícia</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>Cole o link aqui e clique em "Extrair"</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <span>O sistema extrai título, conteúdo e imagem automaticamente</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">5.</span>
            <span>Use a IA para reescrever o texto (evita plágio!)</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">6.</span>
            <span>Adicione seu logo na imagem</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">7.</span>
            <span>Publique nas suas 17 páginas do Facebook!</span>
          </li>
        </ol>
      </div>

      {/* Aviso legal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Aviso:</strong> Sempre use a IA para reescrever o conteúdo e evitar plágio. 
          Adicione créditos à fonte original quando apropriado. Respeite os direitos autorais.
        </p>
      </div>
    </div>
  );
}

export default PostImporter;
