/* ============================================
   PAGE NUMPAD — 页码跳转自定义数字盘
   路径：src/scripts/numpad.js

   包含：
   1. 内联注入 CSS（原 src/styles/numpad.css，已合并，无需单独 .css 文件）
   2. 动态注入数字盘 HTML 结构
   3. 数字盘交互逻辑：openPageJump / closePageJump /
      numpadInput / numpadDelete / numpadConfirm
============================================ */

(function () {
    /* ── 1. 内联注入 CSS（原 src/styles/numpad.css，已合并）── */
    const style = document.createElement('style');
    style.textContent = `
/* ============================================
   PAGE NUMPAD — 页码跳转自定义数字盘 样式
   路径：src/styles/numpad.css
============================================ */

/* 页码跳转：分页栏内的显示框（只读，不触发键盘） */
.page-jump-display {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 2px solid var(--accent-color);
    background: var(--card-bg);
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    font-family: -apple-system, "SF Pro Text", sans-serif;
    text-align: center;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent);
    cursor: default;
    user-select: none;
}

/* 自定义数字盘浮层 */
#page-numpad-overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 200;
    background: transparent;
}
#page-numpad-overlay.active { display: block; }

#page-numpad {
    position: fixed;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    bottom: 80px;   /* 悬浮在分页栏上方 */
    background: var(--card-bg);
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.08);
    padding: 14px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.18s, transform 0.18s cubic-bezier(0.34,1.4,0.64,1);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    min-width: 240px;
}
#page-numpad-overlay.active #page-numpad {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.numpad-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: var(--fill-1);
    border-radius: 10px;
    margin-bottom: 2px;
    gap: 8px;
}
.numpad-preview-val {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    font-family: -apple-system, "SF Pro Text", sans-serif;
    min-width: 40px;
    text-align: center;
}
.numpad-preview-hint {
    font-size: 12px;
    color: var(--text-tertiary);
    font-family: -apple-system, "SF Pro Text", sans-serif;
}

.numpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}
.numpad-key {
    height: 44px;
    border-radius: 11px;
    border: none;
    background: var(--fill-1);
    color: var(--text-main);
    font-size: 18px;
    font-weight: 500;
    font-family: -apple-system, "SF Pro Text", sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s, transform 0.08s;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
}
.numpad-key:active { background: var(--fill-2); transform: scale(0.93); }
.numpad-key.numpad-del {
    font-size: 16px;
    color: var(--text-sub);
}
.numpad-key.numpad-confirm {
    background: var(--accent-color);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
}
.numpad-key.numpad-confirm:active { background: var(--accent-color); filter: brightness(0.9); }
    `;
    document.head.appendChild(style);

    /* ── 2. 注入 HTML ── */
    const html = `
    <div id="page-numpad-overlay">
        <div id="page-numpad">
            <div class="numpad-preview">
                <span class="numpad-preview-hint">跳转到第</span>
                <span class="numpad-preview-val" id="numpad-val">—</span>
                <span class="numpad-preview-hint" id="numpad-total-hint">/ ? 页</span>
            </div>
            <div class="numpad-grid">
                <button class="numpad-key" onclick="numpadInput('1')">1</button>
                <button class="numpad-key" onclick="numpadInput('2')">2</button>
                <button class="numpad-key" onclick="numpadInput('3')">3</button>
                <button class="numpad-key" onclick="numpadInput('4')">4</button>
                <button class="numpad-key" onclick="numpadInput('5')">5</button>
                <button class="numpad-key" onclick="numpadInput('6')">6</button>
                <button class="numpad-key" onclick="numpadInput('7')">7</button>
                <button class="numpad-key" onclick="numpadInput('8')">8</button>
                <button class="numpad-key" onclick="numpadInput('9')">9</button>
                <button class="numpad-key numpad-del" onclick="numpadDelete()">⌫</button>
                <button class="numpad-key" onclick="numpadInput('0')">0</button>
                <button class="numpad-key numpad-confirm" onclick="numpadConfirm()">跳转</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    /* ── 3. 状态变量 ── */
    // _numpadValue 挂到 window，供 renderPagination 等主逻辑读取
    window._numpadValue = '';

    /* ── 4. 交互函数（全局暴露，供 inline onclick 及主逻辑调用） ── */

    /**
     * 打开数字盘
     * @param {number} cur   - 当前页码
     * @param {number} total - 总页数
     */
    window.openPageJump = function (cur, total) {
        window._paginationJumping = true;
        window._numpadValue = '';
        // 推历史条目，返回键可取消
        window.history.pushState({ state: 'pageJump', page: cur }, '');
        // 更新浮层内容
        const valEl = document.getElementById('numpad-val');
        const hintEl = document.getElementById('numpad-total-hint');
        if (valEl) valEl.textContent = '—';
        if (hintEl) hintEl.textContent = `/ ${total} 页`;
        // 显示数字盘
        const overlay = document.getElementById('page-numpad-overlay');
        overlay.classList.add('active');
        // 点击遮罩背景取消
        overlay.onclick = function (e) {
            if (e.target === overlay) window.closePageJump(cur, total, false);
        };
        renderPagination(cur, total);
    };

    /**
     * 关闭数字盘
     * @param {number}  cur   - 当前页码
     * @param {number}  total - 总页数
     * @param {boolean} jump  - 是否执行跳转
     */
    window.closePageJump = function (cur, total, jump) {
        window._paginationJumping = false;
        const overlay = document.getElementById('page-numpad-overlay');
        overlay.classList.remove('active');
        if (jump) {
            const val = parseInt(window._numpadValue, 10);
            window._numpadValue = '';
            if (!isNaN(val) && val >= 1 && val <= total && val !== cur) {
                goToPage(val);
                return;
            }
        }
        window._numpadValue = '';
        renderPagination(cur, total);
    };

    /**
     * 数字按键输入
     * @param {string} digit - 输入的单个数字字符
     */
    window.numpadInput = function (digit) {
        const total = totalPages;
        const newVal = window._numpadValue + digit;
        const maxLen = String(total).length;
        if (newVal.length > maxLen) return;
        window._numpadValue = newVal;
        const valEl = document.getElementById('numpad-val');
        if (valEl) valEl.textContent = window._numpadValue || '—';
        renderPagination(currentPage, total);
    };

    /**
     * 退格删除
     */
    window.numpadDelete = function () {
        window._numpadValue = window._numpadValue.slice(0, -1);
        const valEl = document.getElementById('numpad-val');
        if (valEl) valEl.textContent = window._numpadValue || '—';
        renderPagination(currentPage, totalPages);
    };

    /**
     * 确认跳转
     */
    window.numpadConfirm = function () {
        window.closePageJump(currentPage, totalPages, true);
    };

})();
