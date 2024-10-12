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

export async function startSpeechRecognition(audioBase64: string, onTranscript: (text: string) => void) {
  try {
    // Create a temporary file with the base64 content
    const tempFilePath = `${FileSystem.cacheDirectory}temp_audio.m4a`;
    await FileSystem.writeAsStringAsync(tempFilePath, audioBase64, { encoding: FileSystem.EncodingType.Base64 });

    // Check if the file was created successfully
    const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
    if (!fileInfo.exists) {
      throw new Error('Temporary audio file does not exist');
    }

    console.log("Temp file created successfully:", tempFilePath);

    // Create a FormData object
    const formData = new FormData();
    formData.append('file', {
      uri: tempFilePath,
      name: 'audio.m4a',
      type: 'audio/m4a'
    } as any);
    formData.append('model', 'whisper-1');

    // Use fetch to make the request
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    onTranscript(result.text);

    // Clean up the temporary file
    await FileSystem.deleteAsync(tempFilePath);
  } catch (error) {
    console.error('Error in speech recognition:', error);
    throw error;
  }
}

async function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  const response = await fetch(`data:${mimeType};base64,${base64}`);
  return response.blob();
}
