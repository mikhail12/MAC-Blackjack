import { error } from 'happy-dom/lib/PropertySymbol.js'
import { ref, computed, readonly } from 'vue'

export type CardSuit = '♠' | '♥' | '♦' | '♣'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  rank: CardRank
  suit: CardSuit
  isShown: boolean
}

export type GameStatus = 'idle' | 'player-turn' | 'dealer-turn' | 'finished'
export type GameResult = 'win' | 'lose' | 'push' | 'early-win' | 'early-push' | null

export interface GameHistoryEntry {
  id?: string
  startedTimestamp: number,
  timestamp: number
  bet: number
  playerHand: Card[]
  dealerHand: Card[]
  gameStatus: GameStatus
  result?: GameResult
  payout?: number
}

const CARD_RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const CARD_SUITS: CardSuit[] = ['♠', '♥', '♦', '♣']

export function useBlackjack(initialChips = 1000) {
  // State
  const chips = ref(initialChips)
  const currentBet = ref(0)
  const playerHand = ref<Card[]>([])
  const dealerHand = ref<Card[]>([])
  const gameStatus = ref<GameStatus>('betting')
  const gameResult = ref<GameResult>(null)
  const history = ref<>([])

  const drawCard = (): Card => {
    const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)]!
    const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)]!
    return { rank, suit, isShown: false }
  }

  const calculateHandValue = (hand: Card[]): number => {
    let total = 0
    let aces = 0

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

    // Adjust for aces
    while (total > 21 && aces > 0) {
      total -= 10
      aces -= 1
    }

    return total
  }

  // Computed values
  const playerTotal = computed(() => calculateHandValue(playerHand.value))
  const dealerTotal = computed(() => calculateHandValue(dealerHand.value))
  const playerBusted = computed(() => playerTotal.value > 21)
  const dealerBusted = computed(() => dealerTotal.value > 21)
  const canHit = computed(() => gameStatus.value === 'player-turn' && !playerBusted.value)
  const canStand = computed(() => gameStatus.value === 'player-turn' && !playerBusted.value)
  const canBet = computed(() => gameStatus.value === 'betting' && chips.value > 0)

  // Helper: Check for blackjack (Ace + 10-value card)
    const isBlackjack = (hand: Card[]): boolean => {
        if (hand.length !== 2) return false
        
        const hasAce = hand.some(card => card.rank === 'A')
        const hasTenValue = hand.some(card => ['10', 'J', 'Q', 'K'].includes(card.rank))
        
        return hasAce && hasTenValue
    }

  // Place bet and start game
  const placeBet = (amount: number): void => {
    if (gameStatus.value !== 'betting') {
      throw new Error('Cannot place bet at this time')
    }
    if (amount <= 0) {
      throw new Error('Bet must be greater than 0')
    }
    if (amount > chips.value) {
      throw new Error('Insufficient chips')
    }

    // Reset game state
    playerHand.value = []
    dealerHand.value = []
    gameResult.value = null

    gameStore.startGame(amount);

    // Deal initial cards
    playerHand.value.push(drawCard())
    playerHand.value.push(drawCard())
    dealerHand.value.push(drawCard())

    // Check for player blackjack
    if (isBlackjack(playerHand.value)) {
      // Dealer needs to check for blackjack too
      dealerHand.value.push(drawCard())
      if (isBlackjack(dealerHand.value)) {
        // Push
        finishGame('push')
      } else {
        // Player blackjack wins (pays 3:2)
        finishGame('blackjack')
      }
    } else {
      gameStatus.value = 'player-turn'
    }
  }

  // Player hits
  const hit = (): void => {
    if (!canHit.value) {
      throw new Error('Cannot hit at this time')
    }

    playerHand.value.push(drawCard())

    if (playerBusted.value) {
      finishGame('lose')
    }
  }

  // Player stands
  const stand = (): void => {
    if (!canStand.value) {
      throw new Error('Cannot stand at this time')
    }

    gameStatus.value = 'dealer-turn'
    dealerPlay()
  }

  // Dealer plays according to rules
  const dealerPlay = (): void => {
    // Dealer draws until 17 or higher
    while (dealerTotal.value < 17) {
      dealerHand.value.push(drawCard())
    }

    determineWinner()
  }

  // Determine winner and finish game
  const determineWinner = (): void => {
    if (dealerBusted.value) {
      finishGame('win')
    } else if (playerTotal.value > dealerTotal.value) {
      finishGame('win')
    } else if (playerTotal.value < dealerTotal.value) {
      finishGame('lose')
    } else {
      finishGame('push')
    }
  }

  // Finish game and update chips/history
  const finishGame = (result: GameResult): void => {
    gameResult.value = result
    gameStatus.value = 'finished'

    let payout = 0

    switch (result) {
      case 'win':
        payout = currentBet.value * 2
        chips.value += payout
        break
      case 'push':
        payout = currentBet.value
        chips.value += payout
        break
      case 'lose':
        payout = 0
        break
    }

    // Add to history
    history.value.unshift({
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      bet: currentBet.value,
      playerHand: [...playerHand.value],
      dealerHand: [...dealerHand.value],
      result: result,
      payout: payout - currentBet.value // Net payout (profit/loss)
    })
  }

  // Reset for next round
  const newRound = (): void => {
    if (gameStatus.value !== 'finished') {
      throw new Error('Cannot start new round - current game not finished')
    }

    currentBet.value = 0
    playerHand.value = []
    dealerHand.value = []
    gameStatus.value = 'betting'
    gameResult.value = null
  }

  // Reset entire game
  const resetGame = (newChips = initialChips): void => {
    chips.value = newChips
    currentBet.value = 0
    playerHand.value = []
    dealerHand.value = []
    gameStatus.value = 'betting'
    gameResult.value = null
    history.value = []
  }

  return {
    // State (readonly for external use)
    chips: readonly(chips),
    currentBet: readonly(currentBet),
    playerHand: readonly(playerHand),
    dealerHand: readonly(dealerHand),
    gameStatus: readonly(gameStatus),
    gameResult: readonly(gameResult),
    history: readonly(history),

    // Computed
    playerTotal,
    dealerTotal,
    playerBusted,
    dealerBusted,
    canHit,
    canStand,
    canBet,

    // Actions
    placeBet,
    hit,
    stand,
    newRound,
    resetGame
  }
}


export function useBlackjackRunner() {
    let user = inject<Ref<User>>(USERSTATE);
    if (!user) {
        user = useUserState();
        if (!user) {
            throw new Error("Cannot play blackjack without an attached user")
        }
    }

    // const gameRepository = inject<GameRepository>(GAMEREPOSITORY);
    // if (!gameRepository) {
    //     gameRepository = useDatabaseConnection();
    //     if (!gameRepository) {
    //         throw new Error("Cannot play blackjack without attached db connection")
    //     }
    // }
    const currentBet = ref(0);
    const playerHand = ref<Card[]>([]);
    const dealerHand = ref<Card[]>([]);
    const gameStatus = ref<GameStatus>('idle');
    const gameResult = ref<GameResult>(null);
    const safeToShow = ref(false);
    const history = ref<GameHistoryEntry[]>([]); // I'll pull this from the database

    const drawCard = (): Card => {
        const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)]!;
        const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)]!;
        return { rank, suit, isShown: false };
    }

    const calculateHandValue = (hand: Card[]): number => {
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
    const playerTotal = computed(() => calculateHandValue(playerHand.value));
    const dealerTotal = computed(() => calculateHandValue(dealerHand.value));
    const playerBusted = computed(() => playerTotal.value > 21);
    const dealerBusted = computed(() => dealerTotal.value > 21);
    const canHitOrStand = computed(() => gameStatus.value === 'player-turn' && !playerBusted.value);
    const canBet = computed(() => gameStatus.value === 'idle' && user!.value.balance > 0)

    const finishGame = (result: GameResult): void => {
        gameResult.value = result
        gameStatus.value = 'finished'

        let payout = 0

        switch (result) {
            case 'win':
                payout = currentBet.value * 2
                user!.value.balance += payout
                break
            case 'push':
                payout = currentBet.value
                user!.value.balance += payout
                break
            case 'lose':
                payout = 0
                break
        }

        updateGameHistory();
    }

    const updateGameHistory = () => {
        if (gameStatus.value !== 'idle' && history.value.length > 0 ) {
            history.value[0] = {
                ...history.value[0]!,
                timestamp: Date.now(),
                playerHand: [...playerHand.value],
                dealerHand: [...dealerHand.value],
                gameStatus: gameStatus.value,
            };
        }
    }

    // Game logic
    const placeBetAndStartNewGame = (betAmount: number): void => {
        if (gameStatus.value !== 'idle') {
            throw new Error("Must finish current game");
        }
        if (betAmount <= 0) {
            throw new Error("Bet must be a positive number");
        }
        if (!user || user.value.balance < betAmount) {
            throw new Error("Insufficient balance");
        }

        currentBet.value = betAmount;
        user.value.balance -= betAmount;
        
        playerHand.value = []
        dealerHand.value = []
        gameResult.value = null
        safeToShow.value = false;

        playerHand.value.push(drawCard());
        playerHand.value.push(drawCard());
        dealerHand.value.push(drawCard());

        history.value.unshift({
            startedTimestamp: Date.now(),
            timestamp: Date.now(),
            bet: currentBet.value,
            playerHand: [...playerHand.value],
            dealerHand: [...dealerHand.value],
            gameStatus: 'player-turn',
        });

        if (calculateHandValue(playerHand.value) == 21) {
            // Not sure if best approach here as maybe better to push the dealer turn here instead
            // so the user's cards are shown first.
            dealerHand.value.push(drawCard())
            if (calculateHandValue(dealerHand.value) == 21) {
                finishGame('push');
            }
            else {
                finishGame('early-win');
            }
        } else {
            // save to db
        }
        safeToShow.value = true;
    };

    const dealerPlay = (): void => {
        // Dealer draws until 17 or higher
        while (dealerTotal.value < 17) {
            dealerHand.value.push(drawCard());
        }

        determineWinner();
    }

    const determineWinner = () => {
        if (dealerBusted.value) {
            finishGame('win');
        }
        else if (playerTotal.value > dealerTotal.value) {
            finishGame('win');
        }
        else if (playerTotal.value < dealerTotal.value) {
            finishGame('lose');
        }
        else {
            finishGame('push');
        }
        updateGameHistory();
    };

    const hit = (): void => {
        if (!canHitOrStand.value) {
            throw new Error('Cannot hit at this time')
        }

        playerHand.value.push(drawCard())
        if (playerBusted.value) {
            finishGame('lose')
        }
        else {
            gameStatus.value = 'dealer-turn'
            dealerPlay();
        }
        updateGameHistory();
    }

    const stand = () => {
        if (!canHitOrStand.value) {
            throw new Error("Cannot stand at this time");
        }

        gameStatus.value = 'dealer-turn';
        dealerPlay();
    }
}