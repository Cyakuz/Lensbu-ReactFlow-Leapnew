import { api, APIError } from "encore.dev/api";
import { gameDB } from "./db";
import type { Game } from "./types";

export interface UpdateGameRequest {
  id: number;
  title?: string;
  description?: string;
  userId: string;
}

// Updates a game's basic information.
export const updateGame = api<UpdateGameRequest, Game>(
  { expose: true, method: "PUT", path: "/games/:id" },
  async (req) => {
    const row = await gameDB.queryRow<Game>`
      UPDATE games 
      SET title = COALESCE(${req.title}, title),
          description = COALESCE(${req.description}, description),
          updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${req.userId}
      RETURNING id, title, description, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!row) {
      throw APIError.notFound("game not found");
    }
    
    return row;
  }
);
