import './personal-details.css';

const icon = (drawing: string) => `<svg viewBox="0 0 40 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;
const skills = [
  { name: 'Web', detail: '把界面变成体验', key: 'web', art: '<rect x="4" y="5" width="32" height="26" rx="4"/><path d="M4 12h32M9 8.5h.1m4 0h.1m4 0h.1M15 18l-5 4 5 4m10-8 5 4-5 4m-3-9-4 10"/>' },
  { name: 'TypeScript', detail: '给想法一点秩序', key: 'typescript', art: '<path d="m7 4 27 2-1 26-28-1Z"/><path d="M11 15h12m-6 0v12m16-10c-8-6-12 2-5 4s1 10-5 5"/>' },
  { name: 'Golang', detail: '让服务轻快运转', key: 'go', art: '<path d="M4 14h8M2 20h8m-5 6h6"/><path d="M16 14c8-8 19-4 19 6s-11 14-19 6m0-12c-4 5-4 8 0 12m19-6h-8"/><path d="M24 10V6m6 5 3-4"/>' },
  { name: 'Java', detail: '把复杂稳稳接住', key: 'java', art: '<path d="M8 17h21l-2 11c-4 4-12 4-16 0Zm21 1c10-2 10 9-1 8M6 33h26M15 13c-8-7 9-6 2-12m7 13c-7-6 6-5 2-11"/>' },
  { name: 'Three.js', detail: '给屏幕一点纵深', key: 'three', art: '<path d="m20 3 16 10v15L20 34 4 25V10Zm0 0v15m0 16V18M4 10l16 8 16-5M4 25l16-7m0 0 16 10"/><circle cx="20" cy="18" r="2" fill="currentColor"/>' },
  { name: 'Godot', detail: '认真做点好玩的', key: 'godot', art: '<path d="m8 14-3-5 7-5 5 5h6l5-5 7 5-3 5v12l-7 6H15l-7-6Z"/><circle cx="15" cy="18" r="2.5"/><circle cx="25" cy="18" r="2.5"/><path d="M14 26h12m-6-7v5M8 23H4m28 0h4"/>' },
  { name: 'Full Stack', detail: '从第一像素，到最后一次部署。', key: 'fullstack', art: '<path d="m20 3 17 9-17 9L3 12Zm-17 16 17 9 17-9M3 26l17 9 17-9"/>' },
];

export const skillCardsMarkup = `<div class="skills-caption"><span>随手用的工具箱</span><span aria-hidden="true">TOOLS OF MY TRADE ✳</span></div>
<ul class="tech-stack" aria-label="技术技能" role="list">${skills.map(skill => `<li class="skill-item skill-${skill.key}"><article class="skill-card">${icon(skill.art)}<h3>${skill.name}</h3><p>${skill.detail}</p></article></li>`).join('')}</ul>`;

export const signatureMarkup = `<div class="about-signature"><span>保持好奇，保持动手。</span><div class="signature-mark"><span class="signature-name"><strong>chency</strong><svg viewBox="0 0 180 28" fill="none" aria-hidden="true"><path d="M5 20C41 9 103 7 159 10c17 1 11 5-4 6l-58 4c-14 1-12 4 4 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span><span class="signature-seal" aria-hidden="true">CY<span>手作</span></span></div></div>`;

export const contactEnvelopeIcon = `<svg class="contact-envelope" viewBox="0 0 64 52" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 23H1m5 8H3m56-9 4-4m-5 14 5 1"/><path d="m19 20-2-14 27-3 3 17" fill="#fbe7c0" stroke="#fbe7c0"/><path d="m23 10 9-1m-8 6 15-2" stroke="#a92e1e"/><rect x="9" y="18" width="46" height="30" rx="5" fill="#fbe7c0" stroke="#251d16"/><path d="m11 21 18 13q3 3 6 0l18-13M11 45l13-12m29 12L40 33" stroke="#251d16"/><path d="M28 40q4 4 8-1" stroke="#a92e1e"/><path d="M46 14c-9-4-7-10-3-9 3 0 3 3 3 3s3-4 6-2c4 3 0 7-6 8" fill="#a92e1e" stroke="#251d16" stroke-width="1.5"/></svg>`;
