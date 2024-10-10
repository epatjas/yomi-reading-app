import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors, fonts, layout } from './styles/globalStyles';

export default function CreateProfileScreen() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleStartReading = () => {
    // You might want to add some validation here, e.g., checking if name is not empty
    if (name.trim()) {
      router.push('/celebration');
    } else {
      // You could show an alert or some feedback if the name is empty
      alert("Please enter a name before continuing.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Profile</Text>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Who's reading?</Text>
          
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../assets/images/avatar1.png')} 
              style={styles.avatar}
            />
            <TouchableOpacity onPress={() => router.push('/choose-avatar')}>
              <Text style={styles.changeAvatarText}>Change avatar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>How can we call you?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="SuperReader123"
              placeholderTextColor={colors.secondaryText}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleStartReading}
        >
          <Text style={styles.buttonText}>Let's start to read</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background01,
  },
  container: {
    flex: 1,
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical,
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontFamily: fonts.regular,
    marginBottom: 20,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: -240, // This lifts the content container up by 48 pixels
  },
  title: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fonts.regular,
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 50,
    marginBottom: 10,
  },
  changeAvatarText: {
    color: colors.primary,
    fontFamily: fonts.regular,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    color: colors.text,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background02,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});
