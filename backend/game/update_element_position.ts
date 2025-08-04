import { api } from "encore.dev/api";
import { gameDB } from "./db";

export interface UpdateElementPositionRequest {
  elementType: "period" | "event" | "scene";
  elementId: number;
  positionX: number;
  positionY: number;
  orderIndex?: number;
  userId: string;
}

// Updates the position and order of a timeline element.
export const updateElementPosition = api<UpdateElementPositionRequest, void>(
  { expose: true, method: "PUT", path: "/elements/:elementId/position" },
  async (req) => {
    let query: string;
    let verifyQuery: string;
    
    switch (req.elementType) {
      case "period":
        verifyQuery = `
          SELECT p.id FROM periods p
          JOIN games g ON p.game_id = g.id
          WHERE p.id = $1 AND g.user_id = $2
        `;
        query = `
          UPDATE periods 
          SET position_x = $1, position_y = $2, order_index = COALESCE($3, order_index)
          WHERE id = $4
        `;
        break;
      case "event":
        verifyQuery = `
          SELECT e.id FROM events e
          JOIN periods p ON e.period_id = p.id
          JOIN games g ON p.game_id = g.id
          WHERE e.id = $1 AND g.user_id = $2
        `;
        query = `
          UPDATE events 
          SET position_x = $1, position_y = $2, order_index = COALESCE($3, order_index)
          WHERE id = $4
        `;
        break;
      case "scene":
        verifyQuery = `
          SELECT s.id FROM scenes s
          JOIN events e ON s.event_id = e.id
          JOIN periods p ON e.period_id = p.id
          JOIN games g ON p.game_id = g.id
          WHERE s.id = $1 AND g.user_id = $2
        `;
        query = `
          UPDATE scenes 
          SET position_x = $1, position_y = $2, order_index = COALESCE($3, order_index)
          WHERE id = $4
        `;
        break;
      default:
        throw new Error("Invalid element type");
    }
    
    // Verify ownership
    const exists = await gameDB.rawQueryRow<{ id: number }>(verifyQuery, req.elementId, req.userId);
    if (!exists) {
      throw new Error("Element not found or access denied");
    }
    
    // Update position
    await gameDB.rawExec(query, req.positionX, req.positionY, req.orderIndex, req.elementId);
  }
);
