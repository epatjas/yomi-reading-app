import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getUserProfiles, getUserReadingHistory } from '../services/userService';

type Profile = {
  id: string;
  username: string;
  avatar_url: string;
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = width / COLUMN_COUNT;

export default function SelectProfileScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const userProfiles = await getUserProfiles();
      setProfiles(userProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleSelectProfile = async (profile: Profile) => {
    try {
      const readingHistory = await getUserReadingHistory(profile.id);
      if (readingHistory && readingHistory.length > 0) {
        // User has reading history, navigate to the home screen with the profile ID
        router.push({
          pathname: '/(tabs)',
          params: { userId: profile.id }
        });
      } else {
        // User hasn't read anything yet, navigate to the reading selection screen with the profile ID
        router.push({
          pathname: '/(tabs)/reading',
          params: { userId: profile.id }
        });
      }
    } catch (error) {
      console.error('Error checking reading history:', error);
      // In case of error, default to the reading selection screen with the profile ID
      router.push({
        pathname: '/(tabs)/reading',
        params: { userId: profile.id }
      });
    }
  };

  const handleAddNewProfile = () => {
    router.push('/create-profile');
  };

  const renderItem = ({ item }: { item: Profile | 'add' }) => {
    if (item === 'add') {
      return (
        <Pressable style={styles.profileItem} onPress={handleAddNewProfile}>
          <View style={styles.addNewAvatar}>
            <Text style={styles.addNewIcon}>+</Text>
          </View>
          <Text style={styles.username}>Add new</Text>
        </Pressable>
      );
    }
    return (
      <Pressable style={styles.profileItem} onPress={() => handleSelectProfile(item)}>
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        <Text style={styles.username}>{item.username}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Who's reading?</Text>
      <FlatList
        data={[...profiles, 'add']}
        renderItem={renderItem}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.profileList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.padding,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: layout.spacing * 2,
    marginBottom: layout.spacing * 3,
    textAlign: 'center',
  },
  profileList: {
    paddingBottom: layout.spacing * 2,
  },
  profileItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  avatar: {
    width: ITEM_WIDTH * 0.8,
    height: ITEM_WIDTH * 0.8,
    borderRadius: (ITEM_WIDTH * 0.8) / 2,
    marginBottom: layout.spacing,
  },
  addNewAvatar: {
    width: ITEM_WIDTH * 0.8,
    height: ITEM_WIDTH * 0.8,
    borderRadius: (ITEM_WIDTH * 0.8) / 2,
    backgroundColor: colors.background02,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  addNewIcon: {
    fontSize: 32,
    color: colors.text,
  },
  username: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});
