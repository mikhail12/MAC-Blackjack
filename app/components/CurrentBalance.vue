<template>
    <Button class="px-3 rounded-3xl py-0" variant="secondary" size="lg" >
        <div class="divide-solid border-r-1 pr-3 border-muted-foreground h-full flex items-center gap-1">
            <Icon name="emojione-v1:money-bag" class="h-[15px] w-[15px]"/>
            <span class="text-[17px]">{{ current_balance }}</span>
        </div>
        <Icon name="charm:plus" class="h-[17px] w-[17px]"/>
    </Button>
</template>

<script setup lang="ts">
import Button from './ui/button/Button.vue';

const userStore = useUserStore();
const user = await userStore.getUser();
const current_balance = computed(() => user.value?.current_balance ?? 0);
console.warn(user)
</script>