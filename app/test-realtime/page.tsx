import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import { colors, fonts, layout } from '../styles/globalStyles'; // Adjust the import path as needed

enum ConnectionState {
  DISCONNECTED = 'Disconnected',
  CONNECTING = 'Connecting...',
  CONNECTED = 'Connected',
  ERROR = 'Error',
}

const TestRealtime: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        console.log('Closing WebSocket connection');
        socketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    console.log('Attempting to connect to WebSocket');
    setConnectionState(ConnectionState.CONNECTING);
    try {
      socketRef.current = new WebSocket('ws://192.168.1.115:8000'); // Replace with your actual IP

      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionState(ConnectionState.CONNECTED);
        setErrorMessage('');
      };

      socketRef.current.onmessage = (event) => {
        console.log('Received message:', event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          setTranscription(prev => prev + ' ' + data.text);
        }
      };

      socketRef.current.onerror = (event: Event) => {
        console.error('WebSocket error:', event);
        console.error('Error details:', JSON.stringify(event, Object.getOwnPropertyNames(event)));
        setConnectionState(ConnectionState.ERROR);
        setErrorMessage(`WebSocket connection error: ${(event as any).message}`);
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionState(ConnectionState.DISCONNECTED);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionState(ConnectionState.ERROR);
      setErrorMessage(`Failed to create WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Requesting audio recording permissions');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting audio recording');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 16000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setErrorMessage('');

      console.log('Audio recording started');
      sendAudioData();
    } catch (error) {
      console.error('Failed to start recording', error);
      setErrorMessage('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      console.log('Stopping audio recording');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      console.log('Audio recording stopped');
      
      if (uri && socketRef.current?.readyState === WebSocket.OPEN) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = function() {
          const base64data = reader.result as string;
          socketRef.current?.send(JSON.stringify({ 
            type: 'audio', 
            audio: base64data.split(',')[1] 
          }));
          socketRef.current?.send(JSON.stringify({ type: 'end' }));
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const sendAudioData = async () => {
    // Remove this function as we're now sending the entire audio file at once
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <Text style={styles.title}>WebSocket Test</Text>
          <Text style={styles.statusText}>Status: {connectionState}</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <TouchableOpacity
            style={[styles.button, connectionState !== ConnectionState.CONNECTED && styles.disabledButton]}
            onPress={toggleRecording}
            disabled={connectionState !== ConnectionState.CONNECTED}
          >
            <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
          </TouchableOpacity>
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionTitle}>Transcription:</Text>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.padding,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: layout.spacing * 2,
  },
  statusText: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: layout.spacing,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.error,
    marginBottom: layout.spacing,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: layout.spacing * 2,
  },
  disabledButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.buttonText,
  },
  transcriptionContainer: {
    width: '100%',
    backgroundColor: colors.background02,
    borderRadius: 8,
    padding: layout.padding,
  },
  transcriptionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: layout.spacing,
  },
  transcriptionText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
});

export default TestRealtime;
