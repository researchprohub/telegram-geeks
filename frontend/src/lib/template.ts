// Shared (server-safe) section definitions for the Elementor-style blog
// template. Must live outside any "use client" module so server components
// can import it without pulling in client-only code.

export const SECTION_DEFS: Record<string, { label: string; desc: string }> = {
  featured: { label: "Post featured image", desc: "Large image under the title" },
  meta: { label: "Post info", desc: "Author, date and category" },
  content: { label: "Post content", desc: "The article body" },
  tags: { label: "Tags", desc: "Post tag cloud" },
  share: { label: "Share buttons", desc: "Social share row" },
  author: { label: "Author box", desc: "Author name and bio" },
  related: { label: "Related posts", desc: "3 related articles" },
  nav: { label: "Next / Previous", desc: "Prev and next post links" },
};

export const DEFAULT_TEMPLATE = [
  "featured",
  "meta",
  "content",
  "tags",
  "share",
  "author",
  "related",
  "nav",
];