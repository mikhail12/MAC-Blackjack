import { describe, it, expect, beforeEach, vi, test } from 'vitest';
import { useBlackjack, useBlackjackRunner, type Card } from '../../app/composables/useBlackjackGame';

// todo: when supabase integration is complete, test persistence
describe("useBlackjackRunner", () => {
    let blackJackRunner;
    beforeEach(() => {
        blackJackRunner = useBlackjackRunner();
    });

    describe("Initial State", () => {
        describe("new user", () => {
            test.todo("should initialize with the injected user");
            test.todo("should start in idle status");
            test.todo("should have empty hands initially");
            test.todo("should have zero current bet");
            test.todo("should have null game result");
            test.todo("should have empty history");
            test.todo("should not be ready to present cards to user");
        });
    });

    describe("placeBetAndStartNewGame", () => {
        test.todo("should start valid bets");
        test.todo("should throw error when betting more than user's current balance")
        test.todo("should throw error when betting zero or negative");
        test.todo("should throw error if trying to start while there is a game in play");
        test.todo("should deal cards at start of game");
        describe("player immediately gets 21", () => {
            test.todo("should finish game with 'early-win' if the player got an immediate 21");
            test.todo("should finish game with 'early-push' if the player and dealer both immediately drawed 21");
        });
        test.todo("should continue to player's turn if player doesn't immediately get 21");
    });

    describe("calculateHandValue", () => {
        test.todo("should calculate number cards correctly");
        test.todo("should treat face cards as 10");
        describe("aces", () => {
            test.todo("should be treated as 11 when possible");
            test.todo("should be treates as 1 if 11 would bust");
            test.todo("should treat multiple aces correctly");
        });
    });

    describe("player hit", () => {
        test.todo("should throw error if hit outside of player's turn");
        test.todo("should continue to dealer's turn when player's hit doesn't bust");
        test.todo("should end game with lose when player's hit busts");
    });

    describe("player stand", () => {
        test.todo("should throw error if stand outside of player's turn");
        test.todo("should continue to dealer's turn");
    });

    describe("dealerPlay", () => {
        test.todo("dealer should hit on 16 or less");
        test.todo("dealer should continue to hit until it reaches 17 or higher");
        test.todo("dealer should stand on 17 or more");
        test.todo("should continue to determineWinner()");
    });

    describe("determineWinner", () => {
        test.todo("should win when player total > dealer total");
        test.todo("should win when the dealer got busted");
        test.todo("should lose when the player total < dealer total");
        test.todo("should push when the player total is equal to the dealer total");
    });
});