// services/offlineStorageService.ts
import { FoodItemWithUrgency } from "@/services/foodItems";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export interface OfflineAction {
  id: string;
  type: "create" | "update" | "delete" | "usage";
  tableName: string;
  data: any;
  localTimestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingActions: number;
  failedActions: number;
  syncInProgress: boolean;
}

class OfflineStorageService {
  private readonly STORAGE_KEYS = {
    FOOD_ITEMS: "offline_food_items",
    PENDING_ACTIONS: "offline_pending_actions",
    FAILED_ACTIONS: "offline_failed_actions",
    LAST_SYNC: "offline_last_sync",
    CACHE_VERSION: "offline_cache_version",
    USER_SETTINGS: "offline_user_settings",
  };

  private readonly CACHE_DURATION = {
    FOOD_ITEMS: 24 * 60 * 60 * 1000, // 24 hours
    USER_SETTINGS: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  private isOnline = true;
  private syncInProgress = false;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;

      if (wasOffline && this.isOnline) {
        // Just came back online, trigger sync
        this.syncPendingActions();
      }
    });
  }

  /**
   * Cache food items data
   */
  async cacheFoodItems(items: FoodItemWithUrgency[]): Promise<void> {
    try {
      const cacheEntry: CacheEntry<FoodItemWithUrgency[]> = {
        data: items,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION.FOOD_ITEMS,
        version: await this.getCacheVersion(),
      };

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.FOOD_ITEMS,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error("Failed to cache food items:", error);
    }
  }

  /**
   * Get cached food items
   */
  async getCachedFoodItems(): Promise<FoodItemWithUrgency[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEYS.FOOD_ITEMS);

      if (!cached) return null;

      const cacheEntry: CacheEntry<FoodItemWithUrgency[]> = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() > cacheEntry.expiresAt) {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.FOOD_ITEMS);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error("Failed to get cached food items:", error);
      return null;
    }
  }

  /**
   * Queue an offline action for later sync
   */
  async queueOfflineAction(
    action: Omit<OfflineAction, "id" | "localTimestamp" | "retryCount">
  ): Promise<string> {
    const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const offlineAction: OfflineAction = {
      ...action,
      id: actionId,
      localTimestamp: Date.now(),
      retryCount: 0,
    };

    try {
      const existingActions = await this.getPendingActions();
      existingActions.push(offlineAction);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_ACTIONS,
        JSON.stringify(existingActions)
      );

      // If we're online, try to sync immediately
      if (this.isOnline) {
        this.syncSingleAction(offlineAction);
      }

      return actionId;
    } catch (error) {
      console.error("Failed to queue offline action:", error);
      throw error;
    }
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem(
        this.STORAGE_KEYS.PENDING_ACTIONS
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get pending actions:", error);
      return [];
    }
  }

  /**
   * Get failed actions that need user attention
   */
  async getFailedActions(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem(
        this.STORAGE_KEYS.FAILED_ACTIONS
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get failed actions:", error);
      return [];
    }
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const pendingActions = await this.getPendingActions();

      if (pendingActions.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`Syncing ${pendingActions.length} pending actions...`);

      // Process actions in order (FIFO)
      const results = await Promise.allSettled(
        pendingActions.map((action) => this.syncSingleAction(action))
      );

      // Handle results
      const successful: string[] = [];
      const failed: OfflineAction[] = [];

      results.forEach((result, index) => {
        const action = pendingActions[index];

        if (result.status === "fulfilled") {
          successful.push(action.id);
        } else {
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            failed.push(action);
          } else {
            // Schedule retry with exponential backoff
            this.scheduleRetry(action);
          }
        }
      });

      // Update storage
      await this.updatePendingActions(successful, failed);
      await this.updateLastSyncTime();

      console.log(
        `Sync completed: ${successful.length} successful, ${failed.length} failed`
      );
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single action
   */
  private async syncSingleAction(action: OfflineAction): Promise<void> {
    // This would integrate with your actual API service
    // For now, we'll simulate the sync process

    switch (action.type) {
      case "create":
        await this.syncCreateAction(action);
        break;
      case "update":
        await this.syncUpdateAction(action);
        break;
      case "delete":
        await this.syncDeleteAction(action);
        break;
      case "usage":
        await this.syncUsageAction(action);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async syncCreateAction(action: OfflineAction): Promise<void> {
    // Simulate API call to create item
    if (action.tableName === "food_items") {
      // In real implementation, this would call foodItemsService.addItem()
      // For now, simulate potential network failure
      if (Math.random() < 0.1) {
        // 10% failure rate
        throw new Error("Network error during create");
      }
    }
  }

  private async syncUpdateAction(action: OfflineAction): Promise<void> {
    // Simulate API call to update item
    if (action.tableName === "food_items") {
      // In real implementation, this would call foodItemsService.updateItem()
      if (Math.random() < 0.05) {
        // 5% failure rate
        throw new Error("Network error during update");
      }
    }
  }

  private async syncDeleteAction(action: OfflineAction): Promise<void> {
    // Simulate API call to delete item
    if (action.tableName === "food_items") {
      // In real implementation, this would call foodItemsService.deleteItem()
      if (Math.random() < 0.03) {
        // 3% failure rate
        throw new Error("Network error during delete");
      }
    }
  }

  private async syncUsageAction(action: OfflineAction): Promise<void> {
    // Simulate API call to log usage
    if (action.tableName === "food_items") {
      // In real implementation, this would call foodItemsService.logUsage()
      if (Math.random() < 0.02) {
        // 2% failure rate
        throw new Error("Network error during usage log");
      }
    }
  }

  /**
   * Schedule retry for failed action with exponential backoff
   */
  private scheduleRetry(action: OfflineAction): void {
    const delay = Math.min(1000 * Math.pow(2, action.retryCount), 30000); // Max 30 seconds

    const timeoutId = setTimeout(() => {
      this.syncSingleAction(action).catch((error) => {
        console.error(`Retry failed for action ${action.id}:`, error);
        action.retryCount++;

        if (action.retryCount < action.maxRetries) {
          this.scheduleRetry(action);
        } else {
          this.moveToFailedActions(action);
        }
      });
    }, delay) as unknown as NodeJS.Timeout;

    this.retryTimeouts.set(action.id, timeoutId);
  }

  /**
   * Move action to failed actions list
   */
  private async moveToFailedActions(action: OfflineAction): Promise<void> {
    try {
      const failedActions = await this.getFailedActions();
      failedActions.push(action);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.FAILED_ACTIONS,
        JSON.stringify(failedActions)
      );

      // Remove from pending actions
      const pendingActions = await this.getPendingActions();
      const updatedPending = pendingActions.filter((a) => a.id !== action.id);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_ACTIONS,
        JSON.stringify(updatedPending)
      );
    } catch (error) {
      console.error("Failed to move action to failed list:", error);
    }
  }

  /**
   * Update pending actions after sync
   */
  private async updatePendingActions(
    successfulIds: string[],
    failedActions: OfflineAction[]
  ): Promise<void> {
    try {
      const pendingActions = await this.getPendingActions();
      const remainingActions = pendingActions.filter(
        (action) =>
          !successfulIds.includes(action.id) &&
          action.retryCount < action.maxRetries
      );

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_ACTIONS,
        JSON.stringify(remainingActions)
      );

      // Update failed actions
      if (failedActions.length > 0) {
        const existingFailed = await this.getFailedActions();
        const allFailed = [...existingFailed, ...failedActions];

        await AsyncStorage.setItem(
          this.STORAGE_KEYS.FAILED_ACTIONS,
          JSON.stringify(allFailed)
        );
      }
    } catch (error) {
      console.error("Failed to update pending actions:", error);
    }
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );
    } catch (error) {
      console.error("Failed to update last sync time:", error);
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const [pendingActions, failedActions, lastSyncStr] = await Promise.all([
        this.getPendingActions(),
        this.getFailedActions(),
        AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC),
      ]);

      return {
        isOnline: this.isOnline,
        lastSyncTime: lastSyncStr ? parseInt(lastSyncStr) : 0,
        pendingActions: pendingActions.length,
        failedActions: failedActions.length,
        syncInProgress: this.syncInProgress,
      };
    } catch (error) {
      console.error("Failed to get sync status:", error);
      return {
        isOnline: this.isOnline,
        lastSyncTime: 0,
        pendingActions: 0,
        failedActions: 0,
        syncInProgress: false,
      };
    }
  }

  /**
   * Force sync (manual trigger)
   */
  async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    await this.syncPendingActions();
  }

  /**
   * Clear all failed actions (after user review)
   */
  async clearFailedActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.FAILED_ACTIONS);
    } catch (error) {
      console.error("Failed to clear failed actions:", error);
    }
  }

  /**
   * Retry specific failed action
   */
  async retryFailedAction(actionId: string): Promise<void> {
    try {
      const failedActions = await this.getFailedActions();
      const action = failedActions.find((a) => a.id === actionId);

      if (!action) {
        throw new Error("Failed action not found");
      }

      // Reset retry count and move back to pending
      action.retryCount = 0;

      const pendingActions = await this.getPendingActions();
      pendingActions.push(action);

      const remainingFailed = failedActions.filter((a) => a.id !== actionId);

      await Promise.all([
        AsyncStorage.setItem(
          this.STORAGE_KEYS.PENDING_ACTIONS,
          JSON.stringify(pendingActions)
        ),
        AsyncStorage.setItem(
          this.STORAGE_KEYS.FAILED_ACTIONS,
          JSON.stringify(remainingFailed)
        ),
      ]);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.syncSingleAction(action);
      }
    } catch (error) {
      console.error("Failed to retry action:", error);
      throw error;
    }
  }

  /**
   * Get cache version for invalidation
   */
  private async getCacheVersion(): Promise<number> {
    try {
      const version = await AsyncStorage.getItem(
        this.STORAGE_KEYS.CACHE_VERSION
      );
      return version ? parseInt(version) : 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Increment cache version (invalidates all cached data)
   */
  async invalidateCache(): Promise<void> {
    try {
      const currentVersion = await this.getCacheVersion();
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CACHE_VERSION,
        (currentVersion + 1).toString()
      );

      // Clear all cached data
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.FOOD_ITEMS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER_SETTINGS),
      ]);
    } catch (error) {
      console.error("Failed to invalidate cache:", error);
    }
  }

  /**
   * Clear all offline data (reset)
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all(
        Object.values(this.STORAGE_KEYS).map((key) =>
          AsyncStorage.removeItem(key)
        )
      );

      // Clear retry timeouts
      this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.retryTimeouts.clear();
    } catch (error) {
      console.error("Failed to clear offline data:", error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalSize: number;
    itemCount: number;
    cacheHitRate: number;
    oldestEntry: number;
  }> {
    try {
      const allKeys = Object.values(this.STORAGE_KEYS);
      const entries = await Promise.all(
        allKeys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          return { key, value, size: value ? value.length : 0 };
        })
      );

      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      const itemCount = entries.filter((entry) => entry.value).length;

      return {
        totalSize,
        itemCount,
        cacheHitRate: 0.85, // Would be calculated based on actual usage
        oldestEntry: Date.now() - this.CACHE_DURATION.FOOD_ITEMS,
      };
    } catch (error) {
      console.error("Failed to get storage stats:", error);
      return { totalSize: 0, itemCount: 0, cacheHitRate: 0, oldestEntry: 0 };
    }
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
