import { defineStore } from "pinia";
import type { Database } from "~/types/database.types";

export const useUserStore = defineStore('userStore', () => {
    // const localUser = useLocalStorage<User>("Current User", { id: '', currentBalance: 1000}, { initOnMounted: true })
    
    const user = ref();

    const getUser = async () => {
        const supabase = useSupabaseClient<Database>();
        if (user.value) {
            return user.value;
        }
        let supaUser = (await supabase.auth.getUser()).data.user;
        
        if (!supaUser) {
            const authResp = await supabase.auth.signInAnonymously();
            if (authResp.error) {
                throw new Error("Creating user failed");
            }
            supaUser = (await supabase.auth.getUser()).data.user;
        }
        const { data, error } = await supabase.from('userProfile').select().eq('id', supaUser!.id ?? "").limit(1).maybeSingle().overrideTypes<User>();
        if (error) {
            console.warn(error);
            throw Error("Couldn't load the user's profile")
        }
        user.value = data
        return user;
    }

    const updateUserProfile = async () => {
        const supabase = useSupabaseClient<Database>();
        const supaUser = (await supabase.auth.getUser()).data.user;
        const data = await supabase.from('userProfile').select().eq('id', supaUser!.id ?? "").limit(1).maybeSingle().overrideTypes<User>();
        user.value = data.data as unknown as User;
    }

    return { getUser, updateUserProfile };
});

export interface User {
    id: string,
    current_balance: number,
}