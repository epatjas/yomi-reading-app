// Import necessary React and React Native components
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert, Modal, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { MoreVertical, ArrowLeft, Square, Mic, X, Play, Pause } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { getStories, Story } from '../../services/storyService';
import { Audio } from 'expo-av';
import { saveReadingSessionToDatabase, ReadingSession } from '../../services/readingSessionsHelpers';
import ReadingEnergyDisplay from '../../components/shared/ReadingEnergyDisplay';
import { updateUserReadingPoints, updateUserStreak } from '../../services/userService';
import { 
  ENERGY_GAIN_AMOUNT, 
  ENERGY_GAIN_INTERVAL, 
  MAX_ENERGY,
  getUserEnergy, 
  addReadingEnergy 
} from '../../services/yomiEnergyService';
import { createClient } from '@supabase/supabase-js';
import { syllabify } from '../../finnishHyphenation';
import { Linking } from 'react-native';

// Global variable to store the current recording
let globalRecording: Audio.Recording | null = null;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// This section initializes the component and sets up necessary state variables for managing the reading interface.
export default function ReadingScreen() {
  console.log('ReadingScreen attempting to mount');
  
  // Move router declaration to the top
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; storyId: string }>();
  
  // Memoize the supabase client
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), []);

  // Add proper dependencies to useEffect for params validation
  useEffect(() => {
    if (!params.userId || !params.storyId) {
      console.error('Missing required params:', { params });
      Alert.alert('Error', 'Missing required parameters', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [params.userId, params.storyId, router]);

  // Add cleanup and mounting tracking
  useEffect(() => {
    console.log('ReadingScreen useEffect - mounting');
    
    return () => {
      console.log('ReadingScreen useEffect - cleanup');
      // Cleanup any resources, recordings, etc.
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  // State declarations
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const hasLoggedUserId = useRef(false);
  const [hasPermission, setHasPermission] = useState(false);
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
  const [isLoading, setIsLoading] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [recordingError, setRecordingError] = useState<Error | null>(null);

  // Add this effect to fetch the user's current energy when the screen loads
  useEffect(() => {
    const fetchUserEnergy = async () => {
      if (!params.userId) return;
      
      try {
        const currentEnergy = await getUserEnergy(params.userId);
        setTotalEnergy(currentEnergy);
        setLocalEnergy(0); // Reset session energy
      } catch (error) {
        console.error('Error fetching user energy:', error);
        Alert.alert('Error', 'Failed to load energy status');
      }
    };

    fetchUserEnergy();
  }, [params.userId]);

  // This effect loads the story content when the component mounts or when the storyId changes.
  useEffect(() => {
    let isMounted = true;
    console.log('Loading story effect triggered');

    const fetchStoryData = async () => {
      if (!params.storyId) return;
      
      try {
        setIsLoading(true);
        const fetchedStories = await getStories();
        
        if (!isMounted) return;

        const story = fetchedStories.find(s => s.id === params.storyId);
        
        if (!story) {
          throw new Error(`Story not found with ID: ${params.storyId}`);
        }

        setCurrentStory(story);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading story:', error);
        if (isMounted) {
          setIsLoading(false);
          Alert.alert('Error', 'Failed to load story');
          router.back();
        }
      }
    };

    fetchStoryData();
    return () => { isMounted = false; };
  }, [params.storyId, router]);

  // These functions handle the audio recording functionality, including initialization and starting recordings.
  const initializeAudio = async () => {
    try {
      console.log('Starting Audio initialization...');
      
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      console.log('Permission response:', permissionResponse);
      
      if (permissionResponse.status !== 'granted') {
        console.log('Permission not granted');
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your device settings to use this feature.',
          [
            { 
              text: 'Open Settings', 
              onPress: () => Linking.openSettings() 
            },
            { 
              text: 'Cancel', 
              style: 'cancel' 
            }
          ]
        );
        return false;
      }

      // Basic audio configuration
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Audio mode set successfully');
      setHasPermission(true);
      setAudioInitialized(true);
      return true;

    } catch (error) {
      console.error('Audio initialization error:', error);
      setHasPermission(false);
      setAudioInitialized(false);
      Alert.alert(
        'Audio Setup Error',
        'Failed to initialize audio. Please try again or restart the app.'
      );
      return false;
    }
  };

  // Simplified startRecording function
  const startRecording = async (): Promise<Audio.Recording | null> => {
    try {
      console.log('Preparing to record...');

      // Ensure any existing recording is stopped and unloaded
      if (recording) {
        console.log('Stopping existing recording...');
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          console.log('Error stopping existing recording:', e);
        }
        setRecording(null);
      }

      // Prepare the recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => console.log('Recording status:', status),
        1000
      );

      console.log('Recording created successfully');
      return newRecording;

    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.'
      );
      return null;
    }
  };

  // Function to stop recording
  const stopRecording = async (): Promise<string | null> => {
    if (!recording) {
      console.log('No recording to stop');
      return null;
    }

    try {
      let uri: string | null = null;

      // First try to get the URI, as this might still work even if recording is unloaded
      try {
        uri = recording.getURI();
        console.log('Got recording URI:', uri);
      } catch (uriError) {
        console.log('Could not get URI:', uriError);
      }

      // Only attempt to stop and unload if not already unloaded
      if (!isRecordingUnloaded) {
        try {
          console.log('Stopping and unloading recording...');
          await recording.stopAndUnloadAsync();
          console.log('Recording stopped and unloaded');
        } catch (stopError) {
          console.log('Error stopping recording (might already be unloaded):', stopError);
        }
      } else {
        console.log('Recording was already unloaded, skipping stopAndUnloadAsync');
      }

      // If we couldn't get the URI earlier, try one more time
      if (!uri) {
        try {
          uri = recording.getURI();
        } catch (finalUriError) {
          console.log('Final attempt to get URI failed:', finalUriError);
        }
      }

      // Update state
      setRecording(null);
      setIsRecordingUnloaded(true);

      return uri;
    } catch (error) {
      console.error('Error in stopRecording:', error);
      // Clean up state even if there was an error
      setRecording(null);
      setIsRecordingUnloaded(true);
      return null;
    }
  };

  // Update handleStartReading with better error handling
  const handleStartReading = async () => {
    try {
      console.log('Starting reading session...');
      
      // Initialize audio if needed
      if (!audioInitialized) {
        const audioReady = await initializeAudio();
        if (!audioReady) {
          throw new Error('Audio initialization failed');
        }
      }

      // Start recording
      const newRecording = await startRecording();
      if (!newRecording) {
        throw new Error('Failed to create recording');
      }

      // Update UI states
      setRecording(newRecording);
      setIsReading(true);
      setStartTime(new Date());
      setIsRecordingInterfaceVisible(true);
      
      // Add this animation code
      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTotalElapsedTime(0);
      setIsPaused(false);
      setLastEnergyGainTime(null);

      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error in handleStartReading:', error);
      // Clean up any partial state
      setIsReading(false);
      setIsRecordingInterfaceVisible(false);
      setRecording(null);
      
      Alert.alert(
        'Error',
        'Unable to start reading session. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      console.log('ReadingScreen cleanup - unmounting');
      if (recording && !isRecordingUnloaded) {
        (async () => {
          try {
            await recording.stopAndUnloadAsync();
          } catch (error) {
            console.log('Cleanup unload error (recording might already be unloaded):', error);
          } finally {
            setRecording(null);
            setIsRecordingInterfaceVisible(false);
            recordingAnimation.setValue(0);
          }
        })();
      }
      
      // Reset audio mode
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      }).catch(console.error);
    };
  }, [recording, recordingAnimation, isRecordingUnloaded]);

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


  // Function to handle stopping the reading session
  const handleStopReading = async () => {
    try {
      console.log('Stopping reading session...');
      
      setIsReading(false);
      setIsRecordingInterfaceVisible(false);
      setIsPaused(false);
      setLastEnergyGainTime(null);

      // Stop animation
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
          }
        } catch (error) {
          console.error('Error stopping recording:', error);
          Alert.alert('Error', 'Failed to save recording');
          return;
        }
      }

      // Save session data
      await saveReadingSession(audioUrl);

    } catch (error) {
      console.error('Error in handleStopReading:', error);
      Alert.alert('Error', 'Failed to complete reading session');
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

  useFocusEffect(
    React.useCallback(() => {
      console.log('ReadingScreen focused');
      return () => {
        console.log('ReadingScreen unfocused');
      };
    }, [])
  );

  // Add these handler functions
  const handleRecordingComplete = async (uri: string | null) => {
    try {
      if (!uri) {
        throw new Error('No recording URI available');
      }

      console.log('Recording completed. URI:', uri);
      setAudioUri(uri);
      
      // Upload to Supabase
      const audioUrl = await uploadAudioToSupabase(uri);
      console.log('Audio uploaded successfully. URL:', audioUrl);

      // Save session data
      await handleStopReading();
    } catch (error) {
      console.error('Error handling recording completion:', error);
      handleRecordingError(error instanceof Error ? error : new Error('Failed to process recording'));
    }
  };

  const handleRecordingError = useCallback((error: Error) => {
    console.error('Recording error:', error);
    setRecordingError(error);
    setIsRecordingInterfaceVisible(false);
    setIsReading(false);
    Alert.alert('Recording Error', error.message);
  }, []);

  // Add this effect
  useEffect(() => {
    return () => {
      // Cleanup audio session when component unmounts
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      }).catch(console.error);
    };
  }, []);

  const saveReadingSession = async (audioUrl: string) => {
    if (!params.userId || !currentStory?.id) {
      throw new Error('Missing user ID or story ID');
    }

    try {
      const endTime = new Date();
      const startTimeDate = startTime || new Date();
      const totalPausedTime = pauseTimeRef.current ? (Date.now() - pauseTimeRef.current) : 0;
      const durationInSeconds = Math.round((endTime.getTime() - startTimeDate.getTime() - totalPausedTime) / 1000);

      // Update reading points
      await updateUserReadingPoints(params.userId, sessionEnergy);

      // Update streak
      const newStreak = await updateUserStreak(params.userId);
      console.log('Updated user streak:', newStreak);

      // Save the reading session
      const readingSessionData: Omit<ReadingSession, 'id' | 'story_title'> = {
        user_id: params.userId,
        story_id: currentStory.id,
        start_time: startTimeDate.toISOString(),
        end_time: endTime.toISOString(),
        duration: durationInSeconds,
        energy_gained: localEnergy,
        reading_points: localEnergy,
        audio_url: audioUrl,
        progress: 100,
        completed: true
      };

      const savedSession = await saveReadingSessionToDatabase(readingSessionData);
      console.log('Reading session saved successfully:', savedSession);

      // Add the energy to user's current_energy
      await addReadingEnergy(params.userId, durationInSeconds);

      // Navigate to QuizScreen
      router.push({
        pathname: "/screens/QuizScreen",
        params: { 
          readingSessionId: savedSession.id,
          storyId: currentStory.id,
          readingTime: durationInSeconds.toString(),
          readingPoints: localEnergy.toString(),
          energy: totalEnergy.toString(),
          audioUri: audioUrl,
          userId: params.userId,
          streak: newStreak.toString()
        }
      });
    } catch (error) {
      console.error('Error saving reading session:', error);
      throw error;
    }
  };

  // Render the Reading Screen UI
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading story...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <View style={styles.bottomContainer}>
          {isRecordingInterfaceVisible ? (
            <Animated.View 
              style={[
                styles.recordingContainer,
                {
                  transform: [{
                    translateY: recordingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  }],
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
            <TouchableOpacity
              style={styles.readToYomiButton}
              onPress={handleStartReading}
            >
              <Mic size={24} color={colors.text} />
              <Text style={styles.readToYomiButtonText}>Read to Yomi</Text>
            </TouchableOpacity>
          )}
        </View>
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
    backgroundColor: colors.background02,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.stroke,
    overflow: 'hidden',
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
    marginBottom: 20, 
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
    width: 48,  
    height: 48, 
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', 
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
    marginVertical: 24, 
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
    backgroundColor: colors.background02, 
  },
  scrollViewContent: {
    paddingBottom: 100, 
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  recordingInterface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    height: 60,
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
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
