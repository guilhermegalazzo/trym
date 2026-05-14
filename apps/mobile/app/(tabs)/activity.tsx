import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 items-center justify-center" edges={["top"]}>
      <Text className="text-base font-semibold text-neutral-900">Atividade</Text>
      <Text className="mt-1 text-sm text-neutral-500">Implementado no Sprint 7</Text>
    </SafeAreaView>
  );
}
