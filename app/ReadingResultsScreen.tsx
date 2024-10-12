import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { ArrowLeft, Play, Pause, Timer, CheckSquare, AlignJustify } from 'lucide-react-native';
import { colors, fonts, layout } from './styles/globalStyles';
import YomiEnergyDisplay from '../components/YomiEnergyDisplay';

const getYomiImage = (energy: number) => {
  if (energy >= 80) return require('../assets/images/yomi-max-energy.png');
  if (energy >= 60) return require('../assets/images/yomi-high-energy.png');
  if (energy >= 40) return require('../assets/images/yomi-medium-energy.png');
  if (energy >= 20) return require('../assets/images/yomi-low-energy.png');
  return require('../assets/images/yomi-very-low-energy.png');
};

const ReadingResultsScreen = () => {
  const router = useRouter();
  const { readingTime, readingPoints, energy, audioUri, transcript } = useLocalSearchParams<{
    readingTime: string;
    readingPoints: string;
    energy: string;
    audioUri: string;
    transcript: string;
  }>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playPauseAudio = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Your results</Text>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, styles.purpleBox]}>
            <View style={[styles.iconContainer, styles.purpleIconContainer]}>
              <Timer color={colors.background} size={24} />
            </View>
            <Text style={styles.statValue}>{readingTime}<Text style={styles.statUnit}> min</Text></Text>
            <Text style={styles.statLabel}>Reading time</Text>
          </View>
          <View style={[styles.statBox, styles.greenBox]}>
            <View style={[styles.iconContainer, styles.greenIconContainer]}>
              <CheckSquare color={colors.background} size={24} />
            </View>
            <Text style={styles.statValue}>{readingPoints}</Text>
            <Text style={styles.statLabel}>Reading points</Text>
          </View>
        </View>
        
        <YomiEnergyDisplay 
          energy={parseInt(energy)} 
          onStatusPress={() => router.push('/yomi-status')}
        />
        
        <View style={styles.audioPlayerContainer}>
          <TouchableOpacity onPress={playPauseAudio} style={styles.playPauseButton}>
            {isPlaying ? <Pause color={colors.text} size={24} /> : <Play color={colors.text} size={24} />}
          </TouchableOpacity>
          <Text style={styles.audioText}>Kuuntele</Text>
          <AlignJustify color={colors.text} size={24} />
        </View>
        
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/library')}>
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
  container: {
    flex: 1,
    padding: layout.padding,
    paddingTop: 0, // Remove top padding as it's handled by SafeAreaView
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    height: 180, // Increased height
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-end', // Align content to the bottom
    position: 'relative',
  },
  purpleBox: {
    backgroundColor: colors.lavender,
  },
  greenBox: {
    backgroundColor: colors.green,
  },
  iconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
  },
  purpleIconContainer: {
    backgroundColor: colors.lavenderDark,
  },
  greenIconContainer: {
    backgroundColor: colors.greenDark,
  },
  statValue: {
    fontSize: 32,
    fontFamily: fonts.regular,
    color: colors.background,
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.background,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.background,
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  bottomContainer: {
    marginTop: 'auto', // Push to bottom
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ReadingResultsScreen;
