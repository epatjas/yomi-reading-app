import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '../../translation';
import { colors, fonts } from '../../app/styles/globalStyles';

const LanguageSwitcher: React.FC = () => {
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
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={toggleLanguage}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>
        {currentLanguage === 'en' ? 'English' : 'Suomi'}
      </Text>
    </TouchableOpacity>
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
});

export default LanguageSwitcher; 