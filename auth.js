/**
 * BLESS SOURCE PLATFORM — Authentication Logic
 * Gère l'authentification Firebase / Simulation LocalStorage,
 * les thèmes interactifs de la page et les animations de fond.
 */

// État Global de la Page Auth
let currentTheme = 'normal';
let currentMode = 'light';
let matrixRAF = null;
let canvasRAF = null;

// Données Textes par Thème (Copie conforme de l'app principale)
const TD = {
  normal: { badge: 'CODE VIEWER', title: 'BLESS SOURCE CODE', subtitle: 'Veuillez vous authentifier', toast: '⚡ Thème Normal activé' },
  escanor: { badge: '☀ PRIDE', title: 'BLESS SOURCE CODE', subtitle: 'La puissance du Soleil à votre service', toast: '☀ Escanor — Qui en a décidé ainsi ?' },
  hacker: { badge: '[ROOT_ACCESS]', title: 'BLESS_SOURCE.EXE', subtitle: '> Entrez vos identifiants...', toast: '[✓] ACCÈS ROOT AUTORISÉ' },
  horror: { badge: '☠ MAUDIT', title: 'BLESS SOURCE CODE', subtitle: 'Les ténèbres vous attendent...', toast: '☠ Horror — Es-tu prêt à entrer ?' },
  cyberpunk: { badge: '⚡ CYBERPUNK', title: 'BLESS_CYBER_LINK', subtitle: 'CONNECTING TO NEON_CORE...', toast: '⚡ Cyberpunk — Welcome to the Neon Grid' },
  aqua: { badge: '🌊 AQUA', title: 'BLESS AQUA ARCHIVE', subtitle: 'Plongez dans le code source', toast: '🌊 Aqua — Mode aquatique fluide' },
  cosmos: { badge: '✦ COSMOS', title: 'BLESS STELLAR SCANNER', subtitle: 'Authentification spatiale requise', toast: '✦ Cosmos — Voyage au cœur du code' },
  luxury: { badge: '⚜ LUXURY', title: 'BLESS GOLD OBSIDIAN', subtitle: 'L\'élégance du développement', toast: '⚜ Luxury — L\'excellence à l\'état pur' }
};

// ==========================================================================
// INITIALISATION DE LA PAGE
// ==========================================================================
window.addEventListener('load', () => {
  // Charger le thème sauvegardé
  const savedTheme = localStorage.getItem('bl-theme') || 'normal';
  setTheme(savedTheme);

  // Forcer le mode clair au démarrage de la plateforme
  currentMode = 'light';
  document.documentElement.setAttribute('data-mode', 'light');
  const modeBtn = document.getElementById('modeBtn');
  if (modeBtn) modeBtn.innerHTML = '<i class="fas fa-moon"></i>';

  // Initialisation des indicateurs d'état Firebase
  initFirebaseStatusBadge();

  // Écouteurs de soumission de formulaires
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// ==========================================================================
// LOGIQUE DE FLUX ET NAVIGATION AUTH
// ==========================================================================

// Changer de formulaire (Connexion / Inscription)
function switchForm(formName) {
  // Mettre à jour les onglets actifs
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.auth-tab-btn[onclick="switchForm('${formName}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Afficher le bon formulaire
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });
  const activeForm = document.getElementById(formName === 'login' ? 'loginForm' : 'registerForm');
  if (activeForm) activeForm.classList.add('active');
}

// Afficher / Masquer le mot de passe
function togglePassword(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    btnEl.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btnEl.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// Gérer l'affichage du popover des thèmes
function toggleThemePopover(e) {
  e.stopPropagation();
  document.getElementById('themePopover').classList.toggle('open');
}

document.addEventListener('click', () => {
  const popover = document.getElementById('themePopover');
  if (popover) popover.classList.remove('open');
});

// Affichage du Toast de notification
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t.timeout);
  t.timeout = setTimeout(() => t.classList.remove('show'), 3500);
}

// Secouer la carte en cas d'erreur
function shakeCard() {
  const card = document.getElementById('authCard');
  if (!card) return;
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 400);
}

// Détection de l'état Firebase
function initFirebaseStatusBadge() {
  const badge = document.getElementById('firebaseStatusBadge');
  if (!badge) return;

  // dbAdapter est exporté globalement par firebase-config.js
  if (window.dbAdapter && window.dbAdapter.isFirebase) {
    badge.className = 'firebase-status-badge active';
    badge.innerHTML = '<span class="firebase-status-dot"></span> Firebase Connecté';
  } else {
    badge.className = 'firebase-status-badge local';
    badge.innerHTML = '<span class="firebase-status-dot"></span> Mode Local (Simulé)';
  }
}

// ==========================================================================
// SOUMISSIONS DES FORMULAIRES
// ==========================================================================

// Soumission du Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!email || !password) {
    showToast("⚠️ Veuillez remplir tous les champs.");
    shakeCard();
    return;
  }

  // Désactiver le bouton pendant le chargement
  submitBtn.disabled = true;
  const originalHtml = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CONNEXION EN COURS...';

  try {
    const result = await window.dbAdapter.signIn(email, password);
    
    // Succès de la connexion
    localStorage.setItem('bl-logged-in', 'true');
    localStorage.setItem('bl-user-email', result.email);
    localStorage.setItem('bl-user-role', result.role);
    localStorage.setItem('bl-user-uid', result.uid);

    // Salutations personnalisées
    if (result.role === 'admin-supreme') {
      showToast("⚡ Bonjour Ô Suprême Administrateur ! Accès total accordé.");
    } else {
      showToast("🔑 Connexion réussie ! Chargement de la plateforme...");
    }

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    showToast(`❌ Erreur : ${error.message}`);
    shakeCard();
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

// Soumission de l'Inscription
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!email || !password || !confirmPassword) {
    showToast("⚠️ Veuillez remplir tous les champs.");
    shakeCard();
    return;
  }

  if (password !== confirmPassword) {
    showToast("⚠️ Les mots de passe ne correspondent pas.");
    shakeCard();
    return;
  }

  if (password.length < 6) {
    showToast("⚠️ Le mot de passe doit contenir au moins 6 caractères.");
    shakeCard();
    return;
  }

  // Désactiver le bouton pendant le chargement
  submitBtn.disabled = true;
  const originalHtml = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CRÉATION DU COMPTE...';

  try {
    await window.dbAdapter.signUp(email, password);
    
    // Succès de l'inscription
    showToast("🎉 Compte créé avec succès ! Connectez-vous maintenant.");
    
    // Remplir l'email dans le login et basculer sur l'onglet login
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = '';
    
    // Réinitialiser le formulaire d'inscription
    e.target.reset();

    setTimeout(() => {
      switchForm('login');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }, 1000);
  } catch (error) {
    showToast(`❌ Erreur : ${error.message}`);
    shakeCard();
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

// ==========================================================================
// GESTION DU SYSTÈME DE THÈMES (IDENTIQUE À MAIN.JS)
// ==========================================================================
function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  // Mettre à jour l'état actif dans le popover des thèmes
  document.querySelectorAll('.auth-theme-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(theme)) {
      item.classList.add('active');
    }
  });

  // Mettre à jour les textes de l'en-tête dynamiquement
  const d = TD[theme] || TD.normal;
  const headBadge = document.getElementById('heroBadge');
  const headTitle = document.getElementById('heroTitle');
  const headSubtitle = document.getElementById('heroSubtitle');

  if (headBadge) headBadge.textContent = d.badge;
  if (headTitle) headTitle.textContent = d.title;
  if (headSubtitle) headSubtitle.textContent = d.subtitle;
  
  // Gestion du Canvas Matrix et Particules
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

  localStorage.setItem('bl-theme', theme);
  showToast(d.toast);
}

function toggleMode() {
  currentMode = currentMode === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-mode', currentMode);
  
  const modeBtn = document.getElementById('modeBtn');
  if (modeBtn) {
    modeBtn.innerHTML = currentMode === 'dark'
      ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  localStorage.setItem('bl-mode', currentMode);
  showToast(currentMode === 'dark' ? '🌙 Mode sombre activé' : '☀ Mode clair activé');
}

// ==========================================================================
// RENDER DE L'ANIMATION DE FOND (CANVAS)
// ==========================================================================
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
  const maxPts = 30; // Nombre légèrement réduit pour optimiser l'auth
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
    
    if (currentTheme === 'normal') {
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
      
      if (currentTheme === 'luxury') {
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
        ctx.rect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
        ctx.fillStyle = p[i % p.length] + pt.a + ')';
        ctx.fill();
      } else if (currentTheme === 'escanor') {
        ctx.arc(pt.x, pt.y, pt.r * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p[i % p.length] + (pt.a * 0.8) + ')';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255,80,0,0.6)';
        ctx.fill();
      } else {
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = p[i % p.length] + pt.a + ')';
        ctx.fill();
      }
      
      if (currentTheme === 'escanor' || currentTheme === 'horror') {
        pt.y += pt.dy - 0.35;
        pt.x += pt.dx;
        if (pt.y < -10) { pt.y = canvas.height + 10; pt.x = Math.random() * canvas.width; }
      } else if (currentTheme === 'aqua') {
        pt.y += pt.dy - 0.4;
        pt.x += pt.dx + Math.sin(pt.y / 20) * 0.15;
        if (pt.y < -10) { pt.y = canvas.height + 10; pt.x = Math.random() * canvas.width; }
      } else {
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

window.addEventListener('resize', () => {
  if (currentTheme === 'hacker') startMatrix();
});
