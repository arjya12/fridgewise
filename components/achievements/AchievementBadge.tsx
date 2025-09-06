// Achievement Badge Component
// Displays individual achievement badges with progress and animations

import { Achievement } from '@/lib/supabase';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showTitle?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AchievementBadge({
  achievement,
  size = 'medium',
  showProgress = true,
  showTitle = true,
  onPress,
  style
}: AchievementBadgeProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(achievement.unlocked ? 1 : 0.6);

  const sizeStyles = {
    small: {
      badgeSize: 60,
      iconSize: 24,
      titleSize: 12,
      progressHeight: 3
    },
    medium: {
      badgeSize: 80,
      iconSize: 32,
      titleSize: 14,
      progressHeight: 4
    },
    large: {
      badgeSize: 100,
      iconSize: 40,
      titleSize: 16,
      progressHeight: 5
    }
  };

  const currentSize = sizeStyles[size];
  const progressPercentage = (achievement.progress / achievement.threshold) * 100;

  // Animation when badge is unlocked
  React.useEffect(() => {
    if (achievement.unlocked) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 8 })
      );
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [achievement.unlocked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    onPress?.();
  };

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <View
        style={[
          styles.badge,
          {
            width: currentSize.badgeSize,
            height: currentSize.badgeSize,
            borderRadius: currentSize.badgeSize / 2,
          },
          achievement.unlocked ? styles.unlockedBadge : styles.lockedBadge
        ]}
        onTouchEnd={handlePress}
      >
        <Text style={[styles.icon, { fontSize: currentSize.iconSize }]}>
          {achievement.unlocked ? achievement.icon : '🔒'}
        </Text>
      </View>

      {showProgress && !achievement.unlocked && (
        <View style={[styles.progressContainer, { height: currentSize.progressHeight }]}>
          <View
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(progressPercentage, 100)}%`,
                height: currentSize.progressHeight
              }
            ]}
          />
        </View>
      )}

      {showTitle && (
        <View style={styles.titleContainer}>
          <Text 
            style={[
              styles.title, 
              { fontSize: currentSize.titleSize },
              achievement.unlocked ? styles.unlockedTitle : styles.lockedTitle
            ]}
            numberOfLines={2}
          >
            {achievement.title}
          </Text>
          
          {showProgress && !achievement.unlocked && (
            <Text style={[styles.progress, { fontSize: currentSize.titleSize - 2 }]}>
              {achievement.progress}/{achievement.threshold}
            </Text>
          )}
        </View>
      )}

      {achievement.unlocked && achievement.unlockedAt && (
        <View style={styles.unlockedIndicator}>
          <Text style={styles.unlockedText}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unlockedBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  lockedBadge: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  icon: {
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 8,
    width: 80,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  unlockedTitle: {
    color: '#1F2937',
  },
  lockedTitle: {
    color: '#6B7280',
  },
  progress: {
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  unlockedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10B981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AchievementBadge;