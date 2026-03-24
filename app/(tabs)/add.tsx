import AddItemScreen from "@/components/AddItemScreen";
import { useLocalSearchParams } from "expo-router";

export default function AddPage() {
  const params = useLocalSearchParams<{ id?: string; nonce?: string; edit?: string }>();
  const routeKey = `${params.edit ?? "new"}-${params.id ?? "none"}-${params.nonce ?? "0"}`;
  return <AddItemScreen key={routeKey} />;
}
