import { defineStore } from "pinia";
import type { Database, Json } from "~/types/database.types";
import {
    GameStatus,
    type Card,
    type CardRank,
    type CardSuit,
    type GameHistoryEntry,
    type GameResult,
} from "~/types/game";

export const useCurrentgameStore = defineStore('currentGame', () => {
    const id = ref("");
    const startedTimestamp = ref(Date.now());

    const toTimestamp = (value: number | string | null | undefined): number => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string") {
            const numeric = Number(value);
            if (Number.isFinite(numeric)) {
                return numeric;
            }
            const parsed = Date.parse(value);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
        return Date.now();
    };

    const isCardRank = (rank: unknown): rank is CardRank =>
        typeof rank === "string" && [
            'A',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            'J',
            'Q',
            'K',
        ].includes(rank as string);

    const isCardSuit = (suit: unknown): suit is CardSuit =>
        typeof suit === "string" && ['♠', '♥', '♦', '♣'].includes(suit as string);

    const parseCard = (value: Json): Card | null => {
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value) as Json;
                return parseCard(parsed);
            }
            catch {
                return null;
            }
        }

        if (value && typeof value === "object" && !Array.isArray(value)) {
            const maybeCard = value as Record<string, Json>;
            if (isCardRank(maybeCard.rank) && isCardSuit(maybeCard.suit)) {
                return {
                    rank: maybeCard.rank,
                    suit: maybeCard.suit,
                    isShown: Boolean(maybeCard.isShown),
                    cardNumber: Number(maybeCard.cardNumber),
                };
            }
        }

        return null;
    };

    const parseHand = (hand: Json | null): Card[] => {
        if (!hand) {
            return [];
        }

        const values = Array.isArray(hand) ? hand : typeof hand === "string" ? (() => {
            try {
                const parsed = JSON.parse(hand) as Json;
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                return [];
            }
        })() : [];

        return values
            .map(parseCard)
            .filter((card): card is Card => Boolean(card));
    };

    const serializeHand = (hand: Card[]): Json =>
        hand.map(({ rank, suit, isShown, cardNumber }) => ({ rank, suit, isShown, cardNumber }));

    const toGameStatus = (status: number | null | undefined): GameStatus => {
        if (status === GameStatus.idle ||
            status === GameStatus.player_turn ||
            status === GameStatus.dealer_turn ||
            status === GameStatus.finished) {
            return status;
        }
        return GameStatus.idle;
    };

    const toGameResult = (result: string | null | undefined): GameResult => {
        if (result === 'win' || result === 'lose' || result === 'push') {
            return result;
        }
        return null;
    };

    const normalizeGame = (
        raw:
            | Database['public']['Tables']['game']['Row']
            | Database['public']['Functions']['trystartgamewithbet']['Returns'][number],
    ): GameHistoryEntry => ({
        id: raw.id,
        started_game: toTimestamp(raw.started_game),
        latest_timestamp: toTimestamp(raw.latest_timestamp ?? raw.started_game),
        bet: raw.bet ?? 0,
        playerHand: parseHand(raw.playerHand ?? null),
        dealerHand: parseHand(raw.dealerHand ?? null),
        gameStatus: toGameStatus(raw.gameStatus ?? null),
        result: toGameResult(raw.result ?? null) ?? undefined,
        payout: raw.payout ?? undefined,
    });
    
    const startGame = async (bet: number): Promise<GameHistoryEntry | undefined> => {
        const supabase = useSupabaseClient<Database>();
        const betData = { betvalue: bet};
        const { data, error } = await supabase.rpc("trystartgamewithbet", betData);
        const record = Array.isArray(data) ? data[0] : data;
        if (record) {
            const userStore = await useUserStore();
            await userStore.updateUserProfile();
            return normalizeGame(record);
        }
        if (error) {
            console.warn(error);
        }
        return undefined;
    };

    const updateGame = async (game: GameHistoryEntry): Promise<void> => {
        const supabase = useSupabaseClient<Database>();
        const { error } = await supabase
            .from("game")
            .update({
                playerHand: serializeHand(game.playerHand),
                dealerHand: serializeHand(game.dealerHand),
                gameStatus: game.gameStatus,
                result: game.result,
                payout: game.payout,
                latest_timestamp: new Date(game.latest_timestamp).toISOString(),
            })
            .eq('id', game.id!);

        if (error) {
            console.warn(error);
        }
    }

    const getGame = async (): Promise<GameHistoryEntry | null> => {
        const supabase = useSupabaseClient<Database>();
        const { data, error } = await supabase
            .from('game')
            .select()
            .neq("gameStatus",GameStatus.finished)
            .limit(1)
            .maybeSingle();

        if (error) {
            return null;
        }

        if (!data) {
            return null;
        }

        return normalizeGame(data);
    }

    const getHistoryPage = async (page: number): Promise<GameHistoryEntry[]> => {

        const runtimeConfig = useRuntimeConfig();
        const PAGE_LIMIT = Number(runtimeConfig.public.PAGE_LIMIT);
        const supabase = useSupabaseClient<Database>();

        const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
        const offset = (safePage - 1) * PAGE_LIMIT;
        const { data, error } = await supabase
            .from("game")
            .select()
            .order("latest_timestamp", { ascending: false, nullsFirst: false })
            .range(offset, offset + PAGE_LIMIT - 1);

        if (error || !data) {
            if (error) {
                console.warn(error);
            }
            return [];
        }

        return data.map(normalizeGame);
    };

    const getHistoryLength = async (): Promise<number> => {
        const supabase = await useSupabaseClient<Database>();

        const { data, error } = await supabase
            .from("game")
            .select('*', { count: 'exact' });
        if (error || !data) {
            if (error) {
                console.warn(error);
            }
            return 0;
        }

        return data.length;
    }

    const finishGame = async (game: GameHistoryEntry): Promise<boolean> => {
        const supabase = useSupabaseClient<Database>();
        await updateGame(game);
        const data = await supabase.rpc("process_pending_game_payout");
        return !!data.data
    }

    return {id, startedTimestamp, startGame, updateGame, getGame, getHistoryPage, finishGame, getHistoryLength}
})