
export const useCurrentgameStore = defineStore('currentGame', () => {
    const user = useUserStore();
    const id = ref("");
    const startedTimestamp = ref(Date.now());
    
    const startGame = (bet: number): GameHistoryEntry | undefined => {
        
    };

    const updatePayout = () => {
        user.updateBalance(bet);
    }
    return {id, startedTimestamp, }
})