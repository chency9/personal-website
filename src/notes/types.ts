export interface NoteSource {
  title: string;
  publisher: string;
  url: string;
  supports: string;
}

export interface NoteSection {
  id: string;
  title: string;
  body: string;
}

export interface TechnicalNote {
  slug: string;
  category: string;
  eyebrow: string;
  title: string;
  summary: string;
  readingMinutes: number;
  topics: string[];
  question: string;
  lead: string;
  sections: NoteSection[];
  conclusion: string;
  sources: NoteSource[];
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export function codeBlock(language: string, code: string) {
  return `<figure class="note-code"><figcaption>${escapeHtml(language)}</figcaption><pre tabindex="0" aria-label="${escapeHtml(language)} 代码示例"><code>${escapeHtml(code.trim())}</code></pre></figure>`;
}

export function citation(slug: string, number: number) {
  return `<a class="note-citation" href="#notes/${slug}/ref-${number}" aria-label="查看来源 ${number}">[${number}]</a>`;
}

export function callout(title: string, body: string) {
  return `<aside class="note-callout"><strong>${title}</strong><p>${body}</p></aside>`;
}
