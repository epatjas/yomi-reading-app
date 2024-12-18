import { StyleSheet } from 'react-native';

export const colors = {
  primary: 'hsl(233, 92%, 64%)',      // Primary color
  background: 'hsl(240, 10%, 8%)',    // Dark background
  background01: 'hsl(240, 10%, 8%)',  // Dark background (alias)
  background02: 'hsl(240, 13%, 10%)', // Slightly lighter dark background
  yellowLight: 'hsl(46, 100%, 78%)',   // Light yellow
  yellowMedium: 'hsl(51, 60%, 55%)',  // Medium yellow
  yellowDark: 'hsl(51, 75%, 40%)',    // Dark yellow
  text: 'hsl(240, 100%, 97%)',        // Light text color
  textSecondary: 'hsl(0, 0%, 58%)',   // Secondary text color
  stroke: 'hsl(236, 15%, 20%)',       // Stroke color
  buttonText: 'hsl(240, 100%, 97%)',  // Button text color (same as text)
  mint: 'hsl(156, 48%, 63%)',        // Mint green
  green: 'hsl(83, 37%, 85%)',        // Green
  greenDark: 'hsl(92, 21%, 66%)',    // Darker green
  lavender: 'hsl(237, 70%, 81%)',    // Lavender
  lavenderDark: 'hsl(237, 68%, 76%)', // Darker lavender
  error: 'hsl(368, 63%, 51%)',
  correct: '#72CDA8',                // Correct answer color
  incorrect: '#EE5775',              // Incorrect answer color
  buttonTextDark: '#1A1A1A', 
  pink: 'hsl(11, 33%, 88%)',
  pinkDark: 'hsl(11, 49%, 81%)',
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
