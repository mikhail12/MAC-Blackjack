<template>
  <div>
    <div class="h-15 items-center flex w-full justify-between px-10">
      <div class="flex gap-5 items-center">
        <NuxtLink to="/" class="font-bold text-3xl">Blackjack</NuxtLink>
        <CurrentBalance />
      </div>
      <div class="flex gap-5 items-center">
        <NuxtLink to="/">History</NuxtLink>
        <Button ><NuxtLink to="/Login">Login</NuxtLink></Button>
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

watchEffect(() => {
  colorMode.preference = isDarkMode.value ? "dark" : "light";
});
</script>