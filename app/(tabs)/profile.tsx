import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, Pressable } from 'react-native';
import { colors, fonts, layout } from '../styles/globalStyles';
import { BookCheck, Timer, ArrowLeft, LineChart, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ChooseAvatar from '../../components/choose-avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0); // Assuming 0 is the default avatar

  const handleChangeAvatar = () => {
    setIsAvatarModalVisible(true);
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalVisible(false);
  };

  const handleSelectAvatar = (avatarIndex: number) => {
    setSelectedAvatar(avatarIndex);
    setIsAvatarModalVisible(false);
    // Here you can add logic to save the selected avatar
  };

  const handleEditAvatar = () => {
    setIsAvatarModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Breadcrumb header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.profileImageContainer}>
          <Image
            source={require('../../assets/images/profile-image.png')}
            style={styles.profileImage}
          />
          <Pressable style={styles.editAvatarButton} onPress={handleEditAvatar}>
            <Edit2 size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.statsTitleContainer}>
          <LineChart size={24} color={colors.text} style={styles.statsIcon} />
          <Text style={styles.statsTitle}>Statistics</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.mint }]}>
              <BookCheck size={24} color={colors.background} />
            </View>
            <View>
              <Text style={styles.statValue}>1200</Text>
              <Text style={styles.statLabel}>Reading points</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.lavender }]}>
              <Timer size={24} color={colors.background} />
            </View>
            <View>
              <Text style={styles.statValue}>16h 24min</Text>
              <Text style={styles.statLabel}>Time spent reading</Text>
            </View>
          </View>
        </View>

        <ChooseAvatar
          isVisible={isAvatarModalVisible}
          onClose={handleCloseAvatarModal}
          onSelectAvatar={handleSelectAvatar}
        />
      </View>
    </SafeAreaView>
  );
}

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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layout.spacing * 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: layout.spacing * 2,
  },
  profileImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 10, 
    top: 10, // Changed from bottom to top
    backgroundColor: colors.background02, // Changed to background02 color
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: 20,
    padding: 8,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing,
  },
  statsIcon: {
    marginRight: layout.spacing / 2,
  },
  statsTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
  },
  statsContainer: {
    gap: layout.spacing,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background02,
    borderRadius: 16,
    padding: layout.padding,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 8,
    marginRight: layout.spacing,
  },
  statValue: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});