import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image, Animated, Alert } from 'react-native';
import { MoreVertical, ArrowLeft, Mic, Square } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getStories, Story } from '../services/storyService';
import { useFocusEffect } from '@react-navigation/native';
import { startSpeechRecognition } from '../services/speechRecognitionService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  saveReadingSessionToDatabase,
  ReadingSession,
  calculateWordsPerMinute,
  calculateComprehension
} from '../services/readingSessionsHelpers';
import { getYomiEnergy, addReadingEnergy, addStoryCompletionBonus } from '../services/yomiEnergyService';
import ReadingEnergyDisplay from '../components/ReadingEnergyDisplay';
import { 
  getUserTotalEnergy, 
  updateUserEnergy, 
  updateUserReadingPoints 
} from '../services/userService';

const ReadingScreen = () => {
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { userId, title } = useLocalSearchParams<{ userId: string, title?: string }>();
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [sessionEnergy, setSessionEnergy] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [correctWords, setCorrectWords] = useState(0);
  const [currentEnergy, setCurrentEnergy] = useState(0);
  const [energyUpdateInterval, setEnergyUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [energyPulse] = useState(new Animated.Value(1));
  const [recentGain, setRecentGain] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [energyProgress, setEnergyProgress] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchAndSetStories() {
        const fetchedStories = await getStories();
        setStories(fetchedStories);
        if (fetchedStories.length > 0) {
          const story = title 
            ? fetchedStories.find(s => s.title === title) 
            : fetchedStories[0];
          setCurrentStory(story || fetchedStories[0]);
        }
      }
      fetchAndSetStories();
    }, [title])
  );

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
    const fetchTotalEnergy = async () => {
      if (userId) {
        const energy = await getUserTotalEnergy(userId);
        setTotalEnergy(energy);
        setCurrentEnergy(energy);
      }
    };
    fetchTotalEnergy();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (energyUpdateInterval) {
        clearInterval(energyUpdateInterval);
      }
    };
  }, [energyUpdateInterval]);

  useEffect(() => {
    async function fetchYomiEnergy() {
      if (userId) {
        try {
          const energy = await getYomiEnergy(userId as string);
          setCurrentEnergy(energy);
        } catch (error) {
          console.error('Error fetching Yomi energy:', error);
        }
      }
    }
    fetchYomiEnergy();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    if (!recording) {
      console.log('No recording to stop');
      return;
    }

    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    return uri;
  };

  const handleBackPress = () => {
    router.back();
  };

  const updateEnergyWhileReading = useCallback(() => {
    if (isReading) {
      setEnergyProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 10) {
          // Energy gain every 10 seconds
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
    const interval = setInterval(updateEnergyWhileReading, 1000); // Update every second
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
      
      // Stop any existing recording
      await stopRecording();

      await startRecording();

      setIsReading(true);
      setStartTime(new Date());
      setSessionEnergy(0);
      console.log('Reading and recording started');
      
      // Call your existing start reading logic here
      // For example: startReadingSession();
    } catch (err) {
      console.error('Failed to start reading session', err);
      setIsReading(false);
    }
  };

  const handleStopReading = async () => {
    console.log('Stopping reading and recording...');
    setIsReading(false);

    if (recording && startTime && currentStory && userId) {
      if (typeof userId !== 'string') {
        console.error('Invalid userId type');
        return;
      }

      try {
        const audioUri = await stopRecording();
        if (audioUri) {
          console.log('Recording stopped, uri:', audioUri);
          
          const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
          
          await startSpeechRecognition(base64Audio, async (text) => {
            console.log('Transcript received:', text);
            setTranscript(text); // Keep this to save the transcript
            
            const endTime = new Date();
            const readingTimeMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
            const readingPoints = Math.round(readingTimeMinutes);

            // Calculate new energy
            const currentEnergy = await getUserTotalEnergy(userId);
            const energyGained = await addReadingEnergy(userId, readingTimeMinutes);
            const newEnergy = Math.min(currentEnergy + energyGained, 100);

            // Update user's energy and reading points
            await updateUserEnergy(userId, newEnergy);
            await updateUserReadingPoints(userId, readingPoints);

            // Navigate to results screen
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
          console.error('Failed to get audio URI from stopRecording');
          // Handle this error case
        }
      } catch (error) {
        console.error('Error stopping reading session:', error);
      }
    } else {
      console.error('Missing required data to stop reading session', { 
        hasRecording: !!recording, 
        hasStartTime: !!startTime, 
        hasCurrentStory: !!currentStory,
        userId: userId,
      });
    }
  };

  const updateProgress = (text: string) => {
    if (!currentStory) return;

    const storyWords = currentStory.content.split(' ');
    const spokenWords = text.split(' ');
    let newCorrectWords = 0;

    spokenWords.forEach((word, index) => {
      if (word.toLowerCase() === storyWords[index]?.toLowerCase()) {
        newCorrectWords++;
      }
    });

    setCorrectWords(newCorrectWords);
    const newProgress = (newCorrectWords / storyWords.length) * 100;

    const energyGained = Math.round((newProgress - (correctWords / storyWords.length * 100)) / 10);
    setSessionEnergy(prevEnergy => prevEnergy + energyGained);
    setTotalEnergy(prevTotal => Math.min(prevTotal + energyGained, 100)); // Cap at 100

    if (newProgress === 100) {
      const completionBonus = 50;
      setSessionEnergy(prevEnergy => prevEnergy + completionBonus);
      setTotalEnergy(prevTotal => prevTotal + completionBonus);
    }
  };

  const getYomiImage = (energy: number) => {
    if (energy >= 80) return require('../assets/images/yomi-max-energy.png');
    if (energy >= 60) return require('../assets/images/yomi-high-energy.png');
    if (energy >= 40) return require('../assets/images/yomi-medium-energy.png');
    if (energy >= 20) return require('../assets/images/yomi-low-energy.png');
    return require('../assets/images/yomi-very-low-energy.png');
  };

  const pulseEnergy = () => {
    Animated.sequence([
      Animated.timing(energyPulse, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(energyPulse, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();
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