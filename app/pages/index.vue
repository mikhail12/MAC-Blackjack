<template>
    <div class="flex flex-1 h-full w-full flex-col items-center">
        <div class="flex flex-col items-center gap-8 md:mt-20">
            <div v-if="game.gameStatus.value !== GameStatus.idle">
                <div class="flex flex-col my-5 gap-3">
                    <div class="flex justify-center gap-2">
                        <div
                            v-for="card in game.currentGame.value?.dealerHand"
                            :key="card.cardNumber"
                            class="flex w-20 h-30 dark:bg-white bg-secondary rounded-xl"
                        >
                            <BlackjackCard :card="card" />
                        </div>
                    </div>
                    <div :class="`px-4 py-1 text-md font-medium mx-auto rounded-[10px] flex bg-secondary text-primary`">
                        <span class="mr-2 text-xl">{{ game.dealerTotal }}</span>
                        <span class="my-auto">Dealer</span>
                    </div>
                </div>
                <div class="flex flex-col my-5 gap-3">
                    <div class="flex justify-center gap-2">
                        <div
                            v-for="card in game.currentGame.value?.playerHand"
                            :key="card.cardNumber"
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
                <div v-if="game.canHitOrStand.value" class="relative group">
                    <Button :disabled="aiHasRun" :class="`rounded-4xl ${aiRunClass}`" @click="aiRun">
                        {{ aiRunText }}
                    </Button>
                    <div class="absolute top-full left-1/2 transform max-w-[300px] -translate-x-1/2 mt-3 w-max px-2 py-1 text-sm text-white bg-gray-700 rounded shadow-lg md:opacity-0 opacity-100 group-hover:md:opacity-100 transition-opacity duration-300 ">
                        {{ aiToolTip }}
                    </div>
                </div>
                <Button v-if="game.canHitOrStand.value" @click="game.stand()">Stand</Button>
                <Button v-if="game.canReset.value" @click="reset">New game</Button>
                <div v-if="game.gameStatus.value == GameStatus.idle" class="flex flex-col items-center gap-4">
                    <input v-model.number="newBet" class="bg-secondary text-4xl text-center rounded-xl max-w-40 mt-40 md:mt-0" type="number">
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
const gemini = useGeminiApi();

const aiRunText = ref("?");
const aiToolTip = ref("Ask Gemini")
const aiHasRun = ref(false);
const aiRunClass = ref("bg-secondary text-primary hover:text-secondary");
const aiRun = async () => {
    const response = await gemini.generateText(`You are an AI model helping with a game of blackjack where the dealer has ${JSON.stringify(game.currentGame.value?.dealerHand)} with a total of ${game.dealerTotal.value} and you as the player have ${JSON.stringify(game.currentGame.value?.playerHand)} and a total of ${game.playerTotal.value}. The question is, should the player hit (get another card) or stand (let the dealer go). Keep the explanation shorter than 3 sentences`);
    const responseDeserialised: GeminiBlackjackResponse = JSON.parse(response);
    aiRunText.value = responseDeserialised.should_hit ? "Should hit" : "Should stand"
    aiRunClass.value = responseDeserialised.should_hit ? "bg-affirmative text-white" : "bg-destructive text-white";
    if (responseDeserialised.explanation) {
        aiToolTip.value = responseDeserialised.explanation;
    }
    aiHasRun.value = true;
}

const reset = () => {
    newBet.value = 100;
    aiRunText.value = "?";
    game.reset();
    aiHasRun.value = false;
    aiToolTip.value = "Ask Gemini";
    aiRunClass.value = "bg-secondary text-primary hover:text-secondary";
}

const newGame = async () => {
    if (newBet.value > 0) {
        await game.placeBetAndStartNewGame(newBet.value);
    }
}

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