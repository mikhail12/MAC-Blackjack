import type { InjectionKey } from "vue";

export const USERSTATE: InjectionKey<ReturnType<typeof ref<User>>> = Symbol('user-state');

export interface User {
    balance: number,
    saveGame?: () => {},
    history?: GameHistoryEntry[],
    currentGame?: GameHistoryEntry,
}

export default function useUserState() {
    const newUser = {
        balance: 1000,
    }
    const currentUser = ref(newUser);
    /*
    This is where we'll get or initialise the game user with the db
    */
    // Put a watcher on the user balance to save it to db on change as well.
    provide(USERSTATE, currentUser);

    return currentUser;
}