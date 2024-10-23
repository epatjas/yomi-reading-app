import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Platform, ScrollView, Image } from 'react-native';
import { ArrowLeft, Play, Pause, Clock, CheckSquare, ChevronDown, ChevronUp, CheckCircle, Timer, BookCheck } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, fonts, layout } from './styles/globalStyles';
import YomiEnergyDisplay from '../components/YomiEnergyDisplay';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { getYomiEnergy, getCurrentYomiEnergy } from '../services/yomiEnergyService';
import { supabase } from '../services/readingSessionsHelpers';

// Add this utility function at the top of your file
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Define AudioPlayerProps interface
interface AudioPlayerProps {
  audioUri: string;
}

const AudioWaveform: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const waveforms = useMemo(() => 
    new Array(30).fill(0).map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    if (isPlaying) {
      waveforms.forEach((waveform) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(waveform, {
              toValue: Math.random(),
              duration: 500 + Math.random() * 500,
              useNativeDriver: false,
            }),
            Animated.timing(waveform, {
              toValue: 0,
              duration: 500 + Math.random() * 500,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });
    } else {
      waveforms.forEach(waveform => {
        waveform.setValue(0);
      });
    }
  }, [isPlaying, waveforms]);

  return (
    <View style={styles.waveformContainer}>
      {waveforms.map((waveform, index) => {
        const opacity = Math.min(1, (index + 1) / 10, (30 - index) / 10);
        return (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: waveform.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
                opacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}
    </View>
  );
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUri }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadSound = async () => {
      try {
        console.log('Loading sound from URI:', audioUri);
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        if (isMounted) {
          setSound(sound);
          const status = await sound.getStatusAsync();
          console.log('Initial sound status:', status);
          if (status.isLoaded) {
            console.log('Setting initial duration:', status.durationMillis);
            setDuration(status.durationMillis || 0);
          }
        }
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };
    loadSound();
    return () => {
      isMounted = false;
      if (sound) {
        console.log('Unloading sound');
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      if (status.durationMillis && status.durationMillis !== duration) {
        console.log('Updating duration:', status.durationMillis);
        setDuration(status.durationMillis);
      }
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        console.log('Pausing playback');
        await sound.pauseAsync();
      } else {
        console.log('Starting playback');
        await sound.playAsync();
      }
    }
  };

  console.log('Rendering AudioPlayer. Duration:', duration, 'Position:', position);

  return (
    <View style={styles.audioPlayerContainer}>
      <TouchableOpacity onPress={togglePlayback} style={styles.playPauseButton}>
        {isPlaying ? (
          <Pause color={colors.text} size={20} />
        ) : (
          <Play color={colors.text} size={20} />
        )}
      </TouchableOpacity>
      <View style={styles.waveformBackground}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <View style={styles.audioWaveContainer}>
          <AudioWaveform isPlaying={isPlaying} />
        </View>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const ReadingResultsScreen: React.FC = () => {
  const router = useRouter();
  const { readingSessionId, readingTime, readingPoints, energy, audioUri, correctAnswers, totalQuestions, userId } = useLocalSearchParams<{
    readingSessionId: string;
    readingTime: string;
    readingPoints: string;
    energy: string;
    audioUri: string;
    correctAnswers: string;
    totalQuestions: string;
    userId: string;
  }>();

  const [currentEnergy, setCurrentEnergy] = useState(parseInt(energy || '0'));
  const [overallEnergy, setOverallEnergy] = useState(parseInt(energy || '0'));

  useEffect(() => {
    const fetchData = async () => {
      if (readingSessionId) {
        try {
          const sessionEnergy = await getYomiEnergy(readingSessionId);
          console.log('Energy gained in this session:', sessionEnergy);
          setCurrentEnergy(sessionEnergy);

          if (userId) {
            const currentOverallEnergy = await getCurrentYomiEnergy(userId);
            console.log('Current overall Yomi Energy:', currentOverallEnergy);
            setOverallEnergy(currentOverallEnergy);
          }
        } catch (error) {
          console.error('Error fetching energy data:', error);
        }
      }
    };
    fetchData();
  }, [readingSessionId, userId]);

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          const currentOverallEnergy = await getCurrentYomiEnergy(userId);
          console.log('Current overall Yomi Energy:', currentOverallEnergy);
          setOverallEnergy(currentOverallEnergy);
        } catch (error) {
          console.error('Error fetching energy data:', error);
        }
      }
    };
    fetchData();
  }, [userId]);

  // Convert reading time from seconds to minutes and seconds
  const readingTimeSeconds = readingTime ? parseInt(readingTime) : 0;
  const readingTimeMinutes = Math.floor(readingTimeSeconds / 60);
  const readingTimeRemainingSeconds = readingTimeSeconds % 60;

  console.log(`Received readingTime: ${readingTimeSeconds} seconds`);
  console.log(`Calculated readingTimeMinutes: ${readingTimeMinutes} minutes and ${readingTimeRemainingSeconds} seconds`);

  const calculateComprehensionPercentage = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const comprehensionPercentage = calculateComprehensionPercentage(
    parseInt(correctAnswers || '0'),
    parseInt(totalQuestions || '1')
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.scrollContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Your results</Text>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.purpleBox]}>
              <View style={[styles.iconContainer, styles.purpleIconContainer]}>
                <Timer color={colors.background} size={24} />
              </View>
              <Text style={styles.statValue}>
                {readingTimeMinutes}:{readingTimeRemainingSeconds.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>Reading time</Text>
            </View>
            <View style={[styles.statBox, styles.greenBox]}>
              <View style={[styles.iconContainer, styles.greenIconContainer]}>
                <BookCheck color={colors.background} size={24} />
              </View>
              <Text style={styles.statValue}>
                {readingPoints ? parseInt(readingPoints) : 0}
              </Text>
              <Text style={styles.statLabel}>Reading points</Text>
            </View>
          </View>
          
          <View style={styles.comprehensionContainer}>
            <View style={styles.comprehensionBox}>
              <View style={styles.comprehensionTextContainer}>
                <Text style={styles.comprehensionValue}>{comprehensionPercentage}%</Text>
                <Text style={styles.comprehensionLabel}>Reading comprehension</Text>
              </View>
              <View style={styles.comprehensionIconContainer}>
                <CheckCircle color={colors.background} size={24} />
              </View>
            </View>
          </View>
          
          <YomiEnergyDisplay 
            energy={overallEnergy} 
            onStatusPress={() => router.push('/yomi-status')}
          />
          
          <Text style={styles.listenText}>Listen to your reading</Text>
          {audioUri && <AudioPlayer audioUri={audioUri} />}
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push({
              pathname: '/(tabs)/reading',
              params: { userId: readingSessionId.split('-')[0] }
            })}
          >
            <Text style={styles.buttonText}>Read next story</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Or read again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: layout.padding,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  purpleBox: {
    backgroundColor: colors.lavender,
    marginRight: 4,
  },
  greenBox: {
    backgroundColor: colors.green,
    marginLeft: 4,
  },
  iconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purpleIconContainer: {
    backgroundColor: colors.lavenderDark,
  },
  greenIconContainer: {
    backgroundColor: colors.greenDark,
  },
  statValue: {
    fontSize: 36,
    fontFamily: fonts.regular,
    color: colors.background,
    marginBottom: 4,
    marginTop: 40,
    textAlign: 'left',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.background,
    textAlign: 'left',
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  playPauseButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  waveformBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background01,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 44, // Set a fixed height
  },
  timeText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginRight: 8,
    width: 40,
  },
  audioWaveContainer: {
    flex: 1,
    height: 28, // Reduced height
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'space-between',
  },
  waveformBar: {
    width: 2, // Slightly thinner bars
    borderRadius: 4,
    marginHorizontal: 1,
  },
  listenText: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 16,
    marginTop: 12,
  },
  bottomContainer: {
    padding: layout.padding,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  linkText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
  },
  
  pinkBox: {
    backgroundColor: colors.pink,
  },
  pinkIconContainer: {
    backgroundColor: colors.pinkDark,
  },
  statIcon: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  fullWidthBox: {
    marginTop: 12,
    marginBottom: 12,
  },
  comprehensionContainer: {
    marginBottom: 12,
  },
  comprehensionBox: {
    backgroundColor: colors.pink,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comprehensionTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  comprehensionValue: {
    fontSize: 24,
    fontFamily: fonts.medium,
    color: colors.background,
  },
  comprehensionLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.background,
    marginTop: 4,
  },
  comprehensionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.pinkDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default ReadingResultsScreen;
