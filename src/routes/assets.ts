import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";

const MIME_TYPES: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".pdf": "application/pdf",
	".css": "text/css",
	".js": "text/javascript",
	".mjs": "text/javascript",
	".json": "application/json",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mp3": "audio/mpeg",
	".ogg": "audio/ogg",
	".txt": "text/plain",
	".xml": "application/xml",
};

export function createAssetRoutes(contentDir: string): Hono {
	const app = new Hono();

	app.get("*", async (c, next) => {
		const urlPath = c.req.path;
		const ext = path.extname(urlPath).toLowerCase();

		// Pass through requests without a file extension — they're page routes
		if (!ext) {
			return next();
		}

		const filePath = path.join(contentDir, urlPath);

		if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
			return next();
		}

		const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
		const content = fs.readFileSync(filePath);
		return new Response(content, {
			headers: { "Content-Type": mimeType },
		});
	});

	return app;
}
