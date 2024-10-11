import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, SafeAreaView } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Play, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Dummy data for books
const books = [
  { id: '1', title: 'Iso hiiri ja pikku hiiri', words: 30, image: require('../../assets/images/book1.png') },
  { id: '2', title: 'Koira löytää luun', words: 73, image: require('../../assets/images/book2.png') },
  { id: '3', title: 'Kissa ja kala', words: 55, image: require('../../assets/images/book3.png') },
];

export default function LibraryScreen() {
  const router = useRouter();

  const handleBookPress = (book: { id: string; title: string; words: number; image: any }) => {
    // Navigate to the ReadingScreen with the selected book data
    router.push({
      pathname: '/(tabs)/ReadingScreen',
      params: { bookId: book.id, title: book.title }
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
          data={books}
          renderItem={({ item }) => (
            <Pressable style={styles.bookItem} onPress={() => handleBookPress(item)}>
              <Image source={item.image} style={styles.bookImage} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookWords}>{item.words} sanaa</Text>
              </View>
              <Play size={24} color={colors.primary} />
            </Pressable>
          )}
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
    padding: layout.padding * 0.75, // Reduced padding by 25%
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