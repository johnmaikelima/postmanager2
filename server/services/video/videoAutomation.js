import axios from 'axios';

class VideoAutomationService {
  /**
   * Gera roteiro automático dividindo o conteúdo em cenas
   */
  generateScenario(content) {
    try {
      console.log('📝 Gerando roteiro automático...');

      // Dividir em parágrafos
      const paragraphs = content
        .split('\n')
        .filter(p => p.trim().length > 0);

      // Agrupar parágrafos em cenas (máximo 3 parágrafos por cena)
      const scenes = [];
      let currentScene = [];

      for (const paragraph of paragraphs) {
        currentScene.push(paragraph);

        // Se atingiu 3 parágrafos ou é o último, criar cena
        if (currentScene.length >= 3 || paragraph === paragraphs[paragraphs.length - 1]) {
          scenes.push({
            id: `scene_${Date.now()}_${Math.random()}`,
            title: this.generateSceneTitle(currentScene),
            content: currentScene.join(' '),
            duration: this.estimateDuration(currentScene.join(' ')),
            imageKeywords: this.extractKeywords(currentScene.join(' '))
          });
          currentScene = [];
        }
      }

      console.log(`✅ ${scenes.length} cenas geradas`);

      return {
        success: true,
        scenes,
        totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0)
      };
    } catch (error) {
      console.error('Erro ao gerar roteiro:', error.message);
      throw error;
    }
  }

  /**
   * Gera título para a cena baseado no conteúdo
   */
  generateSceneTitle(paragraphs) {
    const text = paragraphs.join(' ');
    const words = text.split(' ').slice(0, 5).join(' ');
    return words.length > 50 ? words.substring(0, 50) + '...' : words;
  }

  /**
   * Estima duração da cena (aproximadamente 1 segundo por 10 palavras)
   */
  estimateDuration(text) {
    const wordCount = text.split(' ').length;
    const estimatedSeconds = Math.ceil(wordCount / 15); // ~15 palavras por segundo
    return Math.max(3, Math.min(10, estimatedSeconds)); // Entre 3 e 10 segundos
  }

  /**
   * Extrai palavras-chave para busca de imagens
   */
  extractKeywords(text) {
    // Palavras comuns a ignorar
    const stopwords = [
      'o', 'a', 'de', 'da', 'do', 'e', 'é', 'em', 'para', 'com', 'por',
      'que', 'um', 'uma', 'os', 'as', 'dos', 'das', 'foi', 'ser', 'está',
      'são', 'tem', 'tinha', 'sido', 'ao', 'ele', 'ela', 'eles', 'elas',
      'você', 'nós', 'vós', 'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa'
    ];

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.includes(word));

    // Retornar as 3 palavras mais relevantes
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * Sugere imagens para cada cena
   */
  suggestImages(scenes) {
    try {
      console.log('🖼️ Sugerindo imagens para as cenas...');

      const suggestions = scenes.map(scene => ({
        sceneId: scene.id,
        sceneTitle: scene.title,
        keywords: scene.imageKeywords,
        searchQueries: [
          scene.imageKeywords.join(' '),
          scene.imageKeywords[0],
          scene.imageKeywords.slice(0, 2).join(' ')
        ].filter(Boolean)
      }));

      console.log(`✅ Sugestões geradas para ${suggestions.length} cenas`);

      return {
        success: true,
        suggestions
      };
    } catch (error) {
      console.error('Erro ao sugerir imagens:', error.message);
      throw error;
    }
  }

  /**
   * Busca imagens usando Unsplash API
   */
  async searchImages(query, count = 1) {
    try {
      console.log(`🔍 Buscando imagens para: "${query}"`);

      // Usar Unsplash API (gratuita)
      const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

      if (!unsplashAccessKey) {
        console.warn('⚠️ UNSPLASH_ACCESS_KEY não configurada, usando imagens placeholder');
        return {
          success: true,
          images: Array(count).fill(null).map((_, i) => ({
            url: `https://picsum.photos/1920/1080?random=${Date.now() + i}`,
            source: 'placeholder',
            title: query
          }))
        };
      }

      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query,
          per_page: count,
          orientation: 'landscape'
        },
        headers: {
          'Authorization': `Client-ID ${unsplashAccessKey}`
        }
      });

      const images = response.data.results.map(photo => ({
        url: photo.urls.regular,
        source: 'unsplash',
        title: photo.description || photo.alt_description || query,
        photographer: photo.user.name,
        downloadUrl: photo.links.download
      }));

      console.log(`✅ ${images.length} imagens encontradas`);

      return {
        success: true,
        images
      };
    } catch (error) {
      console.error('Erro ao buscar imagens:', error.message);
      // Retornar imagens placeholder em caso de erro
      return {
        success: true,
        images: Array(count).fill(null).map((_, i) => ({
          url: `https://picsum.photos/1920/1080?random=${Date.now() + i}`,
          source: 'placeholder',
          title: query
        }))
      };
    }
  }

  /**
   * Automatiza todo o processo
   */
  async automateVideoCreation(content) {
    try {
      console.log('🤖 Iniciando automação completa...');

      // 1. Gerar roteiro
      const scenarioResult = this.generateScenario(content);

      // 2. Sugerir imagens
      const suggestionsResult = this.suggestImages(scenarioResult.scenes);

      // 3. Buscar imagens para cada cena
      const imagesPerScene = {};
      for (const suggestion of suggestionsResult.suggestions) {
        const searchQuery = suggestion.searchQueries[0];
        const imageResult = await this.searchImages(searchQuery, 1);
        imagesPerScene[suggestion.sceneId] = imageResult.images[0];
      }

      console.log('✅ Automação completa!');

      return {
        success: true,
        scenario: scenarioResult,
        suggestions: suggestionsResult,
        images: imagesPerScene
      };
    } catch (error) {
      console.error('Erro na automação:', error.message);
      throw error;
    }
  }
}

export default new VideoAutomationService();
