type RichTextNode =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function parseRichText(input: string): RichTextNode[] {
  const lines = input.split(/\r?\n/);
  const nodes: RichTextNode[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      nodes.push({ type: "p", text: paragraphBuffer.join(" ").trim() });
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer.length > 0) {
      nodes.push({ type: "ul", items: [...listBuffer] });
      listBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return nodes;
}

type RichTextContentProps = {
  content: string;
};

export function RichTextContent({ content }: RichTextContentProps) {
  const nodes = parseRichText(content);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[2rem] border border-border/70 bg-card/75 px-6 py-7 shadow-sm">
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground">
        {nodes.map((node, index) => {
          if (node.type === "h2") {
            return (
              <h2 key={`${node.type}-${index}`} className="mt-0 text-2xl font-semibold tracking-tight text-foreground">
                {node.text}
              </h2>
            );
          }

          if (node.type === "h3") {
            return (
              <h3 key={`${node.type}-${index}`} className="text-xl font-semibold text-foreground">
                {node.text}
              </h3>
            );
          }

          if (node.type === "ul") {
            return (
              <ul key={`${node.type}-${index}`} className="space-y-2 pl-5 text-sm leading-7 text-muted-foreground sm:text-base">
                {node.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`${node.type}-${index}`} className="text-sm leading-7 text-muted-foreground sm:text-base">
              {node.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

