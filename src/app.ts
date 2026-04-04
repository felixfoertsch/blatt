import { Hono } from "hono";
import type { BlattConfig } from "./config/schema.js";
import { type ContentCache, createContentCache } from "./content/cache.js";
import { createAssetRoutes } from "./routes/assets.js";
import { createFeedRoute } from "./routes/feed.js";
import { createPageRoutes } from "./routes/pages.js";
import { createSitemapRoute } from "./routes/sitemap.js";
import { createTaxonomyRoutes } from "./routes/taxonomy.js";

interface BlattAppOptions {
	contentDir: string;
	templatesDir?: string;
	config: BlattConfig;
}

export interface BlattApp {
	hono: Hono;
	cache: ContentCache;
}

export async function createBlattApp(options: BlattAppOptions): Promise<BlattApp> {
	const { contentDir, templatesDir, config } = options;
	const cache = await createContentCache(contentDir, config);
	const app = new Hono();
	app.route("/", createAssetRoutes(contentDir));
	if (config.feed.enabled) {
		app.route("/", createFeedRoute(cache, config));
	}
	if (config.sitemap.enabled) {
		app.route("/", createSitemapRoute(cache, config));
	}
	app.route("/", createTaxonomyRoutes(cache, config, templatesDir));
	app.route("/", createPageRoutes(cache, config, templatesDir));
	return { hono: app, cache };
}
