<template>
    <div class="flex flex-1 h-full w-full flex-col items-center">
        <div class="flex flex-col items-center gap-8 my-auto">
            <div v-if="game.gameStatus.value !== GameStatus.idle">
                <div class="flex flex-col my-5 gap-3">
                    <div class="flex justify-center gap-2">
                        <div
                            v-for="card in game.currentGame.value?.dealerHand"
                            :key="card.rank"
                            class="flex w-20 h-30 dark:bg-white bg-secondary rounded-xl"
                        >
                            <BlackjackCard :card="card" />
                        </div>
                    </div>
                    <div :class="`px-4 py-1 text-md font-medium mx-auto rounded-[10px] flex ${dealerStatusClasses}`">
                        <span class="mr-2 text-xl">{{ game.dealerTotal }}</span>
                        <span class="my-auto">Dealer</span>
                    </div>
                </div>
                <div class="flex flex-col my-5 gap-3">
                    <div class="flex justify-center gap-2">
                        <div
                            v-for="card in game.currentGame.value?.playerHand"
                            :key="card.rank"
                            class="flex w-20 h-30 dark:bg-white bg-secondary rounded-xl"
                        >
                            <BlackjackCard :card="card" />
                        </div>
                    </div>
                    <div :class="`px-4 py-1 text-md font-medium mx-auto rounded-[10px] flex ${playerStatusClasses}`">
                        <span class="mr-2 text-xl">{{ game.playerTotal }}</span>
                        <span class="my-auto">You</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-10">
                <Button v-if="game.canHitOrStand.value" @click="game.hit()">Hit</Button>
                <Button v-if="game.canHitOrStand.value" @click="game.stand()">Stand</Button>
                <Button v-if="game.canReset.value" @click="reset">New game</Button>
                <div v-if="game.gameStatus.value == GameStatus.idle" class="flex flex-col items-center gap-4">
                    <input v-model="newBet" class="bg-secondary text-4xl text-center rounded-xl max-w-40" type="number">
                    <Button :disabled="invalidBet" class="text-4xl h-20 w-48" variant="secondary" @click="newGame">Place Bet</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'
import { GameStatus } from '~/types/game';
const game = await useBlackjackGame();
onMounted(async () => {
    await game.initOnMounted();
});
const userStore = useUserStore();
const user = await userStore.getUser();
const newBet = ref(100);
const invalidBet = computed(() => user.value!.current_balance < newBet.value);

const reset = () => {
    newBet.value = 100;
    game.reset();
}

const newGame = async () => {
    console.warn(newBet.value);
    if (newBet.value > 0) {
        await game.placeBetAndStartNewGame(newBet.value);
    }
}

const statusTextClass = ref("");
watchEffect(() => {
    if (game.gameStatus.value === GameStatus.finished) {
        statusTextClass.value = "text-white";
    }
    else {
        statusTextClass.value = "text-primary";
    }
})

const dealerStatusClasses = ref("bg-secondary text-primary");
// watchEffect(() => {
//     if (game.dealerBusted.value || game.currentGame.value?.result === "win") {
//         dealerStatusClasses.value = "bg-destructive-foreground text-white";
//     }
//     else if (game.currentGame.value?.result === "lose" || game.currentGame.value?.result === "push") {
//         dealerStatusClasses.value = "bg-affirmative text-white";
//     }
//     else {
//         dealerStatusClasses.value = "bg-secondary text-primary";
//     }
// });

const playerStatusClasses = ref("bg-secondary text-primary");
watchEffect(() => {
    if (game.playerBusted.value || game.currentGame.value?.result === "lose") {
        playerStatusClasses.value = "bg-destructive-foreground text-white";
    }
    else if (game.currentGame.value?.result === "win" || game.currentGame.value?.result === "push") {
        playerStatusClasses.value = "bg-affirmative text-white";
    }
    else {
        playerStatusClasses.value = "bg-secondary text-primary";
    }
});


</script>