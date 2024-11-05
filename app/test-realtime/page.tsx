import React, { useState, useEffect } from 'react';
import { View, Button, Text } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const TestConnection = () => {
  const [status, setStatus] = useState('Not Connected');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [yomiResponse, setYomiResponse] = useState<string>('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioChunks, setAudioChunks] = useState<Uint8Array[]>([]);
  const [audioBase64Chunks, setAudioBase64Chunks] = useState<string[]>([]);

  useEffect(() => {
    const getPermission = async () => {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Audio permission not granted');
      }
    };
    getPermission();
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          numberOfChannels: 1,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          numberOfChannels: 1,
          audioQuality: Audio.IOSAudioQuality.HIGH,
        },
        web: Audio.RecordingOptionsPresets.HIGH_QUALITY.web
      });
      
      setRecording(recording);
      setIsRecording(true);
      setIsListening(true);
      setYomiResponse('');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      const status = await recording.getStatusAsync();
      if (status.durationMillis < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - status.durationMillis));
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      setRecording(null);
      setIsRecording(false);

      // Process and send audio
      const response = await fetch(uri);
      const audioBlob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = () => {
        if (ws && reader.result) {
          const base64Audio = (reader.result as string).split(',')[1];
          
          const message = {
            type: 'message',
            content: {
              type: 'audio',
              audio: base64Audio
            }
          };
          
          ws.send(JSON.stringify(message));
        }
      };

      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsListening(false);
    }
  };

  const playAudioFromBase64 = async (base64Audio: string) => {
    try {
      console.log('Starting audio playback process');
      
      const fileUri = `${FileSystem.cacheDirectory}temp_audio_${Date.now()}.mp3`;
      console.log('Created temp file URI:', fileUri);
      
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Wrote audio data to file');

      if (sound) {
        console.log('Unloading previous sound');
        await sound.unloadAsync();
      }

      console.log('Loading new sound...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, volume: 1.0 },
        (status) => {
          console.log('Playback status update:', status);
        }
      );
      
      console.log('Sound created, attempting to play');
      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
        console.log('Playback status:', status);
        if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
          console.log('Playback finished, cleaning up file');
          await FileSystem.deleteAsync(fileUri).catch(() => {});
        }
      });

    } catch (err: any) {
      console.error('Failed to play audio:', err);
      console.error('Error details:', err?.message || 'Unknown error');
    }
  };

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const connectToServer = () => {
    const socket = new WebSocket('ws://192.168.1.115:8001');
    
    socket.onopen = () => {
      setStatus('Connected');
      socket.send(JSON.stringify({ type: 'connection.check' }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle text responses
        if (data.type === 'response.audio_transcript.done') {
          console.log('Received transcript:', data.transcript);
          setYomiResponse(data.transcript);
          setIsListening(false);
        }
        
        // Handle audio responses
        if (data.type === 'response.audio.delta' && data.audio) {
          console.log('Received audio chunk, length:', data.audio.length);
          await playAudioFromBase64(data.audio);
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    socket.onerror = () => {
      setStatus('Error: Connection failed');
      setIsListening(false);
    };

    socket.onclose = () => {
      setStatus('Disconnected');
      setIsListening(false);
    };

    setWs(socket);
  };

  const disconnectFromServer = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Connection status - subtle indicator */}
      <Text style={{ 
        fontSize: 14, 
        color: status === 'Connected' ? '#4CAF50' : '#F44336',
        marginBottom: 20 
      }}>
        ●
      </Text>

      {/* Connect/Disconnect button */}
      <Button 
        title={ws ? "Disconnect" : "Connect"} 
        onPress={ws ? disconnectFromServer : connectToServer}
      />
      
      {/* Recording button with listening indicator */}
      {ws && (
        <View style={{ marginTop: 20 }}>
          <Button
            title={isRecording ? "Stop" : "Start"}
            onPress={isRecording ? stopRecording : startRecording}
          />
          {isListening && (
            <Text style={{ 
              textAlign: 'center', 
              marginTop: 10,
              color: '#666'
            }}>
              Listening...
            </Text>
          )}
        </View>
      )}

      {/* Yomi's response */}
      {yomiResponse && (
        <View style={{ 
          marginTop: 20, 
          padding: 15,
          backgroundColor: '#f5f5f5',
          borderRadius: 8
        }}>
          <Text style={{ color: '#333' }}>{yomiResponse}</Text>
        </View>
      )}
    </View>
  );
};

export default TestConnection;