import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

let isProcessing = false;
let isListening = false;
let silenceTimer: NodeJS.Timeout | null = null;
const SILENCE_DURATION = 1500; // 1.5 seconds of silence before stopping

function isValidBase64(str: string) {
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}

export async function startSpeechRecognition(
  getAudioUri: () => Promise<string | null>,
  onTranscript: (text: string) => void,
  onSpeechEnd: () => void
) {
  console.log("Starting speech recognition...");
  isListening = true;

  const processAudio = async () => {
    if (!isListening) return;

    try {
      const audioUri = await getAudioUri();
      if (!audioUri) {
        console.log("No audio data available, waiting for voice...");
        return;
      }

      console.log("Audio data received, processing...");

      // Reset the silence timer
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        console.log("Silence detected, stopping speech recognition");
        isListening = false;
        onSpeechEnd();
      }, SILENCE_DURATION);

      // Create FormData and send to API
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a'
      } as any);
      formData.append('model', 'whisper-1');

      console.log("Sending audio to OpenAI API...");
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log("Transcription response:", result);

      if (result.text) {
        onTranscript(result.text);
      }

      // Continue listening if speech is ongoing
      if (isListening) {
        requestAnimationFrame(processAudio);
      }
    } catch (error) {
      console.error('Error in speech recognition:', error);
      isListening = false;
      onSpeechEnd();
    }
  };

  // Start the initial processing
  processAudio();
}

export function stopSpeechRecognition() {
  isListening = false;
  if (silenceTimer) clearTimeout(silenceTimer);
}

async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const response = await fetch(`data:${mimeType};base64,${base64}`);
  return response.blob();
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  console.log("Starting transcription for audio:", audioUri);

  try {
    // Read the file as base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });

    console.log("Audio file read as base64, length:", base64Audio.length);

    // Create FormData
    const formData = new FormData();
    formData.append('file', {
      uri: `data:audio/m4a;base64,${base64Audio}`,
      type: 'audio/m4a',
      name: 'audio.m4a'
    } as any);
    formData.append('model', 'whisper-1');

    console.log("Sending audio to OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log("Transcription response:", result);

    return result.text || '';
  } catch (error) {
    console.error('Error in speech recognition:', error);
    throw error;
  }
}
