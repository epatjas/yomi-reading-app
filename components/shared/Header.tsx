import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import { colors, fonts, layout } from '../../app/styles/globalStyles';

interface HeaderProps {
  title: string;
  onBackPress: () => void;
  onMorePress: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBackPress, onMorePress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBackPress} style={styles.headerButton}>
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onMorePress} style={styles.headerButton}>
        <MoreVertical size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.padding,
    paddingTop: layout.padding,
    paddingBottom: layout.padding / 2,
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
});

export default Header;
