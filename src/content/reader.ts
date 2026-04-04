import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import type { CollectionPage, Page } from "./types.js";

/**
 * Derive the URL slug from a file path relative to the content root.
 * e.g. contentDir="/content", filePath="/content/blog/post/index.md" → "/blog/post"
 */
function deriveSlug(contentDir: string, filePath: string): string {
	const relative = path.relative(contentDir, filePath);
	// Strip trailing /index.md
	const withoutIndex = relative.replace(/[/\\]?index\.md$/, "");
	if (!withoutIndex) return "/";
	return `/${withoutIndex.replace(/\\/g, "/")}`;
}

/**
 * Walk a directory recursively, yielding every directory that contains an index.md.
 * Skips directories whose name starts with `.` or `_`.
 */
function* walkDirs(dir: string): Generator<string> {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	// Yield this directory if it has an index.md
	const hasIndex = entries.some((e) => e.isFile() && e.name === "index.md");
	if (hasIndex) {
		yield dir;
	}

	// Recurse into subdirectories (skip hidden and private)
	for (const entry of entries) {
		if (entry.isDirectory() && !entry.name.startsWith(".") && !entry.name.startsWith("_")) {
			yield* walkDirs(path.join(dir, entry.name));
		}
	}
}

/**
 * Read all pages from a content directory.
 * Returns Page objects (or CollectionPage when a collect config is present).
 * html is left empty — the markdown pipeline fills it later.
 */
export function readPages(contentDir: string): Page[] {
	const pages: Page[] = [];

	for (const dirPath of walkDirs(contentDir)) {
		const filePath = path.join(dirPath, "index.md");
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const { meta, markdown } = parseFrontmatter(fileContent);

		const slug = deriveSlug(contentDir, filePath);

		const collectRaw = meta.raw.collect as Record<string, unknown> | undefined;

		if (collectRaw) {
			const from = typeof collectRaw.from === "string" ? collectRaw.from : ".";
			const sort = typeof collectRaw.sort === "string" ? collectRaw.sort : "published";
			const orderRaw = collectRaw.order;
			const order: "asc" | "desc" = orderRaw === "asc" || orderRaw === "desc" ? orderRaw : "desc";

			const collectionPage: CollectionPage = {
				slug,
				dirPath,
				filePath,
				meta,
				markdown,
				html: "",
				collect: { from, sort, order },
				children: [],
			};
			pages.push(collectionPage);
		} else {
			pages.push({
				slug,
				dirPath,
				filePath,
				meta,
				markdown,
				html: "",
			});
		}
	}

	return pages;
}
