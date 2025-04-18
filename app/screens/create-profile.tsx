import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, TextInput, Dimensions, Alert, Platform } from 'react-native';
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
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get device ID when component mounts
    const getDeviceInfo = async () => {
      try {
        // First check if device ID is already stored
        let storedDeviceId = await AsyncStorage.getItem('deviceId');
        
        if (!storedDeviceId) {
          // If not stored, generate a new one
          storedDeviceId = `${Platform.OS}-${Platform.Version}-${Math.random().toString(36).substring(2, 10)}`;
          // Store it for future use
          await AsyncStorage.setItem('deviceId', storedDeviceId);
        }
        
        setDeviceId(storedDeviceId);
        console.log('Device ID:', storedDeviceId);
      } catch (error) {
        console.error('Error getting device info:', error);
        // Fallback to a new ID if there's an error
        const fallbackId = `${Platform.OS}-${Platform.Version}-${Math.random().toString(36).substring(2, 10)}`;
        setDeviceId(fallbackId);
      }
    };

    getDeviceInfo();
  }, []);

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
      console.log('Creating profile with:', { username, avatarUrl, deviceId });
      const result = await createUserProfile(username, avatarUrl, deviceId);
      
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
