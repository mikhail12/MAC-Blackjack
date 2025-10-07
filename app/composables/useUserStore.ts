import { defineStore } from "pinia";
import type { Database } from "~/types/database.types";

export const useUserStore = defineStore('user', () => {
    // const localUser = useLocalStorage<User>("Current User", { id: '', currentBalance: 1000}, { initOnMounted: true })
    const supabase = useSupabaseClient<Database>();
    const user = ref();

    // const currentBalance = computed(() => user.value.currentBalance);
    // const history = computed(() => user.value.history);
    const getUser = async () => {
        if (user.value) {
            return user.value;
        }
        let supaUser = (await supabase.auth.getUser()).data.user;
        

        // if ((!supaUser && localUser.value) || (supaUser && localUser.value.id != supaUser?.id)) {
        //     navigateTo("/login");
        // }
        // else if (!supaUser) {
        if (!supaUser) {
            const authResp = await supabase.auth.signInAnonymously();
            if (authResp.error) {
                throw new Error("Creating user failed");
            }
            supaUser = (await supabase.auth.getUser()).data.user;
        }
        console.warn(supaUser!.id);
        const data = await supabase.from('userProfile').select().eq('id', supaUser!.id ?? "").single().overrideTypes<User>();
        user.value = data.data as unknown as User
        console.warn(`data: ${JSON.stringify(user.value)}`);
        return user;
    }

    const updateUserProfile = async () => {
        const supaUser = (await supabase.auth.getUser()).data.user;
        const data = await supabase.from('userProfile').select().eq('id', supaUser!.id ?? "").single().overrideTypes<User>();
        user.value = data.data as unknown as User;
    }

    return { supabase, getUser, updateUserProfile};
});

export interface User {
    id: string,
    current_balance: number,
}