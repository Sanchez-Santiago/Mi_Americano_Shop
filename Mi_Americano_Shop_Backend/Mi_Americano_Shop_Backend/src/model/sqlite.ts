import { createClient } from "sqlite";
import { config } from "dotenv";

config({ export: true });

export const sqlite = createClient({
  url: Deno.env.get("TURSO_DATABASE_URL") ?? "", // Reemplazá con el URL de tu instancia
  authToken: Deno.env.get("TURSO_AUTH_TOKEN"), // Lo obtenés desde el panel de SQLite Cloud
});

await sqlite.execute("SELECT * FROM users");
