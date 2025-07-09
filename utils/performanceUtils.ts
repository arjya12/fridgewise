// Performance Optimization Utilities - Phase 2 Implementation
// Advanced performance utilities for 60fps animations and optimized rendering

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, InteractionManager, Platform } from "react-native";

// =============================================================================
// ANIMATION PERFORMANCE UTILITIES
// =============================================================================

export interface AnimationConfig {
  useNativeDriver: boolean;
  duration: number;
  tension?: number;
  friction?: number;
  bounciness?: number;
  speed?: number;
  delay?: number;
  easing?: (value: number) => number;
}

export interface OptimizedAnimationConfig extends AnimationConfig {
  priority: "low" | "medium" | "high";
  interruptible: boolean;
  skipOnLowPerformance: boolean;
  reduceOnAccessibility: boolean;
}

// Create performance-optimized animation configurations
export function createOptimizedAnimation(
  type: "spring" | "timing" | "decay",
  config: Partial<OptimizedAnimationConfig> = {}
): OptimizedAnimationConfig {
  const defaultConfig: OptimizedAnimationConfig = {
    useNativeDriver: true,
    duration: 300,
    priority: "medium",
    interruptible: true,
    skipOnLowPerformance: false,
    reduceOnAccessibility: true,
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Optimize based on animation type
  switch (type) {
    case "spring":
      return {
        ...mergedConfig,
        tension: mergedConfig.tension ?? 100,
        friction: mergedConfig.friction ?? 8,
        duration: 0, // Springs don't use duration
      };

    case "timing":
      return {
        ...mergedConfig,
        duration: mergedConfig.duration ?? 300,
      };

    case "decay":
      return {
        ...mergedConfig,
        deceleration: 0.998,
      };

    default:
      return mergedConfig;
  }
}

// Performance-aware animation runner
export function runOptimizedAnimation(
  animatedValue: Animated.Value,
  toValue: number,
  config: OptimizedAnimationConfig,
  onComplete?: () => void
): Animated.CompositeAnimation {
  // Check performance conditions
  const shouldSkip = config.skipOnLowPerformance && isLowPerformanceDevice();
  const shouldReduce =
    config.reduceOnAccessibility && isReducedMotionPreferred();

  if (shouldSkip) {
    animatedValue.setValue(toValue);
    onComplete?.();
    return Animated.timing(animatedValue, {
      toValue,
      duration: 0,
      useNativeDriver: config.useNativeDriver,
    });
  }

  // Adjust config for reduced motion
  let finalConfig = config;
  if (shouldReduce) {
    finalConfig = {
      ...config,
      duration: Math.min(config.duration, 150),
      tension: config.tension ? config.tension * 1.5 : undefined,
      friction: config.friction ? config.friction * 1.2 : undefined,
    };
  }

  // Create appropriate animation
  let animation: Animated.CompositeAnimation;

  if (finalConfig.tension !== undefined && finalConfig.friction !== undefined) {
    animation = Animated.spring(animatedValue, {
      toValue,
      tension: finalConfig.tension,
      friction: finalConfig.friction,
      useNativeDriver: finalConfig.useNativeDriver,
    });
  } else {
    animation = Animated.timing(animatedValue, {
      toValue,
      duration: finalConfig.duration,
      useNativeDriver: finalConfig.useNativeDriver,
      delay: finalConfig.delay,
    });
  }

  // Run with completion callback
  animation.start((finished) => {
    if (finished && onComplete) {
      onComplete();
    }
  });

  return animation;
}

// =============================================================================
// GESTURE PERFORMANCE UTILITIES
// =============================================================================

export interface GesturePerformanceConfig {
  enableNativeDriver: boolean;
  throttleMs: number;
  maxUpdateFrequency: number;
  useRAF: boolean;
  batchUpdates: boolean;
}

export function createOptimizedGestureHandler(
  onGestureUpdate: (value: number) => void,
  config: Partial<GesturePerformanceConfig> = {}
) {
  const finalConfig: GesturePerformanceConfig = {
    enableNativeDriver: true,
    throttleMs: 16, // 60fps
    maxUpdateFrequency: 60,
    useRAF: true,
    batchUpdates: true,
    ...config,
  };

  let lastUpdateTime = 0;
  let pendingUpdate: number | null = null;
  let rafId: number | null = null;

  const throttledUpdate = useCallback(
    (value: number) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;

      if (timeSinceLastUpdate < finalConfig.throttleMs) {
        // Store pending update
        pendingUpdate = value;

        if (finalConfig.useRAF && rafId === null) {
          rafId = requestAnimationFrame(() => {
            if (pendingUpdate !== null) {
              onGestureUpdate(pendingUpdate);
              pendingUpdate = null;
              lastUpdateTime = Date.now();
            }
            rafId = null;
          });
        }
        return;
      }

      // Execute immediately
      onGestureUpdate(value);
      lastUpdateTime = now;
    },
    [onGestureUpdate, finalConfig]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingUpdate = null;
  }, []);

  return { throttledUpdate, cleanup };
}

// =============================================================================
// RENDERING PERFORMANCE UTILITIES
// =============================================================================

export function useOptimizedRender<T>(
  data: T,
  compareFn?: (prev: T, next: T) => boolean
): T {
  const prevDataRef = useRef<T>(data);
  const memoizedData = useMemo(() => {
    const shouldUpdate = compareFn
      ? !compareFn(prevDataRef.current, data)
      : prevDataRef.current !== data;

    if (shouldUpdate) {
      prevDataRef.current = data;
      return data;
    }

    return prevDataRef.current;
  }, [data, compareFn]);

  return memoizedData;
}

export function useInteractionComplete(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(callback);
    return () => handle.cancel();
  }, deps);
}

export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<Array<() => void>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates((prev) => [...prev, updateFn]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setUpdates((currentUpdates) => {
        currentUpdates.forEach((fn) => fn());
        return [];
      });
    }, 16); // Batch within a frame
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return batchUpdate;
}

// =============================================================================
// MEMORY PERFORMANCE UTILITIES
// =============================================================================

export function useMemoryOptimizedList<T>(
  items: T[],
  maxVisibleItems: number = 50,
  keyExtractor: (item: T, index: number) => string
) {
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: maxVisibleItems,
  });

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const updateVisibleRange = useCallback(
    (newStart: number) => {
      const buffer = Math.floor(maxVisibleItems * 0.2); // 20% buffer
      const start = Math.max(0, newStart - buffer);
      const end = Math.min(items.length, newStart + maxVisibleItems + buffer);

      setVisibleRange({ start, end });
    },
    [items.length, maxVisibleItems]
  );

  return {
    visibleItems,
    updateVisibleRange,
    totalItems: items.length,
    visibleRange,
  };
}

export function useImageLoadOptimization() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const loadingRef = useRef<Set<string>>(new Set());

  const preloadImage = useCallback(
    async (uri: string): Promise<void> => {
      if (loadedImages.has(uri) || loadingRef.current.has(uri)) {
        return;
      }

      loadingRef.current.add(uri);

      try {
        // In React Native, we can use Image.prefetch for preloading
        // This is a simplified approach
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);

          // Simulate image loading
          setTimeout(() => {
            clearTimeout(timeout);
            resolve(true);
          }, 100);
        });

        setLoadedImages((prev) => new Set(prev).add(uri));
      } catch (error) {
        console.warn("Failed to preload image:", uri, error);
      } finally {
        loadingRef.current.delete(uri);
      }
    },
    [loadedImages]
  );

  const isImageLoaded = useCallback(
    (uri: string) => {
      return loadedImages.has(uri);
    },
    [loadedImages]
  );

  return { preloadImage, isImageLoaded };
}

// =============================================================================
// FRAME RATE MONITORING
// =============================================================================

export function useFrameRateMonitor() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const rafId = useRef<number | null>(null);

  const measureFrame = useCallback(() => {
    frameCount.current++;
    const now = Date.now();
    const elapsed = now - lastTime.current;

    if (elapsed >= 1000) {
      // Update every second
      const currentFps = Math.round((frameCount.current * 1000) / elapsed);
      setFps(currentFps);
      frameCount.current = 0;
      lastTime.current = now;
    }

    rafId.current = requestAnimationFrame(measureFrame);
  }, []);

  useEffect(() => {
    rafId.current = requestAnimationFrame(measureFrame);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [measureFrame]);

  return fps;
}

// =============================================================================
// DEVICE PERFORMANCE DETECTION
// =============================================================================

export function isLowPerformanceDevice(): boolean {
  // Simple heuristic based on platform
  if (Platform.OS === "android") {
    // Could be enhanced with device info
    return false; // Assume modern Android devices
  }

  if (Platform.OS === "ios") {
    // Could check specific iOS device models
    return false; // Assume modern iOS devices
  }

  return false;
}

export function isReducedMotionPreferred(): boolean {
  // This would integrate with accessibility settings
  // For now, return false as a fallback
  return false;
}

export function usePerformanceMonitoring() {
  const fps = useFrameRateMonitor();
  const [performanceLevel, setPerformanceLevel] = useState<
    "high" | "medium" | "low"
  >("high");

  useEffect(() => {
    if (fps < 30) {
      setPerformanceLevel("low");
    } else if (fps < 50) {
      setPerformanceLevel("medium");
    } else {
      setPerformanceLevel("high");
    }
  }, [fps]);

  return {
    fps,
    performanceLevel,
    isLowPerformance: performanceLevel === "low",
    recommendations: {
      reduceAnimations: performanceLevel === "low",
      useSimpleTransitions: performanceLevel !== "high",
      limitConcurrentAnimations: performanceLevel === "low",
    },
  };
}

// =============================================================================
// ANIMATION SEQUENCE OPTIMIZATION
// =============================================================================

export class OptimizedAnimationSequence {
  private animations: Array<{
    animation: Animated.CompositeAnimation;
    priority: "low" | "medium" | "high";
    id: string;
  }> = [];

  private running = false;
  private currentAnimation: Animated.CompositeAnimation | null = null;

  add(
    animation: Animated.CompositeAnimation,
    priority: "low" | "medium" | "high" = "medium",
    id?: string
  ) {
    this.animations.push({
      animation,
      priority,
      id: id || Math.random().toString(36).substr(2, 9),
    });

    // Sort by priority
    this.animations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;

    for (const { animation } of this.animations) {
      if (!this.running) break;

      this.currentAnimation = animation;

      await new Promise<void>((resolve) => {
        animation.start((finished) => {
          if (finished) {
            resolve();
          }
        });
      });
    }

    this.running = false;
    this.currentAnimation = null;
    this.animations = [];
  }

  stop() {
    this.running = false;
    if (this.currentAnimation) {
      this.currentAnimation.stop();
      this.currentAnimation = null;
    }
    this.animations = [];
  }

  remove(id: string) {
    this.animations = this.animations.filter((anim) => anim.id !== id);
  }
}

// =============================================================================
// GESTURE DEBOUNCING AND THROTTLING
// =============================================================================

export function useOptimizedGesture<T>(
  onGesture: (value: T) => void,
  throttleMs: number = 16
) {
  const lastCallTime = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledGesture = useCallback(
    (value: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;

      if (timeSinceLastCall >= throttleMs) {
        onGesture(value);
        lastCallTime.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onGesture(value);
          lastCallTime.current = Date.now();
        }, throttleMs - timeSinceLastCall);
      }
    },
    [onGesture, throttleMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledGesture;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  createOptimizedAnimation,
  runOptimizedAnimation,
  createOptimizedGestureHandler,
  useOptimizedRender,
  useInteractionComplete,
  useBatchedUpdates,
  useMemoryOptimizedList,
  useImageLoadOptimization,
  useFrameRateMonitor,
  isLowPerformanceDevice,
  isReducedMotionPreferred,
  usePerformanceMonitoring,
  OptimizedAnimationSequence,
  useOptimizedGesture,
};
