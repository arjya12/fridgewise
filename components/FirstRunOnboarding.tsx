import {
  loadOnboardingState,
  setCoachmarkOnboardingDone,
  setIntroOnboardingDone,
  setOnboardingFullyDone,
} from "@/lib/onboardingStorage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width: WIN_W, height: WIN_H } = Dimensions.get("window");

const SCRIM = "rgba(15, 23, 42, 0.6)";
const BORDER_GREEN = "#15803D";
const ACCENT_GREEN = "#16A34A";
const CARD_MAX_W = 360;
const SIDE_PAD = 24;
const ANIM_MS = 150;

/** Green + inside coach card (matches tab FAB ~50). */
const PLUS_IN_CARD_SIZE = 52;

type Props = {
  userId?: string | null;
  loading: boolean;
  itemCount: number;
};

function useModalEntrance(visible: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.96);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIM_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: ANIM_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  return { opacity, scale };
}

/**
 * Two-step first-run UX. Coach step uses a full-screen dimmed scrim (no FAB cut-out) so the overlay
 * stays visually even; the in-card + opens Add.
 */
export default function FirstRunOnboarding({
  userId,
  loading,
  itemCount,
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [coachmarkDone, setCoachmarkDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadOnboardingState().then((s) => {
      if (cancelled) return;
      setIntroDone(s.introDone);
      setCoachmarkDone(s.coachmarkDone);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finishIfHasItems = useCallback(async () => {
    if (itemCount > 0) {
      await setOnboardingFullyDone();
      setIntroDone(true);
      setCoachmarkDone(true);
    }
  }, [itemCount]);

  useEffect(() => {
    if (!hydrated || loading || !userId) return;
    void finishIfHasItems();
  }, [hydrated, loading, userId, finishIfHasItems]);

  const eligible =
    hydrated && !!userId && !loading && itemCount === 0 && !(introDone && coachmarkDone);

  const showIntroModal = eligible && !introDone;
  const showCoachmark = eligible && introDone && !coachmarkDone;

  const introAnim = useModalEntrance(showIntroModal);
  const coachAnim = useModalEntrance(showCoachmark);

  const onIntroContinue = useCallback(async () => {
    await setIntroOnboardingDone();
    setIntroDone(true);
  }, []);

  const onCoachmarkDismiss = useCallback(async () => {
    await setCoachmarkOnboardingDone();
    setCoachmarkDone(true);
  }, []);

  const onFabPress = useCallback(async () => {
    await setCoachmarkOnboardingDone();
    setCoachmarkDone(true);
    router.push("/(tabs)/add");
  }, []);

  const CARD_TOP = WIN_H * 0.26;

  const coachCardWidth = Math.min(CARD_MAX_W, WIN_W - SIDE_PAD * 2);
  const coachCardLeft = (WIN_W - coachCardWidth) / 2;

  return (
    <>
      <Modal
        visible={showIntroModal}
        animationType="none"
        transparent
        onRequestClose={onIntroContinue}
      >
        <View style={styles.scrimRoot} accessibilityViewIsModal>
          <View style={styles.introCenterWrap} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.introCardWrap,
                {
                  opacity: introAnim.opacity,
                  transform: [{ scale: introAnim.scale }],
                },
              ]}
            >
              <View style={styles.card}>
                <Text style={styles.title}>Welcome to FridgeWise</Text>
                <Text style={styles.body}>
                  Track what you have, when it expires, and waste less food. Start by
                  adding your first item.
                </Text>

                <Pressable
                  onPress={onIntroContinue}
                  style={styles.primaryBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Got it"
                >
                  <Text style={styles.primaryBtnLabel}>Got it</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCoachmark}
        animationType="none"
        transparent
        onRequestClose={onCoachmarkDismiss}
      >
        <View style={styles.coachRoot} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }]}
            onPress={onCoachmarkDismiss}
            accessibilityLabel="Dismiss hint"
          />

          <Animated.View
            style={[
              styles.coachCardWrap,
              {
                top: CARD_TOP,
                left: coachCardLeft,
                width: coachCardWidth,
                zIndex: 20,
              },
              {
                opacity: coachAnim.opacity,
                transform: [{ scale: coachAnim.scale }],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.card}>
              <Text style={styles.title}>Add your first item</Text>

              <Text style={[styles.body, styles.bodyCoachLast]}>
                Tap the + below to add an item.
              </Text>

              <Pressable
                onPress={onFabPress}
                style={styles.plusInCard}
                accessibilityRole="button"
                accessibilityLabel="Add new item"
              >
                <Ionicons name="add" size={30} color="#FFFFFF" />
              </Pressable>

              <Pressable
                onPress={onCoachmarkDismiss}
                style={styles.primaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Got it"
              >
                <Text style={styles.primaryBtnLabel}>Got it</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrimRoot: {
    flex: 1,
    backgroundColor: SCRIM,
  },
  introCenterWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SIDE_PAD,
  },
  introCardWrap: {
    width: "100%",
    maxWidth: CARD_MAX_W,
    alignSelf: "center",
  },
  coachRoot: {
    flex: 1,
  },
  coachCardWrap: {
    position: "absolute",
  },
  plusInCard: {
    alignSelf: "center",
    width: PLUS_IN_CARD_SIZE,
    height: PLUS_IN_CARD_SIZE,
    borderRadius: PLUS_IN_CARD_SIZE / 2,
    backgroundColor: ACCENT_GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER_GREEN,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#475569",
    textAlign: "center",
    marginBottom: 18,
  },
  bodyCoachLast: {
    marginBottom: 16,
  },
  primaryBtn: {
    alignSelf: "stretch",
    backgroundColor: ACCENT_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});
