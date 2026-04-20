/**
 * ════════════════════════════════════════
 *  智汇仓库 · 源码防护脚本
 *  路径: src/scripts/security.js
 *  说明: 由 index.html 通过 <script src> 加载，
 *        无需动态 fetch，浏览器原生缓存即可复用。
 *  包含: ⓪ 禁止文本复制 CSS
 *        ① 禁用右键菜单
 *        ② 禁用危险快捷键
 *        ③ DevTools 尺寸检测
 *        ④ 截图/录屏视觉遮罩
 *        ⑤ console 陷阱
 * ════════════════════════════════════════
 */
(function () {
    'use strict';

    /* ─────────────────────────────────────────
       ⓪ 禁止文本复制（CSS 动态注入，与页面样式解耦）
          body 全局禁止选中；input/textarea 保留正常选中
    ───────────────────────────────────────── */
    (function _injectUserSelectCSS() {
        var style = document.createElement('style');
        style.id  = 'security-user-select';
        style.textContent = [
            'body{',
            '  user-select:none;',
            '  -webkit-user-select:none;',
            '  -moz-user-select:none;',
            '  -ms-user-select:none;',
            '}',
            'input,textarea{',
            '  user-select:text;',
            '  -webkit-user-select:text;',
            '}'
        ].join('\n');
        // 等 head 可用时插入（defer 模式下 DOM 已就绪，直接追加）
        (document.head || document.documentElement).appendChild(style);
    })();

    /* ─────────────────────────────────────────
       ① 禁用右键菜单
    ───────────────────────────────────────── */
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    /* ─────────────────────────────────────────
       ② 禁用危险快捷键
          F12 / Ctrl+U / Ctrl+S / Ctrl+P
          Ctrl+Shift+I / J / C（DevTools）
          截图快捷键（PrtSc / Mac Cmd+Shift+3/4/5/6）
    ───────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
        var k = e.key ? e.key.toLowerCase() : '';

        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Ctrl+U / S / P
        if (e.ctrlKey && !e.shiftKey && ['u', 's', 'p'].includes(k)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I / J / C
        if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) {
            e.preventDefault();
            return false;
        }

        // 截图：PrtSc / Win+PrtSc / Mac Cmd+Shift+3/4/5/6
        var isPrtSc   = e.key === 'PrintScreen';
        var isMacShot = e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(e.key);
        var isWinShot = e.key === 'PrintScreen' && (e.metaKey || e.altKey);
        if (isPrtSc || isMacShot || isWinShot) {
            _showCaptureOverlay();
            e.preventDefault();
            setTimeout(_hideCaptureOverlay, 400);
        }
    });

    /* ─────────────────────────────────────────
       ③ DevTools 尺寸检测
          侧边/底部弹出时，outer 与 inner 宽高差 > 160px
    ───────────────────────────────────────── */
    var _devToolsBlocked = false;

    function _checkDevTools() {
        var wGap = window.outerWidth  - window.innerWidth;
        var hGap = window.outerHeight - window.innerHeight;
        if ((wGap > 160 || hGap > 160) && !_devToolsBlocked) {
            _devToolsBlocked = true;
            // 获取当前主题背景色，与页面保持一致
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var bg  = isDark ? '#000000' : '#F2F2F7';
            var fg  = isDark ? '#EBEBF5' : '#3C3C43';
            document.body.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;' +
                'height:100vh;background:' + bg + ';font-family:-apple-system,sans-serif;">' +
                '<p style="font-size:18px;color:' + fg + ';text-align:center;">' +
                '⚠️ 请关闭开发者工具后刷新页面</p></div>';
        }
    }

    setInterval(_checkDevTools, 1000);

    /* ─────────────────────────────────────────
       ④ 截图 / 录屏视觉遮罩
    ───────────────────────────────────────── */
    var _overlay = null;

    function _showCaptureOverlay() {
        if (_overlay) return;
        _overlay = document.createElement('div');
        _overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:#000', 'opacity:0',
            'transition:opacity .1s ease',
            'pointer-events:none',
            'will-change:opacity'
        ].join(';');
        document.body.appendChild(_overlay);
        requestAnimationFrame(function () { _overlay.style.opacity = '1'; });
    }

    function _hideCaptureOverlay() {
        if (!_overlay) return;
        _overlay.style.opacity = '0';
        var o = _overlay;
        setTimeout(function () {
            if (o && o.parentNode) o.parentNode.removeChild(o);
            if (_overlay === o) _overlay = null;
        }, 150);
    }

    // 页面失焦时遮黑（切至录屏工具 / 系统截图界面时触发）
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            _showCaptureOverlay();
        } else {
            setTimeout(_hideCaptureOverlay, 80);
        }
    });

    /* ─────────────────────────────────────────
       ⑤ console 陷阱
          toString 触发时说明控制台已打开
    ───────────────────────────────────────── */
    var _trap = /./;
    _trap.toString = function () {
        return '⚠️ 禁止调试';
    };
    setInterval(function () {
        console.log('%c', _trap);
    }, 2000);

})();
