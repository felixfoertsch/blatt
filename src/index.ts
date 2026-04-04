import fs from "node:fs";
import path from "node:path";
import { createBlattApp } from "./app.js";
import { loadConfigFile } from "./config/loader.js";

const dataDir = process.env.BLATT_DATA_DIR ?? "/data";
const contentDir = path.join(dataDir, "content");
const templatesDir = path.join(dataDir, "templates");
const configPath = path.join(dataDir, "config.toml");

if (!fs.existsSync(contentDir)) {
	fs.mkdirSync(contentDir, { recursive: true });
}

const config = loadConfigFile(configPath);
const port = Number(process.env.PORT) || config.server.port;
const { hono } = await createBlattApp({ contentDir, templatesDir, config });

Bun.serve({
	port,
	fetch: hono.fetch,
	development: false,
});

console.log(`[blatt] listening on http://localhost:${port}`);
