import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config();

console.log('\n🔍 Verificando variáveis de ambiente:\n');

const vars = [
  'FACEBOOK_APP_ID',
  'FACEBOOK_ACCESS_TOKEN',
  'OPENAI_API_KEY',
  'SOURCE_PAGE_IDS'
];

vars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview} (${value.length} caracteres)`);
  } else {
    console.log(`❌ ${varName}: NÃO CONFIGURADO`);
  }
});

console.log('\n');
