import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserProfile } from '../../services/userService';
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

const { width: SCREEN_WIDTH, height } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768 || height >= 768;
const isLandscape = SCREEN_WIDTH > height;
const COLUMNS = isTablet && isLandscape ? 4 : 3;
const AVATAR_MARGIN = isTablet ? 12 : 8;
const AVATAR_SIZE = (SCREEN_WIDTH - layout.padding * 2) / COLUMNS - (AVATAR_MARGIN * 2);

export default function ChooseAvatarScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [username, setUsername] = useState('');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    const loadTempData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('temp_username');
        const storedDeviceId = await AsyncStorage.getItem('temp_deviceId');
        
        if (storedUsername) {
          setUsername(storedUsername);
        }
        
        if (storedDeviceId) {
          setDeviceId(storedDeviceId);
        }
      } catch (error) {
        console.error('Error loading temp data:', error);
      }
    };
    
    loadTempData();
  }, []);

  const handleAvatarSelect = (index: number) => {
    setSelectedAvatar(index);
  };

  const handleStartReading = async () => {
    try {
      const avatarUrl = avatars[selectedAvatar].uri;
      console.log('Creating profile with:', { username, avatarUrl, deviceId });
      const result = await createUserProfile(username, avatarUrl, deviceId);
      
      if (result) {
        console.log('Profile created successfully:', result);
        await AsyncStorage.setItem('userId', result.id);
        
        // Clean up temporary storage
        await AsyncStorage.removeItem('temp_username');
        await AsyncStorage.removeItem('temp_deviceId');
        
        router.replace({
          pathname: '/screens/celebration',
          params: { userId: result.id }
        });
      } else {
        console.log('Profile creation returned null');
        // Navigate back if there's an error
        router.back();
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Navigate back if there's an error
      router.back();
    }
  };

  const renderAvatar = ({ item, index }: { item: any; index: number }) => (
    <Pressable 
      onPress={() => handleAvatarSelect(index)} 
      style={[
        styles.avatarWrapper, 
        selectedAvatar === index && styles.selectedAvatarWrapper,
        { 
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          margin: AVATAR_MARGIN
        }
      ]}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={[
          styles.avatarImage,
          { borderRadius: (AVATAR_SIZE / 2) - 2 }
        ]} 
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[
        styles.headerTitle,
        isTablet && { fontSize: 20, marginTop: 40 }
      ]}>{t('createProfile.title', 'Who\'s reading?')}</Text>
      
      <View style={styles.content}>
        <Text style={[
          styles.subtitle,
          isTablet && { fontSize: 26, marginTop: layout.spacing * 4 }
        ]}>{t('chooseAvatar.title', 'Choose a profile pic')}</Text>
        
        <FlatList
          data={avatars}
          renderItem={renderAvatar}
          keyExtractor={(_, index) => index.toString()}
          numColumns={COLUMNS}
          contentContainerStyle={[
            styles.avatarList,
            isTablet && isLandscape && { paddingHorizontal: SCREEN_WIDTH * 0.1 }
          ]}
        />
      </View>
      
      <Pressable 
        style={[
          styles.startButton,
          isTablet && isLandscape && { width: '40%', paddingVertical: 18 }
        ]} 
        onPress={handleStartReading}
      >
        <Text style={[
          styles.startButtonText,
          isTablet && { fontSize: 18 }
        ]}>{t('chooseAvatar.startReading', 'Let\'s start to read')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.padding,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: 32,
    marginBottom: layout.spacing,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 22,
    fontFamily: fonts.medium,
    color: colors.text,
    marginTop: layout.spacing * 3,
    marginBottom: layout.spacing * 2,
    textAlign: 'center',
  },
  avatarList: {
    alignItems: 'center',
    paddingBottom: layout.spacing * 2,
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderWidth: 1,
    borderColor: colors.stroke,
    overflow: 'hidden',
  },
  selectedAvatarWrapper: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: layout.spacing * 2,
    width: '80%',
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: colors.buttonText,
    fontWeight: 'medium',
    fontSize: 16,
    textAlign: 'center',
  },
}); 