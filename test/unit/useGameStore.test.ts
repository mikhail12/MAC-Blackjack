import { beforeEach, describe, test } from "vitest";
import { setActivePinia, createPinia } from "pinia";

describe("Games Store", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    })

    describe("starting a game through call to 'tryStartGameWithBet'", () => {
        test("on success, it returns a new game's json object");
        test("on failing with an existing game, it returns the existing game's json object");
        test("on failing with low funds, it returns a null and throws an error");
    })
})