import { StyleSheet } from 'react-native';

export const colors = {
  primary: 'hsl(217, 86%, 78%)',    // Updated primary color (light blue)
  background: 'hsl(240, 3%, 6%)',    // Dark background
  background01: 'hsl(220, 6%, 10%)',  // Dark background (alias)
  background02: 'hsl(0, 0%, 12%)', // Slightly lighter dark background
  yellowLight: 'hsl(46, 100%, 78%)',   // Light yellow
  yellowMedium: 'hsl(51, 60%, 55%)',  // Medium yellow
  yellowDark: 'hsl(51, 75%, 40%)',    // Dark yellow
  text: 'hsl(240, 100%, 97%)',        // Light text color
  textSecondary: 'hsl(0, 0%, 58%)',   // Secondary text color
  stroke: 'hsl(230, 6%, 19%)',       // Stroke color
  buttonText: 'hsl(0, 0%, 10%)',      // Updated button text color to black (HSL)
  mint: 'hsl(156, 48%, 63%)',        // Mint green
  green: 'hsl(83, 37%, 85%)',        // Green
  greenDark: 'hsl(92, 21%, 66%)',    // Darker green
  lavender: 'hsl(237, 70%, 81%)',    // Lavender
  lavenderDark: 'hsl(237, 68%, 76%)', // Darker lavender
  error: 'hsl(368, 63%, 51%)',
  correct: 'hsl(150, 43%, 63%)',     // Correct answer color
  incorrect: 'hsl(348, 79%, 63%)',   // Incorrect answer color
  buttonTextDark: 'hsl(0, 0%, 10%)', 
  pink: 'hsl(11, 33%, 88%)',
  pinkDark: 'hsl(11, 49%, 81%)',
};

export const fonts = {
  regular: 'SFProRounded_400Regular', 
  medium: 'SFProRounded_500Medium',    
  semiBold: 'SFProRounded_600SemiBold', 
  bold: 'SFProRounded_700Bold',
  dyslexia: 'OpenDyslexic-Regular',
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
    color: colors.buttonText,
    fontSize: 18,
  },
  secondaryText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
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
  padding: 20,
  paddingHorizontal: 20,
  paddingVertical: 40,
  spacing: 16,
};
