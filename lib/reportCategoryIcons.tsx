/**
 * Reports use the same category → icon rules as the rest of the app.
 */
import type { Icon } from "phosphor-react-native";
import { getFoodCategoryIcon } from "@/lib/foodCategories";

export type CategoryIconComponent = Icon;

export function getReportCategoryIcon(
  category?: string | null,
  name?: string | null
): CategoryIconComponent {
  return getFoodCategoryIcon(category, name);
}
