import type { Element, ElementContent, Root } from "hast";
import { visit } from "unist-util-visit";

export function rehypeFigure() {
	return (tree: Root) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "p" || index === undefined || !parent) return;

			// Filter out whitespace-only text nodes
			const meaningful = node.children.filter(
				(child) => !(child.type === "text" && /^\s*$/.test(child.value)),
			);

			if (meaningful.length !== 1) return;
			const child = meaningful[0];
			if (child.type !== "element" || child.tagName !== "img") return;

			const alt = (child.properties?.alt as string) || "";
			if (!alt) return;

			const figure: Element = {
				type: "element",
				tagName: "figure",
				properties: {},
				children: [
					child,
					{
						type: "element",
						tagName: "figcaption",
						properties: {},
						children: [{ type: "text", value: alt }],
					},
				],
			};

			(parent.children as ElementContent[])[index] = figure;
		});
	};
}
