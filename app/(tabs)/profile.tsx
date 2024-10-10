import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { BookCheck, Timer } from 'lucide-react-native'; // Import both BookCheck and Timer icons

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Image
        source={require('../../assets/images/profile-image.png')}
        style={styles.profileImage}
      />
      <Text style={styles.statsTitle}>Statistics</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <BookCheck
            size={24} // Adjust size as needed
            color={colors.primary} // Use the appropriate color from your globalStyles
            style={styles.statIcon}
          />
          <View>
            <Text style={styles.statValue}>1200</Text>
            <Text style={styles.statLabel}>Reading points</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Timer
            size={24} // Adjust size as needed
            color={colors.primary} // Use the appropriate color from your globalStyles
            style={styles.statIcon}
          />
          <View>
            <Text style={styles.statValue}>16h 24min</Text>
            <Text style={styles.statLabel}>Time spent reading</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.padding,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: layout.spacing,
  },
  profileImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: layout.spacing,
  },
  statsTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
    marginBottom: layout.spacing / 2,
  },
  statsContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: layout.padding,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  statIcon: {
    marginRight: layout.spacing,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});