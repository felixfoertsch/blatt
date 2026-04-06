# Blatt

A zero-config, single-person markdown publishing server.

Drop markdown files in a folder. They become a website. No admin panel, no database, no build step, no accounts.

---

## Features

- Folder structure maps directly to URLs — every directory with an `index.md` becomes a page
- YAML frontmatter for title, description, template selection, and taxonomy
- Full markdown pipeline: GFM tables, footnotes, math (KaTeX), syntax highlighting (Shiki), admonitions, smart typography, heading anchors, figure captions, external link decoration, TOC generation, definition lists, task lists, mermaid diagrams
- Nunjucks templates with inheritance — 30 built-in creative themes, or drop in your own
- Collection pages — a directory that lists its children sorted by date (blog index, notes archive, etc.)
- Draft support — set `published: false` to hide a page; preview it with `?preview=<token>`
- RSS feed and sitemap generated automatically
- Tag and category index pages generated from frontmatter taxonomy
- SEO: Open Graph tags, JSON-LD structured data, canonical URLs, reading time
- Single `config.toml` — every option defaults to on, change only what you need
- File watching — changes appear on the next request without restarting

---

## Quick Start

Create a `docker-compose.yml`:

```yaml
services:
	blatt:
		image: ghcr.io/felixfoertsch/blatt:latest
		ports:
			- "3000:3000"
		volumes:
			- ./content:/data/content
			- ./templates:/data/templates
			- ./config.toml:/data/config.toml
		restart: unless-stopped
```

Create your first page:

```bash
mkdir -p content/hello
cat > content/hello/index.md << 'EOF'
---
title: Hello, world
published: 2026-04-04
---

This is my first page.
EOF
```

Start the server:

```bash
docker compose up
```

Visit `http://localhost:3000/hello`.

---

## Content Model

### Folder structure

Every directory that contains an `index.md` becomes a page. The URL mirrors the folder path.

```
content/
	index.md              → /
	about/
		index.md          → /about
	blog/
		index.md          → /blog   (collection page)
		my-first-post/
			index.md      → /blog/my-first-post
		second-post/
			index.md      → /blog/second-post
```

Directories whose name starts with `.` or `_` are ignored.

### Frontmatter reference

```yaml
---
title: My Page
description: A short summary shown in listings and meta tags.
template: post          # which template to render (default: "default")

# published controls draft status and dates
published: 2026-04-04

# taxonomy for tag/category index pages
taxonomy:
  tags: [writing, tools]
  category: [projects]
---
```

#### The `published` field

| Value | Meaning |
|-------|---------|
| `false` | Draft — hidden from all visitors |
| `true` or omitted | Published, no date displayed |
| `2026-04-04` | Published on that date |
| `2026-04-04, 2026-04-10` | Published on first date, updated on second |

Draft pages return 404 to normal requests. To preview a draft, set a `preview_token` in `config.toml` and append `?preview=<token>` to the URL.

### Collection pages

A collection page lists its direct children sorted by date. Add a `collect` block to the frontmatter:

```yaml
---
title: Blog
collect:
  from: blog         # slug prefix to collect children from
  sort: published    # "published" (date) or "slug"
  order: desc        # "desc" (newest first) or "asc"
---
```

The page renders using the `collection` template, which receives the matched children as the `pages` variable. Only direct children are included — nested subdirectories are not.

---

## Templates

Blatt ships with core layout templates and 30 creative themes.

### Core templates

| Template | Used for |
|----------|----------|
| `default` | Plain content page |
| `post` | Article with date, reading time, and tags |
| `collection` | Page that lists child pages |
| `base` | Base layout — all other templates extend this |

### Themes

Set `template: dracula` in frontmatter to use any built-in theme:

| Theme | Style |
|-------|-------|
| `win98` | Windows 98 desktop with taskbar and Explorer chrome |
| `dracula` | Dark theme with Dracula color palette |
| `terminal` | Green-on-black terminal emulator |
| `chalkboard` | Chalk on a green chalkboard |
| `crypto-hacker` | Neon hacker aesthetic with matrix rain |
| `meditation` | Minimal zen layout with soft earth tones |
| `newspaper` | Multi-column broadsheet with sepia ink |
| `academic` | LaTeX-inspired academic paper |
| `void` | Pure black with minimal white typography |
| `cafe-menu` | Warm coffee shop menu board |
| `apple-hig` | Apple Human Interface Guidelines style |
| `typewriter` | Monospaced typewriter on aged paper |
| `xcode` | IDE editor with syntax-highlighted chrome |
| `passport` | Travel document with stamps and seals |
| `vinyl-record` | Record sleeve with liner notes |
| `bootscreen` | BIOS/POST boot sequence |
| `stage-play` | Theater script with stage directions |
| `fediverse-toot` | Mastodon/fediverse toot card |
| `conspiracy` | Red string conspiracy board |
| `startup-pitch` | Investor pitch deck |
| `ipad-ui` | iPadOS multitasking interface |
| `invoice` | Business invoice/receipt |
| `math-theorem` | Mathematical proof layout |
| `envelope` | Physical letter with envelope |
| `retro-unix-manual` | Unix man page |
| `podcast-notes` | Podcast episode show notes |
| `sticky-notes` | Post-it notes on a corkboard |
| `color-palette` | Design system color swatch card |
| `hardcover-book` | Hardcover book with chapter layout |
| `tech-catalog` | Product spec sheet |

Select a template per page with `template: post` in frontmatter.

### Custom templates

Mount a directory of Nunjucks templates at `/data/templates` in the container. Files there override the built-in templates by name. To customise only the base layout, add a `base.html` that matches the block structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>{% block title %}{{ title }}{% endblock %}</title>
	{{ meta_tags | safe }}
	{% block head %}{% endblock %}
</head>
<body>
	{% block body %}{% endblock %}
</body>
</html>
```

### Template variables

All templates receive:

| Variable | Type | Description |
|----------|------|-------------|
| `title` | string | Page title from frontmatter |
| `description` | string | Page description from frontmatter |
| `content` | string (HTML) | Rendered markdown body |
| `published_date` | string \| null | ISO 8601 date (`YYYY-MM-DD`) |
| `updated_date` | string \| null | ISO 8601 date of last update |
| `reading_time` | string | Estimated reading time (e.g. `"4 min read"`) |
| `taxonomy` | object | `{ tags: string[], category: string[] }` |
| `toc` | array | Table of contents entries `{ text, depth, id }` |
| `meta_tags` | string (HTML) | Rendered Open Graph / JSON-LD tags |
| `config` | object | Full parsed `config.toml` |
| `page` | object | `{ slug, meta }` |
| `draft_banner` | boolean | `true` when viewing a draft |
| `pages` | array | Child pages (collection pages only) |

Any additional frontmatter keys are merged into the context and available by name.

---

## Config Reference

Copy `config.example.toml` to `config.toml` and place it at `/data/config.toml`. All keys are optional — the defaults shown below apply when a key is absent.

```toml
# ─── Site ─────────────────────────────────────────────────────────────────────
[site]
name        = "Blatt"
url         = "http://localhost:3000"  # used for feeds, sitemaps, absolute links
language    = "en"                     # BCP 47 language tag
description = ""
author      = ""

# ─── Server ───────────────────────────────────────────────────────────────────
[server]
port             = 3000
trusted_networks = []       # CIDR ranges that may bypass rate limiting
preview_token    = ""       # set to enable ?preview=<token> for drafts

# ─── Markdown ─────────────────────────────────────────────────────────────────
[markdown]
syntax_highlighting  = true   # fenced code blocks via Shiki
footnotes            = true   # [^1] style footnotes
smart_typography     = true   # "quotes", -- dashes, ... ellipsis
heading_anchors      = true   # id anchors + link icon on headings
figure_captions      = true   # wrap images in <figure> with <figcaption>
external_links       = true   # rel="noopener noreferrer" + target="_blank"
toc                  = true   # table of contents generation
math                 = true   # KaTeX ($ inline, $$ block)
admonitions          = true   # :::note, :::warning, :::danger blocks
definition_lists     = true   # PHP Markdown Extra-style definition lists
task_lists           = true   # GFM task lists (- [ ] / - [x])
mermaid              = true   # Mermaid fences → <div class="mermaid">
abbreviations        = true   # *[HTML]: HyperText Markup Language expansion
superscript_subscript = true  # ^super^ and ~sub~ syntax
highlight_mark       = true   # ==highlight== mark syntax

# ─── Feed ─────────────────────────────────────────────────────────────────────
[feed]
enabled = true
path    = "/feed.xml"

# ─── Sitemap ──────────────────────────────────────────────────────────────────
[sitemap]
enabled = true
path    = "/sitemap.xml"
```

---

## Markdown Features

All extensions are enabled by default and can be disabled individually in `config.toml`.

- **GFM tables** — pipe tables with alignment
- **Footnotes** — `[^1]` inline, definition at the bottom
- **Math** — `$inline$` and `$$block$$` rendered with KaTeX
- **Syntax highlighting** — fenced code blocks highlighted with Shiki (`github-dark` theme)
- **Admonitions** — `:::note`, `:::warning`, `:::danger` callout blocks
- **Smart typography** — "quotes" → curly quotes, `--` → en-dash, `---` → em-dash, `...` → ellipsis
- **Heading anchors** — each heading gets an `id` and a linkable anchor icon
- **Figure captions** — images wrapped in `<figure>`, alt text becomes `<figcaption>`
- **External link decoration** — external links open in a new tab with `rel="noopener noreferrer"`
- **TOC generation** — `toc` variable available in templates as a list of `{ text, depth, id }` entries
- **Definition lists** — PHP Markdown Extra syntax (`term\n: definition`)
- **Task lists** — `- [ ]` and `- [x]`
- **Mermaid diagrams** — fenced `mermaid` blocks become `<div class="mermaid">` for client-side rendering
- **Abbreviations** — `*[HTML]: HyperText Markup Language` expands all occurrences
- **Superscript / subscript** — `^super^` and `~sub~`
- **Highlight mark** — `==highlighted==` renders as `<mark>`

---

## Auto-Generated Pages

### RSS feed

Available at `/feed.xml` (configurable). Includes all published pages with a `published` date, sorted newest first.

### Sitemap

Available at `/sitemap.xml` (configurable). Lists all published, non-draft pages.

### Tag index

Each tag used in any page's `taxonomy.tags` list gets an index page at `/tags/<tag>` that lists all published pages carrying that tag.

### Category index

Each category used in any page's `taxonomy.category` list gets an index page at `/category/<category>`.

---

## Development

Requires [Bun](https://bun.sh) 1.x.

```bash
git clone https://github.com/felixfoertsch/blatt
cd blatt
bun install
bun dev          # starts the server with file watching on port 3000
bun test         # run the test suite
bun run lint     # check with Biome
bun run format   # auto-fix with Biome
```

The server reads content from `./content/` and templates from `./templates/` when running locally. Override with the `BLATT_DATA_DIR` environment variable.

---

## License

MIT
