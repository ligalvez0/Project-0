import React from 'react';
import { ViewStyle } from 'react-native';
import { ProgressBar as PaperProgressBar } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface ProgressBarProps {
  progress: number;
  color?: string;
  style?: ViewStyle;
}

function getProgressColor(progress: number): string {
  if (progress > 1) return colors.error;
  if (progress >= 0.8) return colors.warning;
  if (progress >= 0.6) return '#FBC02D';
  return colors.success;
}

export default function ProgressBar({ progress, color, style }: ProgressBarProps) {
  const barColor = color ?? getProgressColor(progress);
  const clampedProgress = Math.min(progress, 1);

  return (
    <PaperProgressBar
      progress={clampedProgress}
      color={barColor}
      style={[{ height: 8, borderRadius: 4 }, style]}
    />
  );
}
