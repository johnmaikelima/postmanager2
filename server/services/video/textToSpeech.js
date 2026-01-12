import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextToSpeechService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * Inicializa o cliente do Google TTS
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Verificar se credenciais estão configuradas
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT) {
        console.warn('⚠️  Google Cloud credentials não configuradas. Text-to-speech desabilitado.');
        console.warn('   Para usar, configure GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_CLOUD_PROJECT');
        return false;
      }

      this.client = new textToSpeech.TextToSpeechClient();
      this.initialized = true;
      console.log('✅ Google Text-to-Speech inicializado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Google TTS:', error.message);
      return false;
    }
  }

  /**
   * Gera áudio a partir de texto
   * @param {string} text - Texto para converter em áudio
   * @param {object} options - Opções de configuração
   * @returns {Promise<{path: string, duration: number}>}
   */
  async generateAudio(text, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.client) {
        throw new Error('Google TTS não está disponível. Configure as credenciais.');
      }

      const {
        language = 'pt-BR',
        voiceName = 'pt-BR-Neural2-C',
        speakingRate = 1.0,
        pitch = 0.0,
        outputFormat = 'mp3'
      } = options;

      console.log('🎤 Gerando áudio...');
      console.log('   Texto:', text.substring(0, 50) + '...');
      console.log('   Idioma:', language);
      console.log('   Voz:', voiceName);

      const request = {
        input: { text },
        voice: {
          languageCode: language,
          name: voiceName
        },
        audioConfig: {
          audioEncoding: outputFormat.toUpperCase(),
          speakingRate,
          pitch
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      const audioContent = response.audioContent;

      // Salvar arquivo de áudio
      const audioDir = path.join(process.cwd(), 'uploads/audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const audioFilename = `audio_${Date.now()}.${outputFormat}`;
      const audioPath = path.join(audioDir, audioFilename);

      fs.writeFileSync(audioPath, audioContent, 'binary');

      console.log('✅ Áudio gerado:', audioFilename);

      // Calcular duração aproximada (caracteres / 5 caracteres por palavra * 60 / 150 palavras por minuto)
      const estimatedDuration = (text.length / 5) * 60 / 150;

      return {
        path: `/uploads/audio/${audioFilename}`,
        filename: audioFilename,
        duration: Math.round(estimatedDuration * 1000), // em ms
        size: audioContent.length
      };
    } catch (error) {
      console.error('❌ Erro ao gerar áudio:', error.message);
      throw new Error(`Failed to generate audio: ${error.message}`);
    }
  }

  /**
   * Lista vozes disponíveis
   */
  async listVoices(languageCode = 'pt-BR') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.client) {
        return [];
      }

      const [response] = await this.client.listVoices({ languageCode });
      return response.voices.map(voice => ({
        name: voice.name,
        displayName: voice.name,
        languageCodes: voice.languageCodes,
        naturalSampleRateHertz: voice.naturalSampleRateHertz,
        ssmlGender: voice.ssmlGender
      }));
    } catch (error) {
      console.error('Erro ao listar vozes:', error.message);
      return [];
    }
  }

  /**
   * Gera múltiplos áudios para diferentes partes do texto
   */
  async generateAudioChunks(textChunks, options = {}) {
    try {
      const audioChunks = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        console.log(`🎤 Gerando áudio ${i + 1}/${textChunks.length}...`);

        const audio = await this.generateAudio(chunk, options);
        audioChunks.push({
          index: i,
          text: chunk,
          audio
        });
      }

      console.log(`✅ ${audioChunks.length} áudios gerados`);
      return audioChunks;
    } catch (error) {
      console.error('Erro ao gerar chunks de áudio:', error.message);
      throw error;
    }
  }
}

export default new TextToSpeechService();
