// db/sqlite.ts
import { createClient } from "sqlite"; // usa libSQL (Turso/SQLite Cloud)
import { config } from "dotenv";

config({ export: true });

// Validar URL y token
const url = Deno.env.get("TURSO_DATABASE_URL");
const authToken = Deno.env.get("TURSO_AUTH_TOKEN");

if (!url || !authToken) {
  throw new Error("Faltan variables de entorno para la base de datos Turso.");
}

// Crear el cliente de SQLite en la nube
export const sqlite = createClient({
  url,
  authToken,
});
