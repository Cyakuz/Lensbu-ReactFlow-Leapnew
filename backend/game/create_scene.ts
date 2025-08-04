import { api } from "encore.dev/api";
import { gameDB } from "./db";
import type { Scene, Tone } from "./types";

export interface CreateSceneRequest {
  eventId: number;
  title: string;
  description?: string;
  tone: Tone;
  positionX?: number;
  positionY?: number;
  orderIndex?: number;
  userId: string;
}

// Creates a new scene in an event.
export const createScene = api<CreateSceneRequest, Scene>(
  { expose: true, method: "POST", path: "/events/:eventId/scenes" },
  async (req) => {
    // Verify event ownership through game
    const eventExists = await gameDB.queryRow<{ id: number }>`
      SELECT e.id FROM events e
      JOIN periods p ON e.period_id = p.id
      JOIN games g ON p.game_id = g.id
      WHERE e.id = ${req.eventId} AND g.user_id = ${req.userId}
    `;
    
    if (!eventExists) {
      throw new Error("Event not found or access denied");
    }
    
    const row = await gameDB.queryRow<Scene>`
      INSERT INTO scenes (event_id, title, description, tone, position_x, position_y, order_index)
      VALUES (${req.eventId}, ${req.title}, ${req.description || null}, ${req.tone}, 
              ${req.positionX || 0}, ${req.positionY || 0}, ${req.orderIndex || 0})
      RETURNING id, event_id as "eventId", title, description, tone, 
                position_x as "positionX", position_y as "positionY", 
                order_index as "orderIndex", created_at as "createdAt"
    `;
    
    if (!row) {
      throw new Error("Failed to create scene");
    }
    
    return row;
  }
);
