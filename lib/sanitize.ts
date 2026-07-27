import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "del", "ins",
  "a", "code", "pre", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div", "sup", "sub",
  "img", "mark",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "class", "id",
  "src", "alt", "width", "height",
  "data-*",
];

const SAFE_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP: SAFE_URI_REGEXP,
    FORBID_ATTR: ["style", "onerror", "onload", "onclick", "onmouseover"],
  });
}

export default sanitizeHtml;
