import { Hono } from "hono";
import type { BlattConfig } from "../config/schema.js";
import type { ContentCache } from "../content/cache.js";
import type { Page } from "../content/types.js";

interface FeedOptions {
	title: string;
	description: string;
	siteUrl: string;
	author?: string;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function generateFeedXml(pages: Page[], options: FeedOptions): string {
	const { title, description, siteUrl, author } = options;
	const feedUrl = `${siteUrl}${"/feed.xml"}`;

	// Take the 20 most recent published pages with dates, sorted desc
	const dated = pages
		.filter((p) => !p.meta.published.draft && p.meta.published.publishedDate)
		.sort((a, b) => {
			const dateA = a.meta.published.publishedDate ?? "";
			const dateB = b.meta.published.publishedDate ?? "";
			return dateB.localeCompare(dateA);
		})
		.slice(0, 20);

	const items = dated.map((page) => {
		const pageUrl = `${siteUrl}${page.slug}`;
		const pubDate = page.meta.published.publishedDate
			? new Date(page.meta.published.publishedDate).toUTCString()
			: "";
		const desc = page.meta.description
			? `<description>${escapeXml(page.meta.description)}</description>`
			: "";
		const authorTag = author ? `<author>${escapeXml(author)}</author>` : "";

		return [
			"\t\t<item>",
			`\t\t\t<title>${escapeXml(page.meta.title)}</title>`,
			`\t\t\t<link>${pageUrl}</link>`,
			`\t\t\t<guid>${pageUrl}</guid>`,
			pubDate ? `\t\t\t<pubDate>${pubDate}</pubDate>` : "",
			desc ? `\t\t\t${desc}` : "",
			authorTag ? `\t\t\t${authorTag}` : "",
			"\t\t</item>",
		]
			.filter(Boolean)
			.join("\n");
	});

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		"\t<channel>",
		`\t\t<title>${escapeXml(title)}</title>`,
		`\t\t<link>${siteUrl}</link>`,
		`\t\t<description>${escapeXml(description)}</description>`,
		`\t\t<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
		...items,
		"\t</channel>",
		"</rss>",
	].join("\n");
}

export function createFeedRoute(cache: ContentCache, config: BlattConfig): Hono {
	const app = new Hono();
	const feedPath = config.feed.path;

	app.get(feedPath, (c) => {
		const pages = cache.getPublishedPages();
		const xml = generateFeedXml(pages, {
			title: config.site.name,
			description: config.site.description,
			siteUrl: config.site.url,
			author: config.site.author || undefined,
		});
		return new Response(xml, {
			headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
		});
	});

	return app;
}
