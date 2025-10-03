<template>
    <h1>
        Hey! {{ data?.data }} aa
    </h1>
</template>

<script setup lang="ts">
import type { Database } from '#build/types/supabase-database';

const client = useSupabaseClient<Database>();

const data = await useAsyncData('testtable', async () => {
    const data = await client.from('testtable').select();
    return data;
});
</script>