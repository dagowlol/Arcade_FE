import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

const AZURE_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const AZURE_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;
const VOICE_NAME = 'en-US-JennyNeural';
const SPEECH_LANG = import.meta.env.VITE_AZURE_SPEECH_LANGUAGE || 'en-US';

export class SpeechService {
  static currentSynthesizer = null;
  static currentPlayer = null;

  /**
   * Speaks the target sentence using Azure Cognitive Services Speech SDK with en-US-JennyNeural voice
   */
  static speak(text, onStart, onEnd) {
    if (!text) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any active playback
    SpeechService.stopSpeaking();

    if (AZURE_KEY && AZURE_REGION) {
      try {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
        speechConfig.speechSynthesisVoiceName = VOICE_NAME;
        speechConfig.speechSynthesisLanguage = SPEECH_LANG;

        const player = new SpeechSDK.SpeakerAudioDestination();
        SpeechService.currentPlayer = player;
        const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);

        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
        SpeechService.currentSynthesizer = synthesizer;

        if (onStart) onStart();

        player.onAudioEnd = () => {
          if (onEnd) onEnd();
        };

        synthesizer.speakTextAsync(
          text,
          (result) => {
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
              // Wait for audio playback to finish via speaker
            } else {
              console.warn('Azure TTS synthesis error:', result.errorDetails);
              SpeechService.fallbackSpeak(text, onStart, onEnd);
            }
            synthesizer.close();
            SpeechService.currentSynthesizer = null;
          },
          (err) => {
            console.error('Azure TTS error:', err);
            synthesizer.close();
            SpeechService.currentSynthesizer = null;
            SpeechService.fallbackSpeak(text, onStart, onEnd);
          }
        );
        return;
      } catch (err) {
        console.warn('Azure TTS init failed, falling back to browser synthesis:', err);
      }
    }

    SpeechService.fallbackSpeak(text, onStart, onEnd);
  }

  static stopSpeaking() {
    if (SpeechService.currentPlayer) {
      try {
        SpeechService.currentPlayer.pause();
        SpeechService.currentPlayer = null;
      } catch {}
    }
    if (SpeechService.currentSynthesizer) {
      try {
        SpeechService.currentSynthesizer.close();
        SpeechService.currentSynthesizer = null;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  static fallbackSpeak(text, onStart, onEnd) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Recognizes speech from microphone using Azure Speech SDK.
   *
   * The transcript is delivered EXACTLY ONCE through the returned promise
   * (resolves to '' when nothing usable was captured). It is deliberately NOT
   * also pushed through an `onRecognized` callback: callers that handled both
   * channels would submit the same answer twice, advancing the challenge twice
   * and inflating the score.
   *
   * `onStart` / `onError` remain callbacks for immediate UI feedback.
   */
  static async recognizeSpeech({ onError, onStart } = {}) {
    if (onStart) onStart();

    if (AZURE_KEY && AZURE_REGION) {
      try {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
        speechConfig.speechRecognitionLanguage = SPEECH_LANG;
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        return new Promise((resolve) => {
          recognizer.recognizeOnceAsync(
            (result) => {
              recognizer.close();
              if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                resolve(result.text.replace(/[.,!?;:]/g, '').trim());
              } else {
                SpeechService.recognizeWithWebSpeech({ onError }).then(resolve);
              }
            },
            (err) => {
              recognizer.close();
              console.warn('Azure Speech error, using fallback:', err);
              SpeechService.recognizeWithWebSpeech({ onError }).then(resolve);
            }
          );
        });
      } catch (err) {
        console.warn('Azure Speech init failed:', err);
      }
    }

    return SpeechService.recognizeWithWebSpeech({ onError });
  }

  static recognizeWithWebSpeech({ onError } = {}) {
    return new Promise((resolve) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        if (onError) onError('Speech recognition not supported in browser.');
        resolve('');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = SPEECH_LANG;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          resolve(event.results[0][0].transcript);
        };

        recognition.onerror = (event) => {
          if (onError) onError(`Speech error: ${event.error}`);
          resolve('');
        };

        recognition.onnomatch = () => {
          if (onError) onError('No match found.');
          resolve('');
        };

        recognition.start();
      } catch (err) {
        if (onError) onError('Microphone access failed.');
        resolve('');
      }
    });
  }
}
