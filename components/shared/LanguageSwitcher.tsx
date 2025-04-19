import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../../translation';
import { colors, fonts } from '../../app/styles/globalStyles';

interface LanguageSwitcherProps {
  compact?: boolean;         // Whether to show a compact version
  onLanguageChange?: () => void; // Callback when language changes
  showLabels?: boolean;      // Whether to show language labels instead of just codes
  style?: object;            // Additional style to apply to the container
}

/**
 * A component for switching between Finnish and English languages
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  compact = false,
  onLanguageChange,
  showLabels = false,
  style = {}
}) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);

  useEffect(() => {
    // Update the component state when the language changes
    const fetchLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('userLanguage');
        if (storedLang) {
          setCurrentLanguage(storedLang);
        }
      } catch (error) {
        console.error('Error fetching language from storage:', error);
      }
    };

    fetchLanguage();
  }, []);

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === 'en' ? 'fi' : 'en';
    await changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
    
    // Call the callback if provided
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  // Compact version (just a button with the language code)
  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, style]} 
        onPress={toggleLanguage}
        activeOpacity={0.7}
      >
        <Text style={styles.compactText}>
          {currentLanguage.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  }

  // Button with language name
  if (showLabels) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={toggleLanguage}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>
          {currentLanguage === 'en' ? 'English' : 'Suomi'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default: buttons for both languages
  return (
    <View style={[styles.buttonGroup, style]}>
      <TouchableOpacity
        style={[
          styles.languageButton,
          currentLanguage === 'fi' && styles.activeButton
        ]}
        onPress={() => currentLanguage !== 'fi' && toggleLanguage()}
      >
        <Text 
          style={[
            styles.buttonText,
            currentLanguage === 'fi' && styles.activeButtonText
          ]}
        >
          FI
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.languageButton,
          currentLanguage === 'en' && styles.activeButton
        ]}
        onPress={() => currentLanguage !== 'en' && toggleLanguage()}
      >
        <Text 
          style={[
            styles.buttonText,
            currentLanguage === 'en' && styles.activeButtonText
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background02,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  text: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  compactContainer: {
    backgroundColor: colors.background02,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  languageButton: {
    backgroundColor: colors.background,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeButtonText: {
    color: colors.buttonTextDark,
  },
});

export default LanguageSwitcher; 