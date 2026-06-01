 // ==UserScript==
// @name         Input Utility Module
// @namespace    https://github.com/jordanalbiar/input-utility-module
// @version      2.0.0
// @description  Font styling, emoji/gif triggers with configurable timers, full theming, GIF Portal, import/export.
// @author       Jordan Albiar
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const VERSION = '2.0.0';
  const ZWS = '\u200B';

  function isContentEditable(el) {
    return el && (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('contenteditable') === '');
  }

  function getFieldText(el) {
    if (isContentEditable(el)) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return { text: el.innerText || '', cursor: (el.innerText || '').length };
      const range = sel.getRangeAt(0);
      const pre = range.cloneRange();
      pre.selectNodeContents(el);
      pre.setEnd(range.endContainer, range.endOffset);
      const textBefore = pre.toString();
      const fullText = el.innerText || '';
      return { text: fullText, cursor: textBefore.length };
    }
    return { text: el.value, cursor: el.selectionStart };
  }

  function deleteBeforeCursor(el, count) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let remaining = count;
    while (remaining > 0) {
      const node = range.startContainer;
      const offset = range.startOffset;
      if (node.nodeType === Node.TEXT_NODE) {
        const canDelete = Math.min(offset, remaining);
        if (canDelete <= 0) break;
        range.setStart(node, offset - canDelete);
        range.deleteContents();
        remaining -= canDelete;
      } else {
        const prev = range.startContainer.childNodes[range.startOffset - 1];
        if (!prev) break;
        if (prev.nodeType === Node.TEXT_NODE) {
          const canDelete = Math.min(prev.length, remaining);
          prev.deleteData(prev.length - canDelete, canDelete);
          remaining -= canDelete;
        } else {
          const txt = prev.textContent || '';
          const canDelete = Math.min(txt.length, remaining);
          prev.textContent = txt.slice(0, txt.length - canDelete);
          remaining -= canDelete;
        }
      }
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertAtCursor(el, text, deleteCount) {
    el.focus();
    if (isContentEditable(el)) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      if (deleteCount > 0) deleteBeforeCursor(el, deleteCount);
      const succeeded = document.execCommand('insertText', false, text);
      if (!succeeded) {
        const r = sel.getRangeAt(0);
        r.deleteContents();
        r.insertNode(document.createTextNode(text));
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const before = el.value.slice(0, start - deleteCount);
      const after = el.value.slice(end);
      el.value = before + text + after;
      const pos = before.length + text.length;
      el.setSelectionRange(pos, pos);
      const nativeInputValueSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value') ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      try { nativeInputValueSetter && nativeInputValueSetter.set && nativeInputValueSetter.set.call(el, el.value); } catch (_) {}
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function insertStyledChar(el, char, font) {
    const styled = translateChar(char, font);
    if (isContentEditable(el)) {
      el.focus();
      const succeeded = document.execCommand('insertText', false, styled);
      if (!succeeded) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const r = sel.getRangeAt(0);
          r.deleteContents();
          r.insertNode(document.createTextNode(styled));
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    } else {
      insertAtCursor(el, styled, 0);
    }
  }

  const PRESETS = {
    '🌊': { bg:'#0d1b2e',bg2:'#112240',border:'#00ff8833',accent:'#00ff88',accentHover:'#00ff8844',btnBg:'#0d1b2e',btnActive:'#5b2d8e',text:'#ffffff',textDim:'rgba(220,240,255,0.45)',textLabel:'rgba(0,255,136,0.6)',inputBg:'rgba(0,255,136,0.07)',inputBorder:'rgba(0,255,136,0.25)',tooltipBg:'#5b2d8e',tooltipText:'#e8d5ff',danger:'#ff6b6b',success:'#00ff88' },
    '☀️': { bg:'#f5f6fa',bg2:'#e8eaf0',border:'#c0c4d044',accent:'#5c5c5c',accentHover:'#5c5c5c18',btnBg:'#e0e2ea',btnActive:'#9e9e9e',text:'#0d1b3e',textDim:'rgba(13,27,62,0.5)',textLabel:'rgba(60,60,60,0.7)',inputBg:'rgba(0,0,0,0.05)',inputBorder:'rgba(0,0,0,0.2)',tooltipBg:'#cccccc',tooltipText:'#0d1b3e',danger:'#cc2222',success:'#1a8c3c' },
    '🔮': { bg:'#0e0e1a',bg2:'#16142a',border:'#7b6aff44',accent:'#7b6aff',accentHover:'#7b6aff28',btnBg:'#0e0e1a',btnActive:'#4a30cc',text:'#fff',textDim:'rgba(255,255,255,0.4)',textLabel:'rgba(160,145,255,0.65)',inputBg:'rgba(120,100,255,0.08)',inputBorder:'rgba(120,100,255,0.3)',tooltipBg:'#2e1f6e',tooltipText:'#d4cbff',danger:'#ff6b6b',success:'#5dde8a' },
    '🌿': { bg:'#091a17',bg2:'#0e2620',border:'#26c99a44',accent:'#26c99a',accentHover:'#26c99a28',btnBg:'#091a17',btnActive:'#0d7d5e',text:'#eafff9',textDim:'rgba(200,255,235,0.45)',textLabel:'rgba(38,201,154,0.65)',inputBg:'rgba(38,201,154,0.08)',inputBorder:'rgba(38,201,154,0.3)',tooltipBg:'#074d3a',tooltipText:'#aaffd8',danger:'#ff6b6b',success:'#26c99a' },
    '🌸': { bg:'#1a0e16',bg2:'#261224',border:'#f07ab544',accent:'#f07ab5',accentHover:'#f07ab528',btnBg:'#1a0e16',btnActive:'#b03370',text:'#fff0f8',textDim:'rgba(255,210,235,0.45)',textLabel:'rgba(240,122,181,0.65)',inputBg:'rgba(240,122,181,0.08)',inputBorder:'rgba(240,122,181,0.3)',tooltipBg:'#6e0d3a',tooltipText:'#ffd6ea',danger:'#ff6b6b',success:'#78e88a' },
    '🔥': { bg:'#17120a',bg2:'#211a0e',border:'#e8a02044',accent:'#e8a020',accentHover:'#e8a02028',btnBg:'#17120a',btnActive:'#9a6200',text:'#fff8e8',textDim:'rgba(255,235,180,0.45)',textLabel:'rgba(232,160,32,0.65)',inputBg:'rgba(232,160,32,0.08)',inputBorder:'rgba(232,160,32,0.3)',tooltipBg:'#5c3c00',tooltipText:'#ffe9a8',danger:'#ff6b6b',success:'#78e88a' },
    '⬛': { bg:'#111',bg2:'#1c1c1c',border:'#88888844',accent:'#aaa',accentHover:'#aaaaaa22',btnBg:'#111',btnActive:'#444',text:'#fff',textDim:'rgba(255,255,255,0.4)',textLabel:'rgba(200,200,200,0.55)',inputBg:'rgba(255,255,255,0.06)',inputBorder:'rgba(255,255,255,0.2)',tooltipBg:'#333',tooltipText:'#eee',danger:'#ff6b6b',success:'#6de88a' },
  };
  const DEFAULT_PRESET_NAME = '⬛';
  let theme = { ...PRESETS[DEFAULT_PRESET_NAME] };

  const tooltipStyleEl = document.createElement('style');
  document.head.appendChild(tooltipStyleEl);
  function updateTooltipStyle() {
    tooltipStyleEl.textContent = `
      .__ium[title]:hover::after {
        content: attr(title); position: fixed;
        background: ${theme.tooltipBg} !important; color: ${theme.tooltipText} !important;
        font-size: 11px; font-family: system-ui,sans-serif; padding: 3px 8px; border-radius: 5px;
        white-space: nowrap; pointer-events: none; z-index: 2147483648;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5); margin-top: -34px; margin-left: -4px;
      }`;
  }
  updateTooltipStyle();
  function tip(el, text) { el.title = text; el.classList.add('__ium'); return el; }

  let fonts = [
    { name:'Cryptic', emoji:'𐌀', sample:'𐌂𐌓𐌙𐌐𐌕𐌉𐌂', map:{a:'𐌀',b:'𐌁',c:'𐌂',d:'𐌃',e:'𐌄',f:'𐌅',g:'Ᏽ',h:'𐋅',i:'𐌉',j:'Ꮭ',k:'𐌊',l:'𐌋',m:'𐌌',n:'𐌍',o:'Ꝋ',p:'𐌐',q:'𐌒',r:'𐌓',s:'𐌔',t:'𐌕',u:'𐌵',v:'ᕓ',w:'Ᏼ',x:'𐋄',y:'𐌙',z:'Ɀ'} },
    { name:'Fraktur', emoji:'𝖋', sample:'𝖋𝖗𝖆𝖐𝖙𝖚𝖗', map:{a:'𝖆',b:'𝖇',c:'𝖈',d:'𝖉',e:'𝖊',f:'𝖋',g:'𝖌',h:'𝖍',i:'𝖎',j:'𝖏',k:'𝖐',l:'𝖑',m:'𝖒',n:'𝖓',o:'𝖔',p:'𝖕',q:'𝖖',r:'𝖗',s:'𝖘',t:'𝖙',u:'𝖚',v:'𝖛',w:'𝖜',x:'𝖝',y:'𝖞',z:'𝖟'} },
    { name:'Bubbles', emoji:'🅑', sample:'🅑🅤🅑🅑🅛🅔🅢', map:{a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',k:'🅚',l:'🅛',m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩'} },
    { name:'Monospace', emoji:'𝚖', sample:'𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎', map:{a:'𝚊',b:'𝚋',c:'𝚌',d:'𝚍',e:'𝚎',f:'𝚏',g:'𝚐',h:'𝚑',i:'𝚒',j:'𝚓',k:'𝚔',l:'𝚕',m:'𝚖',n:'𝚗',o:'𝚘',p:'𝚙',q:'𝚚',r:'𝚛',s:'𝚜',t:'𝚝',u:'𝚞',v:'𝚟',w:'𝚠',x:'𝚡',y:'𝚢',z:'𝚣'} },
    { name:'Full-Width', emoji:'Ｆ', sample:'ｆｕｌｌ ｗｉｄｔｈ', map:{a:'ａ',b:'ｂ',c:'ｃ',d:'ｄ',e:'ｅ',f:'ｆ',g:'ｇ',h:'ｈ',i:'ｉ',j:'ｊ',k:'ｋ',l:'ｌ',m:'ｍ',n:'ｎ',o:'ｏ',p:'ｐ',q:'ｑ',r:'ｒ',s:'ｓ',t:'ｔ',u:'ｕ',v:'ｖ',w:'ｗ',x:'ｘ',y:'ｙ',z:'ｚ'} },
    { name:'Squares', emoji:'🆂', sample:'🆂🅶🆁🅳🆂', map:{a:'🅰',b:'🅱',c:'🅲',d:'🅳',e:'🅴',f:'🅵',g:'🅶',h:'🅷',i:'🅸',j:'🅹',k:'🅺',l:'🅻',m:'🅼',n:'🅽',o:'🅾',p:'🅿',q:'🆀',r:'🆁',s:'🆂',t:'🆃',u:'🆄',v:'🆅',w:'🆆',x:'🆇',y:'🆈',z:'🆉'} },
    { name:'Double-Struck', emoji:'𝕕', sample:'𝕕𝕠𝕦𝕓𝕝𝕖', map:{a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫'} },
    { name:'Ancient', emoji:'ꍏ', sample:'ꍏꈤꉓꀤꍟꈤ꓄', map:{a:'ꍏ',b:'ꌃ',c:'ꉓ',d:'ꀸ',e:'ꍟ',f:'ꎇ',g:'ꁅ',h:'ꃅ',i:'ꀤ',j:'ꀭ',k:'ꀘ',l:'꒒',m:'ꂵ',n:'ꈤ',o:'ꂦ',p:'ꉣ',q:'ꆰ',r:'ꋪ',s:'ꌗ',t:'꓄',u:'ꀎ',v:'ꃴ',w:'ꅏ',x:'ꊼ',y:'ꌩ',z:'ꁴ'} },
    { name:'Bold', emoji:'𝐁', sample:'𝐛𝐨𝐥𝐝', map:{a:'𝐚',b:'𝐛',c:'𝐜',d:'𝐝',e:'𝐞',f:'𝐟',g:'𝐠',h:'𝐡',i:'𝐢',j:'𝐣',k:'𝐤',l:'𝐥',m:'𝐦',n:'𝐧',o:'𝐨',p:'𝐩',q:'𝐪',r:'𝐫',s:'𝐬',t:'𝐭',u:'𝐮',v:'𝐯',w:'𝐰',x:'𝐱',y:'𝐲',z:'𝐳'} },
    { name:'Sans-Bold', emoji:'𝗦', sample:'𝘀𝗮𝗻𝘀 𝗯𝗼𝗹𝗱', map:{a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇'} },
    { name:'Script', emoji:'𝓢', sample:'𝓼𝓬𝓻𝓲𝓹𝓽', map:{a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃'} },
    { name:'Emoji Flags', emoji:'🌐', sample:'🇪'+ZWS+'🇲'+ZWS+'🇴'+ZWS+'🇯'+ZWS+'🇮', suffix:ZWS,
      map:{a:'🇦',b:'🇧',c:'🇨',d:'🇩',e:'🇪',f:'🇫',g:'🇬',h:'🇭',i:'🇮',j:'🇯',k:'🇰',l:'🇱',m:'🇲',n:'🇳',o:'🇴',p:'🇵',q:'🇶',r:'🇷',s:'🇸',t:'🇹',u:'🇺',v:'🇻',w:'🇼',x:'🇽',y:'🇾',z:'🇿'} },
  ];

  function translateChar(ch, font) {
    const m = font.map[ch.toLowerCase()] ?? ch;
    return font.suffix ? m + font.suffix : m;
  }
  function translateAlphabet(font) {
    return 'abcdefghijklmnopqrstuvwxyz'.split('').map(c => translateChar(c, font)).join('');
  }

  const DEFAULT_EMOJI_RULES = [
    {trigger:":'(",emoji:'😭'},{trigger:":'-(",emoji:'😭'},{trigger:">:(",emoji:'😡'},{trigger:">:)",emoji:'😈'},{trigger:"O:)",emoji:'😇'},{trigger:"o:)",emoji:'😇'},
    {trigger:":thinking:",emoji:'🤔'},{trigger:"shh",emoji:'🤫'},{trigger:"-_-",emoji:'😑'},{trigger:":S",emoji:'😖'},{trigger:":s",emoji:'😖'},
    {trigger:":X",emoji:'😵'},{trigger:":x",emoji:'😵'},{trigger:":O",emoji:'😱'},{trigger:":o",emoji:'😱'},{trigger:"XD",emoji:'😂'},{trigger:"xD",emoji:'😂'},
    {trigger:"LOL",emoji:'😂'},{trigger:"lol",emoji:'😂'},{trigger:"B)",emoji:'😎'},{trigger:"b)",emoji:'😎'},{trigger:";P",emoji:'😜'},{trigger:";p",emoji:'😜'},
    {trigger:":P",emoji:'😛'},{trigger:":p",emoji:'😛'},{trigger:";)",emoji:'😉'},{trigger:":D",emoji:'😃'},{trigger:":d",emoji:'😃'},
    {trigger:"^_^'",emoji:'😅'},{trigger:"^_^",emoji:'😁'},{trigger:":/",emoji:'😕'},{trigger:":|",emoji:'😐'},{trigger:":(",emoji:'😔'},
    {trigger:":)",emoji:'🙂'},{trigger:":*",emoji:'😘'},{trigger:"<3",emoji:'❤️'},{trigger:"+1",emoji:'👍'},{trigger:":thumbsup:",emoji:'👍'},
    {trigger:"-1",emoji:'👎'},{trigger:":thumbsdown:",emoji:'👎'},{trigger:"\\m/",emoji:'🤘'},{trigger:"\\o/",emoji:'🙌'},{trigger:"o/",emoji:'👋'},
    {trigger:"OK",emoji:'👌'},{trigger:"ok",emoji:'👌'},{trigger:"fist",emoji:'✊'},{trigger:"handshake",emoji:'🤝'},{trigger:"wave",emoji:'👋'},
    {trigger:"pray",emoji:'🙏'},{trigger:"thanks",emoji:'🙏'},{trigger:"call me",emoji:'🤙'},
    {trigger:":dog:",emoji:'🐶'},{trigger:":cat:",emoji:'🐱'},{trigger:":mouse:",emoji:'🐭'},{trigger:":hamster:",emoji:'🐹'},{trigger:":rabbit:",emoji:'🐰'},
    {trigger:":fox:",emoji:'🦊'},{trigger:":bear:",emoji:'🐻'},{trigger:":panda:",emoji:'🐼'},{trigger:":koala:",emoji:'🐨'},{trigger:":tiger:",emoji:'🐯'},
    {trigger:":lion:",emoji:'🦁'},{trigger:":cow:",emoji:'🐮'},{trigger:":pig:",emoji:'🐷'},{trigger:":frog:",emoji:'🐸'},{trigger:":monkey:",emoji:'🐵'},
    {trigger:":chicken:",emoji:'🐔'},{trigger:":penguin:",emoji:'🐧'},{trigger:":bird:",emoji:'🐦'},{trigger:":chick:",emoji:'🐤'},{trigger:":duck:",emoji:'🦆'},
    {trigger:":eagle:",emoji:'🦅'},{trigger:":wolf:",emoji:'🐺'},{trigger:":horse:",emoji:'🐴'},{trigger:":unicorn:",emoji:'🦄'},{trigger:":turtle:",emoji:'🐢'},
    {trigger:":snake:",emoji:'🐍'},{trigger:":dolphin:",emoji:'🐬'},{trigger:":whale:",emoji:'🐳'},{trigger:":shark:",emoji:'🦈'},{trigger:":octopus:",emoji:'🐙'},
    {trigger:":butterfly:",emoji:'🦋'},{trigger:":bee:",emoji:'🐝'},{trigger:":ladybug:",emoji:'🐞'},{trigger:":scorpion:",emoji:'🦂'},{trigger:":spider:",emoji:'🕷️'},
    {trigger:":apple:",emoji:'🍎'},{trigger:":banana:",emoji:'🍌'},{trigger:":strawberry:",emoji:'🍓'},{trigger:":grapes:",emoji:'🍇'},{trigger:":watermelon:",emoji:'🍉'},
    {trigger:":orange:",emoji:'🍊'},{trigger:":lemon:",emoji:'🍋'},{trigger:":avocado:",emoji:'🥑'},{trigger:":pineapple:",emoji:'🍍'},{trigger:":kiwi:",emoji:'🥝'},
    {trigger:":peach:",emoji:'🍑'},{trigger:":cherries:",emoji:'🍒'},{trigger:":tomato:",emoji:'🍅'},{trigger:":hot_pepper:",emoji:'🌶️'},{trigger:":carrot:",emoji:'🥕'},
    {trigger:":corn:",emoji:'🌽'},{trigger:":broccoli:",emoji:'🥦'},{trigger:":potato:",emoji:'🥔'},{trigger:":bread:",emoji:'🍞'},{trigger:":cheese:",emoji:'🧀'},
    {trigger:":hamburger:",emoji:'🍔'},{trigger:":fries:",emoji:'🍟'},{trigger:":pizza:",emoji:'🍕'},{trigger:":hotdog:",emoji:'🌭'},{trigger:":sandwich:",emoji:'🥪'},
    {trigger:":taco:",emoji:'🌮'},{trigger:":sushi:",emoji:'🍣'},{trigger:":fried_shrimp:",emoji:'🍤'},{trigger:":icecream:",emoji:'🍦'},{trigger:":doughnut:",emoji:'🍩'},
    {trigger:":cookie:",emoji:'🍪'},{trigger:":cake:",emoji:'🎂'},{trigger:":pie:",emoji:'🥧'},{trigger:":chocolate:",emoji:'🍫'},{trigger:":candy:",emoji:'🍬'},
    {trigger:":lollipop:",emoji:'🍭'},{trigger:":pudding:",emoji:'🍮'},{trigger:":coffee:",emoji:'☕'},{trigger:":drink:",emoji:'🥤'},{trigger:":beer:",emoji:'🍺'},
    {trigger:":wine:",emoji:'🍷'},{trigger:":champagne:",emoji:'🍾'},{trigger:"poop",emoji:'💩'},{trigger:"dead",emoji:'💀'},
  ];
  let emojiRules = DEFAULT_EMOJI_RULES.map(r => ({...r, enabled:true}));

  const DEFAULT_GIF_RULES = [
    { trigger:':wave:', url:'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3d3pjdnE1YXV2MGZ3bHBieWFjc29iMjRjNzQxbnVocG54Z2dyYXF3bCZlcD12MV9naWZzX3RyZW5kaW5nJmN0PWc/ASd0Ukj0y3qMM/giphy.gif', enabled:true, tags:['greetings'] },
    { trigger:':facepalm:', url:'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif', enabled:true, tags:['reactions'] },
    { trigger:':clever-girl:', url:'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjBpbzI4azV4dzdkaGh0aG1hcDNubWFyNDFvZHdpdHk3dTJsZ21yNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPvND7gEInk98Eo/giphy.gif', enabled:true, tags:['reactions'] },
    { trigger:':mindblown:', url:'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', enabled:true, tags:['reactions'] },
    { trigger:':mail:', url:'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExazZxNHFqYnJibm1qMWU3M2ZwMndtZnl1NzI4ZW93aGI3ZHljdmZlbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0IykOsxLECVejOzm/giphy.gif', enabled:true, tags:[] },
  ];
  const PRESET_TRIGGERS = new Set(DEFAULT_GIF_RULES.map(r => r.trigger));
  function isPreset(rule) { return PRESET_TRIGGERS.has(rule.trigger); }
  let gifRules = DEFAULT_GIF_RULES.map(r => ({...r, tags:[...(r.tags||[])]}));

  let emojiEnabled = true, emojiDelay = 1000;
  let gifEnabled = true, gifDelay = 1000;
  let fontDelay = 0, fontMode = 0;
  let activeField = null, menuOpen = false;
  let focusTimer = null, autoHideTimer = null;
  let menuX = null, menuY = null, menuW = null, menuH = null;
  let activeGifCategory = '__all__';

  const emojiTimers = new Map();
  const gifTimers = new Map();

  // GIf portal state

  let portal = {
    apiKey: '',
    activeSource: 'tenor',
    customSources: [],
    query: '',
    offset: 0,
    limit: 20,
    favorites: [],
    history: [],
    gifs: [],
    searching: false,
    view: 'search', // 'search' | 'favorites'
    hasMore: false,
  };

  function portalSaveStorage() {
    try {
      localStorage.setItem('__ium_portal', JSON.stringify({
        apiKey: portal.apiKey,
        activeSource: portal.activeSource,
        customSources: portal.customSources,
        favorites: portal.favorites,
        history: portal.history,
        limit: portal.limit,
      }));
    } catch(_) {}
  }
  function portalLoadStorage() {
    try {
      const d = JSON.parse(localStorage.getItem('__ium_portal') || '{}');
      if (d.apiKey) portal.apiKey = d.apiKey;
      if (d.activeSource) portal.activeSource = d.activeSource;
      if (d.customSources) portal.customSources = d.customSources;
      if (d.favorites) portal.favorites = d.favorites;
      if (d.history) portal.history = d.history;
      if (d.limit) portal.limit = d.limit;
    } catch(_) {}
  }
  portalLoadStorage();

  // Shared helpers

  function buildRegex(rules) {
    const on = rules.filter(r => r.enabled);
    if (!on.length) return null;
    const sorted = [...on].sort((a, b) => b.trigger.length - a.trigger.length);
    const parts = sorted.map(r => r.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp('(' + parts.join('|') + ')$');
  }

  const themedEls = new Map();
  function reg(key, el, fn) { themedEls.set(key, {el, fn}); return el; }

  function applyTheme() {
    updateTooltipStyle();
    themedEls.forEach(({el, fn}) => fn(el, theme));
    renderFontList();
    renderEmojiList();
    renderGifCategoryTabs();
    renderGifList();
    renderPortalSources();
    stylePortalWithTheme();
    switchTab(activeTab);
    updateBtnAppearance();
    trackedInputs.forEach(el => styleInput(el));
  }

  const trackedInputs = [];
  function styleInput(el) {
    Object.assign(el.style, {
      background: theme.inputBg, border: '1px solid ' + theme.inputBorder,
      borderRadius: '5px', color: theme.text, fontSize: '12px', padding: '4px 6px',
      fontFamily: 'system-ui,sans-serif', outline: 'none', boxSizing: 'border-box',
    });
  }
  function trackInput(el) { trackedInputs.push(el); styleInput(el); return el; }

  // ─── MAIN BUTTON ──────────────────────────────────────────────────
  const btn = document.createElement('button');
  btn.type = 'button';
  tip(btn, 'Input Utility Module — click to open');
  Object.assign(btn.style, {
    position: 'fixed', zIndex: '2147483643', width: '28px', height: '28px',
    borderRadius: '50%', fontSize: '13px', cursor: 'pointer',
    display: 'none', alignItems: 'center', justifyContent: 'center',
    padding: '0', boxShadow: '0 2px 12px rgba(0,0,0,0.55)',
    opacity: '0', transition: 'opacity 0.35s ease',
    userSelect: 'none', lineHeight: '1', pointerEvents: 'auto', border: '1px solid',
  });
  document.documentElement.appendChild(btn);

  const hoverZone = document.createElement('div');
  Object.assign(hoverZone.style, { position: 'fixed', zIndex: '2147483642', width: '48px', height: '48px', display: 'none', cursor: 'default', pointerEvents: 'auto' });
  document.documentElement.appendChild(hoverZone);

  const menu = document.createElement('div');
  Object.assign(menu.style, {
    position: 'fixed', zIndex: '2147483646', borderRadius: '10px', padding: '0',
    display: 'none', flexDirection: 'column',
    width: '70vw', maxWidth: '700px', minWidth: '320px',
    height: '65vh', minHeight: '200px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.75)',
    boxSizing: 'border-box', overflow: 'hidden', userSelect: 'none',
  });
  reg('menu', menu, (el, t) => { el.style.background = t.bg; el.style.border = '1px solid ' + t.border; });
  document.documentElement.appendChild(menu);

  const titleBar = document.createElement('div');
  Object.assign(titleBar.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', height: '34px', flexShrink: '0', cursor: 'move', userSelect: 'none', position: 'relative', borderRadius: '10px 10px 0 0' });
  reg('titleBar', titleBar, (el, t) => { el.style.background = t.bg2; el.style.borderBottom = '1px solid ' + t.border; });

  const titleVersion = document.createElement('span');
  titleVersion.textContent = 'v' + VERSION;
  Object.assign(titleVersion.style, { fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.5px', opacity: '0.5', flexShrink: '0', minWidth: '44px' });
  reg('titleVersion', titleVersion, (el, t) => { el.style.color = t.textDim; });

  const titleText = document.createElement('span');
  titleText.textContent = 'Input Utility Module';
  Object.assign(titleText.style, { fontFamily: 'system-ui,sans-serif', fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', whiteSpace: 'nowrap' });
  reg('titleText', titleText, (el, t) => { el.style.color = t.text; });

  const titleClose = document.createElement('button');
  titleClose.type = 'button'; titleClose.textContent = '✕';
  Object.assign(titleClose.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', lineHeight: '1', borderRadius: '4px', flexShrink: '0', marginLeft: 'auto', transition: 'background 0.1s' });
  reg('titleClose', titleClose, (el, t) => { el.style.color = t.textDim; });
  titleClose.addEventListener('mouseenter', () => { titleClose.style.background = theme.danger + '33'; titleClose.style.color = theme.danger; });
  titleClose.addEventListener('mouseleave', () => { titleClose.style.background = 'transparent'; titleClose.style.color = theme.textDim; });
  titleClose.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); closeMenu(); });
  titleBar.appendChild(titleVersion); titleBar.appendChild(titleText); titleBar.appendChild(titleClose);
  menu.appendChild(titleBar);

  (function setupDrag() {
    let dragging = false, startX, startY, startL, startT;
    titleBar.addEventListener('mousedown', e => {
      if (e.target === titleClose) return;
      dragging = true; startX = e.clientX; startY = e.clientY;
      startL = parseInt(menu.style.left) || menu.getBoundingClientRect().left;
      startT = parseInt(menu.style.top) || menu.getBoundingClientRect().top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let nx = startL + (e.clientX - startX), ny = startT + (e.clientY - startY);
      nx = Math.max(0, Math.min(window.innerWidth - menu.offsetWidth, nx));
      ny = Math.max(0, Math.min(window.innerHeight - menu.offsetHeight, ny));
      menu.style.left = nx + 'px'; menu.style.top = ny + 'px'; menu.style.transform = 'none';
      menuX = nx; menuY = ny;
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  })();

  const resizeHandle = document.createElement('div');
  Object.assign(resizeHandle.style, { position: 'absolute', bottom: '0', right: '0', width: '16px', height: '16px', cursor: 'se-resize', zIndex: '1' });
  resizeHandle.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" style="position:absolute;bottom:3px;right:3px;opacity:0.35"><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="5" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="5" r="1.2" fill="currentColor"/><circle cx="2" cy="8" r="1.2" fill="currentColor"/><circle cx="5" cy="5" r="1.2" fill="currentColor"/><circle cx="8" cy="2" r="1.2" fill="currentColor"/></svg>`;
  reg('resizeHandle', resizeHandle, (el, t) => { el.style.color = t.textDim; });
  menu.appendChild(resizeHandle);
  (function setupResize() {
    let resizing = false, startX, startY, startW, startH;
    resizeHandle.addEventListener('mousedown', e => { resizing = true; startX = e.clientX; startY = e.clientY; startW = menu.offsetWidth; startH = menu.offsetHeight; e.preventDefault(); e.stopPropagation(); });
    document.addEventListener('mousemove', e => { if (!resizing) return; menu.style.width = Math.max(320, startW + (e.clientX - startX)) + 'px'; menu.style.height = Math.max(200, startH + (e.clientY - startY)) + 'px'; menuW = parseInt(menu.style.width); menuH = parseInt(menu.style.height); });
    document.addEventListener('mouseup', () => { resizing = false; });
  })();

  const tabBar = document.createElement('div');
  Object.assign(tabBar.style, { display: 'flex', padding: '0 4px', flexShrink: '0', gap: '1px', userSelect: 'none' });
  reg('tabBar', tabBar, (el, t) => { el.style.borderBottom = '1px solid ' + t.border; });
  menu.appendChild(tabBar);

  // Tabs: 0=Fonts, 1=Emoji, 2=GIFs, 3=Portal, 4=Settings, 5=Export, 6=Import
  const TAB_NAMES = ['🔤 Fonts', '😀 Emoji', '🎞 GIFs', '🌀 Portal', '⚙️ Settings', '⬇ Export', '⬆ Import'];
  const tabBtns = [];
  let activeTab = 0;
  TAB_NAMES.forEach((name, i) => {
    const tb = document.createElement('button'); tb.type = 'button'; tb.textContent = name;
    Object.assign(tb.style, { flex: i < 5 ? '1' : '0 0 auto', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', padding: '8px 6px 6px', fontSize: '10px', fontFamily: 'system-ui,sans-serif', letterSpacing: '0.3px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap' });
    tb.addEventListener('mousedown', e => { e.preventDefault(); handleTabClick(i); });
    tabBar.appendChild(tb); tabBtns.push(tb);
    reg('tabBtn' + i, tb, (el, t) => { el.style.color = t.textDim; });
  });
  function handleTabClick(i) {
    if (i === 5) { doExport(); return; }
    if (i === 6) { doImport(); return; }
    switchTab(i);
    if (i === 3) { portalOnOpen(); }
  }
  function switchTab(i) {
    activeTab = i;
    tabBtns.forEach((tb, idx) => { const on = idx === i; tb.style.color = on ? theme.text : theme.textDim; tb.style.borderBottomColor = on ? theme.accent : 'transparent'; });
    tabPanels.forEach((p, idx) => { p.style.display = idx === i ? 'block' : 'none'; });
    if (i === 3) { tabPanels[3].style.display = 'flex'; }
  }

  const panelWrap = document.createElement('div');
  Object.assign(panelWrap.style, { overflowY: 'auto', flex: '1', minHeight: '0' });
  menu.appendChild(panelWrap);

  // 5 panels: 0=fonts, 1=emoji, 2=gifs, 3=portal, 4=settings

  const tabPanels = [0, 1, 2, 3, 4].map(() => { const p = document.createElement('div'); p.style.display = 'none'; panelWrap.appendChild(p); return p; });
  // Portal panel needs flex column layout
  Object.assign(tabPanels[3].style, { flexDirection: 'column', height: '100%', overflow: 'hidden' });

    // font panel

  const fontPanel = tabPanels[0];
  Object.assign(fontPanel.style, { padding: '6px' });

  const addFontBtn = document.createElement('button'); addFontBtn.type = 'button'; addFontBtn.textContent = '+ Add font';
  Object.assign(addFontBtn.style, { width: '100%', borderRadius: '7px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', padding: '6px', cursor: 'pointer', marginBottom: '4px', border: '1px solid' });
  reg('addFontBtn', addFontBtn, (el, t) => { el.style.background = t.inputBg; el.style.borderColor = t.accent; el.style.color = t.accent; });
  addFontBtn.addEventListener('mousedown', e => { e.preventDefault(); openFontEditor(null); });
  fontPanel.appendChild(addFontBtn);

  const fontListDiv = document.createElement('div');
  fontPanel.appendChild(fontListDiv);

  const fontEditorDiv = document.createElement('div');
  Object.assign(fontEditorDiv.style, { display: 'none', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: '8px', margin: '4px 0' });
  reg('fontEditorDiv', fontEditorDiv, (el, t) => { el.style.background = t.bg2; el.style.border = '1px solid ' + t.border; });
  fontPanel.appendChild(fontEditorDiv);

  let editingFontIdx = null;

  function openFontEditor(idx) {
    editingFontIdx = idx;
    const f = idx !== null ? fonts[idx] : null;
    fontEditorDiv.innerHTML = ''; fontEditorDiv.style.display = 'flex';
    fontListDiv.style.display = 'none'; addFontBtn.style.display = 'none';

    const title = document.createElement('div'); title.textContent = idx !== null ? 'Edit font' : 'Add font';
    Object.assign(title.style, { fontSize: '12px', fontFamily: 'system-ui,sans-serif', fontWeight: '600', marginBottom: '2px', color: theme.text });
    fontEditorDiv.appendChild(title);

    function mkField(lbl, val, ph) {
      const wrap = document.createElement('div');
      const l = document.createElement('div'); l.textContent = lbl;
      Object.assign(l.style, { fontSize: '10px', fontFamily: 'system-ui,sans-serif', marginBottom: '2px', color: theme.textDim });
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = val || ''; inp.placeholder = ph || ''; inp.style.width = '100%';
      styleInput(inp); wrap.appendChild(l); wrap.appendChild(inp); fontEditorDiv.appendChild(wrap); return inp;
    }
    const nameInp = mkField('Name', f?.name || '', 'e.g. Bold');
    const eiInp = mkField('Icon/emoji', f?.emoji || '', 'e.g. 𝐁');
    const sampInp = mkField('Sample text', f?.sample || '', 'e.g. 𝐛𝐨𝐥𝐝');
    const mapInp = mkField('Map (JSON a–z)', f ? JSON.stringify(f.map) : '', '{"a":"á",...}');
    mapInp.style.fontFamily = 'monospace';
    const sufInp = mkField('Per-char suffix', f?.suffix || '', '');

    const btnRow = document.createElement('div'); Object.assign(btnRow.style, { display: 'flex', gap: '6px', marginTop: '4px' });
    function mkAB(label, save) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      Object.assign(b.style, { flex: '1', borderRadius: '6px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', padding: '6px', cursor: 'pointer', border: '1px solid' });
      b.style.background = save ? theme.btnActive : theme.bg2; b.style.borderColor = save ? theme.accent : theme.border; b.style.color = theme.text;
      btnRow.appendChild(b); return b;
    }
    const saveB = mkAB('Save', true), cancelB = mkAB('Cancel', false);
    fontEditorDiv.appendChild(btnRow);
    cancelB.addEventListener('mousedown', e => { e.preventDefault(); closeFontEditor(); });
    saveB.addEventListener('mousedown', e => {
      e.preventDefault();
      let map = {}; try { map = JSON.parse(mapInp.value); } catch (_) {}
      const entry = { name: nameInp.value.trim() || 'Untitled', emoji: eiInp.value.trim() || '?', sample: sampInp.value.trim() || nameInp.value.trim(), map };
      if (sufInp.value) entry.suffix = sufInp.value;
      if (editingFontIdx !== null) fonts[editingFontIdx] = entry; else fonts.push(entry);
      if (fontMode > fonts.length) fontMode = 0;
      closeFontEditor(); updateBtnAppearance();
    });
  }
  function closeFontEditor() { fontEditorDiv.style.display = 'none'; fontListDiv.style.display = 'block'; addFontBtn.style.display = 'block'; renderFontList(); }

  function renderFontList() {
    fontListDiv.innerHTML = '';
    const offRow = document.createElement('button'); offRow.type = 'button';
    Object.assign(offRow.style, { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: fontMode === 0 ? theme.accent + '44' : 'transparent', border: 'none', borderRadius: '7px', padding: '6px 10px', cursor: 'pointer', boxSizing: 'border-box', transition: 'background 0.1s' });
    const offS = document.createElement('span'); offS.textContent = '— Off —';
    Object.assign(offS.style, { fontFamily: 'system-ui,sans-serif', fontStyle: 'italic', fontSize: '13px', flex: '1', textAlign: 'left', color: theme.textDim });
    offRow.appendChild(offS);
    offRow.addEventListener('mousedown', e => { e.preventDefault(); selectFont(0); });
    offRow.addEventListener('mouseenter', () => { offRow.style.background = theme.accentHover; });
    offRow.addEventListener('mouseleave', () => { offRow.style.background = fontMode === 0 ? theme.accent + '44' : 'transparent'; });
    fontListDiv.appendChild(offRow);

    fonts.forEach((f, i) => {
      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '6px', width: '100%', background: fontMode === (i + 1) ? theme.accent + '44' : 'transparent', borderRadius: '7px', padding: '4px 6px', boxSizing: 'border-box', transition: 'background 0.1s', flexWrap: 'nowrap' });
      row.addEventListener('mouseenter', () => { row.style.background = theme.accentHover; });
      row.addEventListener('mouseleave', () => { row.style.background = fontMode === (i + 1) ? theme.accent + '44' : 'transparent'; });

      const pickB = document.createElement('button'); pickB.type = 'button'; pickB.textContent = fontMode === (i + 1) ? '✓' : '▶';
      Object.assign(pickB.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '2px 6px', flexShrink: '0', color: fontMode === (i + 1) ? theme.accent : theme.textDim });
      tip(pickB, 'Use this font');
      pickB.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); selectFont(i + 1); renderFontList(); });

      const ns = document.createElement('span');
      Object.assign(ns.style, { fontFamily: 'system-ui,sans-serif', fontSize: '10px', width: '62px', flexShrink: '0', color: theme.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
      ns.textContent = f.name;

      const alphStr = translateAlphabet(f);
      const alphaS = document.createElement('span');
      Object.assign(alphaS.style, { fontSize: '11px', letterSpacing: '0.3px', flex: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: theme.text, minWidth: '0' });
      alphaS.textContent = alphStr;
      tip(alphaS, 'a–z in ' + f.name);

      const editB = document.createElement('button'); editB.type = 'button'; editB.textContent = '✎';
      Object.assign(editB.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', flexShrink: '0', color: theme.accent });
      tip(editB, 'Edit font');
      editB.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); openFontEditor(i); });

      const delB = document.createElement('button'); delB.type = 'button'; delB.textContent = '✕';
      Object.assign(delB.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', flexShrink: '0', color: theme.danger });
      tip(delB, 'Delete font');
      delB.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        fonts.splice(i, 1);
        if (fontMode === i + 1) { fontMode = 0; updateBtnAppearance(); } else if (fontMode > i + 1) fontMode--;
        renderFontList();
      });

      row.appendChild(pickB); row.appendChild(ns); row.appendChild(alphaS); row.appendChild(editB); row.appendChild(delB);
      fontListDiv.appendChild(row);
    });
  }

// emoji panel

  const emojiPanel = tabPanels[1];
  Object.assign(emojiPanel.style, { padding: '8px 6px' });

  const emojiSearch = document.createElement('input'); emojiSearch.type = 'text'; emojiSearch.placeholder = 'Search…';
  Object.assign(emojiSearch.style, { width: '100%', boxSizing: 'border-box', marginBottom: '6px' }); trackInput(emojiSearch);
  emojiSearch.addEventListener('input', renderEmojiList); emojiPanel.appendChild(emojiSearch);

  const addERow = document.createElement('div'); Object.assign(addERow.style, { display: 'flex', gap: '4px', marginBottom: '8px', alignItems: 'center' });
  const newEEmoji = document.createElement('input'); newEEmoji.type = 'text'; newEEmoji.placeholder = '😀'; Object.assign(newEEmoji.style, { width: '46px', textAlign: 'center', fontSize: '18px' }); trackInput(newEEmoji);
  const newETrig = document.createElement('input'); newETrig.type = 'text'; newETrig.placeholder = 'trigger text'; newETrig.style.flex = '1'; trackInput(newETrig);
  const addEB = document.createElement('button'); addEB.type = 'button'; addEB.textContent = '+';
  Object.assign(addEB.style, { borderRadius: '5px', fontSize: '16px', padding: '3px 10px', cursor: 'pointer', flexShrink: '0', border: '1px solid' });
  reg('addEB', addEB, (el, t) => { el.style.background = t.inputBg; el.style.borderColor = t.accent; el.style.color = t.accent; });
  tip(addEB, 'Add emoji rule');
  addEB.addEventListener('mousedown', e => {
    e.preventDefault();
    const em = newEEmoji.value.trim(), tr = newETrig.value.trim();
    if (!em || !tr || emojiRules.some(r => r.trigger === tr)) return;
    emojiRules.push({ trigger: tr, emoji: em, enabled: true });
    newEEmoji.value = ''; newETrig.value = ''; renderEmojiList();
  });
  addERow.appendChild(newEEmoji); addERow.appendChild(newETrig); addERow.appendChild(addEB);
  emojiPanel.appendChild(addERow);

  const emojiGrid = document.createElement('div');
  Object.assign(emojiGrid.style, { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' });
  emojiPanel.appendChild(emojiGrid);

  function renderEmojiList() {
    emojiGrid.innerHTML = '';
    const q = emojiSearch.value.toLowerCase();
    emojiRules.forEach((rule, idx) => {
      if (q && !rule.trigger.toLowerCase().includes(q) && !rule.emoji.includes(q)) return;
      const cell = document.createElement('div');
      Object.assign(cell.style, { borderRadius: '6px', padding: '4px 5px', display: 'flex', flexDirection: 'column', gap: '2px', background: theme.bg2, border: '1px solid ' + theme.border });
      const topR = document.createElement('div'); Object.assign(topR.style, { display: 'flex', alignItems: 'center', gap: '3px' });
      const tog = document.createElement('input'); tog.type = 'checkbox'; tog.checked = rule.enabled; tog.style.cursor = 'pointer'; tog.style.flexShrink = '0'; tog.style.accentColor = theme.accent;
      tog.addEventListener('change', e => { e.stopPropagation(); emojiRules[idx].enabled = tog.checked; });
      const eEdit = document.createElement('input'); eEdit.type = 'text'; eEdit.value = rule.emoji;
      Object.assign(eEdit.style, { width: '32px', textAlign: 'center', fontSize: '17px', padding: '1px 2px', background: 'transparent', border: 'none', outline: 'none', cursor: 'text', flexShrink: '0', color: theme.text });
      eEdit.addEventListener('change', () => { emojiRules[idx].emoji = eEdit.value.trim() || rule.emoji; });
      eEdit.addEventListener('mousedown', e => e.stopPropagation());
      const delB = document.createElement('button'); delB.type = 'button'; delB.textContent = '✕';
      Object.assign(delB.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', padding: '0 2px', marginLeft: 'auto', flexShrink: '0', color: theme.danger });
      tip(delB, 'Delete rule');
      delB.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); emojiRules.splice(idx, 1); renderEmojiList(); });
      topR.appendChild(tog); topR.appendChild(eEdit); topR.appendChild(delB);
      const tEdit = document.createElement('input'); tEdit.type = 'text'; tEdit.value = rule.trigger;
      Object.assign(tEdit.style, { width: '100%', boxSizing: 'border-box', fontSize: '10px', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '3px', outline: 'none', background: theme.inputBg, border: '1px solid ' + theme.inputBorder, color: theme.text });
      tEdit.addEventListener('change', () => { const t = tEdit.value.trim(); if (t) emojiRules[idx].trigger = t; });
      tEdit.addEventListener('mousedown', e => e.stopPropagation());
      cell.appendChild(topR); cell.appendChild(tEdit);
      emojiGrid.appendChild(cell);
    });
    trackedInputs.forEach(el => styleInput(el));
  }

  // gif trigger panel

  const gifPanel = tabPanels[2];
  Object.assign(gifPanel.style, { padding: '0', minHeight: '0', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' });

  const gifCatBarWrap = document.createElement('div');
  Object.assign(gifCatBarWrap.style, { flexShrink: '0', padding: '6px 6px 0 6px' });
  gifPanel.appendChild(gifCatBarWrap);

  const gifCatBar = document.createElement('div');
  Object.assign(gifCatBar.style, { display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid' });
  reg('gifCatBar', gifCatBar, (el, t) => { el.style.borderBottomColor = t.border; });
  gifCatBarWrap.appendChild(gifCatBar);

  const gifScrollArea = document.createElement('div');
  Object.assign(gifScrollArea.style, { flex: '1', overflowY: 'auto', padding: '6px', minHeight: '0' });
  gifPanel.appendChild(gifScrollArea);

  function getGifTags() {
    const s = new Set();
    gifRules.forEach(r => (r.tags || []).forEach(t => t && s.add(t)));
    return [...s].sort();
  }

  function deleteGifCategory(tag) {
    gifRules.forEach(r => { if (r.tags) r.tags = r.tags.filter(t => t !== tag); });
    if (activeGifCategory === tag) activeGifCategory = '__all__';
    renderGifCategoryTabs(); renderGifList();
  }

  function renderGifCategoryTabs() {
    gifCatBar.innerHTML = '';
    const q = gifSearch.value.toLowerCase();
    const tags = getGifTags();
    const allTabs = [
      { id: '__all__', label: 'All', fixed: true },
      { id: '__presets__', label: 'Presets', fixed: true },
      ...tags.map(t => ({ id: t, label: t, fixed: false })),
    ];
    if (!allTabs.find(t => t.id === activeGifCategory)) activeGifCategory = '__all__';

    allTabs.forEach(tab => {
      if (q && !tab.fixed && !tab.label.toLowerCase().includes(q)) return;
      const isActive = activeGifCategory === tab.id;
      const wrap = document.createElement('div');
      Object.assign(wrap.style, { display: 'inline-flex', alignItems: 'center', position: 'relative' });

      const b = document.createElement('button'); b.type = 'button'; b.textContent = tab.label;
      Object.assign(b.style, {
        background: isActive ? theme.accent + '44' : theme.bg2,
        border: '1px solid ' + (isActive ? theme.accent : theme.border),
        borderRadius: tab.fixed ? '5px' : '5px 0 0 5px',
        padding: '3px 9px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer',
        color: isActive ? theme.accent : theme.textDim, transition: 'all 0.1s', whiteSpace: 'nowrap',
      });
      b.addEventListener('mouseenter', () => { if (activeGifCategory !== tab.id) { b.style.background = theme.accentHover; b.style.color = theme.text; } });
      b.addEventListener('mouseleave', () => { if (activeGifCategory !== tab.id) { b.style.background = theme.bg2; b.style.color = theme.textDim; } });
      b.addEventListener('mousedown', e => { e.preventDefault(); activeGifCategory = tab.id; renderGifCategoryTabs(); renderGifList(); });
      wrap.appendChild(b);

      if (!tab.fixed) {
        const xb = document.createElement('button'); xb.type = 'button'; xb.textContent = '×';
        Object.assign(xb.style, {
          background: isActive ? theme.accent + '44' : theme.bg2,
          border: '1px solid ' + (isActive ? theme.accent : theme.border), borderLeft: 'none',
          borderRadius: '0 5px 5px 0', padding: '3px 5px', fontSize: '11px', lineHeight: '1',
          fontFamily: 'system-ui,sans-serif', cursor: 'pointer', color: theme.danger, transition: 'all 0.1s', whiteSpace: 'nowrap', flexShrink: '0',
        });
        xb.addEventListener('mouseenter', () => { xb.style.background = theme.danger + '22'; });
        xb.addEventListener('mouseleave', () => { xb.style.background = isActive ? theme.accent + '44' : theme.bg2; });
        xb.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); deleteGifCategory(tab.id); });
        wrap.appendChild(xb);
      }
      gifCatBar.appendChild(wrap);
    });
  }

  const gifSearchRow = document.createElement('div'); Object.assign(gifSearchRow.style, { display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center' });
  const gifSearch = document.createElement('input'); gifSearch.type = 'text'; gifSearch.placeholder = 'Search GIFs…'; gifSearch.style.flex = '1'; gifSearch.style.boxSizing = 'border-box'; trackInput(gifSearch);
  gifSearch.addEventListener('input', () => { renderGifCategoryTabs(); renderGifList(); });

  const newCatBtn = document.createElement('button'); newCatBtn.type = 'button'; newCatBtn.textContent = '+ Category';
  Object.assign(newCatBtn.style, { background: 'transparent', border: '1px dashed ' + theme.accent + '66', borderRadius: '5px', padding: '3px 8px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer', color: theme.accent + '99', transition: 'all 0.1s', whiteSpace: 'nowrap', flexShrink: '0' });
  reg('newCatBtn', newCatBtn, (el, t) => { el.style.borderColor = t.accent + '66'; el.style.color = t.accent + '99'; });
  tip(newCatBtn, 'Create new category');
  newCatBtn.addEventListener('mouseenter', () => { newCatBtn.style.borderColor = theme.accent; newCatBtn.style.color = theme.accent; });
  newCatBtn.addEventListener('mouseleave', () => { newCatBtn.style.borderColor = theme.accent + '66'; newCatBtn.style.color = theme.accent + '99'; });
  newCatBtn.addEventListener('mousedown', e => {
    e.preventDefault(); newCatBtn.style.display = 'none';
    const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'category name…';
    Object.assign(inp.style, { background: theme.inputBg, border: '1px solid ' + theme.accent, borderRadius: '5px', color: theme.text, fontSize: '11px', padding: '3px 7px', fontFamily: 'system-ui,sans-serif', outline: 'none', width: '110px', flexShrink: '0', boxSizing: 'border-box' });
    gifSearchRow.appendChild(inp); inp.focus();
    function commitNewCat() {
      const val = inp.value.trim();
      if (val && !getGifTags().includes(val)) {
        if (gifRules.length > 0) { gifRules[0].tags = [...new Set([...(gifRules[0].tags || []), val])]; }
        else { gifRules.push({ trigger: ':placeholder:', url: '', enabled: false, tags: [val] }); }
        activeGifCategory = val;
      }
      newCatBtn.style.display = '';
      if (inp.parentNode) inp.parentNode.removeChild(inp);
      renderGifCategoryTabs(); renderGifList();
    }
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commitNewCat(); } if (e.key === 'Escape') { newCatBtn.style.display = ''; if (inp.parentNode) inp.parentNode.removeChild(inp); renderGifCategoryTabs(); } });
    inp.addEventListener('blur', commitNewCat);
    inp.addEventListener('mousedown', e => e.stopPropagation());
  });

  gifSearchRow.appendChild(gifSearch); gifSearchRow.appendChild(newCatBtn);
  gifScrollArea.appendChild(gifSearchRow);

  const addGRow = document.createElement('div'); Object.assign(addGRow.style, { display: 'flex', gap: '4px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' });
  const newGTrig = document.createElement('input'); newGTrig.type = 'text'; newGTrig.placeholder = ':trigger:'; newGTrig.style.flex = '1'; newGTrig.style.minWidth = '80px'; trackInput(newGTrig);
  const newGUrl = document.createElement('input'); newGUrl.type = 'text'; newGUrl.placeholder = 'GIF URL (https://...)'; newGUrl.style.flex = '2'; newGUrl.style.minWidth = '120px'; trackInput(newGUrl);
  const addGB = document.createElement('button'); addGB.type = 'button'; addGB.textContent = '+';
  Object.assign(addGB.style, { borderRadius: '5px', fontSize: '16px', padding: '3px 10px', cursor: 'pointer', flexShrink: '0', border: '1px solid' });
  reg('addGB', addGB, (el, t) => { el.style.background = t.inputBg; el.style.borderColor = t.accent; el.style.color = t.accent; });
  tip(addGB, 'Add GIF rule');
  addGB.addEventListener('mousedown', e => {
    e.preventDefault();
    const tr = newGTrig.value.trim(), url = newGUrl.value.trim();
    if (!tr || !url || gifRules.some(r => r.trigger === tr)) return;
    const autoTags = (activeGifCategory !== '__all__' && activeGifCategory !== '__presets__') ? [activeGifCategory] : [];
    gifRules.push({ trigger: tr, url, enabled: true, tags: autoTags });
    newGTrig.value = ''; newGUrl.value = '';
    renderGifCategoryTabs(); renderGifList();
  });
  addGRow.appendChild(newGTrig); addGRow.appendChild(newGUrl); addGRow.appendChild(addGB);
  gifScrollArea.appendChild(addGRow);

  const gifListDiv = document.createElement('div');
  Object.assign(gifListDiv.style, { display: 'flex', flexDirection: 'column', gap: '5px' });
  gifScrollArea.appendChild(gifListDiv);

  function renderGifList() {
    gifListDiv.innerHTML = '';
    const q = gifSearch.value.toLowerCase();
    let filtered = gifRules.map((r, i) => ({ r, i })).filter(({ r }) => {
      if (activeGifCategory === '__all__') return true;
      if (activeGifCategory === '__presets__') return isPreset(r);
      return (r.tags || []).includes(activeGifCategory);
    });
    if (q) filtered = filtered.filter(({ r }) => r.trigger.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));

    filtered.forEach(({ r: rule, i: idx }) => {
      const card = document.createElement('div');
      Object.assign(card.style, { display: 'flex', alignItems: 'flex-start', gap: '8px', borderRadius: '8px', padding: '7px 8px', background: theme.bg2, border: '1px solid ' + theme.border });

      const imgWrap = document.createElement('div');
      Object.assign(imgWrap.style, { width: '64px', height: '48px', flexShrink: '0', borderRadius: '5px', overflow: 'hidden', background: 'rgba(128,128,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' });
      imgWrap.textContent = '🎞';
      const img = new Image();
      img.onload = () => { imgWrap.textContent = ''; Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px', display: 'block' }); imgWrap.appendChild(img); };
      img.onerror = () => {};
      img.src = rule.url;
      card.appendChild(imgWrap);

      const right = document.createElement('div');
      Object.assign(right.style, { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '0' });

      const topR = document.createElement('div'); Object.assign(topR.style, { display: 'flex', alignItems: 'center', gap: '5px' });
      const tog = document.createElement('input'); tog.type = 'checkbox'; tog.checked = rule.enabled; tog.style.cursor = 'pointer'; tog.style.flexShrink = '0'; tog.style.accentColor = theme.accent;
      tog.addEventListener('change', e => { e.stopPropagation(); gifRules[idx].enabled = tog.checked; });
      const trigE = document.createElement('input'); trigE.type = 'text'; trigE.value = rule.trigger;
      Object.assign(trigE.style, { flex: '1', minWidth: '0', fontFamily: 'monospace', fontSize: '11px', padding: '3px 5px', borderRadius: '4px', outline: 'none', background: theme.inputBg, border: '1px solid ' + theme.inputBorder, color: theme.text, boxSizing: 'border-box' });
      trigE.addEventListener('change', () => { const t = trigE.value.trim(); if (t) gifRules[idx].trigger = t; });
      trigE.addEventListener('mousedown', e => e.stopPropagation());
      const delB = document.createElement('button'); delB.type = 'button'; delB.textContent = '✕';
      Object.assign(delB.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', flexShrink: '0', color: theme.danger });
      tip(delB, 'Delete GIF rule');
      delB.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); gifRules.splice(idx, 1); renderGifCategoryTabs(); renderGifList(); });
      topR.appendChild(tog); topR.appendChild(trigE); topR.appendChild(delB);

      const urlE = document.createElement('input'); urlE.type = 'text'; urlE.value = rule.url;
      Object.assign(urlE.style, { width: '100%', fontSize: '10px', fontFamily: 'monospace', padding: '3px 5px', borderRadius: '4px', outline: 'none', background: theme.inputBg, border: '1px solid ' + theme.inputBorder, color: theme.textDim, boxSizing: 'border-box' });
      urlE.addEventListener('change', () => { const u = urlE.value.trim(); if (u) { gifRules[idx].url = u; img.src = u; } });
      urlE.addEventListener('mousedown', e => e.stopPropagation());

      const tagRow = document.createElement('div');
      Object.assign(tagRow.style, { display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' });

      function renderTagPills() {
        tagRow.innerHTML = '';
        (gifRules[idx].tags || []).forEach((tag, ti) => {
          const pill = document.createElement('span');
          Object.assign(pill.style, { display: 'inline-flex', alignItems: 'center', gap: '3px', background: theme.accent + '22', border: '1px solid ' + theme.accent + '55', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontFamily: 'system-ui,sans-serif', color: theme.accent, whiteSpace: 'nowrap' });
          const tspan = document.createElement('span'); tspan.textContent = tag; pill.appendChild(tspan);
          const x = document.createElement('span'); x.textContent = '×'; Object.assign(x.style, { cursor: 'pointer', fontSize: '11px', marginLeft: '2px', color: theme.accent + '99' });
          x.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); gifRules[idx].tags.splice(ti, 1); renderTagPills(); renderGifCategoryTabs(); });
          pill.appendChild(x); tagRow.appendChild(pill);
        });
        const addTagBtn = document.createElement('button'); addTagBtn.type = 'button'; addTagBtn.textContent = '+ tag';
        Object.assign(addTagBtn.style, { background: 'transparent', border: '1px dashed ' + theme.accent + '55', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer', color: theme.accent + '88', transition: 'all 0.1s' });
        addTagBtn.addEventListener('mouseenter', () => { addTagBtn.style.borderColor = theme.accent; addTagBtn.style.color = theme.accent; });
        addTagBtn.addEventListener('mouseleave', () => { addTagBtn.style.borderColor = theme.accent + '55'; addTagBtn.style.color = theme.accent + '88'; });
        addTagBtn.addEventListener('mousedown', e => {
          e.preventDefault(); e.stopPropagation(); addTagBtn.style.display = 'none';
          const dlId = '__ium_dl_' + idx;
          let dl = document.getElementById(dlId);
          if (!dl) { dl = document.createElement('datalist'); dl.id = dlId; document.documentElement.appendChild(dl); }
          dl.innerHTML = ''; getGifTags().forEach(t => { const o = document.createElement('option'); o.value = t; dl.appendChild(o); });
          const inp = document.createElement('input'); inp.type = 'text'; inp.placeholder = 'tag…'; inp.setAttribute('list', dlId);
          Object.assign(inp.style, { background: theme.inputBg, border: '1px solid ' + theme.accent, borderRadius: '10px', color: theme.text, fontSize: '10px', padding: '1px 8px', fontFamily: 'system-ui,sans-serif', outline: 'none', width: '90px' });
          tagRow.appendChild(inp); inp.focus();
          function commitTag() {
            const val = inp.value.trim();
            if (val && !(gifRules[idx].tags || []).includes(val)) { if (!gifRules[idx].tags) gifRules[idx].tags = []; gifRules[idx].tags.push(val); }
            renderTagPills(); renderGifCategoryTabs();
          }
          inp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); } if (e.key === 'Escape') { renderTagPills(); } });
          inp.addEventListener('blur', commitTag);
          inp.addEventListener('mousedown', e => e.stopPropagation());
        });
        tagRow.appendChild(addTagBtn);
      }
      renderTagPills();

      right.appendChild(topR); right.appendChild(urlE); right.appendChild(tagRow);
      card.appendChild(right);
      gifListDiv.appendChild(card);
    });

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      Object.assign(empty.style, { textAlign: 'center', padding: '20px', fontSize: '12px', fontFamily: 'system-ui,sans-serif', color: theme.textDim, fontStyle: 'italic' });
      empty.textContent = activeGifCategory === '__all__' ? 'No GIFs yet — add one above.' : `No GIFs in "${activeGifCategory === '__presets__' ? 'Presets' : activeGifCategory}".`;
      gifListDiv.appendChild(empty);
    }
    trackedInputs.forEach(el => styleInput(el));
  }

// tab 3

  const portalPanel = tabPanels[3];

  // Top bar: source chips + search + count + view toggle
  const portalTopBar = document.createElement('div');
  Object.assign(portalTopBar.style, { flexShrink: '0', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '5px', borderBottom: '1px solid' });
  reg('portalTopBar', portalTopBar, (el, t) => { el.style.borderBottomColor = t.border; el.style.background = t.bg2; });

  // Row 1: source chips

  const portalSrcRow = document.createElement('div');
  Object.assign(portalSrcRow.style, { display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' });

  const portalSrcLabel = document.createElement('span');
  portalSrcLabel.textContent = 'SRC';
  Object.assign(portalSrcLabel.style, { fontSize: '9px', fontFamily: 'monospace', letterSpacing: '1px', flexShrink: '0' });
  reg('portalSrcLabel', portalSrcLabel, (el, t) => { el.style.color = t.textDim; });
  portalSrcRow.appendChild(portalSrcLabel);

  const portalSrcChips = document.createElement('div');
  Object.assign(portalSrcChips.style, { display: 'flex', gap: '3px', flexWrap: 'wrap', flex: '1' });
  portalSrcRow.appendChild(portalSrcChips);

  const portalAddSrcBtn = document.createElement('button'); portalAddSrcBtn.type = 'button'; portalAddSrcBtn.textContent = '+ custom';
  Object.assign(portalAddSrcBtn.style, { background: 'transparent', border: '1px dashed', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: '0' });
  reg('portalAddSrcBtn', portalAddSrcBtn, (el, t) => { el.style.borderColor = t.border; el.style.color = t.textDim; });
  portalAddSrcBtn.addEventListener('mouseenter', () => { portalAddSrcBtn.style.borderColor = theme.accent; portalAddSrcBtn.style.color = theme.accent; });
  portalAddSrcBtn.addEventListener('mouseleave', () => { portalAddSrcBtn.style.borderColor = theme.border; portalAddSrcBtn.style.color = theme.textDim; });
  portalAddSrcBtn.addEventListener('mousedown', e => { e.preventDefault(); openPortalAddSrc(); });
  portalSrcRow.appendChild(portalAddSrcBtn);
  portalTopBar.appendChild(portalSrcRow);

  // Row 2: search + count + view toggle

  const portalSearchRow = document.createElement('div');
  Object.assign(portalSearchRow.style, { display: 'flex', gap: '5px', alignItems: 'center' });

  const portalSearchInput = document.createElement('input');
  portalSearchInput.type = 'text'; portalSearchInput.placeholder = 'Search GIFs… (Enter)';
  Object.assign(portalSearchInput.style, { flex: '1', boxSizing: 'border-box', fontSize: '12px' });
  trackInput(portalSearchInput);
  let portalSearchDeb;
  portalSearchInput.addEventListener('input', () => {
    clearTimeout(portalSearchDeb);
    portalSearchDeb = setTimeout(() => { portalDoSearch(); }, 450);
  });
  portalSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearTimeout(portalSearchDeb); portalDoSearch(); }
    e.stopPropagation();
  });
  portalSearchInput.addEventListener('mousedown', e => e.stopPropagation());

  const portalCountBadge = document.createElement('span');
  Object.assign(portalCountBadge.style, { fontSize: '10px', fontFamily: 'monospace', flexShrink: '0', padding: '2px 7px', borderRadius: '50px', border: '1px solid' });
  reg('portalCountBadge', portalCountBadge, (el, t) => { el.style.color = t.accent; el.style.borderColor = t.border; el.style.background = t.bg; });
  portalCountBadge.textContent = '0';

  const portalFavBtn = document.createElement('button'); portalFavBtn.type = 'button';
  Object.assign(portalFavBtn.style, { background: 'transparent', border: '1px solid', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer', flexShrink: '0', transition: 'all 0.1s' });
  reg('portalFavBtn', portalFavBtn, (el, t) => { el.style.borderColor = t.border; el.style.color = t.textDim; });
  portalFavBtn.textContent = '❤ Saved';
  portalFavBtn.addEventListener('mousedown', e => { e.preventDefault(); portalToggleView(); });

  portalSearchRow.appendChild(portalSearchInput);
  portalSearchRow.appendChild(portalCountBadge);
  portalSearchRow.appendChild(portalFavBtn);
  portalTopBar.appendChild(portalSearchRow);
  portalPanel.appendChild(portalTopBar);

  // GIF grid area

  const portalGridWrap = document.createElement('div');
  Object.assign(portalGridWrap.style, { flex: '1', overflowY: 'auto', padding: '6px', minHeight: '0', position: 'relative' });
  portalPanel.appendChild(portalGridWrap);

  const portalLoader = document.createElement('div');
  Object.assign(portalLoader.style, { display: 'none', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '24px', fontSize: '11px', fontFamily: 'system-ui,sans-serif' });
  reg('portalLoader', portalLoader, (el, t) => { el.style.color = t.textDim; });
  const portalSpinner = document.createElement('div');
  Object.assign(portalSpinner.style, { width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderTopColor: 'transparent', animation: '__ium_spin 0.6s linear infinite', flexShrink: '0' });
  reg('portalSpinner', portalSpinner, (el, t) => { el.style.borderColor = t.border; el.style.borderTopColor = t.accent; });
  portalLoader.appendChild(portalSpinner);
  portalLoader.appendChild(document.createTextNode(' Searching…'));
  portalGridWrap.appendChild(portalLoader);

  const portalNoResults = document.createElement('div');
  Object.assign(portalNoResults.style, { display: 'none', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '40px 20px', textAlign: 'center' });
  const portalNoResultsIcon = document.createElement('div'); portalNoResultsIcon.textContent = '🔍';
  Object.assign(portalNoResultsIcon.style, { fontSize: '28px', opacity: '0.3' });
  const portalNoResultsText = document.createElement('div');
  Object.assign(portalNoResultsText.style, { fontSize: '12px', fontFamily: 'system-ui,sans-serif' });
  reg('portalNoResultsText', portalNoResultsText, (el, t) => { el.style.color = t.textDim; });
  portalNoResultsText.textContent = 'No GIFs found — try different keywords';
  portalNoResults.appendChild(portalNoResultsIcon); portalNoResults.appendChild(portalNoResultsText);
  portalGridWrap.appendChild(portalNoResults);

  const portalIntro = document.createElement('div');
  Object.assign(portalIntro.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '36px 20px', textAlign: 'center' });
  const portalIntroIcon = document.createElement('div'); portalIntroIcon.textContent = '🎭';
  Object.assign(portalIntroIcon.style, { fontSize: '32px', opacity: '0.4' });
  const portalIntroText = document.createElement('div');
  Object.assign(portalIntroText.style, { fontSize: '12px', fontFamily: 'system-ui,sans-serif', maxWidth: '240px', lineHeight: '1.5' });
  reg('portalIntroText', portalIntroText, (el, t) => { el.style.color = t.textDim; });
  portalIntroText.textContent = 'Search for GIFs above, or wait for trending to load';
  portalIntro.appendChild(portalIntroIcon); portalIntro.appendChild(portalIntroText);
  portalGridWrap.appendChild(portalIntro);

  // Inject spinner keyframe once

  const spinStyle = document.createElement('style');
  spinStyle.textContent = '@keyframes __ium_spin { to { transform: rotate(360deg); } } @keyframes __ium_cardIn { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }';
  document.head.appendChild(spinStyle);

  const portalGrid = document.createElement('div');
  Object.assign(portalGrid.style, { columns: '4', columnGap: '6px' });
  portalGridWrap.appendChild(portalGrid);

  // Bottom bar: load more

  const portalBottomBar = document.createElement('div');
  Object.assign(portalBottomBar.style, { flexShrink: '0', padding: '5px 8px', borderTop: '1px solid', display: 'none', justifyContent: 'center' });
  reg('portalBottomBar', portalBottomBar, (el, t) => { el.style.borderTopColor = t.border; el.style.background = t.bg2; });
  const portalLoadMoreBtn = document.createElement('button'); portalLoadMoreBtn.type = 'button'; portalLoadMoreBtn.textContent = 'Load more';
  Object.assign(portalLoadMoreBtn.style, { background: 'transparent', border: '1px solid', borderRadius: '50px', padding: '5px 24px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', cursor: 'pointer', transition: 'all 0.15s' });
  reg('portalLoadMoreBtn', portalLoadMoreBtn, (el, t) => { el.style.borderColor = t.border; el.style.color = t.textDim; });
  portalLoadMoreBtn.addEventListener('mouseenter', () => { portalLoadMoreBtn.style.borderColor = theme.accent; portalLoadMoreBtn.style.color = theme.accent; });
  portalLoadMoreBtn.addEventListener('mouseleave', () => { portalLoadMoreBtn.style.borderColor = theme.border; portalLoadMoreBtn.style.color = theme.textDim; });
  portalLoadMoreBtn.addEventListener('mousedown', e => { e.preventDefault(); portalLoadMore(); });
  portalBottomBar.appendChild(portalLoadMoreBtn);
  portalPanel.appendChild(portalBottomBar);

  // Add custom source inline form (hidden by default)

  const portalAddSrcForm = document.createElement('div');
  Object.assign(portalAddSrcForm.style, { display: 'none', flexShrink: '0', padding: '8px', gap: '5px', flexDirection: 'column', borderTop: '1px solid' });
  reg('portalAddSrcForm', portalAddSrcForm, (el, t) => { el.style.borderTopColor = t.border; el.style.background = t.bg2; });
  const asfTitle = document.createElement('div'); asfTitle.textContent = 'Add Custom Source';
  Object.assign(asfTitle.style, { fontSize: '11px', fontFamily: 'system-ui,sans-serif', fontWeight: '600' });
  reg('asfTitle', asfTitle, (el, t) => { el.style.color = t.text; });
  portalAddSrcForm.appendChild(asfTitle);
  const asfRow1 = document.createElement('div'); Object.assign(asfRow1.style, { display: 'flex', gap: '5px' });
  const asfName = document.createElement('input'); asfName.type = 'text'; asfName.placeholder = 'Name'; asfName.style.flex = '1'; trackInput(asfName); asfName.addEventListener('mousedown', e => e.stopPropagation());
  const asfUrl = document.createElement('input'); asfUrl.type = 'text'; asfUrl.placeholder = 'API Base URL'; asfUrl.style.flex = '3'; trackInput(asfUrl); asfUrl.addEventListener('mousedown', e => e.stopPropagation());
  asfRow1.appendChild(asfName); asfRow1.appendChild(asfUrl);
  const asfRow2 = document.createElement('div'); Object.assign(asfRow2.style, { display: 'flex', gap: '5px' });
  const asfKey = document.createElement('input'); asfKey.type = 'text'; asfKey.placeholder = 'API Key (opt)'; asfKey.style.flex = '1'; trackInput(asfKey); asfKey.addEventListener('mousedown', e => e.stopPropagation());
  const asfQp = document.createElement('input'); asfQp.type = 'text'; asfQp.placeholder = 'Query param'; asfQp.value = 'q'; asfQp.style.flex = '1'; trackInput(asfQp); asfQp.addEventListener('mousedown', e => e.stopPropagation());
  asfRow2.appendChild(asfKey); asfRow2.appendChild(asfQp);
  const asfBtnRow = document.createElement('div'); Object.assign(asfBtnRow.style, { display: 'flex', gap: '5px' });
  const asfCancel = document.createElement('button'); asfCancel.type = 'button'; asfCancel.textContent = 'Cancel';
  const asfSave = document.createElement('button'); asfSave.type = 'button'; asfSave.textContent = 'Add Source';
  [asfCancel, asfSave].forEach(b => {
    Object.assign(b.style, { flex: '1', borderRadius: '5px', fontSize: '11px', fontFamily: 'system-ui,sans-serif', padding: '5px', cursor: 'pointer', border: '1px solid' });
    b.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
  });
  reg('asfCancel', asfCancel, (el, t) => { el.style.background = t.bg; el.style.borderColor = t.border; el.style.color = t.textDim; });
  reg('asfSave', asfSave, (el, t) => { el.style.background = t.accent + '22'; el.style.borderColor = t.accent; el.style.color = t.accent; });
  asfCancel.addEventListener('click', closePortalAddSrc);
  asfSave.addEventListener('click', () => {
    const name = asfName.value.trim(), url = asfUrl.value.trim();
    if (!name || !url) return;
    portal.customSources.push({ id: 'cs_' + Date.now(), name, url, key: asfKey.value.trim(), qp: asfQp.value.trim() || 'q' });
    portalSaveStorage(); renderPortalSources(); closePortalAddSrc();
  });
  asfBtnRow.appendChild(asfCancel); asfBtnRow.appendChild(asfSave);
  portalAddSrcForm.appendChild(asfRow1); portalAddSrcForm.appendChild(asfRow2); portalAddSrcForm.appendChild(asfBtnRow);
  portalPanel.appendChild(portalAddSrcForm);

  function openPortalAddSrc() { portalAddSrcForm.style.display = 'flex'; }
  function closePortalAddSrc() { portalAddSrcForm.style.display = 'none'; asfName.value = ''; asfUrl.value = ''; asfKey.value = ''; asfQp.value = 'q'; }

  const PORTAL_BUILTIN_SOURCES = [
    { id: 'tenor', name: 'Tenor' },
    { id: 'giphy', name: 'GIPHY' },
    { id: 'stickers', name: 'Stickers' },
  ];

  function renderPortalSources() {
    portalSrcChips.innerHTML = '';
    const allSrcs = [...PORTAL_BUILTIN_SOURCES, ...portal.customSources];
    allSrcs.forEach(src => {
      const isActive = portal.activeSource === src.id;
      const chip = document.createElement('button'); chip.type = 'button'; chip.textContent = src.name;
      Object.assign(chip.style, {
        background: isActive ? theme.accent + '33' : theme.bg,
        border: '1px solid ' + (isActive ? theme.accent : theme.border),
        borderRadius: '4px', padding: '2px 9px', fontSize: '11px',
        fontFamily: 'system-ui,sans-serif', cursor: 'pointer',
        color: isActive ? theme.accent : theme.textDim,
        transition: 'all 0.1s', whiteSpace: 'nowrap',
      });
      chip.addEventListener('mouseenter', () => { if (!isActive) { chip.style.borderColor = theme.accent + '88'; chip.style.color = theme.text; } });
      chip.addEventListener('mouseleave', () => { if (!isActive) { chip.style.borderColor = theme.border; chip.style.color = theme.textDim; } });
      chip.addEventListener('mousedown', e => {
        e.preventDefault();
        portal.activeSource = src.id; portalSaveStorage();
        portal.offset = 0; portal.gifs = [];
        renderPortalSources();
        if (portal.query) portalDoSearch(); else portalLoadTrending();
      });

      // Remove button for custom

      if (src.id.startsWith('cs_')) {
        const rmBtn = document.createElement('span'); rmBtn.textContent = ' ×';
        Object.assign(rmBtn.style, { cursor: 'pointer', color: theme.danger, fontSize: '11px' });
        rmBtn.addEventListener('mousedown', e => {
          e.preventDefault(); e.stopPropagation();
          portal.customSources = portal.customSources.filter(s => s.id !== src.id);
          if (portal.activeSource === src.id) portal.activeSource = 'tenor';
          portalSaveStorage(); renderPortalSources();
        });
        chip.appendChild(rmBtn);
      }
      portalSrcChips.appendChild(chip);
    });
  }

  function stylePortalWithTheme() {

    // Re-style dynamic elements that aren't in themedEls

    renderPortalSources();
    portalFavBtn.style.borderColor = portal.view === 'favorites' ? theme.accent : theme.border;
    portalFavBtn.style.color = portal.view === 'favorites' ? theme.accent : theme.textDim;
    portalFavBtn.style.background = portal.view === 'favorites' ? theme.accent + '22' : 'transparent';
  }

  function portalSetLoading(v) { portalLoader.style.display = v ? 'flex' : 'none'; }
  function portalSetNoResults(v) { portalNoResults.style.display = v ? 'flex' : 'none'; }
  function portalSetIntro(v) { portalIntro.style.display = v ? 'flex' : 'none'; }
  function portalUpdateCount(n) { portalCountBadge.textContent = n + (n === 1 ? ' GIF' : ' GIFs'); }

  function portalToggleView() {
    portal.view = portal.view === 'search' ? 'favorites' : 'search';
    portalFavBtn.textContent = portal.view === 'favorites' ? '🔍 Search' : '❤ Saved';
    portalFavBtn.style.borderColor = portal.view === 'favorites' ? theme.accent : theme.border;
    portalFavBtn.style.color = portal.view === 'favorites' ? theme.accent : theme.textDim;
    portalFavBtn.style.background = portal.view === 'favorites' ? theme.accent + '22' : 'transparent';
    if (portal.view === 'favorites') portalRenderFavorites(); else portalRenderGrid(portal.gifs, false);
  }

  function portalRenderFavorites() {
    portalGrid.innerHTML = '';
    portalSetIntro(false); portalSetLoading(false); portalSetNoResults(false);
    portalBottomBar.style.display = 'none';
    if (portal.favorites.length === 0) {
      const empty = document.createElement('div');
      Object.assign(empty.style, { textAlign: 'center', padding: '36px 16px', fontSize: '12px', fontFamily: 'system-ui,sans-serif', color: theme.textDim, fontStyle: 'italic' });
      empty.textContent = '❤️  No favorites yet — heart a GIF!';
      portalGrid.appendChild(empty);
    } else {
      portalUpdateCount(portal.favorites.length);
      portal.favorites.forEach((gif, i) => portalAppendCard(gif, i, false));
    }
  }

  async function portalDoSearch() {
    const q = portalSearchInput.value.trim();
    portal.query = q; portal.offset = 0; portal.view = 'search';
    portalFavBtn.textContent = '❤ Saved';
    portalFavBtn.style.borderColor = theme.border; portalFavBtn.style.color = theme.textDim; portalFavBtn.style.background = 'transparent';
    portalGrid.innerHTML = ''; portal.gifs = [];
    portalSetIntro(false); portalSetNoResults(false);
    await portalFetch(false);
  }

  async function portalLoadTrending() {
    portal.query = ''; portal.offset = 0; portal.view = 'search';
    portalGrid.innerHTML = ''; portal.gifs = [];
    portalSetIntro(false); portalSetNoResults(false);
    await portalFetch(false);
  }

  async function portalLoadMore() {
    portal.offset += portal.limit;
    await portalFetch(true);
  }

  async function portalFetch(append) {
    if (portal.searching) return;
    portal.searching = true;
    portalSetLoading(true);
    try {
      let gifs = [];
      const src = portal.activeSource;
      if (src === 'giphy') gifs = await portalFetchGiphy(portal.query, portal.offset);
      else if (src === 'tenor') gifs = await portalFetchTenor(portal.query, portal.offset);
      else if (src === 'stickers') gifs = await portalFetchStickers(portal.query, portal.offset);
      else {
        const cs = portal.customSources.find(s => s.id === src);
        if (cs) gifs = await portalFetchCustom(cs, portal.query, portal.offset);
      }
      portalSetLoading(false);
      if (gifs.length === 0 && !append) { portalSetNoResults(true); portalBottomBar.style.display = 'none'; }
      else {
        portalSetNoResults(false);
        if (!append) portal.gifs = gifs; else portal.gifs = [...portal.gifs, ...gifs];
        portalRenderGrid(gifs, append);
        portal.hasMore = gifs.length >= portal.limit;
        portalBottomBar.style.display = portal.hasMore ? 'flex' : 'none';
      }
      portalUpdateCount(portal.gifs.length);
    } catch(err) {
      portalSetLoading(false);
      portalSetNoResults(true);
      console.warn('[IUM Portal]', err);
    } finally { portal.searching = false; }
  }

  async function portalFetchGiphy(query, offset) {
    if (!portal.apiKey) return [];
    const base = 'https://api.giphy.com/v1/gifs';
    const ep = query ? '/search' : '/trending';
    const p = new URLSearchParams({ api_key: portal.apiKey, limit: portal.limit, offset, rating: 'g' });
    if (query) p.set('q', query);
    const r = await fetch(`${base}${ep}?${p}`);
    if (!r.ok) throw new Error('GIPHY HTTP ' + r.status);
    const j = await r.json();
    return portalNormalizeGiphy(j.data || []);
  }

  async function portalFetchStickers(query, offset) {
    if (!portal.apiKey) return [];
    const base = 'https://api.giphy.com/v1/stickers';
    const ep = query ? '/search' : '/trending';
    const p = new URLSearchParams({ api_key: portal.apiKey, limit: portal.limit, offset, rating: 'g' });
    if (query) p.set('q', query);
    const r = await fetch(`${base}${ep}?${p}`);
    if (!r.ok) throw new Error('Stickers HTTP ' + r.status);
    const j = await r.json();
    return portalNormalizeGiphy(j.data || []);
  }

  async function portalFetchTenor(query, offset) {
    const key = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
    const ep = query ? 'search' : 'featured';
    const p = new URLSearchParams({ key, limit: portal.limit, pos: offset, media_filter: 'gif' });
    if (query) p.set('q', query);
    const r = await fetch(`https://tenor.googleapis.com/v2/${ep}?${p}`);
    if (!r.ok) throw new Error('Tenor HTTP ' + r.status);
    const j = await r.json();
    return portalNormalizeTenor(j.results || []);
  }

  async function portalFetchCustom(src, query, offset) {
    const p = new URLSearchParams({ limit: portal.limit, offset });
    if (query) p.set(src.qp, query);
    if (src.key) p.set('api_key', src.key);
    const r = await fetch(`${src.url}?${p}`);
    if (!r.ok) throw new Error(src.name + ' HTTP ' + r.status);
    const j = await r.json();
    return portalNormalizeGiphy(j.data || []);
  }

  function portalNormalizeGiphy(arr) {
    return arr.map(g => ({
      id: g.id || Math.random().toString(36),
      url: g?.images?.fixed_height?.url || g?.images?.downsized?.url || '',
      orig: g?.images?.original?.url || g?.images?.fixed_height?.url || '',
      title: g?.title || g?.slug || '',
    })).filter(g => g.url);
  }

  function portalNormalizeTenor(arr) {
    return arr.map(g => ({
      id: g.id || Math.random().toString(36),
      url: g?.media_formats?.gif?.url || g?.media_formats?.mediumgif?.url || '',
      orig: g?.media_formats?.gif?.url || '',
      title: g?.content_description || g?.title || '',
    })).filter(g => g.url);
  }

  function portalRenderGrid(gifs, append) {
    if (!append) portalGrid.innerHTML = '';
    gifs.forEach((gif, i) => portalAppendCard(gif, i, true));
  }

  function portalAppendCard(gif, i, animate) {
    const isFav = portal.favorites.some(f => f.id === gif.id);
    const card = document.createElement('div');
    Object.assign(card.style, {
      breakInside: 'avoid', marginBottom: '6px', borderRadius: '7px', overflow: 'hidden',
      position: 'relative', cursor: 'pointer', background: theme.bg2,
      border: '1px solid ' + theme.border, transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.12s',
    });
    if (animate) { card.style.animation = `__ium_cardIn 0.3s ease ${(i % 20) * 20}ms both`; }

    const img = document.createElement('img');
    img.src = gif.url; img.alt = gif.title || '';
    Object.assign(img.style, { width: '100%', display: 'block', borderRadius: '6px', transition: 'filter 0.12s' });
    img.loading = 'lazy';
    card.appendChild(img);

    // Action overlay

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
      opacity: '0', transition: 'opacity 0.12s',
    });

    function makeActBtn(label) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      Object.assign(b.style, {
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '13px', color: '#fff', transition: 'all 0.1s', flexShrink: '0', lineHeight: '1',
      });
      b.addEventListener('mousedown', e => e.stopPropagation());
      return b;
    }

    const copyBtn = makeActBtn('⎘');
    tip(copyBtn, 'Copy URL');
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      portalCopyGif(gif);
      // Flash
      const flash = document.createElement('div');
      Object.assign(flash.style, { position: 'absolute', inset: '0', background: theme.accent + '28', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontFamily: 'monospace', color: theme.accent, pointerEvents: 'none', animation: '__ium_cardIn 0.1s ease' });
      flash.textContent = 'Copied!'; card.appendChild(flash);
      setTimeout(() => flash.remove(), 800);
    });

    const favId = '__ium_fav_' + gif.id;
    const favBtn = makeActBtn(isFav ? '❤️' : '🤍');
    favBtn.id = favId;
    tip(favBtn, isFav ? 'Remove from saved' : 'Save GIF');
    favBtn.addEventListener('click', e => { e.stopPropagation(); portalToggleFav(gif, favBtn); });

    const pasteBtn = makeActBtn('↵');
    tip(pasteBtn, 'Insert into field');
    pasteBtn.style.background = 'rgba(0,0,0,0.78)';
    pasteBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (activeField) {
        insertAtCursor(activeField, gif.url, 0);
        portalAddToHistory(gif);
      }
    });

    overlay.appendChild(copyBtn); overlay.appendChild(favBtn); overlay.appendChild(pasteBtn);
    card.appendChild(overlay);

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      card.style.borderColor = theme.accent;
      img.style.filter = 'brightness(0.6)';
      overlay.style.opacity = '1';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.borderColor = theme.border;
      img.style.filter = '';
      overlay.style.opacity = '0';
    });

    portalGrid.appendChild(card);
  }

  async function portalCopyGif(gif) {
    const url = gif.orig || gif.url;
    try { await navigator.clipboard.writeText(url); } catch(_) {
      const ta = document.createElement('textarea'); ta.value = url;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    portalAddToHistory(gif);
  }

  function portalAddToHistory(gif) {
    portal.history.unshift({ id: gif.id, url: gif.url, title: gif.title, ts: Date.now() });
    if (portal.history.length > 50) portal.history = portal.history.slice(0, 50);
    portalSaveStorage();
  }

  function portalToggleFav(gif, btn) {
    const idx = portal.favorites.findIndex(f => f.id === gif.id);
    if (idx >= 0) {
      portal.favorites.splice(idx, 1);
      if (btn) btn.textContent = '🤍';
    } else {
      portal.favorites.unshift({ id: gif.id, url: gif.url, title: gif.title });
      if (btn) btn.textContent = '❤️';
    }
    portalSaveStorage();
    portalUpdateFavCount();
    if (portal.view === 'favorites') portalRenderFavorites();
  }

  function portalUpdateFavCount() {
    const n = portal.favorites.length;
    if (portal.view !== 'favorites') {
      portalFavBtn.textContent = n > 0 ? `❤ Saved (${n})` : '❤ Saved';
    }
  }

  function portalOnOpen() {
    renderPortalSources();
    stylePortalWithTheme();
    if (portal.gifs.length === 0 && portal.view === 'search') {
      portalLoadTrending();
    }
    portalUpdateFavCount();
  }

// tab 4 settings panel

  const settingsPanel = tabPanels[4];
  Object.assign(settingsPanel.style, { padding: '12px 14px' });

  function sLabel(text) {
    const l = document.createElement('div'); l.textContent = text;
    Object.assign(l.style, { fontSize: '10px', fontFamily: 'system-ui,sans-serif', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '4px', marginTop: '12px', color: theme.textLabel });
    reg('lbl_' + text, l, (el, t) => { el.style.color = t.textLabel; }); return l;
  }
  function sRow(labelTxt, ctrl, extra) {
    const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' });
    const lbl = document.createElement('span'); lbl.textContent = labelTxt;
    Object.assign(lbl.style, { fontFamily: 'system-ui,sans-serif', fontSize: '12px', flex: '1', color: theme.text });
    reg('sRowLbl_' + labelTxt, lbl, (el, t) => { el.style.color = t.text; });
    row.appendChild(lbl); row.appendChild(ctrl); if (extra) row.appendChild(extra); return row;
  }
  function mkSlider(defVal, min, max, step, onChange) {
    const wrap = document.createElement('div'); Object.assign(wrap.style, { display: 'flex', alignItems: 'center', gap: '6px' });
    const sl = document.createElement('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = defVal;
    Object.assign(sl.style, { width: '80px', cursor: 'pointer' });
    const lbl = document.createElement('span'); Object.assign(lbl.style, { fontFamily: 'monospace', fontSize: '11px', minWidth: '34px', textAlign: 'right' });
    reg('slider_lbl_' + defVal + '_' + Math.random(), lbl, (el, t) => { el.style.color = t.accent; });
    function update() { lbl.textContent = parseFloat(sl.value).toFixed(1) + 's'; onChange(parseFloat(sl.value) * 1000); }
    sl.addEventListener('input', update); update();
    wrap.appendChild(sl); wrap.appendChild(lbl); return { wrap, sl, lbl };
  }

  settingsPanel.appendChild(sLabel('Emoji Triggers'));
  const emojiToggle = document.createElement('input'); emojiToggle.type = 'checkbox'; emojiToggle.checked = emojiEnabled; emojiToggle.style.cursor = 'pointer';
  emojiToggle.addEventListener('change', () => { emojiEnabled = emojiToggle.checked; });
  settingsPanel.appendChild(sRow('Enable emoji replacement', emojiToggle));
  const { wrap: eDelayWrap, sl: eDelaySl } = mkSlider(emojiDelay / 1000, 0, 10, 0.5, v => { emojiDelay = v; });
  settingsPanel.appendChild(sRow('Emoji trigger delay', eDelayWrap));

  settingsPanel.appendChild(sLabel('GIF Triggers'));
  const gifToggle = document.createElement('input'); gifToggle.type = 'checkbox'; gifToggle.checked = gifEnabled; gifToggle.style.cursor = 'pointer';
  gifToggle.addEventListener('change', () => { gifEnabled = gifToggle.checked; });
  settingsPanel.appendChild(sRow('Enable GIF replacement', gifToggle));
  const { wrap: gDelayWrap, sl: gDelaySl } = mkSlider(gifDelay / 1000, 0, 10, 0.5, v => { gifDelay = v; });
  settingsPanel.appendChild(sRow('GIF trigger delay', gDelayWrap));

  settingsPanel.appendChild(sLabel('Font Triggers'));
  const fontSelect = document.createElement('select');
  Object.assign(fontSelect.style, {
    borderRadius: '6px', fontSize: '12px', padding: '4px 6px',
    fontFamily: 'system-ui,sans-serif', cursor: 'pointer', outline: 'none', border: '1px solid #555',
    background: '#111', color: '#fff', colorScheme: 'dark',
  });
  fontSelect.addEventListener('mousedown', e => e.stopPropagation());
  fontSelect.addEventListener('change', () => { selectFont(parseInt(fontSelect.value)); });
  settingsPanel.appendChild(sRow('Active font', fontSelect));
  const { wrap: fDelayWrap, sl: fDelaySl } = mkSlider(fontDelay / 1000, 0, 5, 0.5, v => { fontDelay = v; });
  settingsPanel.appendChild(sRow('Font apply delay (0=instant)', fDelayWrap));

  // GIF Portal API Key section

  settingsPanel.appendChild(sLabel('GIF Portal'));
  const portalKeyWrap = document.createElement('div'); Object.assign(portalKeyWrap.style, { display: 'flex', gap: '5px', marginBottom: '8px' });
  const portalKeyInp = document.createElement('input'); portalKeyInp.type = 'text'; portalKeyInp.placeholder = 'GIPHY API Key (for GIPHY/Stickers sources)';
  portalKeyInp.style.flex = '1'; portalKeyInp.value = portal.apiKey;
  trackInput(portalKeyInp); portalKeyInp.addEventListener('mousedown', e => e.stopPropagation());
  const portalKeySave = document.createElement('button'); portalKeySave.type = 'button'; portalKeySave.textContent = 'Save';
  Object.assign(portalKeySave.style, { borderRadius: '5px', fontSize: '11px', padding: '3px 10px', cursor: 'pointer', flexShrink: '0', border: '1px solid', fontFamily: 'system-ui,sans-serif' });
  reg('portalKeySave', portalKeySave, (el, t) => { el.style.background = t.accent + '22'; el.style.borderColor = t.accent; el.style.color = t.accent; });
  portalKeySave.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
  portalKeySave.addEventListener('click', () => { portal.apiKey = portalKeyInp.value.trim(); portalSaveStorage(); });
  portalKeyWrap.appendChild(portalKeyInp); portalKeyWrap.appendChild(portalKeySave);
  settingsPanel.appendChild(portalKeyWrap);

  const portalKeyNote = document.createElement('div');
  Object.assign(portalKeyNote.style, { fontSize: '10px', fontFamily: 'system-ui,sans-serif', marginBottom: '8px', lineHeight: '1.5' });
  reg('portalKeyNote', portalKeyNote, (el, t) => { el.style.color = t.textDim; });
  portalKeyNote.innerHTML = 'Free key at <a href="https://developers.giphy.com/" target="_blank" style="color:inherit;opacity:0.8">developers.giphy.com</a>. Tenor works without a key.';
  settingsPanel.appendChild(portalKeyNote);

  settingsPanel.appendChild(sLabel('Theme Presets'));
  const presetRow = document.createElement('div'); Object.assign(presetRow.style, { display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' });
  Object.entries(PRESETS).forEach(([name, p]) => {
    const isLight = name === '☀️';
    const pb = document.createElement('button'); pb.type = 'button'; pb.textContent = name;
    Object.assign(pb.style, { background: isLight ? '#e0e0e0' : p.accent + '18', border: '1px solid ' + (isLight ? '#bbb' : p.accent + '88'), borderRadius: '6px', color: isLight ? '#444' : p.accent, fontSize: '16px', fontFamily: 'system-ui,sans-serif', padding: '4px 8px', cursor: 'pointer', lineHeight: '1' });
    pb.addEventListener('mousedown', e => e.preventDefault());
    pb.addEventListener('click', () => { theme = { ...p }; syncSwatches(); applyTheme(); });
    presetRow.appendChild(pb);
  });
  settingsPanel.appendChild(presetRow);

  settingsPanel.appendChild(sLabel('Custom Colors'));
  const colorGrid = document.createElement('div');
  Object.assign(colorGrid.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginBottom: '8px' });
  const swatches = {};
  const COLOR_ROWS = [['bg', 'Panel bg'], ['bg2', 'Card bg'], ['accent', 'Accent'], ['btnActive', 'Btn active'], ['text', 'Primary text'], ['textDim', 'Secondary text'], ['tooltipBg', 'Tooltip bg'], ['tooltipText', 'Tooltip text'], ['danger', 'Danger'], ['success', 'Success']];
  COLOR_ROWS.forEach(([key, label]) => {
    const cell = document.createElement('div'); Object.assign(cell.style, { display: 'flex', alignItems: 'center', gap: '5px' });
    const sw = document.createElement('input'); sw.type = 'color'; sw.value = (theme[key] || '#ffffff').slice(0, 7);
    Object.assign(sw.style, { width: '28px', height: '22px', padding: '0', border: 'none', borderRadius: '3px', cursor: 'pointer', background: 'none', flexShrink: '0' });
    sw.addEventListener('input', () => { theme[key] = sw.value; applyTheme(); });
    sw.addEventListener('mousedown', e => e.stopPropagation());
    const lbl = document.createElement('span'); lbl.textContent = label;
    Object.assign(lbl.style, { fontFamily: 'system-ui,sans-serif', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
    reg('colorLbl_' + key, lbl, (el, t) => { el.style.color = t.textDim; });
    swatches[key] = sw; cell.appendChild(sw); cell.appendChild(lbl); colorGrid.appendChild(cell);
  });
  settingsPanel.appendChild(colorGrid);
  function syncSwatches() { COLOR_ROWS.forEach(([key]) => { if (swatches[key] && theme[key]) swatches[key].value = theme[key].slice(0, 7); }); }

  settingsPanel.appendChild(sLabel('Reset'));
  function mkWideBtn(label) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    Object.assign(b.style, { width: '100%', borderRadius: '6px', fontSize: '12px', fontFamily: 'system-ui,sans-serif', padding: '7px', cursor: 'pointer', marginBottom: '5px', border: '1px solid' });
    b.addEventListener('mousedown', e => e.preventDefault()); return b;
  }
  const resetBtn = mkWideBtn('Reset all to defaults');
  reg('resetBtn', resetBtn, (el, t) => { el.style.background = t.danger + '18'; el.style.borderColor = t.danger + '55'; el.style.color = t.danger; });
  resetBtn.addEventListener('click', () => {
    emojiRules = DEFAULT_EMOJI_RULES.map(r => ({...r, enabled: true}));
    gifRules = DEFAULT_GIF_RULES.map(r => ({...r, tags: [...(r.tags || [])]}));
    emojiEnabled = true; gifEnabled = true; emojiDelay = 1000; gifDelay = 1000; fontDelay = 0; fontMode = 0;
    theme = { ...PRESETS[DEFAULT_PRESET_NAME] }; activeGifCategory = '__all__';
    emojiToggle.checked = true; gifToggle.checked = true;
    eDelaySl.value = '1'; eDelaySl.dispatchEvent(new Event('input'));
    gDelaySl.value = '1'; gDelaySl.dispatchEvent(new Event('input'));
    fDelaySl.value = '0'; fDelaySl.dispatchEvent(new Event('input'));
    syncSwatches(); applyTheme(); refreshFontSelect(); renderFontList(); renderEmojiList(); renderGifCategoryTabs(); renderGifList();
  });
  settingsPanel.appendChild(resetBtn);
  const bpad = document.createElement('div'); bpad.style.height = '10px'; settingsPanel.appendChild(bpad);

  const coffeeLink = document.createElement('a');
  coffeeLink.href = 'https://www.paypal.com/paypalme/jordanalbiar';
  coffeeLink.target = '_blank'; coffeeLink.rel = 'noopener noreferrer';
  coffeeLink.textContent = '☕ Buy me a cup of coffee?';
  Object.assign(coffeeLink.style, {
    display: 'block', width: '100%', boxSizing: 'border-box',
    borderRadius: '6px', fontSize: '12px', fontFamily: 'system-ui,sans-serif',
    padding: '8px', cursor: 'pointer', marginBottom: '12px',
    border: '1px solid #c6953a88', background: 'rgba(198,149,58,0.1)',
    color: '#e8a830', textAlign: 'center', textDecoration: 'none',
    transition: 'background 0.15s, border-color 0.15s',
  });
  coffeeLink.addEventListener('mouseenter', () => { coffeeLink.style.background = 'rgba(198,149,58,0.2)'; coffeeLink.style.borderColor = '#c6953a'; });
  coffeeLink.addEventListener('mouseleave', () => { coffeeLink.style.background = 'rgba(198,149,58,0.1)'; coffeeLink.style.borderColor = '#c6953a88'; });
  coffeeLink.addEventListener('mousedown', e => e.stopPropagation());
  settingsPanel.appendChild(coffeeLink);

  // import and export

  function doExport() {
    const data = {
      version: 11, theme, emojiEnabled, emojiDelay, gifEnabled, gifDelay, fontDelay, fontMode,
      fonts: fonts.map(f => ({ name: f.name, emoji: f.emoji, sample: f.sample, map: f.map, ...(f.suffix ? { suffix: f.suffix } : {}) })),
      emojiRules: emojiRules.map(r => ({ trigger: r.trigger, emoji: r.emoji, enabled: r.enabled })),
      gifRules: gifRules.map(r => ({ trigger: r.trigger, url: r.url, enabled: r.enabled, tags: r.tags || [] })),
      portal: { apiKey: portal.apiKey, activeSource: portal.activeSource, customSources: portal.customSources, favorites: portal.favorites },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'input-utility-module.json'; a.click();
    URL.revokeObjectURL(url);
  }

  const importFile = document.createElement('input'); importFile.type = 'file'; importFile.accept = '.json,application/json'; importFile.style.display = 'none';
  importFile.addEventListener('change', () => {
    const f = importFile.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.fonts) fonts = d.fonts;
        if (d.emojiRules) emojiRules = d.emojiRules.map(r => ({...r, enabled: r.enabled !== false}));
        if (d.gifRules) gifRules = d.gifRules.map(r => ({...r, enabled: r.enabled !== false, tags: r.tags || []}));
        if (d.theme) { Object.assign(theme, d.theme); syncSwatches(); }
        if (typeof d.emojiEnabled === 'boolean') { emojiEnabled = d.emojiEnabled; emojiToggle.checked = emojiEnabled; }
        if (typeof d.gifEnabled === 'boolean') { gifEnabled = d.gifEnabled; gifToggle.checked = gifEnabled; }
        if (typeof d.emojiDelay === 'number') { emojiDelay = d.emojiDelay; eDelaySl.value = String(emojiDelay / 1000); eDelaySl.dispatchEvent(new Event('input')); }
        if (typeof d.gifDelay === 'number') { gifDelay = d.gifDelay; gDelaySl.value = String(gifDelay / 1000); gDelaySl.dispatchEvent(new Event('input')); }
        if (typeof d.fontDelay === 'number') { fontDelay = d.fontDelay; fDelaySl.value = String(fontDelay / 1000); fDelaySl.dispatchEvent(new Event('input')); }
        if (typeof d.fontMode === 'number') fontMode = d.fontMode;
        if (d.portal) {
          if (d.portal.apiKey) { portal.apiKey = d.portal.apiKey; portalKeyInp.value = portal.apiKey; }
          if (d.portal.activeSource) portal.activeSource = d.portal.activeSource;
          if (d.portal.customSources) portal.customSources = d.portal.customSources;
          if (d.portal.favorites) portal.favorites = d.portal.favorites;
          portalSaveStorage();
        }
        activeGifCategory = '__all__';
        applyTheme(); refreshFontSelect(); renderFontList(); renderEmojiList(); renderGifCategoryTabs(); renderGifList();
      } catch (e) { alert('Invalid settings file.'); }
    };
    reader.readAsText(f); importFile.value = '';
  });
  document.documentElement.appendChild(importFile);
  function doImport() { importFile.click(); }

// button and menus lifecycle

  function positionBtn(el) {
    if (!el) return;
    const r = el.getBoundingClientRect(), pad = 5;
    btn.style.left = `${r.right - 28 - pad}px`; btn.style.top = `${r.bottom - 28 - pad}px`;
    hoverZone.style.left = `${r.right - 48}px`; hoverZone.style.top = `${r.bottom - 48}px`;
  }
  function centerMenu() {
    if (menuX === null) {
      const w = Math.min(window.innerWidth * 0.70, 700), h = window.innerHeight * 0.65;
      menu.style.left = ((window.innerWidth - w) / 2) + 'px'; menu.style.top = ((window.innerHeight - h) / 2) + 'px';
      menu.style.width = w + 'px'; menu.style.height = h + 'px'; menu.style.transform = 'none';
    } else {
      menu.style.left = menuX + 'px'; menu.style.top = menuY + 'px';
      if (menuW) menu.style.width = menuW + 'px'; if (menuH) menu.style.height = menuH + 'px';
      menu.style.transform = 'none';
    }
  }
  function updateBtnAppearance() {
    if (fontMode === 0) {
      btn.textContent = 'A'; btn.style.background = theme.btnBg; btn.style.borderColor = theme.border;
      btn.style.color = theme.text; btn.style.fontStyle = 'italic'; btn.style.fontWeight = 'bold';
      btn.style.fontFamily = 'Georgia,serif'; btn.style.outline = 'none';
    } else {
      btn.textContent = fonts[fontMode - 1]?.emoji || 'A'; btn.style.background = theme.btnActive; btn.style.borderColor = theme.accent;
      btn.style.color = theme.text; btn.style.fontStyle = 'normal'; btn.style.fontWeight = 'normal';
      btn.style.fontFamily = 'inherit'; btn.style.outline = `2px solid ${theme.accent}55`;
    }
    refreshFontSelect();
  }
  updateBtnAppearance();

  function revealBtn() { btn.style.display = 'flex'; requestAnimationFrame(() => { btn.style.opacity = '1'; }); resetAutoHide(); }
  function concealBtn() { btn.style.opacity = '0'; clearAutoHide(); setTimeout(() => { if (btn.style.opacity === '0' && !menuOpen) btn.style.display = 'none'; }, 400); }
  function resetAutoHide() { clearAutoHide(); autoHideTimer = setTimeout(() => { if (!menuOpen) concealBtn(); }, 5000); }
  function clearAutoHide() { clearTimeout(autoHideTimer); autoHideTimer = null; }

  hoverZone.addEventListener('mouseenter', revealBtn);
  hoverZone.addEventListener('touchstart', revealBtn, { passive: true });
  btn.addEventListener('mouseenter', () => clearAutoHide());
  btn.addEventListener('mouseleave', () => { if (!menuOpen) resetAutoHide(); });

  function openMenu() {
    menuOpen = true;
    renderFontList(); renderEmojiList(); renderGifCategoryTabs(); renderGifList(); refreshFontSelect();
    centerMenu(); menu.style.display = 'flex';
    clearAutoHide(); revealBtn();
  }
  function closeMenu() { menuOpen = false; menu.style.display = 'none'; resetAutoHide(); if (activeField) activeField.focus(); }
  function selectFont(idx) { fontMode = idx; updateBtnAppearance(); renderFontList(); }

  btn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); if (menuOpen) closeMenu(); else openMenu(); });
  window.addEventListener('resize', () => { if (activeField) positionBtn(activeField); }, { passive: true });
  window.addEventListener('scroll', () => { if (activeField) positionBtn(activeField); }, { passive: true });

// input handeling

  function onKeydown(e) {
    if (fontMode === 0) return;
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    const font = fonts[fontMode - 1]; if (!font) return;
    if (fontDelay === 0) { e.preventDefault(); insertStyledChar(e.currentTarget, e.key, font); }
  }

  function cancelTimer(map, field) { const t = map.get(field); if (t) { clearTimeout(t.timer); map.delete(field); } }

  function onInputForTriggers(e) {
    const field = e.currentTarget;
    cancelTimer(emojiTimers, field); cancelTimer(gifTimers, field);
    const { text, cursor } = getFieldText(field);
    const textBefore = text.slice(0, cursor);

    if (emojiEnabled) {
      const rx = buildRegex(emojiRules);
      if (rx) {
        const m = textBefore.match(rx);
        if (m) {
          const trigger = m[1];
          const rule = emojiRules.find(r => r.enabled && r.trigger === trigger);
          if (rule) {
            const timer = setTimeout(() => {
              emojiTimers.delete(field);
              const { text: cur2, cursor: cc2 } = getFieldText(field);
              if (!cur2.slice(0, cc2).endsWith(trigger)) return;
              insertAtCursor(field, rule.emoji, trigger.length);
            }, emojiDelay);
            emojiTimers.set(field, { timer, trigger });
          }
        }
      }
    }

    if (gifEnabled) {
      const rx = buildRegex(gifRules);
      if (rx) {
        const m = textBefore.match(rx);
        if (m) {
          const trigger = m[1];
          const rule = gifRules.find(r => r.enabled && r.trigger === trigger);
          if (rule) {
            const timer = setTimeout(() => {
              gifTimers.delete(field);
              const { text: cur2, cursor: cc2 } = getFieldText(field);
              if (!cur2.slice(0, cc2).endsWith(trigger)) return;
              insertAtCursor(field, rule.url, trigger.length);
            }, gifDelay);
            gifTimers.set(field, { timer, trigger });
          }
        }
      }
    }
  }

  function getTextField(el) {
    if (!el) return null;
    if (el === btn || menu.contains(el) || el === hoverZone) return null;
    if (el.tagName === 'TEXTAREA') return el;
    if (el.tagName === 'INPUT') { const t = (el.type || 'text').toLowerCase(); if (['text', 'search', 'url', 'email', 'password', 'tel', 'number', ''].includes(t)) return el; }
    if (isContentEditable(el)) {
      let node = el;
      while (node.parentElement && isContentEditable(node.parentElement) && !menu.contains(node.parentElement)) node = node.parentElement;
      return node;
    }
    return null;
  }
  function onFocusIn(e) {
    const el = getTextField(e.target); if (!el) return;
    if (activeField && activeField !== el) { activeField.removeEventListener('keydown', onKeydown); activeField.removeEventListener('input', onInputForTriggers); cancelTimer(emojiTimers, activeField); cancelTimer(gifTimers, activeField); }
    activeField = el; el.addEventListener('keydown', onKeydown); el.addEventListener('input', onInputForTriggers);
    clearTimeout(focusTimer); positionBtn(el); hoverZone.style.display = 'block';
    if (fontMode !== 0) revealBtn();
  }
  function onFocusOut(e) {
    if (menu.contains(e.relatedTarget) || e.relatedTarget === btn || e.relatedTarget === hoverZone) return;
    focusTimer = setTimeout(() => {
      const af = document.activeElement;
      if (af && getTextField(af)) return;
      if (menuOpen) return;
      concealBtn(); hoverZone.style.display = 'none';
      if (activeField) { activeField.removeEventListener('keydown', onKeydown); activeField.removeEventListener('input', onInputForTriggers); cancelTimer(emojiTimers, activeField); cancelTimer(gifTimers, activeField); activeField = null; }
    }, 200);
  }
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);

  function refreshFontSelect() {
    fontSelect.innerHTML = '';
    const off = document.createElement('option'); off.value = '0'; off.textContent = '— Off —';
    off.style.background = '#111'; off.style.color = '#fff'; fontSelect.appendChild(off);
    fonts.forEach((f, i) => {
      const o = document.createElement('option'); o.value = String(i + 1); o.textContent = f.emoji + ' ' + f.name;
      o.style.background = '#111'; o.style.color = '#fff'; fontSelect.appendChild(o);
    });
    fontSelect.value = String(fontMode);
    fontSelect.style.background = '#111'; fontSelect.style.color = '#fff'; fontSelect.style.borderColor = '#555';
  }

 // boot
  switchTab(0);
  renderFontList();
  renderEmojiList();
  renderGifCategoryTabs();
  renderGifList();
  renderPortalSources();
  refreshFontSelect();
  syncSwatches();
  applyTheme();
  const initField = getTextField(document.activeElement);
  if (initField) onFocusIn({ target: initField });
  console.log('[Input Utility Module] v11.0.0 with GIF Portal loaded ✓');

})();
