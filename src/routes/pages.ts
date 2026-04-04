import { Hono } from "hono";
import type { BlattConfig } from "../config/schema.js";
import type { ContentCache } from "../content/cache.js";
import { resolveCollection } from "../content/collection.js";
import type { CollectConfig } from "../content/types.js";
import { canViewDrafts } from "../preview/middleware.js";
import { generateMetaTags } from "../seo/meta.js";
import { buildTemplateContext } from "../templates/context.js";
import { createTemplateEngine } from "../templates/engine.js";

export function createPageRoutes(
	cache: ContentCache,
	config: BlattConfig,
	userTemplatesDir?: string,
): Hono {
	const app = new Hono();
	const engine = createTemplateEngine(userTemplatesDir);

	app.get("*", (c) => {
		const rawPath = c.req.path;
		const slug = rawPath !== "/" && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;

		if (slug === "/" && cache.getAllPages().length === 0) {
			const html = engine.render("welcome", { config });
			return c.html(html);
		}

		const page = cache.getPage(slug);
		if (!page) {
			const html = engine.render("404", {
				config,
				title: "404 — Not Found",
				meta_tags: "",
				toc: [],
				pages: [],
			});
			return c.html(html, 404);
		}

		const queryToken = c.req.query("preview") ?? "";
		const showDrafts = canViewDrafts(config.server.preview_token, queryToken);

		// draft access check
		if (page.meta.published.draft && !showDrafts) {
			const html = engine.render("404", {
				config,
				title: "404 — Not Found",
				meta_tags: "",
				toc: [],
				pages: [],
			});
			return c.html(html, 404);
		}

		// resolve collection
		let collectionPages: Array<Record<string, unknown>> | undefined;
		const collectRaw = page.meta.raw.collect;
		if (collectRaw && typeof collectRaw === "object") {
			const collectConfig = collectRaw as CollectConfig;
			let children = resolveCollection(cache.getAllPages(), collectConfig);
			if (!showDrafts) {
				children = children.filter((p) => !p.meta.published.draft);
			}
			collectionPages = children.map((p) => ({
				slug: p.slug,
				title: p.meta.title,
				description: p.meta.description,
				published_date: p.meta.published.publishedDate,
				updated_date: p.meta.published.updatedDate,
				taxonomy: p.meta.taxonomy,
				draft: p.meta.published.draft,
				meta: p.meta,
			}));
		}

		const pageUrl = `${config.site.url}${slug}`;
		const metaTags = generateMetaTags({
			title: page.meta.title,
			description: page.meta.description || undefined,
			url: pageUrl,
			author: config.site.author || undefined,
			publishedDate: page.meta.published.publishedDate,
			updatedDate: page.meta.published.updatedDate,
			siteName: config.site.name,
		});

		const toc = cache.getToc(slug);
		const context = buildTemplateContext(page, config, {
			toc,
			metaTags,
			isDraft: page.meta.published.draft,
			collectionPages,
			previewQuery: showDrafts ? `?preview=${queryToken}` : "",
		});

		const templateName = page.meta.template || "default";
		const html = engine.render(templateName, context);
		return c.html(html);
	});

	return app;
}
