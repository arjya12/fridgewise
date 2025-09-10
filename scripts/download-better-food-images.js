const fs = require("fs");
const path = require("path");
const https = require("https");

// Create directory if it doesn't exist
const iconDir = path.join(__dirname, "../assets/images/realistic-food-icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// List of high-quality food images to download
const foodImages = [
  // Meat & Protein
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075929.png",
    filename: "beef.png",
    category: "beef",
    description: "High-quality beef steak image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075931.png",
    filename: "chicken.png",
    category: "chicken",
    description: "Realistic chicken image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    filename: "fish.png",
    category: "fish",
    description: "Detailed fish image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075935.png",
    filename: "eggs.png",
    category: "eggs",
    description: "Realistic eggs image",
  },

  // Dairy
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075926.png",
    filename: "milk.png",
    category: "milk",
    description: "Milk bottle image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075928.png",
    filename: "cheese.png",
    category: "cheese",
    description: "Cheese wheel image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075975.png",
    filename: "yogurt.png",
    category: "yogurt",
    description: "Yogurt cup image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075927.png",
    filename: "butter.png",
    category: "butter",
    description: "Butter stick image",
  },

  // Produce
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075930.png",
    filename: "vegetables.png",
    category: "vegetables",
    description: "Mixed vegetables image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075936.png",
    filename: "carrots.png",
    category: "carrots",
    description: "Realistic carrot image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075932.png",
    filename: "tomato.png",
    category: "tomato",
    description: "Tomato image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075933.png",
    filename: "fruits.png",
    category: "fruits",
    description: "Mixed fruits image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075937.png",
    filename: "apple.png",
    category: "apple",
    description: "Red apple image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075938.png",
    filename: "banana.png",
    category: "banana",
    description: "Banana image",
  },

  // Shelf items
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075925.png",
    filename: "bread.png",
    category: "bread",
    description: "Loaf of bread image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075934.png",
    filename: "pasta.png",
    category: "pasta",
    description: "Pasta image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082054.png",
    filename: "rice.png",
    category: "rice",
    description: "Rice grains image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082060.png",
    filename: "cereal.png",
    category: "cereal",
    description: "Cereal bowl image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082049.png",
    filename: "canned.png",
    category: "canned",
    description: "Canned food image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082044.png",
    filename: "snacks.png",
    category: "snacks",
    description: "Snack chips image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082058.png",
    filename: "flour.png",
    category: "flour",
    description: "Flour bag image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082037.png",
    filename: "sugar.png",
    category: "sugar",
    description: "Sugar image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082048.png",
    filename: "oil.png",
    category: "oil",
    description: "Cooking oil image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082052.png",
    filename: "spices.png",
    category: "spices",
    description: "Spice jar image",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3082/3082059.png",
    filename: "leftovers.png",
    category: "leftovers",
    description: "Leftover food container image",
  },
];

// Function to download a file
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(iconDir, filename);
    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`Downloaded: ${filename}`);
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(filePath, () => {}); // Delete the file if there was an error
          reject(err);
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
  });
}

// Download all icons
async function downloadAllImages() {
  for (const image of foodImages) {
    try {
      await downloadFile(image.url, image.filename);
    } catch (error) {
      console.error(`Error downloading ${image.filename}:`, error);
    }
  }

  console.log("All downloads completed!");

  // Generate the mapping file
  generateMappingFile();
}

// Generate the mapping file
function generateMappingFile() {
  let mappingContent = `// Auto-generated file mapping food categories to image files
import { ImageSourcePropType } from "react-native";

// Define the categories and their corresponding image paths
export type FoodImageCategory =
  // Fridge items
  | "beef"
  | "chicken"
  | "fish"
  | "milk"
  | "cheese"
  | "yogurt"
  | "eggs"
  | "butter"
  | "vegetables"
  | "carrots"
  | "tomato"
  | "fruits"
  | "apple"
  | "banana"
  | "leftovers"
  // Shelf items
  | "bread"
  | "pasta"
  | "rice"
  | "cereal"
  | "canned"
  | "snacks"
  | "flour"
  | "sugar"
  | "oil"
  | "spices";

// Map of food categories to their image paths
export const foodImagePaths: Record<FoodImageCategory, ImageSourcePropType> = {
`;

  foodImages.forEach((image) => {
    mappingContent += `  ${image.category}: require("../assets/images/realistic-food-icons/${image.filename}"),\n`;
  });

  mappingContent += `};

/**
 * Determines the appropriate food image category based on the food item name
 * @param itemName The name of the food item
 * @returns The appropriate food image category
 */
export function getFoodImageCategory(itemName: string): FoodImageCategory {
  const name = itemName.toLowerCase();

  // Specific vegetables
  if (
    name.includes("carrot") ||
    name.includes("carrots")
  ) {
    return "carrots";
  }
  if (
    name.includes("tomato") ||
    name.includes("tomatoes")
  ) {
    return "tomato";
  }
  
  // Specific fruits
  if (
    name.includes("apple") ||
    name.includes("apples")
  ) {
    return "apple";
  }
  if (
    name.includes("banana") ||
    name.includes("bananas")
  ) {
    return "banana";
  }

  // Meat products
  if (name.includes("beef") || name.includes("steak")) {
    return "beef";
  }
  if (name.includes("chicken") || name.includes("turkey")) {
    return "chicken";
  }
  if (
    name.includes("fish") ||
    name.includes("seafood") ||
    name.includes("shrimp")
  ) {
    return "fish";
  }

  // Dairy products
  if (name.includes("milk")) {
    return "milk";
  }
  if (name.includes("cheese")) {
    return "cheese";
  }
  if (name.includes("yogurt")) {
    return "yogurt";
  }
  if (name.includes("egg")) {
    return "eggs";
  }
  if (name.includes("butter") || name.includes("margarine")) {
    return "butter";
  }

  // Produce
  if (
    name.includes("vegetable") ||
    name.includes("broccoli") ||
    name.includes("lettuce") ||
    name.includes("onion") ||
    name.includes("potato") ||
    name.includes("pepper")
  ) {
    return "vegetables";
  }
  if (
    name.includes("fruit") ||
    name.includes("orange") ||
    name.includes("berry") ||
    name.includes("grape")
  ) {
    return "fruits";
  }

  // Shelf items
  if (
    name.includes("bread") ||
    name.includes("toast") ||
    name.includes("bun")
  ) {
    return "bread";
  }
  if (
    name.includes("pasta") ||
    name.includes("noodle") ||
    name.includes("spaghetti")
  ) {
    return "pasta";
  }
  if (name.includes("rice") || name.includes("grain")) {
    return "rice";
  }
  if (
    name.includes("cereal") ||
    name.includes("oat") ||
    name.includes("granola")
  ) {
    return "cereal";
  }
  if (name.includes("can") || name.includes("canned") || name.includes("tin")) {
    return "canned";
  }
  if (
    name.includes("snack") ||
    name.includes("chip") ||
    name.includes("cracker") ||
    name.includes("cookie") ||
    name.includes("nut")
  ) {
    return "snacks";
  }
  if (name.includes("flour")) {
    return "flour";
  }
  if (name.includes("sugar")) {
    return "sugar";
  }
  if (name.includes("oil")) {
    return "oil";
  }
  if (
    name.includes("spice") ||
    name.includes("herb") ||
    name.includes("salt") ||
    name.includes("pepper")
  ) {
    return "spices";
  }

  // Default based on location
  if (name.includes("leftover")) {
    return "leftovers";
  }

  // Default to vegetables for fridge items and canned for shelf items
  return "vegetables";
}

/**
 * Gets the image path for a food item based on its name
 * @param itemName The name of the food item
 * @returns The path to the appropriate food image
 */
export function getFoodImagePath(itemName: string): ImageSourcePropType {
  const category = getFoodImageCategory(itemName);
  return foodImagePaths[category];
}
`;

  fs.writeFileSync(
    path.join(__dirname, "../utils/foodImageMapping.ts"),
    mappingContent
  );
  console.log("Generated mapping file: utils/foodImageMapping.ts");
}

// Run the download
downloadAllImages();
