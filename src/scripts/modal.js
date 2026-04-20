/* ============================================
   MODAL & PREVIEW — 应用详情弹窗 + 截图预览层
   路径：src/scripts/modal.js

   包含：
   1. 内联注入 CSS（原 src/styles/modal.css，已合并，无需单独 .css 文件）
   2. 动态注入 modal-overlay + preview-overlay HTML
   3. openModal / handleBack / copyPkg
   4. openPreview / handlePreviewBack / updatePreviewUI / changePreview
   5. onScreenshotLoad / onScreenshotError / preloadScreenshotSizes
   6. preview 触摸滑动手势
============================================ */

(function () {

    /* ── 1. 内联注入 CSS（原 src/styles/modal.css，已合并）── */
    const style = document.createElement('style');
    style.textContent = `
/* ============================================
   MODAL & PREVIEW — 应用详情弹窗 + 截图预览层 样式
   路径：src/styles/modal.css
============================================ */

/* ---- Modal (iOS Sheet style) ---- */
#modal-overlay {
    display: none;
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0);
    z-index: 1000;
    justify-content: center;
    align-items: flex-end;
    padding: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    overscroll-behavior: none;
}

@media (min-width: 600px) {
    #modal-overlay { align-items: center; padding: 20px; }
}

#modal-overlay.active {
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

/* ── modal-content：移动端底部抽屉，桌面端居中弹窗 ── */
.modal-content {
    background: var(--card-bg);
    width: 100%;
    max-width: 520px;
    border-radius: 20px 20px 0 0;
    position: relative;
    padding: 0;
    box-shadow: 0 -2px 30px rgba(0,0,0,0.22);
    transform: translateY(100%);
    opacity: 1;
    transition: transform 0.38s cubic-bezier(0.32, 0.72, 0, 1);
    color: var(--text-main);
    /* 移动端：flex 纵向，内容区滚动，底部按钮固定 */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* dvh：动态视口，自动扣除浏览器地址栏高度 */
    max-height: 92dvh;
}

/* 移动端滚动区：flex 撑满剩余空间 */
.modal-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
}

/* ── 桌面端（≥600px）：恢复原始 overflow 滚动，不用 flex ── */
@media (min-width: 600px) {
    .modal-content {
        border-radius: 20px;
        transform: scale(0.94) translateY(16px);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.25s ease;
        /* 桌面端：取消 flex，改回 overflow 滚动 */
        display: block;
        overflow: visible;
        max-height: 88dvh;
    }
    /* 桌面端滚动区：直接限高 + overflow */
    .modal-scroll {
        flex: none;
        min-height: unset;
        max-height: calc(88dvh - 70px); /* 留出底部按钮区高度 */
        overflow-y: auto;
        overflow-x: hidden;
    }
    /* 桌面端底栏：去掉分隔线，圆角配合弹窗 */
    .modal-footer {
        border-top: none;
        padding: 8px 28px 18px;
        border-radius: 0 0 20px 20px;
    }
}

#modal-overlay.active .modal-content {
    transform: translateY(0);
    opacity: 1;
}

@media (min-width: 600px) {
    #modal-overlay.active .modal-content {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}

/* Drag handle */
.modal-content::before {
    content: "";
    display: block;
    width: 36px; height: 5px;
    background: var(--fill-1);
    border-radius: 3px;
    margin: 10px auto 4px;
}

@media (min-width: 600px) {
    .modal-content::before { display: none; }
}

.modal-inner-pad { padding: 8px 20px 16px; }

.close-btn {
    position: absolute;
    top: 14px; right: 16px;
    width: 30px; height: 30px;
    background: var(--fill-1);
    color: var(--text-sub);
    cursor: pointer;
    line-height: 30px;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    z-index: 200;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
}

.close-btn:hover { background: var(--fill-2); }

.modal-header {
    display: flex;
    align-items: center;
    margin-bottom: 18px;
}

/* 弹窗图标容器：统一裁切，与卡片图标同样方案 */
.modal-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    margin-right: 14px;
    flex-shrink: 0;
    overflow: hidden;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
    transform: translateZ(0);
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}

.modal-icon {
    width: 100%;
    height: 100%;
    border-radius: 0;
    object-fit: cover;
    display: block;
}

.modal-app-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1.2;
}

.modal-app-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
}

.modal-app-author {
    font-size: 13px;
    color: var(--text-sub);
    font-weight: 400;
}

.modal-app-author.has-link {
    color: var(--accent-color);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.modal-app-author.has-link:active {
    opacity: 0.6;
}

/* iOS grouped inset table style */
.modal-info-box {
    background: var(--modal-info-bg);
    border-radius: 12px;
    padding: 0;
    margin-bottom: 18px;
    overflow: hidden;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 0.5px solid var(--separator);
}

.info-row:last-child { border-bottom: none; }

.info-left { display: flex; align-items: center; flex: 1; overflow: hidden; }
.info-label { color: var(--text-sub); margin-right: 8px; flex-shrink: 0; font-size: 13px; }
.info-value { color: var(--text-main); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }

.pkg-section {
    border-top: 0.5px solid var(--separator);
    padding: 10px 14px;
}
.pkg-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
}
.pkg-value {
    font-family: "SF Mono", "Menlo", monospace;
    color: var(--text-sub);
    font-size: 11px;
    word-break: break-all;
    line-height: 1.5;
    flex: 1 1 0;
    min-width: 0;
}
.pkg-copy-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 9px;
    border-radius: 7px;
    border: none;
    background: var(--fill-1);
    color: var(--accent-color);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.12s, transform 0.1s;
    white-space: nowrap;
    line-height: 1.5;
}
.pkg-copy-btn:active { transform: scale(0.92); background: var(--fill-2); }

.section-title {
    font-weight: 600;
    margin: 20px 0 10px;
    font-size: 17px;
    letter-spacing: -0.2px;
}

/* ---- Screenshot 截图轮播 ---- */
.screenshot-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 5px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

/* 截图高度用 CSS 变量，方便响应式覆盖 */
:root { --shot-h: 160px; }
@media (min-width: 480px)  { :root { --shot-h: 200px; } }
@media (min-width: 768px)  { :root { --shot-h: 240px; } }
@media (min-width: 1024px) { :root { --shot-h: 260px; } }

/* screenshot-wrap：只做骨架背景，不用 overflow:hidden 裁切
   避免子像素舍入导致图片四角被截断（深色模式下尤其明显） */
.screenshot-wrap {
    position: relative;
    height: var(--shot-h);
    flex-shrink: 0;
    border-radius: 12px;
    background: var(--fill-1);
    width: calc(var(--shot-h) * 9 / 19.5);
    transition: width 0.15s ease;
}

/* 骨架闪光层同样用 border-radius 限制，不依赖 overflow:hidden */
.screenshot-wrap::before {
    content: "";
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    border-radius: 12px;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%);
    animation: skeleton-loading 1.4s ease-in-out infinite;
    z-index: 1;
    transition: opacity 0.25s ease;
}

[data-theme="dark"] .screenshot-wrap::before {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%);
}

.screenshot-wrap.loaded::before {
    opacity: 0;
    pointer-events: none;
}

/* 图片自身设圆角，无需 wrap overflow:hidden，四角完整显示 */
.screenshot-img {
    height: var(--shot-h);
    width: auto;
    max-width: none;
    border-radius: 11px;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.15s, opacity 0.25s ease;
    opacity: 0;
    position: relative;
    z-index: 2;
    display: block;
    image-rendering: auto;
}

.screenshot-img.loaded { opacity: 1; }
.screenshot-img:active { transform: scale(0.97); }

.app-intro {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.75;
    background: var(--modal-info-bg);
    padding: 14px;
    border-radius: 12px;
    white-space: pre-wrap;
}

/* 固定底栏：不参与滚动，始终贴在 modal 底部 */
.modal-footer {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 12px 20px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    background: var(--card-bg);
    border-top: 0.5px solid var(--separator);
}

.footer-btn {
    flex: 1;
    padding: 13px 0;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s, transform 0.15s;
}

.footer-btn:active { transform: scale(0.96); opacity: 0.85; }

.btn-secondary {
    background: var(--modal-info-bg);
    color: var(--accent-color);
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: var(--accent-color);
    color: #fff;
}

/* ---- Image Preview Overlay ---- */
#preview-overlay {
    display: none;
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0);
    z-index: 2000;
    justify-content: center;
    align-items: center;
    touch-action: none;
    transition: all 0.3s ease;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
}

#preview-overlay.active {
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
}

#preview-img {
    max-width: 90%; max-height: 80%;
    object-fit: contain;
    border-radius: 14px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.5);
    transform: scale(0.85);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

#preview-overlay.active #preview-img {
    transform: scale(1);
    opacity: 1;
}

.preview-close {
    position: absolute; top: 18px; right: 18px;
    color: white;
    background: rgba(255,255,255,0.18);
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    z-index: 2100;
    border: 0.5px solid rgba(255,255,255,0.25);
    backdrop-filter: blur(10px);
    opacity: 0;
    pointer-events: none;
    transition: background 0.15s, opacity 0.28s ease;
}
.preview-close:hover { background: rgba(255,255,255,0.28); }
#preview-overlay.active .preview-close {
    opacity: 1;
    pointer-events: auto;
}

#preview-counter {
    position: absolute; bottom: 30px;
    color: rgba(255,255,255,0.85);
    background: rgba(0,0,0,0.4);
    padding: 5px 16px;
    border-radius: 20px;
    z-index: 2100;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(8px);
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 0.28s ease;
}
#preview-overlay.active #preview-counter { opacity: 1; }

.nav-btn {
    position: absolute; top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.1);
    color: white; border: none;
    padding: 22px 14px;
    font-size: 26px;
    cursor: pointer;
    border-radius: 8px;
    display: none;
    backdrop-filter: blur(8px);
    opacity: 0;
    pointer-events: none;
    transition: background 0.15s, opacity 0.28s ease;
}
.nav-btn:hover { background: rgba(255,255,255,0.2); }
@media (min-width: 768px) { .nav-btn { display: block; } }
#preview-overlay.active .nav-btn {
    opacity: 1;
    pointer-events: auto;
}

/* ---- 响应式：Tablet 768px ---- */
@media (min-width: 768px) {
    /* Larger modal on tablet */
    .modal-content { max-width: 600px; }
    .modal-inner-pad { padding: 12px 28px 28px; }
}

/* ---- 响应式：Desktop 1024px ---- */
@media (min-width: 1024px) {
    /* Wider modal on desktop */
    .modal-content { max-width: 680px; }
    .modal-inner-pad { padding: 16px 36px 36px; }
    .modal-app-name { font-size: 22px; }
    .modal-app-author { font-size: 14px; }
    .modal-icon-wrap { width: 72px; height: 72px; border-radius: 16px; }
    .modal-icon { width: 100%; height: 100%; border-radius: 0; }
}

/* ---- 响应式：Wide Desktop 1440px ---- */
@media (min-width: 1440px) {
    .modal-content { max-width: 720px; }

    /* Desktop: show scroll hint on screenshot container */
    .screenshot-container::-webkit-scrollbar {
        height: 4px;
    }
    .screenshot-container::-webkit-scrollbar-track {
        background: var(--fill-1);
        border-radius: 2px;
    }
    .screenshot-container::-webkit-scrollbar-thumb {
        background: var(--fill-2);
        border-radius: 2px;
    }
}

/* ---- Hover states（仅桌面指针设备）---- */
@media (hover: hover) and (pointer: fine) {
    .footer-btn:hover { opacity: 0.82; }
    .screenshot-img:hover { transform: scale(1.02); }
}
    `;
    document.head.appendChild(style);

    /* ── 2. 注入 HTML ── */
    const html = `
    <div id="modal-overlay" onmousedown="if(event.target===this)handleBack()" ontouchend="if(event.target===this){event.preventDefault();handleBack();}">
        <div class="modal-content" onclick="event.stopPropagation()">
            <span class="close-btn" onclick="handleBack()">✕</span>
            <!-- 可滚动内容区 -->
            <div class="modal-scroll">
                <div class="modal-inner-pad">
                    <div id="modal-body"></div>
                </div>
            </div>
            <!-- 固定底部按钮栏，不参与滚动 -->
            <div class="modal-footer" id="modal-footer-bar" style="gap:8px;"></div>
        </div>
    </div>

    <div id="preview-overlay" onclick="handlePreviewBack(event)">
        <div class="preview-close" onclick="handlePreviewBack(event)">&times;</div>
        <button class="nav-btn" style="left:10px;" onclick="event.stopPropagation();changePreview(-1)">&#10094;</button>
        <img id="preview-img" src="" onclick="event.stopPropagation()" oncontextmenu="return false" draggable="false">
        <button class="nav-btn" style="right:10px;" onclick="event.stopPropagation();changePreview(1)">&#10095;</button>
        <div id="preview-counter">1/1</div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    /* ── 3. 截图预览状态（挂 window，供主脚本读写） ── */
    // currentScreenshots / currentImgIndex / touchStartX
    // 已在主脚本中声明为 let，这里不重复声明，直接读 window 作用域

    /* ── 4. 截图辅助函数 ── */

    /**
     * 截图加载完成：同步 wrap 宽度 = 真实图片宽度，然后淡入
     */
    window.onScreenshotLoad = function (img, wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        if (img.naturalWidth && img.naturalHeight) {
            const h = wrap.offsetHeight || img.offsetHeight || 160;
            const w = Math.round(h * img.naturalWidth / img.naturalHeight);
            wrap.style.width = w + 'px';
        }
        img.classList.add('loaded');
        wrap.classList.add('loaded');
    };

    /**
     * 截图加载失败：直接移除骨架
     */
    window.onScreenshotError = function (wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        wrap.classList.add('loaded');
        const img = wrap.querySelector('img');
        if (img) img.classList.add('loaded');
    };

    /**
     * 弹窗打开后对每张截图做预加载探测，提前修正骨架宽度
     * @param {string[]} screenshots
     */
    window.preloadScreenshotSizes = function (screenshots) {
        screenshots.forEach((src, idx) => {
            const probe = new Image();
            probe.onload = function () {
                const wrap = document.getElementById('sw-' + idx);
                if (!wrap || wrap.classList.contains('loaded')) return;
                if (probe.naturalWidth && probe.naturalHeight) {
                    const h = wrap.offsetHeight || 160;
                    const w = Math.round(h * probe.naturalWidth / probe.naturalHeight);
                    wrap.style.width = w + 'px';
                }
            };
            probe.src = src;
        });
    };

    /* ── 5. 主弹窗逻辑 ── */

    /**
     * 打开应用详情弹窗
     * @param {number} pageNum - 所在页码
     * @param {number} idx     - 页内索引
     */
    window.openModal = function (pageNum, idx) {
        const _globalIdx = (pageNum - 1) * 50 + idx + 1;
        if (typeof AppAuth !== 'undefined' && !AppAuth.check(_globalIdx, () => openModal(pageNum, idx))) return;
        const cached = pageCache[pageNum];
        if (!cached || cached.status !== 'ok') return;
        const app = cached.apps[idx];
        if (!app) return;
        currentScreenshots = app.screenshots;

        // ── 来源按钮：从 linkrules.js 的 SOURCE_RULES 匹配 ──
        let btnText = '官方网站'; let btnColor = '#007AFF';
        if (app.source && window.SOURCE_RULES) {
            const s = app.source.toLowerCase();
            for (const rule of window.SOURCE_RULES) {
                if (rule.match.some(kw => s.indexOf(kw) !== -1)) {
                    btnText = rule.text; btnColor = rule.color; break;
                }
            }
        }
        const sourceBtn = app.source
            ? `<a href="${app.source}" target="_blank" class="footer-btn btn-secondary" style="background:var(--modal-info-bg); color:${btnColor}; font-size:12px;">${btnText}</a>`
            : `<div class="footer-btn" style="visibility:hidden;"></div>`;

        // ── 下载按钮：从 linkrules.js 的 DOWNLOAD_RULES 匹配 ──
        let downloadText = '立即下载'; let downloadColor = '#007AFF';
        if (app.url && window.DOWNLOAD_RULES) {
            const d = app.url.toLowerCase();
            for (const rule of window.DOWNLOAD_RULES) {
                const hit = rule.match.some(kw => d.indexOf(kw) !== -1);
                if (!hit) continue;
                if (rule.special === 'github_direct' && !d.endsWith('.apk') && !d.endsWith('.zip')) continue;
                downloadText = rule.text; downloadColor = rule.color; break;
            }
        }

        // ── 内容区（截图 + 介绍，不含底部按钮）──
        document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><div class="modal-icon-wrap"><img src="${app.icon}" class="modal-icon" oncontextmenu="return false" draggable="false"></div><div class="modal-app-info"><div class="modal-app-name">${app.name}</div>${app.author ? `<div class="modal-app-author${app.source ? ' has-link' : ''}" ${app.source ? `onclick="window.open('${app.source}','_blank')"` : ''}>${app.author}</div>` : ''}</div></div>
        <div class="modal-info-box">
            <div class="info-row"><div class="info-left"><span class="info-label">版本</span><span class="info-value">${app.version}</span></div><div class="info-right" style="width:110px"><span class="info-label">大小</span><span class="info-value">${app.size}</span></div></div>
            <div class="info-row"><div class="info-left"><span class="info-label">系统</span><span class="info-value">${app.system}</span></div><div class="info-right" style="width:110px"><span class="info-label">类型</span><span class="info-value">${app.mod || '原版'}</span></div></div>
            <div class="pkg-section"><span class="info-label">应用包名</span><div class="pkg-row"><div class="pkg-value">${app.pkg}</div><button class="pkg-copy-btn" onclick="copyPkg(this,'${app.pkg}')" aria-label="复制包名"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>复制</button></div></div>
        </div>
        <div class="section-title">📸 应用截图</div>
        <div class="screenshot-container" id="screenshot-list">${app.screenshots.map((s, idx) => `<div class="screenshot-wrap" id="sw-${idx}"><img src="${s}" class="screenshot-img" loading="lazy" decoding="async" onclick="openPreview(${idx})" onload="onScreenshotLoad(this, 'sw-'+${idx})" onerror="onScreenshotError('sw-'+${idx})" oncontextmenu="return false" draggable="false"></div>`).join('')}</div>
        <div class="section-title">📝 应用介绍</div>
        <div class="app-intro">${app.intro}</div>
        `;

        // ── 底部固定按钮栏（独立于滚动区，始终可见）──
        document.getElementById('modal-footer-bar').innerHTML = `
        <button class="footer-btn btn-secondary" style="font-size:12px;" onclick="handleBack()">返回列表</button>
        ${sourceBtn}
        <a href="${app.url}" target="_blank" class="footer-btn btn-primary" style="background:${downloadColor}; border:none; font-size:12px;">${downloadText}</a>
        `;

        showElement('modal-overlay');
        window.history.pushState({ state: 'modal', page: currentPage }, '');
        // 弹窗打开后立即预测截图宽度，修正骨架占位尺寸
        requestAnimationFrame(() => preloadScreenshotSizes(app.screenshots));
    };

    /**
     * 返回 / 关闭弹窗（preview 优先，再 modal）
     */
    window.handleBack = function () {
        if (document.getElementById('preview-overlay').classList.contains('active')) {
            hideElement('preview-overlay');
        } else if (document.getElementById('modal-overlay').classList.contains('active')) {
            hideElement('modal-overlay');
            try { window.history.back(); } catch (e) {}
        }
    };

    /**
     * 复制包名
     */
    window.copyPkg = function (btn, pkg) {
        const doFallback = () => {
            const el = document.createElement('textarea');
            el.value = pkg;
            el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
            document.body.appendChild(el);
            el.focus(); el.select();
            try { document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(el);
        };
        const COPIED_COLOR_MAP = {
            blue:   '#34C759',
            mint:   '#34C759',
            pink:   '#34C759',
            purple: '#34C759',
            orange: '#34C759',
            teal:   '#34C759',
            green:  '#007AFF',
        };
        const onSuccess = () => {
            const accent = localStorage.getItem('accent') || 'blue';
            const copiedColor = COPIED_COLOR_MAP[accent] || '#34C759';
            btn.style.color = copiedColor;
            btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>已复制';
            setTimeout(() => {
                btn.style.color = '';
                btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>复制';
            }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pkg).then(onSuccess).catch(() => { doFallback(); onSuccess(); });
        } else { doFallback(); onSuccess(); }
    };

    /* ── 6. 截图全屏预览 ── */

    window.openPreview = function (index) {
        currentImgIndex = index;
        updatePreviewUI();
        showElement('preview-overlay');
        window.history.pushState({ state: 'preview', page: currentPage }, '');
    };

    window.handlePreviewBack = function (e) {
        if (e) e.stopPropagation();
        window.history.back();
    };

    window.updatePreviewUI = function () {
        document.getElementById('preview-img').src = currentScreenshots[currentImgIndex];
        document.getElementById('preview-counter').innerText = `${currentImgIndex + 1} / ${currentScreenshots.length}`;
    };

    window.changePreview = function (step) {
        if (!currentScreenshots || !currentScreenshots.length) return;
        currentImgIndex = (currentImgIndex + step + currentScreenshots.length) % currentScreenshots.length;
        updatePreviewUI();
    };

    /* ── 7. Preview 触摸左右滑动手势 ── */
    // DOM 已注入，在 DOMContentLoaded 后绑定（脚本在 </body> 前，DOM 已就绪）
    (function bindPreviewSwipe() {
        const previewLayer = document.getElementById('preview-overlay');
        if (!previewLayer) return;
        previewLayer.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        previewLayer.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 60) changePreview(diff > 0 ? 1 : -1);
        }, { passive: true });
    })();

})();
