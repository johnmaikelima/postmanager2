import authService from '../services/auth.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token não fornecido' 
    });
  }

  const result = authService.verifyToken(token);

  if (!result.success) {
    return res.status(403).json({ 
      success: false, 
      error: 'Token inválido ou expirado' 
    });
  }

  req.user = result.user;
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acesso negado. Apenas administradores.' 
    });
  }
  next();
};
