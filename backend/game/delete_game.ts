import { api, APIError } from "encore.dev/api";
import { gameDB } from "./db";

export interface DeleteGameRequest {
  id: number;
  userId: string;
}

// Deletes a game and all its elements.
export const deleteGame = api<DeleteGameRequest, void>(
  { expose: true, method: "DELETE", path: "/games/:id" },
  async (req) => {
    const result = await gameDB.queryRow<{ count: number }>`
      DELETE FROM games 
      WHERE id = ${req.id} AND user_id = ${req.userId}
      RETURNING 1 as count
    `;
    
    if (!result) {
      throw APIError.notFound("game not found");
    }
  }
);
