// services/foodItems.ts
import { FoodItem, supabase, UsageLog } from "@/lib/supabase";
import {
  addUrgencyToItem,
  addUrgencyToItems,
  UrgencyInfo,
} from "@/utils/urgencyUtils";

export type FoodItemWithUrgency = FoodItem & { urgency: UrgencyInfo };

export const foodItemsService = {
  // Get all food items for the current user
  async getItems(
    location?: "fridge" | "shelf"
  ): Promise<FoodItemWithUrgency[]> {
    let query = supabase
      .from("food_items")
      .select("*")
      .order("expiry_date", { ascending: true });

    if (location) {
      query = query.eq("location", location);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Add urgency information to each item
    return addUrgencyToItems(data as FoodItem[]);
  },

  // Get items expiring soon
  async getExpiringItems(
    daysAhead: number = 7
  ): Promise<FoodItemWithUrgency[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .gte("expiry_date", today.toISOString().split("T")[0])
      .lte("expiry_date", futureDate.toISOString().split("T")[0])
      .order("expiry_date", { ascending: true });

    if (error) throw error;

    // Add urgency information to each item
    return addUrgencyToItems(data as FoodItem[]);
  },

  // Get expired items
  async getExpiredItems(): Promise<FoodItemWithUrgency[]> {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .lt("expiry_date", today)
      .order("expiry_date", { ascending: true });

    if (error) throw error;

    // Add urgency information to each item
    return addUrgencyToItems(data as FoodItem[]);
  },

  // Get items grouped by expiry date for calendar view
  async getItemsByExpiryDate(
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, FoodItemWithUrgency[]>> {
    let query = supabase
      .from("food_items")
      .select("*")
      .not("expiry_date", "is", null);

    if (startDate) {
      query = query.gte("expiry_date", startDate);
    }

    if (endDate) {
      query = query.lte("expiry_date", endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group items by expiry date and add urgency information
    const itemsByDate: Record<string, FoodItemWithUrgency[]> = {};
    (data as FoodItem[]).forEach((item) => {
      if (item.expiry_date) {
        if (!itemsByDate[item.expiry_date]) {
          itemsByDate[item.expiry_date] = [];
        }
        // Add urgency information to the item
        itemsByDate[item.expiry_date].push(addUrgencyToItem(item));
      }
    });

    return itemsByDate;
  },

  // Add a new food item
  async addItem(
    item: Omit<FoodItem, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<FoodItemWithUrgency> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("food_items")
      .insert({
        ...item,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add urgency information to the returned item
    return addUrgencyToItem(data as FoodItem);
  },

  // Update a food item
  async updateItem(
    id: string,
    updates: Partial<FoodItem>
  ): Promise<FoodItemWithUrgency> {
    const { data, error } = await supabase
      .from("food_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Add urgency information to the returned item
    return addUrgencyToItem(data as FoodItem);
  },

  // Delete a food item
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from("food_items").delete().eq("id", id);

    if (error) throw error;
  },

  // Log item usage
  async logUsage(
    itemId: string,
    status: "used" | "expired" | "wasted",
    quantity: number
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("User not authenticated");

    // First, get the current item
    const { data: item, error: itemError } = await supabase
      .from("food_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError) throw itemError;

    // Log the usage
    const { error: logError } = await supabase.from("usage_logs").insert({
      item_id: itemId,
      user_id: userData.user.id,
      status,
      quantity,
    });

    if (logError) throw logError;

    // Update or delete the item based on remaining quantity
    const remainingQuantity = (item as FoodItem).quantity - quantity;

    if (remainingQuantity <= 0) {
      await this.deleteItem(itemId);
    } else {
      await this.updateItem(itemId, { quantity: remainingQuantity });
    }
  },

  // Get usage statistics
  async getUsageStats(startDate?: Date, endDate?: Date) {
    let query = supabase.from("usage_logs").select("*");

    if (startDate) {
      query = query.gte("logged_at", startDate.toISOString());
    }
    if (endDate) {
      query = query.lte("logged_at", endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = data as UsageLog[];

    // Calculate statistics
    const stats = {
      totalUsed: logs.filter((log) => log.status === "used").length,
      totalExpired: logs.filter((log) => log.status === "expired").length,
      totalWasted: logs.filter((log) => log.status === "wasted").length,
      wastePercentage: 0,
    };

    const total = stats.totalUsed + stats.totalExpired + stats.totalWasted;
    if (total > 0) {
      stats.wastePercentage =
        ((stats.totalExpired + stats.totalWasted) / total) * 100;
    }

    return stats;
  },

  // Search items
  async searchItems(query: string): Promise<FoodItemWithUrgency[]> {
    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name");

    if (error) throw error;

    // Add urgency information to each item
    return addUrgencyToItems(data as FoodItem[]);
  },
};
