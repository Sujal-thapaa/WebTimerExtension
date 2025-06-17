import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number;
  color: string;
  height?: number;
}

export default function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withDelay(200, withTiming(progress, { duration: 800 }));
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View 
        style={[
          styles.progress,
          { backgroundColor: color, height },
          animatedStyle
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 4,
  },
});