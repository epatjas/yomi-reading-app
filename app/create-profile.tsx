import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, TextInput, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import ChooseAvatar from '../components/choose-avatar';

const avatars = [
  require('../assets/images/avatar1.png'),
  require('../assets/images/avatar2.png'),
  require('../assets/images/avatar3.png'),
  require('../assets/images/avatar4.png'),
  require('../assets/images/avatar5.png'),
  require('../assets/images/avatar6.png'),
  require('../assets/images/avatar7.png'),
  require('../assets/images/avatar8.png'),
  require('../assets/images/avatar9.png'),
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreateProfileScreen() {
  const router = useRouter();
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [username, setUsername] = useState('');

  const handleOpenAvatarModal = () => {
    setIsAvatarModalVisible(true);
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalVisible(false);
  };

  const handleSelectAvatar = (avatarIndex: number) => {
    setSelectedAvatar(avatarIndex);
    setIsAvatarModalVisible(false);
  };

  const handleStartReading = () => {
    console.log('handleStartReading called');
    // Add logic to save profile if needed
    console.log('Start reading with:', { avatar: selectedAvatar, username });
    // Navigate to the celebration screen
    router.push('/celebration');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <Text style={styles.title}>Who's reading?</Text>
          <Pressable onPress={handleOpenAvatarModal} style={styles.avatarContainer}>
            <Image source={avatars[selectedAvatar]} style={styles.avatar} />
            <Text style={styles.changeAvatarText}>Change avatar</Text>
          </Pressable>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>How can we call you?</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="SuperReader123"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
      <Pressable style={styles.startButton} onPress={handleStartReading}>
        <Text style={styles.startButtonText}>Let's start to read</Text>
      </Pressable>
      <ChooseAvatar
        isVisible={isAvatarModalVisible}
        onClose={handleCloseAvatarModal}
        onSelectAvatar={handleSelectAvatar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.padding,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: layout.spacing * 4,
    marginBottom: layout.spacing * 2,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: layout.spacing,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: layout.spacing,
  },
  changeAvatarText: {
    color: colors.primary,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: layout.spacing,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: colors.background02,
    borderRadius: 10,
    paddingHorizontal: layout.padding,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: layout.spacing * 2,
    marginHorizontal: layout.padding,
  },
  startButtonText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'center',
  },
});
