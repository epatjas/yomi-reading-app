import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, SafeAreaView } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Zap, Percent } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Top right avatar */}
          <Pressable onPress={() => router.push('/profile')}>
            <Image
              source={require('../../assets/images/avatar.png')}
              style={styles.avatar}
            />
          </Pressable>

          {/* Main content */}
          <View style={styles.mainContent}>
            <Image
              source={require('../../assets/images/yomi.png')}
              style={styles.yomiImage}
            />
            <Text style={styles.message}>
              Can you please read to me?{'\n'}Reading makes Yomi happy.
            </Text>
            <Pressable style={styles.readButton}>
              <Text style={styles.readButtonText}>Read to Yomi</Text>
            </Pressable>
          </View>

          {/* Energy level card */}
          <View style={styles.energyCard}>
            <View style={styles.energyHeader}>
              <Image
                source={require('../../assets/images/yomi-small.png')}
                style={styles.yomiSmall}
              />
              <View style={styles.energyIconContainer}>
                <Zap
                  size={24}
                  color={colors.background}
                />
              </View>
            </View>
            <View style={styles.energyLevelContainer}>
              <Text style={styles.energyLevel}>56</Text>
              <View style={styles.energyLevelDetails}>
                <View style={styles.energyPercent}>
                  <Percent
                    size={24}
                    color={colors.background}
                  />
                </View>
                <Text style={styles.energyText}>Energy level</Text>
              </View>
            </View>
            <View style={styles.energyBar}>
              <View style={[styles.energyFill, { width: '56%' }]} />
            </View>
            <Text style={styles.careText}>Care for Yomi</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: layout.padding,
    paddingTop: 0, // Remove top padding
  },
  avatar: {
    position: 'absolute',
    top: layout.padding,
    right: 0, // Align to the right edge of the container
    width: 44,
    height: 44,
    borderRadius: 22, // Make it perfectly round
    zIndex: 1,
  },
  mainContent: {
    backgroundColor: colors.background02,
    borderRadius: 16,
    borderColor: colors.stroke,
    borderWidth: 1,
    padding: layout.padding,
    alignItems: 'center',
    marginTop: 100, // Adjust this value to move the content higher
    marginBottom: layout.spacing,
    height: 360, // Increase the height to make it taller
  },
  yomiImage: {
    width: 120, // Reduced size
    height: 120, // Reduced size
    marginBottom: layout.spacing * 2,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 18, // Slightly larger font
    color: colors.text,
    textAlign: 'center',
    marginBottom: layout.spacing * 2,
  },
  readButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%', // Make the button wider
  },
  readButtonText: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.buttonText,
    textAlign: 'center', // Center the text in the wider button
  },
  energyCard: {
    backgroundColor: colors.yellowLight,
    borderRadius: 16,
    padding: layout.padding,
    marginBottom: layout.spacing,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  yomiSmall: {
    width: 48,
    height: 48,
  },
  energyIconContainer: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 12,
    padding: 8,
  },
  energyLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from 'flex-start' to 'center'
    marginBottom: layout.spacing,
  },
  energyLevel: {
    fontFamily: fonts.regular,
    fontSize: 56,
    color: colors.background,
    marginRight: 8,
    lineHeight: 56, // Added to ensure proper vertical alignment
  },
  energyLevelDetails: {
    flexDirection: 'column',
    justifyContent: 'center', // Changed from 'flex-start' to 'center'
  },
  energyPercent: {
    marginBottom: 4, // Add some space between the icon and the text
  },
  energyText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.background,
    lineHeight: 16, // Added to ensure proper vertical alignment
  },
  energyBar: {
    height: 12, // Increased thickness
    backgroundColor: colors.background,
    borderRadius: 6, // Rounded edges
    marginBottom: layout.spacing,
    padding: 2, // Small padding
  },
  energyFill: {
    height: '100%',
    backgroundColor: colors.yellowDark,
    borderRadius: 4, // Rounded edges for the fill
  },
  careText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.background,
    textAlign: 'right',
  },
  futureContentPlaceholder: {
    height: 200, // Placeholder height, adjust as needed
  },
});
