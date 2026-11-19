import './notes.css';
import { technicalNotes } from './articles';
import { mountNoteDemos } from './demos';
import { articleRatingMarkup, mountReadingControls } from './reading-controls';
import { escapeHtml } from './types';
import type { TechnicalNote } from './types';

export const notesSectionMarkup = `<section class="notes-section wrap" id="notes" aria-labelledby="notes-heading">
  <div class="section-top"><div><p class="eyebrow">NOTES FROM THE WORKBENCH</p><h2 id="notes-heading" tabindex="-1">写代码时，<span class="hand-underline">也写点想法。</span></h2></div><p class="section-aside">从坐标与射线，到 Agent 与内网知识库。<br>把原理拆开，把边界讲清楚。</p></div>
  <div class="notes-list">${technicalNotes.map(note => `<a class="note-row" href="#notes/${note.slug}" data-note-link="${note.slug}"><span class="note-tag">${note.category}</span><div class="note-row-copy"><h3>${note.title}</h3><p>${note.summary}</p><span class="note-row-topics">${note.topics.join(' · ')}</span></div><span class="note-time">${note.readingMinutes} MIN READ</span><span class="note-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
  <p class="notes-method">每篇附推导、可运行实验与一手来源。<span>公式不是装饰，工程没有银弹。</span></p>
</section>`;

function renderArticle(note: TechnicalNote) {
  const url = `#notes/${note.slug}`;
  const next = technicalNotes[(technicalNotes.indexOf(note) + 1) % technicalNotes.length];
  return `<header class="article-header wrap"><span class="article-header-label">CHENCY / FIELD NOTES</span><span class="article-header-category">${note.category}</span></header>
  <main class="article-main wrap" id="article-main">
    <nav class="article-breadcrumb" aria-label="文章路径"><ol><li><a href="#">首页</a></li><li><a href="#notes">开发手记</a></li><li><a href="${url}" aria-current="page">${note.category}</a></li></ol></nav>
    <article aria-labelledby="article-title">
      <header class="article-intro"><p class="eyebrow">${note.eyebrow}</p><h1 id="article-title" tabindex="-1">${note.title}</h1><p class="article-deck">${note.summary}</p><div class="article-meta"><span>chency · 研究整理</span><time datetime="2026-11-19">2026.11.19</time><span>约 ${note.readingMinutes} 分钟</span><span>${note.sources.length} 份原始资料</span></div><div class="article-topics">${note.topics.map(topic => `<span>${topic}</span>`).join('')}</div></header>
      <div class="article-layout"><aside class="article-margin"><details class="article-toc" open><summary>本文目录 <span aria-hidden="true">↙</span></summary><nav aria-label="文章目录"><ol>${note.sections.map(section => `<li><a href="${url}/${section.id}">${section.title}</a></li>`).join('')}<li><a href="${url}/sources">参考原文</a></li></ol></nav></details><p class="article-margin-note">把公式写在纸上，<br>把假设带进实验。</p></aside>
      <div class="article-prose"><div class="article-reading-range"><div class="article-question"><span>先把问题说清楚</span><strong>${note.question}</strong></div><div class="article-lead">${note.lead}</div>
        ${note.sections.map(section => `<section id="article-${section.id}" class="article-section"><h2 tabindex="-1">${section.title}</h2>${section.body}</section>`).join('')}
        <aside class="article-conclusion"><span>留在工作台上的判断</span><p>${note.conclusion}</p></aside>
        <section class="article-sources" id="article-sources"><h2 tabindex="-1">参考原文与核验说明</h2><p>以下为论文、官方文档或实现源码，核验于 2026 年 11 月 19 日。正文的方案选择是基于这些资料的工程分析，文中实验是本地教学模型；未声明任何真实系统的性能测试结果。</p><ol>${note.sources.map((source, index) => `<li id="article-ref-${index + 1}"><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${source.title}<span aria-hidden="true"> ↗</span></a><span class="note-source-owner">${source.publisher}</span><p>${source.supports}</p></li>`).join('')}</ol></section>
        </div>${articleRatingMarkup(note)}
        <nav class="article-next" aria-label="继续阅读"><a href="#notes">← 全部开发手记</a><a href="#notes/${next.slug}"><span>继续读一篇</span><strong>${next.title} ↗</strong></a></nav>
      </div></div>
    </article>
  </main><footer class="article-footer wrap"><span>写代码，造世界。也追问它为什么成立。</span><a href="${url}/start">回到文章顶部 ↑</a></footer>`;
}

export function initNotes() {
  const home = document.querySelector<HTMLElement>('#home-view')!;
  const reader = document.querySelector<HTMLElement>('#article-view')!;
  const skip = document.querySelector<HTMLAnchorElement>('.skip-link')!;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')!;
  const homeDescription = description.content;
  const homeTitle = document.title;
  let activeSlug: string | null = null;
  let returnFocus: HTMLElement | null = null;
  let homeScroll = 0;
  let controller = new AbortController();
  let routeVersion = 0;

  function route(initial = false) {
    const version = ++routeVersion;
    const parts = /^#notes\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/.exec(location.hash);
    const note = parts ? technicalNotes.find(item => item.slug === parts[1]) : undefined;
    const isArticle = location.hash.startsWith('#notes/');
    if (isArticle) {
      if (!home.hidden) {
        homeScroll = window.scrollY;
        returnFocus = document.activeElement instanceof HTMLElement && home.contains(document.activeElement) ? document.activeElement : null;
        document.querySelector<HTMLButtonElement>('.cat-bubble-close')?.click();
        document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
      }
      home.hidden = true;
      home.inert = true;
      reader.hidden = false;
      reader.inert = false;
      if (activeSlug !== (note?.slug ?? 'missing')) {
        controller.abort();
        controller = new AbortController();
        if (note) {
          reader.innerHTML = renderArticle(note);
          reader.querySelector<HTMLDetailsElement>('.article-toc')!.open = matchMedia('(min-width: 851px)').matches;
          mountNoteDemos(reader, controller.signal);
          mountReadingControls(reader, note, controller.signal);
        } else reader.innerHTML = `<main class="article-missing wrap"><p class="eyebrow">PAGE NOT FOUND</p><h1 id="article-title" tabindex="-1">这页手记还没写到。</h1><p>可以先回工作台，挑一篇已经整理好的文章。</p><a class="button button-dark" href="#notes">返回开发手记</a></main>`;
        activeSlug = note?.slug ?? 'missing';
      }
      document.title = `${note?.title ?? '手记未找到'} — chency 开发手记`;
      description.content = note?.summary ?? '回到 chency 的技术开发手记。';
      skip.href = note ? `#notes/${note.slug}/start` : '#notes';
      requestAnimationFrame(() => {
        if (version !== routeVersion) return;
        const section = parts?.[2];
        const target = section && section !== 'start' ? reader.querySelector<HTMLElement>(`#article-${section}`) : null;
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'instant' });
          const focusTarget = target.querySelector<HTMLElement>('h2') ?? target;
          focusTarget.tabIndex = -1;
          focusTarget.focus({ preventScroll: true });
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
          reader.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
        }
      });
    } else {
      const wasReading = activeSlug !== null;
      controller.abort();
      reader.hidden = true;
      reader.inert = true;
      reader.replaceChildren();
      activeSlug = null;
      home.hidden = false;
      home.inert = false;
      document.title = homeTitle;
      description.content = homeDescription;
      skip.href = '#hello';
      if (wasReading || initial && location.hash) requestAnimationFrame(() => {
        if (version !== routeVersion) return;
        const target = document.getElementById(location.hash.slice(1));
        if (location.hash === '#notes' && wasReading && homeScroll > 0) window.scrollTo({ top: homeScroll, behavior: 'instant' });
        else if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
        else window.scrollTo({ top: 0, behavior: 'instant' });
        if (wasReading) (location.hash === '#notes' ? returnFocus ?? document.querySelector<HTMLElement>('#notes-heading') : document.querySelector<HTMLElement>('#hello'))?.focus({ preventScroll: true });
      });
    }
  }
  window.addEventListener('hashchange', () => route());
  route(true);
}
