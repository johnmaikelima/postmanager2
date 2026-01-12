import axios from 'axios';
import cheerio from 'cheerio';

class VideoUrlScraper {
  /**
   * Faz scraping de uma URL e extrai título, conteúdo e imagem
   */
  async scrapeUrl(url) {
    try {
      console.log('🌐 Fazendo scraping de:', url);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extrair título
      let title = $('h1').first().text().trim() ||
                  $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  'Sem título';

      // Extrair conteúdo
      let content = $('article').text().trim() ||
                    $('main').text().trim() ||
                    $('body').text().trim() ||
                    '';

      // Limpar conteúdo (remover scripts, styles, etc)
      $('script, style, noscript').remove();
      content = $('body').text().trim();

      // Remover espaços em branco excessivos
      content = content.replace(/\s+/g, ' ').trim();

      // Limitar a 2000 caracteres
      if (content.length > 2000) {
        content = content.substring(0, 2000) + '...';
      }

      // Extrair imagem
      let image = $('meta[property="og:image"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content') ||
                  $('img').first().attr('src') ||
                  null;

      // Converter URL relativa em absoluta
      if (image && !image.startsWith('http')) {
        const baseUrl = new URL(url);
        image = new URL(image, baseUrl).href;
      }

      // Extrair domínio como fonte
      const source = new URL(url).hostname || 'URL';

      console.log('✅ Scraping concluído');
      console.log('   Título:', title.substring(0, 50) + '...');
      console.log('   Conteúdo:', content.substring(0, 50) + '...');
      console.log('   Imagem:', image ? 'Encontrada' : 'Não encontrada');

      return {
        success: true,
        title,
        content,
        image,
        source,
        url
      };
    } catch (error) {
      console.error('❌ Erro ao fazer scraping:', error.message);
      throw new Error(`Erro ao fazer scraping da URL: ${error.message}`);
    }
  }

  /**
   * Valida se a URL é válida
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Faz scraping e retorna dados prontos para criar notícia
   */
  async extractNewsFromUrl(url) {
    if (!this.isValidUrl(url)) {
      throw new Error('URL inválida');
    }

    const scraped = await this.scrapeUrl(url);

    return {
      title: scraped.title,
      content: scraped.content,
      image: scraped.image,
      source: scraped.source,
      category: 'Geral'
    };
  }
}

export default new VideoUrlScraper();
