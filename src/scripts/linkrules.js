/**
 * linkrules.js — 链接规则配置
 * 路径：src/scripts/linkrules.js
 *
 * 两张规则表，按顺序从上往下匹配，第一条命中即停止。
 * 每条规则格式：
 *   { match: ['域名片段', ...], text: '按钮文字', color: '#颜色' }
 *
 * 增加规则：在对应数组末尾（或任意位置）添加一条对象即可。
 * 删除规则：直接删掉对应那一行对象。
 * 调整优先级：上移/下移对象位置。
 */

// ── 来源按钮规则（app.source 字段）──────────────────────────────────────
// 默认值（无匹配时）：{ text: '官方网站', color: '#007AFF' }
window.SOURCE_RULES = [
    { match: ['github.com', 'gitee.com', 'gitlab.com'],                         text: '查看源码',    color: '#8957E5' },
    { match: ['coolapk.com'],                                                    text: '酷安主页',    color: '#0FB567' },
    { match: ['bilibili.com', 'b23.tv'],                                         text: 'B站主页',     color: '#FB7299' },
    { match: ['douyin.com'],                                                     text: '抖音主页',    color: '#121212' },
    { match: ['t.me'],                                                           text: 'TG 群聊/频道', color: '#24A1DE' },
    { match: ['qm.qq.com', 'qq.com'],                                            text: 'QQ 群聊/频道',     color: '#12B7F5' },
    { match: ['weixin.qq.com', 'wx.qq.com', 'weixin', 'wechat'],                 text: '微信',        color: '#07C160' },
    { match: ['xiaohongshu.com', 'xhslink.com'],                                 text: '小红书',      color: '#FF2442' },
    { match: ['kuaishou.com', 'gifshow.com', 'ksapp.com'],                       text: '快手主页',    color: '#FF4906' },
    { match: ['weibo.com', 'weibo.cn'],                                          text: '微博主页',    color: '#E6162D' },
    { match: ['zhihu.com'],                                                      text: '知乎主页',    color: '#0084FF' },
    { match: ['tieba.baidu.com'],                                                text: '百度贴吧',    color: '#4E6EF2' },
    { match: ['douban.com'],                                                     text: '豆瓣主页',    color: '#22AC38' },
    { match: ['youtube.com', 'youtu.be'],                                        text: 'YouTube',     color: '#FF0000' },
    { match: ['reddit.com', 'redd.it'],                                          text: 'Reddit',      color: '#FF4500' },
    { match: ['discord.com', 'discord.gg'],                                      text: 'Discord',     color: '#5865F2' },
    { match: ['twitter.com', 'x.com'],                                           text: 'X / Twitter', color: '#000000' },
    { match: ['tiktok.com'],                                                     text: 'TikTok',      color: '#010101' },
    { match: ['instagram.com'],                                                  text: 'Instagram',   color: '#E1306C' },
    { match: ['facebook.com', 'fb.com'],                                         text: 'Facebook',    color: '#1877F2' },
    { match: ['whatsapp.com', 'wa.me'],                                          text: 'WhatsApp',    color: '#25D366' },
    { match: ['threads.net'],                                                    text: 'Threads',     color: '#101010' },
];

// ── 下载按钮规则（app.url 字段）─────────────────────────────────────────
// 默认值（无匹配时）：{ text: '立即下载', color: '#007AFF' }
// special: 'github_direct' 表示仅当 URL 以 .apk 或 .zip 结尾时才匹配
window.DOWNLOAD_RULES = [
    { match: ['123pan.com', '123912.com'],                                       text: '123云盘',      color: '#0064FF' },
    { match: ['lanzou', 'lanzv', 'lanzx', 'lanzp'],                             text: '蓝奏云',       color: '#398BFC' },
    { match: ['github.com'],                        special: 'github_direct',    text: 'GitHub直链',   color: '#238636' },
    { match: ['alist'],                                                          text: 'AList',        color: '#3D8BFF' },
    { match: ['pan.baidu.com', 'yun.baidu.com'],                                 text: '百度网盘',     color: '#2468F2' },
    { match: ['pan.xunlei.com', 'yunpan.xunlei.com'],                            text: '迅雷云盘',     color: '#0B6CF5' },
    { match: ['cloud.189.cn', 'e.189.cn'],                                       text: '天翼云盘',     color: '#E2001A' },
    { match: ['caiyun.139.com', 'yun.139.com'],                                  text: '移动云盘',     color: '#00B252' },
    { match: ['quark.cn'],                                                       text: '夸克网盘',     color: '#00c9b0' },
    { match: ['alipan.com', 'aliyundrive.com'],                                  text: '阿里云盘',     color: '#6356ff' },
    { match: ['weiyun.com'],                                                     text: '腾讯微云',     color: '#3072f6' },
    { match: ['drive.google.com'],                                               text: 'Google Drive', color: '#1A73E8' },
    { match: ['mediafire.com'],                                                  text: 'MediaFire',    color: '#1DAAE8' },
    { match: ['mypikpak.com', 'pikpak.com'],                                     text: 'PikPak',       color: '#2B6EFB' },
    { match: ['mega.nz', 'mega.co.nz'],                                          text: 'Mega',         color: '#D9272E' },
];
