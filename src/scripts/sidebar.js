// ════════════════════════════════════════════════════════════
//  sidebar.js — 侧滑栏逻辑
//  依赖：config.js（SB_ENGINES / SB_ENGINE_META / SB_DEFAULT_ENGINE）
//        category.js（CAT_LABELS / CAT_ICONS / POST_CAT_LABELS / POST_CAT_ICONS）
// ════════════════════════════════════════════════════════════

// ════ 侧栏多引擎搜索 ════
// 引擎数据已移至 src/scripts/config.js，在此处读取
let sbCurrentEngine = SB_DEFAULT_ENGINE;
let sbDropdownOpen = false;

// 初始化默认引擎图标
document.addEventListener('DOMContentLoaded', function() {
    const meta = SB_ENGINE_META[sbCurrentEngine] || { label: sbCurrentEngine, favicon: sbCurrentEngine[0].toUpperCase(), bg: '#888' };
    const faviconEl = document.getElementById('sb-engine-favicon');
    if (faviconEl) {
        faviconEl.style.background = meta.bg;
        if (meta.svgIcon) {
            faviconEl.innerHTML = meta.svgIcon;
        } else {
            faviconEl.innerHTML = '';
            faviconEl.textContent = meta.favicon;
        }
    }
    const input = document.getElementById('sb-engine-input');
    if (input) input.placeholder = meta.placeholder || '';
});

function sbToggleDropdown(e) {
    e.stopPropagation();
    sbDropdownOpen = !sbDropdownOpen;
    const wrap = document.getElementById('sb-engine-dropdown-wrap');
    if (wrap) wrap.classList.toggle('open', sbDropdownOpen);
}

function sbCloseDropdown() {
    sbDropdownOpen = false;
    const wrap = document.getElementById('sb-engine-dropdown-wrap');
    if (wrap) wrap.classList.remove('open');
}

// 点击外部关闭下拉
document.addEventListener('click', function(e) {
    if (!document.getElementById('sb-engine-dropdown-wrap')?.contains(e.target)) {
        sbCloseDropdown();
    }
});

function sbSelectEngine(item) {
    document.querySelectorAll('.sb-engine-menu-item').forEach(t => t.classList.remove('active'));
    item.classList.add('active');
    sbCurrentEngine = item.dataset.engine;
    const meta = SB_ENGINE_META[sbCurrentEngine] || { label: sbCurrentEngine, favicon: sbCurrentEngine[0].toUpperCase(), bg: '#888' };
    // 更新 favicon 徽标（从 config.js 读取，支持 SVG 图标）
    const faviconEl = document.getElementById('sb-engine-favicon');
    if (faviconEl) {
        faviconEl.style.background = meta.bg;
        if (meta.svgIcon) {
            faviconEl.innerHTML = meta.svgIcon;
        } else {
            faviconEl.innerHTML = '';
            faviconEl.textContent = meta.favicon;
        }
    }
    // 更新 placeholder（从 config.js 读取）
    const inp = document.getElementById('sb-engine-input');
    if (inp) { inp.placeholder = meta.placeholder || '输入关键词搜索…'; inp.focus(); }
    sbCloseDropdown();
}

// 保留旧函数名兼容性（不再使用）
function sbSwitchEngine(btn) { sbSelectEngine(btn); }

function sbDoSearch() {
    const q = document.getElementById('sb-engine-input').value.trim();
    if (!q) { document.getElementById('sb-engine-input').focus(); return; }
    const url = SB_ENGINES[sbCurrentEngine] ? SB_ENGINES[sbCurrentEngine](q) : '#';
    window.open(url, '_blank', 'noopener');
}

function sbUpdateClear() {
    const input = document.getElementById('sb-engine-input');
    const btn = document.getElementById('sb-engine-clear');
    if (!btn) return;
    btn.classList.toggle('visible', input.value.length > 0);
}

function sbClearInput() {
    const input = document.getElementById('sb-engine-input');
    input.value = '';
    input.focus();
    sbUpdateClear();
}

// 动态渲染引擎菜单（数据来自 src/scripts/config.js）
function sbRenderMenu() {
    const menu = document.getElementById('sb-engine-menu');
    if (!menu) return;
    if (typeof SB_ENGINE_META === 'undefined') {
        console.error('[sbRenderMenu] SB_ENGINE_META 未定义，请检查 src/scripts/config.js 是否正确加载');
        return;
    }
    menu.innerHTML = Object.keys(SB_ENGINE_META).map(key => {
        const m = SB_ENGINE_META[key];
        const iconHTML = m.svgIcon
            ? `<span class="sb-menu-favicon" style="background:${m.bg};color:#fff">${m.svgIcon}</span>`
            : `<span class="sb-menu-favicon" style="background:${m.bg};color:#fff">${m.favicon}</span>`;
        return `<button class="sb-engine-menu-item${key === sbCurrentEngine ? ' active' : ''}" data-engine="${key}" onclick="sbSelectEngine(this)">${iconHTML}<span>${m.label}</span></button>`;
    }).join('');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sbRenderMenu);
} else {
    sbRenderMenu();
}

// ════════════════════════════════════════
//  SIDEBAR — 侧滑栏逻辑
// ════════════════════════════════════════

// sites 分页路径 —— sites/sites_1.json 对应第1个分类，sites/sites_2.json 对应第2个，以此类推
const TOOLS_BASE_URL = 'sites/sites_';
// docs 路径：docs_N.json 对应 POST_CAT_LABELS[N-1]，与分类名无关
const POSTS_BASE_URL = './docs/docs_';   // + fileNum + '.json'
const POSTS_BASE_PATH = './docs/docs/';
// 在线工具路径：tools/tools_N.json 对应 ONLINE_TOOLS_CAT_LABELS[N-1]
const ONLINE_TOOLS_BASE_URL = './tools/tools_';  // + fileNum + '.json'
const ONLINE_TOOLS_BASE_PATH = './tools/tools/';

// ── 分类数据由 src/scripts/category.js 提供，此处直接读取 ──
const POST_CAT_LABELS = window.POST_CAT_LABELS || [];
const CAT_LABELS      = window.CAT_LABELS      || [];
const ONLINE_TOOLS_CAT_LABELS = window.ONLINE_TOOLS_CAT_LABELS || [];
const CAT_MAP = {};
CAT_LABELS.forEach(c => { CAT_MAP[c] = c; });

function getIconForPostCat(name) {
    return (window.POST_CAT_ICONS && window.POST_CAT_ICONS[name]) || '📄';
}
function getIconForCat(name) {
    return (window.CAT_ICONS && window.CAT_ICONS[name]) || '🔧';
}
function getIconForOnlineToolsCat(name) {
    return (window.ONLINE_TOOLS_CAT_ICONS && window.ONLINE_TOOLS_CAT_ICONS[name]) || '🛠️';
}

// ── 自动生成手风琴 DOM，CAT_LABELS 改了这里自动跟着变 ──
function buildCatNav() {
    const nav = document.getElementById('sidebar-cat-nav');
    if (!nav) return;
    const arrowSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
    nav.innerHTML = CAT_LABELS.map((label, idx) => `
        <div class="sidebar-cat-row" id="cat-row-${idx}" data-cat="${label}">
            <button class="sidebar-cat-head" onclick="toggleCatRow(${idx})">
                <span class="sidebar-cat-head-icon">${getIconForCat(label)}</span>
                <span class="sidebar-cat-head-label">${label}</span>
                <span class="sidebar-cat-count" id="cat-count-${idx}"></span>
                <span class="sidebar-cat-head-arrow">${arrowSVG}</span>
            </button>
            <div class="sidebar-cat-content">
                <div class="sidebar-cat-content-inner" id="cat-content-${idx}"></div>
            </div>
        </div>`
    ).join('');
}

window.sidebarOpen = window.sidebarOpen || false;
// ⚠️ 这两个变量必须挂在 window 上，与 index.html 的 onpopstate 共享同一引用
// 原来用 let 声明在各自文件里，分离后两个文件各有一份，onpopstate 读到的永远是 false
window._sidebarClosing   = window._sidebarClosing   || false;
window._disclaimerClosing = window._disclaimerClosing || false;
// 每个分类对应独立缓存：toolsPageCache[catIndex] = { status: 'ok'|'loading'|'error', tools: [] }
const toolsPageCache = {};
let toolsTotalCount = 0; // 已加载条目总数（用于统计显示）
let currentToolCat = 'all';
let sbTouchStartX = 0, sbTouchStartY = 0;

// ── 知识文档状态 ──
// 每个分类对应独立缓存：postsCache[catIndex] = { status: 'ok'|'loading'|'error', posts: [] }
const postsCache = {};
let postsTotalCount = 0;
let currentSidebarTab = 'tools'; // 'tools' | 'posts' | 'online-tools'
let openPostCatRow = null;

// ── 在线工具状态 ──
// 每个分类对应独立缓存：onlineToolsCache[catIndex] = { status: 'ok'|'loading'|'error', items: [] }
const onlineToolsCache = {};
let onlineToolsTotalCount = 0;
let openOnlineToolsCatRow = null;

function switchSidebarTab(tab) {
    currentSidebarTab = tab;
    document.getElementById('tab-tools').classList.toggle('active', tab === 'tools');
    document.getElementById('tab-posts').classList.toggle('active', tab === 'posts');
    document.getElementById('tab-online-tools').classList.toggle('active', tab === 'online-tools');
    document.getElementById('panel-tools').style.display = tab === 'tools' ? '' : 'none';
    document.getElementById('panel-posts').style.display = tab === 'posts' ? '' : 'none';
    document.getElementById('panel-online-tools').style.display = tab === 'online-tools' ? '' : 'none';
    if (tab === 'posts') {
        if (!document.getElementById('post-cat-row-0')) buildPostCatNav();
        // 已在 openSidebar 里并行预加载，此处无需重复触发
    }
    if (tab === 'online-tools') {
        if (!document.getElementById('online-tool-cat-row-0')) buildOnlineToolsCatNav();
        // 已在 openSidebar 里并行预加载，此处无需重复触发
    }
}

// ── 指南针按钮动画（同设置按钮 spin-open / spin-close 风格）──
function compassBtnOpen() {
    const btn = document.getElementById('header-blog-btn');
    if (!btn) return;
    btn.classList.remove('spin-close');
    void btn.offsetWidth;
    btn.classList.add('active', 'spin-open');
    btn.addEventListener('animationend', () => btn.classList.remove('spin-open'), { once: true });
}

function compassBtnClose() {
    const btn = document.getElementById('header-blog-btn');
    if (!btn) return;
    btn.classList.remove('spin-open', 'active');
    btn.classList.add('spin-close');
    btn.addEventListener('animationend', () => btn.classList.remove('spin-close'), { once: true });
}

function openSidebar() {
    if (window.sidebarOpen) return;
    window.sidebarOpen = true;
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('sidebar');
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
        overlay.classList.add('active');
        sidebar.classList.add('open');
    });
    compassBtnOpen();
    _scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    // 后台并行预加载所有分类（tools + posts + online-tools），不阻塞 UI，加载完后刷新统计
    preloadAllTools();
    preloadAllPosts();
    preloadAllOnlineTools();
    // 首次打开时动态生成分类行（之后直接复用）
    if (!document.getElementById('cat-row-0')) buildCatNav();
    // 更新应用总数：等待所有页面都加载完毕后再统计，避免后台页未加载完导致数字偏少
    updateSidebarAppCount();
    window.history.pushState({ state: 'sidebar' }, '');
}

function closeSidebar(fromPopstate) {
    if (!window.sidebarOpen) return;
    window.sidebarOpen = false;
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('sidebar');
    overlay.classList.remove('active');
    sidebar.classList.remove('open');
    compassBtnClose();
    setTimeout(() => { overlay.style.display = 'none'; }, 380);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo({ top: _scrollY || 0, behavior: 'instant' });
    if (!fromPopstate) {
        window._sidebarClosing = true;
        window.history.back();
    }
    // 关闭时清空搜索框
    const sbInput = document.getElementById('sb-engine-input');
    if (sbInput) sbInput.value = '';
}

// ── 统计应用总数：先用缓存立即显示，再等所有页加载完后更新最终值 ──
async function updateSidebarAppCount() {
    const statApps = document.getElementById('stat-apps');
    if (!statApps) return;

    // 立即用已缓存的数量先显示（即便不完整，让用户有感知）
    function calcCached() {
        let t = 0;
        for (let i = 1; i <= totalPages; i++) {
            const r = pageCache[i];
            if (r && r.status === 'ok') t += r.apps.length;
        }
        return t;
    }
    const immediate = calcCached();
    if (immediate > 0) statApps.textContent = immediate;

    // 并行加载所有未缓存/未完成的页面，全部完成后再刷新数字
    const fetches = [];
    for (let i = 1; i <= totalPages; i++) {
        const r = pageCache[i];
        if (!r || r.status === 'loading' || r.status === 'error') {
            fetches.push(fetchPage(i, false));
        }
    }
    if (fetches.length > 0) {
        await Promise.allSettled(fetches);
    }
    // 全部加载完毕后刷新为精确值
    const final = calcCached();
    if (final > 0) statApps.textContent = final;
}

// 左边缘滑入手势（从屏幕左侧 40px 内向右滑）
document.addEventListener('touchstart', e => {
    sbTouchStartX = e.touches[0].clientX;
    sbTouchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sbTouchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - sbTouchStartY);
    const modalOpen = document.getElementById('modal-overlay').classList.contains('active');
    const previewOpen = document.getElementById('preview-overlay').classList.contains('active');
    if (modalOpen || previewOpen) return;
    if (!window.sidebarOpen && sbTouchStartX < 40 && dx > 40 && dy < 60) {
        openSidebar();
    }
    if (window.sidebarOpen && dx < -50 && dy < 80) {
        closeSidebar();
    }
}, { passive: true });

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (typeof settingsOpen !== 'undefined' && settingsOpen) { closeSettings(); return; }
        if (window.sidebarOpen) closeSidebar();
    }
});

// ── 手风琴分类展开/收起（精准高度动画，iOS 丝滑手感）──
let openCatRow = null;

function collapseRow(row) {
    const content = row.querySelector('.sidebar-cat-content');
    if (!content) return;
    // 固定当前真实高度，然后在下一帧动画到 0，避免跳帧
    const h = content.getBoundingClientRect().height;
    content.style.height = h + 'px';
    // 强制一次回流，让浏览器记住起始高度
    void content.offsetHeight;
    requestAnimationFrame(() => {
        content.style.height = '0px';
        row.classList.remove('open');
    });
}

function expandRow(row, idx) {
    const content = row.querySelector('.sidebar-cat-content');
    if (!content) return;
    // 先让行进入 open 状态（opacity/arrow 立即跟上），高度从 0 开始
    row.classList.add('open');
    content.style.height = '0px';
    // 测量目标高度（内容已渲染，auto 后立即读取）
    content.style.height = 'auto';
    const targetH = content.scrollHeight;
    content.style.height = '0px';
    // 等两帧：第一帧让 0px 生效进布局树，第二帧再启动过渡
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            content.style.height = targetH + 'px';
            // 动画结束后改为 auto，允许内容动态变化
            const onEnd = (e) => {
                if (e.propertyName !== 'height') return;
                content.removeEventListener('transitionend', onEnd);
                if (row.classList.contains('open')) {
                    content.style.height = 'auto';
                }
            };
            content.addEventListener('transitionend', onEnd);
        });
    });
}

function toggleCatRow(idx) {
    const row = document.getElementById('cat-row-' + idx);
    if (!row) return;
    const isOpen = row.classList.contains('open');

    // 收起所有已展开的行
    document.querySelectorAll('.sidebar-cat-row.open').forEach(r => {
        if (r !== row) collapseRow(r);
    });

    if (!isOpen) {
        openCatRow = idx;
        const cached = toolsPageCache[idx];
        if (cached && cached.status === 'ok') {
            // 已缓存，直接渲染展开
            renderCatContent(idx);
            expandRow(row, idx);
        } else {
            expandRow(row, idx); // 先展开骨架
            loadToolsForCat(idx).then(() => {
                renderCatContent(idx);
                // 内容高度变了，重新测量并更新
                const content = row.querySelector('.sidebar-cat-content');
                if (content && row.classList.contains('open')) {
                    content.style.height = content.scrollHeight + 'px';
                    content.addEventListener('transitionend', function onEnd2(e) {
                        if (e.propertyName !== 'height') return;
                        content.removeEventListener('transitionend', onEnd2);
                        if (row.classList.contains('open')) content.style.height = 'auto';
                    });
                }
            });
        }
    } else {
        openCatRow = null;
        collapseRow(row);
    }
}

function renderCatContent(idx) {
    const contentEl = document.getElementById('cat-content-' + idx);
    if (!contentEl) return;
    const cached = toolsPageCache[idx];
    // 正在加载中：显示骨架提示
    if (!cached || cached.status === 'loading') {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">⏳</div>正在加载…</div>';
        return;
    }
    // 加载失败
    if (cached.status === 'error') {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">🔧</div>加载失败，请稍后重试</div>';
        return;
    }
    const filtered = cached.tools;
    if (!filtered || !filtered.length) {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">📭</div>该分类暂无工具</div>';
        return;
    }
    contentEl.innerHTML = '<div class="tool-list-inner">' + filtered.map(t => {
        const href = t.url || '#';
        const isExternal = href.startsWith('http');
        const iconHtml = t.icon
            ? `<img class="tool-item-icon" src="${t.icon}" alt="${t.title || ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : '';
        const fallback = `<span class="tool-item-icon-emoji" style="display:${t.icon ? 'none' : 'flex'}">🔧</span>`;
        return `
        <a class="tool-item" href="${href}" target="${isExternal ? '_blank' : '_self'}" rel="noopener">
            <div class="tool-item-icon-wrap">${iconHtml}${fallback}</div>
            <div class="tool-item-info">
                <div class="tool-item-title">${t.title || '未命名工具'}</div>
                ${t.description ? `<div class="tool-item-desc">${t.description}</div>` : ''}
            </div>
            <span class="tool-item-arrow">›</span>
        </a>`;
    }).join('') + '</div>';
}

// ── 兼容旧接口 ──
function toggleCatDropdown() {}
function selectCat(el) {}
function switchToolTab(cat) {}
function renderTools() {
    // 加载完成后刷新当前展开行的高度
    if (openCatRow !== null) {
        renderCatContent(openCatRow);
        const row = document.getElementById('cat-row-' + openCatRow);
        if (row) {
            const content = row.querySelector('.sidebar-cat-content');
            if (content && row.classList.contains('open')) {
                content.style.height = content.scrollHeight + 'px';
            }
        }
    }
}

// ── 后台并行预加载所有分类，完成后刷新 stat-tools 总计数 ──
async function preloadAllTools() {
    const fetches = CAT_LABELS.map((_, idx) => loadToolsForCat(idx));
    await Promise.allSettled(fetches);
    // 全部加载完毕，刷新精确总数
    const total = Object.values(toolsPageCache).reduce((sum, c) => sum + (c.status === 'ok' ? c.tools.length : 0), 0);
    const statEl = document.getElementById('stat-tools');
    if (statEl && total > 0) statEl.textContent = total;
}

// ── 按分类索引懒加载对应 sites/sites_N.json ──
// catIndex 从 0 开始，对应文件 sites/sites_1.json（索引+1）
async function loadToolsForCat(catIndex) {
    const cached = toolsPageCache[catIndex];
    if (cached && cached.status === 'ok') return; // 已缓存
    if (cached && cached.status === 'loading') {
        // 等待已有请求完成（简单轮询，最多等 5s）
        await new Promise(resolve => {
            let t = 0;
            const check = setInterval(() => {
                t += 100;
                if (!toolsPageCache[catIndex] || toolsPageCache[catIndex].status !== 'loading' || t > 5000) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
        return;
    }
    toolsPageCache[catIndex] = { status: 'loading', tools: [] };
    const fileNum = catIndex + 1; // sites_1.json = 第0个分类
    try {
        const res = await fetch(TOOLS_BASE_URL + fileNum + '.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const raw = await res.json();
        const processed = raw.map(t => ({
            ...t,
            icon: t.icon
                ? (t.icon.startsWith('http') || t.icon.startsWith('assets/')
                    ? t.icon
                    : 'assets/siteicons/' + t.icon)
                : ''
        }));
        toolsPageCache[catIndex] = { status: 'ok', tools: processed };
        // 更新分类行数量 badge
        const countEl = document.getElementById('cat-count-' + catIndex);
        if (countEl) countEl.textContent = processed.length;
        // 更新总计数
        toolsTotalCount = Object.values(toolsPageCache).reduce((sum, c) => sum + (c.status === 'ok' ? c.tools.length : 0), 0);
        const statEl = document.getElementById('stat-tools');
        if (statEl) statEl.textContent = toolsTotalCount;
    } catch (e) {
        toolsPageCache[catIndex] = { status: 'error', tools: [] };
        const statEl = document.getElementById('stat-tools');
        if (statEl && statEl.textContent === '—') statEl.textContent = '0';
    }
}

function updateTabCounts() {}

// ════ 知识文档 docs.json 逻辑 ════

function buildPostCatNav() {
    const nav = document.getElementById('sidebar-posts-nav');
    if (!nav) return;
    const arrowSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
    nav.innerHTML = POST_CAT_LABELS.map((label, idx) => `
        <div class="sidebar-cat-row" id="post-cat-row-${idx}" data-cat="${label}">
            <button class="sidebar-cat-head" onclick="togglePostCatRow(${idx})">
                <span class="sidebar-cat-head-icon">${getIconForPostCat(label)}</span>
                <span class="sidebar-cat-head-label">${label}</span>
                <span class="sidebar-cat-count" id="post-cat-count-${idx}"></span>
                <span class="sidebar-cat-head-arrow">${arrowSVG}</span>
            </button>
            <div class="sidebar-cat-content">
                <div class="sidebar-cat-content-inner" id="post-cat-content-${idx}"></div>
            </div>
        </div>`
    ).join('');
    // DOM 刚建好，把已缓存的数量立即回填（preloadAllPosts 可能已提前跑完）
    POST_CAT_LABELS.forEach((_, idx) => {
        const cached = postsCache[idx];
        if (cached && cached.status === 'ok') {
            const el = document.getElementById('post-cat-count-' + idx);
            if (el) el.textContent = cached.posts.length;
        }
    });
}

function togglePostCatRow(idx) {
    const row = document.getElementById('post-cat-row-' + idx);
    if (!row) return;
    const isOpen = row.classList.contains('open');

    // 收起所有已展开的行
    document.querySelectorAll('#sidebar-posts-nav .sidebar-cat-row.open').forEach(r => {
        if (r !== row) collapseRow(r);
    });

    if (!isOpen) {
        openPostCatRow = idx;
        const cached = postsCache[idx];
        if (cached && cached.status === 'ok') {
            renderPostCatContent(idx);
            expandRow(row, idx);
        } else {
            expandRow(row, idx);
            loadPostsForCat(idx).then(() => {
                renderPostCatContent(idx);
                const content = row.querySelector('.sidebar-cat-content');
                if (content && row.classList.contains('open')) {
                    content.style.height = content.scrollHeight + 'px';
                    content.addEventListener('transitionend', function onEnd2(e) {
                        if (e.propertyName !== 'height') return;
                        content.removeEventListener('transitionend', onEnd2);
                        if (row.classList.contains('open')) content.style.height = 'auto';
                    });
                }
            });
        }
    } else {
        openPostCatRow = null;
        collapseRow(row);
    }
}

function renderPostCatContent(idx) {
    const cat = POST_CAT_LABELS[idx];
    const contentEl = document.getElementById('post-cat-content-' + idx);
    if (!contentEl) return;

    const cached = postsCache[idx];
    if (!cached || cached.status === 'loading') {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">⏳</div>加载中…</div>';
        return;
    }
    if (cached.status === 'error') {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">📄</div>读取失败，请检查 docs_' + (idx + 1) + '.json</div>';
        return;
    }

    const posts = cached.posts;

    let filtered;
    if (cat === '最近更新') {
        // 最近更新：取最后加入的10条（文件里越靠后越新）
        // 从所有已缓存分类里合并后取最新
        const allLoaded = Object.values(postsCache).filter(c => c.status === 'ok').flatMap(c => c.posts);
        filtered = [...allLoaded].reverse().slice(0, 10);
    } else {
        filtered = posts;
    }

    if (!filtered || !filtered.length) {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">📭</div>暂无文档</div>';
        return;
    }
    contentEl.innerHTML = '<div class="tool-list-inner">' + filtered.map(p => {
        const href = POSTS_BASE_PATH + p.path;
        return `
        <a class="post-item" href="${href}" target="_blank" rel="noopener">
            <div class="post-item-bar"></div>
            <span class="post-item-title">${p.title || '未命名文档'}</span>
            <span class="post-item-arrow">›</span>
        </a>`;
    }).join('') + '</div>';
}

// ── 按分类索引懒加载对应 sites/docs_N.json ──
// catIndex 从 0 开始，对应文件 docs_1.json（索引+1）
async function loadPostsForCat(catIndex) {
    const cached = postsCache[catIndex];
    if (cached && cached.status === 'ok') return;
    if (cached && cached.status === 'loading') {
        // 等待已有请求完成（轮询，最多等 5s）
        await new Promise(resolve => {
            let t = 0;
            const check = setInterval(() => {
                t += 100;
                if (!postsCache[catIndex] || postsCache[catIndex].status !== 'loading' || t > 5000) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
        return;
    }
    postsCache[catIndex] = { status: 'loading', posts: [] };
    const fileNum = catIndex + 1; // docs_1.json = 第0个分类
    try {
        const res = await fetch(POSTS_BASE_URL + fileNum + '.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const posts = await res.json();
        postsCache[catIndex] = { status: 'ok', posts };
        // 更新分类行数量 badge
        const postCountEl = document.getElementById('post-cat-count-' + catIndex);
        if (postCountEl) postCountEl.textContent = posts.length;
        // 更新总计数
        postsTotalCount = Object.values(postsCache).reduce((sum, c) => sum + (c.status === 'ok' ? c.posts.length : 0), 0);
        const statEl = document.getElementById('stat-posts');
        if (statEl) statEl.textContent = postsTotalCount;
        // 如果当前展开行就是这个分类，立即渲染
        if (openPostCatRow === catIndex) renderPostCatContent(catIndex);
    } catch (e) {
        postsCache[catIndex] = { status: 'error', posts: [] };
        const statFail = document.getElementById('stat-posts');
        if (statFail && statFail.textContent === '—') statFail.textContent = '0';
    }
}

async function preloadAllPosts() {
    const fetches = POST_CAT_LABELS.map((_, idx) => loadPostsForCat(idx));
    await Promise.allSettled(fetches);
    // 全部加载完毕，刷新精确总数
    const total = Object.values(postsCache).reduce((sum, c) => sum + (c.status === 'ok' ? c.posts.length : 0), 0);
    const statEl = document.getElementById('stat-posts');
    if (statEl && total > 0) statEl.textContent = total;
}


// ════ 在线工具 tools/tools_N.json 逻辑 ════

function buildOnlineToolsCatNav() {
    const nav = document.getElementById('sidebar-online-tools-nav');
    if (!nav) return;
    const arrowSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
    nav.innerHTML = ONLINE_TOOLS_CAT_LABELS.map((label, idx) => `
        <div class="sidebar-cat-row" id="online-tool-cat-row-${idx}" data-cat="${label}">
            <button class="sidebar-cat-head" onclick="toggleOnlineToolsCatRow(${idx})">
                <span class="sidebar-cat-head-icon">${getIconForOnlineToolsCat(label)}</span>
                <span class="sidebar-cat-head-label">${label}</span>
                <span class="sidebar-cat-count" id="online-tool-cat-count-${idx}"></span>
                <span class="sidebar-cat-head-arrow">${arrowSVG}</span>
            </button>
            <div class="sidebar-cat-content">
                <div class="sidebar-cat-content-inner" id="online-tool-cat-content-${idx}"></div>
            </div>
        </div>`
    ).join('');
    // DOM 刚建好，把已缓存的数量立即回填
    ONLINE_TOOLS_CAT_LABELS.forEach((_, idx) => {
        const cached = onlineToolsCache[idx];
        if (cached && cached.status === 'ok') {
            const el = document.getElementById('online-tool-cat-count-' + idx);
            if (el) el.textContent = cached.items.length;
        }
    });
}

function toggleOnlineToolsCatRow(idx) {
    const row = document.getElementById('online-tool-cat-row-' + idx);
    if (!row) return;
    const isOpen = row.classList.contains('open');

    // 收起所有已展开的行
    document.querySelectorAll('#sidebar-online-tools-nav .sidebar-cat-row.open').forEach(r => {
        if (r !== row) collapseRow(r);
    });

    if (!isOpen) {
        openOnlineToolsCatRow = idx;
        const cached = onlineToolsCache[idx];
        if (cached && cached.status === 'ok') {
            renderOnlineToolsCatContent(idx);
            expandRow(row, idx);
        } else {
            expandRow(row, idx);
            loadOnlineToolsForCat(idx).then(() => {
                renderOnlineToolsCatContent(idx);
                const content = row.querySelector('.sidebar-cat-content');
                if (content && row.classList.contains('open')) {
                    content.style.height = content.scrollHeight + 'px';
                    content.addEventListener('transitionend', function onEnd2(e) {
                        if (e.propertyName !== 'height') return;
                        content.removeEventListener('transitionend', onEnd2);
                        if (row.classList.contains('open')) content.style.height = 'auto';
                    });
                }
            });
        }
    } else {
        openOnlineToolsCatRow = null;
        collapseRow(row);
    }
}

function renderOnlineToolsCatContent(idx) {
    const contentEl = document.getElementById('online-tool-cat-content-' + idx);
    if (!contentEl) return;

    const cached = onlineToolsCache[idx];
    if (!cached || cached.status === 'loading') {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">⏳</div>加载中…</div>';
        return;
    }
    if (cached.status === 'error') {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">🛠️</div>读取失败，请检查 tools_' + (idx + 1) + '.json</div>';
        return;
    }

    const items = cached.items;
    if (!items || !items.length) {
        contentEl.innerHTML = '<div class="sidebar-empty"><div class="sidebar-empty-icon">📭</div>暂无工具</div>';
        return;
    }
    contentEl.innerHTML = '<div class="tool-list-inner">' + items.map(p => {
        const href = ONLINE_TOOLS_BASE_PATH + p.path;
        return `
        <a class="post-item" href="${href}" target="_blank" rel="noopener">
            <div class="post-item-bar"></div>
            <span class="post-item-title">${p.title || '未命名工具'}</span>
            <span class="post-item-arrow">›</span>
        </a>`;
    }).join('') + '</div>';
}

// ── 按分类索引懒加载对应 tools/tools_N.json ──
// catIndex 从 0 开始，对应文件 tools_1.json（索引+1）
async function loadOnlineToolsForCat(catIndex) {
    const cached = onlineToolsCache[catIndex];
    if (cached && cached.status === 'ok') return;
    if (cached && cached.status === 'loading') {
        await new Promise(resolve => {
            let t = 0;
            const check = setInterval(() => {
                t += 100;
                if (!onlineToolsCache[catIndex] || onlineToolsCache[catIndex].status !== 'loading' || t > 5000) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
        return;
    }
    onlineToolsCache[catIndex] = { status: 'loading', items: [] };
    const fileNum = catIndex + 1; // tools_1.json = 第0个分类
    try {
        const res = await fetch(ONLINE_TOOLS_BASE_URL + fileNum + '.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const items = await res.json();
        onlineToolsCache[catIndex] = { status: 'ok', items };
        // 更新分类行数量 badge
        const countEl = document.getElementById('online-tool-cat-count-' + catIndex);
        if (countEl) countEl.textContent = items.length;
        // 更新总计数
        onlineToolsTotalCount = Object.values(onlineToolsCache).reduce((sum, c) => sum + (c.status === 'ok' ? c.items.length : 0), 0);
        const statEl = document.getElementById('stat-online-tools');
        if (statEl) statEl.textContent = onlineToolsTotalCount;
        // 如果当前展开行就是这个分类，立即渲染
        if (openOnlineToolsCatRow === catIndex) renderOnlineToolsCatContent(catIndex);
    } catch (e) {
        onlineToolsCache[catIndex] = { status: 'error', items: [] };
        const statFail = document.getElementById('stat-online-tools');
        if (statFail && statFail.textContent === '—') statFail.textContent = '0';
    }
}

async function preloadAllOnlineTools() {
    const fetches = ONLINE_TOOLS_CAT_LABELS.map((_, idx) => loadOnlineToolsForCat(idx));
    await Promise.allSettled(fetches);
    // 全部加载完毕，刷新精确总数
    const total = Object.values(onlineToolsCache).reduce((sum, c) => sum + (c.status === 'ok' ? c.items.length : 0), 0);
    const statEl = document.getElementById('stat-online-tools');
    if (statEl && total > 0) statEl.textContent = total;
}
