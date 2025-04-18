import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, TextInput, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import ChooseAvatar from '../../components/shared/choose-avatar';
import { createUserProfile } from '../../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

const avatars = [
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar1.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar2.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar3.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar4.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar5.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar6.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar7.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar8.png' },
  { uri: 'https://rkexvjlqjbqktwwipfmi.supabase.co/storage/v1/object/public/avatars/avatar9.png' }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreateProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
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

  const handleStartReading = async () => {
    if (!username.trim()) {
      Alert.alert(t('common.oops'), t('errors.enterUsername'));
      return;
    }

    try {
      const avatarUrl = avatars[selectedAvatar].uri;
      console.log('Creating profile with:', { username, avatarUrl });
      const result = await createUserProfile(username, avatarUrl);
      
      console.log('Create profile result:', result);

      if (result) {
        console.log('Profile created successfully:', result);
        await AsyncStorage.setItem('userId', result.id);
        router.replace({
          pathname: '/screens/celebration',
          params: { userId: result.id }
        });
      } else {
        console.log('Profile creation returned null');
        Alert.alert(t('common.error'), t('errors.createProfileFailed'));
      }
    } catch (error) {
      console.error('Error in handleStartReading:', error);
      if (error instanceof Error) {
        Alert.alert(t('common.error'), `${t('errors.createProfileFailed')} ${error.message}`);
      } else {
        Alert.alert(t('common.error'), t('errors.unknown'));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <Text style={styles.title}>{t('createProfile.title')}</Text>
          <Pressable onPress={handleOpenAvatarModal} style={styles.avatarContainer}>
            <Image source={avatars[selectedAvatar]} style={styles.avatar} />
            <Text style={styles.changeAvatarText}>{t('createProfile.changeAvatar')}</Text>
          </Pressable>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('createProfile.inputLabel')}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={t('createProfile.inputPlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
      <Pressable style={styles.startButton} onPress={handleStartReading}>
        <Text style={styles.startButtonText}>{t('createProfile.startButton')}</Text>
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
