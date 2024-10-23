import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { colors, fonts, layout } from '../app/styles/globalStyles';

interface AudioPlayerProps {
  audioUri: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUri }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const animatedValues = useRef<Animated.Value[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    loadAudio();
    generateWaveformData();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  const loadAudio = async () => {
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    setSound(sound);
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
    }
  };

  const generateWaveformData = () => {
    const data = Array(50).fill(0).map(() => Math.random() * 0.8 + 0.2);
    setWaveformData(data);
    animatedValues.current = data.map(() => new Animated.Value(0));
  };

  const playPauseSound = async () => {
    if (!isActive) {
      setIsActive(true);
    }
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
        startPositionUpdate();
        animateWaveform();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const startPositionUpdate = () => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            resetWaveform();
          }
        }
      });
    }
  };

  const animateWaveform = () => {
    const animations = animatedValues.current.map((value, index) => {
      return Animated.timing(value, {
        toValue: waveformData[index],
        duration: 500 + Math.random() * 1000,
        useNativeDriver: false,
      });
    });

    Animated.stagger(50, animations).start(() => {
      if (isPlaying) {
        animateWaveform();
      }
    });
  };

  const resetWaveform = () => {
    animatedValues.current.forEach((value) => value.setValue(0));
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={playPauseSound} style={styles.playPauseButton}>
        {isPlaying ? (
          <Pause color={colors.text} size={24} />
        ) : (
          <Play color={colors.text} size={24} />
        )}
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        {!isActive ? (
          <Text style={styles.listenText}>Kuuntele</Text>
        ) : (
          <>
            <View style={styles.waveformContainer}>
              {animatedValues.current.map((value, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: value.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: position / duration > index / animatedValues.current.length ? colors.primary : colors.stroke,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: 12,
  },
  playPauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    marginBottom: 8,
  },
  waveformBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  listenText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});

export default AudioPlayer;
