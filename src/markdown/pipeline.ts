import type { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { z } from "zod";
import type { markdownSchema } from "../config/schema.js";

export interface TocEntry {
	text: string;
	depth: number;
	id: string;
}

export interface RenderResult {
	html: string;
	toc: TocEntry[];
}

type MarkdownConfig = z.infer<typeof markdownSchema>;

export function createMarkdownPipeline(config: MarkdownConfig) {
	// biome-ignore lint: unified's generic types make reassignment hard to type
	let processor: any = null;

	async function buildProcessor() {
		if (processor) return processor;

		// biome-ignore lint: unified processor type changes with each .use() call
		let proc: any = unified().use(remarkParse);

		if (config.footnotes || config.task_lists) {
			const remarkGfm = (await import("remark-gfm")).default;
			proc = proc.use(remarkGfm);
		}

		if (config.math) {
			const remarkMath = (await import("remark-math")).default;
			proc = proc.use(remarkMath);
		}

		if (config.smart_typography) {
			const remarkSmartypants = (await import("remark-smartypants")).default;
			proc = proc.use(remarkSmartypants);
		}

		if (config.admonitions) {
			const remarkDirective = (await import("remark-directive")).default;
			const { remarkAdmonitions } = await import("./admonitions.js");
			proc = proc.use(remarkDirective).use(remarkAdmonitions);
		}

		if (config.definition_lists) {
			const remarkDefinitionList = (await import("remark-definition-list")).defListHastHandlers;
			proc = proc.use(remarkRehype, {
				allowDangerousHtml: true,
				handlers: remarkDefinitionList,
			});
		} else {
			proc = proc.use(remarkRehype, { allowDangerousHtml: true });
		}

		if (config.heading_anchors) {
			const rehypeSlug = (await import("rehype-slug")).default;
			const rehypeAutolinkHeadings = (await import("rehype-autolink-headings")).default;
			proc = proc.use(rehypeSlug).use(rehypeAutolinkHeadings, { behavior: "wrap" as const });
		}

		if (config.external_links) {
			const rehypeExternalLinks = (await import("rehype-external-links")).default;
			proc = proc.use(rehypeExternalLinks, {
				target: "_blank",
				rel: ["noopener", "noreferrer"],
			});
		}

		if (config.math) {
			const rehypeKatex = (await import("rehype-katex")).default;
			proc = proc.use(rehypeKatex);
		}

		if (config.syntax_highlighting) {
			const rehypeShiki = (await import("@shikijs/rehype")).default;
			proc = proc.use(rehypeShiki, { theme: "github-dark" });
		}

		if (config.figure_captions) {
			const { rehypeFigure } = await import("./figure.js");
			proc = proc.use(rehypeFigure);
		}

		proc = proc.use(rehypeStringify, { allowDangerousHtml: true });

		processor = proc;
		return proc;
	}

	return {
		async render(markdown: string): Promise<RenderResult> {
			const proc = await buildProcessor();
			const toc: TocEntry[] = [];

			// Clone the processor and add the TOC extraction plugin for this render
			const renderProc = proc().use(() => {
				return (tree: Root) => {
					visit(tree, "element", (node: Element) => {
						const match = node.tagName.match(/^h([2-6])$/);
						if (!match) return;
						const depth = Number.parseInt(match[1], 10);
						const id = (node.properties?.id as string) || "";
						const text = hastToString(node);
						toc.push({ text, depth, id });
					});
				};
			});

			const file = await renderProc.process(markdown);
			return {
				html: String(file),
				toc,
			};
		},
	};
}
