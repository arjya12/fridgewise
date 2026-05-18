import { FoodItem } from "../../../lib/supabase";

export function generateTestData(count: number): FoodItem[] {
  return Array.from({ length: count }, (_, index) => {
    const day = String(1 + (index % 28)).padStart(2, "0");

    return {
      id: `test-item-${index}`,
      name: `Test Item ${index}`,
      quantity: 1 + (index % 5),
      expiry_date: `2024-01-${day}`,
      location: index % 2 === 0 ? "fridge" : "shelf",
      category: "test",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      user_id: "test-user",
    };
  });
}
