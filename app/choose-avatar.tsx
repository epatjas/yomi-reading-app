import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ImageSourcePropType, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import BottomSheet from '@gorhom/bottom-sheet';
import { Easing } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const avatars: ImageSourcePropType[] = [
  require('../assets/images/avatar1.png'),
  require('../assets/images/avatar2.png'),
  require('../assets/images/avatar3.png'),
  require('../assets/images/avatar4.png'),
  require('../assets/images/avatar5.png'),
  require('../assets/images/avatar6.png'),
  require('../assets/images/avatar7.png'),
  require('../assets/images/avatar8.png'),
  require('../assets/images/avatar9.png'),
];

const { width } = Dimensions.get('window');
const AVATAR_SIZE = (width - 80) / 3; // 80 is total horizontal padding and gaps

export default function ChooseAvatarScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      bottomSheetRef.current?.expand();
    }, 100);
  }, []);

  const handleSave = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      router.push({
        pathname: '/create-profile',
        params: { selectedAvatar },
      });
    }, 500);
  }, [selectedAvatar, router]);

  const renderAvatar = ({ item, index }: { item: ImageSourcePropType; index: number }) => (
    <TouchableOpacity 
      style={[styles.avatarContainer, selectedAvatar === index && styles.selectedAvatarContainer]} 
      onPress={() => setSelectedAvatar(index)}
    >
      <Image source={item} style={styles.avatar} />
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.profileContent}>
          <Text style={styles.profileTitle}>Profile</Text>
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={['25%', '85%']}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          animationConfigs={{
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.title}>Choose your avatar</Text>
            <FlatList
              data={avatars}
              renderItem={renderAvatar}
              keyExtractor={(_, index) => index.toString()}
              numColumns={3}
              contentContainerStyle={styles.avatarList}
              columnWrapperStyle={styles.avatarRow}
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background01,
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical,
  },
  profileContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  profileTitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  bottomSheetBackground: {
    backgroundColor: colors.background02,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: 40,
  },
  avatarList: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  avatarRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  selectedAvatarContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.text,
    width: 40,
    height: 4,
  },
});
