import { api } from "encore.dev/api";
import { gameDB } from "./db";
import type { Period, Tone } from "./types";

export interface CreatePeriodRequest {
  gameId: number;
  title: string;
  description?: string;
  tone: Tone;
  positionX?: number;
  positionY?: number;
  orderIndex?: number;
  userId: string;
}

// Creates a new period in a game.
export const createPeriod = api<CreatePeriodRequest, Period>(
  { expose: true, method: "POST", path: "/games/:gameId/periods" },
  async (req) => {
    // Verify game ownership
    const gameExists = await gameDB.queryRow<{ id: number }>`
      SELECT id FROM games WHERE id = ${req.gameId} AND user_id = ${req.userId}
    `;
    
    if (!gameExists) {
      throw new Error("Game not found or access denied");
    }
    
    const row = await gameDB.queryRow<Period>`
      INSERT INTO periods (game_id, title, description, tone, position_x, position_y, order_index)
      VALUES (${req.gameId}, ${req.title}, ${req.description || null}, ${req.tone}, 
              ${req.positionX || 0}, ${req.positionY || 0}, ${req.orderIndex || 0})
      RETURNING id, game_id as "gameId", title, description, tone, 
                position_x as "positionX", position_y as "positionY", 
                order_index as "orderIndex", created_at as "createdAt"
    `;
    
    if (!row) {
      throw new Error("Failed to create period");
    }
    
    return row;
  }
);
