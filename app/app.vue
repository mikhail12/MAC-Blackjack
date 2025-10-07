<template>
  <div class="flex flex-col flex-1 min-h-screen">
    <div class="h-15 items-center flex w-full justify-between px-10">
      <div class="flex gap-5 items-center">
        <NuxtLink to="/" class="font-bold text-3xl">Blackjack</NuxtLink>
        <div class="fixed md:relative bottom-[30px] md:bottom-0 left-0 w-full md:w-fit flex">
          <CurrentBalance class="mx-auto md:mx-0"/>
        </div>
      </div>
      <div class="flex gap-5 items-center">
        <NuxtLink to="/history">History</NuxtLink>
        <Button class="hidden"><NuxtLink to="/login" class="">Login</NuxtLink></Button>
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