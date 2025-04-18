// Import necessary React and React Native components
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert, Modal, Switch, ActivityIndicator, Image, TouchableWithoutFeedback } from 'react-native';
import Slider from '@react-native-community/slider';
import { MoreVertical, ArrowLeft, Square, Mic, X, Play, Pause } from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { getStories, Story, getStoryById } from '../../services/storyService';
import { Audio } from 'expo-av';
import { saveReadingSessionToDatabase, ReadingSession } from '../../services/readingSessionsHelpers';
import ReadingEnergyDisplay, { getYomiImage } from '../../components/shared/ReadingEnergyDisplay';
import { updateUserReadingPoints, updateUserStreak } from '../../services/userService';
import { 
  ENERGY_GAIN_AMOUNT, 
  ENERGY_GAIN_INTERVAL, 
  MAX_ENERGY,
  getUserEnergy, 
  addReadingEnergy 
} from '../../services/yomiEnergyService';
import { createClient } from '@supabase/supabase-js';
import { syllabify } from '../../multilingual-hyphenation';
import { Linking } from 'react-native';
import Sparkle from '../../components/shared/SparkleEffect';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { changeLanguage } from '../../translation';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import * as Font from 'expo-font';
import DyslexiaText from '../../components/shared/DyslexiaText';

// Global variables to handle recording state
let globalRecording: Audio.Recording | null = null;
let isAudioShutdown = false; // Add this flag to track global audio shutdown

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Add milestone message helper
const getMilestoneMessage = (milestone: number, t: any) => {
  switch (milestone) {
    case 20:
      return t('readingScreen.milestone20');
    case 40:
      return t('readingScreen.milestone40');
    case 60:
      return t('readingScreen.milestone60');
    case 80:
      return t('readingScreen.milestone80');
    default:
      return t('readingScreen.milestoneDefault');
  }
};

// Add a StoryContent component right after the imports
// Add this after the imports at the top of the file
interface StoryContentProps {
  content: string;
  fontSize: number;
  textCase: 'normal' | 'uppercase' | 'lowercase';
  fontType: 'normal' | 'dyslexia';
  isHyphenationEnabled: boolean;
  syllabifyText: (text: string) => string;
}

const StoryContent: React.FC<StoryContentProps> = ({ 
  content, 
  fontSize, 
  textCase, 
  fontType, 
  isHyphenationEnabled, 
  syllabifyText 
}) => {
  console.log('Rendering StoryContent with fontType:', fontType);
  
  const textContent = isHyphenationEnabled ? syllabifyText(content || '') : content;
  const textStyle = {
    fontSize: fontSize,
    color: colors.text,
    lineHeight: fontSize * 1.6,
    letterSpacing: 0.5,
    textTransform: textCase === 'uppercase' ? 'uppercase' as const : 
                   textCase === 'lowercase' ? 'lowercase' as const : 
                   'none' as const,
  };
  
  // If using dyslexia font, return DyslexiaText component
  if (fontType === 'dyslexia') {
    return (
      <DyslexiaText style={textStyle}>
        {textContent}
      </DyslexiaText>
    );
  }
  
  // Otherwise use regular Text with standard font
  return (
    <Text style={[textStyle, { fontFamily: fonts.regular }]}>
      {textContent}
    </Text>
  );
};

// This section initializes the component and sets up necessary state variables for managing the reading interface.
export default function ReadingScreen() {
  console.log('ReadingScreen attempting to mount');
  
  // Initialize translation
  const { t, i18n } = useTranslation('common');
  
  // Move router declaration to the top
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; storyId: string }>();
  
  // Memoize the supabase client
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), []);

  // Add proper dependencies to useEffect for params validation
  useEffect(() => {
    if (!params.userId || !params.storyId) {
      console.error('Missing required params:', { params });
      Alert.alert(t('common.error'), t('readingScreen.missingParams'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    }
  }, [params.userId, params.storyId, router, t]);

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
  const [textCase, setTextCase] = useState<'normal' | 'uppercase' | 'lowercase'>('normal');
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
  const isCleaningUp = useRef(false);
  const statusMonitorInterval = useRef<NodeJS.Timeout | null>(null);
  const [isStopLoading, setIsStopLoading] = useState(false);
  const [readingState, setReadingState] = useState<'initial' | 'preparing' | 'recording'>('initial');
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<20 | 40 | 60 | 80>();
  const [lastCheckedEnergy, setLastCheckedEnergy] = useState(0);
  const [fontType, setFontType] = useState<'normal' | 'dyslexia'>('normal');

  // Add these refs for animations
  const yomiScaleAnim = useRef(new Animated.Value(0.8)).current;
  const yomiRotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(Array(12).fill(0).map(() => ({
    position: new Animated.ValueXY({ x: 0, y: 0 }),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;

  // Add this function to handle animations
  const startCelebrationAnimation = useCallback(() => {
    // Reset animations
    yomiScaleAnim.setValue(0.8);
    yomiRotateAnim.setValue(0);
    sparkleAnims.forEach(anim => {
      anim.position.setValue({ x: 0, y: 0 });
      anim.opacity.setValue(1);
      anim.scale.setValue(0);
    });

    // Start animations
    Animated.parallel([
      // Yomi pop and wiggle
      Animated.sequence([
        Animated.spring(yomiScaleAnim, {
          toValue: 1.1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(yomiScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      // Gentle rotation
      Animated.sequence([
        Animated.timing(yomiRotateAnim, {
          toValue: 0.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(yomiRotateAnim, {
          toValue: -0.05,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(yomiRotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Sparkle explosion
      ...sparkleAnims.map((anim, i) => {
        const angle = (i / sparkleAnims.length) * Math.PI * 2;
        const distance = 150 + Math.random() * 50;
        return Animated.parallel([
          Animated.timing(anim.position, {
            toValue: {
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
            },
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.spring(anim.scale, {
              toValue: 0.6 + Math.random() * 0.4,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]);
      }),
    ]).start();
  }, []);

  // Trigger animation when celebration shows
  useEffect(() => {
    // Milestone animation disabled per user feedback
    /*
    if (showCelebration) {
      startCelebrationAnimation();
    }
    */
  }, [showCelebration, startCelebrationAnimation]);

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
        const story = await getStoryById(params.storyId);
        
        if (!isMounted) return;

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
      
      // Request permissions first
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

      // Simple audio configuration
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('Audio initialized successfully');
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

  // Simplified reset function that doesn't use many promises
  const resetAudioForRecording = async () => {
    console.log('Resetting audio for recording...');
    
    // Clean up any existing recordings
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        console.log('Stopped existing recording');
      } catch (err) {
        console.log('Error stopping recording:', err);
      }
      setRecording(null);
    }
    
    if (globalRecording) {
      try {
        await globalRecording.stopAndUnloadAsync();
        console.log('Stopped global recording');
      } catch (err) {
        console.log('Error stopping global recording:', err);
      }
      globalRecording = null;
    }
    
    // Reset audio mode directly
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    console.log('Audio reset complete');
    return true;
  };

  // Update monitorRecordingStatus to use the ref and clean up properly
  const monitorRecordingStatus = async (recording: Audio.Recording): Promise<void> => {
    // Clear any existing interval
    if (statusMonitorInterval.current) {
      clearInterval(statusMonitorInterval.current);
      statusMonitorInterval.current = null;
    }

    // Only monitor while recording is active
    statusMonitorInterval.current = setInterval(async () => {
      try {
        const status = await recording.getStatusAsync();
        // Only log if recording is active
        if (status.isRecording) {
          console.log('Recording status:', status);
        } else {
          // Clear interval if recording has stopped
          if (statusMonitorInterval.current) {
            clearInterval(statusMonitorInterval.current);
            statusMonitorInterval.current = null;
          }
        }
      } catch (error) {
        console.error('Error getting recording status:', error);
        // Clear interval on error
        if (statusMonitorInterval.current) {
          clearInterval(statusMonitorInterval.current);
          statusMonitorInterval.current = null;
        }
      }
    }, 1000);
  };

  // Update startRecording to use the new monitoring
  const startRecording = async (): Promise<Audio.Recording | null> => {
    try {
      console.log('Preparing to record...');
      
      // Clean up any existing recordings first 
      // (this is redundant with resetAudioForRecording but serves as a safeguard)
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) { /* ignore */ }
        setRecording(null);
      }
      
      if (globalRecording) {
        try {
          await globalRecording.stopAndUnloadAsync();
        } catch (err) { /* ignore */ }
        globalRecording = null;
      }

      // Create a new recording
      console.log('Creating new recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      // Save a reference to the global recording
      globalRecording = newRecording;
      
      console.log('Recording started');
      return newRecording;

    } catch (err) {
      console.error('Failed to start recording:', err);
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

  // Add this function to help reset the recording state when encountering errors
  const resetRecordingState = async () => {
    try {
      // Clear any existing recording
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) {
          console.log('Error stopping recording during reset:', err);
        }
        setRecording(null);
      }

      // Clear global recording
      if (globalRecording) {
        try {
          await globalRecording.stopAndUnloadAsync();
        } catch (err) {
          console.log('Error stopping global recording during reset:', err);
        }
        globalRecording = null;
      }

      // Reset audio mode - make sure to use valid configurations
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true, // Must be true if staysActiveInBackground is true
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reinitialize audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('Recording state has been reset');
    } catch (error) {
      console.error('Error in resetRecordingState:', error);
    }
  };

  // Update handleStartReading to use the full reset if needed
  const handleStartReading = async () => {
    try {
      setReadingState('preparing');
      
      // Reset and initialize audio
      if (!hasPermission) {
        const permissionGranted = await initializeAudio();
        if (!permissionGranted) {
          throw new Error('Audio permissions not granted');
        }
      } else {
        await resetAudioForRecording();
      }
      
      // Show countdown UI for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create the recording
      const newRecording = await startRecording();
      if (!newRecording) {
        throw new Error('Failed to start recording');
      }
      
      // Update state
      setRecording(newRecording);
      setReadingState('recording');
      setIsReading(true);
      setStartTime(new Date());
      setIsRecordingInterfaceVisible(true);
      setIsRecordingUnloaded(false);
      
      // Start monitoring
      monitorRecordingStatus(newRecording);

      // Start animation
      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Error in handleStartReading:', error);
      setReadingState('initial');
      Alert.alert(
        'Recording Error',
        'Unable to start reading session. Please try again.'
      );
    }
  };

  // Add cleanup to handleStopReading
  const handleStopReading = async () => {
    if (isCleaningUp.current) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }

    // Set loading state at the start
    setIsStopLoading(true);

    let localRecording = recording;
    let uri: string | null = null;

    try {
      console.log('Stopping reading session...');
      isCleaningUp.current = true;
      
      if (!localRecording) {
        throw new Error('No active recording found');
      }

      try {
        // Get status before stopping
        const status = await localRecording.getStatusAsync();
        console.log('Final recording status:', status);

        // Get URI before stopping
        try {
          uri = localRecording.getURI();
          console.log('Got recording URI:', uri);
        } catch (uriError) {
          console.error('Error getting URI:', uriError);
        }

        // Stop recording if it hasn't been unloaded
        if (!isRecordingUnloaded) {
          try {
            console.log('Attempting to stop recording...');
            await localRecording.stopAndUnloadAsync();
            console.log('Recording stopped successfully');
          } catch (stopError) {
            console.error('Error stopping recording:', stopError);
          }
        }

        // Set recording state to unloaded
        setIsRecordingUnloaded(true);
        setRecording(null);
        
        // Wait for file system to catch up
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (recordingError) {
        console.error('Recording operation error:', recordingError);
        if (!uri) {
          throw recordingError;
        }
      }

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Keep the pause state
      setIsPaused(true);

      // Verify file exists and has content
      try {
        const response = await fetch(uri);
        const fileInfo = await response.blob();
        console.log('Recording file size:', fileInfo.size, 'bytes');
        
        if (fileInfo.size === 0) {
          throw new Error('Recording file is empty');
        }

        // Upload to Supabase
        console.log('Starting Supabase upload process...');
        let audioUrl = '';
        try {
          audioUrl = await uploadAudioToSupabase(uri);
          console.log('Audio uploaded successfully. URL:', audioUrl);
        } catch (uploadError) {
          console.error('Upload error details:', uploadError);
          throw new Error('Failed to upload recording');
        }

        // Save session data and navigate to QuizScreen
        if (!audioUrl) {
          throw new Error('No audio URL received from upload');
        }

        console.log('Saving reading session with audio URL:', audioUrl);
        await saveReadingSession(audioUrl);
        // Navigation happens in saveReadingSession

      } catch (error) {
        console.error('Error in handleStopReading:', error);
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to complete reading session'
        );
        
        // Only hide the interface if there's an error
        setIsReading(false);
        setIsRecordingInterfaceVisible(false);
      }

    } finally {
      if (statusMonitorInterval.current) {
        clearInterval(statusMonitorInterval.current);
        statusMonitorInterval.current = null;
      }
      isCleaningUp.current = false;
      // Reset loading state in finally block
      setIsStopLoading(false);
    }
  };

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

  // Function to handle back button press
  const handleBackPress = () => {
    router.push({
      pathname: '/(tabs)/reading',
      params: { userId: params.userId }
    });
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

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: fileName,
      } as any);

      // Get Supabase URL for the file
      const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/audio-recordings/${fileName}`;

      // Upload using fetch directly
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'x-upsert': 'true'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload response error:', errorData);
        throw new Error(`Upload failed: ${response.status}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName);

      console.log('Upload successful, URL:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error in uploadAudioToSupabase:', error);
      throw error;
    }
  };

  // Add cancelRecording function
  const cancelRecording = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        
        // Reset all recording-related state
        setRecording(null);
        setIsRecordingUnloaded(true);
        setIsReading(false);
        setReadingState('initial');
        setIsRecordingInterfaceVisible(false);
        setTotalElapsedTime(0);
        setIsPaused(false);
        
        // Animate the UI
        Animated.timing(recordingAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Clear any monitoring intervals
        if (statusMonitorInterval.current) {
          clearInterval(statusMonitorInterval.current);
          statusMonitorInterval.current = null;
        }
      } catch (error) {
        console.error('Error canceling recording:', error);
        // Even if there's an error, still reset the UI
        setRecording(null);
        setIsReading(false);
        setReadingState('initial');
        setIsRecordingInterfaceVisible(false);
      }
    }
  };

  // Add this function inside the ReadingScreen component, before the return statement
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keep the energy gain effect in the existing useEffect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateEnergy = () => {
      if (isReading && !isPaused) {
        setLocalEnergy(prevEnergy => {
          const newEnergy = Math.min(prevEnergy + ENERGY_GAIN_AMOUNT, MAX_ENERGY);
          if (newEnergy > prevEnergy && newEnergy < MAX_ENERGY) {
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

  // Separate effect for milestone celebrations
  useEffect(() => {
    // Milestone celebration disabled per user feedback
    // Code kept for future reference if needed
    /*
    const combinedEnergy = totalEnergy + localEnergy;
    
    // Skip check if this is the initial load
    if (lastCheckedEnergy === 0) {
      setLastCheckedEnergy(combinedEnergy);
      return;
    }

    const currentPercentage = Math.floor((combinedEnergy / MAX_ENERGY) * 100);
    const previousPercentage = Math.floor((lastCheckedEnergy / MAX_ENERGY) * 100);

    // Check if we've crossed any milestone
    for (const milestone of MILESTONES) {
      if (previousPercentage < milestone && currentPercentage >= milestone) {
        setShowCelebration(true);
        setCurrentMilestone(milestone);
        
        // Hide celebration after delay
        setTimeout(() => {
          setShowCelebration(false);
          setCurrentMilestone(undefined);
        }, 3000);
        
        break;
      }
    }

    // Update last checked energy
    setLastCheckedEnergy(combinedEnergy);
    */
  }, [totalEnergy, localEnergy]); // Dependencies remain the same

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

      const savedSession = await saveReadingSessionToDatabase(
        params.userId,         // user_id - get from params instead of userId
        params.storyId,       // story_id - get from params instead of storyId
        audioUrl,             // audio_url
        new Date().toISOString(), // start_time
        durationInSeconds,    // duration
        new Date().toISOString(), // end_time
        localEnergy,         // energy_gained
        localEnergy,         // reading_points
        100,                // progress
        true                // completed
      );
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

  // Define milestone type as a union of possible values
  type Milestone = 20 | 40 | 60 | 80;

  // Create an array of milestone values
  const MILESTONES = [20, 40, 60, 80] as const;

  // Add a proper component cleanup effect that doesn't disable Audio
  useEffect(() => {
    console.log('ReadingScreen mounting');
    
    // Make sure audio API is enabled when component mounts
    if (isAudioShutdown) {
      Audio.setIsEnabledAsync(true).catch(console.error);
      isAudioShutdown = false;
    }
    
    // Return a cleanup function
    return () => {
      console.log('ReadingScreen unmounting - running cleanup');
      
      // Prevent further operations during cleanup
      isCleaningUp.current = true;
      
      // Clear intervals
      if (statusMonitorInterval.current) {
        clearInterval(statusMonitorInterval.current);
        statusMonitorInterval.current = null;
      }
      
      // Clean up recordings but DON'T disable the Audio API
      try {
        // Clean up component recording
        if (recording) {
          console.log('Cleaning up component recording');
          recording.stopAndUnloadAsync().catch(console.error);
          setRecording(null);
        }
        
        // Clean up global recording
        if (globalRecording) {
          console.log('Cleaning up global recording');
          globalRecording.stopAndUnloadAsync().catch(console.error);
          globalRecording = null;
        }
      } catch (error) {
        console.log('Error during cleanup:', error);
      }
    };
  }, []); // Empty deps = mount/unmount only

  // Completely rewrite the renderSettingsModal function for simplicity
  const renderSettingsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isSettingsVisible}
      onRequestClose={() => setIsSettingsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => setIsSettingsVisible(false)}>
          <View style={{flex: 1}}/>
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          {/* Drag indicator at top */}
          <View style={styles.dragIndicator} />
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsSettingsVisible(false)}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          {/* SIZE section */}
          <View style={styles.settingSection}>
            <Text style={styles.settingSectionTitle}>{t('readingScreen.size')}</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabelSmall}>Aa</Text>
              <Slider
                style={styles.slider}
                minimumValue={12}
                maximumValue={40}
                value={fontSize}
                onValueChange={(value) => setFontSize(value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.textSecondary}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderLabelLarge}>Aa</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          {/* CASE section */}
          <View style={styles.settingSection}>
            <Text style={styles.settingSectionTitle}>{t('readingScreen.case')}</Text>
            <View style={styles.caseButtonContainer}>
              <TouchableOpacity
                style={[styles.caseButton, textCase === 'normal' && styles.caseButtonActive]}
                onPress={() => setTextCase('normal')}
              >
                <Text style={[
                  styles.caseButtonText,
                  textCase === 'normal' && styles.caseButtonTextActive
                ]}>Aa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.caseButton, textCase === 'uppercase' && styles.caseButtonActive]}
                onPress={() => setTextCase('uppercase')}
              >
                <Text style={[
                  styles.caseButtonText,
                  textCase === 'uppercase' && styles.caseButtonTextActive
                ]}>AA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.caseButton, textCase === 'lowercase' && styles.caseButtonActive]}
                onPress={() => setTextCase('lowercase')}
              >
                <Text style={[
                  styles.caseButtonText,
                  textCase === 'lowercase' && styles.caseButtonTextActive
                ]}>aa</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          {/* FONT section */}
          <View style={styles.settingSection}>
            <Text style={styles.settingSectionTitle}>{t('readingScreen.font')}</Text>
            <View style={styles.radioButtonContainer}>
              <TouchableOpacity 
                style={styles.radioOption} 
                onPress={() => {
                  console.log('Setting font to normal');
                  setFontType('normal');
                }}
              >
                <View style={styles.radioButton}>
                  {fontType === 'normal' && <View style={styles.radioButtonSelected} />}
                </View>
                <Text style={styles.radioLabel}>{t('readingScreen.fontNormal')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioOption} 
                onPress={() => {
                  console.log('Setting font to dyslexia');
                  setFontType('dyslexia');
                }}
              >
                <View style={styles.radioButton}>
                  {fontType === 'dyslexia' && <View style={styles.radioButtonSelected} />}
                </View>
                <DyslexiaText 
                  style={{
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  {t('readingScreen.fontDyslexia')}
                </DyslexiaText>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          {/* HYPHENATION section - only show for Finnish */}
          {i18n.language === 'fi' && (
            <>
              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>{t('readingScreen.hyphenation')}</Text>
                <View style={styles.switchContainer}>
                  <Switch
                    value={isHyphenationEnabled}
                    onValueChange={setIsHyphenationEnabled}
                    trackColor={{ false: colors.textSecondary, true: colors.primary }}
                    thumbColor={colors.background01}
                    style={styles.switch}
                  />
                  <Text style={styles.switchLabel}>
                    {isHyphenationEnabled ? t('readingScreen.hyphenated') : t('readingScreen.notHyphenated')}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Add a new useEffect to handle font changes
  useEffect(() => {
    console.log('Font type changed:', fontType);
    // Force a re-render when font type changes
  }, [fontType]);

  // Add this effect to explicitly load the OpenDyslexic font when the component mounts
  useEffect(() => {
    async function loadDyslexicFont() {
      try {
        await Font.loadAsync({
          'OpenDyslexic-Regular': require('../../assets/fonts/OpenDyslexic-Regular.otf'),
        });
        console.log('OpenDyslexic font loaded directly in ReadingScreen');
      } catch (error) {
        console.error('Failed to load OpenDyslexic font directly:', error);
      }
    }
    
    loadDyslexicFont();
  }, []);

  // Render the Reading Screen UI
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('readingScreen.loadingStory')}</Text>
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
          <Text style={styles.title}>{currentStory ? currentStory.title : t('readingScreen.loading')}</Text>
          <TouchableOpacity 
            onPress={() => {
              console.log('Settings button pressed');
              setIsSettingsVisible(true);
            }} 
            style={styles.headerButton}
          >
            <MoreVertical size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.energyDisplayContainer}>
          <ReadingEnergyDisplay 
            energy={totalEnergy}
            sessionEnergy={localEnergy}
            recentGain={recentGain}
            isPaused={isPaused}
            readingState={readingState}
          />
        </View>

        <View style={styles.scrollViewWrapper}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <StoryContent
              content={currentStory?.content || ''}
              fontSize={fontSize}
              textCase={textCase}
              fontType={fontType}
              isHyphenationEnabled={isHyphenationEnabled}
              syllabifyText={syllabifyText}
            />
          </ScrollView>
        </View>

        {/* Add full-screen bottom gradient */}
        <LinearGradient
          colors={['rgba(21, 21, 22, 0)', 'rgba(21, 21, 22, 0.9)', 'rgba(21, 21, 22, 1)']}
          locations={[0, 0.5, 0.85]}
          style={styles.fullScreenGradient}
        />

        <View style={styles.bottomContainer}>
          {readingState === 'initial' && (
            <TouchableOpacity
              style={styles.readToYomiButton}
              onPress={handleStartReading}
            >
              <Mic size={24} color={colors.buttonTextDark} />
              <Text style={styles.readToYomiButtonText}>{t('readingScreen.readToYomi')}</Text>
            </TouchableOpacity>
          )}
          
          {readingState === 'preparing' && (
            <View style={styles.preparingContainer}>
              <ActivityIndicator size="large" color={colors.primary} style={styles.preparingSpinner} />
            </View>
          )}
          
          {readingState === 'recording' && (
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
                  <TouchableOpacity 
                    onPress={handleStopReading} 
                    style={styles.stopButton}
                    disabled={isStopLoading}
                  >
                    {isStopLoading ? (
                      <ActivityIndicator size="small" color="#191A22" />
                    ) : (
                      <Square size={20} color="#191A22" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </View>

      {renderSettingsModal()}
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
    paddingTop: 16,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing,
    height: 44,
    paddingHorizontal: 8,
  },
  headerButton: {
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 36,
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
    minHeight: 60,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 20,
    color: colors.text,
    lineHeight: 40,
    backgroundColor: colors.background,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  readToYomiButtonText: {
    color: colors.buttonTextDark,
    fontFamily: fonts.medium,
    fontSize: 18,
    marginLeft: 12,
  },
  recordingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.background02,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background02,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // Ensure content doesn't exceed screen height
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.medium,
    letterSpacing: 1,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabelSmall: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  sliderLabelLarge: {
    fontSize: 32,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  caseButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
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
    color: colors.textSecondary,
  },
  caseButtonTextActive: {
    fontSize: 18,
    color: colors.buttonTextDark,
  },
  scrollViewContent: {
    paddingBottom: 160,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 10, // Above the gradient
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  recordingInterface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    height: 60,
    backgroundColor: colors.background02,
    borderRadius: 30,
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
    backgroundColor: colors.background01,
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
  preparingContainer: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  preparingSpinner: {
    marginTop: 16,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    zIndex: 9999,
  },
  celebrationText: {
    color: colors.yellowDark,
    fontFamily: fonts.bold,
    fontSize: 24, // Smaller text size
    textAlign: 'center',
    marginBottom: 32, // More space between text and Yomi
    zIndex: 10000,
  },
  celebrationYomiContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yomiCircleBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF4D3', // Yellow background circle
  },
  celebrationYomi: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  sparkleSquare: {
    width: 8,
    height: 8,
    backgroundColor: colors.yellowDark,
    borderRadius: 1,
  },
  scrollViewWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -50,
    height: 200,
    zIndex: 5,
  },
  storyTitle: {
    fontSize: 24,
    color: colors.text,
    marginBottom: 16,
    fontFamily: fonts.bold,
  },
  storyText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 32,
    fontFamily: fonts.regular,
    letterSpacing: 0.5,
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.incorrect,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: 12,
  },
  progress: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  radioButtonContainer: {
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switch: {
    transform: [{ scale: 1.1 }],
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
});
