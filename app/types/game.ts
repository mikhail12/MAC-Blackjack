export type CardSuit = '♠' | '♥' | '♦' | '♣';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: CardRank;
  suit: CardSuit;
  isShown: boolean;
}

export type GameResult = 'win' | 'lose' | 'push' | 'early-win' | 'early-push' | null;

export enum GameStatus {
  idle = 0,
  player_turn = 1,
  dealer_turn = 2,
  finished = 3,
}

export interface GameHistoryEntry {
  id?: number;
  started_game: number;
  latest_timestamp: number;
  bet: number;
  playerHand: Card[];
  dealerHand: Card[];
  gameStatus: GameStatus;
  result?: GameResult;
  payout?: number;
}
