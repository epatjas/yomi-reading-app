import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { getUserProfiles } from '../../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

type Profile = {
  id: string;
  username: string;
  avatar_url: string;
};

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = width / COLUMN_COUNT;
const AVATAR_SIZE = Math.min(ITEM_WIDTH * 0.8, height * 0.15); // Limit avatar size

export default function SelectProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const userProfiles = await getUserProfiles();
      setProfiles(userProfiles);
    } catch (error) {
      console.error(t('errors.loadingProfiles'), error);
    }
  };

  const handleSelectProfile = async (profile: Profile) => {
    try {
      await AsyncStorage.setItem('userId', profile.id);
      router.replace({
        pathname: '/(tabs)',
        params: { userId: profile.id }
      });
    } catch (error) {
      console.error('Error selecting profile:', error);
    }
  };

  const handleAddNewProfile = () => {
    router.push('/screens/create-profile');
  };

  const renderItem = ({ item }: { item: Profile | 'add' }) => {
    if (item === 'add') {
      return (
        <Pressable style={styles.profileItem} onPress={handleAddNewProfile}>
          <View style={styles.addNewAvatar}>
            <Text style={styles.addNewIcon}>+</Text>
          </View>
          <Text style={styles.username}>{t('selectProfile.addNew')}</Text>
        </Pressable>
      );
    }
    return (
      <Pressable style={styles.profileItem} onPress={() => handleSelectProfile(item)}>
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">{item.username}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('selectProfile.title')}</Text>
        <FlatList
          data={[...profiles, 'add']}
          renderItem={renderItem}
          keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.profileListContainer}
          columnWrapperStyle={styles.profileListColumnWrapper}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.padding,
    paddingTop: height * 0.08, // Slightly reduced top padding
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginBottom: height * 0.05, // Reduced space below the title
  },
  profileListContainer: {
    paddingBottom: layout.spacing * 2, // Add some bottom padding
  },
  profileListColumnWrapper: {
    justifyContent: 'space-around', // Distribute items evenly
  },
  profileItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: layout.spacing,
  },
  addNewAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
    fontSize: 14, // Slightly smaller font size
    color: colors.text,
    textAlign: 'center',
    width: ITEM_WIDTH * 0.9, // Limit text width
  },
});
