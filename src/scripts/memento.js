
/**
 * memento.js — 拾光足迹模块
 * 智汇仓库 · 拾光足迹弹窗的所有逻辑
 */

(function () {

  // ── 1. 配置：起始日期 ──────────────────────────────────────────────────
  const START_DATE = new Date('2026-03-01T00:00:00');

  // ── 2. 随机短语库（可在此添加更多有温度的词）────────────────────────────
  const phrases = [
    "与美好相遇",
    "拾起岁月的贝壳",
    "在数字荒原漫步",
    "记录纯粹的光芒",
    "按下生活的暂停键",
    "寻找灵魂的共鸣",
    "于此间停留",
    "捕捉时间的切面",
    "在数字洪流中驻足",
    "慢下来的数字生活",
    "与光阴握手言和",
    "打捞遗失的美好",
    "在像素间寻宝",
    "偶遇灵魂的火花",
    "回归工具的本真",
    "给代码赋予温度",
    "在秩序中寻找自由",
    "收集散落的灵感",
    "不追逐，自有光芒",
    "独享这片静谧角落",
    "遇见久违的纯粹"
  ];

  // ── 3. 短文案库（每次打开随机换一篇，可在此自由添加）──────────────────
  //
  //  每篇格式：
  //  {
  //    heading:    '🌊 标题',           // 卡片标题，带 emoji
  //    paragraphs: ['段落1', '段落2'],  // 正文段落数组
  //    highlight:  '结尾金句',          // 底部高亮句，可留空 ''
  //  }
  //
  const essays = [
    {
      heading: '🌊 数字世界的浪漫留白',
      paragraphs: [
        '在这个万物皆被算法标记、万物都在追逐"最新版本"的时代，我们似乎渐渐失去了对一件工具最原始的审美。智汇仓库的诞生，并不是为了做一个冷冰冰的下载器，而是想在喧嚣的互联网角落，按下一次微小的"暂停键"。',
        '这里收录的每一款软件，都像是我们在数字荒原里捡拾到的贝壳。',
        '我们不设预案，不划定边界，只是随性地收录那些撞进眼帘的灵感。它们有的出自独立开发者之手，带着鲜明的性格与偏执；有的交互优雅、灵魂有趣，即便不再更迭，依然闪烁着纯粹的光芒。',
        '我们从不刻意追求所谓的"功能堆砌"。因为我们相信，软件最动人的时刻，往往藏在它最本真、最原始的那个切面里。我们不想要一个臃肿的资源库，而想要一座属于数字美学的"标本馆"——收录那些转瞬即逝的创意，留住那些不该被掩埋的像素。',
        '这里没有广告的喧嚣，没有红点的催促。我们把复杂留给代码，把最干净的相遇留给你。',
      ],
      highlight: '随缘遇见，不负责更新世界，只负责收藏美好',
    },

    // ── 在下方继续添加新篇章 ──────────────────────────────────────────────
    // {
    //   heading: '✨ 你的标题',
    //   paragraphs: [
    //     '第一段……',
    //     '第二段……',
    //   ],
    //   highlight: '结尾金句',
    // },

  ];

  // ── 4. 随机取一句短语，写入 .tl-days-prefix ──────────────────────────
  function applyRandomPhrase() {
    const el = document.querySelector('.tl-days-prefix');
    if (!el) return;
    const pick = phrases[Math.floor(Math.random() * phrases.length)];
    el.textContent = pick;
  }

  // ── 5. 计算并渲染天数 ─────────────────────────────────────────────────
  function renderDays() {
    const days = Math.floor((new Date() - START_DATE) / 86400000);
    const el = document.getElementById('tl-days-number');
    if (el) el.textContent = days;
  }

  // ── 6. 随机取一篇短文，渲染到故事卡片 ───────────────────────────────────
  function renderStory() {
    const body = document.querySelector('.timeline-sheet-body');
    if (!body) return;

    // 每次打开都重新随机换一篇
    const existing = body.querySelector('.tl-story-card');
    if (existing) existing.remove();

    const essay = essays[Math.floor(Math.random() * essays.length)];

    const card = document.createElement('div');
    card.className = 'tl-story-card';

    const heading = document.createElement('div');
    heading.className = 'tl-story-heading';
    heading.textContent = essay.heading;
    card.appendChild(heading);

    essay.paragraphs.forEach(text => {
      const p = document.createElement('p');
      p.className = 'tl-story-p';
      p.textContent = text;
      card.appendChild(p);
    });

    if (essay.highlight) {
      const hl = document.createElement('div');
      hl.className = 'tl-story-highlight';
      hl.textContent = essay.highlight;
      card.appendChild(hl);
    }

    body.appendChild(card);
  }

  // ── 7. 打开弹窗 ───────────────────────────────────────────────────────
  function openTimeline() {
    if (typeof closeSettings === 'function') closeSettings();

    const overlay = document.getElementById('timeline-overlay');
    const sheet   = document.getElementById('timeline-sheet');
    if (!overlay || !sheet) return;

    overlay.style.display = 'block';
    sheet.style.display   = 'flex';
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('active');
        sheet.classList.add('open');
      });
    });

    window.history.pushState({ state: 'timeline' }, '');

    // 每次打开：随机短语、天数、短文全部刷新
    applyRandomPhrase();
    renderDays();
    renderStory();
  }

  // ── 8. 关闭弹窗 ───────────────────────────────────────────────────────
  function closeTimeline(fromPopstate) {
    const overlay = document.getElementById('timeline-overlay');
    const sheet   = document.getElementById('timeline-sheet');
    if (!overlay || !sheet) return;

    overlay.classList.remove('active');
    sheet.classList.remove('open');
    document.body.style.overflow = '';

    setTimeout(() => {
      overlay.style.display = 'none';
      sheet.style.display   = 'none';
    }, 420);

    if (!fromPopstate) {
      window._timelineClosing = true;
      window.history.back();
    }
  }

  // ── 9. 挂载到全局 ────────────────────────────────────────────────────
  window.openTimeline  = openTimeline;
  window.closeTimeline = closeTimeline;

})();
