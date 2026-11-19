import { publicAsset } from './public-assets';

export const portfolioProjects = [
  {
    id: 'ceramic', tab: '瓷作', title: '瓷作工坊', english: 'CERAMIC ATELIER',
    url: 'https://docs.chency.site/ceramic/offline.html',
    tags: ['3D 交互', '手作体验'],
    description: '从一团泥，到一件属于自己的瓷器。在浏览器里体验拉坯、修坯、装饰、施釉与烧成，让每一道工序都看得见。',
    features: ['六步制瓷', '釉色实时预览', '旋转与缩放'],
    alt: '瓷作工坊界面：木质工作台上的青花瓷瓶，左侧可选择釉色与釉层厚度',
    action: '进入瓷作工坊', note: '在浏览器里，慢慢做一件器物。',
  },
  {
    id: 'mechanical', tab: '机械', title: '3D 机械拆解', english: 'BIOMIMETIC ROBOTICS',
    url: 'https://docs.chency.site/mechanical3d/',
    tags: ['3D 可视化', '仿生机械'],
    description: '走近一台仿生机械，拆开外壳看看它如何运动。选择部件、调整拆解程度，配合动作控制与多种视角探索机械结构。',
    features: ['部件拆解', '线框与标注', '动作控制'],
    alt: '3D 机械拆解界面：白色八足仿生机械蝎，左右面板展示关节数据、部件选择和拆解滑杆',
    action: '探索机械结构', note: '拆开看一看，理解每一次运动。',
  },
  {
    id: 'shanmenzhi', tab: '武侠', title: '山门志', english: 'SHANMEN CHRONICLES',
    url: 'https://docs.chency.site/shanmenzhi/',
    tags: ['武侠门派经营', '浏览器游戏'],
    description: '以掌门的身份，经营属于自己的武侠门派。在山水与江湖之间，写下门派的成长故事，云端账册保存这一程的经历。',
    features: ['门派经营', '武侠世界', '云端存档'],
    alt: '山门志登录界面：月夜山水、树下侠客与居中的掌门云端账册',
    action: '前往山门志', note: '需要管理员分配的账号登录。',
  },
  {
    id: 'md2book', tab: '排版', title: 'Markdown 排版引擎', english: 'MARKDOWN TO BOOK',
    url: 'https://docs.chency.site/md2book.html',
    tags: ['效率工具', '文档排版'],
    description: '让 Markdown 从文字草稿变成一份好看的文档。导入内容、切换排版风格、配置书籍信息，随时预览桌面和手机上的阅读效果。',
    features: ['多风格排版', '书籍元数据', '双端预览'],
    alt: 'Markdown 排版引擎界面：左侧排版风格和书籍元数据设置，右侧显示纸质书风格的文档预览',
    action: '打开排版引擎', note: '给文字一个更舒服的阅读方式。',
  },
] as const;

export const portfolioMarkup = `
<section class="works-section wrap" id="works" aria-labelledby="works-title">
  <div class="section-top"><div><p class="eyebrow">SELECTED WORKS / BUILT BY CHENCY</p><h2 id="works-title">把想法，<span class="hand-underline">做成作品。</span></h2></div><p class="section-aside">四个作品，四种好奇心。<br>从数字手作到机械、江湖与文字。</p></div>
  <div class="works-folder">
    <hose-tabs id="works-tabs" label="选择作品">${portfolioProjects.map((project, index) => `<option value="${project.id}"${index === 0 ? ' selected' : ''}>${project.tab}</option>`).join('')}</hose-tabs>
    <div class="works-panels">${portfolioProjects.map((project, index) => `
      <article class="work-card" data-work="${project.id}" role="tabpanel" aria-label="${project.title}"${index === 0 ? '' : ' hidden'}>
        <span class="work-browser-line" aria-hidden="true">docs.chency.site <span>↗</span></span>
        <img src="${publicAsset(`/projects/${project.id}-1600.webp`)}" srcset="${publicAsset(`/projects/${project.id}-800.webp`)} 800w, ${publicAsset(`/projects/${project.id}-1600.webp`)} 1600w" sizes="(max-width: 780px) calc(100vw - 40px), (max-width: 1100px) calc(100vw - 72px), (max-width: 1336px) calc(100vw - 112px), 1224px" width="1600" height="766" alt="${project.alt}" loading="lazy" decoding="async" />
        <header class="work-heading"><p class="eyebrow">0${index + 1} / 04 · ${project.english}</p><h3>${project.title}</h3><div class="work-tags">${project.tags.map(tag => `<span>${tag}</span>`).join('')}</div></header>
        <div class="work-description"><p>${project.description}</p><ul>${project.features.map(feature => `<li>${feature}</li>`).join('')}</ul></div>
        <footer class="work-footer"><p>${project.note}</p><a class="button button-red" href="${project.url}" target="_blank" rel="noopener noreferrer" aria-label="${project.action}（新标签页）">${project.action} <span aria-hidden="true">↗</span></a></footer>
      </article>`).join('')}
    </div>
  </div>
</section>`;

export function initPortfolio(settlePausedControls: () => void) {
  const tabs = document.querySelector('#works-tabs')!;
  tabs.addEventListener('change', event => {
    const value: unknown = (event as CustomEvent<{ value: string }>).detail?.value;
    if (!portfolioProjects.some(project => project.id === value)) return;
    document.querySelectorAll<HTMLElement>('[data-work]').forEach(panel => {
      panel.hidden = panel.dataset.work !== value;
    });
    settlePausedControls();
  });
}
