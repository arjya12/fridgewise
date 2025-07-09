// utils/mealPlanningUtils.ts
import { FoodItemWithUrgency } from "@/services/foodItems";

export interface MealOpportunity {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  description: string;
  ingredients: FoodItemWithUrgency[];
  urgencyScore: number;
  estimatedPrepTime: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  nutritionScore: number;
  wasteReduction: number; // Percentage of expiring items used
}

export interface RecipeTemplate {
  id: string;
  name: string;
  category: string;
  ingredients: string[];
  requiredIngredients: string[]; // Must have these
  optionalIngredients: string[]; // Nice to have these
  prepTime: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  instructions?: string[];
}

export interface MealPlanningAnalysis {
  opportunities: MealOpportunity[];
  coverage: {
    total: number;
    used: number;
    critical: number;
    warning: number;
    percentage: number;
  };
  recommendations: {
    priority: MealOpportunity[];
    quick: MealOpportunity[];
    nutritious: MealOpportunity[];
  };
  unusedCritical: FoodItemWithUrgency[];
}

// Recipe templates database
const RECIPE_TEMPLATES: RecipeTemplate[] = [
  // Breakfast recipes
  {
    id: "scrambled-eggs",
    name: "Scrambled Eggs",
    category: "breakfast",
    ingredients: ["eggs", "milk", "butter", "cheese"],
    requiredIngredients: ["eggs"],
    optionalIngredients: ["milk", "butter", "cheese", "herbs"],
    prepTime: 10,
    difficulty: "easy",
    tags: ["protein", "quick", "vegetarian"],
    instructions: [
      "Crack eggs into bowl",
      "Add milk and whisk",
      "Cook in buttered pan over medium heat",
      "Add cheese if available",
    ],
  },
  {
    id: "fruit-yogurt-bowl",
    name: "Fruit & Yogurt Bowl",
    category: "breakfast",
    ingredients: ["yogurt", "fruit", "honey", "nuts"],
    requiredIngredients: ["yogurt"],
    optionalIngredients: ["fruit", "honey", "nuts", "granola"],
    prepTime: 5,
    difficulty: "easy",
    tags: ["healthy", "quick", "light"],
  },
  {
    id: "toast-avocado",
    name: "Avocado Toast",
    category: "breakfast",
    ingredients: ["bread", "avocado", "lemon", "salt"],
    requiredIngredients: ["bread", "avocado"],
    optionalIngredients: ["lemon", "tomato", "herbs"],
    prepTime: 8,
    difficulty: "easy",
    tags: ["healthy", "vegetarian", "trendy"],
  },

  // Lunch recipes
  {
    id: "sandwich-classic",
    name: "Classic Sandwich",
    category: "lunch",
    ingredients: ["bread", "meat", "cheese", "lettuce", "tomato"],
    requiredIngredients: ["bread"],
    optionalIngredients: ["meat", "cheese", "lettuce", "tomato", "mayo"],
    prepTime: 5,
    difficulty: "easy",
    tags: ["quick", "portable", "filling"],
  },
  {
    id: "salad-mixed",
    name: "Mixed Green Salad",
    category: "lunch",
    ingredients: ["lettuce", "tomato", "cucumber", "carrots", "dressing"],
    requiredIngredients: ["lettuce"],
    optionalIngredients: ["tomato", "cucumber", "carrots", "cheese", "nuts"],
    prepTime: 10,
    difficulty: "easy",
    tags: ["healthy", "light", "vegetarian"],
  },
  {
    id: "pasta-simple",
    name: "Simple Pasta",
    category: "lunch",
    ingredients: ["pasta", "tomato", "cheese", "herbs", "oil"],
    requiredIngredients: ["pasta"],
    optionalIngredients: ["tomato", "cheese", "herbs", "vegetables"],
    prepTime: 15,
    difficulty: "easy",
    tags: ["filling", "vegetarian", "comfort"],
  },

  // Dinner recipes
  {
    id: "stir-fry-vegetable",
    name: "Vegetable Stir Fry",
    category: "dinner",
    ingredients: ["vegetables", "rice", "soy sauce", "oil", "garlic"],
    requiredIngredients: ["vegetables"],
    optionalIngredients: ["rice", "meat", "tofu", "ginger", "sesame"],
    prepTime: 20,
    difficulty: "medium",
    tags: ["healthy", "versatile", "one-pan"],
  },
  {
    id: "chicken-rice",
    name: "Chicken & Rice",
    category: "dinner",
    ingredients: ["chicken", "rice", "vegetables", "broth", "spices"],
    requiredIngredients: ["chicken", "rice"],
    optionalIngredients: ["vegetables", "broth", "herbs"],
    prepTime: 30,
    difficulty: "medium",
    tags: ["protein", "filling", "comfort"],
  },
  {
    id: "soup-vegetable",
    name: "Vegetable Soup",
    category: "dinner",
    ingredients: ["vegetables", "broth", "herbs", "beans"],
    requiredIngredients: ["vegetables"],
    optionalIngredients: ["broth", "beans", "pasta", "meat"],
    prepTime: 25,
    difficulty: "medium",
    tags: ["healthy", "warming", "batch-cook"],
  },

  // Snacks
  {
    id: "fruit-snack",
    name: "Fresh Fruit",
    category: "snack",
    ingredients: ["fruit"],
    requiredIngredients: ["fruit"],
    optionalIngredients: ["nuts", "yogurt", "honey"],
    prepTime: 2,
    difficulty: "easy",
    tags: ["healthy", "quick", "natural"],
  },
  {
    id: "cheese-crackers",
    name: "Cheese & Crackers",
    category: "snack",
    ingredients: ["cheese", "crackers"],
    requiredIngredients: ["cheese"],
    optionalIngredients: ["crackers", "fruit", "nuts"],
    prepTime: 3,
    difficulty: "easy",
    tags: ["protein", "satisfying", "quick"],
  },
];

// Category mapping for food items
const FOOD_CATEGORY_MAP: Record<string, string[]> = {
  // Proteins
  eggs: ["eggs", "egg"],
  meat: ["chicken", "beef", "pork", "turkey", "ham", "bacon"],
  fish: ["fish", "salmon", "tuna", "cod"],
  cheese: ["cheese", "cheddar", "mozzarella", "parmesan"],
  yogurt: ["yogurt", "greek yogurt"],
  milk: ["milk", "dairy"],
  tofu: ["tofu", "tempeh"],
  beans: ["beans", "lentils", "chickpeas"],

  // Vegetables
  vegetables: [
    "lettuce",
    "spinach",
    "kale",
    "broccoli",
    "carrots",
    "tomato",
    "cucumber",
    "bell pepper",
    "onion",
    "garlic",
    "mushroom",
  ],
  lettuce: ["lettuce", "greens", "spinach", "arugula"],
  tomato: ["tomato", "tomatoes"],
  carrots: ["carrots", "carrot"],
  cucumber: ["cucumber"],

  // Fruits
  fruit: [
    "apple",
    "banana",
    "orange",
    "berry",
    "strawberry",
    "blueberry",
    "grape",
    "avocado",
  ],
  avocado: ["avocado"],

  // Grains & Starches
  bread: ["bread", "toast", "baguette", "rolls"],
  pasta: ["pasta", "noodles", "spaghetti", "macaroni"],
  rice: ["rice", "brown rice", "wild rice"],

  // Pantry
  oil: ["oil", "olive oil", "vegetable oil"],
  herbs: ["herbs", "basil", "parsley", "cilantro", "oregano"],
  spices: ["spices", "salt", "pepper", "paprika"],
  nuts: ["nuts", "almonds", "walnuts", "peanuts"],
  honey: ["honey", "maple syrup"],
  butter: ["butter", "margarine"],
};

/**
 * Normalizes food item names for recipe matching
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks if a food item matches a recipe ingredient
 */
function matchesIngredient(
  foodItem: FoodItemWithUrgency,
  ingredient: string
): boolean {
  const foodName = normalizeIngredientName(foodItem.name);
  const ingredientName = normalizeIngredientName(ingredient);

  // Direct name match
  if (foodName.includes(ingredientName) || ingredientName.includes(foodName)) {
    return true;
  }

  // Category-based matching
  const categories = FOOD_CATEGORY_MAP[ingredientName] || [];
  return categories.some((category) =>
    foodName.includes(normalizeIngredientName(category))
  );
}

/**
 * Calculates urgency score for a meal opportunity
 */
function calculateUrgencyScore(ingredients: FoodItemWithUrgency[]): number {
  if (ingredients.length === 0) return 0;

  const totalUrgency = ingredients.reduce((sum, item) => {
    switch (item.urgency.level) {
      case "critical":
        return sum + 4;
      case "warning":
        return sum + 3;
      case "soon":
        return sum + 2;
      case "safe":
        return sum + 1;
      default:
        return sum;
    }
  }, 0);

  return Math.round((totalUrgency / ingredients.length) * 25); // Scale to 0-100
}

/**
 * Calculates nutrition score based on ingredient diversity
 */
function calculateNutritionScore(ingredients: FoodItemWithUrgency[]): number {
  const categories = new Set<string>();

  ingredients.forEach((item) => {
    const normalizedName = normalizeIngredientName(item.name);
    Object.entries(FOOD_CATEGORY_MAP).forEach(([category, variations]) => {
      if (variations.some((variation) => normalizedName.includes(variation))) {
        categories.add(category);
      }
    });
  });

  // Score based on nutritional diversity
  const proteinCategories = [
    "eggs",
    "meat",
    "fish",
    "cheese",
    "yogurt",
    "tofu",
    "beans",
  ];
  const vegetableCategories = ["vegetables", "lettuce", "tomato", "carrots"];
  const fruitCategories = ["fruit", "avocado"];
  const grainCategories = ["bread", "pasta", "rice"];

  let score = 0;
  if (proteinCategories.some((cat) => categories.has(cat))) score += 25;
  if (vegetableCategories.some((cat) => categories.has(cat))) score += 25;
  if (fruitCategories.some((cat) => categories.has(cat))) score += 20;
  if (grainCategories.some((cat) => categories.has(cat))) score += 20;
  if (categories.has("herbs") || categories.has("spices")) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculates waste reduction percentage
 */
function calculateWasteReduction(
  ingredients: FoodItemWithUrgency[],
  allItems: FoodItemWithUrgency[]
): number {
  const criticalAndWarningItems = allItems.filter(
    (item) =>
      item.urgency.level === "critical" || item.urgency.level === "warning"
  );

  if (criticalAndWarningItems.length === 0) return 0;

  const usedCriticalItems = ingredients.filter(
    (item) =>
      item.urgency.level === "critical" || item.urgency.level === "warning"
  );

  return Math.round(
    (usedCriticalItems.length / criticalAndWarningItems.length) * 100
  );
}

/**
 * Matches food items to recipe templates
 */
function matchRecipe(
  recipe: RecipeTemplate,
  availableItems: FoodItemWithUrgency[]
): {
  matchedIngredients: FoodItemWithUrgency[];
  matchScore: number;
  hasRequired: boolean;
} {
  const matchedIngredients: FoodItemWithUrgency[] = [];
  let requiredMatches = 0;
  let totalMatches = 0;

  // Check required ingredients
  recipe.requiredIngredients.forEach((ingredient) => {
    const matchedItem = availableItems.find((item) =>
      matchesIngredient(item, ingredient)
    );
    if (matchedItem) {
      matchedIngredients.push(matchedItem);
      requiredMatches++;
      totalMatches++;
    }
  });

  // Check optional ingredients
  recipe.optionalIngredients.forEach((ingredient) => {
    const matchedItem = availableItems.find(
      (item) =>
        matchesIngredient(item, ingredient) &&
        !matchedIngredients.includes(item)
    );
    if (matchedItem) {
      matchedIngredients.push(matchedItem);
      totalMatches++;
    }
  });

  const hasRequired = requiredMatches === recipe.requiredIngredients.length;
  const totalPossibleMatches =
    recipe.requiredIngredients.length + recipe.optionalIngredients.length;
  const matchScore =
    totalPossibleMatches > 0 ? (totalMatches / totalPossibleMatches) * 100 : 0;

  return { matchedIngredients, matchScore, hasRequired };
}

/**
 * Generates meal opportunities from available food items
 */
export function generateMealOpportunities(
  items: FoodItemWithUrgency[]
): MealOpportunity[] {
  const opportunities: MealOpportunity[] = [];

  RECIPE_TEMPLATES.forEach((recipe) => {
    const { matchedIngredients, matchScore, hasRequired } = matchRecipe(
      recipe,
      items
    );

    // Only create opportunity if we have required ingredients and decent match
    if (hasRequired && matchScore >= 30) {
      const urgencyScore = calculateUrgencyScore(matchedIngredients);
      const nutritionScore = calculateNutritionScore(matchedIngredients);
      const wasteReduction = calculateWasteReduction(matchedIngredients, items);

      opportunities.push({
        id: `${recipe.id}-${Date.now()}`,
        type: recipe.category as MealOpportunity["type"],
        title: recipe.name,
        description: `Use ${matchedIngredients.length} available ingredient${
          matchedIngredients.length !== 1 ? "s" : ""
        }`,
        ingredients: matchedIngredients,
        urgencyScore,
        estimatedPrepTime: recipe.prepTime,
        difficulty: recipe.difficulty,
        tags: [...recipe.tags],
        nutritionScore,
        wasteReduction,
      });
    }
  });

  // Sort by urgency score (prioritize expiring items) and match quality
  return opportunities.sort((a, b) => {
    const urgencyDiff = b.urgencyScore - a.urgencyScore;
    if (Math.abs(urgencyDiff) > 10) return urgencyDiff;
    return b.wasteReduction - a.wasteReduction;
  });
}

/**
 * Analyzes meal planning opportunities and provides recommendations
 */
export function analyzeMealPlanning(
  items: FoodItemWithUrgency[]
): MealPlanningAnalysis {
  const opportunities = generateMealOpportunities(items);

  // Calculate coverage
  const usedItems = new Set<string>();
  opportunities.forEach((opp) => {
    opp.ingredients.forEach((item) => usedItems.add(item.id));
  });

  const criticalItems = items.filter(
    (item) => item.urgency.level === "critical"
  );
  const warningItems = items.filter((item) => item.urgency.level === "warning");
  const totalUrgentItems = criticalItems.length + warningItems.length;

  const coverage = {
    total: items.length,
    used: usedItems.size,
    critical: criticalItems.length,
    warning: warningItems.length,
    percentage:
      items.length > 0 ? Math.round((usedItems.size / items.length) * 100) : 0,
  };

  // Generate recommendations
  const recommendations = {
    priority: opportunities.filter((opp) => opp.urgencyScore >= 75).slice(0, 3),
    quick: opportunities
      .filter((opp) => opp.estimatedPrepTime <= 15)
      .slice(0, 3),
    nutritious: opportunities
      .filter((opp) => opp.nutritionScore >= 70)
      .slice(0, 3),
  };

  // Find unused critical items
  const unusedCritical = criticalItems.filter(
    (item) => !usedItems.has(item.id)
  );

  return {
    opportunities,
    coverage,
    recommendations,
    unusedCritical,
  };
}

/**
 * Gets meal suggestions for a specific meal type
 */
export function getMealSuggestions(
  items: FoodItemWithUrgency[],
  mealType: MealOpportunity["type"]
): MealOpportunity[] {
  const allOpportunities = generateMealOpportunities(items);
  return allOpportunities.filter((opp) => opp.type === mealType).slice(0, 5);
}

/**
 * Formats meal planning insights for display
 */
export function formatMealPlanningInsights(analysis: MealPlanningAnalysis): {
  summary: string;
  highlights: string[];
  alerts: string[];
} {
  const { coverage, recommendations, unusedCritical } = analysis;

  const summary = `${coverage.used}/${coverage.total} items can be used in ${
    analysis.opportunities.length
  } meal${analysis.opportunities.length !== 1 ? "s" : ""} (${
    coverage.percentage
  }% coverage)`;

  const highlights: string[] = [];
  if (recommendations.priority.length > 0) {
    highlights.push(
      `${recommendations.priority.length} high-priority meal${
        recommendations.priority.length !== 1 ? "s" : ""
      } available`
    );
  }
  if (recommendations.quick.length > 0) {
    highlights.push(
      `${recommendations.quick.length} quick meal${
        recommendations.quick.length !== 1 ? "s" : ""
      } (≤15 min)`
    );
  }
  if (coverage.percentage >= 80) {
    highlights.push("Excellent ingredient utilization");
  }

  const alerts: string[] = [];
  if (unusedCritical.length > 0) {
    alerts.push(
      `${unusedCritical.length} critical item${
        unusedCritical.length !== 1 ? "s" : ""
      } not used in any meal`
    );
  }
  if (coverage.percentage < 50) {
    alerts.push("Low ingredient utilization - consider more versatile recipes");
  }
  if (recommendations.priority.length === 0 && coverage.critical > 0) {
    alerts.push("No priority meals found for expiring items");
  }

  return { summary, highlights, alerts };
}
