<template>
    <div class="w-100 text-2xl flex flex-col my-auto">
        <span :class="`mx-auto ${figureOutSuitColor(card)}`">
            {{ props.card.rank }}
        </span>
        <span :class="`mx-auto ${figureOutSuitColor(card)}`">
            {{ props.card.suit }}
        </span>
    </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { Card } from '~/types/game';

const props = defineProps({
    card: {
        type: Object as PropType<Card>,
        required: true,
    },
});

const figureOutSuitColor = (card: Card) => {
    if (card.suit === '♠' || card.suit === '♣') {
        return 'text-black'
    }
    return 'text-destructive'
}
</script>