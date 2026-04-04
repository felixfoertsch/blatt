/**
 * Calculate reading time based on word count at 200 wpm, minimum 1 minute.
 */
export function calculateReadingTime(text: string): string {
	const wordCount = text.split(/\s+/).filter(Boolean).length;
	const minutes = Math.max(1, Math.ceil(wordCount / 200));
	return `${minutes} min read`;
}

export interface MetaTagsOptions {
	title: string;
	description?: string;
	url: string;
	author?: string;
	publishedDate?: string | null;
	updatedDate?: string | null;
	image?: string;
	siteName?: string;
}

/**
 * Generate an HTML string containing canonical link, Open Graph tags,
 * and (for dated articles) a JSON-LD Article structured data block.
 */
export function generateMetaTags({
	title,
	description,
	url,
	author,
	publishedDate,
	updatedDate,
	image,
	siteName,
}: MetaTagsOptions): string {
	const parts: string[] = [];

	// Canonical URL
	parts.push(`<link rel="canonical" href="${url}">`);

	// Open Graph
	parts.push(`<meta property="og:title" content="${escapeAttr(title)}">`);
	parts.push(`<meta property="og:url" content="${url}">`);
	if (description) {
		parts.push(`<meta name="description" content="${escapeAttr(description)}">`);
		parts.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
	}
	if (siteName) {
		parts.push(`<meta property="og:site_name" content="${escapeAttr(siteName)}">`);
	}
	if (image) {
		parts.push(`<meta property="og:image" content="${image}">`);
	}
	if (publishedDate) {
		parts.push(`<meta property="og:type" content="article">`);
		parts.push(`<meta property="article:published_time" content="${publishedDate}">`);
		if (updatedDate) {
			parts.push(`<meta property="article:modified_time" content="${updatedDate}">`);
		}
		if (author) {
			parts.push(`<meta property="article:author" content="${escapeAttr(author)}">`);
		}
	} else {
		parts.push(`<meta property="og:type" content="website">`);
	}

	// JSON-LD — only for dated articles
	if (publishedDate) {
		const jsonLd: Record<string, unknown> = {
			"@context": "https://schema.org",
			"@type": "Article",
			headline: title,
			url,
			datePublished: publishedDate,
		};
		if (updatedDate) jsonLd.dateModified = updatedDate;
		if (author) jsonLd.author = { "@type": "Person", name: author };
		if (description) jsonLd.description = description;
		if (image) jsonLd.image = image;
		parts.push(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
	}

	return parts.join("\n");
}

function escapeAttr(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
