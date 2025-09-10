const fs = require("fs");
const path = require("path");
const https = require("https");
const { exec } = require("child_process");

// Create directory if it doesn't exist
const iconDir = path.join(__dirname, "../assets/images/realistic-food-icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// List of food icons to download with their URLs and filenames
const foodIcons = [
  // Meat and protein
  {
    url: "https://cdn-icons-png.flaticon.com/512/2713/2713564.png",
    filename: "beef.png",
    category: "beef",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/1046/1046769.png",
    filename: "chicken.png",
    category: "chicken",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    filename: "fish.png",
    category: "fish",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2965/2965567.png",
    filename: "eggs.png",
    category: "eggs",
  },

  // Dairy
  {
    url: "https://cdn-icons-png.flaticon.com/512/3050/3050158.png",
    filename: "milk.png",
    category: "milk",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/517/517561.png",
    filename: "cheese.png",
    category: "cheese",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2272/2272046.png",
    filename: "yogurt.png",
    category: "yogurt",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
    filename: "butter.png",
    category: "butter",
  },

  // Produce
  {
    url: "https://cdn-icons-png.flaticon.com/512/1147/1147832.png",
    filename: "vegetables.png",
    category: "vegetables",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/3823/3823393.png",
    filename: "fruits.png",
    category: "fruits",
  },

  // Shelf items
  {
    url: "https://cdn-icons-png.flaticon.com/512/3014/3014438.png",
    filename: "bread.png",
    category: "bread",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2836/2836607.png",
    filename: "pasta.png",
    category: "pasta",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2497/2497911.png",
    filename: "rice.png",
    category: "rice",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2553/2553651.png",
    filename: "cereal.png",
    category: "cereal",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2674/2674486.png",
    filename: "canned.png",
    category: "canned",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png",
    filename: "snacks.png",
    category: "snacks",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/992/992751.png",
    filename: "flour.png",
    category: "flour",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2674/2674492.png",
    filename: "sugar.png",
    category: "sugar",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2674/2674477.png",
    filename: "oil.png",
    category: "oil",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2674/2674478.png",
    filename: "spices.png",
    category: "spices",
  },
  {
    url: "https://cdn-icons-png.flaticon.com/512/2674/2674477.png",
    filename: "leftovers.png",
    category: "leftovers",
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
async function downloadAllIcons() {
  for (const icon of foodIcons) {
    try {
      await downloadFile(icon.url, icon.filename);
    } catch (error) {
      console.error(`Error downloading ${icon.filename}:`, error);
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
  | "fruits"
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

  foodIcons.forEach((icon) => {
    mappingContent += `  ${icon.category}: require("../assets/images/realistic-food-icons/${icon.filename}"),\n`;
  });

  mappingContent += `};

/**
 * Determines the appropriate food image category based on the food item name
 * @param itemName The name of the food item
 * @returns The appropriate food image category
 */
export function getFoodImageCategory(itemName: string): FoodImageCategory {
  const name = itemName.toLowerCase();

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
    name.includes("carrot") ||
    name.includes("broccoli") ||
    name.includes("lettuce") ||
    name.includes("tomato") ||
    name.includes("onion") ||
    name.includes("potato") ||
    name.includes("pepper")
  ) {
    return "vegetables";
  }
  if (
    name.includes("fruit") ||
    name.includes("apple") ||
    name.includes("banana") ||
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
downloadAllIcons();
