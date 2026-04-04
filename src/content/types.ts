export interface PublishedInfo {
	draft: boolean;
	publishedDate: string | null;
	updatedDate: string | null;
}

export interface PageMeta {
	title: string;
	description: string;
	template: string;
	published: PublishedInfo;
	taxonomy: {
		tags: string[];
		category: string[];
	};
	raw: Record<string, unknown>;
}

export interface Page {
	slug: string;
	dirPath: string;
	filePath: string;
	meta: PageMeta;
	markdown: string;
	html: string;
}

export interface CollectConfig {
	from: string;
	sort: string;
	order: "asc" | "desc";
}

export interface CollectionPage extends Page {
	collect: CollectConfig;
	children: Page[];
}

export function isCollectionPage(page: Page): page is CollectionPage {
	return "collect" in page;
}
