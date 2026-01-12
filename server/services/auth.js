import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

class AuthService {
  constructor() {
    this.ensureUsersFile();
  }

  ensureUsersFile() {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Verificar se arquivo existe e tem usuários
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        users = JSON.parse(data);
      } catch (error) {
        console.error('❌ Erro ao ler users.json:', error.message);
        users = [];
      }
    }
    
    // Se não tiver usuários, criar admin padrão
    if (users.length === 0) {
      console.log('📝 Criando usuário admin padrão...');
      const defaultUsers = [
        {
          id: '1',
          username: 'admin',
          password: bcrypt.hashSync('admin123', 10),
          name: 'Administrador',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');
    }
  }

  getUsers() {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users file:', error);
      return [];
    }
  }

  saveUsers(users) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving users file:', error);
      return false;
    }
  }

  async login(username, password) {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.username === username);

      if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return { success: false, error: 'Senha incorreta' };
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token válido por 7 dias
      );

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { success: true, user: decoded };
    } catch (error) {
      return { success: false, error: 'Token inválido ou expirado' };
    }
  }

  async createUser(username, password, name, role = 'user') {
    try {
      const users = this.getUsers();

      // Verificar se usuário já existe
      if (users.find(u => u.username === username)) {
        return { success: false, error: 'Usuário já existe' };
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        id: String(users.length + 1),
        username,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);

      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role
        }
      };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Erro ao criar usuário' };
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const user = users[userIndex];
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        return { success: false, error: 'Senha atual incorreta' };
      }

      // Hash da nova senha
      users[userIndex].password = await bcrypt.hash(newPassword, 10);
      this.saveUsers(users);

      return { success: true, message: 'Senha alterada com sucesso' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Erro ao alterar senha' };
    }
  }
}

export default new AuthService();
