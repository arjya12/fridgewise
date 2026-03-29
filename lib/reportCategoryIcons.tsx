/**
 * Reports use the same category → icon rules as the rest of the app.
 */
import {
  getFoodCategoryIcon,
  type CategoryIconComponent,
} from "@/lib/foodCategories";

export type { CategoryIconComponent };

export function getReportCategoryIcon(
  category?: string | null,
  name?: string | null
): CategoryIconComponent {
  return getFoodCategoryIcon(category, name);
}
