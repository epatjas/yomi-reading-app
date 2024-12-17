import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Play, Pause, Square } from 'lucide-react-native';
import { colors, fonts } from '../../../app/styles/globalStyles';

interface RecordingInterfaceProps {
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onCancel: () => void;
  duration: number;
  isPaused: boolean;
}

export const RecordingInterface = ({
  onStart,
  onStop,
  onPause,
  onCancel,
  duration,
  isPaused
}: RecordingInterfaceProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.recordingInterface}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <X size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.recordingControls}>
        <Text style={styles.durationText}>
          {formatDuration(duration)}
        </Text>
        <TouchableOpacity onPress={onPause} style={styles.pauseButton}>
          {isPaused ? (
            <Play size={20} color={colors.text} />
          ) : (
            <Pause size={20} color={colors.text} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onStop} style={styles.stopButton}>
          <Square size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  recordingInterface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background02,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 12,
    borderRadius: 30,
    height: 60,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginRight: 12,
  },
  pauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262736',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecordingInterface; 