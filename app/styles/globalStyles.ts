import { StyleSheet } from 'react-native';

export const colors = {
  primary: 'hsl(233, 92%, 64%)',      // Primary color
  background01: 'hsl(240, 10%, 8%)',   // Background 01
  background02: 'hsl(240, 13%, 10%)',  // Background 02
  text: 'hsl(240, 100%, 97%)',         // Text color
  secondaryText: 'hsl(0, 0%, 58%)',    // Text secondary
  stroke: 'hsl(240, 13%, 11%)',        // Stroke color
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background01,
    padding: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'center',
  },
  buttonText: {
    fontFamily: fonts.medium,
    color: colors.text,
    fontSize: 18,
  },
  secondaryText: {
    fontFamily: fonts.regular,
    color: colors.secondaryText,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.background02,
    borderRadius: 8,
    borderColor: colors.stroke,
    borderWidth: 1,
    padding: 16,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: colors.background02,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  // Add more global styles as needed
});

export const layout = {
  paddingHorizontal: 20,
  paddingVertical: 40,
};
