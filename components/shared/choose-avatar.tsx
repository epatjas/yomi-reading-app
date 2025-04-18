import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Modal, Dimensions } from 'react-native';
import { colors, fonts, layout } from '../../app/styles/globalStyles';
import { supabase } from '../../supabase'; // Make sure this import path is correct
import { useTranslation } from 'react-i18next';

interface ChooseAvatarProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatarIndex: number) => void;
}

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChooseAvatar({ isVisible, onClose, onSelectAvatar }: ChooseAvatarProps) {
  const { t } = useTranslation();
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const handleSelectAvatar = (index: number) => {
    setSelectedAvatar(index);
    onSelectAvatar(index);
  };

  const renderAvatar = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity onPress={() => handleSelectAvatar(index)} style={styles.avatarWrapper}>
      <Image source={item} style={styles.avatar} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('components.chooseAvatar.title')}</Text>
          <FlatList
            data={avatars}
            renderItem={renderAvatar}
            keyExtractor={(_, index) => index.toString()}
            numColumns={3}
            contentContainerStyle={styles.avatarList}
          />
          <TouchableOpacity style={styles.saveButton} onPress={onClose}>
            <Text style={styles.saveButtonText}>{t('components.chooseAvatar.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background02,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: layout.padding,
    paddingTop: layout.padding,
    height: SCREEN_HEIGHT * 0.95,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: layout.spacing * 2,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginBottom: layout.spacing * 2,
    marginTop: layout.spacing * 2,
  },
  avatarList: {
    alignItems: 'center',
    marginTop: layout.spacing,
  },
  avatarWrapper: {
    width: 100, // Fixed width for each avatar wrapper
    height: 100, // Fixed height to match width
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8, // Small margin for spacing between avatars
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50, // Half of width/height for circular avatar
  },
  saveButton: {
    backgroundColor: colors.primary,
    width: '100%',
    height: 48,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: layout.spacing * 2,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});
