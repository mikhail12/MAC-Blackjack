<template>
  <div>
    <Button @click="isDarkMode=!isDarkMode" variant="outline" class="h-[2.4rem] w-fit">
        <Icon name="radix-icons:sun" class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Icon name="radix-icons:moon" class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span class="sr-only">Toggle theme</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button"

const colorMode = useColorMode();
const isDarkMode = ref(false);

watchEffect(() => {
  colorMode.preference = isDarkMode.value ? "dark" : "light";
});
</script>