import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // This is needed for Expo
});

export async function startSpeechRecognition(audioFile: File, onTranscript: (text: string) => void) {
  try {
    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
    });

    // The API returns a single transcription, not a stream
    onTranscript(response.text);
  } catch (error) {
    console.error('Error in speech recognition:', error);
  }
}
