import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image, TextInput, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height } = Dimensions.get('window');
const SHAPE_SIZE = Math.min(140, SCREEN_WIDTH * 0.35);

export default function CreateProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
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

  const handleContinue = async () => {
    // Store the username and deviceId for the next screen
    await AsyncStorage.setItem('temp_username', username);
    await AsyncStorage.setItem('temp_deviceId', deviceId || '');
    
    // Navigate to avatar selection
    router.push('/screens/choose-avatar');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('createProfile.title')}</Text>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={20}
      >
        <View style={styles.contentContainer}>
          <View style={styles.characterContainer}>
            <Svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 184 180" style={styles.shapeBackground}>
              <Path
                d="M147.296 34.918C128.753 16.8494 116.849 -0.00828492 91.0203 3.05478e-05C63.6175 0.00879629 53.4067 18.6067 34.255 38.3606C15.6594 57.5409 1.40808e-05 59.9999 0 89.9999C-1.40808e-05 120 16.4608 124.261 32.7869 141.147C51.8094 160.822 63.7238 179.919 91.0203 180C116.65 180.075 130.169 165.246 147.296 146.065C164.501 126.798 183.788 116.871 183.998 90.9835C184.211 64.776 166.019 53.1613 147.296 34.918Z"
                fill={colors.yellowLight}
              />
            </Svg>
            <Image
              source={require('../../assets/images/yomi-character.png')}
              style={styles.yomiImage}
            />
          </View>

          <View style={styles.speechBubbleContainer}>
            <View style={styles.speechBubble}>
              <Text style={styles.messageText}>{t('createProfile.inputLabel')}</Text>
            </View>
            <Svg height="30" width="60" style={styles.speechBubblePointer}>
              <Path
                d="M 0,0 Q 25,15 10,30 L 60,0 Z"
                fill={colors.background02}
              />
            </Svg>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('createProfile.inputPlaceholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              cursorColor={colors.primary}
              autoFocus={true}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
      
      <Pressable 
        style={styles.continueButton} 
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.padding,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: layout.spacing * 2,
    marginBottom: layout.spacing,
    textAlign: 'center',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  characterContainer: {
    position: 'absolute',
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    top: 100,
    zIndex: 1,
  },
  shapeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  yomiImage: {
    width: SHAPE_SIZE * 0.85,
    height: SHAPE_SIZE * 0.85,
    position: 'relative',
  },
  speechBubbleContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    top: 0,
    zIndex: 2,
  },
  speechBubble: {
    backgroundColor: colors.background02,
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  speechBubblePointer: {
    position: 'absolute',
    bottom: -20,
    right: '25%',
    zIndex: 2,
  },
  messageText: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  inputContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    bottom: 0,
    zIndex: 3,
  },
  input: {
    width: '80%',
    height: 48,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 20,
    textAlign: 'center',
    paddingBottom: 8,
  },
  continueButton: {
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
  continueButtonText: {
    color: colors.buttonText,
    fontFamily: fonts.medium,
    fontSize: 16,
    textAlign: 'center',
  },
});
