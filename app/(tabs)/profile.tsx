import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, Pressable, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { BookCheck, History, ArrowLeft, LineChart, Edit2, ArrowLeftRight, Play, Pause, Timer } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ChooseAvatar from '../../components/choose-avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, User, getTotalReadingTime, getTotalReadingPoints, getUserReadingHistory } from '../../services/userService'; // Make sure this import is correct
import { updateUserProfile } from '../../services/userService';
import { ReadingSession } from '../../services/readingSessionsHelpers';
import { Audio, AVPlaybackStatus } from 'expo-av';

// Add this interface at the top of your file
interface UserProfile {
  avatar_url?: string | string[];
  name?: string;
  // ... other properties
}

// Add this helper function
const getAvatarUrl = (profile: UserProfile | null): string | null => {
  if (!profile || !profile.avatar_url) return null;
  return Array.isArray(profile.avatar_url) ? profile.avatar_url[0] : profile.avatar_url;
};

const avatars = [
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar1.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar2.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar3.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar4.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar5.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar6.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar7.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar8.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar9.png' }
];

export default function ProfileScreen() {
  const router = useRouter();
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [totalReadingPoints, setTotalReadingPoints] = useState(0);
  const [readingHistory, setReadingHistory] = useState<ReadingSession[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        console.log('Stored userId:', storedUserId);
        if (storedUserId) {
          setUserId(storedUserId);
          const userProfile = await getUserProfile(storedUserId);
          if (userProfile) {
            setUserAvatar(userProfile.avatar_url);
            setUserName(userProfile.username);
            const avatarIndex = avatars.findIndex(avatar => avatar.uri === userProfile.avatar_url);
            setSelectedAvatar(avatarIndex !== -1 ? avatarIndex : 0);
          }
          
          // Fetch total reading time
          const totalTime = await getTotalReadingTime(storedUserId);
          setTotalReadingTime(totalTime);

          // Fetch total reading points
          const totalPoints = await getTotalReadingPoints(storedUserId);
          console.log('Fetched total reading points:', totalPoints);
          setTotalReadingPoints(totalPoints);

          // Fetch reading history
          const history = await getUserReadingHistory(storedUserId);
          console.log('Fetched reading history:', history);
          setReadingHistory(history);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();

    return () => {
      if (sound) {
        console.log('Unloading sound');
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    }
    setupAudio();
  }, []);

  const handleChangeAvatar = () => {
    setIsAvatarModalVisible(true);
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalVisible(false);
  };

  const handleSelectAvatar = async (avatarIndex: number) => {
    setSelectedAvatar(avatarIndex);
    setIsAvatarModalVisible(false);
    
    const newAvatarUrl = avatars[avatarIndex].uri;
    setUserAvatar(newAvatarUrl);

    if (userId) {
      try {
        await updateUserProfile(userId, { avatar_url: newAvatarUrl });
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }
  };

  const handleEditAvatar = () => {
    setIsAvatarModalVisible(true);
  };

  // Helper function to format seconds into hours and minutes
  const formatReadingTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const playAudio = async (audioUrl: string) => {
    console.log('Attempting to play audio:', audioUrl);
    try {
      if (playingAudioUrl === audioUrl && sound) {
        console.log('Pausing current audio');
        await sound.pauseAsync();
        setPlayingAudioUrl(null);
      } else {
        if (sound) {
          console.log('Stopping and unloading previous audio');
          await sound.stopAsync();
          await sound.unloadAsync();
        }

        console.log('Loading new audio');
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 },
          (status) => console.log('Playback status:', status)
        );

        console.log('New audio loaded, playing');
        setSound(newSound);
        setPlayingAudioUrl(audioUrl);

        await newSound.playAsync();
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
      if (error instanceof Error) {
        setAudioError(error.message);
      } else {
        setAudioError('An unknown error occurred');
      }
      setPlayingAudioUrl(null);
    }
  };

  const renderReadingHistoryItem = ({ item }: { item: ReadingSession }) => (
    <View style={styles.historyItem}>
      <Pressable 
        style={styles.historyIconContainer}
        onPress={() => playAudio(item.audio_url)}
      >
        {playingAudioUrl === item.audio_url ? (
          <Pause size={20} color={colors.background} />
        ) : (
          <Play size={20} color={colors.background} />
        )}
      </Pressable>
      <View style={styles.historyTextContainer}>
        <Text style={styles.historyItemTitle}>{item.story_title || item.story_id}</Text>
        <Text style={styles.historyDate}>
          {new Date(item.start_time).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Breadcrumb header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable onPress={() => router.push('/select-profile')} style={styles.switchProfileButton}>
              <ArrowLeftRight size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              Hei {userName}!
            </Text>
          </View>

          <View style={styles.profileImageContainer}>
            <Image
              source={userAvatar ? { uri: userAvatar } : avatars[selectedAvatar]}
              style={styles.profileImage}
            />
            <Pressable style={styles.editAvatarButton} onPress={() => setIsAvatarModalVisible(true)}>
              <Edit2 size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.statsTitleContainer}>
            <LineChart size={24} color={colors.text} style={styles.statsIcon} />
            <Text style={styles.statsTitle}>Statistics</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.mint }]}>
                <BookCheck size={24} color={colors.background} />
              </View>
              <View>
                <Text style={styles.statValue}>{totalReadingPoints}</Text>
                <Text style={styles.statLabel}>Reading points</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.lavender }]}>
                <Timer size={24} color={colors.background} />
              </View>
              <View>
                <Text style={styles.statValue}>{formatReadingTime(totalReadingTime)}</Text>
                <Text style={styles.statLabel}>Time spent reading</Text>
              </View>
            </View>
          </View>

          <View style={styles.historyTitleContainer}>
            <History size={24} color={colors.text} style={styles.historyIcon} />
            <Text style={styles.historyTitle}>Reading history</Text>
          </View>
          <FlatList
            data={readingHistory}
            renderItem={renderReadingHistoryItem}
            keyExtractor={(item) => item.id?.toString() ?? item.story_id}
            style={styles.historyList}
            scrollEnabled={false} // Disable scrolling for FlatList
          />

          <ChooseAvatar
            isVisible={isAvatarModalVisible}
            onClose={handleCloseAvatarModal}
            onSelectAvatar={handleSelectAvatar}
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
  container: {
    flex: 1,
    padding: layout.padding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layout.spacing * 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  switchProfileButton: {
    padding: 8,
  },
  greetingContainer: {
    alignItems: 'flex-start',
    marginBottom: layout.spacing,
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 20,
    color: colors.text,
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  profileImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 10, 
    top: 10, // Changed from bottom to top
    backgroundColor: colors.background02, // Changed to background02 color
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: 20,
    padding: 8,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  statsIcon: {
    marginRight: layout.spacing / 2,
  },
  statsTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
  },
  statsContainer: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 8,
    marginRight: layout.spacing,
  },
  statValue: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: layout.spacing * 2,
    marginBottom: layout.spacing,
  },
  historyIcon: {
    marginRight: layout.spacing / 2,
  },
  historyTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
  },
  historyList: {
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  historyIconContainer: {
    backgroundColor: colors.lavender,
    borderRadius: 12,
    padding: 8,
    marginRight: layout.spacing,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyItemTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
});
