import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getStories, Story } from '../../services/storyService';
import { getYomiEnergy } from '../../services/yomiEnergyService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const getYomiImage = (energy: number) => {
  if (energy >= 80) return require('../../assets/images/yomi-max-energy.png');
  if (energy >= 60) return require('../../assets/images/yomi-high-energy.png');
  if (energy >= 40) return require('../../assets/images/yomi-medium-energy.png');
  if (energy >= 20) return require('../../assets/images/yomi-low-energy.png');
  return require('../../assets/images/yomi-very-low-energy.png');
};

export default function LibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { userId: routeUserId } = useLocalSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const isNavigating = useRef(false);

  useEffect(() => {
    async function initializeUserId() {
      try {
        // Try to get userId from route params first
        if (routeUserId) {
          await AsyncStorage.setItem('userId', routeUserId as string);
          setUserId(routeUserId as string);
          return;
        }

        // If not in route params, try to get from AsyncStorage
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error initializing userId:', error);
      }
    }

    initializeUserId();
  }, [routeUserId]);

  useEffect(() => {
    async function fetchData() {
      const fetchedStories = await getStories();
      setStories(fetchedStories);
    }
    fetchData();
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

  const handleStoryPress = async (story: Story) => {
    try {
      // Get the latest userId from state or storage
      const currentUserId = userId || await AsyncStorage.getItem('userId');
      
      if (!story.id) {
        throw new Error('Story ID is missing');
      }
      
      if (!currentUserId) {
        throw new Error('User ID is missing');
      }

      router.push({
        pathname: "/screens/ReadingScreen",
        params: {
          storyId: story.id,
          userId: currentUserId
        }
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Navigation error:', errorMessage);
      Alert.alert(t('common.error'), `Failed to open story: ${errorMessage}`);
    }
  };

  const filteredStories = selectedDifficulty
    ? stories.filter(story => story.difficulty === selectedDifficulty)
    : stories;

  // Map our translation difficulty key to the original difficulty strings used in the story data
  const getDifficultyKey = (difficulty: string) => {
    switch(difficulty) {
      case t('library.easy'): return 'Easy';
      case t('library.medium'): return 'Medium';
      case t('library.hard'): return 'Hard';
      default: return difficulty;
    }
  };

  const renderDifficultyFilter = () => (
    <View style={styles.filterContainer}>
      {[
        t('library.easy'), 
        t('library.medium'), 
        t('library.hard')
      ].map((difficulty) => (
        <TouchableOpacity
          key={difficulty}
          style={[
            styles.filterButton,
            selectedDifficulty === getDifficultyKey(difficulty) && styles.filterButtonActive
          ]}
          onPress={() => {
            const difficultyValue = getDifficultyKey(difficulty);
            setSelectedDifficulty(selectedDifficulty === difficultyValue ? null : difficultyValue);
          }}
        >
          <Text style={styles.filterButtonText}>
            {difficulty === t('library.easy') && '☆ '}
            {difficulty === t('library.medium') && '☆☆ '}
            {difficulty === t('library.hard') && '☆☆☆ '}
            {difficulty}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookItem = ({ item }: { item: Story }) => (
    <Pressable style={styles.bookItem} onPress={() => handleStoryPress(item)}>
      <View style={styles.bookImageContainer}>
        {item.cover_image_url ? (
          <Image 
            source={{ uri: item.cover_image_url }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bookImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>{item.title[0]}</Text>
          </View>
        )}
        <View style={styles.difficultyTag}>
          <Text style={styles.difficultyText}>
            {item.difficulty === 'Easy' && '☆'}
            {item.difficulty === 'Medium' && '☆☆'}
            {item.difficulty === 'Hard' && '☆☆☆'}
          </Text>
        </View>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookWords}>
          {item["word-count"] 
            ? `${item["word-count"]} ${t('library.wordCount')}` 
            : t('library.wordCountUnavailable')}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Breadcrumb header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('library.title')}</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* New title */}
        <Text style={styles.pageTitle}>{t('library.pageTitle')}</Text>

        {renderDifficultyFilter()}

        <FlatList
          data={filteredStories}
          renderItem={renderBookItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.bookList}
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: layout.spacing * 2,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background02,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontFamily: fonts.medium,
    color: colors.text,
  },
  bookList: {
    justifyContent: 'space-between',
  },
  bookItem: {
    width: '48%',
    marginBottom: layout.spacing * 2,
    backgroundColor: colors.background02,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookImageContainer: {
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  difficultyTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  bookInfo: {
    padding: layout.padding * 0.5,
  },
  bookTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  bookWords: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
