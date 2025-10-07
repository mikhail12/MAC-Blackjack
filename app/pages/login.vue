<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'

const supabase = useSupabaseClient()
const email = ref('')
const user = await supabase.auth.getUser();

if (user.data.user?.email) {
  navigateTo("/")
}

const signInWithOtp = async () => {
  const { error } = await supabase.auth.updateUser({email: email.value});
  
  if (error) console.log(error)
}
</script>
<template>
  <div class="h-full w-full flex flex-1">
    <div class="m-auto p-6 bg-secondary flex flex-col gap-2 max-w-100 rounded-xl">
      <input
        v-model="email"
        type="email"
        class="bg-primary/50 px-1 text-secondary rounded-[4px]"
      >
      <Button @click="signInWithOtp" class="font-bold">
        Sign in with email One Time Password (OTP)
      </Button>
    </div>
  </div>
</template>