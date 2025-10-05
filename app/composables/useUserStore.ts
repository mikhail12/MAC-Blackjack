import { defineStore } from "pinia";

export const useUserStore = defineStore('user', () => {
    const localUser = useLocalStorage<User>("Current User", { currentBalance: 1000, history: []}, { initOnMounted: true })
    
    const user = ref(toRaw(localUser));
    const currentBalance = computed(() => user.value.currentBalance);
    const history = computed(() => user.value.history);
    console.warn(localHistory.value);
    
    const addNewGame = (game: GameHistoryEntry): void => {
        history.value.push(game);
    };
    
    return { currentBalance, history, addNewGame};
});

export interface User {
    currentBalance: number,
    history: GameHistoryEntry[],
}