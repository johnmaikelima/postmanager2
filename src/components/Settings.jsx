import React, { useEffect, useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

function Settings({ user }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [pages, setPages] = useState([]);
  const [logos, setLogos] = useState([]);
  const [pageLogos, setPageLogos] = useState({});
  const [savingPageLogos, setSavingPageLogos] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');

        const [pagesRes, logosRes, mappingRes] = await Promise.all([
          fetch('/api/facebook/pages'),
          fetch('/api/image/logos'),
          fetch('/api/image/page-logos', {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          })
        ]);

        const pagesData = await pagesRes.json();
        const logosData = await logosRes.json();
        const mappingData = await mappingRes.json();

        if (pagesData.success) setPages(pagesData.pages || []);
        if (logosData.success) setLogos(logosData.logos || []);
        if (mappingData.success) setPageLogos(mappingData.byPageId || {});
      } catch (err) {
        console.error('Error loading page logo settings:', err);
      }
    };

    load();
  }, []);

  const updatePageLogoLocal = (pageId, logoFilename) => {
    setPageLogos((prev) => ({
      ...prev,
      [pageId]: logoFilename || undefined
    }));
  };

  const savePageLogo = async (pageId) => {
    try {
      setSavingPageLogos(true);
      const token = localStorage.getItem('token');

      const logoFilename = pageLogos[pageId] || null;
      const response = await fetch(`/api/image/page-logos/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ logoFilename })
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Erro ao salvar logo da página');
      } else {
        alert('Logo da página salvo com sucesso!');
      }
    } catch (err) {
      console.error('Error saving page logo:', err);
      alert('Erro ao salvar logo da página');
    } finally {
      setSavingPageLogos(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validações
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao alterar senha' });
      }
    } catch (err) {
      console.error('Change password error:', err);
      setMessage({ type: 'error', text: 'Erro ao conectar com o servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
            <p className="text-sm text-gray-600">Altere sua senha de acesso</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-medium text-gray-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Usuário</p>
              <p className="font-medium text-gray-900">@{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`flex items-center space-x-2 p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Atual
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite sua senha atual"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite a nova senha (mínimo 6 caracteres)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite a nova senha novamente"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Salvando...' : 'Alterar Senha'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Logo por Página</h3>
            <p className="text-sm text-gray-600">
              Vincule um logo enviado (pasta logos/) a uma página específica. No editor, use a opção "Automático".
            </p>
          </div>

          {pages.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhuma página encontrada.</div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div key={page.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{page.name}</div>
                      <div className="text-xs text-gray-600">{page.id}</div>
                    </div>

                    <select
                      value={pageLogos[page.id] || ''}
                      onChange={(e) => updatePageLogoLocal(page.id, e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="">(Nenhum) - usar logo do Facebook</option>
                      {logos.map((logo) => (
                        <option key={logo.name} value={logo.name}>
                          {logo.displayName}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={savingPageLogos}
                      onClick={() => savePageLogo(page.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">💡 Dicas de Segurança:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use no mínimo 8 caracteres</li>
            <li>• Combine letras, números e símbolos</li>
            <li>• Não use senhas óbvias como "123456" ou "admin123"</li>
            <li>• Não compartilhe sua senha com ninguém</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
