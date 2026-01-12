import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const testToken = async () => {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  
  console.log('\n🔍 Testando token do Facebook...\n');
  
  if (!token) {
    console.log('❌ FACEBOOK_ACCESS_TOKEN não encontrado no .env\n');
    return;
  }
  
  console.log('Token encontrado:', token.substring(0, 20) + '...\n');
  
  try {
    // Testar token
    const response = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: { access_token: token }
    });
    
    console.log('✅ Token VÁLIDO!\n');
    console.log('Usuário:', response.data.name);
    console.log('ID:', response.data.id);
    
    // Testar permissões
    console.log('\n🔍 Verificando permissões...\n');
    
    const permsResponse = await axios.get('https://graph.facebook.com/v18.0/me/permissions', {
      params: { access_token: token }
    });
    
    const permissions = permsResponse.data.data;
    const granted = permissions.filter(p => p.status === 'granted');
    
    console.log('Permissões concedidas:');
    granted.forEach(p => console.log('  ✅', p.permission));
    
    // Verificar permissões necessárias
    const required = ['pages_read_engagement', 'pages_manage_posts', 'pages_show_list'];
    const missing = required.filter(r => !granted.find(g => g.permission === r));
    
    if (missing.length > 0) {
      console.log('\n⚠️  Permissões faltando:');
      missing.forEach(p => console.log('  ❌', p));
      console.log('\nGere um novo token com essas permissões!');
    } else {
      console.log('\n✅ Todas as permissões necessárias estão OK!');
    }
    
    // Testar buscar páginas
    console.log('\n🔍 Buscando suas páginas...\n');
    
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: token }
    });
    
    const pages = pagesResponse.data.data;
    
    if (pages.length > 0) {
      console.log(`✅ ${pages.length} página(s) encontrada(s):\n`);
      pages.forEach(page => {
        console.log(`  📄 ${page.name} (ID: ${page.id})`);
      });
    } else {
      console.log('⚠️  Nenhuma página encontrada. Você é admin de alguma página?');
    }
    
  } catch (error) {
    console.log('❌ Token INVÁLIDO!\n');
    console.log('Erro:', error.response?.data?.error?.message || error.message);
    console.log('\n🔧 Solução:');
    console.log('1. Acesse: https://developers.facebook.com/tools/explorer/600462586149427/');
    console.log('2. Gere um novo token de usuário');
    console.log('3. Marque as permissões necessárias');
    console.log('4. Estenda o token em: https://developers.facebook.com/tools/debug/accesstoken/');
    console.log('5. Atualize o .env com o novo token');
    console.log('6. Rode este script novamente\n');
  }
};

testToken();
