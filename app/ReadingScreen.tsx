import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { MoreVertical, ArrowLeft, Mic } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import { getStories, Story } from '../services/storyService';
import { useFocusEffect } from '@react-navigation/native';

const ReadingScreen = () => {
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { title } = useLocalSearchParams<{ title?: string }>();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function fetchAndSetStories() {
        const fetchedStories = await getStories();
        setStories(fetchedStories);
        if (fetchedStories.length > 0) {
          const story = title 
            ? fetchedStories.find(s => s.title === title) 
            : fetchedStories[0];
          setCurrentStory(story || fetchedStories[0]);
        }
      }
      fetchAndSetStories();
    }, [title])
  );

  const handleBackPress = () => {
    router.back(); // Navigate back to the previous screen
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{currentStory ? currentStory.title : 'Loading...'}</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.headerButton}>
            <MoreVertical size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Character and Energy Bar */}
        <View style={styles.characterContainer}>
          <Image
            source={require('../assets/images/yomi.png')}
            style={styles.characterImage}
          />
          <View style={styles.energyBarContainer}>
            <View style={styles.energyBar} />
          </View>
        </View>

        {/* Story Content */}
        <ScrollView style={styles.contentContainer}>
          {currentStory ? (
            <Text style={[styles.content, { fontSize }]}>
              {currentStory.content}
            </Text>
          ) : (
            <Text style={styles.content}>Loading story...</Text>
          )}
        </ScrollView>

        {/* Record Button */}
        <TouchableOpacity style={styles.recordButton}>
          <Mic size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  headerButton: {
    padding: 8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  characterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  characterImage: {
    width: 48,
    height: 48,
    marginRight: layout.spacing,
  },
  energyBarContainer: {
    flex: 1,
    height: 12, // Increased thickness to match HomeScreen
    backgroundColor: colors.background02,
    borderRadius: 6, // Rounded edges
    padding: 2, // Small padding
  },
  energyBar: {
    width: '56%', // Match the width from HomeScreen
    height: '100%',
    backgroundColor: colors.yellowDark, // Changed to match HomeScreen
    borderRadius: 4, // Rounded edges for the fill
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 20, // Added this line
    color: colors.text,
    lineHeight: 40,
  },
  recordButton: {
    position: 'absolute',
    bottom: 20, // Fixed distance from bottom
    alignSelf: 'center', // This centers the button horizontally
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReadingScreen;
