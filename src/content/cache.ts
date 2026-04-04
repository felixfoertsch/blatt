import fs from "node:fs";
import type { BlattConfig } from "../config/schema.js";
import { type TocEntry, createMarkdownPipeline } from "../markdown/pipeline.js";
import { readPages } from "./reader.js";
import type { Page } from "./types.js";

export interface ContentCache {
	getPage(slug: string): Page | undefined;
	getAllPages(): Page[];
	getPublishedPages(): Page[];
	getToc(slug: string): TocEntry[];
	stop(): void;
}

export async function createContentCache(
	contentDir: string,
	config: BlattConfig,
): Promise<ContentCache> {
	const pipeline = createMarkdownPipeline(config.markdown);
	let pages: Page[] = [];
	let tocMap = new Map<string, TocEntry[]>();

	async function rebuild() {
		const rawPages = readPages(contentDir);
		const rendered: Page[] = [];
		const newTocMap = new Map<string, TocEntry[]>();
		for (const page of rawPages) {
			const result = await pipeline.render(page.markdown);
			rendered.push({ ...page, html: result.html });
			newTocMap.set(page.slug, result.toc);
		}
		pages = rendered;
		tocMap = newTocMap;
		console.log(`[blatt] loaded ${pages.length} pages from ${contentDir}`);
	}

	await rebuild();

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	const watcher = fs.watch(contentDir, { recursive: true }, () => {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			rebuild().catch((err) => console.error("[blatt] rebuild error:", err));
		}, 200);
	});

	return {
		getPage(slug) {
			return pages.find((p) => p.slug === slug);
		},
		getAllPages() {
			return pages;
		},
		getPublishedPages() {
			return pages.filter((p) => !p.meta.published.draft);
		},
		getToc(slug) {
			return tocMap.get(slug) ?? [];
		},
		stop() {
			watcher.close();
			if (debounceTimer) clearTimeout(debounceTimer);
		},
	};
}
