<template>
    <div class="flex flex-col">
        <h1 class="font-bold text-4xl mx-6 my-4">Game History</h1>
        <div class="flex mx-6 rounded-xl ">
            <div class="flex flex-col gap-2 w-full">
                <div v-for="game in currentGames" :key="game.id" class="flex rounded-xl p-3 border-primary border-1 justify-between w-full ">
                    <div class="flex flex-col mx-3">
                        <span class="text-s text-primary/70 font-medium">Date</span>
                        <span class="text-l max-w-100">{{ new Date(game.started_game).toLocaleString() }}</span>
                    </div>
                    <div class="flex flex-col mx-3">
                        <span class="text-s text-primary/70 font-medium">Bet</span>
                        <span class="text-l max-w-100">{{ game.bet }} chips</span>
                    </div>
                    <div class="flex flex-col mx-3">
                        <span class="text-s text-primary/70 font-medium">Score</span>
                        <span class="text-l max-w-100">You: {{calculateHandValue(game.playerHand)}} | Dealer: {{ calculateHandValue(game.dealerHand) }}</span>
                    </div>
                    <div class="flex flex-col mx-3 min-w-100">
                        <span class="text-s text-primary/70 font-medium">Result</span>
                        <span :class="`text-l max-w-100 ${calculateResultClasses(game)}`">{{ betterResultString(game)  }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="mx-auto flex gap-4 pb-8 my-4">
            <Button :disabled="currentPage === 1" @click="currentPage--">-</Button>
            <Button :disabled="currentPage + 1 > pages" @click="currentPage++">+</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { GameHistoryEntry } from '~/types/game';
import Button from '~/components/ui/button/Button.vue';

const runtimeConfig = useRuntimeConfig();
const PAGE_LIMIT = Number(runtimeConfig.public.PAGE_LIMIT);
const gameStore = useCurrentgameStore();

const currentGames = ref<GameHistoryEntry[]>();
const currentPage = ref(1);

const calculateResultClasses = (game: GameHistoryEntry) => {
    return game.result == "lose" ? "text-destructive": "text-affirmative"
};

const betterResultString = (game: GameHistoryEntry) => {
    switch (game.result) {
        case "lose":
            return "Lost";
        case "push":
            return "Push";
        case "win":
            return "Win";
    }
}

const count = await useAsyncData(async () => await gameStore.getHistoryLength());
const total_full_pages = (count.data.value ?? 0) / 10;
const has_semi_full_page = ((count.data.value ?? 0) % PAGE_LIMIT )> 0
const pages = has_semi_full_page ? total_full_pages + 1: total_full_pages;
const refreshNewPage = async () => {
    if (currentPage.value <= pages) {
        const history = await gameStore.getHistoryPage(currentPage.value);
        if (history) {
            return history
        }
    }
}

if (pages > 0) {
    const historyData = await useAsyncData(async () => await refreshNewPage());
    if (historyData.data?.value) {
        currentGames.value = historyData.data.value;
    }
}

watch(() => currentPage.value, async () => {
    if (pages > 0) {
        const historyData = await refreshNewPage();
        if (historyData) {
            currentGames.value = historyData;
        }
    }
});


</script>