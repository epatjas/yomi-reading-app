// Import necessary React and React Native components
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Alert, Modal, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { MoreVertical, ArrowLeft, Square, Mic, X } from 'lucide-react-native';
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
import { addReadingEnergy, ENERGY_GAIN_PER_10_SECONDS } from '../services/yomiEnergyService';
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
  const [energyProgress, setEnergyProgress] = useState(0);
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
  const stopRecording = async (): Promise<void> => {
    if (!recording) {
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
          setSessionEnergy(prevEnergy => prevEnergy + ENERGY_GAIN_PER_10_SECONDS);
          setRecentGain(ENERGY_GAIN_PER_10_SECONDS);
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
      setIsRecordingInterfaceVisible(true);

      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

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
        
        // Keep only the recording logic
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
      const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const fileExtension = uri.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .upload(filePath, decode(fileContent), {
          contentType: `audio/${fileExtension}`,
        });

      if (error) {
        console.error('Error uploading file to Supabase:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAudioToSupabase:', error);
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
    Animated.timing(recordingAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    let audioUrl = '';
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        if (uri) {
          audioUrl = await uploadAudioToSupabase(uri);
        }
      } catch (error) {
        console.error('Error stopping recording or uploading audio:', error);
      }
    }

    // Calculate reading time
    const endTime = new Date();
    const startTimeDate = startTime || new Date();
    const durationInSeconds = Math.round((endTime.getTime() - startTimeDate.getTime()) / 1000);

    // Update energy using addReadingEnergy
    const updatedEnergy = await addReadingEnergy(userId, durationInSeconds);

    // Update reading points
    await updateUserReadingPoints(userId, sessionEnergy);

    // Save the reading session to the database
    try {
      const readingSession: Omit<ReadingSession, 'id'> = {
        user_id: userId,
        story_id: currentStory?.id || '',
        start_time: startTimeDate.toISOString(),
        end_time: endTime.toISOString(),
        duration: durationInSeconds,
        energy_gained: sessionEnergy,
        reading_points: sessionEnergy,
        audio_url: audioUrl,
        progress: 100,
        completed: true,
        story_title: currentStory?.title
      };

      const savedSession = await saveReadingSessionToDatabase(readingSession);

      // Navigate to ReadingResultsScreen
      router.push({
        pathname: '/ReadingResultsScreen',
        params: {
          readingTime: durationInSeconds.toString(),
          readingPoints: sessionEnergy.toString(),
          energy: updatedEnergy.toString(),
          audioUri: audioUrl,
          userId: userId,
        },
      });
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

  // Instead, add a new useEffect to update energy every 10 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isReading) {
      intervalId = setInterval(() => {
        const energyGain = ENERGY_GAIN_PER_10_SECONDS;
        setSessionEnergy(prevEnergy => prevEnergy + energyGain);
        setRecentGain(energyGain);
        setTimeout(() => setRecentGain(0), 2000);
      }, 10000); // 10 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isReading]);

  const toggleTextCase = () => {
    setTextCase(prevCase => prevCase === 'normal' ? 'uppercase' : 'normal');
  };

  const syllabifyText = (text: string) => {
    return text.split(' ').map(word => syllabify(word)).join(' ');
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
          <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.headerButton}>
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

        {isRecordingInterfaceVisible && (
          <Animated.View style={[
            styles.recordingInterface,
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
          ]}>
            <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
              <X size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.waveformContainer}>
              {waveformData.map(({ current }, index) => (
                <LinearGradient
                  key={index}
                  colors={['#C652F0', '#5F79FF']} // Gradient colors from light to dark
                  start={{ x: 0, y: 0 }} // Start from top
                  end={{ x: 0, y: 1 }} // End at bottom
                  style={[
                    styles.waveformBar,
                    { 
                      height: `${current * 100}%`,
                    }
                  ]}
                />
              ))}
            </View>
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>
                {formatDuration(Math.round((new Date().getTime() - (startTime?.getTime() || 0)) / 1000))}
              </Text>
            </View>
            <TouchableOpacity onPress={handleStopReading} style={styles.stopButton}>
              <Square size={20} color="black" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {!isRecordingInterfaceVisible && (
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleStartReading}
          >
            <Mic size={24} color={colors.text} />
          </TouchableOpacity>
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

  recordingInterface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background02, // Solid dark background
    borderWidth: 1,
    borderColor: colors.stroke, // Slightly lighter border for subtle definition
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
    padding: 12,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 60, // Fixed height for the interface
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50, 50, 50, 0.8)', // Slightly lighter than the background
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 28, // Reduced height to match ReadingResultsScreen
    marginHorizontal: 16,
  },
  waveformBar: {
    width: 2, // Slightly thinner bars
    marginHorizontal: 1, // Space between bars
    borderRadius: 4,
    height: '100%', // Full height of container
  },
  durationContainer: {
    marginRight: 16,
  },
  durationText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 120, // Add extra padding at the bottom
  },
});

export default ReadingScreen;
