import { Fragment } from "react";

/**
 * Intentionally tiny Markdown-subset renderer.
 *
 * Phase 1 stores article bodies as plain text with a handful of conventions
 * (`##`/`###` headings, `-` bullets, `1.` numbers, blank-line paragraphs). This
 * keeps the admin editor free to become a proper rich-text or MDX pipeline
 * later without a migration, and it never injects raw HTML.
 */
type Block =
  | { kind: "h2" | "h3" | "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "p", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "h3", text: line.slice(4) });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "h2", text: line.slice(3) });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      flushParagraph();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(numbered[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function Markdown({ content }: { content: string }) {
  const blocks = parse(content);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.kind === "h2") {
          return (
            <h2 key={index} className="pt-4 text-xl font-semibold sm:text-2xl">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "h3") {
          return (
            <h3 key={index} className="pt-2 text-lg font-semibold">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "p") {
          return (
            <p key={index} className="text-[15px] leading-relaxed text-muted">
              {block.text}
            </p>
          );
        }

        const items = block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="text-[15px] leading-relaxed text-muted">
            {item}
          </li>
        ));

        return (
          <Fragment key={index}>
            {block.kind === "ul" ? (
              <ul className="ml-5 list-disc space-y-2">{items}</ul>
            ) : (
              <ol className="ml-5 list-decimal space-y-2">{items}</ol>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
