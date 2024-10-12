import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, SafeAreaView } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Zap, Percent } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getUserReadingHistory, getUserTotalEnergy } from '../../services/userService';
import { getYomiEnergy } from '../../services/yomiEnergyService';
import YomiEnergyDisplay from '../../components/YomiEnergyDisplay';
import YomiIcon from '../../assets/images/yomi-icon.png'; // Adjust this path as needed

interface ReadingHistoryItem {
  id: string;
  progress: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  stories: {
    id: string;
    title: string;
    cover_image: string;
  };
}

const getYomiImage = (energy: number) => {
  if (energy >= 80) return require('../../assets/images/yomi-max-energy.png');
  if (energy >= 60) return require('../../assets/images/yomi-high-energy.png');
  if (energy >= 40) return require('../../assets/images/yomi-medium-energy.png');
  if (energy >= 20) return require('../../assets/images/yomi-low-energy.png');
  return require('../../assets/images/yomi-very-low-energy.png');
};

const getYomiMessage = (energy: number) => {
  if (energy >= 80) return { line1: "Yomi is happy!", line2: "Reading makes Yomi happy!" };
  if (energy >= 60) return { line1: "Yomi wants attention.", line2: "Yomi wants a story!" };
  if (energy >= 40) return { line1: "Yomi seems a bit sleepy.", line2: "Reading gives Yomi much energy." };
  if (energy >= 20) return { line1: "Yomi needs your care.", line2: "Please read to Yomi." };
  return { line1: "Yomi is very tired.", line2: "Yomi needs your care!" };
};

export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [lastReadStory, setLastReadStory] = useState<ReadingHistoryItem | null>(null);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [currentEnergy, setCurrentEnergy] = useState(0);

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

  const fetchReadingHistory = async (id: string) => {
    try {
      const history = await getUserReadingHistory(id);
      if (history && history.length > 0) {
        setLastReadStory(history[0]);
      }
    } catch (error) {
      console.error('Error fetching reading history:', error);
    }
  };

  const handleReadPress = () => {
    router.push('/reading');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Top right avatar */}
          <Pressable onPress={() => router.push('/profile')}>
            <Image
              source={require('../../assets/images/avatar.png')}
              style={styles.avatar}
            />
          </Pressable>

          {/* Main content */}
          <View style={styles.mainContent}>
            {lastReadStory ? (
              <>
                <Text style={styles.jumpBackText}>Jump back in</Text>
                <Pressable style={styles.lastReadStory} onPress={() => router.push(`/reading/${lastReadStory.stories.id}`)}>
                  <Image
                    source={{ uri: lastReadStory.stories.cover_image }}
                    style={styles.storyCover}
                  />
                  <View style={styles.storyInfo}>
                    <Text style={styles.storyTitle}>{lastReadStory.stories.title}</Text>
                    <Text style={styles.storyProgress}>{lastReadStory.progress} words</Text>
                  </View>
                </Pressable>
              </>
            ) : (
              <>
                <Image
                  source={getYomiImage(totalEnergy)}
                  style={styles.yomiImage}
                />
                <View style={styles.messageContainer}>
                  <Text style={styles.messageLine}>{getYomiMessage(totalEnergy).line1}</Text>
                  <Text style={styles.messageLine}>{getYomiMessage(totalEnergy).line2}</Text>
                </View>
              </>
            )}
            <Pressable style={styles.readButton} onPress={handleReadPress}>
              <Text style={styles.readButtonText}>
                {lastReadStory ? 'Continue Reading' : 'Read to Yomi'}
              </Text>
            </Pressable>
          </View>

          {/* Energy level card */}
          <View style={styles.energyCard}>
            <YomiEnergyDisplay 
              energy={currentEnergy} 
              onStatusPress={() => console.log("Navigate to Yomi's status page")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: layout.padding,
    paddingTop: 0, // Remove top padding
  },
  avatar: {
    position: 'absolute',
    top: layout.padding,
    right: 0, // Align to the right edge of the container
    width: 44,
    height: 44,
    borderRadius: 22, // Make it perfectly round
    zIndex: 1,
  },
  mainContent: {
    backgroundColor: colors.background02,
    borderRadius: 16,
    borderColor: colors.stroke,
    borderWidth: 1,
    padding: layout.padding,
    alignItems: 'center',
    marginTop: 100, // Adjust this value to move the content higher
    marginBottom: layout.spacing,
    height: 360, // Increase the height to make it taller
  },
  yomiImage: {
    width: 120, // Reduced size
    height: 120, // Reduced size
    marginBottom: layout.spacing * 2,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 16, 
    lineHeight: 27, 
    color: colors.text,
    textAlign: 'center',
    marginBottom: layout.spacing * 2,
  },
  readButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%', // Make the button wider
  },
  readButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.buttonText,
    textAlign: 'center', // Center the text in the wider button
  },
  energyCard: {
    backgroundColor: colors.yellowLight,
    borderRadius: 16,
    padding: layout.padding,
    marginBottom: layout.spacing,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  yomiSmall: {
    width: 48,
    height: 48,
  },
  energyIconContainer: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 12,
    padding: 8,
  },
  energyLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from 'flex-start' to 'center'
    marginBottom: layout.spacing,
  },
  energyLevel: {
    fontFamily: fonts.regular,
    fontSize: 56,
    letterSpacing: -2, // Add a slight negative letter-spacing
    color: colors.background,
    marginRight: 8,
    lineHeight: 56, // Added to ensure proper vertical alignment
  },
  energyLevelDetails: {
    flexDirection: 'column',
    justifyContent: 'center', // Changed from 'flex-start' to 'center'
  },
  energyPercent: {
    marginBottom: 4, // Add some space between the icon and the text
  },
  energyText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.background,
    lineHeight: 16, // Added to ensure proper vertical alignment
  },
  energyBar: {
    height: 12, // Increased thickness
    backgroundColor: colors.background,
    borderRadius: 6, // Rounded edges
    marginBottom: layout.spacing,
    padding: 2, // Small padding
  },
  energyFill: {
    height: '100%',
    backgroundColor: colors.yellowDark,
    borderRadius: 4, // Rounded edges for the fill
  },
  careText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.background,
    textAlign: 'right',
  },
  futureContentPlaceholder: {
    height: 200, // Placeholder height, adjust as needed
  },
  jumpBackText: {
    fontFamily: fonts.regular,
    fontSize: 24,
    color: colors.text,
    marginBottom: layout.spacing,
  },
  lastReadStory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: layout.padding,
    marginBottom: layout.spacing * 2,
  },
  storyCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: layout.spacing,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  storyProgress: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  messageLine: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  yomiLinkText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.background,
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
});
