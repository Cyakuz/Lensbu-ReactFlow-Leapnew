import { SQLDatabase } from "encore.dev/storage/sqldb";

export const gameDB = new SQLDatabase("game", {
  migrations: "./migrations",
});
