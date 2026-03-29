/**
 * Groceries Screen (premium redesign)
 * Sleek, minimal, product-ready UI aligned with FridgeWise.
 */

import ScreenLayout from "@/components/ScreenLayout";
import SkeletonBlock from "@/components/SkeletonBlock";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { SHOPPING_LIST_STORAGE_KEY } from "@/services/groceryListStorage";
import { syncGroceryListReminder } from "@/services/groceryListReminderService";
import { GROCERY_CATEGORY_OPTIONS, GROCERY_CATEGORY_ORDER } from "@/lib/foodCategories";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatQuantityWithUnit } from "@/utils/formatQuantityUnit";

// =============================================================================
// INTERFACES
// =============================================================================

interface GroceryItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  status: "list" | "bought" | "fridge";
  priority: "high" | "medium" | "low";
  completed: boolean;
  addedDate: Date;
  notes?: string;
}

type GrocerySection = {
  title: string;
  kind: "category" | "purchased";
  data: GroceryItem[];
};

const CATEGORY_OPTIONS = GROCERY_CATEGORY_OPTIONS;
const CATEGORY_ORDER = GROCERY_CATEGORY_ORDER;

const UNIT_OPTIONS = [
  "pcs",
  "kg",
  "g",
  "lb",
  "servings",
  "ml",
  "L",
  "pack",
  "can",
  "jar",
  "bottle",
  "box",
  "bag",
  "oz",
  "portion",
] as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ShoppingListScreen() {
  useAuth();
  const { lowStockAlerts } = useSettings();
  const insets = useSafeAreaInsets();
  const [shoppingList, setShoppingList] = useState<GroceryItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const swipeRefs = useRef<Record<string, Swipeable | null>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState<string>("");
  const [draftQty, setDraftQty] = useState(1);
  const [draftUnit, setDraftUnit] = useState<(typeof UNIT_OPTIONS)[number]>("pcs");
  const [unitOpen, setUnitOpen] = useState(false);

  // Fixed light theme colors – match other pages
  const backgroundColor = "#FFFFFF";
  const cardBackgroundColor = "#FFFFFF";
  const textColor = "#1F2937";
  const subTextColor = "#6B7280";
  const primaryColor = "#22C55E";
  const deepGreen = "#197C47";
  const fridgePng = require("../../assets/images/icons/fridge_icon.png");

  // =============================================================================
  // DATA LOADING
  // =============================================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // No auto-generated items; keep the user's list.
    setRefreshing(false);
  }, []);

  // Load saved list on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
        if (!raw) return;
        const parsed: any[] = JSON.parse(raw);
        const restored: GroceryItem[] = parsed.map((it) => {
          const status: GroceryItem["status"] = it.status ?? "list";
          return {
            ...it,
            status,
            completed: status !== "list",
            addedDate: it.addedDate ? new Date(it.addedDate) : new Date(),
          };
        });
        setShoppingList(restored);
      } catch (e) {
        console.warn("Failed to load shopping list", e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // Persist list whenever it changes
  useEffect(() => {
    (async () => {
      try {
        const toStore = shoppingList.map((it) => ({
          ...it,
          addedDate: it.addedDate.toISOString(),
        }));
        await AsyncStorage.setItem(
          SHOPPING_LIST_STORAGE_KEY,
          JSON.stringify(toStore)
        );
      } catch (e) {
        console.warn("Failed to save shopping list", e);
      }
    })();
  }, [shoppingList]);

  useEffect(() => {
    if (initialLoading) return;
    const t = setTimeout(() => {
      syncGroceryListReminder(lowStockAlerts).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [shoppingList, lowStockAlerts, initialLoading]);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const animateListChange = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const openAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraftName("");
    setDraftCategory("");
    setDraftQty(1);
    setDraftUnit("pcs");
    setUnitOpen(false);
    setEditingId(null);
    setAddOpen(true);
  }, []);

  const startEditItem = useCallback(
    (item: GroceryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDraftName(item.name);
      setDraftCategory(item.category || "");
      setDraftQty(item.quantity);
      setDraftUnit((item.unit as (typeof UNIT_OPTIONS)[number]) || "pcs");
      setUnitOpen(false);
      setEditingId(item.id);
      setAddOpen(true);
    },
    []
  );

  const addItem = useCallback(() => {
    const name = draftName.trim();
    if (!name) {
      Alert.alert("Add item", "Enter an item name.");
      return;
    }
    animateListChange();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingId) {
      setShoppingList((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                name,
                category: draftCategory,
                quantity: draftQty,
                unit: draftUnit,
              }
            : it
        )
      );
    } else {
      const item: GroceryItem = {
        id: `manual-${Date.now()}`,
        name,
        category: draftCategory,
        quantity: draftQty,
        unit: draftUnit,
        status: "list",
        priority: "medium",
        completed: false,
        addedDate: new Date(),
      };
      setShoppingList((prev) => [item, ...prev]);
    }

    setAddOpen(false);
    setEditingId(null);
  }, [draftCategory, draftName, draftQty, draftUnit, editingId]);

  const setItemStatus = useCallback(
    (itemId: string, status: GroceryItem["status"]) => {
      animateListChange();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShoppingList((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status,
                completed: status !== "list",
              }
            : item
        )
      );
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    animateListChange();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const closeOtherSwipes = (openId: string) => {
    Object.entries(swipeRefs.current).forEach(([id, ref]) => {
      if (id !== openId) ref?.close();
    });
  };

  const renderRightActions = (itemId: string) => (
    <View style={styles.swipeActionsWrap}>
      <TouchableOpacity
        style={styles.swipeDelete}
        onPress={() => removeItem(itemId)}
        accessibilityRole="button"
        accessibilityLabel="Delete item"
        activeOpacity={0.9}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroceryItem = ({ item, index, section }: any) => {
    // For category sections, render one grouped card per category with items stacked
    if (section.kind === "category") {
      if (index !== 0) return null;

      const categoryMeta = CATEGORY_OPTIONS.find(
        (c) => c.label === section.title
      );
      const CategoryIcon = categoryMeta?.Icon;
      const itemCount = section.data.length;
      const collapsed = collapsedCategories[section.title];

      return (
        <View style={styles.categoryGroupCard}>
          <TouchableOpacity
            style={styles.categoryGroupHeader}
            activeOpacity={0.9}
            onPress={() => {
              animateListChange();
              setCollapsedCategories((prev) => ({
                ...prev,
                [section.title]: !prev[section.title],
              }));
            }}
          >
            {CategoryIcon && (
              <CategoryIcon size={16} color="#FFFFFF" weight="fill" />
            )}
            <Text style={styles.categoryGroupTitle}>{section.title}</Text>
            <View style={styles.categoryCountBadge}>
              <Text style={styles.categoryCountText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
          {!collapsed && (
            <View style={styles.categoryGroupBody}>
              {section.data.map((sectionItem: GroceryItem, index: number) => {
                const meta = formatQuantityWithUnit(
                  sectionItem.quantity,
                  sectionItem.unit,
                  { fallbackUnit: "pcs" }
                );
                const muted = sectionItem.completed;
                const isLast = index === section.data.length - 1;
                return (
                  <View
                    key={sectionItem.id}
                    style={[
                      styles.categoryGroupItemRow,
                      !isLast && styles.categoryGroupItemRowDivider,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.categoryGroupItemMain}
                      onPress={() =>
                        setItemStatus(
                          sectionItem.id,
                          sectionItem.status === "list" ? "bought" : "list"
                        )
                      }
                      activeOpacity={0.9}
                    >
                      <Text
                        style={styles.categoryGroupItemName}
                        numberOfLines={1}
                      >
                        {sectionItem.name}
                      </Text>
                      <Text
                        style={styles.categoryGroupItemMeta}
                        numberOfLines={1}
                      >
                        {meta}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.categoryGroupItemActions}>
                      {/* 2-circle state: list -> fridge */}
                      <View style={styles.statusCirclesRow}>
                        {/* Left circle: mark as bought (checkmark), no navigation */}
                        <TouchableOpacity
                          style={[
                            styles.statusCircle,
                            sectionItem.status !== "list" &&
                              styles.statusCircleActive,
                          ]}
                          onPress={() =>
                            setItemStatus(
                              sectionItem.id,
                              sectionItem.status === "bought" ? "list" : "bought"
                            )
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Toggle bought state"
                        >
                          {sectionItem.status !== "list" && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#FFFFFF"
                            />
                          )}
                        </TouchableOpacity>

                        {/* Connector between states */}
                        <View
                          style={[
                            styles.statusConnector,
                            sectionItem.status !== "list" &&
                              styles.statusConnectorActive,
                          ]}
                        />

                        {/* Right circle: fridge icon + navigation */}
                        <TouchableOpacity
                          style={[
                            styles.statusCircle,
                            sectionItem.status === "fridge" &&
                              styles.statusCircleActive,
                          ]}
                          onPress={() => {
                            setItemStatus(sectionItem.id, "fridge");
                            router.push({
                              pathname: "/(tabs)/add",
                              params: {
                                name: sectionItem.name,
                                quantity: String(sectionItem.quantity),
                                unit: sectionItem.unit || "pcs",
                                category: sectionItem.category,
                              },
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Move to fridge or shelf"
                        >
                          <Image
                            source={fridgePng}
                            style={{
                              width: 14,
                              height: 14,
                              tintColor:
                                sectionItem.status === "fridge"
                                  ? "#FFFFFF"
                                  : "#15803D",
                            }}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => startEditItem(sectionItem)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel="Edit item"
                      >
                        <Ionicons name="create-outline" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => removeItem(sectionItem.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel="Delete item"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    }

    // Fallback (shouldn't be hit often) – single item card
    const meta = formatQuantityWithUnit(item.quantity, item.unit, {
      fallbackUnit: "pcs",
    });
    const muted = item.status !== "list";

    return (
      <Swipeable
        ref={(ref) => {
          swipeRefs.current[item.id] = ref;
        }}
        onSwipeableWillOpen={() => closeOtherSwipes(item.id)}
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <View
          style={[styles.itemCard, { backgroundColor: cardBackgroundColor }]}
        >
                        <TouchableOpacity
                          style={styles.categoryCardContent}
                          onPress={() =>
                            setItemStatus(
                              item.id,
                              item.status === "bought" ? "list" : "bought"
                            )
                          }
                          activeOpacity={0.9}
          >
            <View style={styles.categoryCardHeader}>
              <Text style={styles.categoryCardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.categoryCardMetaHeader} numberOfLines={1}>
                {meta}
              </Text>
            </View>

            <View style={styles.categoryCardBody}>
              <View style={styles.categoryCardActions}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/add",
                      params: {
                        name: item.name,
                        quantity: String(item.quantity),
                        unit: item.unit || "pcs",
                        category: item.category,
                      },
                    })
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Move to fridge or shelf"
                >
                  <Ionicons
                    name="arrow-down-circle-outline"
                    size={16}
                    color="#22C55E"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => startEditItem(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit item"
                >
                  <Ionicons name="create-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => removeItem(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Delete purchased item"
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  const activeCount = shoppingList.length;

  const sections: GrocerySection[] = useMemo(() => {
    const byCategory = new Map<string, GroceryItem[]>();
    shoppingList.forEach((it) => {
      const cat = it.category || "Other";
      const arr = byCategory.get(cat) || [];
      arr.push(it);
      byCategory.set(cat, arr);
    });

    const orderedCats = Array.from(byCategory.keys()).sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a as any);
      const bi = CATEGORY_ORDER.indexOf(b as any);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    return orderedCats.map((cat) => ({
      title: cat,
      kind: "category",
      data: byCategory.get(cat) || [],
    }));
  }, [shoppingList]);

  const headerTitle = "Groceries";
  const subtitle = `${activeCount} ${activeCount === 1 ? "item" : "items"} left`;

  return (
    <ScreenLayout topInsetColor="#22C55E" backgroundColor="#FFFFFF">
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {/* Full-width green banner header (like Add Item) */}
        <View
          style={[
            styles.banner,
            {
              marginLeft: -insets.left,
              marginRight: -insets.right,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          <ThemedText style={styles.bannerTitle}>Groceries</ThemedText>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderGroceryItem}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[
            styles.listContainer,
            // ensure last items scroll above sticky bottom button + tab bar
            { paddingBottom: Math.min(insets.bottom + 160, 200) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={deepGreen}
            />
          }
          ListHeaderComponent={
            <>
              {/* Simple centered Add button */}
              <View style={styles.addButtonSpacer} />
            </>
          }
          renderSectionHeader={() => null}
          ListEmptyComponent={
            initialLoading ? (
              <View style={styles.loadingSkeletonWrap}>
                <View style={styles.loadingSkeletonCard}>
                  <SkeletonBlock width="40%" height={16} />
                  <SkeletonBlock width="70%" height={12} style={{ marginTop: 10 }} />
                </View>
                <View style={styles.loadingSkeletonCard}>
                  <SkeletonBlock width="46%" height={16} />
                  <SkeletonBlock width="62%" height={12} style={{ marginTop: 10 }} />
                </View>
                <View style={styles.loadingSkeletonCard}>
                  <SkeletonBlock width="36%" height={16} />
                  <SkeletonBlock width="58%" height={12} style={{ marginTop: 10 }} />
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: textColor }]}>
                    Your list is empty
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Tap “Add item” to start. Use the left circle for purchased,
                    and the fridge icon to move items into your fridge with an
                    expiry date.
                  </Text>
                </View>
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
        />

        {/* Bottom Add button (sticky over list) */}
        <View
          style={[
            styles.bottomAddWrap,
            { bottom: insets.bottom + 104 }, // above floating tab bar
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.bottomAddButton}
            onPress={openAdd}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Add item"
          >
            <Text style={styles.bottomAddText}>Add item</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={addOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAddOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalBackdropPress}
              activeOpacity={1}
              onPress={() => {
                if (unitOpen) {
                  setUnitOpen(false);
                  return;
                }
                setAddOpen(false);
              }}
            />

            {/* Single centered "square" popup */}
            <View style={styles.modalCard}>
              {unitOpen && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setUnitOpen(false)}
                  style={styles.dropdownDismissLayer}
                />
              )}

              {/* Name + Quantity row */}
              <View style={styles.sheetTopRow}>
                <View style={styles.sheetNameWrap}>
                  <Text style={styles.fieldLabel}>Item Name</Text>
                  <View style={styles.fieldInputWrap}>
                    {draftName.length === 0 && (
                      <Text style={styles.fieldPlaceholder}>
                        e.g. Milk, Chicken, Apples
                      </Text>
                    )}
                    <TextInput
                      value={draftName}
                      onChangeText={setDraftName}
                      style={styles.fieldInput}
                      autoFocus
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={addItem}
                    />
                  </View>
                </View>

                <View style={styles.qtyColumn}>
                  <Text style={styles.fieldLabelRight}>Quantity</Text>
                  <View style={styles.qtyControlModern}>
                    <TouchableOpacity
                      onPress={() => setDraftQty((q) => Math.max(1, q - 1))}
                      style={styles.qtyBtnModern}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.qtyMid}>
                      <Text style={styles.qtyTextModern}>{draftQty}</Text>
                      <TouchableOpacity
                        onPress={() => setUnitOpen((v) => !v)}
                        activeOpacity={0.9}
                        style={styles.unitPill}
                      >
                        <Text
                          style={styles.unitText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {draftUnit}
                        </Text>
                        <Text style={styles.unitChevron}>▾</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => setDraftQty((q) => Math.min(99, q + 1))}
                      style={styles.qtyBtnModern}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {unitOpen && (
                    <>
                      <View style={styles.unitDropdown}>
                        <ScrollView
                          style={styles.unitScroll}
                          showsVerticalScrollIndicator
                          nestedScrollEnabled
                        >
                          {UNIT_OPTIONS.map((u) => {
                            const selected = draftUnit === u;
                            return (
                              <TouchableOpacity
                                key={u}
                                activeOpacity={0.9}
                                onPress={() => {
                                  setDraftUnit(u);
                                  setUnitOpen(false);
                                }}
                                style={[
                                  styles.unitOption,
                                  selected && styles.unitOptionSelected,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.unitOptionText,
                                    selected && styles.unitOptionTextSelected,
                                  ]}
                                >
                                  {u}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => setUnitOpen(false)}
                          style={styles.unitCancel}
                        >
                          <Text style={styles.unitCancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Category */}
              <View style={styles.categoryBlock}>
                <Text style={styles.categoryLabel}>Category</Text>
                <View style={styles.chipsWrap}>
                  {CATEGORY_OPTIONS.map(({ label, Icon }) => {
                    const selected = label === draftCategory;
                    return (
                      <TouchableOpacity
                        key={label}
                        onPress={() => setDraftCategory(label)}
                        style={[
                          styles.chip,
                          selected && styles.chipSelectedModern,
                        ]}
                        activeOpacity={0.9}
                      >
                        <Icon
                          size={14}
                          color={selected ? "#FFFFFF" : "#1A1A1A"}
                          weight="regular"
                        />
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelectedModern,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Actions */}
              {/** All fields must be filled for Add to be active */}
              <View style={styles.sheetActions}>
                <TouchableOpacity
                  onPress={() => {
                    setUnitOpen(false);
                    setAddOpen(false);
                  }}
                  style={styles.sheetCancel}
                >
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addItem}
                  disabled={
                    !draftName.trim() ||
                    draftQty <= 0 ||
                    !draftCategory ||
                    !draftUnit
                  }
                  style={[
                    styles.sheetAdd,
                    (!draftName.trim() ||
                      draftQty <= 0 ||
                      !draftCategory ||
                      !draftUnit) &&
                      styles.sheetAddDisabled,
                  ]}
                >
                  <Text style={styles.sheetAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </ScreenLayout>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  banner: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: "#22C55E",
    paddingTop: 18,
    paddingBottom: 12,
    alignItems: "center",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  bannerSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
  },
  // Header
  headerContainer: {
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  loadingSkeletonWrap: {
    gap: 10,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  loadingSkeletonCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  countPill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 0,
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: {
    color: "#166534",
    fontSize: 16,
    fontWeight: "900",
  },
  addCard: {
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addButtonSpacer: {
    height: 6,
  },
  bottomAddWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2000,
  },
  bottomAddButton: {
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 23,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    elevation: 0,
  },
  bottomAddText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  addLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  addTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  addHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  itemCard: {
    borderRadius: 18,
    marginBottom: 10,
    marginHorizontal: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemCenter: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 13,
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 4,
  },
  actionIcon: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  categoryRow: {},
  categoryCard: {},
  categoryGroupCard: {
    borderRadius: 18,
    marginBottom: 14,
    marginHorizontal: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
  },
  categoryGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#22C55E",
  },
  categoryGroupTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  categoryCountBadge: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  categoryGroupBody: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  categoryGroupItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  categoryGroupItemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryGroupItemMain: {
    flex: 1,
  },
  categoryGroupItemName: {
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: "#111827",
  },
  categoryGroupItemMeta: {
    marginTop: 1,
    fontSize: 11.5,
    color: "#6B7280",
  },
  categoryGroupItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  statusCirclesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  statusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
  },
  statusCircleActive: {
    backgroundColor: "#16A34A",
    borderColor: "#15803D",
  },
  statusConnector: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 2,
  },
  statusConnectorActive: {
    backgroundColor: "#16A34A",
  },
  categoryCardContent: {
    borderRadius: 18,
    overflow: "hidden",
  },
  categoryCardHeader: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
  },
  categoryCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  categoryCardBody: {
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 2,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  categoryCardMetaHeader: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 2,
  },
  categoryCardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 2,
    gap: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 26,
  },
  emptyBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "600",
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  clearPurchased: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  clearPurchasedText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#197C47",
  },
  clearPurchasedFooter: {
    alignItems: "flex-start",
    paddingHorizontal: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  swipeActionsWrap: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  swipeDelete: {
    width: 92,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginRight: 2,
  },
  swipeDeleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
    marginTop: 18,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    paddingHorizontal: 16,
  },
  modalBackdropPress: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  sheetCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldLabelRight: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
    marginLeft: 0,
    textAlign: "center",
    alignSelf: "center",
  },
  fieldInputWrap: {
    position: "relative",
  },
  fieldPlaceholder: {
    position: "absolute",
    left: 14,
    top: 13,
    fontSize: 13,
    color: "#9CA3AF",
  },
  fieldInput: {
    height: 44,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  categoryBlock: {
    marginTop: 6,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipSelected: {
    borderColor: "rgba(25,124,71,0.25)",
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  chipSelectedModern: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  chipTextSelected: {
    color: "#197C47",
  },
  chipTextSelectedModern: {
    color: "#FFFFFF",
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  sheetNameWrap: {
    flex: 1,
  },
  qtyColumn: {
    width: 120,
  },
  qtyMid: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  unitPill: {
    minWidth: 44,
    maxWidth: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
    overflow: "hidden",
  },
  unitText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
    maxWidth: 40,
  },
  unitChevron: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    flexShrink: 0,
  },
  unitDropdown: {
    position: "absolute",
    top: 62,
    left: "50%",
    width: 96,
    transform: [{ translateX: -48 }],
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: "hidden",
    zIndex: 20,
  },
  dropdownDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  unitScroll: {
    maxHeight: 6 * 34,
  },
  unitOption: {
    paddingVertical: 10,
    alignItems: "center",
  },
  unitOptionSelected: {
    backgroundColor: "#DCFCE7",
  },
  unitOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  unitOptionTextSelected: {
    color: "#166534",
  },
  unitCancel: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  unitCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyControlModern: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
  },
  qtyBtnModern: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  qtyText: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
    paddingHorizontal: 8,
  },
  qtyTextModern: {
    minWidth: 20,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  sheetCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  sheetAdd: {
    flex: 1,
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sheetAddDisabled: {
    backgroundColor: "#A1EACB",
  },
  sheetAddText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
