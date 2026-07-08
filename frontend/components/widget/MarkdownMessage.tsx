import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

// Bot output is rendered through react-markdown + rehype-sanitize rather
// than dangerouslySetInnerHTML, so formatting (lists, bold, inline code)
// renders without opening an XSS vector via model output.
export function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [&_a]:underline [&_a]:decoration-brass-500/60 [&_code]:font-mono [&_code]:text-xs [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
