import React, { useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, Animated, Text, Platform } from 'react-native';
import { colors, fonts, layout } from '../../app/styles/globalStyles';
import Svg, { Path } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { ENERGY_GAIN_AMOUNT, MAX_ENERGY } from '../../services/yomiEnergyService';
import Sparkle from './SparkleEffect';
import { Music } from 'lucide-react-native';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
const SHAPE_SIZE = 48;

interface ReadingEnergyDisplayProps {
  energy: number;
  sessionEnergy: number;
  recentGain: number;
  isPaused: boolean;
  readingState: 'initial' | 'preparing' | 'recording';
}

export const getYomiImage = (energy: number) => {
  if (energy >= 80) return require('../../assets/images/yomi-max-energy.png');
  if (energy >= 60) return require('../../assets/images/yomi-high-energy.png');
  if (energy >= 40) return require('../../assets/images/yomi-medium-energy.png');
  if (energy >= 20) return require('../../assets/images/yomi-low-energy.png');
  return require('../../assets/images/yomi-very-low-energy.png');
};

const getMilestoneMessage = (milestone: number) => {
  switch (milestone) {
    case 20:
      return "Great start! Keep going!";
    case 40:
      return "You're doing great!";
    case 60:
      return "Amazing! Keep on reading!";
    case 80:
      return "Incredible reading streak!";
    default:
      return "Amazing! Keep on reading!";
  }
};

const ReadingEnergyDisplay: React.FC<ReadingEnergyDisplayProps> = ({ 
  energy, 
  sessionEnergy, 
  recentGain,
  isPaused,
  readingState,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(energy)).current;
  const sparkleAnims = useRef(Array(5).fill(0).map(() => ({
    position: new Animated.ValueXY({ x: 0, y: 0 }),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0),
  }))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const noteAnim1 = useRef(new Animated.Value(0)).current;
  const noteAnim2 = useRef(new Animated.Value(0)).current;

  const sound = useRef<Audio.Sound | null>(null);

  const playTwinkleSound = useCallback(async () => {
    try {
      if (sound.current) {
        await sound.current.replayAsync();
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/twinkle.mp3')
        );
        sound.current = newSound;
        await newSound.playAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }, []);

  const animateSparkles = useCallback(() => {
    sparkleAnims.forEach((anim) => {
      anim.position.setValue({ x: 0, y: 0 });
      anim.scale.setValue(0);
      anim.opacity.setValue(0);
    });

    sparkleAnims.forEach((anim) => {
      const randomX = (Math.random() - 0.5) * 120;
      const randomY = (Math.random() - 0.5) * 60;

      Animated.parallel([
        Animated.timing(anim.position, {
          toValue: { x: randomX, y: randomY },
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(anim.scale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (recentGain > 0 && !isPaused) {
      animateSparkles();
      playTwinkleSound();
    }
  }, [recentGain, isPaused, animateSparkles, playTwinkleSound]);

  useEffect(() => {
    if (!isPaused) {
      Animated.timing(fillAnim, {
        toValue: Math.min(energy + sessionEnergy, MAX_ENERGY),
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [energy, sessionEnergy, isPaused]);

  useEffect(() => {
    if (readingState === 'recording' && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
  }, [readingState, isPaused]);

  useEffect(() => {
    if (readingState === 'recording' && !isPaused) {
      const animateNote = (noteAnim: Animated.Value) => {
        Animated.sequence([
          Animated.timing(noteAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(noteAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start(() => animateNote(noteAnim));
      };

      animateNote(noteAnim1);
      setTimeout(() => animateNote(noteAnim2), 1000);
    } else {
      noteAnim1.setValue(0);
      noteAnim2.setValue(0);
    }
  }, [readingState, isPaused]);

  const totalEnergy = Math.min(energy + sessionEnergy, MAX_ENERGY);

  return (
    <View style={styles.container}>
      <View style={styles.yomiContainer}>
        <Animated.View 
          style={[
            styles.yomiCircleBackground,
            {
              transform: [{ scale: pulseAnim }],
            }
          ]} 
        />
        <Image 
          source={getYomiImage(energy + sessionEnergy)}
          style={styles.yomiIcon}
        />
        {readingState === 'recording' && !isPaused && (
          <>
            <Animated.View style={[
              styles.musicNote,
              {
                transform: [
                  { translateY: noteAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30]
                  })},
                  { translateX: noteAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20]
                  })},
                ],
                opacity: noteAnim1.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
              }
            ]}>
              <Music size={16} color={colors.yellowDark} />
            </Animated.View>
            <Animated.View style={[
              styles.musicNote,
              {
                transform: [
                  { translateY: noteAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30]
                  })},
                  { translateX: noteAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20]
                  })},
                ],
                opacity: noteAnim2.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
              }
            ]}>
              <Music size={16} color={colors.yellowDark} />
            </Animated.View>
          </>
        )}
      </View>

      {readingState === 'initial' ? (
        <View style={styles.initialStateContainer}>
          <View style={styles.speechBubble}>
            <Text style={styles.initialStateText}>
              Tap the mic when you're ready to read!
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.rightContainer}>
          <View style={styles.energyBarContainer}>
            <Animated.View 
              style={[
                styles.energyBarFill, 
                { 
                  width: fillAnim.interpolate({
                    inputRange: [0, MAX_ENERGY],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }) 
                }
              ]} 
            >
              <View style={styles.energyBarInnerPill} />
            </Animated.View>
          </View>
          
          <View style={styles.animationOverlay}>
            <Animated.Text 
              style={[
                styles.energyGainText, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10]
                  })}]
                }
              ]}
            >
              +{ENERGY_GAIN_AMOUNT}
            </Animated.Text>
            
            {sparkleAnims.map((anim, i) => (
              <Sparkle
                key={i}
                size={12}
                color="#D4B872"
                style={{
                  transform: [
                    { translateX: anim.position.x },
                    { translateY: anim.position.y },
                    { scale: anim.scale },
                    { rotate: '45deg' },
                  ],
                  opacity: anim.opacity,
                  position: 'absolute',
                  left: '40%',
                }}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    marginBottom: 10,
  },
  yomiContainer: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  yomiCircleBackground: {
    position: 'absolute',
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    borderRadius: SHAPE_SIZE / 2,
    backgroundColor: '#FFF4D3',
  },
  yomiIcon: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  musicNote: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  rightContainer: {
    flex: 1,
    marginLeft: 12,
    position: 'relative',
  },
  energyBarContainer: {
    height: 16,
    backgroundColor: colors.stroke,
    borderRadius: 16,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '75%',
    backgroundColor: colors.yellowDark,
    borderRadius: 12,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  energyBarInnerPill: {
    position: 'absolute',
    top: '25%',
    height: '50%',
    width: '30%',
    left: '3%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  celebrationText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    zIndex: 1000,
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '100%',
  },
  initialStateText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  animationOverlay: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    bottom: -20,
    pointerEvents: 'none',
    zIndex: 10,
  },
  energyGainText: {
    position: 'absolute',
    top: 0,
    right: '40%',
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    width: 40,
    textAlign: 'center',
    zIndex: 11,
  },
});

export default ReadingEnergyDisplay;
