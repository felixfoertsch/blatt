import type { BlattConfig } from "../config/schema.js";
import type { Page } from "../content/types.js";
import type { TocEntry } from "../markdown/pipeline.js";

export function buildTemplateContext(
	page: Page,
	config: BlattConfig,
	options: {
		toc?: TocEntry[];
		metaTags?: string;
		isDraft?: boolean;
		collectionPages?: Array<Record<string, unknown>>;
		previewQuery?: string;
	} = {},
): Record<string, unknown> {
	const wordCount = page.markdown.split(/\s+/).filter(Boolean).length;
	const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
	return {
		title: page.meta.title,
		description: page.meta.description,
		content: page.html,
		published_date: page.meta.published.publishedDate,
		updated_date: page.meta.published.updatedDate,
		reading_time: `${readingMinutes} min read`,
		taxonomy: page.meta.taxonomy,
		toc: options.toc ?? [],
		meta_tags: options.metaTags ?? "",
		config,
		page: { slug: page.slug, meta: page.meta },
		draft_banner: options.isDraft ?? false,
		preview_query: options.previewQuery ?? "",
		pages: options.collectionPages ?? [],
		...page.meta.raw,
	};
}
