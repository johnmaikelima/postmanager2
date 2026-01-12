import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    // Não inicializar aqui, inicializar quando for usar
    this._client = null;
  }
  
  get client() {
    if (!this._client && process.env.OPENAI_API_KEY) {
      this._client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this._client;
  }
  
  get apiKey() {
    return process.env.OPENAI_API_KEY;
  }

  isConfigured() {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Remove emojis de títulos (primeira linha do texto)
   */
  removeEmojisFromTitle(text) {
    const lines = text.split('\n');
    if (lines.length === 0) return text;
    
    // Remover emojis apenas da primeira linha (título)
    const emojiRegex = /[\p{Emoji}]/gu;
    lines[0] = lines[0].replace(emojiRegex, '').trim();
    
    return lines.join('\n');
  }

  /**
   * Censura palavras sensíveis para evitar banimento no Facebook
   */
  censorSensitiveWords(text) {
    const sensitiveWords = {
      // Violência
      'matar': 'm@tar',
      'matou': 'm@tou',
      'morte': 'm0rte',
      'morto': 'm0rto',
      'morreu': 'm0rreu',
      'assassinato': 'ass@ssinato',
      'assassino': 'ass@ssino',
      'assassinou': 'ass@ssinou',
      'estupro': 'est*pro',
      'estuprador': 'est*prador',
      'estuprou': 'est*prou',
      'violência': 'vi0lência',
      'violento': 'vi0lento',
      'agressão': 'agr3ssão',
      'agrediu': 'agr3diu',
      'espancamento': 'esp@ncamento',
      'espancou': 'esp@ncou',
      
      // Sexual
      'sexo': 's3xo',
      'sexual': 's3xual',
      'pornografia': 'p0rnografia',
      'pornográfico': 'p0rnográfico',
      'pedofilia': 'p3dofilia',
      'pedófilo': 'p3dófilo',
      'abuso': '@buso',
      'abusou': '@busou',
      'exploração': 'expl0ração',
      'explorou': 'expl0rou'
    };

    let censoredText = text;
    
    for (const [word, censored] of Object.entries(sensitiveWords)) {
      // Case insensitive replacement
      const regex = new RegExp(word, 'gi');
      censoredText = censoredText.replace(regex, (match) => {
        // Preserva capitalização
        if (match[0] === match[0].toUpperCase()) {
          return censored.charAt(0).toUpperCase() + censored.slice(1);
        }
        return censored;
      });
    }
    
    return censoredText;
  }

  /**
   * Reescreve um texto mantendo o contexto mas evitando plágio
   */
  async rewriteText(originalText, tone = 'professional', instructions = '') {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      console.log('🔑 API Key configurada:', this.apiKey ? 'Sim' : 'Não');
      console.log('🔑 Primeiros caracteres:', this.apiKey?.substring(0, 10) + '...');
      
      // Definir características do tom
      const toneDescriptions = {
        professional: 'profissional, sério e respeitoso',
        journalistic: 'jornalístico, imparcial, factual e objetivo, como uma notícia de jornal',
        sensationalist: 'sensacionalista, chamativo, com títulos impactantes e linguagem que gera curiosidade',
        casual: 'casual e descontraído',
        friendly: 'amigável e acolhedor',
        enthusiastic: 'entusiasta e animado',
        formal: 'formal e técnico'
      };

      const systemPrompt = `Você é um especialista em reescrever conteúdo para redes sociais, especialmente Facebook.

REGRAS IMPORTANTES:
1. Reescreva o texto mantendo a mensagem principal, mas com palavras e estrutura completamente diferentes
2. Mantenha a formatação com parágrafos bem separados (use quebras de linha duplas entre parágrafos)
3. O texto deve ser original, engajante e adequado para Facebook
4. Use emojis relevantes no início de parágrafos importantes (máximo 3 emojis no texto todo)
5. Mantenha o título destacado se houver
6. Organize o texto em parágrafos curtos e fáceis de ler (3-4 linhas por parágrafo)
7. Tom desejado: ${toneDescriptions[tone] || tone}
8. NUNCA use palavras explícitas de violência ou conteúdo sexual - use termos mais suaves

RESUMO E PONTOS IMPORTANTES:
9. Se o texto for muito longo (mais de 1500 caracteres), resuma mantendo:
   - TODOS os fatos principais e datas importantes
   - TODOS os nomes de pessoas, lugares e instituições mencionadas
   - TODAS as declarações e citações relevantes
   - Números, valores e estatísticas importantes
   - Contexto necessário para entender a notícia
10. NUNCA omita informações essenciais para compreensão da notícia
11. Priorize: Quem? O quê? Quando? Onde? Por quê? Como?
12. Mantenha a ordem cronológica dos eventos se houver

FORMATAÇÃO DE CITAÇÕES E FALAS - REGRA CRÍTICA:
13. ⚠️ PRESERVAR CITAÇÕES LITERALMENTE: Se o texto original contém uma fala entre aspas ou após "disse", "afirmou", "declarou", etc., COPIE EXATAMENTE COMO ESTÁ. NÃO PARAFRASEAR CITAÇÕES.
14. SEMPRE coloque falas e declarações entre aspas duplas ("...")
15. SEMPRE identifique quem disse, usando o formato: "Fala aqui", disse/afirmou/declarou Nome da Pessoa
16. Se houver cargo ou contexto, inclua: "Fala aqui", afirmou Nome, cargo/contexto
17. Exemplos corretos:
   - "Estou muito feliz com o resultado", disse João Silva
   - "A situação é preocupante", afirmou a médica Maria Santos
   - "Vamos investigar o caso", declarou o delegado responsável
18. Separe citações em parágrafos próprios quando forem longas
19. ⚠️ IMPORTANTE: Reescreva apenas a narrativa (texto fora das aspas). As falas entre aspas devem permanecer IDÊNTICAS ao original.

${instructions ? `Instruções adicionais: ${instructions}` : ''}`;

      console.log('📤 Enviando requisição para OpenAI...');
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Reescreva este texto mantendo a formatação com parágrafos bem separados.

INSTRUÇÕES CRÍTICAS:
1. ⚠️ CITAÇÕES DEVEM SER IDÊNTICAS: Se o texto original tem uma fala entre aspas ("..."), COPIE EXATAMENTE COMO ESTÁ. Não mude nada na citação.
2. Reescreva APENAS a narrativa (texto fora das aspas), não as falas.
3. Se houver falas ou declarações de pessoas, coloque entre aspas ("...") e identifique claramente quem disse
4. Se o texto for longo, resuma MAS mantenha TODOS os pontos importantes:
   * Nomes de pessoas, lugares e instituições
   * Datas e números relevantes
   * Todas as declarações importantes (EXATAMENTE como no original)
   * Fatos essenciais para entender a notícia
5. NUNCA omita informações cruciais
6. NUNCA parafrasear citações - copie literalmente

Texto original:
${originalText}` }
        ],
        temperature: tone === 'sensationalist' ? 0.9 : 0.8,
        max_tokens: 2000
      });

      console.log('✅ Resposta recebida da OpenAI!');
      
      // Aplicar censura automática de palavras sensíveis
      const rewrittenText = response.choices[0].message.content.trim();
      const censoredText = this.censorSensitiveWords(rewrittenText);
      
      console.log('🔒 Censura aplicada');
      
      // Remover emojis dos títulos (primeira linha)
      const finalText = this.removeEmojisFromTitle(censoredText);
      
      console.log('✨ Emojis removidos dos títulos');
      
      return finalText;
    } catch (error) {
      console.error('❌ Erro detalhado da OpenAI:');
      console.error('   Tipo:', error.constructor.name);
      console.error('   Mensagem:', error.message);
      console.error('   Status:', error.status);
      console.error('   Code:', error.code);
      console.error('   Response:', error.response?.data);
      throw new Error(`Failed to rewrite text: ${error.message}`);
    }
  }

  /**
   * Gera variações de um texto
   */
  async generateVariations(text, count = 3) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const variations = [];
      
      for (let i = 0; i < count; i++) {
        const rewritten = await this.rewriteText(text, 'professional', `Variação ${i + 1}`);
        variations.push(rewritten);
      }

      return variations;
    } catch (error) {
      console.error('Error generating variations:', error.message);
      throw new Error(`Failed to generate variations: ${error.message}`);
    }
  }

  /**
   * Gera hashtags relevantes para o conteúdo
   */
  async generateHashtags(text, count = 5) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em marketing de redes sociais. Gere hashtags relevantes e populares baseadas no conteúdo fornecido.'
          },
          {
            role: 'user',
            content: `Gere ${count} hashtags relevantes para este conteúdo:\n\n${text}\n\nRetorne apenas as hashtags, uma por linha, com #.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const hashtags = response.choices[0].message.content
        .trim()
        .split('\n')
        .filter(h => h.startsWith('#'));

      return hashtags;
    } catch (error) {
      console.error('Error generating hashtags:', error.message);
      throw new Error(`Failed to generate hashtags: ${error.message}`);
    }
  }

  /**
   * Analisa o sentimento e sugere melhorias
   */
  async analyzeAndSuggest(text) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.');
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analise o texto e forneça feedback sobre tom, engajamento e sugestões de melhoria.'
          },
          {
            role: 'user',
            content: `Analise este texto:\n\n${text}\n\nForneça:\n1. Tom (positivo/neutro/negativo)\n2. Nível de engajamento (1-10)\n3. Sugestões de melhoria`
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error analyzing text:', error.message);
      throw new Error(`Failed to analyze text: ${error.message}`);
    }
  }
}

export default new OpenAIService();
