import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Play, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getStories, Story } from '../../services/storyService';

export default function LibraryScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    async function fetchStories() {
      const fetchedStories = await getStories();
      setStories(fetchedStories);
    }
    fetchStories();
  }, []);

  const handleBookPress = (story: Story) => {
    router.push({
      pathname: '/ReadingScreen',
      params: { title: story.title }
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

        {/* Yomi speech bubble */}
        <View style={styles.speechBubble}>
          <Image
            source={require('../../assets/images/yomi.png')}
            style={styles.yomiImage}
          />
          <View style={styles.bubbleContent}>
            <Text style={styles.yomiText}>What do you want to read?</Text>
          </View>
        </View>

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
  speechBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  yomiImage: {
    width: 56,
    height: 56,
    marginRight: -20, // Overlap with the bubble
    zIndex: 1,
  },
  bubbleContent: {
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: layout.padding,
    paddingLeft: layout.padding * 2, // Extra padding for Yomi image overlap
    flex: 1,
    borderWidth: 1,  // Add stroke
    borderColor: colors.stroke, 
    minHeight: 56, 
  },
  yomiText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
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