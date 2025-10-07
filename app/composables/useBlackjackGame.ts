import { ref, computed } from 'vue'

export type CardSuit = '♠' | '♥' | '♦' | '♣'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  rank: CardRank
  suit: CardSuit
  isShown: boolean
}

export type GameResult = 'win' | 'lose' | 'push' | 'early-win' | 'early-push' | null

export enum GameStatus {
    idle = 0,
    player_turn = 1,
    dealer_turn = 2,
    finished = 3,
};

export interface GameHistoryEntry {
  id?: number,
  started_game: number,
  latest_timestamp: number
  bet: number
  playerHand: Card[]
  dealerHand: Card[]
  gameStatus: GameStatus
  result?: GameResult
  payout?: number
}

const CARD_RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const CARD_SUITS: CardSuit[] = ['♠', '♥', '♦', '♣']

export const useBlackjackGame = async () => {
    const userStore = await useUserStore();
    const user = await userStore.getUser();
    const currentGameStore = useCurrentgameStore();
    const currentGame = ref<GameHistoryEntry | undefined>(undefined);
    try {
        currentGame.value = await currentGameStore.getGame() ?? undefined;
    }
    catch (error) { console.warn(error)}
    
    const gameStatus = computed(() => currentGame.value?.gameStatus ? currentGame.value!.gameStatus : GameStatus.idle)
    const safeToShow = ref(false);
    
    safeToShow.value = !!currentGame.value

    const drawCard = (): Card => {
        const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)]!;
        const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)]!;
        return { rank, suit, isShown: false };
    }

    const calculateHandValue = (hand: Card[] | undefined): number => {
        if (!hand) {
            return 0;
        }

        let total = 0;
        let aces = 0;
        
        for (const card of hand) {
            switch (card.rank) {
                case 'A':
                    aces += 1;
                    total += 11;
                    break;
                case 'J':
                case 'Q':
                case 'K':
                    total += 10;
                    break;
                default:
                    total += parseInt(card.rank);
                    break;
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces -= 1;
        }

        return total;
    };

    // Computed Values
    const playerTotal = computed(() => calculateHandValue(currentGame.value?.playerHand));
    const dealerTotal = computed(() => calculateHandValue(currentGame.value?.dealerHand));
    const playerBusted = computed(() => playerTotal.value > 21);
    const dealerBusted = computed(() => dealerTotal.value > 21);
    const canHitOrStand = computed(() => gameStatus.value === GameStatus.player_turn && !playerBusted.value);
    const canBet = computed(() => gameStatus.value === GameStatus.idle && user!.value.current_balance > 0)
    const canReset = computed(() => gameStatus.value === GameStatus.finished);

    const finishGame =  async (result: GameResult) => {
        currentGame.value!.result = result;
        currentGame.value!.gameStatus = GameStatus.finished;
        await currentGameStore.finishGame(currentGame.value!);
        await userStore.updateUserProfile();
    }

    // Game logic
    const placeBetAndStartNewGame = async (betAmount: number): Promise<void> => {
        if (gameStatus.value !== GameStatus.idle) {
            throw new Error("Must finish current game");
        }
        if (betAmount <= 0) {
            throw new Error("Bet must be a positive number");
        }
        if (!user || user.value.currentBalance < betAmount) {
            throw new Error("Insufficient balance");
        }
        
        const newGame = await currentGameStore.startGame(betAmount);
        if (!newGame) {
            throw new Error("Failed to start a new game. Please reload the page and check your balance");
        }
        newGame.playerHand = [];
        newGame.dealerHand = [];

        currentGame.value = newGame;
        if (currentGame.value!.gameStatus !== GameStatus.idle) {
            safeToShow.value = true;
            return;
        }

        currentGame.value!.playerHand.push(drawCard());
        currentGame.value!.playerHand.push(drawCard());
        currentGame.value!.dealerHand.push(drawCard());

        currentGame.value!.gameStatus = playerTotal.value === 21 ? GameStatus.dealer_turn : GameStatus.player_turn;
        currentGame.value!.latest_timestamp = Date.now();
        if (currentGame.value.gameStatus !== GameStatus.dealer_turn) {
            await currentGameStore.updateGame(currentGame.value!);
        }
        safeToShow.value = true;
    };

    const determineWinner = async () => {
        if (dealerBusted.value) {
            await finishGame('win');
        }
        else if (playerTotal.value > dealerTotal.value) {
            await finishGame('win');
        }
        else if (playerTotal.value < dealerTotal.value) {
            await finishGame('lose');
        }
        else {
            await finishGame('push');
        }
    };

    const dealerPlay = async () => {
        // Dealer draws until 17 or higher
        while (dealerTotal.value < 17) {
            currentGame.value!.dealerHand.push(drawCard());
        }
        await determineWinner();
    }

    const hit = async () => {
        if (!canHitOrStand.value) {
            throw new Error('Cannot hit at this time')
        }

        currentGame!.value?.playerHand.push(drawCard());
        await currentGameStore.updateGame(currentGame.value!);

        if (playerBusted.value) {
            await finishGame('lose');
            return;
        }
        else {
            currentGame.value!.gameStatus = GameStatus.dealer_turn;
            currentGameStore.updateGame(currentGame.value!);
        }
    }

    const stand = async () => {
        if (!canHitOrStand.value) {
            throw new Error("Cannot stand at this time");
        }

        currentGame.value!.gameStatus = GameStatus.dealer_turn;
        await currentGameStore.updateGame(currentGame.value!);
    }

    const reset = () => {
        if (!canReset.value) {
            throw new Error("Cannot reset an in-progress game");
        }
        safeToShow.value = false;
        currentGame.value = undefined;
        console.warn("reset!")
    }

    const initOnMounted = async () => {
        if (currentGame.value?.gameStatus === GameStatus.dealer_turn) {
            await dealerPlay();
        }

        watch(() => currentGame.value?.gameStatus, async () => {
            if (currentGame.value?.gameStatus === GameStatus.dealer_turn) {
                await dealerPlay();
            }
        });
    }

    return {currentGame, gameStatus, safeToShow, playerTotal, dealerTotal, playerBusted, dealerBusted, canHitOrStand, canBet, canReset, placeBetAndStartNewGame, hit, stand, initOnMounted, reset}
}