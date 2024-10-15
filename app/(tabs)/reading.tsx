import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Play, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getStories, Story } from '../../services/storyService';
import { getYomiEnergy } from '../../services/yomiEnergyService';

const getYomiImage = (energy: number) => {
  if (energy >= 80) return require('../../assets/images/yomi-max-energy.png');
  if (energy >= 60) return require('../../assets/images/yomi-high-energy.png');
  if (energy >= 40) return require('../../assets/images/yomi-medium-energy.png');
  if (energy >= 20) return require('../../assets/images/yomi-low-energy.png');
  return require('../../assets/images/yomi-very-low-energy.png');
};

export default function LibraryScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [totalEnergy, setTotalEnergy] = useState(0);

  useEffect(() => {
    async function fetchStories() {
      const fetchedStories = await getStories();
      setStories(fetchedStories);
    }
    fetchStories();
  }, []);

  useEffect(() => {
    async function fetchUserEnergy() {
      if (userId) {
        const energy = await getYomiEnergy(userId as string);
        setTotalEnergy(energy);
      }
    }
    fetchUserEnergy();
  }, [userId]);

  const handleBookPress = (story: Story) => {
    router.push({
      pathname: '/ReadingScreen',
      params: { title: story.title, userId: userId as string }
    });
  };

  const renderBookItem = ({ item }: { item: Story }) => (
    <Pressable style={styles.bookItem} onPress={() => handleBookPress(item)}>
      {item.cover_image_url ? (
        <View style={styles.bookImage}>
          <Image 
            source={{ uri: item.cover_image_url }}
            style={styles.bookImage}
            resizeMode="cover"
          />
          <ActivityIndicator style={StyleSheet.absoluteFill} />
        </View>
      ) : (
        <View style={[styles.bookImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>{item.title[0]}</Text>
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookWords}>{item["word-count"] ? `${item["word-count"]} sanaa` : 'Word count unavailable'}</Text>
      </View>
      <Play size={20} color={colors.primary} />
    </Pressable>
  );

  const handleStorySelection = (storyId: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      router.replace('/login');
      return;
    }
    
    router.push({
      pathname: '/reading',
      params: { storyId, userId }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Breadcrumb header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Library</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* New title */}
        <Text style={styles.pageTitle}>What do you want to read?</Text>

        {/* Book list */}
        <FlatList
          data={stories}
          renderItem={renderBookItem}
          keyExtractor={item => item.id}
        />
      </View>
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
    padding: 8, // Add some padding for easier tapping
  },
  headerTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40, // Match the width of the back button for centering
  },
  pageTitle: {
    fontFamily: fonts.medium,
    fontSize: 20,
    color: colors.text,
    marginBottom: layout.spacing * 2,
    textAlign: 'left',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: layout.padding * 0.75,
    paddingRight: layout.padding,
    marginBottom: layout.spacing,
    borderWidth: 1,  // Add stroke
    borderColor: colors.stroke,  // Use stroke color from global styles
  },
  bookImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: layout.spacing,
  },
  placeholderImage: {
    backgroundColor: colors.background02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: fonts.medium,
    fontSize: 24,
    color: colors.text,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  bookWords: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  playIconContainer: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 12,
    padding: 8,
  },
});
