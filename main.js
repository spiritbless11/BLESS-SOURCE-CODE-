/* ==========================================================================
   STATE & VARIABLES DE CONFIGURATION
   ========================================================================== */
let currentCode = '';
let currentTheme = 'normal';
let currentMode = 'dark';
let activeTab = 'code';
let activeMediaTab = 'images';
let isPlaying = false;
let isMuted = false;
let currentPlaylistTrack = 'funk'; // 'funk' ou 'synth'
let matrixRAF = null;
let canvasRAF = null;
let sitesCount = parseInt(localStorage.getItem('bl-sites') || '0');
let linesCount = parseInt(localStorage.getItem('bl-lines') || '0');

// Configuration Globale des Paramètres (Settings)
const DEFAULT_SETTINGS = {
  fontSize: '12px',
  wordWrap: false,
  lineNumbers: true,
  preferredProxy: '0',
  customProxy: '',
  musicSource: 'funk',
  autoplay: true
};
let settings = JSON.parse(localStorage.getItem('bl-settings') || JSON.stringify(DEFAULT_SETTINGS));

// Parser and Search variables
let parsedData = null;
let searchMatches = [];
let currentSearchIndex = -1;

// Audio System (Web Audio API & HTML5 Audio)
const audio = document.getElementById('playerAudio');
let audioCtx = null;
let audioAnalyser = null;
let sourceMedia = null;
let synthNode = null;
let visualizerInterval = null;
let isAudioInitialized = false;

// Theme configuration details (TD)
const TD = {
  normal: {
    badge: 'CODE VIEWER', welcome: 'Bienvenue sur', title: 'BLESS SOURCE CODE',
    tag: 'HTML • CSS • JAVASCRIPT • ANALYSE', tName: 'BLESS PRIME NEXUS DEV',
    tSub: 'Source Code Viewer', footer: 'BLESS PRIME NEXUS DEV',
    loading: 'RÉCUPÉRATION DU CODE', banner: '◈',
    mTitle: 'BLESS TECH FUNK MIX', mArtist: 'BLESS PRIME NEXUS DEV',
    toast: '⚡ Thème Normal activé'
  },
  escanor: {
    badge: '☀ PRIDE', welcome: 'La puissance du Soleil,', title: 'BLESS SOURCE CODE',
    tag: '☀ HTML • CSS • JS • DIVINE POWER ☀', tName: 'BLESS PRIME NEXUS DEV',
    tSub: 'The One Who Stands in the Sunlight', footer: 'THE LION\'S SIN OF PRIDE',
    loading: 'PUISSANCE SOLAIRE', banner: '☀',
    mTitle: 'SOLAR FUNK CHORD', mArtist: 'THE LION\'S SIN OF PRIDE',
    toast: '☀ Escanor — Qui en a décidé ainsi ? C\'est moi.'
  },
  hacker: {
    badge: '[ROOT_ACCESS]', welcome: '> user@bless ~ $', title: 'BLESS_SOURCE.EXE',
    tag: '> INIT... HTML | CSS | JS | PAYLOAD', tName: 'B L E S S _ D E V',
    tSub: '> root@nexus:~$ ./run', footer: 'BLESSING_LUSAKUMUNU.exe',
    loading: 'INJECTING PAYLOAD', banner: '>',
    mTitle: 'TERMINAL_GRID.wav', mArtist: 'root@nexus',
    toast: '[✓] ACCÈS ROOT AUTORISÉ'
  },
  horror: {
    badge: '☠ MAUDIT', welcome: 'Les ténèbres t\'accueillent...', title: 'BLESS SOURCE CODE',
    tag: '✝ HTML • CSS • JS • MAGIE NOIRE ✝', tName: 'BLESS PRIME NEXUS DEV',
    tSub: 'Le code murmure dans le noir', footer: 'LORD OF DARKNESS',
    loading: 'INVOCATION DU CODE', banner: '☠',
    mTitle: 'HORROR BEAT REQUIEM', mArtist: 'CREATURE OF THE NIGHT',
    toast: '☠ Horror — Fuis avant qu\'il ne soit trop tard'
  },
  cyberpunk: {
    badge: '⚡ CYBERPUNK', welcome: 'SYS_INIT // NEON_CORE', title: 'BLESS_CYBER_LINK',
    tag: '☣ HTML5 | CSS3 | ES6 | GLITCH_MODE ☣', tName: 'NEXUS_CYBER_DEV',
    tSub: 'Holographic Source Stream v4.0', footer: 'NEON RUNNER',
    loading: 'COMPILING HOLO STREAM', banner: '❖',
    mTitle: 'NEON WAVE DRIVE', mArtist: 'CYBER WRITER',
    toast: '⚡ Cyberpunk — Welcome to the Neon Grid'
  },
  aqua: {
    badge: '🌊 AQUA', welcome: 'Plongée abyssale...', title: 'BLESS AQUA ARCHIVE',
    tag: '🌊 HTML • CSS • JS • FLUID ENGINE 🌊', tName: 'AQUA NEXUS ARCHITECT',
    tSub: 'Deep Ocean Source Extractor', footer: 'OCEAN DEEP LABS',
    loading: 'FILTRATION DES SITES', banner: '⚓',
    mTitle: 'SUBMARINE DIVE RESONANCE', mArtist: 'BLUE ABYSS ENGINE',
    toast: '🌊 Aqua — Mode aquatique fluide'
  },
  cosmos: {
    badge: '✦ COSMOS', welcome: 'Vers l\'infini stellaire...', title: 'BLESS STELLAR SCANNER',
    tag: '✦ HTML • CSS • JS • NEBULA GRID ✦', tName: 'COSMIC NEXUS SURVEYOR',
    tSub: 'Scanning the Galactic Web', footer: 'COSMIC TRAVELER',
    loading: 'GRAVITATIONAL FETCHING', banner: '✦',
    mTitle: 'CELESTIAL HARMONICS', mArtist: 'STELLAR WIND ORCHESTRA',
    toast: '✦ Cosmos — Voyage au cœur du code'
  },
  luxury: {
    badge: '⚜ LUXURY', welcome: 'L\'élégance du développement,', title: 'BLESS GOLD OBSIDIAN',
    tag: '⚜ PREMIUM PLATFORM • SOURCE EXTRACTION ⚜', tName: 'BLESSING LUSAKUMUNU',
    tSub: 'High-End Web Architecture', footer: 'NEXUS LUXE STUDIOS',
    loading: 'ORFEVRERIE DU CODE', banner: '⚜',
    mTitle: 'GOLD REVERB AMBIANCE', mArtist: 'ROYAL SYMPHONY PIANO',
    toast: '⚜ Luxury — L\'excellence à l\'état pur'
  }
};

/* ==========================================================================
   THEME SYSTEM & INTERFACE
   ========================================================================== */
function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update theme buttons UI
  document.querySelectorAll('.th-opt').forEach(o => o.classList.remove('active'));
  const map = { normal: 'tn', escanor: 'te', hacker: 'th', horror: 'thr', cyberpunk: 'tcp', aqua: 'taq', cosmos: 'tcs', luxury: 'tux' };
  document.querySelector('.' + map[theme])?.classList.add('active');

  // Load language settings dynamically
  const d = TD[theme] || TD.normal;
  document.getElementById('heroBadge').textContent = d.badge;
  document.getElementById('heroWelcome').textContent = d.welcome;
  document.getElementById('heroTitle').textContent = d.title;
  document.getElementById('heroTag').textContent = d.tag;
  document.getElementById('tName').textContent = d.tName;
  document.getElementById('tSub').textContent = d.tSub;
  document.getElementById('footerName').textContent = d.footer;
  document.getElementById('loadingText').textContent = d.loading;
  document.getElementById('heroBannerInner').textContent = d.banner;
  
  // Track details update only if user hasn't modified track name or currently playing synth
  if (currentPlaylistTrack === 'synth') {
    document.getElementById('musicTitle').textContent = d.mTitle;
    document.getElementById('musicArtist').textContent = d.mArtist;
  }

  // Handle matrix vs regular particles canvas
  const mc = document.getElementById('matrixCanvas');
  const bc = document.getElementById('bgCanvas');
  if (theme === 'hacker') {
    if (mc) mc.style.display = 'block';
    if (bc) bc.style.display = 'none';
    startMatrix();
    if (canvasRAF) { cancelAnimationFrame(canvasRAF); canvasRAF = null; }
  } else {
    if (mc) mc.style.display = 'none';
    if (bc) bc.style.display = 'block';
    if (matrixRAF) { cancelAnimationFrame(matrixRAF); matrixRAF = null; }
    initParticles();
  }

  // Update real-time synthesizer theme if active
  if (isPlaying && currentPlaylistTrack === 'synth') {
    startProceduralSynth();
  }

  localStorage.setItem('bl-theme', theme);
  showToast(d.toast);
}

function toggleMode() {
  currentMode = currentMode === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-mode', currentMode);
  document.getElementById('modeBtn').innerHTML = currentMode === 'dark'
    ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  localStorage.setItem('bl-mode', currentMode);
  showToast(currentMode === 'dark' ? '🌙 Mode sombre activé' : '☀ Mode clair activé');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t.timeout);
  t.timeout = setTimeout(() => t.classList.remove('show'), 3500);
}

function openMenu() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeMenu() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function handleLogout() {
  localStorage.removeItem('bl-logged-in');
  localStorage.removeItem('bl-user-email');
  localStorage.removeItem('bl-user-role');
  localStorage.removeItem('bl-user-uid');
  showToast('👋 Déconnexion réussie ! A bientôt.');
  setTimeout(() => {
    window.location.href = 'auth.html';
  }, 1000);
}

// ==========================================================================
// GESTION DU TIROIR DES PARAMÈTRES (SETTINGS)
// ==========================================================================
function openSettings() {
  updateSettingsUI();
  document.getElementById('settingsDrawer').classList.add('open');
  document.getElementById('settingsOverlay').classList.add('open');
}

function closeSettings() {
  document.getElementById('settingsDrawer').classList.remove('open');
  document.getElementById('settingsOverlay').classList.remove('open');
}

function applySettings() {
  // 1. Taille de police de l'éditeur
  document.documentElement.style.setProperty('--code-fs', settings.fontSize);
  
  // 2. Word Wrap (retour automatique à la ligne)
  const cc = document.getElementById('codeContent');
  if (cc) {
    if (settings.wordWrap) {
      cc.classList.add('wrap-text');
    } else {
      cc.classList.remove('wrap-text');
    }
  }
  
  // 3. Numéros de ligne
  if (cc) {
    if (settings.lineNumbers) {
      cc.classList.remove('hide-ln');
    } else {
      cc.classList.add('hide-ln');
    }
  }
  
  // 4. Source audio par défaut
  if (settings.musicSource === 'synth') {
    currentPlaylistTrack = 'synth';
    const pBtn = document.getElementById('playlistToggleBtn');
    if (pBtn) pBtn.innerHTML = '<i class="fas fa-microchip"></i> Synthé';
  } else {
    currentPlaylistTrack = 'funk';
    const pBtn = document.getElementById('playlistToggleBtn');
    if (pBtn) pBtn.innerHTML = '<i class="fas fa-music"></i> Funk';
  }
}

function applySetting(key, val) {
  settings[key] = val;
  localStorage.setItem('bl-settings', JSON.stringify(settings));
  applySettings();
  showToast('⚙️ Paramètre mis à jour avec succès');
}

function updateSettingsUI() {
  const fsSel = document.getElementById('settingFontSize');
  const wwChk = document.getElementById('settingWordWrap');
  const lnChk = document.getElementById('settingLineNumbers');
  const pxSel = document.getElementById('settingPreferredProxy');
  const pxInp = document.getElementById('settingCustomProxy');
  const muSel = document.getElementById('settingMusicSource');
  const apChk = document.getElementById('settingAutoplay');
  
  if (fsSel) fsSel.value = settings.fontSize;
  if (wwChk) wwChk.checked = settings.wordWrap;
  if (lnChk) lnChk.checked = settings.lineNumbers;
  if (pxSel) pxSel.value = settings.preferredProxy;
  if (pxInp) pxInp.value = settings.customProxy;
  if (muSel) muSel.value = settings.musicSource;
  if (apChk) apChk.checked = settings.autoplay;
}

function clearPlatformStats() {
  if (confirm('Voulez-vous vraiment réinitialiser toutes les statistiques d\'analyse ?')) {
    localStorage.setItem('bl-sites', '0');
    localStorage.setItem('bl-lines', '0');
    sitesCount = 0;
    linesCount = 0;
    
    const sitesVal = document.getElementById('sitesVal');
    const linesVal = document.getElementById('linesVal');
    if (sitesVal) sitesVal.textContent = '0';
    if (linesVal) linesVal.textContent = '0';
    
    updateStats();
    showToast('🗑️ Statistiques réinitialisées !');
    closeSettings();
  }
}

/* Tab Management */
function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeContent = document.getElementById('tab-' + tabId);
  if (activeContent) activeContent.classList.add('active');
}

function switchMediaTab(subTabId) {
  activeMediaTab = subTabId;
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-sub-tab') === subTabId) btn.classList.add('active');
  });
  document.querySelectorAll('.sub-tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const activePanel = document.getElementById('panel-' + subTabId);
  if (activePanel) activePanel.classList.add('active');
}

/* ==========================================================================
   CANVAS ANIMATION ENGINE (PARTICLES & MATRIX)
   ========================================================================== */
function startMatrix() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const fs = 14;
  const cols = Math.floor(canvas.width / fs) + 1;
  const drops = new Array(cols).fill(1);
  const chars = '01アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ</>{}[];#$%&=|_';
  
  if (matrixRAF) cancelAnimationFrame(matrixRAF);

  function draw() {
    ctx.fillStyle = 'rgba(0,8,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fs + 'px Share Tech Mono';
    for (let i = 0; i < drops.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.globalAlpha = Math.random() > 0.90 ? 1 : 0.65;
      ctx.fillStyle = Math.random() > 0.96 ? '#ffffff' : '#00ff41';
      ctx.fillText(ch, i * fs, drops[i] * fs);
      if (drops[i] * fs > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    ctx.globalAlpha = 1;
    matrixRAF = requestAnimationFrame(draw);
  }
  matrixRAF = requestAnimationFrame(draw);
}

function initParticles() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.removeEventListener('resize', resize);
  window.addEventListener('resize', resize);

  const pts = [];
  const maxPts = 45;
  for (let i = 0; i < maxPts; i++) {
    pts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.45,
      dy: (Math.random() - 0.5) * 0.45,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.05,
      a: Math.random() * 0.45 + 0.1
    });
  }

  const palettes = {
    normal: ['rgba(245,196,0,', 'rgba(0,71,171,', 'rgba(204,0,13,'],
    escanor: ['rgba(255,200,0,', 'rgba(255,100,0,', 'rgba(255,160,30,'],
    horror: ['rgba(180,0,0,', 'rgba(120,0,0,', 'rgba(50,0,0,'],
    cyberpunk: ['rgba(255,0,127,', 'rgba(0,240,255,', 'rgba(155,93,229,'],
    aqua: ['rgba(0,245,212,', 'rgba(0,180,216,', 'rgba(144,224,239,'],
    cosmos: ['rgba(255,0,255,', 'rgba(138,43,226,', 'rgba(0,255,255,'],
    luxury: ['rgba(212,175,55,', 'rgba(250,249,246,', 'rgba(140,110,30,']
  };

  if (canvasRAF) cancelAnimationFrame(canvasRAF);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = palettes[currentTheme] || palettes.normal;
    
    // Draw background effects based on themes
    if (currentTheme === 'normal') {
      // Draw lines between close particles (network graph)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dist = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,71,171,${(1 - dist/100) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      
      ctx.beginPath();
      
      // Shape rendering based on theme styles
      if (currentTheme === 'luxury') {
        // Render luxury star / diamond sparkles
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.angle);
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.lineTo(0, -pt.r * 2.5);
          ctx.lineTo(pt.r * 0.7, 0);
          ctx.rotate(Math.PI / 2);
        }
        ctx.closePath();
        ctx.fillStyle = p[i % p.length] + pt.a + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(212,175,55,0.4)';
        ctx.fill();
        ctx.restore();
        pt.angle += pt.spinSpeed;
      } else if (currentTheme === 'cyberpunk') {
        // Render digital square nodes
        ctx.rect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
        ctx.fillStyle = p[i % p.length] + pt.a + ')';
        ctx.fill();
      } else if (currentTheme === 'escanor') {
        // Warm rising solar flares
        ctx.arc(pt.x, pt.y, pt.r * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p[i % p.length] + (pt.a * 0.8) + ')';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255,80,0,0.6)';
        ctx.fill();
      } else {
        // Standard circle particles
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = p[i % p.length] + pt.a + ')';
        ctx.fill();
      }
      
      // Particle physics movement
      if (currentTheme === 'escanor' || currentTheme === 'horror') {
        // Rise up (hot air/fire theme)
        pt.y += pt.dy - 0.35;
        pt.x += pt.dx;
        if (pt.y < -10) { pt.y = canvas.height + 10; pt.x = Math.random() * canvas.width; }
      } else if (currentTheme === 'aqua') {
        // Bubble wobbling and floating up
        pt.y += pt.dy - 0.4;
        pt.x += pt.dx + Math.sin(pt.y / 20) * 0.15;
        if (pt.y < -10) { pt.y = canvas.height + 10; pt.x = Math.random() * canvas.width; }
      } else {
        // Normal bounding box float
        pt.x += pt.dx;
        pt.y += pt.dy;
        if (pt.x < 0 || pt.x > canvas.width) pt.dx *= -1;
        if (pt.y < 0 || pt.y > canvas.height) pt.dy *= -1;
      }
    }
    canvasRAF = requestAnimationFrame(draw);
  }
  canvasRAF = requestAnimationFrame(draw);
}

/* ==========================================================================
   HTML PARSING ENGINE (ADVANCED)
   ========================================================================== */
function parseHTML(htmlString, pageUrl) {
  const data = {
    title: 'Sans titre',
    description: 'Aucune description meta détectée.',
    favicon: '',
    og: { title: '', description: '', image: '', site_name: '' },
    headings: [],
    images: [],
    scripts: [],
    stylesheets: [],
    links: [],
    sizes: { html: htmlString.length, css: 0, js: 0 }
  };

  // 1. Extract Title
  const titleMatch = htmlString.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) data.title = titleMatch[1].trim();

  // 2. Resolve Hostname
  let hostname = 'source.html';
  try { hostname = new URL(pageUrl).hostname; } catch(e) {}

  // 3. Match Meta Tags (regex)
  const metaRegex = /<meta\b([^>]*?)>/gi;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(htmlString)) !== null) {
    const content = getAttrValue(metaMatch[1], 'content');
    const name = getAttrValue(metaMatch[1], 'name');
    const property = getAttrValue(metaMatch[1], 'property');

    if (!content) continue;

    if (name === 'description') data.description = content;
    
    // Open Graph
    if (property === 'og:title') data.og.title = content;
    if (property === 'og:description') data.og.description = content;
    if (property === 'og:image') data.og.image = resolveUrl(content, pageUrl);
    if (property === 'og:site_name') data.og.site_name = content;
  }

  // Fallback OG details from general tags
  if (!data.og.title) data.og.title = data.title;
  if (!data.og.description) data.og.description = data.description;
  if (!data.og.site_name) data.og.site_name = hostname;

  // 4. Extract Headings (H1 to H6)
  const headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(htmlString)) !== null) {
    const text = headingMatch[2].replace(/<\/?[^>]+(>|$)/g, "").trim(); // Strip tags inside heading
    if (text) {
      data.headings.push({ tag: headingMatch[1].toLowerCase(), text: text });
    }
  }

  // 5. Extract Images
  const imgRegex = /<img\b([^>]*?)>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(htmlString)) !== null) {
    const src = getAttrValue(imgMatch[1], 'src');
    const alt = getAttrValue(imgMatch[1], 'alt') || '';
    if (src) {
      data.images.push({ src: resolveUrl(src, pageUrl), alt: alt });
    }
  }

  // 6. Extract Scripts & Stylesheet Links
  const scriptRegex = /<script\b([^>]*?)>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(htmlString)) !== null) {
    const src = getAttrValue(scriptMatch[1], 'src');
    if (src) {
      data.scripts.push(resolveUrl(src, pageUrl));
    } else {
      // Inline JS size
      data.sizes.js += scriptMatch[2].length;
    }
  }

  const linkRegex = /<link\b([^>]*?)>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(htmlString)) !== null) {
    const rel = getAttrValue(linkMatch[1], 'rel');
    const href = getAttrValue(linkMatch[1], 'href');
    if (href) {
      if (rel === 'stylesheet') {
        data.stylesheets.push(resolveUrl(href, pageUrl));
      } else if (rel && rel.includes('icon')) {
        data.favicon = resolveUrl(href, pageUrl);
      }
    }
  }

  // Extract inline CSS size
  const styleBlockRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  while ((styleMatch = styleBlockRegex.exec(htmlString)) !== null) {
    data.sizes.css += styleMatch[1].length;
  }

  // 7. Extract Anchors/Links
  const anchorRegex = /<a\b([^>]*?)>/gi;
  let anchorMatch;
  while ((anchorMatch = anchorRegex.exec(htmlString)) !== null) {
    const href = getAttrValue(anchorMatch[1], 'href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      data.links.push(resolveUrl(href, pageUrl));
    }
  }

  // Filter unique values for arrays
  data.scripts = [...new Set(data.scripts)];
  data.stylesheets = [...new Set(data.stylesheets)];
  data.links = [...new Set(data.links)];
  
  // Remove duplicates from images based on resolved URL
  const seenImgs = new Set();
  data.images = data.images.filter(img => {
    if (seenImgs.has(img.src)) return false;
    seenImgs.add(img.src);
    return true;
  });

  return data;
}

// Utility to parse attribute values inside HTML tag string
function getAttrValue(tagContent, attrName) {
  const regex = new RegExp(`\\b${attrName}\\s*=\\s*(?:([\\'"])(.*?)\\1|([^\\s>]+))`, 'i');
  const match = tagContent.match(regex);
  if (match) {
    return match[2] !== undefined ? match[2] : match[3];
  }
  return null;
}

// Resolve relative links to absolute URL
function resolveUrl(url, base) {
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return url.startsWith('//') ? 'https:' + url : url;
  }
  try {
    return new URL(url, base).href;
  } catch (e) {
    return url;
  }
}

/* ==========================================================================
   SYNTAX HIGHLIGHTER (LIGHTWEIGHT REGEX FOR THEMES)
   ========================================================================== */
function highlightHTML(code) {
  // Convert basic symbols
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Temporary storage to prevent highlighting tags inside comments
  const comments = [];
  escaped = escaped.replace(/&lt;!--([\s\S]*?)--&gt;/g, (match) => {
    comments.push(match);
    return `___COMMENT_${comments.length - 1}___`;
  });

  // Regular expression to highlight tags and attributes
  escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9:-]+)([\s\S]*?)&gt;/g, (match, tagName, attrs) => {
    let highlightedAttrs = attrs;
    if (attrs.trim()) {
      // Match attrName="attrValue" or attrName='attrValue'
      highlightedAttrs = attrs.replace(/([a-zA-Z0-9:-]+)\s*=\s*([\'"])([\s\S]*?)\2/g, (m, name, quote, val) => {
        return ` <span class="hl-attr">${name}</span>=<span class="hl-str">${quote}${val}${quote}</span>`;
      });
    }
    return `&lt;<span class="hl-tag">${tagName}</span>${highlightedAttrs}&gt;`;
  });

  // Inject comments back
  escaped = escaped.replace(/___COMMENT_(\d+)___/g, (match, idx) => {
    return `<span class="hl-comm">${comments[idx]}</span>`;
  });

  // Special entities
  escaped = escaped.replace(/(&amp;[a-zA-Z0-9#]+;)/g, '<span class="hl-spec">$1</span>');

  return escaped;
}

/* Display highlighted code onto lines container */
function displayCode(code) {
  const cont = document.getElementById('codeContent');
  if (!cont) return;
  cont.innerHTML = '';
  
  const frag = document.createDocumentFragment();
  const lines = code.split('\n');
  
  lines.forEach((line, i) => {
    const row = document.createElement('div');
    row.className = 'code-line';
    row.id = `cl-${i}`;
    
    const num = document.createElement('span');
    num.className = 'ln';
    num.textContent = i + 1;
    
    const txt = document.createElement('span');
    txt.className = 'lt';
    txt.innerHTML = line || ' '; // Already contains HTML tags of highlighter
    
    row.appendChild(num);
    row.appendChild(txt);
    frag.appendChild(row);
  });
  cont.appendChild(frag);
}

/* ==========================================================================
   CODE SEARCH ENGINE
   ========================================================================== */
function handleSearchInput(e) {
  const query = e.target.value;
  searchCode(query);
}

function searchCode(query) {
  // Clear previous highlights
  const container = document.getElementById('codeContent');
  if (!container || !currentCode) return;
  
  // Remove highlighted classes
  const prevMatches = container.querySelectorAll('.hl-search-match, .hl-search-match-active');
  prevMatches.forEach(el => {
    el.outerHTML = el.textContent; // Unwrap span
  });

  searchMatches = [];
  currentSearchIndex = -1;
  document.getElementById('searchCount').textContent = '0/0';

  if (!query || query.length < 2) return;

  const lines = currentCode.split('\n');
  const queryEscaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape regex chars
  const regex = new RegExp(`(${queryEscaped})`, 'gi');

  lines.forEach((line, lineIdx) => {
    if (regex.test(line)) {
      searchMatches.push({ lineIndex: lineIdx, text: line });
      
      // Find the line element and highlight occurrences in it
      const lineEl = document.getElementById(`cl-${lineIdx}`)?.querySelector('.lt');
      if (lineEl) {
        // Strip out existing highlight tags temporarily, apply query matches, re-render
        // To be safe and simple, we wrap the matching string using safe innerHTML regex replacement
        // Note: the lineEl already contains HTML tag elements from highlightHTML
        // So search queries might clash with HTML tag tags. To prevent this, we search only within TEXT nodes.
        highlightTextNodes(lineEl, regex);
      }
    }
  });

  if (searchMatches.length > 0) {
    currentSearchIndex = 0;
    updateSearchUI();
    scrollToMatch(currentSearchIndex);
  }
}

// Safely highlight text inside DOM nodes without destroying outer spans
function highlightTextNodes(element, regex) {
  const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodesToReplace = [];
  
  while (node = walk.nextNode()) {
    if (regex.test(node.nodeValue)) {
      nodesToReplace.push(node);
    }
  }

  nodesToReplace.forEach(textNode => {
    const parent = textNode.parentNode;
    const val = textNode.nodeValue;
    const frag = document.createDocumentFragment();
    const parts = val.split(regex);
    
    parts.forEach(part => {
      if (regex.test(part)) {
        const span = document.createElement('span');
        span.className = 'hl-search-match';
        span.textContent = part;
        frag.appendChild(span);
      } else if (part) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    
    parent.replaceChild(frag, textNode);
  });
}

function updateSearchUI() {
  const countDisp = document.getElementById('searchCount');
  if (searchMatches.length === 0) {
    countDisp.textContent = '0/0';
    return;
  }
  countDisp.textContent = `${currentSearchIndex + 1}/${searchMatches.length}`;

  // Update active highlighted elements
  const allHighlights = document.getElementById('codeContent').querySelectorAll('.hl-search-match');
  allHighlights.forEach((hl, i) => {
    hl.classList.remove('hl-search-match-active');
  });

  // Find matches belonging to the active line index
  const activeLineIdx = searchMatches[currentSearchIndex].lineIndex;
  const activeLineEl = document.getElementById(`cl-${activeLineIdx}`);
  if (activeLineEl) {
    const activeHighlights = activeLineEl.querySelectorAll('.hl-search-match');
    activeHighlights.forEach(hl => {
      hl.classList.add('hl-search-match-active');
    });
  }
}

function searchNext() {
  if (searchMatches.length === 0) return;
  currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
  updateSearchUI();
  scrollToMatch(currentSearchIndex);
}

function searchPrev() {
  if (searchMatches.length === 0) return;
  currentSearchIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
  updateSearchUI();
  scrollToMatch(currentSearchIndex);
}

function scrollToMatch(idx) {
  if (idx < 0 || idx >= searchMatches.length) return;
  const lineIdx = searchMatches[idx].lineIndex;
  const row = document.getElementById(`cl-${lineIdx}`);
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* ==========================================================================
   ANALYSIS & MEDIA GALLERY GENERATORS
   ========================================================================== */
function renderAnalysisTab(data) {
  // 1. OpenGraph Telegram Mockup card
  document.getElementById('ogSiteName').textContent = data.og.site_name || 'SITE PUBLIC';
  document.getElementById('ogTitle').textContent = data.og.title || data.title;
  document.getElementById('ogDesc').textContent = data.og.description || data.description;
  const ogImg = document.getElementById('ogImg');
  if (data.og.image) {
    ogImg.src = data.og.image;
    ogImg.style.display = 'block';
  } else {
    ogImg.style.display = 'none';
  }

  // 2. Headings outline tree
  const treeContainer = document.getElementById('headingsTree');
  treeContainer.innerHTML = '';
  if (data.headings.length === 0) {
    treeContainer.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px;">Aucun titre H1-H6 détecté sur la page.</div>';
  } else {
    data.headings.forEach(h => {
      const el = document.createElement('div');
      el.className = `h-tree-item ${h.tag}`;
      
      const badge = document.createElement('span');
      badge.className = 'h-tree-badge';
      badge.textContent = h.tag.toUpperCase();
      
      const text = document.createElement('span');
      text.className = 'h-tree-txt';
      text.textContent = h.text;
      text.title = h.text;

      el.appendChild(badge);
      el.appendChild(text);
      treeContainer.appendChild(el);
    });
  }

  // 3. SEO Checklist Items
  const checklist = document.getElementById('seoChecklist');
  checklist.innerHTML = '';

  const checks = [
    {
      title: 'Titre de page (Title Tag)',
      value: data.title !== 'Sans titre',
      passDesc: `Présent : "${data.title}" (${data.title.length} caractères)`,
      failDesc: 'Manquant : La balise &lt;title&gt; est absente ou vide.'
    },
    {
      title: 'Meta Description',
      value: data.description !== 'Aucune description meta détectée.',
      passDesc: `Présent : "${data.description.substring(0, 75)}..." (${data.description.length} caractères)`,
      failDesc: 'Manquant : Balise de description meta absente pour les moteurs de recherche.'
    },
    {
      title: 'Balise de Titre H1',
      value: data.headings.some(h => h.tag === 'h1'),
      passDesc: `Détecté : La page possède ${data.headings.filter(h => h.tag === 'h1').length} balise(s) H1.`,
      failDesc: 'Manquant : La page devrait contenir au moins un titre principal &lt;h1&gt;.'
    },
    {
      title: 'Images avec Attribut Alt',
      value: data.images.length === 0 || data.images.every(img => img.alt !== ''),
      passDesc: `Optimum : Toutes les images détectées (${data.images.length}) ont un texte alternatif (Alt).`,
      failDesc: `Avertissement : Certaines images (${data.images.filter(img => img.alt === '').length}/${data.images.length}) n'ont pas d'attribut "alt".`
    },
    {
      title: 'Favicon',
      value: data.favicon !== '',
      passDesc: 'Présent : Favicon détectée.',
      failDesc: 'Manquant : Pas d\'icône de raccourci (favicon) détectée.'
    },
    {
      title: 'Protocole OpenGraph',
      value: data.og.image !== '' && data.og.title !== '',
      passDesc: 'Présent : Les tags OpenGraph essentiels sont implémentés.',
      failDesc: 'Incomplet : Données OpenGraph manquantes pour le partage sur Telegram/WhatsApp.'
    }
  ];

  checks.forEach(c => {
    const card = document.createElement('div');
    card.className = 'seo-check-item';

    const ico = document.createElement('div');
    ico.className = `seo-check-ico ${c.value ? 'pass' : 'fail'}`;
    ico.innerHTML = c.value ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-triangle"></i>';

    const info = document.createElement('div');
    info.className = 'seo-check-info';
    
    const title = document.createElement('div');
    title.className = 'seo-check-title';
    title.textContent = c.title;

    const desc = document.createElement('div');
    desc.className = 'seo-check-desc';
    desc.innerHTML = c.value ? c.passDesc : c.failDesc;

    info.appendChild(title);
    info.appendChild(desc);
    card.appendChild(ico);
    card.appendChild(info);
    checklist.appendChild(card);
  });
}

function renderMediaTab(data) {
  // 1. Gallery
  const gal = document.getElementById('mediaGallery');
  gal.innerHTML = '';
  if (data.images.length === 0) {
    gal.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;width:100%;grid-column:1/-1;padding:24px;">Aucune image détectée sur la page.</div>';
  } else {
    data.images.forEach((img, idx) => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.onclick = () => openLightbox(img.src, img.alt || 'image');

      const elImg = document.createElement('img');
      elImg.className = 'gallery-img';
      elImg.src = img.src;
      elImg.loading = 'lazy';
      // If error loading, show a replacement placeholder icon
      elImg.onerror = () => {
        elImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="%234a5070" d="M19,5V19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M14.14,11.86L11.14,15.73L9,13.14L6,17H18L14.14,11.86Z"/></svg>';
      };

      const hov = document.createElement('div');
      hov.className = 'gallery-hover-action';
      hov.innerHTML = '<i class="fas fa-expand"></i>';

      card.appendChild(elImg);
      card.appendChild(hov);
      gal.appendChild(card);
    });
  }

  // Helper lists generator
  function makeList(containerId, listData) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    if (listData.length === 0) {
      cont.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:16px;">Aucune ressource dans cette catégorie.</div>';
      return;
    }
    listData.forEach(item => {
      const card = document.createElement('div');
      card.className = 'res-card';

      const info = document.createElement('div');
      info.className = 'res-info';

      const name = document.createElement('div');
      name.className = 'res-name';
      try { name.textContent = new URL(item).pathname.split('/').pop() || 'resource'; } 
      catch(e) { name.textContent = item; }

      const link = document.createElement('div');
      link.className = 'res-link';
      link.textContent = item;

      const act = document.createElement('a');
      act.className = 'res-act';
      act.href = item;
      act.target = '_blank';
      act.rel = 'noopener noreferrer';
      act.innerHTML = '<i class="fas fa-external-link-alt"></i>';

      info.appendChild(name);
      info.appendChild(link);
      card.appendChild(info);
      card.appendChild(act);
      cont.appendChild(card);
    });
  }

  makeList('scriptList', data.scripts);
  makeList('styleList', data.stylesheets);
  makeList('linkList', data.links);
}

function renderStatsTab(data) {
  // Compute file size representation
  const htmlSize = data.sizes.html;
  const cssSize = data.sizes.css;
  const jsSize = data.sizes.js;
  const total = htmlSize + cssSize + jsSize;

  const htmlPct = total ? Math.round((htmlSize / total) * 100) : 0;
  const cssPct = total ? Math.round((cssSize / total) * 100) : 0;
  const jsPct = total ? Math.round((jsSize / total) * 100) : 0;

  // 1. Set SVG circular dashboard (HTML size focus as main circle)
  const ring = document.getElementById('chartFillRing');
  if (ring) {
    // Circle circumference = 2 * PI * r = 2 * Math.PI * 50 = 314
    const pct = total ? Math.round((htmlSize / total) * 100) : 0;
    const val = 314 - (314 * pct) / 100;
    ring.style.strokeDasharray = '314';
    ring.style.strokeDashoffset = val;
    ring.style.stroke = 'var(--accent)';
  }
  document.getElementById('chartNum').textContent = htmlPct + '%';

  // Legend values
  document.getElementById('legHtmlVal').textContent = `${(htmlSize / 1024).toFixed(1)} KB (${htmlPct}%)`;
  document.getElementById('legCssVal').textContent = `${(cssSize / 1024).toFixed(1)} KB (${cssPct}%)`;
  document.getElementById('legJsVal').textContent = `${(jsSize / 1024).toFixed(1)} KB (${jsPct}%)`;

  // 2. Bar meters progress
  function setMeter(fillId, labelId, count, percent, color) {
    const fill = document.getElementById(fillId);
    const lbl = document.getElementById(labelId);
    if (fill) {
      fill.style.width = percent + '%';
      fill.style.backgroundColor = color;
    }
    if (lbl) {
      lbl.textContent = `${count} items (${percent}%)`;
    }
  }

  setMeter('meterHtmlBar', 'meterHtmlVal', data.headings.length, htmlPct, 'var(--accent)');
  setMeter('meterCssBar', 'meterCssVal', data.stylesheets.length, cssPct, 'var(--primary)');
  setMeter('meterJsBar', 'meterJsVal', data.scripts.length, jsPct, 'var(--btn)');
  setMeter('meterMediaBar', 'meterMediaVal', data.images.length, 100, '#00c853'); // Always green/media
}

/* Lightbox Modal Actions */
function openLightbox(src, alt) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const title = document.getElementById('lightboxTitle');
  const dlBtn = document.getElementById('lightboxDownloadBtn');

  if (!modal || !img) return;

  img.src = src;
  title.textContent = alt || 'image';
  
  // Configure download link
  dlBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = alt || 'download';
    a.target = '_blank';
    a.click();
  };

  modal.classList.add('show');
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.remove('show');
}

/* ==========================================================================
   CODE SHARING / DOWNLOAD FILES
   ========================================================================== */
function copyCode() {
  if (!currentCode) { showToast('Aucun code à copier'); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(currentCode)
      .then(() => showToast('✓ Code copié dans le presse-papiers !'))
      .catch(() => fallbackCopy());
  } else {
    fallbackCopy();
  }
}

function fallbackCopy() {
  const ta = document.createElement('textarea');
  ta.value = currentCode;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('✓ Code copié !');
  } catch (e) {
    showToast('✗ Erreur de copie');
  }
  document.body.removeChild(ta);
}

function downloadCode() {
  if (!currentCode) { showToast('Aucun code à télécharger'); return; }
  const fn = document.getElementById('codeFname').textContent || 'source';
  const b = new Blob([currentCode], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = fn + '.html';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('✓ Téléchargement lancé !');
}

/* ==========================================================================
   FETCH & CORS PROXY MANAGER
   ========================================================================== */
const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(u)}`,
  u => `https://cors-anywhere.herokuapp.com/${u}`
];

// Visual state helper for proxies
function updateProxyUI(index, status) {
  const node = document.getElementById(`proxyNode-${index}`);
  if (node) {
    node.className = `proxy-node ${status}`;
  }
}

function resetProxyUI() {
  for (let i = 0; i < PROXIES.length; i++) {
    const node = document.getElementById(`proxyNode-${i}`);
    if (node) node.className = 'proxy-node';
  }
}

async function fetchWithFallback(url) {
  const errors = [];
  resetProxyUI();

  // Reconstruire l'ordre des proxies à essayer
  let proxiesToTry = [];

  // 1. Ajouter le proxy personnalisé en priorité absolue si configuré
  if (settings.customProxy && settings.customProxy.trim()) {
    const customPrefix = settings.customProxy.trim();
    proxiesToTry.push({
      index: -1,
      name: "Proxy Personnalisé",
      fn: u => customPrefix.includes('url=') ? `${customPrefix}${encodeURIComponent(u)}` : `${customPrefix}${u}`
    });
  }

  // 2. Ajouter le proxy préféré
  const preferredIdx = parseInt(settings.preferredProxy || '0');
  proxiesToTry.push({
    index: preferredIdx,
    name: `Proxy Préféré (${preferredIdx + 1})`,
    fn: PROXIES[preferredIdx]
  });

  // 3. Ajouter les autres proxies restants
  for (let i = 0; i < PROXIES.length; i++) {
    if (i !== preferredIdx) {
      proxiesToTry.push({
        index: i,
        name: `Proxy ${i + 1}`,
        fn: PROXIES[i]
      });
    }
  }

  // Essayer chaque proxy dans l'ordre défini
  for (let step = 0; step < proxiesToTry.length; step++) {
    const p = proxiesToTry[step];
    try {
      if (p.index >= 0) {
        updateProxyUI(p.index, 'active');
      }
      
      const proxyUrlName = p.index >= 0 ? `Proxy ${p.index + 1}` : "Proxy Personnalisé";
      document.getElementById('loadingSub').textContent = `Essai avec ${proxyUrlName}...`;
      
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 9000);
      
      const res = await fetch(p.fn(url), { signal: ctrl.signal });
      clearTimeout(tid);
      
      if (!res.ok) {
        if (p.index >= 0) updateProxyUI(p.index, 'error');
        errors.push(`${proxyUrlName}: HTTP ${res.status}`);
        continue;
      }
      
      const text = await res.text();
      if (!text || text.length < 80) {
        if (p.index >= 0) updateProxyUI(p.index, 'error');
        errors.push(`${proxyUrlName}: contenu vide/trop court`);
        continue;
      }
      if (text.includes('Access Denied') || text.includes('403 Forbidden') || text.includes('Cloudflare')) {
        if (p.index >= 0) updateProxyUI(p.index, 'error');
        errors.push(`${proxyUrlName}: blocage Cloudflare/CORS`);
        continue;
      }
      
      if (p.index >= 0) updateProxyUI(p.index, 'success');
      return text;
    } catch (e) {
      if (p.index >= 0) updateProxyUI(p.index, 'error');
      errors.push(`${p.name}: ${e.message}`);
    }
  }
  
  throw new Error(`Tous les proxies ont échoué. Détails des erreurs : \n- ${errors.join('\n- ')}`);
}

async function handleAnalyze() {
  const inp = document.getElementById('urlInput');
  let url = inp.value.trim();
  if (!url) { showToast('⚠ Entrez une URL d\'abord'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const loading = document.getElementById('loading');
  const codeDisplay = document.getElementById('codeDisplay');
  const successInfo = document.getElementById('successInfo');
  const errorInfo = document.getElementById('errorInfo');

  // Clear states
  loading.classList.add('show');
  codeDisplay.classList.remove('show');
  successInfo.classList.remove('show');
  errorInfo.classList.remove('show');
  
  // Clear search query
  document.getElementById('codeSearch').value = '';
  searchMatches = [];
  document.getElementById('searchCount').textContent = '0/0';

  document.getElementById('btnLabel').textContent = '...';
  document.getElementById('btnIcon').className = 'fas fa-circle-notch fa-spin';

  try {
    const html = await fetchWithFallback(url);
    
    // Parse Page Data
    parsedData = parseHTML(html, url);
    
    // Process formatting and code highlighting
    const formatted = formatHTML(html);
    currentCode = formatted;
    const highlighted = highlightHTML(formatted);
    const lines = formatted.split('\n').length;

    // Save globally
    sitesCount++;
    linesCount += lines;
    localStorage.setItem('bl-sites', sitesCount);
    localStorage.setItem('bl-lines', linesCount);
    updateStats();

    // Render elements
    displayCode(highlighted);
    renderAnalysisTab(parsedData);
    renderMediaTab(parsedData);
    renderStatsTab(parsedData);

    try {
      document.getElementById('codeFname').textContent = new URL(url).hostname;
    } catch(e) {
      document.getElementById('codeFname').textContent = 'source.html';
    }

    loading.classList.remove('show');
    codeDisplay.classList.add('show');
    document.getElementById('successMsg').textContent = `${lines} lignes extraites et analysées avec succès !`;
    successInfo.classList.add('show');
    showToast(`✓ ${lines} lignes de code extraites !`);
    
    // Open code tab automatically
    switchTab('code');

  } catch (err) {
    loading.classList.remove('show');
    document.getElementById('errorMsg').textContent = err.message;
    errorInfo.classList.add('show');
    showToast('✗ Analyse échouée');
  }

  document.getElementById('btnLabel').textContent = 'ANALYSER';
  document.getElementById('btnIcon').className = 'fas fa-search';
}

function formatHTML(html) {
  let out = '', indent = 0;
  const voids = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)/i;
  const lines = html.replace(/>\s+</g, '>\n<').split('\n');
  for (let raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    const isClose = /^<\/\w/.test(t);
    const isOpen = /^<[^\/!?][^>]*[^\/]>$/.test(t) && !voids.test(t.slice(1));
    const isSelfClose = /\/>$/.test(t) || /^<!/.test(t) || voids.test(t.slice(1));
    if (isClose) indent = Math.max(0, indent - 1);
    out += '  '.repeat(indent) + t + '\n';
    if (isOpen && !isSelfClose) indent++;
  }
  return out.trimEnd();
}

function updateStats() {
  const sCount = document.getElementById('sitesVal');
  const lCount = document.getElementById('linesVal');
  if (sCount) sCount.textContent = sitesCount;
  if (lCount) {
    lCount.textContent = linesCount > 9999
      ? (linesCount / 1000).toFixed(1) + 'k' : linesCount;
  }
}

/* ==========================================================================
   HYBRID AUDIO SYSTEM (MP3 PLAYER & WEB AUDIO PROCEDURAL SYNTH)
   ========================================================================== */
function togglePlaylistTrack() {
  // Toggle playlist tracks: default MP3 ('funk') vs Synth ambient ('synth')
  const playlistBtn = document.getElementById('playlistToggleBtn');
  if (currentPlaylistTrack === 'funk') {
    currentPlaylistTrack = 'synth';
    playlistBtn.innerHTML = '<i class="fas fa-microchip"></i> Synthé';
    showToast('🎵 Source : Synthétiseur Thématique');
    
    // Stop MP3 if playing
    if (isPlaying) {
      audio.pause();
      // Start Synth
      startProceduralSynth();
    }
  } else {
    currentPlaylistTrack = 'funk';
    playlistBtn.innerHTML = '<i class="fas fa-music"></i> Funk';
    showToast('🎵 Source : BLESS FUNK MIX');
    
    // Stop Synth if playing
    if (isPlaying) {
      stopProceduralSynth();
      // Play MP3
      audio.play().catch(() => {});
    }
  }
  
  // Update UI metadata
  const d = TD[currentTheme] || TD.normal;
  if (currentPlaylistTrack === 'synth') {
    document.getElementById('musicTitle').textContent = d.mTitle;
    document.getElementById('musicArtist').textContent = d.mArtist;
  } else {
    document.getElementById('musicTitle').textContent = 'BLESS FUNK MIX';
    document.getElementById('musicArtist').textContent = 'BLESS PRIME NEXUS DEV';
  }
}

function initAudioSystem() {
  if (isAudioInitialized) return;
  
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    audioAnalyser = audioCtx.createAnalyser();
    audioAnalyser.fftSize = 64; // High frequency speed, fewer bars
    
    // Media source mapping
    sourceMedia = audioCtx.createMediaElementSource(audio);
    sourceMedia.connect(audioAnalyser);
    audioAnalyser.connect(audioCtx.destination);
    
    isAudioInitialized = true;
    startEqualizerAnimation();
  } catch (e) {
    console.warn('AudioContext blocks direct media connections or CORS constraints active.', e);
    // Equalizer will fallback to simulated css animation loop
    isAudioInitialized = true;
    startEqualizerAnimation();
  }
}

function togglePlay() {
  initAudioSystem();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (isPlaying) {
    setPlayerState(false);
    if (currentPlaylistTrack === 'funk') {
      audio.pause();
    } else {
      stopProceduralSynth();
    }
  } else {
    setPlayerState(true);
    if (currentPlaylistTrack === 'funk') {
      audio.play().catch(() => {
        setPlayerState(false);
        showToast('🎵 Autorisez la lecture média');
      });
    } else {
      startProceduralSynth();
    }
  }
}

function setPlayerState(playing) {
  isPlaying = playing;
  const icon = document.getElementById('playIcon');
  const art = document.getElementById('musicArt');
  const bars = document.querySelectorAll('.eq-b');
  
  if (playing) {
    icon.className = 'fas fa-pause';
    art.classList.add('spin');
    bars.forEach(b => b.classList.remove('paused'));
  } else {
    icon.className = 'fas fa-play';
    art.classList.remove('spin');
    bars.forEach(b => b.classList.add('paused'));
  }
}

function muteToggle() {
  isMuted = !isMuted;
  audio.muted = isMuted;
  
  if (synthNode) {
    // If synth is active, modulate gain to 0
    const mainGain = synthNode.querySelector ? synthNode.querySelector('GainNode') : null;
    // We can handle mute toggle inside synth through main gain node control
  }
  
  document.getElementById('muteIcon').className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  showToast(isMuted ? '🔇 Son coupé' : '🔊 Son activé');
}

function setVol(v) {
  audio.volume = v / 100;
  // If synth is active, update volume dynamically
  if (synthNode && synthNode.gainNode) {
    synthNode.gainNode.gain.setValueAtTime(v / 100 * 0.25, audioCtx.currentTime); // keep max 0.25 limit to prevent clipping
  }
}

function restartTrack() {
  if (currentPlaylistTrack === 'funk') {
    audio.currentTime = 0;
    if (!isPlaying) togglePlay();
  } else {
    if (isPlaying) {
      stopProceduralSynth();
      startProceduralSynth();
    }
  }
  showToast('⟳ Redémarré');
}

function seekAudio(e) {
  if (currentPlaylistTrack === 'synth') return; // Synth is infinite/real-time
  if (!audio.duration) return;
  const rect = document.getElementById('progressWrap').getBoundingClientRect();
  audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration;
}

/* Equalizer Rendering */
function startEqualizerAnimation() {
  if (visualizerInterval) clearInterval(visualizerInterval);
  
  const bars = document.querySelectorAll('.eq-b');
  const freqData = new Uint8Array(bars.length);

  function renderVisualizer() {
    if (!isPlaying) return;

    if (audioAnalyser && currentPlaylistTrack === 'funk') {
      audioAnalyser.getByteFrequencyData(freqData);
      bars.forEach((bar, idx) => {
        // Map frequency byte to percentage height
        const heightVal = Math.max(10, Math.min(100, Math.round((freqData[idx] / 255) * 100)));
        bar.style.transform = `scaleY(${heightVal / 100})`;
      });
    } else if (isPlaying) {
      // Procedural Synth Visualizer or Fallback: smooth sinusoidal waves
      const t = Date.now() * 0.003;
      bars.forEach((bar, idx) => {
        const heightVal = Math.round(50 + Math.sin(t + idx * 0.8) * 35 + Math.random() * 10);
        bar.style.transform = `scaleY(${heightVal / 100})`;
      });
    }
  }

  visualizerInterval = setInterval(renderVisualizer, 60);
}

/* ==========================================================================
   WEB AUDIO API PROCEDURAL THEME SYNTHESIZER
   ========================================================================== */
function startProceduralSynth() {
  stopProceduralSynth();
  if (!audioCtx) return;

  // Make sure AudioContext is running
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const volVal = parseInt(document.getElementById('volSlider').value) / 100;

  // Create base Gain Node
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(isMuted ? 0 : volVal * 0.25, audioCtx.currentTime);

  const nodes = [];

  // Theme Synthesizer Engine
  if (currentTheme === 'normal') {
    // Tech chord: warm sine waves + high sweep LFO
    const freqs = [110, 165, 220, 330];
    freqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      oscGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      nodes.push(osc);
    });

    // Add slow LFO filter filter
    const noise = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    noise.type = 'triangle';
    noise.frequency.setValueAtTime(440, audioCtx.currentTime);
    
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime); // very slow sweep
    lfoGain.gain.setValueAtTime(200, audioCtx.currentTime);

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    noise.connect(filter);
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start();
    lfo.start();
    nodes.push(noise, lfo);
  } 
  else if (currentTheme === 'escanor') {
    // Escanor: Solar divine golden pad
    // Major chords and rising bright frequencies
    const freqs = [130.81, 164.81, 196.00, 261.63, 329.63]; // C Major
    freqs.forEach((f, idx) => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      
      // Modulate volume slightly to sound warm/shimmering
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.5 + idx * 0.1, audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      
      oscGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    });
  } 
  else if (currentTheme === 'hacker') {
    // Hacker: low-frequency sawtooth computer hum + random terminal typing clicks
    const sub = audioCtx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A

    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(120, audioCtx.currentTime);

    const humGain = audioCtx.createGain();
    humGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

    sub.connect(lp);
    lp.connect(humGain);
    humGain.connect(masterGain);
    sub.start();
    nodes.push(sub);

    // Beeping typing sounds at random intervals
    const typers = setInterval(() => {
      if (!isPlaying || currentTheme !== 'hacker') return;
      
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      
      osc.type = 'sine';
      // Pick random retro frequencies
      const freq = Math.random() > 0.8 ? 1200 : (400 + Math.random() * 600);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      g.gain.setValueAtTime(0.015, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.08);
      
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      setTimeout(() => { osc.stop(); }, 100);
    }, 180);
    
    // Save timer key to stop it later
    masterGain.typersTimer = typers;
  } 
  else if (currentTheme === 'horror') {
    // Horror: Heartbeat double pulse sub bass + creepy minor third drone
    // Double pulse loop
    const heart = setInterval(() => {
      if (!isPlaying || currentTheme !== 'horror') return;
      
      // Double beat
      for (let offset of [0, 250]) {
        setTimeout(() => {
          if (!isPlaying || currentTheme !== 'horror') return;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(60, audioCtx.currentTime);
          
          g.gain.setValueAtTime(0.4, audioCtx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
          
          osc.connect(g);
          g.connect(masterGain);
          osc.start();
          setTimeout(() => osc.stop(), 250);
        }, offset);
      }
    }, 1200);

    masterGain.heartTimer = heart;

    // Creepy minor third drone
    const drone1 = audioCtx.createOscillator();
    const drone2 = audioCtx.createOscillator();
    const dGain = audioCtx.createGain();

    drone1.type = 'sine';
    drone1.frequency.setValueAtTime(146.83, audioCtx.currentTime); // D3
    drone2.type = 'sine';
    drone2.frequency.setValueAtTime(174.61, audioCtx.currentTime); // F3 (Minor 3rd)

    dGain.gain.setValueAtTime(0.07, audioCtx.currentTime);

    drone1.connect(dGain);
    drone2.connect(dGain);
    dGain.connect(masterGain);

    drone1.start();
    drone2.start();
    nodes.push(drone1, drone2);
  } 
  else if (currentTheme === 'cyberpunk') {
    // Cyberpunk: Detuned sawtooth wave bass pad + ticking rhythm
    const freqs = [73.42, 110.00, 146.83]; // D2, A2, D3
    freqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 1.5, audioCtx.currentTime); // detuned
      
      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(250, audioCtx.currentTime);

      g.gain.setValueAtTime(0.08, audioCtx.currentTime);

      osc.connect(lp);
      lp.connect(g);
      g.connect(masterGain);
      osc.start();
      nodes.push(osc);
    });
  } 
  else if (currentTheme === 'aqua') {
    // Aqua: Ocean waves (filtered white noise) + bubble sounds
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime); // slow wave LFO
    lfoGain.gain.setValueAtTime(150, audioCtx.currentTime);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.16, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    
    noise.connect(lp);
    lp.connect(noiseGain);
    noiseGain.connect(masterGain);

    noise.start();
    lfo.start();
    nodes.push(noise, lfo);

    // Aqua bubbles
    const bubbler = setInterval(() => {
      if (!isPlaying || currentTheme !== 'aqua') return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      
      osc.type = 'sine';
      const baseFreq = 150 + Math.random() * 200;
      osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, audioCtx.currentTime + 0.35); // pitch sweep up

      g.gain.setValueAtTime(0.025, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.35);

      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      setTimeout(() => osc.stop(), 400);
    }, 600);

    masterGain.bubbleTimer = bubbler;
  } 
  else if (currentTheme === 'cosmos') {
    // Cosmos: cosmic space ambient sweep
    const freqs = [147, 220, 294];
    freqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      
      const sweep = audioCtx.createOscillator();
      const sweepGain = audioCtx.createGain();
      sweep.frequency.setValueAtTime(0.06, audioCtx.currentTime); // ultra slow LFO
      sweepGain.gain.setValueAtTime(1.5, audioCtx.currentTime);

      sweep.connect(sweepGain);
      sweepGain.connect(osc.frequency);

      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      sweep.start();
      nodes.push(osc, sweep);
    });

    // Twinkling stars
    const stars = setInterval(() => {
      if (!isPlaying || currentTheme !== 'cosmos') return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1500 + Math.random() * 2500, audioCtx.currentTime);

      g.gain.setValueAtTime(0.012, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      setTimeout(() => osc.stop(), 600);
    }, 900);

    masterGain.starsTimer = stars;
  } 
  else if (currentTheme === 'luxury') {
    // Luxury: soft obsidian gold warm low pad (pure sines)
    const freqs = [110.00, 137.50, 165.00, 220.00]; // A major 7 soft voicing
    freqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, audioCtx.currentTime);
      
      g.gain.setValueAtTime(0.06, audioCtx.currentTime);
      
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      nodes.push(osc);
    });
  }

  // Connect master gain to destination or analyser
  if (audioAnalyser) {
    masterGain.connect(audioAnalyser);
  } else {
    masterGain.connect(audioCtx.destination);
  }

  synthNode = {
    gainNode: masterGain,
    oscillators: nodes,
    stop: () => {
      // Clear timers
      if (masterGain.typersTimer) clearInterval(masterGain.typersTimer);
      if (masterGain.heartTimer) clearInterval(masterGain.heartTimer);
      if (masterGain.bubbleTimer) clearInterval(masterGain.bubbleTimer);
      if (masterGain.starsTimer) clearInterval(masterGain.starsTimer);
      
      // Stop oscillators
      nodes.forEach(n => {
        try { n.stop(); } catch(e) {}
      });
    }
  };
}

function stopProceduralSynth() {
  if (synthNode) {
    synthNode.stop();
    synthNode = null;
  }
}

audio.addEventListener('play', () => {
  if (currentPlaylistTrack === 'funk') {
    setPlayerState(true);
  }
});
audio.addEventListener('pause', () => {
  if (currentPlaylistTrack === 'funk') {
    setPlayerState(false);
  }
});
audio.addEventListener('ended', () => {
  if (currentPlaylistTrack === 'funk') {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
});
audio.addEventListener('timeupdate', () => {
  if (currentPlaylistTrack === 'synth') return;
  if (!audio.duration) return;
  document.getElementById('progressFill').style.width = (audio.currentTime / audio.duration * 100) + '%';
  document.getElementById('timeDisp').textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(audio.duration);
});
audio.addEventListener('loadedmetadata', () => {
  if (currentPlaylistTrack === 'synth') {
    document.getElementById('timeDisp').textContent = 'Live / Synth';
  } else {
    document.getElementById('timeDisp').textContent = '0:00 / ' + fmtTime(audio.duration);
  }
});

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

/* ==========================================================================
   INITIALIZATION & AUTO-PLAY
   ========================================================================== */
function tryAutoplay() {
  audio.volume = 0.6;
  
  // 1. Configurer la source selon les paramètres
  if (settings.musicSource === 'synth') {
    currentPlaylistTrack = 'synth';
    const pBtn = document.getElementById('playlistToggleBtn');
    if (pBtn) pBtn.innerHTML = '<i class="fas fa-microchip"></i> Synthé';
  } else {
    currentPlaylistTrack = 'funk';
  }

  // 2. Si l'autoplay est désactivé, on n'essaie pas de jouer au chargement
  if (!settings.autoplay) {
    console.log("Audio Autoplay désactivé par l'utilisateur.");
    const start = () => {
      if (!isAudioInitialized) initAudioSystem();
      document.removeEventListener('click', start);
      document.removeEventListener('touchstart', start);
    };
    document.addEventListener('click', start, { once: true, passive: true });
    document.addEventListener('touchstart', start, { once: true, passive: true });
    return;
  }

  // Si autoplay activé, tenter la lecture
  if (currentPlaylistTrack === 'synth') {
    const start = () => {
      initAudioSystem();
      if (isPlaying) startProceduralSynth();
      document.removeEventListener('click', start);
      document.removeEventListener('touchstart', start);
    };
    document.addEventListener('click', start, { once: true, passive: true });
    document.addEventListener('touchstart', start, { once: true, passive: true });
    initAudioSystem();
    startProceduralSynth();
    setPlayerState(true);
  } else {
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        const start = () => {
          initAudioSystem();
          document.removeEventListener('click', start);
          document.removeEventListener('touchstart', start);
        };
        document.addEventListener('click', start, { once: true, passive: true });
        document.addEventListener('touchstart', start, { once: true, passive: true });
      });
    }
  }
}

function initScrollReveal() {
  const rvObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        rvObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));
}

/* ==========================================================================
   ROUTAGE DES VUES & BARRE DE NAVIGATION (NEW)
   ========================================================================== */
let activeView = 'home';

function switchView(viewId) {
  activeView = viewId;
  localStorage.setItem('bl-active-view', viewId);

  // Masquer toutes les vues
  document.querySelectorAll('.page-view').forEach(v => {
    v.classList.remove('active');
  });

  // Afficher la vue ciblée
  const tgt = document.getElementById('view-' + viewId);
  if (tgt) tgt.classList.add('active');

  // Mettre à jour l'état actif dans la barre de navigation du bas
  document.querySelectorAll('.b-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('btn-nav-' + viewId);
  if (activeBtn) activeBtn.classList.add('active');

  // Re-déclencher ScrollReveal sur le changement d'onglet
  initScrollReveal();

  showToast(`📍 Navigation : ${viewId.toUpperCase()}`);
}

// Redirections pour compatibilité avec les anciens tiroirs
function openMenu() { switchView('settings'); }
function closeMenu() {}
function openSettings() { switchView('settings'); }
function closeSettings() {}

/* ==========================================================================
   LOGIQUE DE L'ÉDITEUR DE CODE INTERACTIF (NEW)
   ========================================================================== */
let activeEditorTab = 'html';

const EDITOR_TEMPLATES = {
  basic: {
    html: `<!-- Page de Base Bless Dev -->\n<div class="card">\n  <h1>Bienvenue dans l'Éditeur Bless Source !</h1>\n  <p>Modifiez le code HTML, CSS ou JS et cliquez sur Lancer.</p>\n  <button id="alertBtn">Cliquez-moi</button>\n</div>`,
    css: `/* Style de base */\nbody {\n  background: #050810;\n  color: #dde1f0;\n  font-family: 'Rajdhani', sans-serif;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 90vh;\n  margin: 0;\n}\n.card {\n  background: #0a0f1f;\n  border: 1px solid rgba(255,255,255,0.08);\n  padding: 30px;\n  border-radius: 12px;\n  text-align: center;\n  box-shadow: 0 8px 24px rgba(0,0,0,0.5);\n  max-width: 400px;\n}\nh1 {\n  color: #F5C400;\n  font-size: 22px;\n  margin-bottom: 15px;\n}\nbutton {\n  background: #CC0000;\n  color: #fff;\n  border: none;\n  padding: 10px 20px;\n  font-weight: bold;\n  border-radius: 6px;\n  cursor: pointer;\n  margin-top: 10px;\n  transition: 0.2s;\n}\nbutton:hover {\n  background: #ff3333;\n}`,
    js: `// Logique simple\nconst btn = document.getElementById('alertBtn');\nif (btn) {\n  btn.addEventListener('click', () => {\n    alert('Bonjour de la part de Blessing Lusakumu !');\n  });\n}`
  },
  neon: {
    html: `<!-- Glitch Néon & Effet Cyberpunk -->\n<div class="neon-box">\n  <h1 class="neon-text">GLITCH NÉON</h1>\n  <p>Style de design Cyberpunk Premium</p>\n  <button class="neon-btn">INITIALISER</button>\n</div>`,
    css: `/* Thème Cyber/Néon */\nbody {\n  background: #0f0219;\n  color: #00f0ff;\n  font-family: monospace;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 90vh;\n  margin: 0;\n}\n.neon-box {\n  border: 2px solid #ff007f;\n  padding: 40px;\n  text-align: center;\n  box-shadow: 0 0 20px #ff007f, inset 0 0 10px #ff007f;\n  background: rgba(0,0,0,0.8);\n}\n.neon-text {\n  font-size: 32px;\n  text-shadow: 0 0 10px #00f0ff;\n  color: #00f0ff;\n  margin: 0 0 10px;\n}\n.neon-btn {\n  background: transparent;\n  color: #ff007f;\n  border: 2px solid #ff007f;\n  padding: 12px 24px;\n  font-weight: bold;\n  cursor: pointer;\n  text-shadow: 0 0 5px #ff007f;\n  box-shadow: 0 0 10px #ff007f;\n  transition: 0.3s;\n}\n.neon-btn:hover {\n  background: #ff007f;\n  color: #fff;\n  box-shadow: 0 0 25px #ff007f;\n}`,
    js: `// Glitch cyber interaction\nconst btn = document.querySelector('.neon-btn');\nif (btn) {\n  btn.addEventListener('click', () => {\n    btn.innerText = 'MODE COMPILÉ';\n    setTimeout(() => btn.innerText = 'INITIALISER', 1500);\n  });\n}`
  },
  form: {
    html: `<!-- Formulaire de Contact Premium -->\n<div class="login-box">\n  <h2>Nous Contacter</h2>\n  <form onsubmit="event.preventDefault(); alert('Message envoyé !');">\n    <div class="user-box">\n      <input type="text" required="">\n      <label>Nom Complet</label>\n    </div>\n    <div class="user-box">\n      <input type="email" required="">\n      <label>Email</label>\n    </div>\n    <button type="submit">Envoyer</button>\n  </form>\n</div>`,
    css: `/* Style Formulaire Premium */\nbody {\n  margin:0;\n  padding:0;\n  font-family: sans-serif;\n  background: #070707;\n  display:flex;\n  align-items:center;\n  justify-content:center;\n  height: 90vh;\n}\n.login-box {\n  width: 320px;\n  padding: 40px;\n  background: #171717;\n  box-sizing: border-box;\n  box-shadow: 0 15px 25px rgba(0,0,0,.6);\n  border-radius: 10px;\n  border: 1px solid #d4af37;\n}\n.login-box h2 {\n  margin: 0 0 30px;\n  padding: 0;\n  color: #fff;\n  text-align: center;\n}\n.login-box .user-box {\n  position: relative;\n}\n.login-box .user-box input {\n  width: 100%;\n  padding: 10px 0;\n  font-size: 16px;\n  color: #fff;\n  margin-bottom: 30px;\n  border: none;\n  border-bottom: 1px solid #fff;\n  outline: none;\n  background: transparent;\n}\n.login-box .user-box label {\n  position: absolute;\n  top:0;\n  left: 0;\n  padding: 10px 0;\n  font-size: 16px;\n  color: #fff;\n  pointer-events: none;\n  transition: .5s;\n}\n.login-box .user-box input:focus ~ label,\n.login-box .user-box input:valid ~ label {\n  top: -20px;\n  left: 0;\n  color: #d4af37;\n  font-size: 12px;\n}\n.login-box button {\n  background: #d4af37;\n  border: none;\n  color: #000;\n  font-weight: bold;\n  padding: 10px 20px;\n  width: 100%;\n  border-radius: 5px;\n  cursor: pointer;\n  text-transform: uppercase;\n  letter-spacing: 2px;\n}`,
    js: `// Logique formulaire vide`
  },
  empty: { html: '', css: '', js: '' }
};

function switchEditorTab(tabId) {
  activeEditorTab = tabId;
  
  // Onglets UI
  document.querySelectorAll('.editor-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('btn-editor-' + tabId);
  if (activeBtn) activeBtn.classList.add('active');

  // Inputs UI
  document.querySelectorAll('.editor-input-area').forEach(area => {
    area.classList.remove('active');
  });
  const activeArea = document.getElementById('area-editor-' + tabId);
  if (activeArea) activeArea.classList.add('active');
}

function runEditorCode() {
  const html = document.getElementById('editorHtmlInput').value;
  const css = document.getElementById('editorCssInput').value;
  const js = document.getElementById('editorJsInput').value;

  const iframe = document.getElementById('editorPreviewIframe');
  if (!iframe) return;

  // Injection propre du code dans l'iframe
  const codeCombined = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        ${css}
      </style>
    </head>
    <body>
      ${html}
      <script>
        try {
          ${js}
        } catch (err) {
          console.error("Erreur d'exécution JS dans l'Aperçu : ", err);
        }
      </script>
    </body>
    </html>
  `;

  iframe.srcdoc = codeCombined;
}

function importToEditor() {
  if (!currentCode) {
    showToast("⚠️ Aucun code source disponible. Veuillez d'abord analyser un site.");
    switchView('analyzer');
    return;
  }

  document.getElementById('editorHtmlInput').value = currentCode;
  document.getElementById('editorCssInput').value = '';
  document.getElementById('editorJsInput').value = '';

  showToast("✓ Code HTML importé avec succès dans l'Éditeur !");
  switchEditorTab('html');
  runEditorCode();
}

function downloadEditorCode() {
  const html = document.getElementById('editorHtmlInput').value;
  const css = document.getElementById('editorCssInput').value;
  const js = document.getElementById('editorJsInput').value;

  if (!html && !css && !js) {
    showToast("⚠️ L'éditeur est vide.");
    return;
  }

  const exportCode = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Export Bless Code Editor</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${js}
  </script>
</body>
</html>
  `.trim();

  const b = new Blob([exportCode], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'bless-editor-export.html';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("✓ Fichier HTML de l'éditeur téléchargé !");
}

function clearEditor() {
  if (confirm("Voulez-vous vraiment vider tout le code de l'éditeur ?")) {
    document.getElementById('editorHtmlInput').value = '';
    document.getElementById('editorCssInput').value = '';
    document.getElementById('editorJsInput').value = '';
    runEditorCode();
    showToast("🗑️ Éditeur réinitialisé");
  }
}

function loadSelectedTemplate() {
  const sel = document.getElementById('editorTemplateSelect');
  if (!sel) return;
  loadEditorTemplate(sel.value);
}

function loadEditorTemplate(templateId) {
  const tmpl = EDITOR_TEMPLATES[templateId] || EDITOR_TEMPLATES.empty;

  document.getElementById('editorHtmlInput').value = tmpl.html || '';
  document.getElementById('editorCssInput').value = tmpl.css || '';
  document.getElementById('editorJsInput').value = tmpl.js || '';

  runEditorCode();
  showToast(`✨ Modèle "${templateId}" chargé`);
}

window.addEventListener('load', () => {
  const savedTheme = localStorage.getItem('bl-theme') || 'normal';
  const savedMode = localStorage.getItem('bl-mode') || 'dark';

  setTheme(savedTheme);

  if (savedMode === 'light') {
    currentMode = 'light';
    document.documentElement.setAttribute('data-mode', 'light');
    document.getElementById('modeBtn').innerHTML = '<i class="fas fa-moon"></i>';
  }

  // Charger les informations de session utilisateur connectée
  const userEmail = localStorage.getItem('bl-user-email') || 'visiteur@platform.com';
  const userRole = localStorage.getItem('bl-user-role') || 'visiteur';
  const emailDisp = document.getElementById('userEmailDisp');
  const roleDisp = document.getElementById('userRoleDisp');
  
  if (emailDisp) emailDisp.textContent = userEmail;
  if (roleDisp) {
    if (userRole === 'admin-supreme') {
      roleDisp.textContent = 'Admin Suprême';
      roleDisp.style.color = 'var(--accent)';
      roleDisp.style.textShadow = '0 0 10px var(--glow-acc)';
    } else {
      roleDisp.textContent = 'Utilisateur standard';
      roleDisp.style.color = 'var(--text2)';
      roleDisp.style.textShadow = 'none';
    }
  }

  // Appliquer les paramètres enregistrés
  applySettings();

  updateStats();
  tryAutoplay();
  initScrollReveal();

  // Initialiser la vue active enregistrée
  const savedView = localStorage.getItem('bl-active-view') || 'home';
  switchView(savedView);

  // Charger le modèle par défaut dans l'éditeur
  loadEditorTemplate('basic');

  // Setup Code Search Keybindings
  const searchInput = document.getElementById('codeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchNext();
    });
  }

  // Setup input keypress for main URL analyze
  const urlInp = document.getElementById('urlInput');
  if (urlInp) {
    urlInp.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleAnalyze();
    });
  }
});

window.addEventListener('resize', () => {
  if (currentTheme === 'hacker') startMatrix();
});
