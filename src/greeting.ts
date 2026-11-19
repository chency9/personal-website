/** Play the greeting once, while keeping the complete phrase accessible. */
export function initGreeting() {
  const text = document.querySelector<HTMLElement>('.speech-typewriter')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || document.documentElement.classList.contains('motion-paused')) return;

  function finish() {
    text.classList.remove('is-typing');
    observer.disconnect();
    motion.removeEventListener('change', onMotionChange);
    text.removeEventListener('animationend', onAnimationEnd);
  }
  function onMotionChange() {
    if (motion.matches) finish();
  }
  function onAnimationEnd(event: AnimationEvent) {
    if (event.animationName === 'speech-cursor-blink') finish();
  }
  const observer = new MutationObserver(() => {
    if (document.documentElement.classList.contains('motion-paused')) finish();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  motion.addEventListener('change', onMotionChange);
  text.addEventListener('animationend', onAnimationEnd);
  text.classList.add('is-typing');
}
