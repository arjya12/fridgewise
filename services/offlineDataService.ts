// services/offlineDataService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export interface OfflineAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "BATCH_UPDATE" | "BATCH_DELETE";
  timestamp: string;
  data: any;
  table: string;
  recordId?: string;
  retryCount: number;
  maxRetries: number;
  priority: "low" | "normal" | "high";
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingActions: number;
  failedActions: number;
  syncInProgress: boolean;
}

export interface ConflictResolution {
  strategy: "local_wins" | "remote_wins" | "merge" | "manual";
  resolvedData?: any;
}

export interface DataCache {
  key: string;
  data: any;
  timestamp: string;
  expiry: string;
  version: number;
  dirty: boolean; // Has local changes not yet synced
}

export interface OfflineConfig {
  maxCacheSize: number; // MB
  cacheExpiry: number; // Hours
  maxRetries: number;
  retryDelay: number; // Seconds
  autoSync: boolean;
  conflictResolution: ConflictResolution["strategy"];
}

class OfflineDataService {
  private readonly STORAGE_KEYS = {
    CACHE: "offline_cache",
    PENDING_ACTIONS: "pending_actions",
    SYNC_STATUS: "sync_status",
    CONFIG: "offline_config",
    CONFLICT_LOG: "conflict_log",
  };

  private readonly DEFAULT_CONFIG: OfflineConfig = {
    maxCacheSize: 50, // 50MB
    cacheExpiry: 24, // 24 hours
    maxRetries: 3,
    retryDelay: 30, // 30 seconds
    autoSync: true,
    conflictResolution: "local_wins",
  };

  private config: OfflineConfig = this.DEFAULT_CONFIG;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private retryTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize offline data service
   */
  async initialize(): Promise<void> {
    // Load configuration
    await this.loadConfig();

    // Set up network monitoring
    this.setupNetworkMonitoring();

    // Load sync status
    await this.loadSyncStatus();

    // Clean up expired cache
    await this.cleanupExpiredCache();

    // Process pending actions if online
    if (this.isOnline && this.config.autoSync) {
      this.processPendingActions();
    }
  }

  /**
   * Set up network connectivity monitoring
   */
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Just came back online
        console.log("Back online - processing pending actions");
        if (this.config.autoSync) {
          this.processPendingActions();
        }
      }

      this.updateSyncStatus({ isOnline: this.isOnline });
    });

    // Get initial connectivity state
    NetInfo.fetch().then((state) => {
      this.isOnline = state.isConnected ?? false;
      this.updateSyncStatus({ isOnline: this.isOnline });
    });
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.CONFIG);
      if (stored) {
        this.config = { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Error loading offline config:", error);
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<OfflineConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CONFIG,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error("Error saving offline config:", error);
    }
  }

  /**
   * Cache data locally
   */
  async cacheData(key: string, data: any, expiry?: Date): Promise<void> {
    try {
      const cache = await this.getCache();
      const expiryTime =
        expiry ||
        new Date(Date.now() + this.config.cacheExpiry * 60 * 60 * 1000);

      const cacheEntry: DataCache = {
        key,
        data,
        timestamp: new Date().toISOString(),
        expiry: expiryTime.toISOString(),
        version: cache[key]?.version + 1 || 1,
        dirty: false,
      };

      cache[key] = cacheEntry;
      await this.saveCache(cache);
    } catch (error) {
      console.error("Error caching data:", error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    try {
      const cache = await this.getCache();
      const entry = cache[key];

      if (!entry) return null;

      // Check if expired
      if (new Date(entry.expiry) < new Date()) {
        delete cache[key];
        await this.saveCache(cache);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  }

  /**
   * Mark cached data as dirty (has local changes)
   */
  async markCacheDirty(key: string): Promise<void> {
    try {
      const cache = await this.getCache();
      if (cache[key]) {
        cache[key].dirty = true;
        cache[key].version++;
        await this.saveCache(cache);
      }
    } catch (error) {
      console.error("Error marking cache dirty:", error);
    }
  }

  /**
   * Queue action for offline execution
   */
  async queueAction(
    action: Omit<OfflineAction, "id" | "timestamp" | "retryCount">
  ): Promise<string> {
    const actionId = `action_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const queuedAction: OfflineAction = {
      id: actionId,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      ...action,
    };

    try {
      const pendingActions = await this.getPendingActions();
      pendingActions.push(queuedAction);
      await this.savePendingActions(pendingActions);

      // Update sync status
      await this.updateSyncStatus({ pendingActions: pendingActions.length });

      // If online and auto-sync enabled, process immediately
      if (this.isOnline && this.config.autoSync && !this.syncInProgress) {
        this.processPendingActions();
      }

      return actionId;
    } catch (error) {
      console.error("Error queueing action:", error);
      throw error;
    }
  }

  /**
   * Process pending actions
   */
  async processPendingActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    await this.updateSyncStatus({ syncInProgress: true });

    try {
      const pendingActions = await this.getPendingActions();
      const successfulActions: string[] = [];
      const failedActions: OfflineAction[] = [];

      // Sort by priority and timestamp
      const sortedActions = pendingActions.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      for (const action of sortedActions) {
        try {
          await this.executeAction(action);
          successfulActions.push(action.id);

          // Mark related cache as clean
          if (action.table && action.recordId) {
            await this.markCacheClean(`${action.table}_${action.recordId}`);
          }
        } catch (error) {
          console.error(`Failed to execute action ${action.id}:`, error);

          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            console.error(`Action ${action.id} exceeded max retries`);
            await this.logFailedAction(action, error as Error);
          } else {
            failedActions.push(action);
          }
        }
      }

      // Remove successful actions
      const remainingActions = pendingActions.filter(
        (action) => !successfulActions.includes(action.id)
      );

      // Re-add failed actions that haven't exceeded retry limit
      remainingActions.push(...failedActions);

      await this.savePendingActions(remainingActions);
      await this.updateSyncStatus({
        lastSyncTime: new Date().toISOString(),
        pendingActions: remainingActions.length,
        failedActions: remainingActions.filter(
          (a) => a.retryCount >= a.maxRetries
        ).length,
      });

      // Schedule retry for failed actions
      if (failedActions.length > 0) {
        this.scheduleRetry();
      }
    } catch (error) {
      console.error("Error processing pending actions:", error);
    } finally {
      this.syncInProgress = false;
      await this.updateSyncStatus({ syncInProgress: false });
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    // This would integrate with your actual API service
    // For now, we'll simulate the execution

    console.log(
      `Executing ${action.type} action on ${action.table}:`,
      action.data
    );

    switch (action.type) {
      case "CREATE":
        // await apiService.create(action.table, action.data);
        break;
      case "UPDATE":
        // await apiService.update(action.table, action.recordId!, action.data);
        break;
      case "DELETE":
        // await apiService.delete(action.table, action.recordId!);
        break;
      case "BATCH_UPDATE":
        // await apiService.batchUpdate(action.table, action.data);
        break;
      case "BATCH_DELETE":
        // await apiService.batchDelete(action.table, action.data);
        break;
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Schedule retry for failed actions
   */
  private scheduleRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      if (this.isOnline && this.config.autoSync) {
        this.processPendingActions();
      }
    }, this.config.retryDelay * 1000);
  }

  /**
   * Handle conflict resolution
   */
  async resolveConflict(
    localData: any,
    remoteData: any,
    strategy?: ConflictResolution["strategy"]
  ): Promise<any> {
    const resolutionStrategy = strategy || this.config.conflictResolution;

    switch (resolutionStrategy) {
      case "local_wins":
        return localData;

      case "remote_wins":
        return remoteData;

      case "merge":
        // Simple merge strategy - remote data with local changes overlay
        return { ...remoteData, ...localData };

      case "manual":
        // Return both for manual resolution
        return {
          local: localData,
          remote: remoteData,
          requiresManualResolution: true,
        };

      default:
        return localData;
    }
  }

  /**
   * Force sync all dirty cache
   */
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    const cache = await this.getCache();
    const dirtyEntries = Object.values(cache).filter((entry) => entry.dirty);

    for (const entry of dirtyEntries) {
      await this.queueAction({
        type: "UPDATE",
        table: entry.key.split("_")[0],
        recordId: entry.key.split("_")[1],
        data: entry.data,
        priority: "high",
      });
    }

    await this.processPendingActions();
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CACHE);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    cacheSize: number;
    pendingActions: number;
    failedActions: number;
    lastSync: string | null;
  }> {
    try {
      const cache = await this.getCache();
      const pendingActions = await this.getPendingActions();
      const syncStatus = await this.getSyncStatus();

      const cacheSize = JSON.stringify(cache).length / (1024 * 1024); // MB
      const failedActions = pendingActions.filter(
        (a) => a.retryCount >= a.maxRetries
      ).length;

      return {
        cacheSize: Math.round(cacheSize * 100) / 100,
        pendingActions: pendingActions.length,
        failedActions,
        lastSync: syncStatus.lastSyncTime,
      };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return {
        cacheSize: 0,
        pendingActions: 0,
        failedActions: 0,
        lastSync: null,
      };
    }
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<{
    cache: Record<string, DataCache>;
    pendingActions: OfflineAction[];
    config: OfflineConfig;
  }> {
    return {
      cache: await this.getCache(),
      pendingActions: await this.getPendingActions(),
      config: this.config,
    };
  }

  /**
   * Import data from backup
   */
  async importData(backup: {
    cache?: Record<string, DataCache>;
    pendingActions?: OfflineAction[];
    config?: OfflineConfig;
  }): Promise<void> {
    try {
      if (backup.cache) {
        await this.saveCache(backup.cache);
      }
      if (backup.pendingActions) {
        await this.savePendingActions(backup.pendingActions);
      }
      if (backup.config) {
        await this.updateConfig(backup.config);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      throw error;
    }
  }

  // Private helper methods

  private async getCache(): Promise<Record<string, DataCache>> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHE);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error getting cache:", error);
      return {};
    }
  }

  private async saveCache(cache: Record<string, DataCache>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CACHE,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  }

  private async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem(
        this.STORAGE_KEYS.PENDING_ACTIONS
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error getting pending actions:", error);
      return [];
    }
  }

  private async savePendingActions(actions: OfflineAction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_ACTIONS,
        JSON.stringify(actions)
      );
    } catch (error) {
      console.error("Error saving pending actions:", error);
    }
  }

  private async getSyncStatus(): Promise<SyncStatus> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS);
      return stored
        ? JSON.parse(stored)
        : {
            isOnline: this.isOnline,
            lastSyncTime: null,
            pendingActions: 0,
            failedActions: 0,
            syncInProgress: false,
          };
    } catch (error) {
      console.error("Error getting sync status:", error);
      return {
        isOnline: this.isOnline,
        lastSyncTime: null,
        pendingActions: 0,
        failedActions: 0,
        syncInProgress: false,
      };
    }
  }

  private async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    try {
      const current = await this.getSyncStatus();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_STATUS,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Error updating sync status:", error);
    }
  }

  private async loadSyncStatus(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncInProgress = status.syncInProgress;
  }

  private async markCacheClean(key: string): Promise<void> {
    try {
      const cache = await this.getCache();
      if (cache[key]) {
        cache[key].dirty = false;
        await this.saveCache(cache);
      }
    } catch (error) {
      console.error("Error marking cache clean:", error);
    }
  }

  private async logFailedAction(
    action: OfflineAction,
    error: Error
  ): Promise<void> {
    try {
      const conflicts = await AsyncStorage.getItem(
        this.STORAGE_KEYS.CONFLICT_LOG
      );
      const log = conflicts ? JSON.parse(conflicts) : [];

      log.push({
        action,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 100 failed actions
      if (log.length > 100) {
        log.splice(0, log.length - 100);
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CONFLICT_LOG,
        JSON.stringify(log)
      );
    } catch (storageError) {
      console.error("Error logging failed action:", storageError);
    }
  }

  private async cleanupExpiredCache(): Promise<void> {
    try {
      const cache = await this.getCache();
      const now = new Date();
      let hasChanges = false;

      for (const [key, entry] of Object.entries(cache)) {
        if (new Date(entry.expiry) < now) {
          delete cache[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await this.saveCache(cache);
      }
    } catch (error) {
      console.error("Error cleaning up expired cache:", error);
    }
  }

  /**
   * Get current sync status
   */
  async getCurrentSyncStatus(): Promise<SyncStatus> {
    return this.getSyncStatus();
  }

  /**
   * Manually trigger sync
   */
  async manualSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    await this.processPendingActions();
  }
}

export const offlineDataService = new OfflineDataService();
