import { api } from "encore.dev/api";
import { gameDB } from "./db";
import type { Game } from "./types";

export interface CreateGameRequest {
  title: string;
  description?: string;
  userId: string;
}

// Creates a new game.
export const createGame = api<CreateGameRequest, Game>(
  { expose: true, method: "POST", path: "/games" },
  async (req) => {
    const row = await gameDB.queryRow<Game>`
      INSERT INTO games (title, description, user_id)
      VALUES (${req.title}, ${req.description || null}, ${req.userId})
      RETURNING id, title, description, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!row) {
      throw new Error("Failed to create game");
    }
    
    return row;
  }
);
