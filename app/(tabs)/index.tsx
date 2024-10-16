import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, SafeAreaView } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getUserReadingHistory, getUserTotalEnergy, getUserProfile, User as UserProfile } from '../../services/userService';
import { getYomiEnergy } from '../../services/yomiEnergyService';
import YomiEnergyDisplay from '../../components/YomiEnergyDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingSession } from '../../services/readingSessionsHelpers';
import Svg, { Path } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const SHAPE_SIZE = Math.min(128, width * 0.3); // This ensures it's at most 128px, but can be smaller on narrow screens

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

const getAvatarUrl = (profile: UserProfile | null): string | null => {
  if (!profile || !profile.avatar_url) return null;
  return Array.isArray(profile.avatar_url) ? profile.avatar_url[0] : profile.avatar_url;
};

export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [lastReadStory, setLastReadStory] = useState<ReadingSession | null>(null);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [currentEnergy, setCurrentEnergy] = useState(0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [yomiEnergy, setYomiEnergy] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const id = userId || storedUserId;
        if (id) {
          // Ensure id is a string before passing it to functions
          const userId = Array.isArray(id) ? id[0] : id;
          
          const userProfile = await getUserProfile(userId);
          setUserAvatar(getAvatarUrl(userProfile));
          
          try {
            const energy = await getYomiEnergy(userId);
            setCurrentEnergy(energy);
            setTotalEnergy(energy);
            setYomiEnergy(energy);
          } catch (error) {
            console.error('Error fetching Yomi energy:', error);
          }

          fetchReadingHistory(userId);
        } else {
          // If no userId is found, redirect to the select profile screen
          router.replace('/select-profile');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
  }, [userId]);

  const fetchReadingHistory = async (id: string) => {
    try {
      const history = await getUserReadingHistory(id);
      if (history.length > 0) {
        setLastReadStory(history[0]);
      }
    } catch (error) {
      console.error('Error fetching reading history:', error);
    }
  };

  const handleReadPress = () => {
    router.push({
      pathname: '/reading',
      params: { userId: userId as string }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Top right avatar */}
          <Pressable onPress={() => router.push('/profile')}>
            <Image
              source={userAvatar ? { uri: userAvatar } : require('../../assets/images/avatar.png')}
              style={styles.avatar}
            />
          </Pressable>

          {/* Main content */}
          <View style={styles.mainContent}>
            {lastReadStory ? (
              <>
                <Text style={styles.jumpBackText}>Jump back in</Text>
                <Pressable style={styles.lastReadStory} onPress={() => router.push(`/reading/${lastReadStory.stories.id}`)}>
                  <View style={styles.storyInfo}>
                    <Text style={styles.storyTitle}>{lastReadStory.stories.title}</Text>
                    <Text style={styles.storyProgress}>{lastReadStory.progress} words</Text>
                  </View>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.yomiContainer}>
                  <Svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 184 180" style={styles.shapeBackground}>
                    <Path
                      d="M147.296 34.918C128.753 16.8494 116.849 -0.00828492 91.0203 3.05478e-05C63.6175 0.00879629 53.4067 18.6067 34.255 38.3606C15.6594 57.5409 1.40808e-05 59.9999 0 89.9999C-1.40808e-05 120 16.4608 124.261 32.7869 141.147C51.8094 160.822 63.7238 179.919 91.0203 180C116.65 180.075 130.169 165.246 147.296 146.065C164.501 126.798 183.788 116.871 183.998 90.9835C184.211 64.776 166.019 53.1613 147.296 34.918Z"
                      fill={colors.green}
                    />
                  </Svg>
                  <Image
                    source={getYomiImage(totalEnergy)}
                    style={styles.yomiImage}
                  />
                </View>
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
          <YomiEnergyDisplay 
            energy={yomiEnergy} 
            onStatusPress={() => console.log("Navigate to Yomi's status page")}
          />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 'auto', // This will push the avatar to the right
  },
  mainContent: {
    backgroundColor: colors.background02,
    borderRadius: 16,
    borderColor: colors.stroke,
    borderWidth: 1,
    padding: layout.padding,
    alignItems: 'center',
    marginTop: 40, // Adjust this value to move the content higher
    marginBottom: layout.spacing,
    height: 320, // Increase the height to make it taller
  },
  yomiImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: layout.spacing,
    paddingTop: layout.padding, // Add some top padding
  },
  yomiContainer: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: layout.spacing,
  },
  shapeBackground: {
    position: 'absolute',
  },
});
