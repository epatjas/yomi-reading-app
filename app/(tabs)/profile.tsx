import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://via.placeholder.com/150' }}
        style={styles.avatar}
      />
      <Text style={styles.name}>Child's Name</Text>
      <Text style={styles.stat}>Books Read: 5</Text>
      <Text style={styles.stat}>Reading Level: Beginner</Text>
      <Text style={styles.stat}>Yomi's Energy: 80%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stat: {
    fontSize: 18,
    marginBottom: 10,
  },
});