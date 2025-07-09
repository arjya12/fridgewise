// AnimatedCalendarTransitions - Polished animations and transitions
// Provides smooth, accessible animations for calendar interactions

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  PanResponder,
  Platform,
  StyleSheet,
  UIManager,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AnimatedCalendarTransitionsProps,
  AnimationPreset,
  GestureConfig,
  TransitionConfig,
} from "../../types/calendar-enhanced";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// =============================================================================
// ANIMATION PRESETS
// =============================================================================

const ANIMATION_PRESETS: Record<AnimationPreset, TransitionConfig> = {
  gentle: {
    duration: 400,
    easing: Easing.out(Easing.quad),
    stiffness: 100,
    damping: 15,
    mass: 1,
  },
  snappy: {
    duration: 250,
    easing: Easing.out(Easing.back(1.2)),
    stiffness: 200,
    damping: 20,
    mass: 0.8,
  },
  smooth: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    stiffness: 150,
    damping: 18,
    mass: 1,
  },
  bouncy: {
    duration: 500,
    easing: Easing.elastic(2),
    stiffness: 80,
    damping: 12,
    mass: 1.2,
  },
};

// =============================================================================
// LAYOUT ANIMATION CONFIGS
// =============================================================================

const LAYOUT_ANIMATIONS = {
  gentle: {
    duration: 400,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },
  snappy: {
    duration: 250,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.scaleXY,
      springDamping: 0.7,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.7,
    },
    delete: {
      type: LayoutAnimation.Types.easeOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },
  smooth: {
    duration: 300,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.scaleXY,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },
};

// =============================================================================
// ANIMATION HOOKS
// =============================================================================

function useAnimatedValue(initialValue: number = 0) {
  const animatedValue = useRef(new Animated.Value(initialValue));
  return animatedValue.current;
}

function useSpringAnimation(
  animatedValue: Animated.Value,
  config: TransitionConfig
) {
  return useCallback(
    (toValue: number, onComplete?: () => void) => {
      Animated.spring(animatedValue, {
        toValue,
        tension: config.stiffness,
        friction: config.damping,
        mass: config.mass,
        useNativeDriver: true,
      }).start(onComplete);
    },
    [animatedValue, config]
  );
}

function useTimingAnimation(
  animatedValue: Animated.Value,
  config: TransitionConfig
) {
  return useCallback(
    (toValue: number, onComplete?: () => void) => {
      Animated.timing(animatedValue, {
        toValue,
        duration: config.duration,
        easing: config.easing,
        useNativeDriver: true,
      }).start(onComplete);
    },
    [animatedValue, config]
  );
}

// =============================================================================
// GESTURE ANIMATIONS
// =============================================================================

function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  config: GestureConfig = { threshold: 50, velocity: 0.3 }
) {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        // Optional: Add visual feedback during swipe
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;

        if (Math.abs(dx) > config.threshold || Math.abs(vx) > config.velocity) {
          if (dx > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (dx < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}

// =============================================================================
// ANIMATED COMPONENTS
// =============================================================================

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [opacity, duration, delay]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

interface SlideInViewProps {
  children: React.ReactNode;
  direction: "left" | "right" | "up" | "down";
  duration?: number;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction,
  duration = 300,
  delay = 0,
  distance = 100,
  style,
}) => {
  const translateX = useAnimatedValue(
    direction === "left" ? -distance : direction === "right" ? distance : 0
  );
  const translateY = useAnimatedValue(
    direction === "up" ? -distance : direction === "down" ? distance : 0
  );
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateX, translateY, opacity, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface ScaleInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  initialScale?: number;
  style?: ViewStyle;
}

const ScaleInView: React.FC<ScaleInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  initialScale = 0.8,
  style,
}) => {
  const scale = useAnimatedValue(initialScale);
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scale, opacity, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AnimatedCalendarTransitions: React.FC<
  AnimatedCalendarTransitionsProps
> = ({
  children,
  preset = "smooth",
  enableGestures = true,
  enableLayoutAnimations = true,
  onSwipeLeft,
  onSwipeRight,
  gestureConfig,
  style,
  testID = "animated-calendar-transitions",
}) => {
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(false);

  // Get animation configuration
  const animationConfig = useMemo(() => {
    return ANIMATION_PRESETS[preset];
  }, [preset]);

  // Setup gesture handlers
  const swipeHandlers = useSwipeGesture(
    onSwipeLeft,
    onSwipeRight,
    gestureConfig
  );

  // Setup layout animations
  useEffect(() => {
    if (enableLayoutAnimations) {
      LayoutAnimation.configureNext(
        LAYOUT_ANIMATIONS[preset] || LAYOUT_ANIMATIONS.smooth
      );
    }
  }, [enableLayoutAnimations, preset]);

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Container styles
  const containerStyle = useMemo((): ViewStyle => {
    return {
      flex: 1,
      paddingTop: insets.top,
      ...style,
    };
  }, [insets.top, style]);

  return (
    <View
      style={containerStyle}
      {...(enableGestures ? swipeHandlers : {})}
      testID={testID}
    >
      <FadeInView duration={animationConfig.duration}>{children}</FadeInView>
    </View>
  );
};

// =============================================================================
// CALENDAR-SPECIFIC ANIMATIONS
// =============================================================================

interface AnimatedDateCellProps {
  children: React.ReactNode;
  isSelected?: boolean;
  hasItems?: boolean;
  isToday?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const AnimatedDateCell: React.FC<AnimatedDateCellProps> = ({
  children,
  isSelected = false,
  hasItems = false,
  isToday = false,
  onPress,
  style,
}) => {
  const scale = useAnimatedValue(1);
  const opacity = useAnimatedValue(1);
  const backgroundColor = useAnimatedValue(0);

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);

  const animateSelection = useCallback(
    (selected: boolean) => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: selected ? 1.1 : 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundColor, {
          toValue: selected ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [scale, backgroundColor]
  );

  useEffect(() => {
    animateSelection(isSelected);
  }, [isSelected, animateSelection]);

  const handlePress = useCallback(() => {
    animatePress();
    onPress?.();
  }, [animatePress, onPress]);

  const interpolatedBackgroundColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#007AFF"],
  });

  return (
    <Animated.View
      style={[
        styles.dateCell,
        style,
        {
          transform: [{ scale }],
          backgroundColor: interpolatedBackgroundColor,
        },
      ]}
      onTouchEnd={handlePress}
    >
      <Animated.View style={{ opacity }}>{children}</Animated.View>
    </Animated.View>
  );
};

interface AnimatedItemListProps {
  children: React.ReactNode;
  itemCount: number;
  animationDelay?: number;
  style?: ViewStyle;
}

export const AnimatedItemList: React.FC<AnimatedItemListProps> = ({
  children,
  itemCount,
  animationDelay = 50,
  style,
}) => {
  return (
    <View style={style}>
      <SlideInView direction="up" delay={itemCount * animationDelay}>
        {children}
      </SlideInView>
    </View>
  );
};

interface AnimatedPanelProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  expandedHeight?: number;
  collapsedHeight?: number;
  style?: ViewStyle;
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({
  children,
  isExpanded = true,
  expandedHeight = 300,
  collapsedHeight = 60,
  style,
}) => {
  const height = useAnimatedValue(
    isExpanded ? expandedHeight : collapsedHeight
  );
  const opacity = useAnimatedValue(isExpanded ? 1 : 0.7);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(height, {
        toValue: isExpanded ? expandedHeight : collapsedHeight,
        tension: 100,
        friction: 10,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: isExpanded ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, height, opacity, expandedHeight, collapsedHeight]);

  return (
    <Animated.View
      style={[
        style,
        {
          height,
          opacity,
          overflow: "hidden",
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a staggered animation for multiple items
 */
export function createStaggeredAnimation(
  items: Animated.Value[],
  config: TransitionConfig,
  staggerDelay: number = 50
): Animated.CompositeAnimation {
  const animations = items.map((item, index) =>
    Animated.timing(item, {
      toValue: 1,
      duration: config.duration,
      delay: index * staggerDelay,
      easing: config.easing,
      useNativeDriver: true,
    })
  );

  return Animated.parallel(animations);
}

/**
 * Create a sequence animation
 */
export function createSequenceAnimation(
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.sequence(animations);
}

/**
 * Create a loop animation
 */
export function createLoopAnimation(
  animation: Animated.CompositeAnimation,
  iterations: number = -1
): Animated.CompositeAnimation {
  return Animated.loop(animation, { iterations });
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  dateCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  },
});

// =============================================================================
// EXPORT
// =============================================================================

AnimatedCalendarTransitions.displayName = "AnimatedCalendarTransitions";

export default AnimatedCalendarTransitions;
export {
  AnimatedDateCell,
  AnimatedItemList,
  AnimatedPanel,
  ANIMATION_PRESETS,
  createLoopAnimation,
  createSequenceAnimation,
  createStaggeredAnimation,
  FadeInView,
  ScaleInView,
  SlideInView,
  useAnimatedValue,
  useSpringAnimation,
  useSwipeGesture,
  useTimingAnimation,
};
