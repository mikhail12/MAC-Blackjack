<template>
  <div>
    <div class="h-15 items-center flex w-full justify-between px-10">
      <div class="flex gap-5 items-center">
        <NuxtLink to="/" class="font-bold text-3xl">Blackjack</NuxtLink>
        <CurrentBalance />
      </div>
      <div class="flex gap-5 items-center">
        <NuxtLink to="/">History</NuxtLink>
        <Button @click="onClick">Login</Button>
        <DarkModePicker />
      </div>
    </div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
const colorMode = useColorMode();
const isDarkMode = ref(false);
const userStore = useUserStore();
const gameStore = await useCurrentgameStore();
const onClick = async (): Promise<void> => {
  if (!gameStore) {
    console.error("What the fuck")
  }
  const data = await gameStore.startGame(100);
  console.warn(data);
}

watchEffect(() => {
  colorMode.preference = isDarkMode.value ? "dark" : "light";
});
</script>