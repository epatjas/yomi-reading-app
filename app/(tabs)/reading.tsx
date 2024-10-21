import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Play, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getStories, Story } from '../../services/storyService';
import { getYomiEnergy } from '../../services/yomiEnergyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [userIdState, setUserIdState] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const fetchedStories = await getStories();
      setStories(fetchedStories);

      const storedUserId = await AsyncStorage.getItem('userId');
      setUserIdState(storedUserId);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchUserEnergy() {
      if (userIdState) {
        const energy = await getYomiEnergy(userIdState as string);
        setTotalEnergy(energy);
      }
    }
    fetchUserEnergy();
  }, [userIdState]);

  const handleBookPress = (story: Story) => {
    handleStorySelection(story.id);
  };

  const filteredStories = selectedDifficulty
    ? stories.filter(story => story.difficulty === selectedDifficulty)
    : stories;

  const renderDifficultyFilter = () => (
    <View style={styles.filterContainer}>
      {['Easy', 'Medium', 'Hard'].map((difficulty) => (
        <TouchableOpacity
          key={difficulty}
          style={[
            styles.filterButton,
            selectedDifficulty === difficulty && styles.filterButtonActive
          ]}
          onPress={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
        >
          <Text style={styles.filterButtonText}>
            {difficulty === 'Easy' && '☆ '}
            {difficulty === 'Medium' && '☆☆ '}
            {difficulty === 'Hard' && '☆☆☆ '}
            {difficulty}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookItem = ({ item }: { item: Story }) => (
    <Pressable style={styles.bookItem} onPress={() => handleBookPress(item)}>
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
        <Text style={styles.bookWords}>{item["word-count"] ? `${item["word-count"]} sanaa` : 'Word count unavailable'}</Text>
      </View>
    </Pressable>
  );

  const handleStorySelection = (storyId: string) => {
    if (!userIdState) {
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      router.replace('/login');
      return;
    }
    
    router.push({
      pathname: '/ReadingScreen',
      params: { storyId, userId: userIdState }
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
