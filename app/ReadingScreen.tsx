import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert } from 'react-native';
import { MoreVertical, ArrowLeft, Square } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getStories, Story } from '../services/storyService';
import { useFocusEffect } from '@react-navigation/native';
import { startSpeechRecognition } from '../services/speechRecognitionService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  saveReadingSessionToDatabase,
  calculateWordsPerMinute,
  calculateComprehension
} from '../services/readingSessionsHelpers';
import { getYomiEnergy, addReadingEnergy } from '../services/yomiEnergyService';
import ReadingEnergyDisplay from '../components/ReadingEnergyDisplay';
import { 
  getUserTotalEnergy, 
  updateUserEnergy, 
  updateUserReadingPoints 
} from '../services/userService';

const ReadingScreen = () => {
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { userId, title } = useLocalSearchParams<{ userId: string; title?: string }>();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [sessionEnergy, setSessionEnergy] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [recentGain, setRecentGain] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [energyProgress, setEnergyProgress] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    if (!userId) {
      console.error('userId is undefined');
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      router.replace('/login'); // Assuming you have a login route
      return;
    }

    async function initializeScreen() {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');

        const energy = await getUserTotalEnergy(userId);
        setTotalEnergy(energy);

        const fetchedStories = await getStories();
        if (fetchedStories.length > 0) {
          const story = title 
            ? fetchedStories.find(s => s.title === title) 
            : fetchedStories[0];
          setCurrentStory(story || fetchedStories[0]);
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
        Alert.alert('Error', 'Failed to initialize the reading screen. Please try again.');
      }
    }

    initializeScreen();
  }, [userId, title]);

  useEffect(() => {
    if (isReading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isReading]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording..');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Audio recording permission not granted');
        Alert.alert('Permission Required', 'This app needs access to your microphone to record audio.');
        return null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      console.log('Recording started');
      return recording;
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      return null;
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log('No recording to stop');
      return null;
    }

    try {
      console.log('Stopping recording..');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      return null;
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const updateEnergyWhileReading = useCallback(() => {
    if (isReading) {
      setEnergyProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 10) {
          setSessionEnergy(prevEnergy => prevEnergy + 10);
          setRecentGain(10);
          setTimeout(() => setRecentGain(0), 2000);
          return 0;
        }
        return newProgress;
      });
    }
  }, [isReading]);

  useEffect(() => {
    const interval = setInterval(updateEnergyWhileReading, 1000);
    return () => clearInterval(interval);
  }, [updateEnergyWhileReading]);

  const handleStartReading = async () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "This app needs access to your microphone to record audio.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      console.log('Starting reading and recording...');
      const newRecording = await startRecording();
      if (newRecording) {
        setIsReading(true);
        setStartTime(new Date());
        setSessionEnergy(0);
        console.log('Reading and recording started');
      } else {
        throw new Error('Failed to start recording');
      }
    } catch (err) {
      console.error('Failed to start reading session', err);
      setIsReading(false);
      Alert.alert('Error', 'Failed to start reading session. Please try again.');
    }
  };

  const handleStopReading = async () => {
    console.log('Stopping reading and recording...');
    setIsReading(false);

    if (!userId) {
      console.error('userId is undefined');
      Alert.alert('Error', 'User ID is missing. Please try again.');
      return;
    }

    if (!recording) {
      console.error('No active recording found');
      Alert.alert('Error', 'No active recording found. Please try again.');
      return;
    }

    if (startTime && currentStory) {
      try {
        const audioUri = await stopRecording();
        if (audioUri) {
          console.log('Recording stopped, uri:', audioUri);
          
          const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
          
          await startSpeechRecognition(base64Audio, async (text) => {
            console.log('Transcript received:', text);
            
            const endTime = new Date();
            const readingTimeMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
            const readingPoints = Math.round(readingTimeMinutes);

            const newEnergy = await addReadingEnergy(userId, readingTimeMinutes);
            console.log(`Energy after reading session: ${newEnergy}`);

            await updateUserEnergy(userId, newEnergy);
            await updateUserReadingPoints(userId, readingPoints);

            router.push({
              pathname: '/reading-results',
              params: {
                readingTime: Math.round(readingTimeMinutes).toString(),
                readingPoints: readingPoints.toString(),
                energy: newEnergy.toString(),
                audioUri: audioUri,
                transcript: text,
                userId: userId,
              },
            });
          });
        } else {
          throw new Error('Failed to get audio URI from stopRecording');
        }
      } catch (error) {
        console.error('Error stopping reading session:', error);
        Alert.alert('Error', 'An error occurred while processing your reading session. Please try again.');
      }
    } else {
      console.error('Missing required data to stop reading session', { 
        hasRecording: !!recording, 
        hasStartTime: !!startTime, 
        hasCurrentStory: !!currentStory,
        userId: userId,
      });
      Alert.alert('Error', 'Unable to complete the reading session. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{currentStory ? currentStory.title : 'Loading...'}</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.headerButton}>
            <MoreVertical size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.energyDisplayContainer}>
          <ReadingEnergyDisplay 
            energy={totalEnergy} 
            sessionEnergy={sessionEnergy}
            recentGain={recentGain}
            energyProgress={energyProgress}
          />
        </View>

        <ScrollView style={styles.contentContainer}>
          {currentStory ? (
            <Text style={[styles.content, { fontSize }]}>
              {currentStory.content}
            </Text>
          ) : (
            <Text style={styles.content}>Loading story...</Text>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={isReading ? handleStopReading : handleStartReading}
        >
          {isReading ? (
            <View style={styles.stopButtonContainer}>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <View style={styles.stopButton}>
                <Square color={colors.text} size={24} />
              </View>
            </View>
          ) : (
            <View style={styles.startButton}>
              <Square color={colors.primary} size={24} fill={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: layout.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  headerButton: {
    padding: 8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  energyDisplayContainer: {
    marginBottom: layout.spacing,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 20,
    color: colors.text,
    lineHeight: 40,
  },
  transcriptContainer: {
    marginTop: layout.spacing,
    padding: layout.padding,
    backgroundColor: colors.background02,
    borderRadius: 8,
  },
  transcriptText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  energyText: {
    color: colors.yellowDark,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  recentGainText: {
    position: 'absolute',
    right: 10,
    top: -20,
    color: colors.yellowDark,
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(209, 52, 56, 0.2)', // 20% opacity of #D13438
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error, // This will now be #D13438
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReadingScreen;
