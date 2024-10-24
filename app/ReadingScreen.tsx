// Import necessary React and React Native components
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert, Modal, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { MoreVertical, ArrowLeft, Square, Mic, X, Play, Pause } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getStories, Story } from '../services/storyService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  saveReadingSessionToDatabase,
  ReadingSession
} from '../services/readingSessionsHelpers';
import ReadingEnergyDisplay from '../components/ReadingEnergyDisplay';
import { 
  getUserTotalEnergy, 
  updateUserReadingPoints 
} from '../services/userService';
import { 
  getCurrentYomiEnergy, 
  updateYomiEnergy,
  ENERGY_GAIN_AMOUNT,
  ENERGY_GAIN_INTERVAL,
  MAX_ENERGY
} from '../services/yomiEnergyService';
import { createClient } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { syllabify } from '../finnishHyphenation';

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
  const router = useRouter();
  const hasLoggedUserId = useRef(false);
  const [hasPermission, setHasPermission] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [sessionEnergy, setSessionEnergy] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [recentGain, setRecentGain] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecordingInterfaceVisible, setIsRecordingInterfaceVisible] = useState(false);
  const [waveformData, setWaveformData] = useState<Array<{ current: number, target: number }>>(
    Array(30).fill({ current: 0.3, target: 0.3 })
  );
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  const [textCase, setTextCase] = useState('normal'); // 'normal' or 'uppercase'
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isHyphenationEnabled, setIsHyphenationEnabled] = useState(false);
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const pauseTimeRef = useRef<number | null>(null);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [lastEnergyGainTime, setLastEnergyGainTime] = useState<number | null>(null);
  const [localEnergy, setLocalEnergy] = useState(0);

  // Effect to check if userId is present, redirect to login if not
  useEffect(() => {
    if (!hasLoggedUserId.current) {
      console.log('ReadingScreen opened with userId:', userId);
      hasLoggedUserId.current = true;
    }

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
        if (recording && !isRecordingUnloaded) {
          console.log('Screen losing focus, stopping any active recording');
          stopRecording().catch(console.error);
        }
      };
    }, [recording, isRecordingUnloaded])
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
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

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
  const stopRecording = async (): Promise<string | null> => {
    if (!recording || isRecordingUnloaded) {
      console.log('Recording already stopped or unloaded');
      return null;
    }

    try {
      console.log('Stopping and unloading recording...');
      await recording.stopAndUnloadAsync();
      console.log('Recording stopped and unloaded');
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      setRecording(null);
      setIsRecordingUnloaded(true);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Even if there's an error, try to get the URI
      const uri = recording.getURI();
      setRecording(null);
      setIsRecordingUnloaded(true);
      return uri;
    }
  };

  // Function to handle back button press
  const handleBackPress = () => {
    router.back();
  };

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
      setIsRecordingInterfaceVisible(true);
      setTotalElapsedTime(0);
      setIsPaused(false);
      setLastEnergyGainTime(null); // Reset the last energy gain time

      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const newRecording = await startRecording();
      if (newRecording) {
        setRecording(newRecording);
      } else {
        throw new Error('Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting reading:', error);
      setIsReading(false);
      setIsRecordingInterfaceVisible(false);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const uploadAudioToSupabase = async (uri: string): Promise<string> => {
    try {
      console.log('Starting audio upload to Supabase. URI:', uri);
      const fileName = `audio_${Date.now()}.m4a`;
      
      // Read the file as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('File read as blob. Size:', blob.size);

      if (blob.size === 0) {
        throw new Error('Audio file is empty');
      }

      // Convert blob to ArrayBuffer
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, arrayBuffer, {
          contentType: 'audio/m4a',
        });

      if (error) throw error;

      console.log('Audio file uploaded successfully. Data:', data);

      const { data: urlData } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName);

      console.log('Audio uploaded successfully. Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading audio to Supabase:', error);
      throw error;
    }
  };

  // Helper function to convert Base64 to Uint8Array
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
    setIsReading(false);
    setIsRecordingInterfaceVisible(false);
    setIsPaused(false);
    setLastEnergyGainTime(null); // Reset the last energy gain time when stopping

    Animated.timing(recordingAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    let audioUrl = '';
    if (recording && !isRecordingUnloaded) {
      try {
        console.log('Stopping recording...');
        const uri = await stopRecording();
        console.log('Recording stopped. Audio URI:', uri);
        
        if (uri) {
          console.log('Uploading audio to Supabase...');
          audioUrl = await uploadAudioToSupabase(uri);
          console.log('Audio uploaded successfully. URL:', audioUrl);
        } else {
          console.log('No audio URI available for upload');
        }
      } catch (error) {
        console.error('Error stopping recording or uploading audio:', error);
      }
    } else {
      console.log('No active recording to stop');
    }

    // Calculate reading time, accounting for pauses
    const endTime = new Date();
    const startTimeDate = startTime || new Date();
    const totalPausedTime = pauseTimeRef.current ? (Date.now() - pauseTimeRef.current) : 0;
    const durationInSeconds = Math.round((endTime.getTime() - startTimeDate.getTime() - totalPausedTime) / 1000);

    // Update reading points
    await updateUserReadingPoints(userId, sessionEnergy);

    // Save the reading session to the database
    try {
      const readingSessionData: Omit<ReadingSession, 'id' | 'story_title'> = {
        user_id: userId,
        story_id: currentStory?.id || '',
        start_time: startTimeDate.toISOString(),
        end_time: endTime.toISOString(),
        duration: durationInSeconds,
        energy_gained: localEnergy,
        reading_points: localEnergy,
        audio_url: audioUrl,
        progress: 100,
        completed: true
      };

      console.log('Saving reading session with data:', readingSessionData);
      const savedSession = await saveReadingSessionToDatabase(readingSessionData);
      console.log('Reading session saved successfully:', savedSession);

      // Navigate to QuizScreen
      console.log('Navigating to QuizScreen with params:', { 
        readingSessionId: savedSession.id,
        storyId: currentStory?.id,
        readingTime: durationInSeconds.toString(),
        readingPoints: localEnergy.toString(),
        energy: totalEnergy.toString(),
        audioUri: audioUrl,
        userId: userId
      });
      router.push({
        pathname: '/QuizScreen',
        params: { 
          readingSessionId: savedSession.id,
          storyId: currentStory?.id,
          readingTime: durationInSeconds.toString(),
          readingPoints: localEnergy.toString(),
          energy: totalEnergy.toString(),
          audioUri: audioUrl,
          userId: userId
        }
      });

      // Update the user's total energy in the database
      await updateYomiEnergy(userId, totalEnergy + localEnergy);

    } catch (error) {
      console.error('Error saving reading session or updating energy:', error);
      Alert.alert('Error', 'Failed to save reading session or update energy. Your progress may not be recorded.');
    }
  };

  // Add cancelRecording function
  const cancelRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        setIsReading(false);
        setIsRecordingInterfaceVisible(false);
        Animated.timing(recordingAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error canceling recording:', error);
      }
    }
  };

  // Add this function inside the ReadingScreen component, before the return statement
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

 // Wave form animation
  useEffect(() => {
    let animationFrame: number;
  
    const animateWaveform = () => {
      setWaveformData(prev => prev.map(({ current, target }) => {
        // Slowly move current value towards target
        const newCurrent = current + (target - current) * 0.05;
        
        // Occasionally change the target
        const newTarget = Math.random() < 0.05 ? Math.random() * 0.7 + 0.3 : target;
  
        return { current: newCurrent, target: newTarget };
      }));
  
      animationFrame = requestAnimationFrame(animateWaveform);
    };
  
    if (isRecordingInterfaceVisible) {
      animationFrame = requestAnimationFrame(animateWaveform);
      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(recordingAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isRecordingInterfaceVisible]);

  // Replace the existing useEffect for energy updates with this version
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateEnergy = () => {
      if (isReading && !isPaused) {
        setLocalEnergy(prevEnergy => {
          const newEnergy = Math.min(prevEnergy + ENERGY_GAIN_AMOUNT, MAX_ENERGY);
          if (newEnergy > prevEnergy && newEnergy < MAX_ENERGY) {
            setRecentGain(ENERGY_GAIN_AMOUNT);
            setTimeout(() => setRecentGain(0), 2000);
          } else if (newEnergy === MAX_ENERGY && prevEnergy !== MAX_ENERGY) {
            // Show the +5 animation one last time when reaching max energy
            setRecentGain(ENERGY_GAIN_AMOUNT);
            setTimeout(() => setRecentGain(0), 2000);
          }
          return newEnergy;
        });
      }
    };

    if (isReading && !isPaused) {
      intervalId = setInterval(updateEnergy, ENERGY_GAIN_INTERVAL * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isReading, isPaused]);

  const toggleTextCase = () => {
    setTextCase(prevCase => prevCase === 'normal' ? 'uppercase' : 'normal');
  };

  const syllabifyText = (text: string) => {
    return text.split(' ').map(word => syllabify(word)).join(' ');
  };

  // Update the handlePauseResume function
  const handlePauseResume = async () => {
    if (!recording) return;

    try {
      if (isPaused) {
        // Resume recording
        await recording.startAsync();
        setIsPaused(false);
        setLastEnergyGainTime(Date.now()); // Reset the last energy gain time when resuming
      } else {
        // Pause recording
        await recording.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing/resuming recording:', error);
      Alert.alert('Error', 'Failed to pause/resume recording. Please try again.');
    }
  };

  // Add this effect to update the total elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReading && !isPaused) {
      interval = setInterval(() => {
        setTotalElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isReading, isPaused]);

  // Render the component
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{currentStory ? currentStory.title : 'Loading...'}</Text>
          <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.headerButton}>
            <MoreVertical size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.energyDisplayContainer}>
          <ReadingEnergyDisplay 
            energy={totalEnergy}
            sessionEnergy={localEnergy}
            recentGain={recentGain}
            isPaused={isPaused}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={[styles.content, { 
            fontSize, 
            textTransform: textCase === 'uppercase' ? 'uppercase' : 'none' 
          }]}>
            {isHyphenationEnabled 
              ? syllabifyText(currentStory?.content || '')
              : currentStory?.content}
          </Text>
        </ScrollView>

        {isRecordingInterfaceVisible ? (
          <Animated.View 
            style={[
              styles.recordingContainer,
              {
                transform: [
                  {
                    translateY: recordingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
                opacity: recordingAnimation,
              },
            ]}
          >
            <View style={styles.recordingInterface}>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.recordingControls}>
                <Text style={styles.durationText}>
                  {formatDuration(totalElapsedTime)}
                </Text>
                <TouchableOpacity onPress={handlePauseResume} style={styles.pauseButton}>
                  {isPaused ? <Play size={20} color={colors.text} /> : <Pause size={20} color={colors.text} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStopReading} style={styles.stopButton}>
                  <Square size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.readToYomiButton}
              onPress={handleStartReading}
            >
              <Mic size={24} color={colors.text} />
              <Text style={styles.readToYomiButtonText}>Read to Yomi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={isSettingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsSettingsVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setIsSettingsVisible(false)}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>SIZE</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabelSmall}>Aa</Text>
                <Slider
                  style={styles.slider}
                  value={fontSize}
                  onValueChange={setFontSize}
                  minimumValue={16}
                  maximumValue={32}
                  step={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.text}
                  thumbTintColor={colors.primary}
                />
                <Text style={styles.sliderLabelLarge}>Aa</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>CASE</Text>
              <View style={styles.caseButtonContainer}>
                <TouchableOpacity
                  style={[styles.caseButton, textCase === 'normal' && styles.caseButtonActive]}
                  onPress={() => setTextCase('normal')}
                >
                  <Text style={styles.caseButtonText}>Aa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.caseButton, textCase === 'uppercase' && styles.caseButtonActive]}
                  onPress={() => setTextCase('uppercase')}
                >
                  <Text style={styles.caseButtonText}>AA</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>TAVUTUS</Text>
              <View style={styles.switchContainer}>
                <Switch
                  value={isHyphenationEnabled}
                  onValueChange={setIsHyphenationEnabled}
                  trackColor={{ false: colors.background, true: colors.primary }}
                  thumbColor={colors.text}
                />
                <Text style={styles.switchLabel}>
                  {isHyphenationEnabled ? 'Ta-vu-vii-vat' : 'Tavuviivat'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  readToYomiButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
  },
  readToYomiButtonText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 18,
    marginLeft: 12,
  },
  recordingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  recordingInterface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background02,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 12,
    borderRadius: 30,
    height: 60,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginRight: 12,
  },
  pauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262736',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background02,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  settingItem: {
    marginBottom: 20, // Remove bottom margin as we're using the divider for spacing
  },
  settingLabel: {
    fontSize: 11,
    color: colors.text,
    marginBottom: 16,
    fontWeight: '500', 
    textTransform: 'uppercase',
    letterSpacing: 0.5, 
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderLabelSmall: {
    fontSize: 16,
    color: colors.text,
  },
  sliderLabelLarge: {
    fontSize: 24,
    color: colors.text,
  },
  caseButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', 
    gap: 16, 
  },
  caseButton: {
    backgroundColor: colors.background,
    width: 48,  // Make width and height equal for a square shape
    height: 48, // Same as width
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', // Center the text vertically as well
  },
  caseButtonActive: {
    backgroundColor: colors.primary,
  },
  caseButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "#373846",
    marginVertical: 24, // Add some vertical margin to space it from the setting items
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginLeft: 8,
    color: colors.text,
    fontSize: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background02, // Or any color that fits your design
  },
  scrollViewContent: {
    paddingBottom: 100, // Increased padding to avoid content being hidden behind the button
  },
});

export default ReadingScreen;
