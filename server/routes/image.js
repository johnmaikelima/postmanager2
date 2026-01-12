import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import imageService from '../services/image.js';
import imageTemplateService from '../services/imageTemplate.js';
import pageLogoConfigService from '../services/pageLogoConfig.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * POST /api/image/upload
 * Upload de imagem
 */
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    }
  });
});

/**
 * POST /api/image/add-logo
 * Adiciona logo à imagem
 */
router.post('/add-logo', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), async (req, res, next) => {
  try {
    if (!req.files?.image || !req.files?.logo) {
      return res.status(400).json({
        success: false,
        error: 'Both image and logo are required'
      });
    }
    
    const { position = 'bottom-right', opacity = 0.8 } = req.body;
    
    const outputPath = await imageService.addLogo(
      req.files.image[0].path,
      req.files.logo[0].path,
      position,
      parseFloat(opacity)
    );
    
    res.json({
      success: true,
      file: {
        path: outputPath,
        url: `/${outputPath}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/image/remove-area
 * Remove área selecionada da imagem
 */
router.post('/remove-area', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    const { x, y, width, height } = req.body;
    
    if (!x || !y || !width || !height) {
      return res.status(400).json({
        success: false,
        error: 'Mask coordinates (x, y, width, height) are required'
      });
    }
    
    const maskData = {
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height)
    };
    
    const outputPath = await imageService.removeArea(req.file.path, maskData);
    
    res.json({
      success: true,
      file: {
        path: outputPath,
        url: `/${outputPath}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/image/resize
 * Redimensiona imagem
 */
router.post('/resize', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    const { maxWidth = 1200, maxHeight = 1200 } = req.body;
    
    const outputPath = await imageService.resize(
      req.file.path,
      parseInt(maxWidth),
      parseInt(maxHeight)
    );
    
    res.json({
      success: true,
      file: {
        path: outputPath,
        url: `/${outputPath}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/image/optimize
 * Otimiza imagem
 */
router.post('/optimize', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    const outputPath = await imageService.optimize(req.file.path);
    
    res.json({
      success: true,
      file: {
        path: outputPath,
        url: `/${outputPath}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/image/filter
 * Aplica filtro à imagem
 */
router.post('/filter', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    const { filter = 'none' } = req.body;
    
    const outputPath = await imageService.applyFilter(req.file.path, filter);
    
    res.json({
      success: true,
      file: {
        path: outputPath,
        url: `/${outputPath}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/image/create-template
 * Cria template de notícia com degradê e título
 */
router.post('/create-template', async (req, res, next) => {
  try {
    const { imagePath, title, watermark, pageLogoUrl, pageName } = req.body;
    
    if (!imagePath || !title) {
      return res.status(400).json({
        success: false,
        error: 'Image path and title are required'
      });
    }
    
    const result = await imageTemplateService.createNewsTemplate(
      imagePath,
      title,
      { 
        watermark: watermark || '@CURIOSONAUTA',
        pageLogoUrl: pageLogoUrl,
        pageName: pageName || 'PAPEL POP'
      }
    );
    
    res.json({
      success: true,
      file: {
        path: result.path,
        filename: result.filename,
        url: `/uploads/${result.filename}`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/image/logos
 * Lista logos disponíveis na pasta logos/
 */
router.get('/logos', (req, res) => {
  try {
    const logosDir = path.join(process.cwd(), 'logos');
    
    console.log('📁 Pasta de logos:', logosDir);
    
    // Criar pasta se não existir
    if (!fs.existsSync(logosDir)) {
      console.log('⚠️  Pasta logos/ não existe, criando...');
      fs.mkdirSync(logosDir, { recursive: true });
    }
    
    // Ler arquivos da pasta
    const files = fs.readdirSync(logosDir);
    console.log('📄 Arquivos encontrados:', files);
    
    // Filtrar apenas imagens (excluir README.md e outros)
    const logos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        const isImage = ['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext);
        console.log(`   ${file}: ${isImage ? '✅ Imagem' : '❌ Não é imagem'}`);
        return isImage;
      })
      .map(file => ({
        name: file,
        displayName: path.basename(file, path.extname(file))
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        path: `/logos/${file}`,
        fullPath: path.join(logosDir, file)
      }));
    
    console.log(`✅ ${logos.length} logo(s) encontrado(s)`);
    
    res.json({
      success: true,
      logos
    });
  } catch (error) {
    console.error('❌ Error listing logos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/image/upload-logo
 * Upload de logo personalizado
 */
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const logosDir = path.join(process.cwd(), 'logos');
    // Criar pasta se não existir
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos (PNG, JPG, SVG, WEBP)'));
    }
  }
});

router.post('/upload-logo', uploadLogo.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum arquivo enviado'
    });
  }
  
  console.log('✅ Logo enviado:', req.file.filename);
  
  res.json({
    success: true,
    filename: req.file.filename,
    path: `/logos/${req.file.filename}`,
    message: 'Logo enviado com sucesso!'
  });
});

/**
 * GET /api/image/page-logos
 * Lista configuração de logo por página
 */
router.get('/page-logos', authenticateToken, (req, res) => {
  const byPageId = pageLogoConfigService.getAll();
  res.json({ success: true, byPageId });
});

/**
 * PUT /api/image/page-logos/:pageId
 * Configura logo para uma página específica (admin only)
 */
router.put('/page-logos/:pageId', authenticateToken, requireAdmin, (req, res) => {
  const { pageId } = req.params;
  const { logoFilename } = req.body;

  if (!pageId) {
    return res.status(400).json({ success: false, error: 'pageId é obrigatório' });
  }

  if (logoFilename) {
    const logoPath = path.join(process.cwd(), 'logos', logoFilename);
    if (!fs.existsSync(logoPath)) {
      return res.status(400).json({ success: false, error: 'Logo não encontrado no servidor' });
    }
  }

  const result = pageLogoConfigService.setForPage(pageId, logoFilename || null);
  res.json({ success: true, ...result });
});

export default router;
