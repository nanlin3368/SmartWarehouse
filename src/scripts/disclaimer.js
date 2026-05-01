/* ============================================
   DISCLAIMER — 免责声明弹窗
   路径：src/scripts/disclaimer.js

   包含（原分散在四处，现全部合并）：
   1. 内联注入 CSS（原 index.html <style> 中的 disclaimer 块）
   2. 动态注入 .disclaimer-bar 页脚 + #disclaimer-overlay 弹窗 HTML
   3. openDisclaimer / closeDisclaimer（原主脚本内联函数）
   4. 免责声明正文内容注入（原 src/scripts/info.js）
============================================ */

(function () {

    /* ── 1. 内联注入 CSS ── */
    const style = document.createElement('style');
    style.textContent = `
/* ---- 页脚入口条 ---- */
.disclaimer-bar {
    text-align: center;
    padding: 16px 20px 30px;
    color: var(--text-sub);
    font-size: 12px;
    line-height: 1.6;
}
.disclaimer-bar a,
.disclaimer-trigger {
    color: var(--accent-color);
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    background: none;
    border: none;
    font-size: 12px;
    font-family: inherit;
    padding: 0;
}
.disclaimer-trigger:hover { text-decoration: underline; }

/* ---- 弹窗遮罩 ---- */
#disclaimer-overlay {
    display: none;
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.32);
    z-index: 1000;
    justify-content: center;
    align-items: flex-end;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s cubic-bezier(0.4,0,0.2,1);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
}
#disclaimer-overlay.active {
    opacity: 1;
    pointer-events: auto;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
}
@media (min-width: 600px) {
    #disclaimer-overlay { align-items: center; padding: 20px; }
}

/* ---- 弹窗主体 ---- */
.disclaimer-modal {
    background: var(--card-bg);
    width: 100%;
    max-width: 600px;
    border-radius: 20px 20px 0 0;
    max-height: 88dvh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 40px rgba(0,0,0,0.18);
    transform: translateY(105%);
    transition: transform 0.42s cubic-bezier(0.32,0.72,0,1);
    will-change: transform;
    color: var(--text-main);
    overflow: hidden;
}
@media (min-width: 600px) {
    .disclaimer-modal {
        border-radius: 22px;
        width: 600px;
        max-width: calc(100vw - 48px);
        max-height: 88dvh;
        transform: translate(0, -48px) scale(0.92);
        transition: transform 0.32s cubic-bezier(0.32,0.72,0,1),
                    opacity 0.22s cubic-bezier(0.4,0,0.2,1);
        opacity: 0;
    }
}
#disclaimer-overlay.active .disclaimer-modal {
    transform: translateY(0);
    opacity: 1;
}
@media (min-width: 600px) {
    #disclaimer-overlay.active .disclaimer-modal {
        transform: scale(1) translateY(0);
        opacity: 1;
    }
}

/* ---- 拖动条（移动端）---- */
.disclaimer-drag-bar {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 10px 0 2px;
    flex-shrink: 0;
}
.disclaimer-drag-bar::after {
    content: '';
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-color);
}
@media (min-width: 600px) {
    .disclaimer-drag-bar { display: none; }
}

/* ---- 弹窗头部 ---- */
.disclaimer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px 16px;
    border-bottom: 0.5px solid var(--separator);
    flex-shrink: 0;
}
.disclaimer-header-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.disclaimer-close {
    width: 30px; height: 30px;
    background: var(--fill-1);
    border: none; border-radius: 50%;
    color: var(--text-sub);
    font-size: 14px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
    flex-shrink: 0;
}
.disclaimer-close:hover { background: var(--fill-2); }

/* ---- 弹窗滚动内容 ---- */
.disclaimer-body {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 20px 32px;
    flex: 1;
}
@media (min-width: 768px) {
    .disclaimer-body { padding: 20px 28px 36px; }
    .disclaimer-header { padding: 16px 28px 14px; }
}

/* ---- 章节样式 ---- */
.disc-section { margin-bottom: 18px; }
.disc-section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.disc-section-body {
    font-size: 13px;
    color: var(--text-sub);
    line-height: 1.75;
    background: var(--modal-info-bg);
    border-radius: 10px;
    padding: 10px 14px;
}

/* ---- 底部同意按钮 ---- */
.disclaimer-footer {
    padding: 12px 20px 20px;
    border-top: 0.5px solid var(--separator);
    flex-shrink: 0;
}
.disclaimer-agree-btn {
    width: 100%;
    background: var(--accent-color);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 14px 0;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s, transform 0.12s;
}
.disclaimer-agree-btn:active { transform: scale(0.97); opacity: 0.85; }
.disclaimer-agree-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
}
@media (min-width: 768px) {
    .disclaimer-footer { padding: 14px 28px 24px; }
}
    `;
    document.head.appendChild(style);

    /* ── 2. 注入 HTML ── */
    const html = `
    <!-- ════ 免责声明页脚入口 ════ -->
    <div class="disclaimer-bar">
        由 闲月 整理 ❤️ &nbsp;|&nbsp; 纯粹收录 · 极简丝滑 · 拒绝臃肿<br>
        本站内容仅供学习参考 · 使用前请阅读
        <button class="disclaimer-trigger" onclick="openDisclaimer()">免责声明</button>
    </div>

    <!-- ════ 免责声明弹窗 ════ -->
    <div id="disclaimer-overlay">
        <div class="disclaimer-modal" onclick="event.stopPropagation()">
            <div class="disclaimer-drag-bar"></div>
            <div class="disclaimer-header">
                <div class="disclaimer-header-title">⚠️ 免责声明</div>
            </div>
            <div class="disclaimer-body" id="disclaimer-content-body"></div>
            <div class="disclaimer-footer">
                <button class="disclaimer-agree-btn" onclick="closeDisclaimer()">我已阅读并了解</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    /* ── 3. 免责声明正文内容（原 info.js）── */
    var DISCLAIMER_HTML = `
<div class="disc-section">
    <div class="disc-section-title">📦 关于软件收录</div>
    <div class="disc-section-body">
        本站仅对互联网上公开传播的应用程序进行信息整理与收录，提供应用名称、版本、简介及外部下载链接，<strong>不直接存储、托管或分发任何应用安装包（APK）文件</strong>。所有下载链接均指向蓝奏云、123云盘等第三方网盘平台，文件实际存储于上述平台，本站对相关文件的安全性、完整性、合法性及可用性不承担任何责任。链接失效或文件内容变更等情况，亦与本站无关。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">🌐 关于网站导航</div>
    <div class="disc-section-body">
        本站收录的第三方网站（包括但不限于资源库、素材网、技术论坛等）均由搜索引擎及公开信息整理而成，旨在方便用户获取信息。<strong>本站与所列网站无任何隶属、合作或商业关系</strong>。本站无法对第三方网站的内容实时性、安全性及服务质量进行监控，用户在访问上述网站时，请务必自行甄别信息真伪，防止诈骗、病毒感染及隐私泄露。因访问第三方网站产生的任何纠纷或损失，本站概不负责。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">🔧 关于修改版 / 第三方版本</div>
    <div class="disc-section-body">
        本站收录的部分内容涉及第三方修改版本，此类内容<strong>仅供个人技术研究与学习交流，严禁用于任何商业用途</strong>。修改版软件可能违反原软件的用户协议，因使用修改版软件导致的账号封禁、数据丢失、设备损坏或其他一切损失，由使用者自行承担全部责任，与本站无关。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">⚙️ 关于 Root / ADB 等高级操作</div>
    <div class="disc-section-body">
        本站收录的部分工具涉及 Root 权限、ADB 调试等高风险操作，可能导致设备保修失效、系统不稳定、指纹支付失效或数据永久丢失。<strong>本站不提供技术担保及救砖服务，请在充分了解风险后谨慎操作。</strong>本站对由此产生的一切后果不承担任何法律责任。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">📝 关于知识文档</div>
    <div class="disc-section-body">
        本站发布的技术文章、教程及攻略均基于作者个人实践经验，仅供参考，不构成专业建议。文章内容可能随软件版本更新而过时，本站不保证内容的时效性与准确性。读者按文章操作造成的任何问题，由操作者本人负责。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">©️ 关于版权与知识产权</div>
    <div class="disc-section-body">
        本站尊重原创，所有收录内容的版权归原作者及相关权利人所有。本站仅对公开信息进行整理，不代表本站拥有相关软件或内容的著作权。若您认为本站收录内容侵犯了您的权益，请按下方"避风港原则"条款联系我们处理。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">⚖️ 关于侵权投诉与"避风港"原则</div>
    <div class="disc-section-body">
        本站作为非盈利性信息整理平台，严格遵守《信息网络传播权保护条例》及"避风港原则"。<strong>若权利人发现本站链接的内容侵犯了您的合法权益，请提供有效的权属证明材料发送邮件至 [你的邮箱地址] 与我们联系</strong>。我们将在核实后的 24 小时内对相关内容进行断开链接或下架处理。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">🔗 关于外部链接</div>
    <div class="disc-section-body">
        本站提供的所有外部链接（包括但不限于蓝奏云、123云盘、GitHub、B站、酷安、Telegram 等平台）均指向独立的第三方平台。本站无法控制上述平台的内容变更、文件替换、链接失效或安全状况，亦不对其内容作任何形式的背书或保证。用户访问外部链接及下载相关文件所产生的一切风险，由用户自行承担。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">👤 关于用户责任</div>
    <div class="disc-section-body">
        访问并使用本站内容，即视为您已阅读并同意本免责声明全部内容。您须确保自己在所在地区使用本站内容符合当地法律法规，因违规使用产生的一切法律责任由用户自行承担，与本站无关。
    </div>
</div>

<div class="disc-section">
    <div class="disc-section-title">📋 声明变更</div>
    <div class="disc-section-body">
        本站保留随时修改本免责声明的权利，更新后的声明将直接在本页面生效，不另行通知。建议定期查阅本声明。
    </div>
</div>
`;

    /* ── 4. 内容注入（同步，DOMContentLoaded 后执行）── */
    function injectContent() {
        var container = document.getElementById('disclaimer-content-body');
        if (container) container.innerHTML = DISCLAIMER_HTML;
    }
    document.addEventListener('DOMContentLoaded', injectContent);

    /* ── 5. 开启弹窗 ── */
    window.openDisclaimer = function () {
        const overlay = document.getElementById('disclaimer-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('active'));
        document.body.style.overflow = 'hidden';

        // 先把当前历史条目标记为 base，确保 back() 有退路
        // 再 push 一条弹窗状态，供 Android 硬件返回键触发 popstate
        window.history.replaceState({ state: 'base' }, '');
        window.history.pushState({ state: 'disclaimer' }, '');

        // 5 秒倒计时，防止未读直接关闭
        const btn = overlay.querySelector('.disclaimer-agree-btn');
        if (btn) {
            btn.disabled = true;
            let sec = 5;
            btn.textContent = `我已阅读并了解（${sec}s）`;
            const timer = setInterval(() => {
                sec--;
                if (sec <= 0) {
                    clearInterval(timer);
                    btn.disabled = false;
                    btn.textContent = '我已阅读并了解';
                } else {
                    btn.textContent = `我已阅读并了解（${sec}s）`;
                }
            }, 1000);
        }
    };

    /* ── 6. 关闭弹窗 ── */
    window.closeDisclaimer = function (fromPopstate) {
        const overlay = document.getElementById('disclaimer-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 320);

        if (!fromPopstate) {
            // 用 replaceState 替换掉弹窗历史条目，回到 base 状态
            // 不调用 history.back()，避免 GitHub Pages 下退出页面
            window.history.replaceState({ state: 'base' }, '');
        }
    };

})();
