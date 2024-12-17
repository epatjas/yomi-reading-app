import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { startSpeechRecognition, stopSpeechRecognition } from '../../services/speechRecognitionService';
import { Audio } from 'expo-av';
import { colors, fonts } from '../../app/styles/globalStyles';

interface SpeechRecognitionReaderProps {
  text: string;
  isRecording: boolean;
  onReadingComplete: () => void;
}

const SpeechRecognitionReader: React.FC<SpeechRecognitionReaderProps> = ({ 
  text, 
  isRecording, 
  onReadingComplete 
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const words = text.split(' ');

  const handleTranscript = useCallback((transcript: string) => {
    // TODO: Implement text matching algorithm
    console.log('Received transcript:', transcript);
    // For now, let's just highlight the next word
    setHighlightedIndex(prevIndex => Math.min(prevIndex + 1, words.length - 1));
  }, [words]);

  const handleSpeechEnd = useCallback(() => {
    onReadingComplete();
  }, [onReadingComplete]);

  useEffect(() => {
    const setupRecording = async () => {
      if (isRecording) {
        try {
          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          setRecording(recording);

          const getAudioUri = async () => {
            if (recording) {
              return recording.getURI() || null;
            }
            return null;
          };

          startSpeechRecognition(getAudioUri, handleTranscript, handleSpeechEnd);
        } catch (error) {
          console.error('Failed to start recording', error);
        }
      } else {
        if (recording) {
          await recording.stopAndUnloadAsync();
          setRecording(null);
        }
        stopSpeechRecognition();
        setHighlightedIndex(-1);
      }
    };

    setupRecording();

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      stopSpeechRecognition();
    };
  }, [isRecording, handleTranscript, handleSpeechEnd]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {words.map((word, index) => (
          <Text
            key={index}
            style={[
              styles.word,
              index === highlightedIndex && styles.highlightedWord
            ]}
          >
            {word}{' '}
          </Text>
        ))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 28,
    color: colors.text,
  },
  word: {
    color: colors.text,
  },
  highlightedWord: {
    backgroundColor: colors.primary,
    color: colors.background,
  },
});

export default SpeechRecognitionReader;
