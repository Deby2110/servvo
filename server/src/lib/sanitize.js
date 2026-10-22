import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i',
    'u', 's', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'hr', 'figure',
    'figcaption', 'div', 'span', 'iframe', 'sup', 'sub',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height',
    'colspan', 'rowspan', 'style', 'allow', 'allowfullscreen', 'frameborder',
    'controls', 'loading',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  if (typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, CONFIG);
}
