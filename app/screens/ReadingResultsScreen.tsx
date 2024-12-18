import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ArrowLeft, Timer, BookCheck, CheckCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import YomiEnergyDisplay from '../../components/shared/YomiEnergyDisplay';
import { getYomiEnergy, getCurrentYomiEnergy } from '../../services/yomiEnergyService';
import AudioPlayer from '../../components/shared/AudioPlayer';

// Add this utility function at the top of your file
const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ReadingResultsScreen: React.FC = () => {
  const router = useRouter();
  const { readingSessionId, readingTime, readingPoints, audioUri, correctAnswers, totalQuestions, userId, storyId } = useLocalSearchParams<{
    readingSessionId: string;
    readingTime: string;
    readingPoints: string;
    audioUri: string;
    correctAnswers: string;
    totalQuestions: string;
    userId: string;
    storyId: string;
  }>();

  const [currentEnergy, setCurrentEnergy] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          // Get the current overall energy
          const currentOverallEnergy = await getCurrentYomiEnergy(userId);
          console.log('Current overall Yomi Energy:', currentOverallEnergy);
          setCurrentEnergy(currentOverallEnergy);
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
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
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
            energy={currentEnergy}
            onStatusPress={() => router.push({
              pathname: '/(tabs)',
              params: { userId: userId }
            })}
          />
          
          {audioUri && <AudioPlayer audioUri={audioUri} />}
          
          <View style={styles.bottomPadding} />
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
          
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/screens/ReadingScreen',
              params: {
                storyId: storyId,
                userId: userId
              }
            })}
          >
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
  },
  scrollContentContainer: {
    padding: layout.padding,
    paddingBottom: 120, 
  },
  bottomPadding: {
    height: 80, 
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: layout.padding,
    paddingBottom: 4, 
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
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
    padding: 16,
    marginTop: 16,
  },
  playPauseButton: {
    marginRight: 16,
  },
  audioText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
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
