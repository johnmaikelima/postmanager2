import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'server/data/users.json');

async function resetPassword() {
  try {
    // Ler arquivo de usuários
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    // Encontrar admin
    const adminIndex = users.findIndex(u => u.username === 'admin');
    
    if (adminIndex === -1) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }
    
    // Gerar novo hash para senha "admin123"
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    users[adminIndex].password = hashedPassword;
    
    // Salvar arquivo
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    console.log('✅ Senha do admin resetada com sucesso!');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  }
}

resetPassword();
