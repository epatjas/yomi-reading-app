import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Yomi Reading App!</Text>
      <Link href="/reading" asChild>
        <Pressable>
          <Text style={styles.link}>Start Reading</Text>
        </Pressable>
      </Link>
      <Link href="/profile" asChild>
        <Pressable>
          <Text style={styles.link}>View Profile</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    fontSize: 18,
    color: 'blue',
    marginVertical: 10,
  }
});
