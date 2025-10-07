<template>
    <div class="relative">
        <div :class="mainDivClass" >
            <div :class="`flex ${amountClasses} transition-all duration-150 delay-50 ease-in-out`" @click="toggleOpen">
                <div class="border-muted-foreground flex items-center gap-1 w-full">
                    <Icon name="emojione-v1:money-bag" class="h-[15px] w-[15px]"  />
                    <span class="text-[17px]">{{ current_balance }}</span>
                </div>
                <button class="flex ml-2 bg-primary p-[2px] rounded-xl my-auto">
                    <Icon name="charm:plus" class="h-[17px] w-[17px] bg-accent"/>
                </button>
            </div>
            <Transition name="balance-modal" 
                enter-active-class="transition-all ease-out delay-100 duration-150 ease-in-out"
                enter-from-class="opacity-0 -translate-y-5 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100">
                <div v-if="shouldShowBalanceModal" class="grid grid-cols-2 grid-rows-2 gap-4 transition-discrete">
                    <Button @click="addChips(100)">+100</Button>
                    <Button @click="addChips(500)">+500</Button>
                    <Button @click="addChips(1000)">+1000</Button>
                    <Button @click="addChips(5000)">+5000</Button>
                </div>
            </Transition>
        </div>
        {{ shouldShowBalanceModal }}
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

const modalDifferences = computed(() => shouldShowBalanceModal.value ? "h-fit pb-4 w-[200px] block": "flex h-[30px]")
const amountClasses = computed(() => shouldShowBalanceModal.value ? "h-[40px]" : "h-full")
const mainDivClass = computed(() => `absolute top-[-3px] px-3 rounded-3xl py-0 bg-primary bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 text-sm font-medium ${modalDifferences.value} transition-all delay-100 ease-in-out duration-200`);
</script>