# Realistic Food Icons

This directory contains high-quality realistic food icons for the FridgeWise app. These icons are used to represent different food categories in the app's UI.

## Icon Categories

The icons are organized by food category:

- **Meat & Protein**

  - beef.png
  - chicken.png
  - fish.png
  - eggs.png

- **Dairy**

  - milk.png
  - cheese.png
  - yogurt.png
  - butter.png

- **Produce**

  - vegetables.png
  - carrots.png
  - tomato.png
  - fruits.png
  - apple.png
  - banana.png

- **Shelf Items**
  - bread.png
  - pasta.png
  - rice.png
  - cereal.png
  - canned.png
  - snacks.png
  - flour.png
  - sugar.png
  - oil.png
  - spices.png
  - leftovers.png

## Usage

These icons are used by the `RealisticFoodImage` component, which selects the appropriate icon based on the food item name. The mapping between food names and icons is defined in `utils/foodImageMapping.ts`.

## Attribution

The icons used in this project are from [Flaticon](https://www.flaticon.com/), a free icon repository. When using these icons in a production environment, please ensure proper attribution according to the license requirements.

## Adding New Icons

To add new icons:

1. Download the icon in PNG format
2. Add it to this directory
3. Update the `foodImagePaths` mapping in `utils/foodImageMapping.ts`
4. Update the `getFoodImageCategory` function to recognize the new food category
5. Update the `getBackgroundColor` function in `RealisticFoodImage.tsx` to assign an appropriate background color
