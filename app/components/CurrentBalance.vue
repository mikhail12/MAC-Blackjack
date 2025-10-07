<template>
    <div class="relative flex w-full">
        <div :class="`flex flex-col md:fixed md:top-[10px] mx-auto px-3 rounded-3xl py-0 bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 text-sm font-medium ${modalDifferences} transition-all delay-10 ease-in-out duration-100`" >
            <div :class="`flex ${modalHeight} transition-all duration-150 delay-50 ease-in-out w-full`" @click="toggleOpen">
                <div class="border-muted-foreground flex items-center gap-1 w-full justify-center md:justify-normal ">
                    <Icon name="emojione-v1:money-bag" class="h-[18px] w-[18px]"  />
                    <span class="text-[20px]">{{ current_balance }}</span>
                </div>
                <button class="hidden ml-3 bg-primary p-[2px] rounded-xl my-auto md:flex">
                    <Icon name="charm:plus" class="h-[20px] w-[20px] bg-accent"/>
                </button>
            </div>
            <Transition name="balance-modal" 
                enter-active-class="transition-all delay-100 duration-100 ease-in-out"
                enter-from-class="opacity-0 -translate-y-5 scale-70"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition-all ease-out duration-40"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-50">
                <div v-if="shouldShowBalanceModal" class="grid grid-cols-2 grid-rows-2 gap-3 transition-discrete">
                    <Button @click="addChips(100)" class="text-xl">+100</Button>
                    <Button @click="addChips(500)" class="text-xl">+500</Button>
                    <Button @click="addChips(1000)" class="text-xl">+1000</Button>
                    <Button @click="addChips(5000)" class="text-xl">+5000</Button>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from './ui/button/Button.vue';

const userStore = useUserStore();
const user = await userStore.getUser();
const current_balance = computed(() => user.value?.current_balance ?? 0);
const shouldShowBalanceModal = ref(false);
const toggleOpen = () => {
    shouldShowBalanceModal.value = !shouldShowBalanceModal.value
}
const addChips = async (amount: number) => {
    await userStore.addChips(amount);
    await userStore.updateUserProfile();
}

const modalDifferences = computed(() => shouldShowBalanceModal.value ? "h-[144px] pb-4": "h-[40px]")
const modalHeight = computed(() => shouldShowBalanceModal.value ? "h-[44px]" : "h-[40px]")
</script>