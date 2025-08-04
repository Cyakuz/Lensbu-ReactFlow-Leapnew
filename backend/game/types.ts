export type Tone = "dark" | "light";

export interface Game {
  id: number;
  title: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Period {
  id: number;
  gameId: number;
  title: string;
  description?: string;
  tone: Tone;
  positionX: number;
  positionY: number;
  orderIndex: number;
  createdAt: Date;
}

export interface Event {
  id: number;
  periodId: number;
  title: string;
  description?: string;
  tone: Tone;
  positionX: number;
  positionY: number;
  orderIndex: number;
  createdAt: Date;
}

export interface Scene {
  id: number;
  eventId: number;
  title: string;
  description?: string;
  tone: Tone;
  positionX: number;
  positionY: number;
  orderIndex: number;
  createdAt: Date;
}

export interface GameWithElements {
  game: Game;
  periods: Period[];
  events: Event[];
  scenes: Scene[];
}
