import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { gameDB } from "./db";
import type { Game } from "./types";

export interface ListGamesRequest {
  userId: Query<string>;
}

export interface ListGamesResponse {
  games: Game[];
}

// Retrieves all games for a user, ordered by creation date (latest first).
export const listGames = api<ListGamesRequest, ListGamesResponse>(
  { expose: true, method: "GET", path: "/games" },
  async (req) => {
    const games: Game[] = [];
    
    for await (const row of gameDB.query<Game>`
      SELECT id, title, description, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
      FROM games 
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `) {
      games.push(row);
    }
    
    return { games };
  }
);
