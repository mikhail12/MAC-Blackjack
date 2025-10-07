import type { Database } from "~/types/database.types";

export const useCurrentgameStore = defineStore('currentGame', () => {
    const supabase = useSupabaseClient<Database>();
    const id = ref("");
    const startedTimestamp = ref(Date.now());
    
    const startGame = async (bet: number): Promise<GameHistoryEntry | undefined> => {
        const betData = { betvalue: bet};
        const { data, error } = await supabase.rpc("trystartgamewithbet", betData).single();
        if (data) {
            const userStore = await useUserStore();
            await userStore.updateUserProfile();
            return data;
        }
        console.warn(error);
        return undefined;
    };

    const updateGame = async (game: GameHistoryEntry): Promise<void> => {
        const error = await supabase

            .from("game")
            .update({
                playerHand: JSON.stringify(game.playerHand),
                dealerHand: JSON.stringify(game.dealerHand),
                gameStatus: game.gameStatus,
                result: game.result,
                payout: game.payout,
            })
            // .update({ playerHand: game.playerHand })
            .eq('id', game.id!);
        console.warn(error);
    }

    const getGame = async (): Promise<GameHistoryEntry | null> => {
        const { data, error } = await supabase
            .from('game')
            .select()
            .neq("gameStatus",3)
            .limit(1)
            .single()
            .overrideTypes<GameHistoryEntry, { merge: false }>()
        
        if (error) {
            return null;
        }

        return data;
    }

    const finishGame = async (game: GameHistoryEntry): Promise<boolean> => {
        await updateGame(game);
        const data = await supabase.rpc("process_pending_game_payout");
        return !!data.data
    }

    return {id, startedTimestamp, startGame, updateGame, getGame, finishGame}
})