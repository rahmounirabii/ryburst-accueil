(function () {
'use strict';
var reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
var corps = document.body;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
/* ---- Titres masqués : révélation par translation seule (n'affecte pas le LCP) ---- */
$$('[data-mots]').forEach(function (h) {
var mots = h.textContent.trim().split(/\s+/);
h.textContent = '';
mots.forEach(function (m, i) {
var boite = document.createElement('span');
boite.className = 'mot-boite';
var mot = document.createElement('span');
mot.className = 'mot';
mot.style.setProperty('--i', i);
mot.textContent = m;
boite.appendChild(mot);
h.appendChild(boite);
if (i < mots.length - 1) h.appendChild(document.createTextNode(' '));
});
});
/* ---- Chargeur : une fois par session, court, jamais bloquant ---- */
var chargeur = $('#chargeur');
function pret() { corps.classList.remove('charge'); corps.classList.add('pret'); }
if (!chargeur || reduit || sessionStorage.getItem('rb-vu')) {
if (chargeur) chargeur.remove();
pret();
} else {
corps.classList.add('charge');
try { sessionStorage.setItem('rb-vu', '1'); } catch (e) {}
var depart = performance.now();
var lever = function () {
var reste = Math.max(0, 620 - (performance.now() - depart));
setTimeout(function () {
chargeur.classList.add('fini');
pret();
setTimeout(function () { chargeur.remove(); }, 900);
}, reste);
};
if (document.fonts && document.fonts.ready) document.fonts.ready.then(lever); else addEventListener('load', lever);
setTimeout(lever, 1600);
}
/* ---- En-tête : sombre sur le héros, clair ensuite ---- */
var entete = $('#entete'), sentinelle = $('#sentinelle');
if (entete && sentinelle && 'IntersectionObserver' in window) {
new IntersectionObserver(function (e) {
entete.classList.toggle('clair', !e[0].isIntersecting);
}, { rootMargin: '-72px 0px 0px 0px' }).observe(sentinelle);
} else if (entete) {
entete.classList.add('clair');
}
/* ---- Méga-menu : état exposé aux technologies d'assistance ---- */
var megaBtn = $('#mega-btn');
if (megaBtn) {
var hote = megaBtn.parentNode;
var etat = function (v) { megaBtn.setAttribute('aria-expanded', v ? 'true' : 'false'); };
hote.addEventListener('mouseenter', function () { etat(true); });
hote.addEventListener('mouseleave', function () { etat(false); });
hote.addEventListener('focusin', function () { etat(true); });
hote.addEventListener('focusout', function (e) { if (!hote.contains(e.relatedTarget)) etat(false); });
megaBtn.addEventListener('click', function () {
var ouvert = megaBtn.getAttribute('aria-expanded') === 'true';
etat(!ouvert);
if (!ouvert) { var a = $('.mega a', hote); if (a) a.focus(); }
});
}
/* ---- Tiroir mobile ---- */
var tiroir = $('#tiroir'), burger = $('#burger'), fermer = $('#fermer');
function ouvrirMenu() { corps.classList.add('menu'); tiroir.removeAttribute('inert'); burger.setAttribute('aria-expanded', 'true'); var a = $('a', tiroir); if (a) a.focus(); }
function fermerMenu() { corps.classList.remove('menu'); tiroir.setAttribute('inert', ''); burger.setAttribute('aria-expanded', 'false'); }
if (tiroir && burger) {
burger.addEventListener('click', ouvrirMenu);
if (fermer) fermer.addEventListener('click', fermerMenu);
$$('[data-ferme]', tiroir).forEach(function (a) { a.addEventListener('click', fermerMenu); });
addEventListener('keydown', function (e) { if (e.key === 'Escape' && corps.classList.contains('menu')) { fermerMenu(); burger.focus(); } });
}
/* ---- Révélations : une seule fois, jamais au repos invisible sans observateur ---- */
if ('IntersectionObserver' in window && !reduit) {
var oRev = new IntersectionObserver(function (es) {
es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); oRev.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
$$('.rev').forEach(function (el) { oRev.observe(el); });
} else {
$$('.rev').forEach(function (el) { el.classList.add('vu'); });
}
addEventListener('load', function () {
setTimeout(function () { $$('.rev:not(.vu)').forEach(function (el) { el.classList.add('vu'); }); }, 2500);
}, { once: true });
function uneFois(el, cb) {
if (!el) return;
if (!('IntersectionObserver' in window)) { cb(el); return; }
var o = new IntersectionObserver(function (es) {
if (es[0].isIntersecting) { cb(el); o.disconnect(); }
}, { threshold: 0.25 });
o.observe(el);
}
/* ---- Diagramme du Company Brain ---- */
uneFois($('#cerveau'), function (el) { el.classList.add('vu'); });
/* ---- Diagnostic : barres et compteur ---- */
uneFois($('#score'), function (el) {
el.classList.add('vu');
var c = $('.compte', el);
if (!c) return;
var cible = parseInt(c.getAttribute('data-vers'), 10) || 0;
if (reduit) { c.textContent = cible; return; }
var t0 = null;
requestAnimationFrame(function pas(ts) {
if (!t0) t0 = ts;
var p = Math.min(1, (ts - t0) / 1300);
c.textContent = Math.round(cible * (1 - Math.pow(1 - p, 3)));
if (p < 1) requestAnimationFrame(pas);
});
});
/* ---- Carrousel du héros ---- */
var diapos = $$('.diapo'), onglets = $$('.onglet');
if (diapos.length > 1) {
var idx = 0, minuteur = null;
var montrer = function (i) {
idx = i;
diapos.forEach(function (d, k) {
var on = k === i;
d.classList.toggle('actif', on);
if (on) d.removeAttribute('inert'); else d.setAttribute('inert', '');
if (on && !reduit) $$('.mot', d).forEach(function (m) { m.style.animation = 'none'; void m.offsetWidth; m.style.animation = ''; });
});
onglets.forEach(function (t, k) {
t.setAttribute('aria-selected', k === i ? 'true' : 'false');
t.setAttribute('tabindex', k === i ? '0' : '-1');
var j = $('.piste i', t);
if (j) { j.style.animation = 'none'; void j.offsetWidth; j.style.animation = ''; }
});
};
var relancer = function () { clearInterval(minuteur); if (!reduit) minuteur = setInterval(function () { montrer((idx + 1) % diapos.length); }, 7000); };
onglets.forEach(function (t, k) {
t.addEventListener('click', function () { montrer(k); relancer(); });
t.addEventListener('keydown', function (e) {
var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
if (!d) return;
e.preventDefault();
var n = (k + d + onglets.length) % onglets.length;
montrer(n); onglets[n].focus(); relancer();
});
});
var heros = $('.hero');
if (heros) {
heros.addEventListener('mouseenter', function () { clearInterval(minuteur); });
heros.addEventListener('mouseleave', relancer);
}
addEventListener('visibilitychange', function () { document.hidden ? clearInterval(minuteur) : relancer(); });
relancer();
}
/* ---- Company Brain vivant : orbite sur canvas ---- */
var cv = $('#orbite');
var co = navigator.connection || {};
var faible = (navigator.hardwareConcurrency || 8) < 4 || (navigator.deviceMemory || 8) < 4
|| co.saveData === true || /2g/.test(co.effectiveType || '');
if (cv && reduit) cv.remove();
if (cv && faible) { cv.remove(); cv = null; }
if (cv && !reduit) {
var ctx = cv.getContext('2d', { alpha: true });
var noms = ['Marketing', 'Ventes', 'Clients', 'Livraison', 'Opérations', 'Intelligence', 'Back-office'];
var W = 0, H = 0, dpr = 1, petit = false, R = 0, cx = 0, cy = 0;
var noeuds = [], signaux = [], t = 0, dernier = 0, actif = false;
var souris = { x: 0, y: 0 }, decal = { x: 0, y: 0 };
var alea = function (a, b) { return a + Math.random() * (b - a); };
noeuds = noms.map(function (n, i) {
return { nom: n, a0: -Math.PI / 2 + i * 2 * Math.PI / 7, ph: alea(0, 6.28), rj: alea(.94, 1.06), x: 0, y: 0 };
});
function mesurer() {
dpr = Math.min(devicePixelRatio || 1, 1.5);
W = cv.clientWidth; H = cv.clientHeight;
if (!W || !H) return;
cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
petit = W < 1024;
cx = petit ? W * .84 : W * .745;
cy = petit ? H * .14 : H * .5;
R = petit ? Math.min(W, H) * .17 : Math.min(W * .175, H * .315);
}
function dessiner(dt) {
t += dt;
decal.x += (souris.x - decal.x) * .045;
decal.y += (souris.y - decal.y) * .045;
var x0 = cx + decal.x, y0 = cy + decal.y;
ctx.clearRect(0, 0, W, H);
noeuds.forEach(function (n) {
var a = n.a0 + t * .000055;
var r = R * n.rj * (1 + .05 * Math.sin(t * .0007 + n.ph));
n.x = x0 + Math.cos(a) * r; n.y = y0 + Math.sin(a) * r;
});
ctx.lineWidth = 1;
[.62, 1, 1.42, 1.9].forEach(function (k, i) {
ctx.beginPath(); ctx.arc(x0, y0, R * k, 0, 6.2832);
ctx.strokeStyle = 'rgba(138,132,214,' + (.16 - i * .038) + ')'; ctx.stroke();
});
ctx.lineWidth = 1.25;
noeuds.forEach(function (n) {
ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(n.x, n.y);
ctx.strokeStyle = 'rgba(138,132,214,.30)'; ctx.stroke();
});
ctx.lineWidth = 1;
noeuds.forEach(function (n, i) {
var m = noeuds[(i + 1) % noeuds.length];
ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y);
ctx.strokeStyle = 'rgba(138,132,214,.11)'; ctx.stroke();
});
for (var s = signaux.length - 1; s >= 0; s--) {
var g = signaux[s]; g.p += g.v * dt;
var n2 = noeuds[g.n], q = g.sort ? g.p : 1 - g.p;
var px = x0 + (n2.x - x0) * q, py = y0 + (n2.y - y0) * q;
ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.2832); ctx.fillStyle = 'rgba(98,54,255,.22)'; ctx.fill();
ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
if (g.p >= 1) signaux.splice(s, 1);
}
ctx.font = '600 12px Inter, system-ui, sans-serif';
ctx.textBaseline = 'middle';
noeuds.forEach(function (n) {
ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, 6.2832);
ctx.fillStyle = '#00205C'; ctx.fill();
ctx.lineWidth = 1.5; ctx.strokeStyle = '#8A84D6'; ctx.stroke();
if (petit) return;
var dx = n.x - x0, dy = n.y - y0, L = Math.hypot(dx, dy) || 1;
var lx = n.x + dx / L * 18, ly = n.y + dy / L * 18;
var al = Math.abs(dx) < 20 ? 'center' : (dx > 0 ? 'left' : 'right');
var larg = ctx.measureText(n.nom).width;
if (al === 'left' && lx + larg > W - 12) { al = 'right'; lx = n.x - dx / L * 18; }
if (al === 'right' && lx - larg < 12) { al = 'left'; lx = n.x - dx / L * 18; }
ctx.fillStyle = 'rgba(207,210,211,.78)';
ctx.textAlign = al;
ctx.fillText(n.nom, lx, ly);
});
var puls = (t % 2600) / 2600;
ctx.beginPath(); ctx.arc(x0, y0, 18 + puls * 26, 0, 6.2832);
ctx.strokeStyle = 'rgba(98,54,255,' + (.45 * (1 - puls)) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
ctx.beginPath(); ctx.arc(x0, y0, 18, 0, 6.2832); ctx.fillStyle = '#6236FF'; ctx.fill();
ctx.beginPath(); ctx.arc(x0, y0, 5, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
}
var trame = 0;
function boucle(ts) {
trame = 0;
if (!actif) return;
var dt = dernier ? Math.min(48, ts - dernier) : 16;
if (dt < 32) { trame = requestAnimationFrame(boucle); return; }
dernier = ts;
if (signaux.length < 7 && Math.random() < dt / 900) {
signaux.push({ n: (Math.random() * noeuds.length) | 0, p: 0, v: alea(.35, .6) / 1000, sort: Math.random() < .5 });
}
dessiner(dt);
trame = requestAnimationFrame(boucle);
}
function demarrer() {
if (actif || document.hidden) return;
actif = true; dernier = 0;
if (!trame) trame = requestAnimationFrame(boucle);
}
function stopper() {
actif = false;
if (trame) { cancelAnimationFrame(trame); trame = 0; }
}
mesurer();
var redim = null;
addEventListener('resize', function () { clearTimeout(redim); redim = setTimeout(mesurer, 150); }, { passive: true });
var sec = cv.parentNode;
var cadre = null;
sec.addEventListener('pointerenter', function () { cadre = sec.getBoundingClientRect(); }, { passive: true });
sec.addEventListener('pointermove', function (e) {
if (e.pointerType !== 'mouse' || !cadre) return;
souris.x = ((e.clientX - cadre.left) / cadre.width - .5) * 24;
souris.y = ((e.clientY - cadre.top) / cadre.height - .5) * 16;
}, { passive: true });
sec.addEventListener('pointerleave', function () { souris.x = 0; souris.y = 0; });
var autorise = false, visible = false;
function peutTourner() { if (autorise && visible) demarrer(); else stopper(); }
var liberer = function () {
autorise = true;
(window.requestIdleCallback || function (f) { setTimeout(f, 300); })(peutTourner, { timeout: 2500 });
};
if (document.readyState === 'complete') liberer(); else addEventListener('load', liberer, { once: true });
if ('IntersectionObserver' in window) {
new IntersectionObserver(function (e) { visible = e[0].isIntersecting; peutTourner(); }, { threshold: 0 }).observe(cv);
} else { visible = true; }
addEventListener('visibilitychange', function () { document.hidden ? stopper() : peutTourner(); });
}
/* ---- Formulaire de contact : validation native, message clair ---- */
var form = $('#form-contact');
if (form) {
form.addEventListener('submit', function (e) {
e.preventDefault();
if (!form.reportValidity()) return;
var etat = $('#form-etat');
etat.hidden = false;
etat.textContent = 'Ce formulaire est une démonstration : aucun message n’est encore envoyé. Écrivez-nous directement à bonjour@ryburst.com en attendant le branchement.';
etat.scrollIntoView({ block: 'center', behavior: reduit ? 'auto' : 'smooth' });
});
}
/* ---- Année du pied de page ---- */
$$('[data-annee]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();