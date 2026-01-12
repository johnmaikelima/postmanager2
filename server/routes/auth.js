import express from 'express';
import authService from '../services/auth.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password são obrigatórios'
      });
    }

    const result = await authService.login(username, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verificar token
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token não fornecido'
    });
  }

  const result = authService.verifyToken(token);
  res.json(result);
});

/**
 * GET /api/auth/me
 * Obter dados do usuário logado
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/change-password
 * Alterar senha
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Nova senha deve ter no mínimo 6 caracteres'
      });
    }

    const result = await authService.changePassword(
      req.user.id,
      oldPassword,
      newPassword
    );

    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar senha'
    });
  }
});

/**
 * POST /api/auth/create-user
 * Criar novo usuário (apenas admin)
 */
router.post('/create-user', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Username, password e name são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter no mínimo 6 caracteres'
      });
    }

    const result = await authService.createUser(username, password, name, role);
    res.json(result);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário'
    });
  }
});

export default router;
