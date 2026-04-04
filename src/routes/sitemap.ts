import { Hono } from "hono";
import type { BlattConfig } from "../config/schema.js";
import type { ContentCache } from "../content/cache.js";
import type { Page } from "../content/types.js";

export function generateSitemapXml(pages: Page[], siteUrl: string): string {
	const urls = pages
		.filter((p) => !p.meta.published.draft)
		.map((page) => {
			const loc = `${siteUrl}${page.slug}`;
			const lastmod = page.meta.published.updatedDate ?? page.meta.published.publishedDate;
			const lastmodTag = lastmod ? `\n\t\t<lastmod>${lastmod}</lastmod>` : "";
			return `\t<url>\n\t\t<loc>${loc}</loc>${lastmodTag}\n\t</url>`;
		});

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		"</urlset>",
	].join("\n");
}

export function createSitemapRoute(cache: ContentCache, config: BlattConfig): Hono {
	const app = new Hono();
	const sitemapPath = config.sitemap.path;

	app.get(sitemapPath, (c) => {
		const pages = cache.getPublishedPages();
		const xml = generateSitemapXml(pages, config.site.url);
		return new Response(xml, {
			headers: { "Content-Type": "application/xml; charset=utf-8" },
		});
	});

	return app;
}
