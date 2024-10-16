// Import necessary React and React Native components
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert } from 'react-native';
import { MoreVertical, ArrowLeft, Square } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getStories, Story } from '../services/storyService';
import { startSpeechRecognition } from '../services/speechRecognitionService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  saveReadingSessionToDatabase,
  ReadingSession
} from '../services/readingSessionsHelpers';
import ReadingEnergyDisplay from '../components/ReadingEnergyDisplay';
import { 
  getUserTotalEnergy, 
  updateUserEnergy, 
  updateUserReadingPoints 
} from '../services/userService';

// Global variable to store the current recording
let globalRecording: Audio.Recording | null = null;

// Main component for the reading screen
const ReadingScreen = () => {
  // State variables for managing the reading session
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { userId, storyId } = useLocalSearchParams<{ userId: string, storyId: string }>();
  console.log('ReadingScreen opened with userId:', userId);
  const router = useRouter();
  const [hasPermission,setHasPermission] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [sessionEnergy, setSessionEnergy] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [recentGain, setRecentGain] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [energyProgress, setEnergyProgress] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Effect to check if userId is present, redirect to login if not
  useEffect(() => {
    if (!userId) {
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      router.replace('/login');
    }
  }, [userId]);

  // Effect to initialize the screen with user data and story
  useEffect(() => {
    if (!userId) {
      console.error('userId is undefined');
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      router.replace('/login');
      return;
    }

    async function initializeScreen() {
      try {
        // Request audio recording permissions
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');

        // Fetch user's total energy
        const energy = await getUserTotalEnergy(userId);
        setTotalEnergy(energy);

        // Fetch and set the current story
        const fetchedStories = await getStories();
        if (fetchedStories.length > 0) {
          const story = storyId 
            ? fetchedStories.find(s => s.id === storyId) 
            : fetchedStories[0];
          setCurrentStory(story || fetchedStories[0]);
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
        Alert.alert('Error', 'Failed to initialize the reading screen. Please try again.');
      }
    }

    initializeScreen();
  }, [userId, storyId]);

  // Effect to animate the pulse effect when reading
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

  // Effect to clean up recording when component unmounts
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        console.log('Component unmounting, stopping any active recording');
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
        recordingRef.current = null;
      }
      if (globalRecording) {
        console.log('Component unmounting, releasing global recording');
        globalRecording = null;
      }
    };
  }, []);

  // Effect to handle recording when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (recordingRef.current) {
          console.log('Screen losing focus, stopping any active recording');
          recordingRef.current.stopAndUnloadAsync().catch(console.error);
          recordingRef.current = null;
        }
      };
    }, [])
  );

  // Function to force release existing recordings
  const forceReleaseExistingRecordings = async () => {
    console.log('Forcefully releasing any existing recordings');
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      console.log('Audio mode reset successfully');
    } catch (error) {
      console.error('Error resetting audio mode:', error);
    }
  };

  // Function to reinitialize the Audio API
  const reinitializeAudioAPI = async () => {
    console.log('Reinitializing Audio API');
    try {
      await Audio.setIsEnabledAsync(false);
      await new Promise(resolve => setTimeout(resolve, 300));
      await Audio.setIsEnabledAsync(true);
      console.log('Audio API reinitialized successfully');
    } catch (error) {
      console.error('Failed to reinitialize Audio API:', error);
    }
  };

  // Function to create a new recording object
  const createRecordingObject = async () => {
    console.log('Creating recording object');
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    globalRecording = recording;
    console.log('Recording object created successfully');
  };

  // Function to start recording
  const startRecording = async () => {
    console.log('Entering startRecording function');
    try {
      await forceReleaseExistingRecordings();
      await reinitializeAudioAPI();
      await createRecordingObject();
      
      if (globalRecording) {
        console.log('Starting recording');
        await globalRecording.startAsync();
        recordingRef.current = globalRecording;
        console.log('Recording started successfully');
        return globalRecording;
      } else {
        throw new Error('Failed to create recording object');
      }
    } catch (error) {
      console.error('Error in startRecording:', error);
      throw error;
    }
  };

  // Function to stop recording
  const stopRecording = async () => {
    console.log('Entering stopRecording function');
    if (!recordingRef.current) {
      console.log('No recording to stop');
      return null;
    }

    try {
      console.log('Stopping recording..');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log('Recording stopped and stored at', uri);
      recordingRef.current = null;
      globalRecording = null;
      return uri;
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      return null;
    }
  };

  // Function to handle back button press
  const handleBackPress = () => {
    router.back();
  };

  // Function to update energy while reading
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

  // Effect to update energy every second while reading
  useEffect(() => {
    const interval = setInterval(updateEnergyWhileReading, 1000);
    return () => clearInterval(interval);
  }, [updateEnergyWhileReading]);

  // Function to handle starting the reading session
  const handleStartReading = async () => {
    try {
      console.log('Starting reading session...');
      setIsReading(true);
      setStartTime(new Date());
      await startRecording();
    } catch (error) {
      console.error('Error starting reading:', error);
      setIsReading(false);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  // Function to handle stopping the reading session
  const handleStopReading = async () => {
    console.log('Attempting to stop reading...');
    setIsReading(false);
    try {
      if (!recordingRef.current) {
        console.log('No active recording found');
        return;
      }
      console.log('Stopping recording...');
      const uri = await stopRecording();
      console.log('Recording stopped, URI:', uri);
      
      const endTime = new Date();
      const readingTimeSeconds = Math.round((endTime.getTime() - startTime!.getTime()) / 1000);
      const readingPoints = Math.floor(readingTimeSeconds / 10) * 10;
      console.log(`Reading time: ${readingTimeSeconds} seconds`);
      console.log(`Reading points: ${readingPoints}`);
      const newEnergy = await updateUserEnergy(userId, readingTimeSeconds / 60);
      console.log(`Energy after reading session: ${newEnergy}`);
      await updateUserReadingPoints(userId, readingPoints);
      console.log(`Sending readingTime: ${Math.round(readingTimeSeconds)} seconds`);
      
      // Create a ReadingSession object
      const session: Omit<ReadingSession, 'id'> = {
        user_id: userId,
        story_id: currentStory!.id,
        start_time: startTime!.toISOString(),
        end_time: endTime.toISOString(),
        duration: readingTimeSeconds,
        energy_gained: sessionEnergy,
        reading_points: readingPoints,
        audio_url: uri || '',
        progress: 100,
        completed: true
      };
      
      console.log('Saving reading session:', session);
      // Save the reading session
      await saveReadingSessionToDatabase(session);
      console.log('Reading session saved successfully');
      router.push({
        pathname: '/reading-results',
        params: {
          readingTime: Math.round(readingTimeSeconds).toString(),
          readingPoints: readingPoints.toString(),
          energy: newEnergy.toString(),
          audioUri: uri || '',
          transcript: '', // Note: transcript is not being set here
          userId: userId,
        },
      });
    } catch (error) {
      console.error('Error in handleStopReading:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      Alert.alert('Error', 'Failed to complete the reading session. Please try again.');
    }
  };

  // Render the component
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

// Styles for the component
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
