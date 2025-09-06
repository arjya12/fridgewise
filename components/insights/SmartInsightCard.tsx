// Smart Insight Card Component
// Displays actionable insights and recommendations with engaging visuals

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

export interface SmartInsight {
  id: string;
  type: 'tip' | 'warning' | 'celebration' | 'suggestion';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  priority: 'high' | 'medium' | 'low';
  data?: {
    value?: number;
    change?: number;
    unit?: string;
  };
}

interface SmartInsightCardProps {
  insight: SmartInsight;
  onDismiss?: (id: string) => void;
  style?: ViewStyle;
}

export function SmartInsightCard({
  insight,
  onDismiss,
  style
}: SmartInsightCardProps) {
  const scale = useSharedValue(1);

  const getInsightStyles = () => {
    switch (insight.type) {
      case 'celebration':
        return {
          backgroundColor: '#ECFDF5',
          borderColor: '#10B981',
          iconColor: '#10B981',
          titleColor: '#065F46',
          messageColor: '#047857'
        };
      case 'warning':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#EF4444',
          iconColor: '#EF4444',
          titleColor: '#991B1B',
          messageColor: '#DC2626'
        };
      case 'suggestion':
        return {
          backgroundColor: '#EFF6FF',
          borderColor: '#3B82F6',
          iconColor: '#3B82F6',
          titleColor: '#1E40AF',
          messageColor: '#2563EB'
        };
      default: // tip
        return {
          backgroundColor: '#FFFBEB',
          borderColor: '#F59E0B',
          iconColor: '#F59E0B',
          titleColor: '#92400E',
          messageColor: '#D97706'
        };
    }
  };

  const getDefaultIcon = () => {
    switch (insight.type) {
      case 'celebration':
        return 'trophy';
      case 'warning':
        return 'warning';
      case 'suggestion':
        return 'bulb';
      default:
        return 'information-circle';
    }
  };

  const styles = getInsightStyles();
  const iconName = insight.icon || getDefaultIcon();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    insight.onAction?.();
  };

  const handleDismiss = () => {
    onDismiss?.(insight.id);
  };

  return (
    <Animated.View style={[cardStyles.container, { 
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor 
    }, style, animatedStyle]}>
      {/* Header */}
      <View style={cardStyles.header}>
        <View style={cardStyles.iconContainer}>
          <Ionicons 
            name={iconName as keyof typeof Ionicons.glyphMap} 
            size={24} 
            color={styles.iconColor} 
          />
        </View>
        
        <View style={cardStyles.headerText}>
          <Text style={[cardStyles.title, { color: styles.titleColor }]}>
            {insight.title}
          </Text>
          
          {insight.data && (
            <View style={cardStyles.dataContainer}>
              {insight.data.value !== undefined && (
                <Text style={[cardStyles.dataValue, { color: styles.iconColor }]}>
                  {insight.data.value}{insight.data.unit || ''}
                </Text>
              )}
              {insight.data.change !== undefined && (
                <Text style={[
                  cardStyles.dataChange,
                  { color: insight.data.change >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {insight.data.change >= 0 ? '+' : ''}{insight.data.change}%
                </Text>
              )}
            </View>
          )}
        </View>

        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} style={cardStyles.dismissButton}>
            <Ionicons name="close" size={18} color={styles.messageColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Message */}
      <Text style={[cardStyles.message, { color: styles.messageColor }]}>
        {insight.message}
      </Text>

      {/* Action Button */}
      {insight.actionText && insight.onAction && (
        <TouchableOpacity 
          style={[cardStyles.actionButton, { borderColor: styles.iconColor }]}
          onPress={handlePress}
        >
          <Text style={[cardStyles.actionText, { color: styles.iconColor }]}>
            {insight.actionText}
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={16} 
            color={styles.iconColor} 
            style={cardStyles.actionIcon}
          />
        </TouchableOpacity>
      )}

      {/* Priority Indicator */}
      {insight.priority === 'high' && (
        <View style={[cardStyles.priorityIndicator, { backgroundColor: styles.iconColor }]} />
      )}
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dataChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    marginTop: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionIcon: {
    marginLeft: 6,
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    margin: 8,
  },
});

export default SmartInsightCard;