import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

console.log("OpenAI API Key:", process.env.EXPO_PUBLIC_OPENAI_API_KEY);

function isValidBase64(str: string) {
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}

export async function startSpeechRecognition(
  getAudioBase64: () => Promise<string | null>,
  onTranscript: (text: string) => void
) {
  try {
    console.log("Starting speech recognition...");

    const processAudio = async () => {
      const audioBase64 = await getAudioBase64();
      if (!audioBase64) {
        console.log("No audio data available");
        return;
      }

      // Create a temporary file with the base64 content
      const tempFilePath = `${FileSystem.cacheDirectory}temp_audio.m4a`;
      await FileSystem.writeAsStringAsync(tempFilePath, audioBase64, { encoding: FileSystem.EncodingType.Base64 });

      // Read the file as a Uint8Array
      const fileContent = await FileSystem.readAsStringAsync(tempFilePath, { encoding: FileSystem.EncodingType.Base64 });
      const uint8Array = new Uint8Array(Buffer.from(fileContent, 'base64'));

      // Create a File object
      const file = new File([uint8Array], 'audio.m4a', { type: 'audio/m4a' });

      // Send the audio to OpenAI API
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
      });

      console.log("Transcription response:", response);

      if (response.text) {
        onTranscript(response.text);
      }

      // Schedule the next processing after a delay
      setTimeout(processAudio, 5000); // Process every 5 seconds
    };

    // Start the initial processing
    processAudio();

  } catch (error) {
    console.error('Error in speech recognition:', error);
    throw error;
  }
}

async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const response = await fetch(`data:${mimeType};base64,${base64}`);
  return response.blob();
}
