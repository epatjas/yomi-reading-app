// Import necessary React and React Native components
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert } from 'react-native';
import { MoreVertical, ArrowLeft, Square } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getStories, Story } from '../services/storyService';
import { startSpeechRecognition, stopSpeechRecognition } from '../services/speechRecognitionService';
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
import { createClient } from '@supabase/supabase-js';

// Global variable to store the current recording
let globalRecording: Audio.Recording | null = null;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main component for the reading screen
const ReadingScreen = () => {
  // State variables for managing the reading session
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { userId, storyId } = useLocalSearchParams<{ userId: string, storyId: string }>();
  console.log('ReadingScreen opened with userId:', userId);
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
  const [transcript, setTranscript] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);

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
      console.log('Component unmounting, cleaning up recording');
      if (recording) {
        (async () => {
          try {
            if (recording._canRecord) {
              await recording.stopAndUnloadAsync();
              console.log('Recording stopped and unloaded during cleanup');
            } else {
              console.log('Recording already stopped and unloaded');
            }
          } catch (error) {
            console.error('Error during recording cleanup:', error);
          } finally {
            setRecording(null);
          }
        })();
      }
    };
  }, [recording]);

  // Effect to handle recording when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (recording) {
          console.log('Screen losing focus, stopping any active recording');
          recording.stopAndUnloadAsync().catch(console.error);
          setRecording(null);
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
  const startRecording = async (): Promise<Audio.Recording | null> => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      return newRecording;
    } catch (err) {
      console.error('Failed to start recording', err);
      return null;
    }
  };

  // Function to stop recording
  const stopRecording = async (): Promise<void> => {
    console.log('Stopping recording..');
    if (!recording) {
      console.log('No active recording to stop');
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
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

  const recordAndGetUri = async (duration: number = 5000): Promise<string | null> => {
    let recording: Audio.Recording | null = null;
    let uri: string | null = null;
    
    try {
      recording = await startRecording();
      if (!recording) {
        console.log('Failed to start recording');
        return null;
      }

      // Wait for the specified duration
      await new Promise(resolve => setTimeout(resolve, duration));

      // Stop and unload the recording
      await recording.stopAndUnloadAsync();
      uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      return uri;
    } catch (error) {
      console.error('Error in recordAndGetUri:', error);
      return null;
    } finally {
      // Only attempt to stop and unload if we haven't already done so
      if (recording && !uri) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('Error cleaning up recording:', cleanupError);
        }
      }
    }
  };

  const handleStartReading = async () => {
    try {
      console.log('Starting reading session...');
      setIsReading(true);
      setStartTime(new Date());
      setTranscript('');

      const newRecording = await startRecording();
      if (newRecording) {
        setRecording(newRecording);
        
        const getAudioUri = async () => {
          if (recording) {
            const uri = recording.getURI();
            if (uri) {
              return uri;
            }
          }
          return null;
        };
        
        startSpeechRecognition(
          getAudioUri, 
          (transcriptText: string) => {
            console.log('Received transcript:', transcriptText);
            setTranscript(prevTranscript => prevTranscript + ' ' + transcriptText);
          },
          () => {
            console.log('Speech recognition ended');
            handleStopReading();
          }
        );
      } else {
        throw new Error('Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting reading:', error);
      setIsReading(false);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const uploadAudioToSupabase = async (uri: string): Promise<string | null> => {
    console.log('Attempting to upload audio to Supabase:', uri);
    try {
      const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const fileExtension = uri.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExtension}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .upload(filePath, decode(fileContent), {
          contentType: `audio/${fileExtension}`,
          upsert: true
        });

      if (error) {
        console.error('Error uploading file to Supabase:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(filePath);

      console.log('Audio successfully uploaded to Supabase:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAudioToSupabase:', error);
      return null;
    }
  };

  // Add this function to decode base64
  function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Function to handle stopping the reading session
  const handleStopReading = async () => {
    console.log('Attempting to stop reading...');
    setIsReading(false);
    stopSpeechRecognition();
    await stopRecording();

    // Calculate reading time in seconds
    const endTime = new Date();
    const readingTimeSeconds = Math.round((endTime.getTime() - (startTime?.getTime() || 0)) / 1000);

    // Navigate to ReadingResultsScreen
    router.push({
      pathname: '/ReadingResultsScreen',
      params: {
        readingTime: readingTimeSeconds.toString(),
        readingPoints: sessionEnergy.toString(),
        energy: totalEnergy.toString(),
        audioUri: audioUri || '',
        transcript: transcript,
        userId: userId,
      },
    });
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
