/* ============================================
   TIMELINE — 拾光足迹抽屉 / 弹窗
   路径：src/scripts/timeline.js

   包含：
   1. 内联注入 CSS（原 src/styles/timeline.css，已合并，无需单独 .css 文件）
   2. 动态注入 #timeline-overlay + #timeline-sheet HTML
   3. openTimeline / closeTimeline（全局暴露）
   4. window.timelineOpen 状态标记（供主脚本 popstate 读取）

   注意：随机文案注入由 src/scripts/memento.js 负责，
   timeline.js 加载后 memento.js 会自动调用 .tl-days-prefix
   和 .timeline-sheet-body 完成内容填充。
============================================ */

(function () {

    /* ── 1. 内联注入 CSS（原 src/styles/timeline.css，已合并）── */
    const style = document.createElement('style');
    style.textContent = `
/* ============================================
   TIMELINE — 拾光足迹抽屉 / 弹窗 样式
   路径：src/styles/timeline.css
   由 src/scripts/timeline.js 动态注入 <link>
============================================ */

#timeline-overlay {
    position: fixed;
    inset: 0;
    z-index: 400;
    background: rgba(0,0,0,0.32);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s cubic-bezier(0.4,0,0.2,1);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
}
#timeline-overlay.active {
    opacity: 1;
    pointer-events: auto;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
}

/* 移动端：底部抽屉 */
#timeline-sheet {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    z-index: 401;
    background: var(--bg-color, #F2F2F7);
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -4px 32px rgba(0,0,0,0.18), 0 0 0 0.5px var(--card-border);
    max-height: 88dvh;
    display: none;
    flex-direction: column;
    transform: translateY(105%);
    transition: transform 0.42s cubic-bezier(0.32,0.72,0,1);
    will-change: transform;
}
#timeline-sheet.open {
    display: flex;
    transform: translateY(0);
}
[data-theme="dark"] #timeline-sheet {
    background: #1C1C1E;
}

/* 桌面端：居中弹窗（≥600px） */
@media (min-width: 600px) {
    #timeline-sheet {
        left: 50%;
        right: auto;
        bottom: auto;
        top: 50%;
        width: 600px;
        max-width: calc(100vw - 48px);
        max-height: 88dvh;
        border-radius: 22px;
        transform: translate(-50%, -48%) scale(0.92);
        opacity: 0;
        transition: transform 0.32s cubic-bezier(0.32,0.72,0,1),
                    opacity 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    #timeline-sheet.open {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
    #timeline-sheet .timeline-drag-bar { display: none; }
}

.timeline-drag-bar {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 10px 0 2px;
    flex-shrink: 0;
}
.timeline-drag-bar::after {
    content: '';
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-color);
}
.timeline-sheet-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px 16px;
    flex-shrink: 0;
}
.timeline-sheet-title-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, #3B7DFE 0%, #6FA3FF 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(59,125,254,0.35);
}
.timeline-sheet-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text-main);
}
.timeline-sheet-close {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--fill-1);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-sub);
    font-size: 13px;
    font-weight: 600;
    margin-left: auto;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.1s;
}
.timeline-sheet-close:active { background: var(--fill-2); }

.timeline-sheet-body {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 20px 16px;
    flex: 1;
}

/* ── 天数大数字卡片 ── */
.tl-days-card {
    background: var(--card-bg);
    border-radius: 18px;
    padding: 18px 20px 16px;
    margin-bottom: 8px;
    box-shadow: 0 1px 4px var(--shadow-1), 0 0 0 0.5px var(--card-border);
    display: flex;
    align-items: center;
    gap: 0;
}
.tl-days-right {
    flex: 1;
    padding-left: 0;
    padding-right: 20px;
    border-right: 1px solid var(--separator, rgba(0,0,0,0.07));
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    justify-content: center;
}
[data-theme="dark"] .tl-days-right {
    border-right-color: rgba(255,255,255,0.08);
}
.tl-days-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding-left: 20px;
    padding-right: 0;
    border-right: none;
}
.tl-days-number-wrap {
    display: flex;
    align-items: baseline;
    gap: 4px;
}
.tl-days-number {
    font-size: 48px;
    font-weight: 800;
    color: var(--accent-color);
    letter-spacing: -2px;
    line-height: 1;
    display: inline-block;
}
.tl-days-unit {
    font-size: 17px;
    font-weight: 500;
    color: var(--text-main);
    display: inline-block;
    margin-bottom: 2px;
}
.tl-days-caption {
    font-size: 11px;
    color: var(--text-sub);
    letter-spacing: 1px;
    white-space: nowrap;
}
.tl-days-prefix {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    letter-spacing: 0.2px;
    line-height: 1.4;
}
.tl-days-sub {
    font-size: 12px;
    color: var(--text-sub);
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.tl-days-sub-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
}
.tl-days-start {
    color: var(--accent-color);
    font-weight: 500;
    white-space: nowrap;
}
.tl-days-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34C759;
    display: inline-block;
    flex-shrink: 0;
}
.tl-days-status {
    color: var(--text-sub);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── 故事卡片（由 memento.js 动态注入） ── */
.tl-story-card {
    background: var(--card-bg);
    border-radius: 18px;
    padding: 18px 18px 16px;
    box-shadow: 0 1px 4px var(--shadow-1), 0 0 0 0.5px var(--card-border);
    margin-bottom: 8px;
}
.tl-story-heading {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 12px;
}
.tl-story-p {
    font-size: 13.5px;
    color: var(--text-sub);
    line-height: 1.7;
    margin-bottom: 10px;
}
.tl-story-p:last-of-type { margin-bottom: 0; }
.tl-story-highlight {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--accent-color);
    margin-top: 12px;
    line-height: 1.6;
}

/* ── 底部按钮 ── */
.tl-footer {
    padding: 12px 20px 20px;
    border-top: 0.5px solid var(--separator);
    flex-shrink: 0;
}
.tl-ok-btn {
    width: 100%;
    padding: 14px 0;
    background: var(--accent-color);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s, transform 0.12s;
}
.tl-ok-btn:active {
    transform: scale(0.97);
    opacity: 0.85;
}
    `;
    document.head.appendChild(style);

    /* ── 2. 注入 HTML ── */
    const html = `
    <!-- ════ 拾光足迹 抽屉/弹窗 ════ -->
    <div id="timeline-overlay" style="display:none"></div>
    <div id="timeline-sheet" style="display:none">
        <div class="timeline-drag-bar"></div>

        <!-- 标题行：图标 + 文字 -->
        <div class="timeline-sheet-header">
            <div class="timeline-sheet-title-icon">📅</div>
            <span class="timeline-sheet-title">拾光足迹</span>
        </div>

        <!-- 可滚动正文 -->
        <div class="timeline-sheet-body">

            <!-- 天数卡片 -->
            <div class="tl-days-card">
                <!-- 左：文案 + 副信息 -->
                <div class="tl-days-right">
                    <div class="tl-days-prefix"></div><!-- 文案由 memento.js 随机注入 -->
                    <div class="tl-days-sub">
                        <div class="tl-days-sub-row">
                            从 <span class="tl-days-start">2026年3月1日</span> 开始
                        </div>
                        <div class="tl-days-sub-row">
                            <span class="tl-days-dot"></span>
                            <span class="tl-days-status">持续更新向更好的方向迈进…</span>
                        </div>
                    </div>
                </div>
                <!-- 右：大数字 -->
                <div class="tl-days-left">
                    <div class="tl-days-number-wrap">
                        <span class="tl-days-number" id="tl-days-number">…</span>
                        <span class="tl-days-unit">天</span>
                    </div>
                    <div class="tl-days-caption">相伴至今</div>
                </div>
            </div>

            <!-- 拾光者视角 —— 由 memento.js 动态注入 -->
        </div>

        <!-- 底部按钮 -->
        <div class="tl-footer">
            <button class="tl-ok-btn" onclick="closeTimeline()">我知道了</button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    /* ── 3. 状态标记 ── */
    window.timelineOpen = false;

    /* ══════════════════════════════════════════════
       原 memento.js 内容（已合并，memento.js 可删除）
       ══════════════════════════════════════════════ */

    const START_DATE = new Date('2026-03-01T00:00:00');

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
        // 在下方继续添加新篇章：
        // {
        //   heading: '✨ 你的标题',
        //   paragraphs: ['第一段……', '第二段……'],
        //   highlight: '结尾金句',
        // },
    ];

    function applyRandomPhrase() {
        const el = document.querySelector('.tl-days-prefix');
        if (!el) return;
        el.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }

    function renderDays() {
        const el = document.getElementById('tl-days-number');
        if (el) el.textContent = Math.floor((new Date() - START_DATE) / 86400000);
    }

    function renderStory() {
        const body = document.querySelector('.timeline-sheet-body');
        if (!body) return;
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

    /* ── 4. 开启 ── */
    window.openTimeline = function () {
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

        window.timelineOpen = true;
        window.history.pushState({ state: 'timeline' }, '');

        applyRandomPhrase();
        renderDays();
        renderStory();
    };

    /* ── 5. 关闭 ── */
    window.closeTimeline = function (fromPopstate) {
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

        window.timelineOpen = false;

        if (!fromPopstate) {
            // replaceState 原地替换弹窗历史条目，不触发任何导航
            // 绝不调用 back()/go(-1)，避免 GitHub Pages 下退出页面
            window.history.replaceState({ state: 'base' }, '');
        }
    };

})();
