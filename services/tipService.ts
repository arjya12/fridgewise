import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Tip {
  id: number;
  text: string;
  category: TipCategory;
}

export type TipCategory =
  | "storage"
  | "expiration"
  | "safety"
  | "organization"
  | "waste";

const TIPS_STORAGE_KEY = "fridgewise_current_tip_index";

// Collection of helpful food storage/management tips
export const TIPS: Tip[] = [
  // Food storage best practices
  {
    id: 1,
    text: "Store bananas separately to prevent other fruits from ripening too quickly",
    category: "storage",
  },
  {
    id: 2,
    text: "Keep potatoes and onions separate - they both emit gases that make each other spoil faster",
    category: "storage",
  },
  {
    id: 3,
    text: "Store herbs like fresh basil in a glass of water at room temperature to extend their life",
    category: "storage",
  },
  {
    id: 4,
    text: "Keep tomatoes at room temperature for better flavor and texture",
    category: "storage",
  },
  {
    id: 5,
    text: "Store apples in the refrigerator to keep them fresh up to 10 times longer",
    category: "storage",
  },
  {
    id: 6,
    text: "Wrap celery in aluminum foil before refrigerating to keep it crisp for weeks",
    category: "storage",
  },
  {
    id: 7,
    text: "Store mushrooms in a paper bag in the fridge to prevent them from getting slimy",
    category: "storage",
  },
  {
    id: 8,
    text: "Keep milk on a refrigerator shelf rather than in the door for consistent temperature",
    category: "storage",
  },

  // Expiration date management
  {
    id: 9,
    text: "Use the 'first in, first out' rule - place newer items behind older ones",
    category: "expiration",
  },
  {
    id: 10,
    text: "'Best by' dates indicate quality, not safety - many foods are still good days after",
    category: "expiration",
  },
  {
    id: 11,
    text: "Freeze food before its expiration date to extend its life by months",
    category: "expiration",
  },
  {
    id: 12,
    text: "Eggs can last 3-5 weeks in the refrigerator, even beyond the date on the carton",
    category: "expiration",
  },
  {
    id: 13,
    text: "Hard cheeses can last 3-4 weeks in the refrigerator after opening",
    category: "expiration",
  },
  {
    id: 14,
    text: "Write the date you opened condiments on the jar with a marker",
    category: "expiration",
  },

  // Food safety tips
  {
    id: 15,
    text: "Keep your refrigerator at or below 40°F (4°C) to slow bacterial growth",
    category: "safety",
  },
  {
    id: 16,
    text: "Use separate cutting boards for raw meat and produce to prevent cross-contamination",
    category: "safety",
  },
  {
    id: 17,
    text: "Thaw frozen food in the refrigerator, not on the counter",
    category: "safety",
  },
  {
    id: 18,
    text: "Cooked food shouldn't be left at room temperature for more than 2 hours",
    category: "safety",
  },
  {
    id: 19,
    text: "Wash your hands for 20 seconds before and after handling food",
    category: "safety",
  },
  {
    id: 20,
    text: "Clean your refrigerator regularly to prevent mold and bacteria growth",
    category: "safety",
  },

  // Inventory organization
  {
    id: 21,
    text: "Group similar items together in your refrigerator for easier inventory management",
    category: "organization",
  },
  {
    id: 22,
    text: "Use clear containers to easily see what's inside without opening",
    category: "organization",
  },
  {
    id: 23,
    text: "Keep a whiteboard on your fridge to track what needs to be used soon",
    category: "organization",
  },
  {
    id: 24,
    text: "Store leftovers in standard-sized containers that stack well",
    category: "organization",
  },
  {
    id: 25,
    text: "Label all containers with contents and date for easy identification",
    category: "organization",
  },
  {
    id: 26,
    text: "Do a weekly inventory check before grocery shopping to avoid buying duplicates",
    category: "organization",
  },

  // Waste reduction tips
  {
    id: 27,
    text: "Freeze overripe bananas for smoothies or banana bread",
    category: "waste",
  },
  {
    id: 28,
    text: "Use vegetable scraps to make homemade stock",
    category: "waste",
  },
  {
    id: 29,
    text: "Blend wilting herbs with olive oil and freeze in ice cube trays",
    category: "waste",
  },
  {
    id: 30,
    text: "Turn stale bread into croutons or breadcrumbs",
    category: "waste",
  },
  {
    id: 31,
    text: "Pickle vegetables that are about to go bad",
    category: "waste",
  },
  {
    id: 32,
    text: "Plan meals around what needs to be used first in your inventory",
    category: "waste",
  },
  {
    id: 33,
    text: "Revive limp vegetables by soaking them in ice water for 15-30 minutes",
    category: "waste",
  },
  {
    id: 34,
    text: "Compost food scraps instead of throwing them away",
    category: "waste",
  },
  {
    id: 35,
    text: "Make smoothies with fruits that are past their prime",
    category: "waste",
  },
];

/**
 * Gets the current tip index from AsyncStorage
 */
export const getCurrentTipIndex = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(TIPS_STORAGE_KEY);
    return value !== null ? parseInt(value) : 0;
  } catch (error) {
    console.error("Error getting current tip index:", error);
    return 0;
  }
};

/**
 * Saves the current tip index to AsyncStorage
 */
export const saveCurrentTipIndex = async (index: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(TIPS_STORAGE_KEY, index.toString());
  } catch (error) {
    console.error("Error saving current tip index:", error);
  }
};

/**
 * Gets the next tip and updates the stored index
 */
export const getNextTip = async (): Promise<Tip> => {
  const currentIndex = await getCurrentTipIndex();
  const nextIndex = (currentIndex + 1) % TIPS.length;

  await saveCurrentTipIndex(nextIndex);
  return TIPS[nextIndex];
};

/**
 * Gets the current tip without updating the index
 */
export const getCurrentTip = async (): Promise<Tip> => {
  const currentIndex = await getCurrentTipIndex();
  return TIPS[currentIndex];
};
