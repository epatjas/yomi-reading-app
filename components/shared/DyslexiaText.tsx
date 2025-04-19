import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface DyslexiaTextProps extends TextProps {
  children: React.ReactNode;
}

/**
 * A Text component that uses the OpenDyslexic font
 */
const DyslexiaText: React.FC<DyslexiaTextProps> = ({ style, children, ...props }) => {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: 'OpenDyslexic-Regular' },
        style
      ]}
    >
      {children}
    </Text>
  );
};

export default DyslexiaText; 