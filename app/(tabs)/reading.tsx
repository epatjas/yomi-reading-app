import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Dummy data for books
const books = [
  { id: '1', title: 'The Cat in the Hat' },
  { id: '2', title: 'Green Eggs and Ham' },
  { id: '3', title: 'One Fish, Two Fish, Red Fish, Blue Fish' },
];

export default function ReadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Book</Text>
      <FlatList
        data={books}
        renderItem={({ item }) => <Text style={styles.bookItem}>{item.title}</Text>}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bookItem: {
    fontSize: 18,
    marginBottom: 10,
  },
});