import './back-top.css';

type BackTopCharacter = HTMLElement & { appear(): void; refresh(): void };

export function initBackToTop() {
  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-top-sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  const dock = document.createElement('div');
  dock.id = 'scroll-top-dock';
  dock.className = 'scroll-top-dock';
  dock.innerHTML = '<div class="scroll-top-figure"><hose-back-top label="返回顶部"></hose-back-top><span class="scroll-top-caption" aria-hidden="true">回到顶部 <span>↑</span></span></div>';
  // Fixed controls live outside the film reel's transformed stacking context.
  document.body.prepend(sentinel);
  document.body.append(dock);
  const character = dock.querySelector<BackTopCharacter>('hose-back-top')!;
  const nativeScrollState = CSS.supports('container-type', 'scroll-state');
  const nativeScrollSizing = CSS.supports('animation-timeline', 'scroll()');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let returningFocus = false;
  let wasScrolled = false;

  const heading = () => document.querySelector<HTMLElement>('#article-view:not([hidden]) h1') ?? document.querySelector<HTMLElement>('#hello');
  const focusHeading = () => heading()?.focus({ preventScroll: true });
  const focusIsInDock = () => dock.contains(document.activeElement);
  const stillMotion = () => reducedMotion.matches || document.documentElement.classList.contains('motion-paused');

  function updateSize() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0;
    // At 60%, the narrowest layout still has a real button wider than 44px.
    const scale = dock.dataset.page === 'article' ? 1 : .6 + progress * .4;
    dock.style.setProperty('--scroll-top-scale', String(scale));
  }

  function updateSizingMode() {
    // Still mode follows the current scroll position without an animation.
    dock.dataset.scrollSizing = nativeScrollSizing && !stillMotion() ? 'native' : 'manual';
    updateSize();
  }

  function updatePage() {
    const article = location.hash.startsWith('#notes/');
    dock.dataset.page = article ? 'article' : 'home';
    character.setAttribute('label', article ? '返回文章顶部' : '返回顶部');
    updateSizingMode();
    // Routing restores scroll after changing the visible content.
    requestAnimationFrame(updateSize);
  }

  function updateMotion() {
    updateSizingMode();
    character.refresh();
  }

  dock.addEventListener('click', () => {
    returningFocus = focusIsInDock();
    window.scrollTo({ top: 0, behavior: stillMotion() ? 'instant' : 'smooth' });
    if (window.scrollY === 0 && returningFocus) { returningFocus = false; focusHeading(); }
  });

  // CSS owns native visibility. The sentinel also handles focus at the boundary
  // and supplies the same dynamic behavior in Firefox/Safari without queries.
  const observer = new IntersectionObserver(entries => {
    const scrolled = entries[entries.length - 1].intersectionRatio < 1;
    if (!nativeScrollState) dock.dataset.scrolled = String(scrolled);
    if (scrolled && !wasScrolled) character.appear();
    if (!scrolled && (focusIsInDock() || returningFocus && document.activeElement === document.body)) focusHeading();
    if (!scrolled) returningFocus = false;
    wasScrolled = scrolled;
  }, { threshold: [0, 1] });

  dock.addEventListener('focusout', event => {
    if (!event.relatedTarget) requestAnimationFrame(() => {
      if (window.scrollY === 0 && document.activeElement === document.body) focusHeading();
    });
  });
  window.addEventListener('hashchange', updatePage);
  window.addEventListener('scroll', () => {
    if (dock.dataset.scrollSizing === 'manual' && dock.dataset.page === 'home') updateSize();
  }, { passive: true });
  window.addEventListener('resize', updateSize);
  const size = new ResizeObserver(updateSize);
  size.observe(document.body);
  const motion = new MutationObserver(updateMotion);
  motion.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  reducedMotion.addEventListener('change', updateMotion);
  updatePage();
  void customElements.whenDefined('hose-back-top').then(() => {
    dock.dataset.ready = 'true';
    observer.observe(sentinel);
    character.refresh();
  });
}
