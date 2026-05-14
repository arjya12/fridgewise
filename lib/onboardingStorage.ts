import AsyncStorage from "@react-native-async-storage/async-storage";

/** Cleared with other `fridgewise_*` keys in `clearFridgewiseAsyncStorage`. */
const STORAGE_KEY = "fridgewise_onboarding_v1";

export type OnboardingPersistedState = {
  introDone: boolean;
  coachmarkDone: boolean;
};

const DEFAULT_STATE: OnboardingPersistedState = {
  introDone: false,
  coachmarkDone: false,
};

export async function loadOnboardingState(): Promise<OnboardingPersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<OnboardingPersistedState>;
    return {
      introDone: !!parsed.introDone,
      coachmarkDone: !!parsed.coachmarkDone,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveOnboardingState(
  next: OnboardingPersistedState
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function setIntroOnboardingDone(): Promise<void> {
  const cur = await loadOnboardingState();
  await saveOnboardingState({ ...cur, introDone: true });
}

export async function setCoachmarkOnboardingDone(): Promise<void> {
  const cur = await loadOnboardingState();
  await saveOnboardingState({ ...cur, coachmarkDone: true });
}

/** Skip all onboarding (e.g. user already has inventory). */
export async function setOnboardingFullyDone(): Promise<void> {
  await saveOnboardingState({ introDone: true, coachmarkDone: true });
}
