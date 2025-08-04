import { api, APIError } from "encore.dev/api";
import { gameDB } from "./db";
import type { GameWithElements, Game, Period, Event, Scene } from "./types";

export interface GetGameRequest {
  id: number;
  userId: string;
}

// Retrieves a game with all its elements.
export const getGame = api<GetGameRequest, GameWithElements>(
  { expose: true, method: "GET", path: "/games/:id" },
  async (req) => {
    const gameRow = await gameDB.queryRow<Game>`
      SELECT id, title, description, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
      FROM games 
      WHERE id = ${req.id} AND user_id = ${req.userId}
    `;
    
    if (!gameRow) {
      throw APIError.notFound("game not found");
    }
    
    const periods: Period[] = [];
    for await (const row of gameDB.query<Period>`
      SELECT id, game_id as "gameId", title, description, tone, 
             position_x as "positionX", position_y as "positionY", 
             order_index as "orderIndex", created_at as "createdAt"
      FROM periods 
      WHERE game_id = ${req.id}
      ORDER BY order_index
    `) {
      periods.push(row);
    }
    
    const events: Event[] = [];
    for await (const row of gameDB.query<Event>`
      SELECT e.id, e.period_id as "periodId", e.title, e.description, e.tone,
             e.position_x as "positionX", e.position_y as "positionY",
             e.order_index as "orderIndex", e.created_at as "createdAt"
      FROM events e
      JOIN periods p ON e.period_id = p.id
      WHERE p.game_id = ${req.id}
      ORDER BY e.order_index
    `) {
      events.push(row);
    }
    
    const scenes: Scene[] = [];
    for await (const row of gameDB.query<Scene>`
      SELECT s.id, s.event_id as "eventId", s.title, s.description, s.tone,
             s.position_x as "positionX", s.position_y as "positionY",
             s.order_index as "orderIndex", s.created_at as "createdAt"
      FROM scenes s
      JOIN events e ON s.event_id = e.id
      JOIN periods p ON e.period_id = p.id
      WHERE p.game_id = ${req.id}
      ORDER BY s.order_index
    `) {
      scenes.push(row);
    }
    
    return {
      game: gameRow,
      periods,
      events,
      scenes
    };
  }
);
