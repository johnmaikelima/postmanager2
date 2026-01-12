import React, { useState, useEffect } from 'react';
import { Facebook, Sparkles, Image as ImageIcon, Calendar, Settings, Link2, LogOut, Wand2, RefreshCw, Video, Film, Library } from 'lucide-react';
import Login from './components/Login';
import FeedLoader from './components/FeedLoader';
import PostEditor from './components/PostEditor';
import ImageEditor from './components/ImageEditor';
import ScheduledPosts from './components/ScheduledPosts';
import PostImporter from './components/PostImporter';
import SettingsPage from './components/Settings';
import ContentCreator from './components/ContentCreator';
import QueueManager from './components/QueueManager';
import ReelCreator from './components/ReelCreator';
import VideoGenerator from './pages/VideoGenerator';
import VideoLibrary from './pages/VideoLibrary';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedPost, setSelectedPost] = useState(null);

  // Verificar se já está logado ao carregar
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      // Verificar se token ainda é válido
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: savedToken })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpar
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        })
        .catch(err => {
          console.error('Error verifying token:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'importer', label: 'Importar por Link', icon: Link2 },
    { id: 'feed', label: 'Carregar Posts', icon: Facebook },
    { id: 'editor', label: 'Editor de Posts', icon: Sparkles },
    { id: 'content', label: 'Criar Conteúdo', icon: Wand2 },
    { id: 'reels', label: 'Criar Reels', icon: Video },
    { id: 'video', label: 'Gerar Vídeos', icon: Film },
    { id: 'library', label: 'Biblioteca de Vídeos', icon: Library },
    { id: 'queue', label: 'Fila Automática', icon: RefreshCw },
    { id: 'image', label: 'Editor de Imagens', icon: ImageIcon },
    { id: 'scheduled', label: 'Posts Agendados', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Facebook className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Post Generator</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'library' ? (
          <VideoLibrary />
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {activeTab === 'importer' && <PostImporter onPostImported={handleSelectPost} />}
              {activeTab === 'feed' && <FeedLoader onSelectPost={handleSelectPost} />}
              {activeTab === 'editor' && <PostEditor selectedPost={selectedPost} />}
              {activeTab === 'content' && <ContentCreator />}
              {activeTab === 'reels' && <ReelCreator />}
              {activeTab === 'video' && <VideoGenerator />}
              {activeTab === 'queue' && <QueueManager />}
              {activeTab === 'image' && <ImageEditor />}
              {activeTab === 'scheduled' && <ScheduledPosts />}
              {activeTab === 'settings' && <SettingsPage user={user} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
