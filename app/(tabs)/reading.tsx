import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Play } from 'lucide-react-native'; // Import the Play icon

// Dummy data for books
const books = [
  { id: '1', title: 'Iso hiiri ja pikku hiiri', words: 30, image: require('../../assets/images/book1.png') },
  { id: '2', title: 'Koira löytää luun', words: 36, image: require('../../assets/images/book2.png') },
];

export default function ReadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <View style={styles.yomiContainer}>
        <Image
          source={require('../../assets/images/yomi-small.png')}
          style={styles.yomiImage}
        />
        <Text style={styles.yomiText}>What do you want to read?</Text>
      </View>
      <FlatList
        data={books}
        renderItem={({ item }) => (
          <Pressable style={styles.bookItem}>
            <Image source={item.image} style={styles.bookImage} />
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookWords}>{item.words} sanaa</Text>
            </View>
            <Play
              size={24} // Adjust size as needed
              color={colors.primary} // Use the appropriate color from your globalStyles
              style={styles.playIcon}
            />
          </Pressable>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.padding,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: layout.spacing,
  },
  yomiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  yomiImage: {
    width: 40,
    height: 40,
    marginRight: layout.spacing / 2,
  },
  yomiText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: layout.padding,
    marginBottom: layout.spacing,
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
  playIcon: {
    width: 24,
    height: 24,
  },
});