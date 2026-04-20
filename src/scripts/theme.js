// ============================================
//   THEME & ACCENT LOGIC
//   src/scripts/theme.js
// ============================================

// ── 主题色定义（与 theme.css 的 data-accent 对应）──
const ACCENT_THEMES = [
    { key: 'blue',   label: '靛蓝', light: '#007AFF', dark: '#0A84FF' },
    { key: 'mint',   label: '薄荷', light: '#00C7BE', dark: '#63E6E2' },
    { key: 'pink',   label: '粉红', light: '#FF2D55', dark: '#FF375F' },
    { key: 'purple', label: '紫色', light: '#AF52DE', dark: '#BF5AF2' },
    { key: 'orange', label: '橙色', light: '#FF9500', dark: '#FF9F0A' },
    { key: 'teal',   label: '青色', light: '#30B0C7', dark: '#40C8E0' },
    { key: 'green',  label: '绿色', light: '#34C759', dark: '#30D158' },
];

// ⚠️ 必须挂在 window 上，index.html 的 onpopstate 跨 <script> 边界读取这些变量
//    用 let 声明会产生两份互不可见的副本，导致返回键逻辑完全失效
window.pickerOpen       = window.pickerOpen       || false;
window.settingsOpen     = window.settingsOpen     || false;
window._settingsClosing = window._settingsClosing || false;

// ── 初始化主题（页面加载时调用）──
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    // 兜底同步 theme-color meta（防闪屏脚本已在 DOMContentLoaded 设置）
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
    const tc = document.createElement('meta');
    tc.name = 'theme-color';
    tc.content = savedTheme === 'dark' ? '#1C1C1E' : '#F2F2F7';
    document.head.appendChild(tc);
}

// ── 初始化主题色（页面加载时调用）──
function initAccent() {
    const saved = localStorage.getItem('accent') || 'blue';
    if (saved !== 'blue') {
        document.documentElement.setAttribute('data-accent', saved);
    }
}

// ── 实际执行主题切换（供 toggleTheme / View Transition 调用）──
function _applyThemeChange(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
    const tc = document.createElement('meta');
    tc.name = 'theme-color';
    tc.content = newTheme === 'dark' ? '#1C1C1E' : '#F2F2F7';
    document.head.appendChild(tc);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    if (window.pickerOpen) buildPicker();
    if (window.settingsOpen) buildPicker();
}

// ── 切换深色/浅色（按钮点击触发）──
function toggleTheme() {
    const btn = document.getElementById('theme-btn');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    if (btn) {
        btn.classList.add('rotating');
        setTimeout(() => btn.classList.remove('rotating'), 400);
    }

    // 优先使用 View Transitions API
    if (document.startViewTransition) {
        document.startViewTransition(() => { _applyThemeChange(newTheme); });
        return;
    }

    // 降级：CSS class 全局颜色 transition
    document.documentElement.classList.add('theme-transitioning');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            _applyThemeChange(newTheme);
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 420);
        });
    });
}

// ── 同步所有主题图标/标签到当前主题状态 ──
function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = theme === 'dark' ? '🌙' : '☀️';

    const sqbTheme   = document.getElementById('sqb-theme');
    const themeIcon  = document.getElementById('settings-theme-icon');
    const themeLabel = document.getElementById('settings-theme-label');
    const themeToggle= document.getElementById('sqb-theme-toggle');
    const isDark = theme === 'dark';
    if (sqbTheme)    sqbTheme.classList.toggle('active-state', isDark);
    if (themeIcon)   themeIcon.textContent = isDark ? '🌙' : '☀️';
    if (themeLabel)  themeLabel.textContent = isDark ? '深色模式' : '浅色模式';
    if (themeToggle) themeToggle.classList.toggle('on', isDark);
}

// ── 设置主题色 ──
function setAccent(key) {
    localStorage.setItem('accent', key);
    if (key === 'blue') {
        document.documentElement.removeAttribute('data-accent');
    } else {
        document.documentElement.setAttribute('data-accent', key);
    }
    buildPicker();
}

// ── 渲染颜色选择器圆点 ──
function buildPicker() {
    const container = document.getElementById('picker-colors');
    if (!container) return;
    const currentAccent = localStorage.getItem('accent') || 'blue';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    container.innerHTML = ACCENT_THEMES.map(t => `
        <div class="picker-item">
            <button class="picker-swatch${t.key === currentAccent ? ' selected' : ''}"
                style="background:${isDark ? t.dark : t.light}"
                onclick="setAccent('${t.key}')"
                title="${t.label}">
            </button>
            <div class="picker-label">${t.label}</div>
        </div>
    `).join('');
}

function togglePicker() { /* legacy — no-op */ }

// ── 设置面板开关 ──
function toggleSettings() {
    window.settingsOpen ? closeSettings() : openSettings();
}

function openSettings() {
    if (window.settingsOpen) return;
    window.settingsOpen = true;
    buildPicker();
    syncViewToggle();
    document.getElementById('settings-panel').classList.add('open');
    document.getElementById('settings-overlay').classList.add('visible');
    const sBtn = document.getElementById('settings-btn');
    const fBtn = document.getElementById('fab-settings-btn');
    [sBtn, fBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.remove('spin-close');
        btn.classList.add('active', 'spin-open');
        btn.addEventListener('animationend', () => btn.classList.remove('spin-open'), { once: true });
    });
    _scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    window.history.pushState({ state: 'settings' }, '');
}

function closeSettings(fromPopstate) {
    if (!window.settingsOpen) return;
    window.settingsOpen = false;
    document.getElementById('settings-panel').classList.remove('open');
    document.getElementById('settings-overlay').classList.remove('visible');
    const sBtn = document.getElementById('settings-btn');
    const fBtn = document.getElementById('fab-settings-btn');
    [sBtn, fBtn].forEach(btn => {
        if (!btn) return;
        btn.classList.remove('spin-open', 'active');
        btn.classList.add('spin-close');
        btn.addEventListener('animationend', () => btn.classList.remove('spin-close'), { once: true });
    });
    document.body.style.overflow = '';
    if (!fromPopstate) {
        window._settingsClosing = true;
        window.history.back();
    }
}

// ── 同步视图切换按钮状态 ──
function syncViewToggle() {
    const sqbView = document.getElementById('sqb-view');
    const icon    = document.getElementById('settings-view-icon');
    const label   = document.getElementById('settings-view-label');
    const toggle  = document.getElementById('sqb-view-toggle');
    const isGrid  = !isListView;
    if (sqbView) sqbView.classList.toggle('active-state', isGrid);
    if (label)   label.textContent = isGrid ? '网格视图' : '列表视图';
    if (toggle)  toggle.classList.toggle('on', isGrid);
    if (icon) {
        icon.innerHTML = isListView
            ? `<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`
            : `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>`;
    }
}
