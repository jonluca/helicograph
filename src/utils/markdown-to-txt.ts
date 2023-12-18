import type { Renderer } from "marked";
import { marked } from "marked";
import { escape, unescape } from "lodash-es";
import { load } from "cheerio";

const block = (text: string) => text + "\n\n";
const escapeBlock = (text: string) => escape(text) + "\n\n";
const line = (text: string) => text + "\n";
const inline = (text: string) => text;
const newline = () => "\n";
const empty = () => "";

const TxtRenderer: Renderer = {
  // Block elements
  code: escapeBlock,
  blockquote: block,
  html: empty,
  heading: block,
  hr: newline,
  list: (text) => block(text.trim()),
  listitem: line,
  checkbox: empty,
  paragraph: block,
  table: (header, body) => line(header + body),
  tablerow: (text) => line(text.trim()),
  tablecell: (text) => text + " ",
  // Inline elements
  strong: inline,
  em: inline,
  codespan: inline,
  br: newline,
  del: inline,
  link: (_0, _1, text) => text,
  image: (_0, _1, text) => text,
  text: inline,
  // etc.
  options: {},
};

function htmlLinkExtractor(html: string) {
  const $ = load(html);

  const links: string[] = [];

  [
    { tagName: "a", attr: "href" },
    { tagName: "area", attr: "href" },
    { tagName: "link", attr: "href" },

    { tagName: "audio", attr: "src" },
    { tagName: "embed", attr: "src" },
    { tagName: "iframe", attr: "src" },
    { tagName: "input", attr: "src" },
    { tagName: "img", attr: "src" },
    { tagName: "javascript", attr: "src" },
    { tagName: "source", attr: "src" },
    { tagName: "track", attr: "src" },
    { tagName: "video", attr: "src" },
  ].forEach(({ tagName, attr }) => {
    $(tagName).each((i, node) => {
      const link = $(node).attr(attr);
      if (link) {
        links.push(link);
      }
    });
  });

  return links;
}

export async function markdownLinkExtractor(markdown: string) {
  const html = await marked(markdown);
  const links = htmlLinkExtractor(html);
  return links.map((l) => {
    const trimmed = l.trim();
    // if it is surrounded by parentheses, remove them
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      return trimmed.slice(1, -1);
    }
    if (trimmed?.endsWith("%3E") || trimmed?.endsWith("%5D")) {
      return trimmed.slice(0, -3);
    }
    return trimmed;
  });
}

/**
 * Converts markdown to plaintext using the marked Markdown library.
 * Accepts [MarkedOptions](https://marked.js.org/using_advanced#options) as
 * the second argument.
 *
 * NOTE: The output of markdownToTxt is NOT sanitized. The output may contain
 * valid HTML, JavaScript, etc. Be sure to sanitize if the output is intended
 * for web use.
 *
 * @param markdown the markdown text to txtify
 * @param options  the marked options
 * @returns the unmarked text
 */
export function markdownToTxt(markdown: string): string {
  try {
    const unmarked = marked(markdown, { async: false, renderer: TxtRenderer }) as string;
    const unescaped = unescape(unmarked);
    const trimmed = unescaped.trim();
    return trimmed;
  } catch (e) {
    return markdown;
  }
}

const urlR2egex =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()'@:%_+.~#?!&//=]*)/gi;
// const urlRege2x = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi;

export const extractUrls = (str: string) => {
  if (!str) {
    return [];
  }

  if (str) {
    const urls = str.match(urlR2egex);
    if (urls) {
      return urls.map((url) => {
        const trimmed = url.trim();
        // if it is surrounded by parentheses, remove them
        if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
    }
  }
  return [];
};
export default markdownToTxt;
