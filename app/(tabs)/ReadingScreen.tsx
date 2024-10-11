import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { MoreVertical, ArrowLeft, Mic } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';

const ReadingScreen = () => {
  const [fontSize, setFontSize] = useState(24);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { title } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title || 'Loading...'}</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.headerButton}>
            <MoreVertical size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Character and Energy Bar */}
        <View style={styles.characterContainer}>
          <Image
            source={require('../../assets/images/yomi.png')}
            style={styles.characterImage}
          />
          <View style={styles.energyBarContainer}>
            <View style={styles.energyBar} />
          </View>
        </View>

        {/* Story Content */}
        <ScrollView style={styles.contentContainer}>
          <Text style={[styles.content, { fontSize }]}>
            I-so hii-ri ja pik-ku hii-ri päät-ti-vät
            na-ker-taa juus-tos-ta ko-din

            Mi-nä na-ker-ran o-ven

            Mi-nä-kin na-ker-ran
            o-ven

            Mi-nä na-ker-ran ik-ku-noi-ta

            Mi-nä-kin na-ker-ran
            ik-ku-noi-ta

            Niin ne na-ker-si-vat ja na-ker-si-vat.
            Juus-tos-ta ei jää-nyt mu-ru-a-kaan.
          </Text>
        </ScrollView>

        {/* Record Button */}
        <TouchableOpacity style={styles.recordButton}>
          <Mic size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: layout.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  headerButton: {
    padding: 8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  characterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  characterImage: {
    width: 48,
    height: 48,
    marginRight: layout.spacing,
  },
  energyBarContainer: {
    flex: 1,
    height: 12, // Increased thickness to match HomeScreen
    backgroundColor: colors.background02,
    borderRadius: 6, // Rounded edges
    padding: 2, // Small padding
  },
  energyBar: {
    width: '56%', // Match the width from HomeScreen
    height: '100%',
    backgroundColor: colors.yellowDark, // Changed to match HomeScreen
    borderRadius: 4, // Rounded edges for the fill
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 20, // Added this line
    color: colors.text,
    lineHeight: 40,
  },
  recordButton: {
    position: 'absolute',
    bottom: '6%', // Center vertically
    left: '50%', // Center horizontally
    transform: [{ translateX: -30 }, { translateY: 30 }], // Offset by half the button's width and height
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReadingScreen;
