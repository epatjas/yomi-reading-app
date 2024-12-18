import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, Pressable, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { BookCheck, History, ArrowLeft, LineChart, Edit2, ArrowLeftRight, Play, Pause, Timer } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ChooseAvatar from '../../components/shared/choose-avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, User, getTotalReadingTime, getTotalReadingPoints, getUserReadingHistory } from '../../services/userService'; // Make sure this import is correct
import { updateUserProfile } from '../../services/userService';
import { ReadingSession } from '../../services/readingSessionsHelpers';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

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

// Add helper function to format duration
const formatDuration = (durationSeconds: number | undefined): string => {
  if (!durationSeconds || isNaN(durationSeconds)) return '0:00';
  
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [pausedPosition, setPausedPosition] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchUserData() {
        try {
          const storedUserId = await AsyncStorage.getItem('userId');
          console.log('Profile Screen - Fetching data for userId:', storedUserId);
          
          if (storedUserId) {
            setUserId(storedUserId);
            
            // Verify database connection
            const { data: testData, error: testError } = await supabase
              .from('reading_sessions')
              .select('*')
              .eq('user_id', storedUserId);
            
            console.log('Database connection test:', { testData, testError });
            
            // Rest of your fetch calls...
            const userProfile = await getUserProfile(storedUserId);
            if (userProfile) {
              setUserAvatar(getAvatarUrl(userProfile) || null);
              setUserName(userProfile.username || '');
              const avatarIndex = avatars.findIndex(avatar => avatar.uri === userProfile.avatar_url);
              setSelectedAvatar(avatarIndex !== -1 ? avatarIndex : 0);
            }
            
            const totalTime = await getTotalReadingTime(storedUserId);
            setTotalReadingTime(totalTime);

            const totalPoints = await getTotalReadingPoints(storedUserId);
            setTotalReadingPoints(totalPoints);

            const history = await getUserReadingHistory(storedUserId);
            setReadingHistory(history);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      fetchUserData();
    }, [])
  );

  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
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
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    if (hours === 0) {
      return minutes === 0 ? `${seconds}s` : `${minutes}min ${seconds}s`;
    }
    return `${hours}h ${minutes}min`;
  };

  const playAudio = async (audioUrl: string) => {
    console.log('Attempting to play audio:', audioUrl);
    setIsAudioLoading(true);
    setAudioError(null);

    try {
      // If the same audio is playing, handle pause/resume
      if (playingAudioUrl === audioUrl && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            // Pause
            console.log('Pausing audio...');
            await soundRef.current.pauseAsync();
            setPausedPosition(status.positionMillis);
            setPlayingAudioUrl(null);
          } else {
            // Resume
            console.log('Resuming audio from position:', status.positionMillis);
            await soundRef.current.playFromPositionAsync(status.positionMillis);
            setPlayingAudioUrl(audioUrl);
          }
          setIsAudioLoading(false);
          return;
        }
      }

      // Stop and unload any existing playback
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingAudioUrl(null);
        setPausedPosition(null);
      }

      console.log('Loading new audio...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = newSound;
      setSound(newSound);
      setPlayingAudioUrl(audioUrl);
      setPausedPosition(null);

    } catch (error) {
      console.error('Error in playAudio function:', error);
      setAudioError(error instanceof Error ? error.message : 'An unknown error occurred');
      setPlayingAudioUrl(null);
      setPausedPosition(null);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Update onPlaybackStatusUpdate to store duration when first loaded
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Audio playback error: ${status.error}`);
        setAudioError(status.error);
      }
      return;
    }

    // Store duration in state or update reading session if needed
    if (status.durationMillis && !status.didJustFinish) {
      // You might want to update the session in the database with the duration
      console.log('Audio duration:', status.durationMillis);
    }

    // Only log status if playing or paused (reduces console spam)
    if (status.isPlaying || pausedPosition !== null) {
      console.log('Playback status:', {
        isPlaying: status.isPlaying,
        position: status.positionMillis,
        duration: status.durationMillis,
        pausedPosition,
      });
    }

    if (status.didJustFinish) {
      console.log('Audio finished playing');
      setPlayingAudioUrl(null);
      setPausedPosition(null);
      // Clean up the sound
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    }
  };

  const renderReadingHistoryItem = ({ item }: { item: ReadingSession }) => {
    console.log('Rendering history item:', item);
    return (
      <View style={styles.historyItem}>
        <Pressable 
          style={styles.historyIconContainer}
          onPress={() => playAudio(item.audio_url)}
          disabled={isAudioLoading}
        >
          {isAudioLoading && playingAudioUrl === item.audio_url ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : playingAudioUrl === item.audio_url ? (
            <Pause size={20} color={colors.background} />
          ) : (
            <Play size={20} color={colors.background} />
          )}
        </Pressable>
        <View style={styles.historyTextContainer}>
          <Text 
            style={styles.historyItemTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.story_title || `Story ${item.story_id}`}
          </Text>
          <Text style={styles.historyDate}>
            {new Date(item.start_time).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.durationText}>
          {formatDuration(item.duration)}
        </Text>
      </View>
    );
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      console.log('Profile screen unmounting, cleaning up audio...');
      if (soundRef.current) {
        soundRef.current.stopAsync()
          .then(() => soundRef.current?.unloadAsync())
          .catch(error => console.log('Error cleaning up audio:', error))
          .finally(() => {
            soundRef.current = null;
            setPlayingAudioUrl(null);
          });
      }
    };
  }, []);

  // Add focus effect to handle navigation
  useFocusEffect(
    useCallback(() => {
      return () => {
        // This runs when screen loses focus
        console.log('Profile screen lost focus, stopping playback...');
        if (soundRef.current) {
          soundRef.current.stopAsync()
            .then(() => soundRef.current?.unloadAsync())
            .catch(error => console.log('Error stopping playback:', error))
            .finally(() => {
              soundRef.current = null;
              setPlayingAudioUrl(null);
            });
        }
      };
    }, [])
  );

  console.log('Formatting reading time:', {
    totalReadingTime,
    formatted: formatReadingTime(totalReadingTime)
  });

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
            <Pressable onPress={() => router.push('/screens/select-profile')} style={styles.switchProfileButton}>
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
    backgroundColor: colors.yellowLight,
    borderRadius: 12,
    padding: 8,
    marginRight: layout.spacing,
  },
  historyTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  historyItemTitle: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  historyDate: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 4,
  },
  durationText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
});
