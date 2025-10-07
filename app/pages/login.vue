<script setup lang="ts">
import type { Store } from 'pinia'
import Button from '~/components/ui/button/Button.vue'

const supabase = useSupabaseClient()
const email = ref('')

const signInWithOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: 'http://localhost:3000/confirm',
    }
  })
  if (error) console.log(error)
}

// const userState = useUserStore();
// const user = await userState.getUser();
const game = await useBlackjackGame();
onMounted(async () => {
    if (game.gameStatus.value === GameStatus.dealer_turn) {
        game.dealerPlay();
    }
});
</script>
<template>
  <div>
    <button @click="signInWithOtp">
      Sign In with E-Mail
    </button>
    <input
      v-model="email"
      type="email"
      class="bg-white color-black"
    />
    <div>
        user state: {{ game }} + {{ game.canBet }}
    </div>
    <Button @click="game.placeBetAndStartNewGame(100)">start</Button>
    <div> hand: {{ game.currentGame.value?.playerHand }}</div>
    <Button @click="game.hit()">hit</Button>
    <Button @click="game.stand()">stand</Button>
    <Button @click="game.reset()">reset</Button>
    
  </div>
</template>