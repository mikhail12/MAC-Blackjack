import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, nextTick, type Ref } from 'vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { useBlackjackGame } from '../../app/composables/useBlackjackGame';
import {
    GameStatus,
    type Card,
    type GameHistoryEntry,
} from '../../app/types/game';

process.env.NUXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NUXT_PUBLIC_SUPABASE_KEY ||= 'public-anon-key';
process.env.NUXT_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NUXT_SUPABASE_KEY ||= 'public-anon-key';
process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'public-anon-key';

const CARD_RANKS: Card['rank'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARD_SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣'];

interface UserShape {
    id: string;
    current_balance: number;
    currentBalance: number;
}

type UserRef = Ref<UserShape>;

interface UserStoreStub {
    getUser: () => Promise<UserRef>;
    updateUserProfile: () => Promise<void>;
}

interface CurrentGameStoreStub {
    getGame: () => Promise<GameHistoryEntry | null>;
    startGame: (bet: number) => Promise<GameHistoryEntry>;
    updateGame: (game: GameHistoryEntry) => Promise<void>;
    finishGame: (game: GameHistoryEntry) => Promise<boolean>;
}

type GameFactoryOptions = {
    userBalance?: number;
    existingGame?: GameHistoryEntry | null;
    startGameOverrides?: Partial<GameHistoryEntry>;
    startGameStatus?: GameStatus;
    finishGameResult?: boolean;
};

type SetupComposableResult = {
    composable: Awaited<ReturnType<typeof useBlackjackGame>>;
    userRef: UserRef;
    userStoreMock: UserStoreStub;
    currentGameStoreMock: CurrentGameStoreStub;
    finishGameCalls: GameHistoryEntry[];
};

const clone = <T>(value: T): T => (value == null ? value : JSON.parse(JSON.stringify(value)));

const randomForIndex = (idx: number, length: number) => (idx + 0.1) / length;

const sequenceForCards = (
    cards: Array<{ rank: Card['rank']; suit?: Card['suit'] }>,
): number[] =>
    cards.flatMap(({ rank, suit = '♠' }) => {
        const rankIdx = CARD_RANKS.indexOf(rank);
        const suitIdx = CARD_SUITS.indexOf(suit);
        if (rankIdx === -1) {
            throw new Error(`Unknown rank ${rank}`);
        }
        if (suitIdx === -1) {
            throw new Error(`Unknown suit ${suit}`);
        }
        return [randomForIndex(rankIdx, CARD_RANKS.length), randomForIndex(suitIdx, CARD_SUITS.length)];
    });

const createCard = (rank: Card['rank'], suit: Card['suit'] = '♠', isShown = false): Card => ({
    rank,
    suit,
    isShown,
});

const makeGame = (overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry => ({
    id: overrides.id ?? 1,
    started_game: overrides.started_game ?? Date.now(),
    latest_timestamp: overrides.latest_timestamp ?? Date.now(),
    bet: overrides.bet ?? 0,
    playerHand: overrides.playerHand ? overrides.playerHand.map(card => ({ ...card })) : [],
    dealerHand: overrides.dealerHand ? overrides.dealerHand.map(card => ({ ...card })) : [],
    gameStatus: overrides.gameStatus ?? GameStatus.idle,
    result: overrides.result ?? null,
    payout: overrides.payout,
});

let userStoreMock: UserStoreStub;
let currentGameStoreMock: CurrentGameStoreStub;

mockNuxtImport('useUserStore', () => () => userStoreMock);
mockNuxtImport('useCurrentgameStore', () => () => currentGameStoreMock);
mockNuxtImport('useRuntimeConfig', () => () => ({
    public: {
        SUPABASE_URL: "https://test.supabase.com",
        SUPABASE_KEY: "mypublickey",
    },
}));

const setupComposable = async (options: GameFactoryOptions = {}): Promise<SetupComposableResult> => {
    const {
        userBalance = 1000,
        existingGame = null,
        startGameOverrides = {},
        startGameStatus = GameStatus.idle,
        finishGameResult = true,
    } = options;

    setActivePinia(createTestingPinia({ stubActions: false, createSpy: vi.fn }));

    const userRef = ref({
        id: 'test-user',
        current_balance: userBalance,
        currentBalance: userBalance,
    });

    const finishGameCalls: GameHistoryEntry[] = [];

    userStoreMock = {
        getUser: vi.fn(async () => userRef),
        updateUserProfile: vi.fn(async () => undefined),
    };

    const startGame = vi.fn(async (bet: number) => {
        const base = makeGame({ ...startGameOverrides, bet, gameStatus: startGameStatus });
        base.playerHand = [];
        base.dealerHand = [];
        return clone(base);
    });

    const updateGame = vi.fn(async () => undefined);

    const finishGame = vi.fn(async (game: GameHistoryEntry) => {
        finishGameCalls.push(clone(game));
        return finishGameResult;
    });

    currentGameStoreMock = {
        getGame: vi.fn(async () => clone(existingGame)),
        startGame,
        updateGame,
        finishGame,
    };

    const composable = await useBlackjackGame();

    await composable.initOnMounted();

    return {
        composable,
        userRef,
        userStoreMock,
        currentGameStoreMock,
        finishGameCalls,
    };
};

const mockRandomSequence = (sequence: number[]) => {
    let callIndex = 0;
    return vi.spyOn(Math, 'random').mockImplementation(() => {
        const value = sequence[callIndex];
        callIndex = Math.min(callIndex + 1, sequence.length - 1);
        return value;
    });
};

describe('useBlackjackGame', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initial State', () => {
        describe('new user', () => {
            it('should initialize with the injected user', async () => {
                const {
                    composable: { canBet },
                    userRef,
                } = await setupComposable({ userBalance: 500 });

                expect(userRef.value.current_balance).toBe(500);
                expect(canBet.value).toBe(true);
            });

            it('should start in idle status', async () => {
                const {
                    composable: { gameStatus },
                } = await setupComposable();

                expect(gameStatus.value).toBe(GameStatus.idle);
            });

            it('should have empty hands initially', async () => {
                const {
                    composable: { currentGame },
                } = await setupComposable();

                expect(currentGame.value).toBeUndefined();
            });

            it('should have zero current bet', async () => {
                const {
                    composable: { currentGame },
                } = await setupComposable();

                expect(currentGame.value?.bet ?? 0).toBe(0);
            });

            it('should have null game result', async () => {
                const {
                    composable: { currentGame },
                } = await setupComposable();

                expect(currentGame.value?.result ?? null).toBeNull();
            });

            it('should have empty history', async () => {
                const {
                    composable: { currentGame },
                } = await setupComposable();

                expect(currentGame.value).toBeUndefined();
            });

            it('should not be ready to present cards to user', async () => {
                const {
                    composable: { safeToShow },
                } = await setupComposable();

                expect(safeToShow.value).toBe(false);
            });
        });
    });

    describe('placeBetAndStartNewGame', () => {
        it('should start valid bets', async () => {
            const {
                composable: { placeBetAndStartNewGame },
                currentGameStoreMock,
            } = await setupComposable();

            const randomSpy = mockRandomSequence(
                sequenceForCards([
                    { rank: '10' },
                    { rank: '7' },
                    { rank: '5' },
                ]),
            );

            await placeBetAndStartNewGame(100);

            expect(currentGameStoreMock.startGame).toHaveBeenCalledWith(100);
            expect(randomSpy).toHaveBeenCalled();
        });

        it("should throw error when betting more than user's current balance", async () => {
            const {
                composable: { placeBetAndStartNewGame },
            } = await setupComposable({ userBalance: 50 });

            await expect(placeBetAndStartNewGame(100)).rejects.toThrow('Insufficient balance');
        });

        it('should throw error when betting zero or negative', async () => {
            const {
                composable: { placeBetAndStartNewGame },
            } = await setupComposable();

            await expect(placeBetAndStartNewGame(0)).rejects.toThrow('Bet must be a positive number');
            await expect(placeBetAndStartNewGame(-5)).rejects.toThrow('Bet must be a positive number');
        });

        it('should throw error if trying to start while there is a game in play', async () => {
            const existingGame = makeGame({
                bet: 50,
                gameStatus: GameStatus.player_turn,
            });

            const {
                composable: { placeBetAndStartNewGame },
            } = await setupComposable({ existingGame });

            await expect(placeBetAndStartNewGame(25)).rejects.toThrow('Must finish current game');
        });

        it('should deal cards at start of game', async () => {
            const {
                composable: { placeBetAndStartNewGame, currentGame },
            } = await setupComposable();

            const randomSpy = mockRandomSequence(
                sequenceForCards([
                    { rank: '9' },
                    { rank: '7' },
                    { rank: '5' },
                ]),
            );

            await placeBetAndStartNewGame(50);

            expect(randomSpy).toHaveBeenCalledTimes(6);
            expect(currentGame.value?.playerHand).toHaveLength(2);
            expect(currentGame.value?.dealerHand).toHaveLength(1);
            expect(currentGame.value?.gameStatus).toBe(GameStatus.player_turn);
        });

        describe('player immediately gets 21', () => {
            it("should finish game with 'win' when the player hits 21 immediately", async () => {
                const {
                    composable: { placeBetAndStartNewGame, currentGame },
                    currentGameStoreMock,
                } = await setupComposable();

                const randomSpy = mockRandomSequence(
                    sequenceForCards([
                        { rank: 'A' },
                        { rank: 'K' },
                        { rank: '9' },
                        { rank: '8' },
                    ]),
                );

                await placeBetAndStartNewGame(100);

                await nextTick();
                await nextTick();
                await vi.waitFor(() => {
                    expect(currentGame.value?.gameStatus).toBe(GameStatus.finished);
                });

                expect(randomSpy).toHaveBeenCalled();
                expect(currentGame.value?.playerHand).toHaveLength(2);
                expect(currentGame.value?.dealerHand.length).toBeGreaterThanOrEqual(2);
                expect(currentGameStoreMock.updateGame).toHaveBeenCalled();
                expect(currentGame.value?.result).toBe('win');
                expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'win' }));
                expect(currentGame.value?.gameStatus).toBe(GameStatus.finished);
            });

            it("should finish game with 'push' when both get 21", async () => {
                const {
                    composable: { placeBetAndStartNewGame, currentGame },
                    currentGameStoreMock,
                } = await setupComposable();

                const randomSpy = mockRandomSequence(
                    sequenceForCards([
                        { rank: 'A' },
                        { rank: 'K' },
                        { rank: 'K' },
                        { rank: 'A' },
                    ]),
                );

                await placeBetAndStartNewGame(100);

                await nextTick();
                await nextTick();
                await vi.waitFor(() => {
                    expect(currentGame.value?.gameStatus).toBe(GameStatus.finished);
                });

                expect(randomSpy).toHaveBeenCalled();
                expect(currentGame.value?.playerHand).toHaveLength(2);
                expect(currentGame.value?.dealerHand.length).toBeGreaterThanOrEqual(2);
                expect(currentGame.value?.result).toBe('push');
                expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'push' }));
            });
        });

        it("should continue to player's turn if player doesn't immediately get 21", async () => {
            const {
                composable: { placeBetAndStartNewGame, gameStatus, safeToShow },
            } = await setupComposable();

            mockRandomSequence(
                sequenceForCards([
                    { rank: '10' },
                    { rank: '7' },
                    { rank: '6' },
                ]),
            );

            await placeBetAndStartNewGame(75);

            expect(gameStatus.value).toBe(GameStatus.player_turn);
            expect(safeToShow.value).toBe(true);
        });
    });

    describe('calculateHandValue', () => {
        it('should calculate number cards correctly', async () => {
            const {
                composable: { currentGame, playerTotal },
            } = await setupComposable();

            currentGame.value = makeGame({
                playerHand: [createCard('2'), createCard('3'), createCard('4')],
            });

            await nextTick();

            expect(playerTotal.value).toBe(9);
        });

        it('should treat face cards as 10', async () => {
            const {
                composable: { currentGame, playerTotal },
            } = await setupComposable();

            currentGame.value = makeGame({
                playerHand: [createCard('J'), createCard('Q')],
            });

            await nextTick();

            expect(playerTotal.value).toBe(20);
        });

        describe('aces', () => {
            it('should be treated as 11 when possible', async () => {
                const {
                    composable: { currentGame, playerTotal },
                } = await setupComposable();

                currentGame.value = makeGame({
                    playerHand: [createCard('A'), createCard('8')],
                });

                await nextTick();

                expect(playerTotal.value).toBe(19);
            });

            it('should be treated as 1 if 11 would bust', async () => {
                const {
                    composable: { currentGame, playerTotal },
                } = await setupComposable();

                currentGame.value = makeGame({
                    playerHand: [createCard('A'), createCard('9'), createCard('K')],
                });

                await nextTick();

                expect(playerTotal.value).toBe(20);
            });

            it('should treat multiple aces correctly', async () => {
                const {
                    composable: { currentGame, playerTotal },
                } = await setupComposable();

                currentGame.value = makeGame({
                    playerHand: [createCard('A'), createCard('A'), createCard('9')],
                });

                await nextTick();

                expect(playerTotal.value).toBe(21);
            });
        });
    });

    describe('player hit', () => {
        it("should throw error if hit outside of player's turn", async () => {
            const {
                composable: { currentGame, hit },
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('7')],
            });

            await expect(hit()).rejects.toThrow('Cannot hit at this time');
        });

        it("should continue to dealer's turn when player's hit doesn't bust", async () => {
            const {
                composable: { currentGame, hit },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.player_turn,
                playerHand: [createCard('10'), createCard('6')],
                dealerHand: [createCard('10'), createCard('6')],
            });

            const randomSpy = mockRandomSequence(
                sequenceForCards([
                    { rank: '5' },
                    { rank: '2' },
                ]),
            );

            await hit();

            expect(randomSpy).toHaveBeenCalled();
            expect(currentGame.value?.playerHand).toHaveLength(3);
            expect(currentGameStoreMock.updateGame).toHaveBeenCalledTimes(3);
            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'win' }));
            expect(currentGame.value?.gameStatus).toBe(GameStatus.finished);
        });

        it("should end game with lose when player's hit busts", async () => {
            const {
                composable: { currentGame, hit },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.player_turn,
                playerHand: [createCard('10'), createCard('9')],
                dealerHand: [createCard('10'), createCard('7')],
            });

            mockRandomSequence(
                sequenceForCards([
                    { rank: '5' },
                ]),
            );

            await hit();

            expect(currentGame.value?.playerHand).toHaveLength(3);
            expect(currentGame.value?.result).toBe('lose');
            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'lose' }));
        });
    });

    describe('player stand', () => {
        it("should throw error if stand outside of player's turn", async () => {
            const {
                composable: { currentGame, stand },
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('7')],
            });

            await expect(stand()).rejects.toThrow('Cannot stand at this time');
        });

        it("should continue to dealer's turn", async () => {
            const {
                composable: { currentGame, stand },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.player_turn,
                playerHand: [createCard('10'), createCard('7')],
                dealerHand: [createCard('9'), createCard('6')],
            });

            mockRandomSequence(
                sequenceForCards([
                    { rank: '7' },
                ]),
            );

            await stand();

            expect(currentGameStoreMock.updateGame).toHaveBeenCalled();
            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'win' }));
            expect(currentGame.value?.gameStatus).toBe(GameStatus.finished);
        });
    });

    describe('dealerPlay', () => {
        it('dealer should hit on 16 or less', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('9')],
                dealerHand: [createCard('9'), createCard('7')],
            });

            const randomSpy = mockRandomSequence(sequenceForCards([{ rank: '2' }]));

            await dealerPlay();

            expect(randomSpy).toHaveBeenCalled();
            expect(currentGame.value?.dealerHand.length).toBeGreaterThan(2);
            expect(currentGameStoreMock.finishGame).toHaveBeenCalled();
        });

        it('dealer should continue to hit until it reaches 17 or higher', async () => {
            const {
                composable: { currentGame, dealerPlay },
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('9')],
                dealerHand: [createCard('6'), createCard('4')],
            });

            mockRandomSequence(
                sequenceForCards([
                    { rank: '3' },
                    { rank: '4' },
                ]),
            );

            await dealerPlay();

            const dealerTotal = currentGame.value ? currentGame.value.dealerHand.reduce(
                (sum, card) =>
                    sum +
                    (card.rank === 'A'
                        ? 11
                        : ['K', 'Q', 'J'].includes(card.rank)
                        ? 10
                        : Number(card.rank)),
                0,
            ) : 0;

            expect(dealerTotal).toBeGreaterThanOrEqual(17);
        });

        it('dealer should stand on 17 or more', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            const dealerHand = [createCard('10'), createCard('7')];
            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('9'), createCard('7')],
                dealerHand,
            });

            const randomSpy = vi.spyOn(Math, 'random');

            await dealerPlay();

            expect(randomSpy).not.toHaveBeenCalled();
            expect(currentGame.value?.dealerHand).toHaveLength(dealerHand.length);
            expect(currentGameStoreMock.finishGame).toHaveBeenCalled();
        });

        it('should continue to determineWinner()', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('7')],
                dealerHand: [createCard('10'), createCard('6')],
            });

            mockRandomSequence(sequenceForCards([{ rank: '2' }]));

            await dealerPlay();

            expect(currentGameStoreMock.finishGame).toHaveBeenCalled();
            expect(currentGame.value?.result).toBeDefined();
        });
    });

    describe('determineWinner', () => {
        it('should win when player total > dealer total', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('9')],
                dealerHand: [createCard('10'), createCard('8')],
            });

            await dealerPlay();

            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'win' }));
            expect(currentGame.value?.result).toBe('win');
        });

        it('should win when the dealer got busted', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('7')],
                dealerHand: [createCard('K'), createCard('Q'), createCard('2')],
            });

            await dealerPlay();

            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'win' }));
            expect(currentGame.value?.result).toBe('win');
        });

        it('should lose when the player total < dealer total', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('9'), createCard('8')],
                dealerHand: [createCard('10'), createCard('9')],
            });

            await dealerPlay();

            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'lose' }));
            expect(currentGame.value?.result).toBe('lose');
        });

        it('should push when the player total is equal to the dealer total', async () => {
            const {
                composable: { currentGame, dealerPlay },
                currentGameStoreMock,
            } = await setupComposable();

            currentGame.value = makeGame({
                gameStatus: GameStatus.dealer_turn,
                playerHand: [createCard('10'), createCard('8')],
                dealerHand: [createCard('9'), createCard('9')],
            });

            await dealerPlay();

            expect(currentGameStoreMock.finishGame).toHaveBeenCalledWith(expect.objectContaining({ result: 'push' }));
            expect(currentGame.value?.result).toBe('push');
        });
    });
});

