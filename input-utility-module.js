// ==UserScript==
// @name         Input Utility Module
// @namespace    https://github.com/you/input-utility-module
// @version      1.2.0
// @description  Font styling, emoji/gif triggers with configurable timers, full theming, import/export.
// @author       JordanAlbiar
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const ZWS = '\u200B';

    const PRESETS = {
        '🌊': {
            bg:'#0d1b2e', bg2:'#112240', border:'#00ff8833',
            accent:'#00ff88', accentHover:'#00ff8844',
            btnBg:'#0d1b2e', btnActive:'#5b2d8e',
            text:'#ffffff', textDim:'rgba(220,240,255,0.45)', textLabel:'rgba(0,255,136,0.6)',
            inputBg:'rgba(0,255,136,0.07)', inputBorder:'rgba(0,255,136,0.25)',
            tooltipBg:'#5b2d8e', tooltipText:'#e8d5ff',
            danger:'#ff6b6b', success:'#00ff88',
        },
        '☀️': {
            bg:'#f5f6fa', bg2:'#e8eaf0', border:'#c0c4d044',
            accent:'#5c5c5c', accentHover:'#5c5c5c18',
            btnBg:'#e0e2ea', btnActive:'#9e9e9e',
            text:'#0d1b3e', textDim:'rgba(13,27,62,0.5)', textLabel:'rgba(60,60,60,0.7)',
            inputBg:'rgba(0,0,0,0.05)', inputBorder:'rgba(0,0,0,0.2)',
            tooltipBg:'#cccccc', tooltipText:'#0d1b3e',
            danger:'#cc2222', success:'#1a8c3c',
        },
        '🔮': {
            bg:'#0e0e1a', bg2:'#16142a', border:'#7b6aff44',
            accent:'#7b6aff', accentHover:'#7b6aff28',
            btnBg:'#0e0e1a', btnActive:'#4a30cc',
            text:'#fff', textDim:'rgba(255,255,255,0.4)', textLabel:'rgba(160,145,255,0.65)',
            inputBg:'rgba(120,100,255,0.08)', inputBorder:'rgba(120,100,255,0.3)',
            tooltipBg:'#2e1f6e', tooltipText:'#d4cbff',
            danger:'#ff6b6b', success:'#5dde8a',
        },
        '🌿': {
            bg:'#091a17', bg2:'#0e2620', border:'#26c99a44',
            accent:'#26c99a', accentHover:'#26c99a28',
            btnBg:'#091a17', btnActive:'#0d7d5e',
            text:'#eafff9', textDim:'rgba(200,255,235,0.45)', textLabel:'rgba(38,201,154,0.65)',
            inputBg:'rgba(38,201,154,0.08)', inputBorder:'rgba(38,201,154,0.3)',
            tooltipBg:'#074d3a', tooltipText:'#aaffd8',
            danger:'#ff6b6b', success:'#26c99a',
        },
        '🌸': {
            bg:'#1a0e16', bg2:'#261224', border:'#f07ab544',
            accent:'#f07ab5', accentHover:'#f07ab528',
            btnBg:'#1a0e16', btnActive:'#b03370',
            text:'#fff0f8', textDim:'rgba(255,210,235,0.45)', textLabel:'rgba(240,122,181,0.65)',
            inputBg:'rgba(240,122,181,0.08)', inputBorder:'rgba(240,122,181,0.3)',
            tooltipBg:'#6e0d3a', tooltipText:'#ffd6ea',
            danger:'#ff6b6b', success:'#78e88a',
        },
        '🔥': {
            bg:'#17120a', bg2:'#211a0e', border:'#e8a02044',
            accent:'#e8a020', accentHover:'#e8a02028',
            btnBg:'#17120a', btnActive:'#9a6200',
            text:'#fff8e8', textDim:'rgba(255,235,180,0.45)', textLabel:'rgba(232,160,32,0.65)',
            inputBg:'rgba(232,160,32,0.08)', inputBorder:'rgba(232,160,32,0.3)',
            tooltipBg:'#5c3c00', tooltipText:'#ffe9a8',
            danger:'#ff6b6b', success:'#78e88a',
        },
        '⬛': {
            bg:'#111', bg2:'#1c1c1c', border:'#88888844',
            accent:'#aaa', accentHover:'#aaaaaa22',
            btnBg:'#111', btnActive:'#444',
            text:'#fff', textDim:'rgba(255,255,255,0.4)', textLabel:'rgba(200,200,200,0.55)',
            inputBg:'rgba(255,255,255,0.06)', inputBorder:'rgba(255,255,255,0.2)',
            tooltipBg:'#333', tooltipText:'#eee',
            danger:'#ff6b6b', success:'#6de88a',
        },
    };

    const DEFAULT_PRESET_NAME = '⬛';
    let theme = { ...PRESETS[DEFAULT_PRESET_NAME] };

    const tooltipStyleEl = document.createElement('style');
    document.head.appendChild(tooltipStyleEl);
    function updateTooltipStyle() {
        tooltipStyleEl.textContent = `
            .__ium[title]:hover::after {
                content: attr(title);
                position: fixed;
                background: ${theme.tooltipBg} !important;
                color: ${theme.tooltipText} !important;
                font-size: 11px; font-family: system-ui,sans-serif;
                padding: 3px 8px; border-radius: 5px;
                white-space: nowrap; pointer-events: none;
                z-index: 2147483648;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                margin-top: -34px; margin-left: -4px;
            }
        `;
    }
    updateTooltipStyle();
    function tip(el, text) { el.title = text; el.classList.add('__ium'); return el; }

    let fonts = [
        { name:'Cryptic',      emoji:'𐌀', sample:'𐌂𐌓𐌙𐌐𐌕𐌉𐌂',
          map:{a:'𐌀',b:'𐌁',c:'𐌂',d:'𐌃',e:'𐌄',f:'𐌅',g:'Ᏽ',h:'𐋅',i:'𐌉',j:'Ꮭ',k:'𐌊',l:'𐌋',m:'𐌌',n:'𐌍',o:'Ꝋ',p:'𐌐',q:'𐌒',r:'𐌓',s:'𐌔',t:'𐌕',u:'𐌵',v:'ᕓ',w:'Ᏼ',x:'𐋄',y:'𐌙',z:'Ɀ'} },
        { name:'Fraktur',      emoji:'𝖋', sample:'𝖋𝖗𝖆𝖐𝖙𝖚𝖗',
          map:{a:'𝖆',b:'𝖇',c:'𝖈',d:'𝖉',e:'𝖊',f:'𝖋',g:'𝖌',h:'𝖍',i:'𝖎',j:'𝖏',k:'𝖐',l:'𝖑',m:'𝖒',n:'𝖓',o:'𝖔',p:'𝖕',q:'𝖖',r:'𝖗',s:'𝖘',t:'𝖙',u:'𝖚',v:'𝖛',w:'𝖜',x:'𝖝',y:'𝖞',z:'𝖟'} },
        { name:'Bubbles',      emoji:'🅑', sample:'🅑🅤🅑🅑🅛🅔🅢',
          map:{a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',k:'🅚',l:'🅛',m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩'} },
        { name:'Monospace',    emoji:'𝚖', sample:'𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎',
          map:{a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣'} },
        { name:'Full-Width',   emoji:'Ｆ', sample:'ｆｕｌｌ ｗｉｄｔｈ',
          map:{a:'ａ',b:'ｂ',c:'ｃ',d:'ｄ',e:'ｅ',f:'ｆ',g:'ｇ',h:'ｈ',i:'ｉ',j:'ｊ',k:'ｋ',l:'ｌ',m:'ｍ',n:'ｎ',o:'ｏ',p:'ｐ',q:'ｑ',r:'ｒ',s:'ｓ',t:'ｔ',u:'ｕ',v:'ｖ',w:'ｗ',x:'ｘ',y:'ｙ',z:'ｚ'} },
        { name:'Squares',      emoji:'🆂', sample:'🆂🅶🆁🅳🆂',
          map:{a:'🅰',b:'🅱',c:'🅲',d:'🅳',e:'🅴',f:'🅵',g:'🅶',h:'🅷',i:'🅸',j:'🅹',k:'🅺',l:'🅻',m:'🅼',n:'🅽',o:'🅾',p:'🅿',q:'🆀',r:'🆁',s:'🆂',t:'🆃',u:'🆄',v:'🆅',w:'🆆',x:'🆇',y:'🆈',z:'🆉'} },
        { name:'Double-Struck', emoji:'𝕕', sample:'𝕕𝕠𝕦𝕓𝕝𝕖',
          map:{a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫'} },
        { name:'Ancient',      emoji:'ꍏ', sample:'ꍏꈤꉓꀤꍟꈤ꓄',
          map:{a:'ꍏ',b:'ꌃ',c:'ꉓ',d:'ꀸ',e:'ꍟ',f:'ꎇ',g:'ꁅ',h:'ꃅ',i:'ꀤ',j:'ꀭ',k:'ꀘ',l:'꒒',m:'ꂵ',n:'ꈤ',o:'ꂦ',p:'ꉣ',q:'ꆰ',r:'ꋪ',s:'ꌗ',t:'꓄',u:'ꀎ',v:'ꃴ',w:'ꅏ',x:'ꊼ',y:'ꌩ',z:'ꁴ'} },
        { name:'Bold',         emoji:'𝐁', sample:'𝐛𝐨𝐥𝐝',
          map:{a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳'} },
        { name:'Sans-Bold',    emoji:'𝗦', sample:'𝘀𝗮𝗻𝘀 𝗯𝗼𝗹𝗱',
          map:{a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇'} },
        { name:'Script',       emoji:'𝓢', sample:'𝓼𝓬𝓻𝓲𝓹𝓽',
          map:{a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃'} },
        { name:'Emoji Flags',  emoji:'🌐', sample:'🇪'+ZWS+'🇲'+ZWS+'🇴'+ZWS+'🇯'+ZWS+'🇮',
          suffix:ZWS,
          map:{a:'🇦',b:'🇧',c:'🇨',d:'🇩',e:'🇪',f:'🇫',g:'🇬',h:'🇭',i:'🇮',j:'🇯',k:'🇰',l:'🇱',m:'🇲',n:'🇳',o:'🇴',p:'🇵',q:'🇶',r:'🇷',s:'🇸',t:'🇹',u:'🇺',v:'🇻',w:'🇼',x:'🇽',y:'🇾',z:'🇿'} },
    ];

    const DEFAULT_EMOJI_RULES = [
        {trigger:":'(",emoji:'😭'},{trigger:":'-(",emoji:'😭'},{trigger:">:(",emoji:'😡'},
        {trigger:">:)",emoji:'😈'},{trigger:"O:)",emoji:'😇'},{trigger:"o:)",emoji:'😇'},
        {trigger:":thinking:",emoji:'🤔'},{trigger:"shh",emoji:'🤫'},{trigger:"-_-",emoji:'😑'},
        {trigger:":S",emoji:'😖'},{trigger:":s",emoji:'😖'},{trigger:":X",emoji:'😵'},
        {trigger:":x",emoji:'😵'},{trigger:":O",emoji:'😱'},{trigger:":o",emoji:'😱'},
        {trigger:"XD",emoji:'😂'},{trigger:"xD",emoji:'😂'},{trigger:"LOL",emoji:'😂'},
        {trigger:"lol",emoji:'😂'},{trigger:"B)",emoji:'😎'},{trigger:"b)",emoji:'😎'},
        {trigger:";P",emoji:'😜'},{trigger:";p",emoji:'😜'},{trigger:":P",emoji:'😛'},
        {trigger:":p",emoji:'😛'},{trigger:";)",emoji:'😉'},{trigger:":D",emoji:'😃'},
        {trigger:":d",emoji:'😃'},{trigger:"^_^'",emoji:'😅'},{trigger:"^_^",emoji:'😁'},
        {trigger:":/",emoji:'😕'},{trigger:":|",emoji:'😐'},{trigger:":(",emoji:'😔'},
        {trigger:":)",emoji:'🙂'},{trigger:":*",emoji:'😘'},{trigger:"<3",emoji:'❤️'},
        {trigger:"+1",emoji:'👍'},{trigger:":thumbsup:",emoji:'👍'},{trigger:"-1",emoji:'👎'},
        {trigger:":thumbsdown:",emoji:'👎'},{trigger:"\\m/",emoji:'🤘'},{trigger:"\\o/",emoji:'🙌'},
        {trigger:"o/",emoji:'👋'},{trigger:"OK",emoji:'👌'},{trigger:"ok",emoji:'👌'},
        {trigger:"fist",emoji:'✊'},{trigger:"handshake",emoji:'🤝'},{trigger:"wave",emoji:'👋'},
        {trigger:"pray",emoji:'🙏'},{trigger:"thanks",emoji:'🙏'},{trigger:"call me",emoji:'🤙'},
        {trigger:":dog:",emoji:'🐶'},{trigger:":cat:",emoji:'🐱'},{trigger:":mouse:",emoji:'🐭'},
        {trigger:":hamster:",emoji:'🐹'},{trigger:":rabbit:",emoji:'🐰'},{trigger:":fox:",emoji:'🦊'},
        {trigger:":bear:",emoji:'🐻'},{trigger:":panda:",emoji:'🐼'},{trigger:":koala:",emoji:'🐨'},
        {trigger:":tiger:",emoji:'🐯'},{trigger:":lion:",emoji:'🦁'},{trigger:":cow:",emoji:'🐮'},
        {trigger:":pig:",emoji:'🐷'},{trigger:":frog:",emoji:'🐸'},{trigger:":monkey:",emoji:'🐵'},
        {trigger:":chicken:",emoji:'🐔'},{trigger:":penguin:",emoji:'🐧'},{trigger:":bird:",emoji:'🐦'},
        {trigger:":chick:",emoji:'🐤'},{trigger:":duck:",emoji:'🦆'},{trigger:":eagle:",emoji:'🦅'},
        {trigger:":wolf:",emoji:'🐺'},{trigger:":horse:",emoji:'🐴'},{trigger:":unicorn:",emoji:'🦄'},
        {trigger:":turtle:",emoji:'🐢'},{trigger:":snake:",emoji:'🐍'},{trigger:":dolphin:",emoji:'🐬'},
        {trigger:":whale:",emoji:'🐳'},{trigger:":shark:",emoji:'🦈'},{trigger:":octopus:",emoji:'🐙'},
        {trigger:":butterfly:",emoji:'🦋'},{trigger:":bee:",emoji:'🐝'},{trigger:":ladybug:",emoji:'🐞'},
        {trigger:":scorpion:",emoji:'🦂'},{trigger:":spider:",emoji:'🕷️'},
        {trigger:":apple:",emoji:'🍎'},{trigger:":banana:",emoji:'🍌'},{trigger:":strawberry:",emoji:'🍓'},
        {trigger:":grapes:",emoji:'🍇'},{trigger:":watermelon:",emoji:'🍉'},{trigger:":orange:",emoji:'🍊'},
        {trigger:":lemon:",emoji:'🍋'},{trigger:":avocado:",emoji:'🥑'},{trigger:":pineapple:",emoji:'🍍'},
        {trigger:":kiwi:",emoji:'🥝'},{trigger:":peach:",emoji:'🍑'},{trigger:":cherries:",emoji:'🍒'},
        {trigger:":tomato:",emoji:'🍅'},{trigger:":hot_pepper:",emoji:'🌶️'},{trigger:":carrot:",emoji:'🥕'},
        {trigger:":corn:",emoji:'🌽'},{trigger:":broccoli:",emoji:'🥦'},{trigger:":potato:",emoji:'🥔'},
        {trigger:":bread:",emoji:'🍞'},{trigger:":cheese:",emoji:'🧀'},{trigger:":hamburger:",emoji:'🍔'},
        {trigger:":fries:",emoji:'🍟'},{trigger:":pizza:",emoji:'🍕'},{trigger:":hotdog:",emoji:'🌭'},
        {trigger:":sandwich:",emoji:'🥪'},{trigger:":taco:",emoji:'🌮'},{trigger:":sushi:",emoji:'🍣'},
        {trigger:":fried_shrimp:",emoji:'🍤'},{trigger:":icecream:",emoji:'🍦'},{trigger:":doughnut:",emoji:'🍩'},
        {trigger:":cookie:",emoji:'🍪'},{trigger:":cake:",emoji:'🎂'},{trigger:":pie:",emoji:'🥧'},
        {trigger:":chocolate:",emoji:'🍫'},{trigger:":candy:",emoji:'🍬'},{trigger:":lollipop:",emoji:'🍭'},
        {trigger:":pudding:",emoji:'🍮'},{trigger:":coffee:",emoji:'☕'},{trigger:":drink:",emoji:'🥤'},
        {trigger:":beer:",emoji:'🍺'},{trigger:":wine:",emoji:'🍷'},{trigger:":champagne:",emoji:'🍾'},
        {trigger:"poop",emoji:'💩'},{trigger:"dead",emoji:'💀'},
    ];
    let emojiRules = DEFAULT_EMOJI_RULES.map(r => ({...r, enabled:true}));

    const DEFAULT_GIF_RULES = [
        { trigger:':wave:', url:'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3d3pjdnE1YXV2MGZ3bHBieWFjc29iMjRjNzQxbnVocG54Z2dyYXF3bCZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/ASd0Ukj0y3qMM/giphy.gif', enabled:true },
        { trigger:':facepalm:', url:'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif', enabled:true },
        { trigger:':clever-girl:', url:'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjBpbzI4azV4dzdkaGh0aG1hcDNubWFyNDFvZHdpdHk3dTJsZ21yNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPvND7gEInk98Eo/giphy.gif', enabled:true },
        { trigger:':mindblown:', url:'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', enabled:true },
    ];
    let gifRules = DEFAULT_GIF_RULES.map(r => ({...r}));

    let emojiEnabled  = true;
    let emojiDelay    = 1000;
    let gifEnabled    = true;
    let gifDelay      = 1000;
    let fontDelay     = 0;

    let fontMode      = 0;
    let activeField   = null;
    let menuOpen      = false;
    let focusTimer    = null;
    let autoHideTimer = null;

    const emojiTimers = new Map();
    const gifTimers   = new Map();

    const toChars = str => [...str];
    function translateChar(ch, font) {
        const m = font.map[ch.toLowerCase()] ?? ch;
        return font.suffix ? m + font.suffix : m;
    }
    function byteOffsetToCP(chars, offset) {
        let cp=0,b=0;
        while(b<offset&&cp<chars.length){b+=chars[cp].length;cp++;}
        return cp;
    }

    function buildRegex(rules) {
        const on = rules.filter(r=>r.enabled);
        if (!on.length) return null;
        const sorted = [...on].sort((a,b)=>b.trigger.length-a.trigger.length);
        const parts = sorted.map(r=>r.trigger.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
        return new RegExp('('+parts.join('|')+')$');
    }

    const themedEls = new Map();
    function reg(key, el, fn) { themedEls.set(key, {el,fn}); return el; }

    function applyTheme() {
        updateTooltipStyle();
        themedEls.forEach(({el,fn}) => fn(el,theme));
        renderFontList();
        renderEmojiList();
        renderGifList();
        switchTab(activeTab);
        updateBtnAppearance();
        trackedInputs.forEach(el=>styleInput(el));
    }

    const trackedInputs = [];
    function styleInput(el) {
        Object.assign(el.style, {
            background:theme.inputBg, border:'1px solid '+theme.inputBorder,
            borderRadius:'5px', color:theme.text,
            fontSize:'12px', padding:'4px 6px',
            fontFamily:'system-ui,sans-serif', outline:'none', boxSizing:'border-box',
        });
    }
    function trackInput(el) { trackedInputs.push(el); styleInput(el); return el; }

    // Backdrop — covers full screen, closes menu on click anywhere outside
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {position:'fixed',inset:'0',zIndex:'2147483644',display:'none'});
    backdrop.addEventListener('mousedown', (e) => {
        // Only close if the click is not inside the menu itself
        if (!menu.contains(e.target)) closeMenu();
    });
    document.documentElement.appendChild(backdrop);

    // Floating trigger button
    const btn = document.createElement('button');
    btn.type = 'button';
    tip(btn,'Input Utility Module — click to open');
    Object.assign(btn.style, {
        position:'fixed', zIndex:'2147483647', width:'28px', height:'28px',
        borderRadius:'50%', fontSize:'13px', cursor:'pointer',
        display:'none', alignItems:'center', justifyContent:'center',
        padding:'0', boxShadow:'0 2px 12px rgba(0,0,0,0.55)',
        opacity:'0', transition:'opacity 0.35s ease',
        userSelect:'none', lineHeight:'1', pointerEvents:'auto', border:'1px solid',
    });
    document.documentElement.appendChild(btn);

    const hoverZone = document.createElement('div');
    Object.assign(hoverZone.style, {
        position:'fixed', zIndex:'2147483646', width:'48px', height:'48px',
        display:'none', cursor:'default', pointerEvents:'auto',
    });
    document.documentElement.appendChild(hoverZone);

    // Menu panel — centered in viewport
    const menu = document.createElement('div');
    Object.assign(menu.style, {
        position:'fixed', zIndex:'2147483646',
        borderRadius:'12px', padding:'0',
        display:'none', flexDirection:'column',
        width:'70vw', maxWidth:'700px', minWidth:'320px',
        height:'65vh', maxHeight:'65vh',
        top:'50%', left:'50%',
        transform:'translate(-50%, -50%)',
        boxShadow:'0 12px 48px rgba(0,0,0,0.7)',
        boxSizing:'border-box', overflow:'hidden',
    });
    reg('menu', menu, (el,t) => { el.style.background=t.bg; el.style.border='1px solid '+t.border; });
    document.documentElement.appendChild(menu);

    // Tab bar
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
        display:'flex', padding:'0 4px', flexShrink:'0', gap:'1px', userSelect:'none',
    });
    reg('tabBar', tabBar, (el,t)=>{ el.style.borderBottom='1px solid '+t.border; });
    menu.appendChild(tabBar);

    const TAB_NAMES = ['🔤 Fonts','😀 Emoji','🎞 GIFs','⚙️ Settings','⬇ Export','⬆ Import'];
    const tabBtns = [];
    let activeTab = 0;

    TAB_NAMES.forEach((name, i) => {
        const tb = document.createElement('button');
        tb.type='button'; tb.textContent=name;
        Object.assign(tb.style, {
            flex: i < 4 ? '1' : '0 0 auto',
            background:'transparent', border:'none',
            borderBottom:'2px solid transparent', padding:'8px 6px 6px',
            fontSize:'10px', fontFamily:'system-ui,sans-serif',
            letterSpacing:'0.3px', cursor:'pointer',
            transition:'color 0.15s, border-color 0.15s', whiteSpace:'nowrap',
        });
        tb.addEventListener('mousedown', e=>{ e.preventDefault(); handleTabClick(i); });
        tabBar.appendChild(tb); tabBtns.push(tb);
        reg('tabBtn'+i, tb, (el,t)=>{ el.style.color=t.textDim; });
    });

    function handleTabClick(i) {
        if (i === 4) { doExport(); return; }
        if (i === 5) { doImport(); return; }
        switchTab(i);
    }

    function switchTab(i) {
        activeTab = i;
        tabBtns.forEach((tb,idx)=>{
            const on=idx===i;
            tb.style.color = on ? theme.text : theme.textDim;
            tb.style.borderBottomColor = on ? theme.accent : 'transparent';
        });
        tabPanels.forEach((p,idx)=>{ p.style.display=idx===i?'block':'none'; });
    }

    const panelWrap = document.createElement('div');
    Object.assign(panelWrap.style, {overflowY:'auto', flex:'1', minHeight:'0'});
    menu.appendChild(panelWrap);

    // Only 4 real panels (Fonts, Emoji, GIFs, Settings)
    const tabPanels = [0,1,2,3].map(()=>{
        const p=document.createElement('div'); p.style.display='none';
        panelWrap.appendChild(p); return p;
    });

    // ═════════════════════════════════════════════════════════════════════════════
    // TAB 0 — FONTS
    // ═════════════════════════════════════════════════════════════════════════════
    const fontPanel = tabPanels[0];
    Object.assign(fontPanel.style,{padding:'6px'});

    const addFontBtn = document.createElement('button');
    addFontBtn.type='button'; addFontBtn.textContent='+ Add font';
    Object.assign(addFontBtn.style,{
        width:'100%', borderRadius:'7px', fontSize:'11px',
        fontFamily:'system-ui,sans-serif', padding:'6px', cursor:'pointer',
        marginBottom:'4px', border:'1px solid',
    });
    reg('addFontBtn',addFontBtn,(el,t)=>{ el.style.background=t.inputBg; el.style.borderColor=t.accent; el.style.color=t.accent; });
    addFontBtn.addEventListener('mousedown',e=>{ e.preventDefault(); openFontEditor(null); });
    fontPanel.appendChild(addFontBtn);

    const fontListDiv = document.createElement('div');
    fontPanel.appendChild(fontListDiv);

    const fontEditorDiv = document.createElement('div');
    Object.assign(fontEditorDiv.style,{display:'none',flexDirection:'column',gap:'6px',padding:'10px',borderRadius:'8px',margin:'4px 0'});
    reg('fontEditorDiv',fontEditorDiv,(el,t)=>{ el.style.background=t.bg2; el.style.border='1px solid '+t.border; });
    fontPanel.appendChild(fontEditorDiv);

    let editingFontIdx = null;

    function openFontEditor(idx) {
        editingFontIdx=idx;
        const f=idx!==null?fonts[idx]:null;
        fontEditorDiv.innerHTML='';
        fontEditorDiv.style.display='flex';
        fontListDiv.style.display='none';
        addFontBtn.style.display='none';

        const title=document.createElement('div');
        title.textContent=idx!==null?'Edit font':'Add font';
        Object.assign(title.style,{fontSize:'12px',fontFamily:'system-ui,sans-serif',fontWeight:'600',marginBottom:'2px',color:theme.text});
        fontEditorDiv.appendChild(title);

        function mkField(lbl,val,ph) {
            const wrap=document.createElement('div');
            const l=document.createElement('div');
            l.textContent=lbl; Object.assign(l.style,{fontSize:'10px',fontFamily:'system-ui,sans-serif',marginBottom:'2px',color:theme.textDim});
            const inp=document.createElement('input'); inp.type='text'; inp.value=val||''; inp.placeholder=ph||''; inp.style.width='100%';
            styleInput(inp); wrap.appendChild(l); wrap.appendChild(inp); fontEditorDiv.appendChild(wrap); return inp;
        }
        const nameInp  =mkField('Name',            f?.name  ||'','e.g. Bold');
        const eiInp    =mkField('Icon/emoji',       f?.emoji ||'','e.g. 𝐁');
        const sampInp  =mkField('Sample text',      f?.sample||'','e.g. 𝐛𝐨𝐥𝐝');
        const mapInp   =mkField('Map (JSON a–z)',   f?JSON.stringify(f.map):'','{"a":"á",...}');
        mapInp.style.fontFamily='monospace';
        const sufInp   =mkField('Per-char suffix',  f?.suffix||'','');

        const btnRow=document.createElement('div'); Object.assign(btnRow.style,{display:'flex',gap:'6px',marginTop:'4px'});
        function mkAB(label,save) {
            const b=document.createElement('button'); b.type='button'; b.textContent=label;
            Object.assign(b.style,{flex:'1',borderRadius:'6px',fontSize:'11px',fontFamily:'system-ui,sans-serif',padding:'6px',cursor:'pointer',border:'1px solid'});
            b.style.background=save?theme.btnActive:theme.bg2; b.style.borderColor=save?theme.accent:theme.border; b.style.color=theme.text;
            btnRow.appendChild(b); return b;
        }
        const saveB=mkAB('Save',true), cancelB=mkAB('Cancel',false);
        fontEditorDiv.appendChild(btnRow);
        cancelB.addEventListener('mousedown',e=>{ e.preventDefault(); closeFontEditor(); });
        saveB.addEventListener('mousedown',e=>{
            e.preventDefault();
            let map={}; try{map=JSON.parse(mapInp.value);}catch(_){}
            const entry={name:nameInp.value.trim()||'Untitled',emoji:eiInp.value.trim()||'?',sample:sampInp.value.trim()||nameInp.value.trim(),map};
            if(sufInp.value) entry.suffix=sufInp.value;
            if(editingFontIdx!==null) fonts[editingFontIdx]=entry; else fonts.push(entry);
            if(fontMode>fonts.length) fontMode=0;
            closeFontEditor(); updateBtnAppearance();
        });
    }
    function closeFontEditor() {
        fontEditorDiv.style.display='none'; fontListDiv.style.display='block'; addFontBtn.style.display='block'; renderFontList();
    }

    function renderFontList() {
        fontListDiv.innerHTML='';
        const offRow=document.createElement('button'); offRow.type='button';
        Object.assign(offRow.style,{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:fontMode===0?theme.accent+'44':'transparent',border:'none',borderRadius:'7px',padding:'6px 10px',cursor:'pointer',boxSizing:'border-box',transition:'background 0.1s'});
        const offS=document.createElement('span'); offS.textContent='— Off —';
        Object.assign(offS.style,{fontFamily:'system-ui,sans-serif',fontStyle:'italic',fontSize:'13px',flex:'1',textAlign:'left',color:theme.textDim});
        offRow.appendChild(offS);
        offRow.addEventListener('mousedown',e=>{e.preventDefault();selectFont(0);});
        offRow.addEventListener('mouseenter',()=>{ offRow.style.background=theme.accentHover; });
        offRow.addEventListener('mouseleave',()=>{ offRow.style.background=fontMode===0?theme.accent+'44':'transparent'; });
        fontListDiv.appendChild(offRow);

        fonts.forEach((f,i)=>{
            const row=document.createElement('div');
            Object.assign(row.style,{display:'flex',alignItems:'center',gap:'8px',width:'100%',background:fontMode===(i+1)?theme.accent+'44':'transparent',borderRadius:'7px',padding:'4px 6px 4px 10px',boxSizing:'border-box',transition:'background 0.1s'});
            row.addEventListener('mouseenter',()=>{ row.style.background=theme.accentHover; });
            row.addEventListener('mouseleave',()=>{ row.style.background=fontMode===(i+1)?theme.accent+'44':'transparent'; });

            const ns=document.createElement('span'); Object.assign(ns.style,{fontFamily:'system-ui,sans-serif',fontSize:'10px',minWidth:'80px',flexShrink:'0',color:theme.textDim}); ns.textContent=f.name;
            const ss=document.createElement('span'); Object.assign(ss.style,{fontSize:'14px',letterSpacing:'1px',flex:'1',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',color:theme.text}); ss.textContent=f.sample;

            const editB=document.createElement('button'); editB.type='button'; editB.textContent='✎';
            Object.assign(editB.style,{background:'transparent',border:'none',cursor:'pointer',fontSize:'14px',padding:'2px 4px',flexShrink:'0',color:theme.accent});
            tip(editB,'Edit font');
            editB.addEventListener('mousedown',e=>{ e.preventDefault(); e.stopPropagation(); openFontEditor(i); });

            const delB=document.createElement('button'); delB.type='button'; delB.textContent='✕';
            Object.assign(delB.style,{background:'transparent',border:'none',cursor:'pointer',fontSize:'13px',padding:'2px 4px',flexShrink:'0',color:theme.danger});
            tip(delB,'Delete font');
            delB.addEventListener('mousedown',e=>{
                e.preventDefault(); e.stopPropagation();
                fonts.splice(i,1);
                if(fontMode===i+1){fontMode=0;updateBtnAppearance();}else if(fontMode>i+1)fontMode--;
                renderFontList();
            });

            const pickB=document.createElement('button'); pickB.type='button'; pickB.textContent=fontMode===(i+1)?'✓':'▶';
            Object.assign(pickB.style,{background:'transparent',border:'none',cursor:'pointer',fontSize:'13px',padding:'2px 6px',flexShrink:'0',color:fontMode===(i+1)?theme.accent:theme.textDim});
            tip(pickB,'Use this font');
            pickB.addEventListener('mousedown',e=>{ e.preventDefault(); e.stopPropagation(); selectFont(i+1); renderFontList(); });

            row.appendChild(pickB); row.appendChild(ns); row.appendChild(ss); row.appendChild(editB); row.appendChild(delB);
            fontListDiv.appendChild(row);
        });
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TAB 1 — EMOJI
    // ═════════════════════════════════════════════════════════════════════════════
    const emojiPanel = tabPanels[1];
    Object.assign(emojiPanel.style,{padding:'8px 6px'});

    const emojiSearch=document.createElement('input'); emojiSearch.type='text'; emojiSearch.placeholder='Search…';
    Object.assign(emojiSearch.style,{width:'100%',boxSizing:'border-box',marginBottom:'6px'}); trackInput(emojiSearch);
    emojiSearch.addEventListener('input',renderEmojiList); emojiPanel.appendChild(emojiSearch);

    const addERow=document.createElement('div'); Object.assign(addERow.style,{display:'flex',gap:'4px',marginBottom:'8px',alignItems:'center'});
    const newEEmoji=document.createElement('input'); newEEmoji.type='text'; newEEmoji.placeholder='😀'; Object.assign(newEEmoji.style,{width:'46px',textAlign:'center',fontSize:'18px'}); trackInput(newEEmoji);
    const newETrig=document.createElement('input'); newETrig.type='text'; newETrig.placeholder='trigger text'; newETrig.style.flex='1'; trackInput(newETrig);
    const addEB=document.createElement('button'); addEB.type='button'; addEB.textContent='+';
    Object.assign(addEB.style,{borderRadius:'5px',fontSize:'16px',padding:'3px 10px',cursor:'pointer',flexShrink:'0',border:'1px solid'});
    reg('addEB',addEB,(el,t)=>{ el.style.background=t.inputBg; el.style.borderColor=t.accent; el.style.color=t.accent; });
    tip(addEB,'Add emoji rule');
    addEB.addEventListener('mousedown',e=>{
        e.preventDefault();
        const em=newEEmoji.value.trim(), tr=newETrig.value.trim();
        if(!em||!tr||emojiRules.some(r=>r.trigger===tr)) return;
        emojiRules.push({trigger:tr,emoji:em,enabled:true});
        newEEmoji.value=''; newETrig.value=''; renderEmojiList();
    });
    addERow.appendChild(newEEmoji); addERow.appendChild(newETrig); addERow.appendChild(addEB);
    emojiPanel.appendChild(addERow);

    const emojiGrid=document.createElement('div');
    Object.assign(emojiGrid.style,{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'3px'});
    emojiPanel.appendChild(emojiGrid);

    function renderEmojiList() {
        emojiGrid.innerHTML='';
        const q=emojiSearch.value.toLowerCase();
        emojiRules.forEach((rule,idx)=>{
            if(q&&!rule.trigger.toLowerCase().includes(q)&&!rule.emoji.includes(q)) return;
            const cell=document.createElement('div');
            Object.assign(cell.style,{borderRadius:'6px',padding:'4px 5px',display:'flex',flexDirection:'column',gap:'2px',background:theme.bg2,border:'1px solid '+theme.border});

            const topR=document.createElement('div'); Object.assign(topR.style,{display:'flex',alignItems:'center',gap:'3px'});
            const tog=document.createElement('input'); tog.type='checkbox'; tog.checked=rule.enabled; tog.style.cursor='pointer'; tog.style.flexShrink='0'; tog.style.accentColor=theme.accent;
            tog.addEventListener('change',e=>{ e.stopPropagation(); emojiRules[idx].enabled=tog.checked; });

            const eEdit=document.createElement('input'); eEdit.type='text'; eEdit.value=rule.emoji;
            Object.assign(eEdit.style,{width:'32px',textAlign:'center',fontSize:'17px',padding:'1px 2px',background:'transparent',border:'none',outline:'none',cursor:'text',flexShrink:'0',color:theme.text});
            eEdit.addEventListener('change',()=>{ emojiRules[idx].emoji=eEdit.value.trim()||rule.emoji; });
            eEdit.addEventListener('mousedown',e=>e.stopPropagation());

            const delB=document.createElement('button'); delB.type='button'; delB.textContent='✕';
            Object.assign(delB.style,{background:'transparent',border:'none',cursor:'pointer',fontSize:'11px',padding:'0 2px',marginLeft:'auto',flexShrink:'0',color:theme.danger});
            tip(delB,'Delete rule');
            delB.addEventListener('mousedown',e=>{ e.preventDefault(); e.stopPropagation(); emojiRules.splice(idx,1); renderEmojiList(); });

            topR.appendChild(tog); topR.appendChild(eEdit); topR.appendChild(delB);

            const tEdit=document.createElement('input'); tEdit.type='text'; tEdit.value=rule.trigger;
            Object.assign(tEdit.style,{width:'100%',boxSizing:'border-box',fontSize:'10px',fontFamily:'monospace',padding:'2px 4px',borderRadius:'3px',outline:'none',background:theme.inputBg,border:'1px solid '+theme.inputBorder,color:theme.text});
            tEdit.addEventListener('change',()=>{ const t=tEdit.value.trim(); if(t) emojiRules[idx].trigger=t; });
            tEdit.addEventListener('mousedown',e=>e.stopPropagation());

            cell.appendChild(topR); cell.appendChild(tEdit);
            emojiGrid.appendChild(cell);
        });
        trackedInputs.forEach(el=>styleInput(el));
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TAB 2 — GIFs
    // ═════════════════════════════════════════════════════════════════════════════
    const gifPanel = tabPanels[2];
    Object.assign(gifPanel.style,{padding:'8px 6px'});

    const gifSearch=document.createElement('input'); gifSearch.type='text'; gifSearch.placeholder='Search GIFs…';
    Object.assign(gifSearch.style,{width:'100%',boxSizing:'border-box',marginBottom:'6px'}); trackInput(gifSearch);
    gifSearch.addEventListener('input',renderGifList); gifPanel.appendChild(gifSearch);

    const addGRow=document.createElement('div'); Object.assign(addGRow.style,{display:'flex',gap:'4px',marginBottom:'8px',alignItems:'center',flexWrap:'wrap'});
    const newGTrig=document.createElement('input'); newGTrig.type='text'; newGTrig.placeholder=':trigger:'; newGTrig.style.flex='1'; newGTrig.style.minWidth='80px'; trackInput(newGTrig);
    const newGUrl=document.createElement('input'); newGUrl.type='text'; newGUrl.placeholder='GIF URL (https://...)'; newGUrl.style.flex='2'; newGUrl.style.minWidth='120px'; trackInput(newGUrl);
    const addGB=document.createElement('button'); addGB.type='button'; addGB.textContent='+';
    Object.assign(addGB.style,{borderRadius:'5px',fontSize:'16px',padding:'3px 10px',cursor:'pointer',flexShrink:'0',border:'1px solid'});
    reg('addGB',addGB,(el,t)=>{ el.style.background=t.inputBg; el.style.borderColor=t.accent; el.style.color=t.accent; });
    tip(addGB,'Add GIF rule');
    addGB.addEventListener('mousedown',e=>{
        e.preventDefault();
        const tr=newGTrig.value.trim(), url=newGUrl.value.trim();
        if(!tr||!url||gifRules.some(r=>r.trigger===tr)) return;
        gifRules.push({trigger:tr,url,enabled:true});
        newGTrig.value=''; newGUrl.value=''; renderGifList();
    });
    addGRow.appendChild(newGTrig); addGRow.appendChild(newGUrl); addGRow.appendChild(addGB);
    gifPanel.appendChild(addGRow);

    const gifList=document.createElement('div');
    Object.assign(gifList.style,{display:'flex',flexDirection:'column',gap:'5px'});
    gifPanel.appendChild(gifList);

    function renderGifList() {
        gifList.innerHTML='';
        const q=gifSearch.value.toLowerCase();
        gifRules.forEach((rule,idx)=>{
            if(q&&!rule.trigger.toLowerCase().includes(q)&&!rule.url.toLowerCase().includes(q)) return;

            const card=document.createElement('div');
            Object.assign(card.style,{
                display:'flex',alignItems:'flex-start',gap:'8px',
                borderRadius:'8px',padding:'7px 8px',
                background:theme.bg2,border:'1px solid '+theme.border,
            });

            const imgWrap=document.createElement('div');
            Object.assign(imgWrap.style,{width:'64px',height:'48px',flexShrink:'0',borderRadius:'5px',overflow:'hidden',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'});
            const img=document.createElement('img');
            img.src=rule.url; img.alt='gif';
            Object.assign(img.style,{width:'100%',height:'100%',objectFit:'cover',borderRadius:'5px',display:'block'});
            img.onerror=()=>{ imgWrap.innerHTML='<span style="font-size:20px;opacity:0.4">🎞</span>'; };
            imgWrap.appendChild(img); card.appendChild(imgWrap);

            const right=document.createElement('div');
            Object.assign(right.style,{display:'flex',flexDirection:'column',gap:'4px',flex:'1',minWidth:'0'});

            const topR=document.createElement('div'); Object.assign(topR.style,{display:'flex',alignItems:'center',gap:'5px'});
            const tog=document.createElement('input'); tog.type='checkbox'; tog.checked=rule.enabled; tog.style.cursor='pointer'; tog.style.flexShrink='0'; tog.style.accentColor=theme.accent;
            tog.addEventListener('change',e=>{ e.stopPropagation(); gifRules[idx].enabled=tog.checked; });

            const trigE=document.createElement('input'); trigE.type='text'; trigE.value=rule.trigger;
            Object.assign(trigE.style,{flex:'1',minWidth:'0',fontFamily:'monospace',fontSize:'11px',padding:'3px 5px',borderRadius:'4px',outline:'none',background:theme.inputBg,border:'1px solid '+theme.inputBorder,color:theme.text,boxSizing:'border-box'});
            trigE.addEventListener('change',()=>{ const t=trigE.value.trim(); if(t) gifRules[idx].trigger=t; });
            trigE.addEventListener('mousedown',e=>e.stopPropagation());

            const delB=document.createElement('button'); delB.type='button'; delB.textContent='✕';
            Object.assign(delB.style,{background:'transparent',border:'none',cursor:'pointer',fontSize:'13px',padding:'2px 4px',flexShrink:'0',color:theme.danger});
            tip(delB,'Delete GIF rule');
            delB.addEventListener('mousedown',e=>{ e.preventDefault(); e.stopPropagation(); gifRules.splice(idx,1); renderGifList(); });

            topR.appendChild(tog); topR.appendChild(trigE); topR.appendChild(delB);

            const urlE=document.createElement('input'); urlE.type='text'; urlE.value=rule.url;
            Object.assign(urlE.style,{width:'100%',fontSize:'10px',fontFamily:'monospace',padding:'3px 5px',borderRadius:'4px',outline:'none',background:theme.inputBg,border:'1px solid '+theme.inputBorder,color:theme.textDim,boxSizing:'border-box'});
            urlE.addEventListener('change',()=>{
                const u=urlE.value.trim();
                if(u){ gifRules[idx].url=u; img.src=u; }
            });
            urlE.addEventListener('mousedown',e=>e.stopPropagation());

            right.appendChild(topR); right.appendChild(urlE);
            card.appendChild(right);
            gifList.appendChild(card);
        });
        trackedInputs.forEach(el=>styleInput(el));
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TAB 3 — SETTINGS
    // ═════════════════════════════════════════════════════════════════════════════
    const settingsPanel = tabPanels[3];
    Object.assign(settingsPanel.style,{padding:'12px 14px'});

    function sLabel(text) {
        const l=document.createElement('div'); l.textContent=text;
        Object.assign(l.style,{fontSize:'10px',fontFamily:'system-ui,sans-serif',letterSpacing:'0.6px',textTransform:'uppercase',marginBottom:'4px',marginTop:'12px',color:theme.textLabel});
        reg('lbl_'+text, l, (el,t)=>{ el.style.color=t.textLabel; });
        return l;
    }
    function sRow(labelTxt, ctrl, extra) {
        const row=document.createElement('div'); Object.assign(row.style,{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'});
        const lbl=document.createElement('span'); lbl.textContent=labelTxt;
        Object.assign(lbl.style,{fontFamily:'system-ui,sans-serif',fontSize:'12px',flex:'1',color:theme.text});
        reg('sRowLbl_'+labelTxt, lbl, (el,t)=>{ el.style.color=t.text; });
        row.appendChild(lbl); row.appendChild(ctrl); if(extra) row.appendChild(extra);
        return row;
    }
    function mkSlider(defVal, min, max, step, onChange) {
        const wrap=document.createElement('div'); Object.assign(wrap.style,{display:'flex',alignItems:'center',gap:'6px'});
        const sl=document.createElement('input'); sl.type='range'; sl.min=min; sl.max=max; sl.step=step; sl.value=defVal;
        Object.assign(sl.style,{width:'80px',cursor:'pointer'});
        const lbl=document.createElement('span'); Object.assign(lbl.style,{fontFamily:'monospace',fontSize:'11px',minWidth:'34px',textAlign:'right'});
        reg('slider_lbl_'+defVal+'_'+Math.random(), lbl, (el,t)=>{ el.style.color=t.accent; });
        function update(){ lbl.textContent=parseFloat(sl.value).toFixed(1)+'s'; onChange(parseFloat(sl.value)*1000); }
        sl.addEventListener('input',update); update();
        wrap.appendChild(sl); wrap.appendChild(lbl);
        return {wrap, sl, lbl};
    }

    // ── Emoji ──
    settingsPanel.appendChild(sLabel('Emoji Triggers'));
    const emojiToggle=document.createElement('input'); emojiToggle.type='checkbox'; emojiToggle.checked=emojiEnabled; emojiToggle.style.cursor='pointer';
    emojiToggle.addEventListener('change',()=>{ emojiEnabled=emojiToggle.checked; });
    settingsPanel.appendChild(sRow('Enable emoji replacement', emojiToggle));
    const {wrap:eDelayWrap, sl:eDelaySl}=mkSlider(emojiDelay/1000, 0, 10, 0.5, v=>{ emojiDelay=v; });
    settingsPanel.appendChild(sRow('Emoji trigger delay', eDelayWrap));

    // ── GIFs ──
    settingsPanel.appendChild(sLabel('GIF Triggers'));
    const gifToggle=document.createElement('input'); gifToggle.type='checkbox'; gifToggle.checked=gifEnabled; gifToggle.style.cursor='pointer';
    gifToggle.addEventListener('change',()=>{ gifEnabled=gifToggle.checked; });
    settingsPanel.appendChild(sRow('Enable GIF replacement', gifToggle));
    const {wrap:gDelayWrap, sl:gDelaySl}=mkSlider(gifDelay/1000, 0, 10, 0.5, v=>{ gifDelay=v; });
    settingsPanel.appendChild(sRow('GIF trigger delay', gDelayWrap));

    // ── Fonts ──
    settingsPanel.appendChild(sLabel('Font Triggers'));
    const fontSelect=document.createElement('select');
    Object.assign(fontSelect.style,{borderRadius:'6px',fontSize:'12px',padding:'4px 6px',fontFamily:'system-ui,sans-serif',cursor:'pointer',outline:'none',border:'1px solid'});
    reg('fontSelect', fontSelect, (el,t)=>{ el.style.background=t.inputBg; el.style.borderColor=t.inputBorder; el.style.color=t.text; });
    fontSelect.addEventListener('mousedown',e=>e.stopPropagation());
    fontSelect.addEventListener('change',()=>{ selectFont(parseInt(fontSelect.value)); });
    settingsPanel.appendChild(sRow('Active font', fontSelect));

    const {wrap:fDelayWrap, sl:fDelaySl}=mkSlider(fontDelay/1000, 0, 5, 0.5, v=>{ fontDelay=v; });
    settingsPanel.appendChild(sRow('Font apply delay (0=instant)', fDelayWrap));

    function refreshFontSelect() {
        fontSelect.innerHTML='';
        const off=document.createElement('option'); off.value='0'; off.textContent='— Off —'; fontSelect.appendChild(off);
        fonts.forEach((f,i)=>{ const o=document.createElement('option'); o.value=String(i+1); o.textContent=f.emoji+' '+f.name; fontSelect.appendChild(o); });
        fontSelect.value=String(fontMode);
    }

    // ── Theme presets ──
    settingsPanel.appendChild(sLabel('Theme Presets'));
    const presetRow=document.createElement('div'); Object.assign(presetRow.style,{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'8px'});
    Object.entries(PRESETS).forEach(([name,p])=>{
        const pb=document.createElement('button'); pb.type='button'; pb.textContent=name;
        const isLight = name === '☀️';
        const btnAccent = isLight ? '#888' : p.accent;
        Object.assign(pb.style,{
            background: isLight ? '#e0e0e0' : p.accent+'18',
            border:'1px solid '+(isLight ? '#bbb' : p.accent+'88'),
            borderRadius:'6px', color: isLight ? '#444' : p.accent,
            fontSize:'16px', fontFamily:'system-ui,sans-serif',
            padding:'4px 8px', cursor:'pointer', lineHeight:'1',
        });
        pb.addEventListener('mousedown',e=>e.preventDefault());
        pb.addEventListener('click',()=>{ theme={...p}; syncSwatches(); applyTheme(); });
        presetRow.appendChild(pb);
    });
    settingsPanel.appendChild(presetRow);

    // ── Custom colour pickers — compact grid ──
    settingsPanel.appendChild(sLabel('Custom Colors'));
    const colorGrid=document.createElement('div');
    Object.assign(colorGrid.style,{
        display:'grid', gridTemplateColumns:'1fr 1fr',
        gap:'4px 10px', marginBottom:'8px',
    });
    const swatches={};
    const COLOR_ROWS=[
        ['bg','Panel bg'],['bg2','Card bg'],
        ['accent','Accent'],['btnActive','Btn active'],
        ['text','Primary text'],['textDim','Secondary text'],
        ['tooltipBg','Tooltip bg'],['tooltipText','Tooltip text'],
        ['danger','Danger'],['success','Success'],
    ];
    COLOR_ROWS.forEach(([key,label])=>{
        const cell=document.createElement('div');
        Object.assign(cell.style,{display:'flex',alignItems:'center',gap:'5px'});
        const sw=document.createElement('input'); sw.type='color'; sw.value=(theme[key]||'#ffffff').slice(0,7);
        Object.assign(sw.style,{width:'28px',height:'22px',padding:'0',border:'none',borderRadius:'3px',cursor:'pointer',background:'none',flexShrink:'0'});
        sw.addEventListener('input',()=>{ theme[key]=sw.value; applyTheme(); });
        sw.addEventListener('mousedown',e=>e.stopPropagation());
        const lbl=document.createElement('span'); lbl.textContent=label;
        Object.assign(lbl.style,{fontFamily:'system-ui,sans-serif',fontSize:'11px',color:theme.textDim,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
        reg('colorLbl_'+key, lbl, (el,t)=>{ el.style.color=t.textDim; });
        swatches[key]=sw; cell.appendChild(sw); cell.appendChild(lbl); colorGrid.appendChild(cell);
    });
    settingsPanel.appendChild(colorGrid);
    function syncSwatches() { COLOR_ROWS.forEach(([key])=>{ if(swatches[key]&&theme[key]) swatches[key].value=theme[key].slice(0,7); }); }

    // ── Reset ──
    settingsPanel.appendChild(sLabel('Reset'));
    function mkWideBtn(label) {
        const b=document.createElement('button'); b.type='button'; b.textContent=label;
        Object.assign(b.style,{width:'100%',borderRadius:'6px',fontSize:'12px',fontFamily:'system-ui,sans-serif',padding:'7px',cursor:'pointer',marginBottom:'5px',border:'1px solid'});
        b.addEventListener('mousedown',e=>e.preventDefault()); return b;
    }
    const resetBtn=mkWideBtn('Reset all to defaults');
    reg('resetBtn',resetBtn,(el,t)=>{ el.style.background=t.danger+'18'; el.style.borderColor=t.danger+'55'; el.style.color=t.danger; });
    resetBtn.addEventListener('click',()=>{
        emojiRules=DEFAULT_EMOJI_RULES.map(r=>({...r,enabled:true}));
        gifRules=DEFAULT_GIF_RULES.map(r=>({...r}));
        emojiEnabled=true; gifEnabled=true; emojiDelay=1000; gifDelay=1000; fontDelay=0; fontMode=0;
        theme={...PRESETS[DEFAULT_PRESET_NAME]};
        emojiToggle.checked=true; gifToggle.checked=true;
        eDelaySl.value='1'; eDelaySl.dispatchEvent(new Event('input'));
        gDelaySl.value='1'; gDelaySl.dispatchEvent(new Event('input'));
        fDelaySl.value='0'; fDelaySl.dispatchEvent(new Event('input'));
        syncSwatches(); applyTheme(); refreshFontSelect(); renderFontList(); renderEmojiList(); renderGifList();
    });
    settingsPanel.appendChild(resetBtn);

    // ── Buy Me a Coffee ──
    const coffeeDiv = document.createElement('div');
    Object.assign(coffeeDiv.style, {
        marginTop: '14px', marginBottom: '10px',
        display: 'flex', justifyContent: 'center',
    });
    const coffeeLink = document.createElement('a');
    coffeeLink.href = 'https://www.paypal.com/paypalme/jordanalbiar';
    coffeeLink.target = '_blank';
    coffeeLink.rel = 'noopener noreferrer';
    coffeeLink.textContent = '☕ Buy Me a Coffee?';
    Object.assign(coffeeLink.style, {
        display: 'inline-block',
        fontFamily: 'system-ui,sans-serif',
        fontSize: '12px',
        padding: '7px 18px',
        borderRadius: '20px',
        textDecoration: 'none',
        cursor: 'pointer',
        border: '1px solid',
        transition: 'opacity 0.2s',
    });
    coffeeLink.addEventListener('mouseenter', () => { coffeeLink.style.opacity = '0.8'; });
    coffeeLink.addEventListener('mouseleave', () => { coffeeLink.style.opacity = '1'; });
    coffeeLink.addEventListener('mousedown', e => e.stopPropagation());
    reg('coffeeLink', coffeeLink, (el, t) => {
        el.style.background = t.accent + '18';
        el.style.borderColor = t.accent + '88';
        el.style.color = t.accent;
    });
    coffeeDiv.appendChild(coffeeLink);
    settingsPanel.appendChild(coffeeDiv);

    const bpad=document.createElement('div'); bpad.style.height='10px'; settingsPanel.appendChild(bpad);

    // ═════════════════════════════════════════════════════════════════════════════
    // IMPORT / EXPORT FUNCTIONS (called from tab clicks)
    // ═════════════════════════════════════════════════════════════════════════════
    function doExport() {
        const data={version:10,theme,emojiEnabled,emojiDelay,gifEnabled,gifDelay,fontDelay,fontMode,
            fonts:fonts.map(f=>({name:f.name,emoji:f.emoji,sample:f.sample,map:f.map,...(f.suffix?{suffix:f.suffix}:{})})),
            emojiRules:emojiRules.map(r=>({trigger:r.trigger,emoji:r.emoji,enabled:r.enabled})),
            gifRules:gifRules.map(r=>({trigger:r.trigger,url:r.url,enabled:r.enabled})),
        };
        const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download='input-utility-module.json'; a.click();
        URL.revokeObjectURL(url);
    }

    const importFile=document.createElement('input'); importFile.type='file'; importFile.accept='.json,application/json'; importFile.style.display='none';
    importFile.addEventListener('change',()=>{
        const f=importFile.files[0]; if(!f) return;
        const reader=new FileReader();
        reader.onload=ev=>{
            try {
                const d=JSON.parse(ev.target.result);
                if(d.fonts) fonts=d.fonts;
                if(d.emojiRules) emojiRules=d.emojiRules.map(r=>({...r,enabled:r.enabled!==false}));
                if(d.gifRules)   gifRules=d.gifRules.map(r=>({...r,enabled:r.enabled!==false}));
                if(d.theme) { Object.assign(theme,d.theme); syncSwatches(); }
                if(typeof d.emojiEnabled==='boolean'){emojiEnabled=d.emojiEnabled;emojiToggle.checked=emojiEnabled;}
                if(typeof d.gifEnabled==='boolean'){gifEnabled=d.gifEnabled;gifToggle.checked=gifEnabled;}
                if(typeof d.emojiDelay==='number'){emojiDelay=d.emojiDelay;eDelaySl.value=String(emojiDelay/1000);eDelaySl.dispatchEvent(new Event('input'));}
                if(typeof d.gifDelay==='number'){gifDelay=d.gifDelay;gDelaySl.value=String(gifDelay/1000);gDelaySl.dispatchEvent(new Event('input'));}
                if(typeof d.fontDelay==='number'){fontDelay=d.fontDelay;fDelaySl.value=String(fontDelay/1000);fDelaySl.dispatchEvent(new Event('input'));}
                if(typeof d.fontMode==='number') fontMode=d.fontMode;
                applyTheme(); refreshFontSelect(); renderFontList(); renderEmojiList(); renderGifList();
            } catch(e){ alert('Invalid settings file.'); }
        };
        reader.readAsText(f); importFile.value='';
    });
    document.documentElement.appendChild(importFile);

    function doImport() { importFile.click(); }

    // ═════════════════════════════════════════════════════════════════════════════
    // BUTTON & MENU LOGIC
    // ═════════════════════════════════════════════════════════════════════════════
    function positionBtn(el) {
        if(!el) return;
        const r=el.getBoundingClientRect(),pad=5;
        btn.style.left=`${r.right-28-pad}px`; btn.style.top=`${r.bottom-28-pad}px`;
        hoverZone.style.left=`${r.right-48}px`; hoverZone.style.top=`${r.bottom-48}px`;
    }
    function updateBtnAppearance() {
        if(fontMode===0){
            btn.textContent='A'; btn.style.background=theme.btnBg; btn.style.borderColor=theme.border;
            btn.style.color=theme.text; btn.style.fontStyle='italic'; btn.style.fontWeight='bold';
            btn.style.fontFamily='Georgia,serif'; btn.style.outline='none';
        } else {
            btn.textContent=fonts[fontMode-1]?.emoji||'A'; btn.style.background=theme.btnActive; btn.style.borderColor=theme.accent;
            btn.style.color=theme.text; btn.style.fontStyle='normal'; btn.style.fontWeight='normal';
            btn.style.fontFamily='inherit'; btn.style.outline=`2px solid ${theme.accent}55`;
        }
        refreshFontSelect();
    }
    updateBtnAppearance();

    function revealBtn() { btn.style.display='flex'; requestAnimationFrame(()=>{ btn.style.opacity='1'; }); resetAutoHide(); }
    function concealBtn() {
        btn.style.opacity='0'; clearAutoHide();
        setTimeout(()=>{ if(btn.style.opacity==='0'&&!menuOpen) btn.style.display='none'; },400);
    }
    function resetAutoHide() { clearAutoHide(); autoHideTimer=setTimeout(()=>{ if(!menuOpen) concealBtn(); },5000); }
    function clearAutoHide() { clearTimeout(autoHideTimer); autoHideTimer=null; }

    hoverZone.addEventListener('mouseenter',revealBtn);
    hoverZone.addEventListener('touchstart',revealBtn,{passive:true});
    btn.addEventListener('mouseenter',()=>clearAutoHide());
    btn.addEventListener('mouseleave',()=>{ if(!menuOpen) resetAutoHide(); });

    function openMenu() {
        menuOpen=true;
        renderFontList(); renderEmojiList(); renderGifList(); refreshFontSelect();
        menu.style.display='flex';
        backdrop.style.display='block';
        clearAutoHide(); revealBtn();
    }
    function closeMenu() {
        menuOpen=false; menu.style.display='none'; backdrop.style.display='none';
        resetAutoHide(); if(activeField) activeField.focus();
    }
    function selectFont(idx) { fontMode=idx; updateBtnAppearance(); renderFontList(); }

    btn.addEventListener('mousedown',e=>{ e.preventDefault(); e.stopPropagation(); if(menuOpen) closeMenu(); else openMenu(); });
    window.addEventListener('resize',()=>{ },{passive:true});
    window.addEventListener('scroll',()=>{ if(activeField) positionBtn(activeField); },{passive:true});

    // ═════════════════════════════════════════════════════════════════════════════
    // KEYSTROKE HANDLER (fonts)
    // ═════════════════════════════════════════════════════════════════════════════
    function onKeydown(e) {
        if(fontMode===0) return;
        if(e.key.length!==1||e.ctrlKey||e.metaKey||e.altKey) return;
        const font=fonts[fontMode-1]; if(!font) return;
        if(fontDelay===0) {
            e.preventDefault();
            const field=e.currentTarget;
            const styled=translateChar(e.key,font);
            const chars=toChars(field.value);
            const cs=byteOffsetToCP(chars,field.selectionStart), ce=byteOffsetToCP(chars,field.selectionEnd);
            const before=chars.slice(0,cs).join(''), after=chars.slice(ce).join('');
            field.value=before+styled+after;
            const nc=before.length+styled.length;
            field.setSelectionRange(nc,nc);
            field.dispatchEvent(new Event('input',{bubbles:true}));
            field.dispatchEvent(new Event('change',{bubbles:true}));
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // INPUT HANDLER (emoji + gif replacements)
    // ═════════════════════════════════════════════════════════════════════════════
    function cancelTimer(map, field) { const t=map.get(field); if(t){clearTimeout(t.timer);map.delete(field);} }

    function onInputForTriggers(e) {
        const field=e.currentTarget;
        cancelTimer(emojiTimers,field); cancelTimer(gifTimers,field);

        const textBefore=field.value.slice(0,field.selectionStart);

        if(emojiEnabled) {
            const rx=buildRegex(emojiRules);
            if(rx){
                const m=textBefore.match(rx);
                if(m){
                    const trigger=m[1];
                    const rule=emojiRules.find(r=>r.enabled&&r.trigger===trigger);
                    if(rule){
                        const timer=setTimeout(()=>{
                            emojiTimers.delete(field);
                            const cur=field.value, cc=field.selectionStart;
                            if(!cur.slice(0,cc).endsWith(trigger)) return;
                            const start=cc-trigger.length;
                            field.value=cur.slice(0,start)+rule.emoji+cur.slice(cc);
                            const nc=start+rule.emoji.length;
                            field.setSelectionRange(nc,nc);
                            field.dispatchEvent(new Event('input',{bubbles:true}));
                            field.dispatchEvent(new Event('change',{bubbles:true}));
                        }, emojiDelay);
                        emojiTimers.set(field,{timer,trigger});
                    }
                }
            }
        }

        if(gifEnabled) {
            const rx=buildRegex(gifRules);
            if(rx){
                const m=textBefore.match(rx);
                if(m){
                    const trigger=m[1];
                    const rule=gifRules.find(r=>r.enabled&&r.trigger===trigger);
                    if(rule){
                        const timer=setTimeout(()=>{
                            gifTimers.delete(field);
                            const cur=field.value, cc=field.selectionStart;
                            if(!cur.slice(0,cc).endsWith(trigger)) return;
                            const start=cc-trigger.length;
                            field.value=cur.slice(0,start)+rule.url+cur.slice(cc);
                            const nc=start+rule.url.length;
                            field.setSelectionRange(nc,nc);
                            field.dispatchEvent(new Event('input',{bubbles:true}));
                            field.dispatchEvent(new Event('change',{bubbles:true}));
                        }, gifDelay);
                        gifTimers.set(field,{timer,trigger});
                    }
                }
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // FIELD DETECTION & LIFECYCLE
    // Discord uses a div[contenteditable] with role="textbox" inside its slate editor.
    // Facebook Messenger / posts also use contenteditable divs.
    // The existing isContentEditable check already catches both — but we also need
    // to handle the fact that those fields don't have .value; we patch them below.
    // ═════════════════════════════════════════════════════════════════════════════
    function isTextField(el) {
        if(!el||el===btn||menu.contains(el)||el===hoverZone) return false;
        if(el.tagName==='TEXTAREA') return true;
        if(el.tagName==='INPUT'){
            const t=(el.type||'text').toLowerCase();
            return ['text','search','url','email','password','tel','number',''].includes(t);
        }
        // contenteditable covers Discord, Facebook, and most modern chat UIs
        if(el.isContentEditable) return true;
        // Extra: explicit role="textbox" (some apps without isContentEditable set)
        if(el.getAttribute('role')==='textbox') return true;
        return false;
    }

    // contenteditable fields don't have .value / .selectionStart — shim them
    // so the rest of the code works without branching everywhere.
    function shimContentEditable(el) {
        if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') return; // native, skip
        if(el.__iuShimmed) return;
        el.__iuShimmed = true;

        Object.defineProperty(el, 'value', {
            get() { return el.innerText; },
            set(v) { el.innerText = v; },
            configurable: true,
        });
        Object.defineProperty(el, 'selectionStart', {
            get() {
                const sel = window.getSelection();
                if(!sel||!sel.rangeCount) return 0;
                const range = sel.getRangeAt(0).cloneRange();
                range.selectNodeContents(el);
                range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
                return range.toString().length;
            },
            configurable: true,
        });
        el.setSelectionRange = function(start, end) {
            // Move cursor to character offset `start` inside the contenteditable
            try {
                const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                let node, remaining = start;
                while((node = walker.nextNode())) {
                    if(remaining <= node.length) {
                        const range = document.createRange();
                        range.setStart(node, remaining);
                        range.collapse(true);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                        return;
                    }
                    remaining -= node.length;
                }
            } catch(_) {}
        };
    }

    function onFocusIn(e) {
        const el=e.target; if(!isTextField(el)) return;
        if(activeField&&activeField!==el){
            activeField.removeEventListener('keydown',onKeydown);
            activeField.removeEventListener('input',onInputForTriggers);
            cancelTimer(emojiTimers,activeField); cancelTimer(gifTimers,activeField);
        }
        activeField=el;
        shimContentEditable(el);
        el.addEventListener('keydown',onKeydown);
        el.addEventListener('input',onInputForTriggers);
        clearTimeout(focusTimer); positionBtn(el);
        hoverZone.style.display='block';
        if(fontMode!==0) revealBtn();
    }
    function onFocusOut(e) {
        if(menu.contains(e.relatedTarget)||e.relatedTarget===btn||e.relatedTarget===hoverZone) return;
        focusTimer=setTimeout(()=>{
            const af=document.activeElement;
            if(af&&isTextField(af)) return;
            if(menuOpen) return;
            concealBtn(); hoverZone.style.display='none';
            if(activeField){
                activeField.removeEventListener('keydown',onKeydown);
                activeField.removeEventListener('input',onInputForTriggers);
                cancelTimer(emojiTimers,activeField); cancelTimer(gifTimers,activeField);
                activeField=null;
            }
        },200);
    }

    document.addEventListener('focusin',onFocusIn,true);
    document.addEventListener('focusout',onFocusOut,true);

    // ═════════════════════════════════════════════════════════════════════════════
    // INIT
    // ═════════════════════════════════════════════════════════════════════════════
    switchTab(0);
    renderFontList();
    renderEmojiList();
    renderGifList();
    refreshFontSelect();
    syncSwatches();
    applyTheme();

    if(isTextField(document.activeElement)) onFocusIn({target:document.activeElement});
    console.log('[Input Utility Module] v10.2 loaded ✓');

})();
