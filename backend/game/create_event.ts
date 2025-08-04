import { api } from "encore.dev/api";
import { gameDB } from "./db";
import type { Event, Tone } from "./types";

export interface CreateEventRequest {
  periodId: number;
  title: string;
  description?: string;
  tone: Tone;
  positionX?: number;
  positionY?: number;
  orderIndex?: number;
  userId: string;
}

// Creates a new event in a period.
export const createEvent = api<CreateEventRequest, Event>(
  { expose: true, method: "POST", path: "/periods/:periodId/events" },
  async (req) => {
    // Verify period ownership through game
    const periodExists = await gameDB.queryRow<{ id: number }>`
      SELECT p.id FROM periods p
      JOIN games g ON p.game_id = g.id
      WHERE p.id = ${req.periodId} AND g.user_id = ${req.userId}
    `;
    
    if (!periodExists) {
      throw new Error("Period not found or access denied");
    }
    
    const row = await gameDB.queryRow<Event>`
      INSERT INTO events (period_id, title, description, tone, position_x, position_y, order_index)
      VALUES (${req.periodId}, ${req.title}, ${req.description || null}, ${req.tone}, 
              ${req.positionX || 0}, ${req.positionY || 0}, ${req.orderIndex || 0})
      RETURNING id, period_id as "periodId", title, description, tone, 
                position_x as "positionX", position_y as "positionY", 
                order_index as "orderIndex", created_at as "createdAt"
    `;
    
    if (!row) {
      throw new Error("Failed to create event");
    }
    
    return row;
  }
);
