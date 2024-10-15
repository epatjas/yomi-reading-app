import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Platform, ScrollView } from 'react-native';
import { ArrowLeft, Play, Pause, Clock, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { colors, fonts, layout } from './styles/globalStyles';
import YomiEnergyDisplay from '../components/YomiEnergyDisplay';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { getYomiEnergy } from '../services/yomiEnergyService';

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

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    // Load the sound and get its duration
    const loadSound = async () => {
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(sound);
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
    };
    loadSound();
  }, [audioUri]);

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
      </View>
    </View>
  );
};

const ReadingResultsScreen: React.FC = () => {
  const router = useRouter();
  const { readingTime, readingPoints, energy, audioUri, userId, transcript } = useLocalSearchParams<{
    readingTime: string;
    readingPoints: string;
    energy: string;
    audioUri: string;
    userId: string;
    transcript: string;
  }>();

  console.log(`ReadingResultsScreen received energy: ${energy}`);
  console.log(`Received reading points: ${readingPoints}`);

  // Convert reading time from seconds to minutes and seconds
  const readingTimeSeconds = readingTime ? parseInt(readingTime) : 0;
  const readingTimeMinutes = Math.floor(readingTimeSeconds / 60);
  const readingTimeRemainingSeconds = readingTimeSeconds % 60;

  console.log(`Received readingTime: ${readingTimeSeconds} seconds`);
  console.log(`Calculated readingTimeMinutes: ${readingTimeMinutes} minutes and ${readingTimeRemainingSeconds} seconds`);

  const [showTranscript, setShowTranscript] = useState(false);
  const [currentEnergy, setCurrentEnergy] = useState(parseInt(energy));

  useEffect(() => {
    const fetchCurrentEnergy = async () => {
      if (userId) {
        const latestEnergy = await getYomiEnergy(userId);
        setCurrentEnergy(latestEnergy);
      }
    };
    fetchCurrentEnergy();
  }, [userId]);

  const toggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };

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
                <Clock color={colors.background} size={24} />
              </View>
              <Text style={styles.statValue}>
                {readingTimeMinutes}:{readingTimeRemainingSeconds.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>Reading time</Text>
            </View>
            <View style={[styles.statBox, styles.greenBox]}>
              <View style={[styles.iconContainer, styles.greenIconContainer]}>
                <CheckSquare color={colors.background} size={24} />
              </View>
              <Text style={styles.statValue}>
                {readingPoints ? parseInt(readingPoints) : 0}
              </Text>
              <Text style={styles.statLabel}>Reading points</Text>
            </View>
          </View>
          
          <YomiEnergyDisplay 
            energy={currentEnergy} 
            onStatusPress={() => router.push('/yomi-status')}
          />
          
          <Text style={styles.listenText}>Listen to your reading</Text>
          {audioUri && <AudioPlayer audioUri={audioUri} />}
          
          <TouchableOpacity onPress={toggleTranscript} style={styles.transcriptToggle}>
            <Text style={styles.transcriptToggleText}>
              {showTranscript ? 'Hide Transcription' : 'Show Transcription'}
            </Text>
            {showTranscript ? <ChevronUp color={colors.text} size={24} /> : <ChevronDown color={colors.text} size={24} />}
          </TouchableOpacity>
          
          {showTranscript && (
            <View style={styles.transcriptionContainer}>
              <Text style={styles.transcriptionText}>{transcript}</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push({
              pathname: '/(tabs)/reading',
              params: { userId: userId }
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
    position: 'relative', // Add this to allow absolute positioning of children
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
    position: 'absolute', // Position absolutely within the statBox
    top: 16, // Align with the top padding of the statBox
    right: 16, // Align with the left padding of the statBox
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
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
    fontSize: 36, // Slightly smaller to fit both minutes and seconds
    fontFamily: fonts.regular,
    color: colors.background,
    marginBottom: 4,
    marginTop: 40,
    textAlign: 'left',
  },
  statUnit: {
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.background,
    textAlign: 'left', // Center the text horizontally
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
  transcriptionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  transcriptionContainer: {
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    maxHeight: 200, // Limit the height and make it scrollable if needed
  },
  transcriptionText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 24,
  },
  transcriptToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  transcriptToggleText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});

export default ReadingResultsScreen;