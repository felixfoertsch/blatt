import { Hono } from "hono";
import type { BlattConfig } from "../config/schema.js";
import type { ContentCache } from "../content/cache.js";
import type { Page } from "../content/types.js";
import { createTemplateEngine } from "../templates/engine.js";

function toCollectionItems(pages: Page[]): Array<Record<string, unknown>> {
	return pages.map((p) => ({
		slug: p.slug,
		title: p.meta.title,
		description: p.meta.description,
		published_date: p.meta.published.publishedDate,
		updated_date: p.meta.published.updatedDate,
		taxonomy: p.meta.taxonomy,
		meta: p.meta,
	}));
}

export function createTaxonomyRoutes(
	cache: ContentCache,
	config: BlattConfig,
	userTemplatesDir?: string,
): Hono {
	const app = new Hono();
	const engine = createTemplateEngine(userTemplatesDir);

	app.get("/tags/:tag", (c) => {
		const tag = decodeURIComponent(c.req.param("tag"));
		const pages = cache.getPublishedPages().filter((p) => p.meta.taxonomy.tags.includes(tag));

		const context = {
			title: `Tag: ${tag}`,
			description: `Pages tagged with "${tag}"`,
			content: "",
			pages: toCollectionItems(pages),
			meta_tags: "",
			toc: [],
			config,
			draft_banner: false,
			taxonomy: { tags: [], category: [] },
		};

		const html = engine.render("collection", context);
		return c.html(html);
	});

	app.get("/category/:category", (c) => {
		const category = decodeURIComponent(c.req.param("category"));
		const pages = cache
			.getPublishedPages()
			.filter((p) => p.meta.taxonomy.category.includes(category));

		const context = {
			title: `Category: ${category}`,
			description: `Pages in category "${category}"`,
			content: "",
			pages: toCollectionItems(pages),
			meta_tags: "",
			toc: [],
			config,
			draft_banner: false,
			taxonomy: { tags: [], category: [] },
		};

		const html = engine.render("collection", context);
		return c.html(html);
	});

	return app;
}
