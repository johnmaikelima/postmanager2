import dotenv from 'dotenv';

// IMPORTANTE: Carregar .env ANTES de importar qualquer coisa
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import facebookRoutes from './routes/facebook.js';
import aiRoutes from './routes/ai.js';
import imageRoutes from './routes/image.js';
import postRoutes from './routes/post.js';
import scraperRoutes from './routes/scraper.js';
import contentRoutes from './routes/content.js';
import reelsRoutes from './routes/reels.js';
import videoRoutes from './routes/video.js';
import videoNewsRoutes from './routes/videoNews.js';
import { setupQueues } from './services/queue.js';
import contentQueue from './services/contentQueue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Verificar variáveis de ambiente
console.log('🔍 Verificando configurações:');
console.log('   Facebook App ID:', process.env.FACEBOOK_APP_ID ? '✅ Configurado' : '❌ Não encontrado');
console.log('   Facebook Access Token:', process.env.FACEBOOK_ACCESS_TOKEN ? `✅ Configurado (${process.env.FACEBOOK_ACCESS_TOKEN.substring(0, 20)}...)` : '❌ Não encontrado');
console.log('   OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não encontrado');
console.log('   Redis Host:', process.env.REDIS_HOST || 'localhost');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

// Em produção, permitir a própria origem
const corsOptions = process.env.NODE_ENV === 'production' 
  ? { origin: true, credentials: true }
  : { origin: allowedOrigins, credentials: true };

app.use(cors(corsOptions));

// Segurança
if (process.env.NODE_ENV === 'production') {
  // Helmet desabilitado temporariamente para debug
  // app.use(helmet({
  //   contentSecurityPolicy: false,
  //   crossOriginEmbedderPolicy: false,
  // }));
}

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));
app.use('/logos', express.static('logos'));

// Servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  console.log('📁 Servindo frontend de:', distPath);
  console.log('📁 __dirname:', __dirname);
  console.log('📁 Caminho absoluto dist:', path.resolve(distPath));
  
  // Verificar se dist existe
  if (fs.existsSync(distPath)) {
    console.log('✅ Pasta dist/ encontrada!');
    const files = fs.readdirSync(distPath);
    console.log('📄 Arquivos em dist/:', files);
    
    // Verificar index.html
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html encontrado!');
    } else {
      console.error('❌ index.html NÃO encontrado!');
    }
  } else {
    console.error('❌ ERRO: Pasta dist/ não encontrada!');
    console.error('   Build não foi executado ou falhou.');
    console.error('   Listando arquivos no diretório pai:');
    try {
      const parentFiles = fs.readdirSync(path.join(__dirname, '..'));
      console.error('   Arquivos:', parentFiles);
    } catch (e) {
      console.error('   Erro ao listar:', e.message);
    }
  }
  
  app.use(express.static(distPath, {
    setHeaders: (res, filepath) => {
      console.log('📤 Servindo arquivo:', filepath);
      // Configurar MIME types corretos
      if (filepath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filepath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filepath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filepath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    }
  }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/video-news', videoNewsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota raiz em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Post Generator API',
      status: 'running',
      frontend: 'http://localhost:5173',
      docs: {
        health: '/health',
        api: '/api/*'
      }
    });
  });
}

// SPA fallback em produção (todas as rotas não-API retornam index.html)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../dist/index.html');
    res.sendFile(indexPath);
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Inicializar filas e servidor
(async () => {
  try {
    // Inicializar filas
    await setupQueues();
    
    // Inicializar fila recorrente de conteúdo
    contentQueue.initialize();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Access: http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
