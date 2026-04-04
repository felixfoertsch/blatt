import type { Page } from "./types.js";
import type { CollectConfig } from "./types.js";

/**
 * Resolve the children of a collection page.
 *
 * Rules:
 * - Include pages whose slug starts with `/${collect.from}/`
 * - Only direct children — no nested subdirectories (slug has no further `/` after the prefix)
 * - Exclude the base path itself (e.g. `/blog`)
 * - Sort by published date (string comparison) or slug as fallback
 * - Apply the configured order (asc or desc)
 */
export function resolveCollection(allPages: Page[], collect: CollectConfig): Page[] {
	const prefix = `/${collect.from}/`;

	const children = allPages.filter((page) => {
		if (!page.slug.startsWith(prefix)) return false;
		// Ensure it's a direct child: no more slashes after the prefix
		const remainder = page.slug.slice(prefix.length);
		return remainder.length > 0 && !remainder.includes("/");
	});

	children.sort((a, b) => {
		let keyA: string;
		let keyB: string;
		if (collect.sort === "published") {
			keyA = a.meta.published.publishedDate ?? a.slug;
			keyB = b.meta.published.publishedDate ?? b.slug;
		} else {
			keyA = a.slug;
			keyB = b.slug;
		}
		if (keyA < keyB) return collect.order === "asc" ? -1 : 1;
		if (keyA > keyB) return collect.order === "asc" ? 1 : -1;
		return 0;
	});

	return children;
}
