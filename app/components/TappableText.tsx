import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TappableTextProps {
  text: string;
  onWordTap: (word: string) => void;
  style: any;
}

const TappableText: React.FC<TappableTextProps> = ({ text, onWordTap, style }) => {
  const words = text.split(' ');

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {words.map((word, index) => (
        <TouchableOpacity key={index} onPress={() => onWordTap(word)}>
          <Text style={style}>
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TappableText;
