export const TUNNEL_PARFAIT_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NOM DU PRODUIT — Offre Limitée</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --c1:#6542F0;
  --c2:#AB30E8;
  --accent:#17CFAA;
  --dark:#0F0A1E;
}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#111827;overflow-x:hidden}

/* BARRE URGENCE */
#ub{
  position:sticky;top:0;z-index:999;
  background:linear-gradient(90deg,var(--c1),var(--c2));
  color:#fff;text-align:center;padding:.55rem 1rem;
  font-size:.8rem;font-weight:600;
  display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.4rem;
  box-shadow:0 2px 12px rgba(101,66,240,.4);
}
#ub .cd{
  background:rgba(255,255,255,.2);padding:.1rem .45rem;
  border-radius:.35rem;font-variant-numeric:tabular-nums;letter-spacing:.03em;
}

/* HERO */
#hero{
  position:relative;padding:5rem 1.25rem 4rem;
  background:linear-gradient(160deg,#F5F3FF 0%,#fff 60%);
  text-align:center;overflow:hidden;
}
#hero::before{
  content:'';position:absolute;top:-6rem;right:-6rem;
  width:28rem;height:28rem;border-radius:50%;
  background:radial-gradient(circle,rgba(101,66,240,.12),transparent 70%);
  pointer-events:none;
}
.badge-pill{
  display:inline-flex;align-items:center;gap:.4rem;
  background:rgba(101,66,240,.08);color:var(--c1);
  border:1px solid rgba(101,66,240,.2);
  padding:.3rem 1rem;border-radius:9999px;
  font-size:.75rem;font-weight:700;margin-bottom:1.5rem;
}
#hero h1{
  font-family:'Space Grotesk',sans-serif;
  font-size:clamp(2rem,6vw,3.25rem);font-weight:800;
  line-height:1.15;color:var(--dark);margin-bottom:1.25rem;
}
#hero h1 em{font-style:normal;color:var(--c1)}
#hero p.sub{
  font-size:1.1rem;color:#4B5563;line-height:1.7;
  max-width:560px;margin:0 auto 2rem;
}
.cta-btn{
  display:inline-flex;align-items:center;gap:.6rem;
  background:linear-gradient(90deg,var(--c1),var(--c2));
  color:#fff;font-weight:700;font-size:1rem;
  padding:.9rem 2.25rem;border-radius:9999px;
  text-decoration:none;border:none;cursor:pointer;
  box-shadow:0 8px 28px rgba(101,66,240,.35);
  transition:transform .15s,box-shadow .15s;
}
.cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(101,66,240,.45)}
.cta-sub{font-size:.75rem;color:#9CA3AF;margin-top:.75rem}
#hero-img{
  margin:2.5rem auto 0;max-width:520px;width:100%;
  border-radius:1.5rem;overflow:hidden;
  box-shadow:0 24px 64px rgba(0,0,0,.12);
  border:6px solid #fff;
}
#hero-img img{width:100%;display:block;object-fit:cover}
.img-ph{
  height:280px;
  background:linear-gradient(135deg,#EDE9FE,#DDD6FE);
  display:flex;align-items:center;justify-content:center;
  color:var(--c1);font-size:.9rem;font-weight:600;
}

/* BARRE CHIFFRES */
#social-bar{
  background:var(--dark);color:#fff;
  padding:1.5rem 1.25rem;
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1rem;text-align:center;
}
.stat-num{font-family:'Space Grotesk',sans-serif;font-size:1.75rem;font-weight:800;color:var(--accent)}
.stat-lbl{font-size:.75rem;color:rgba(255,255,255,.65);margin-top:.2rem}

/* SECTIONS */
section{padding:4rem 1.25rem}
.section-tag{
  display:inline-block;background:rgba(23,207,170,.12);color:var(--accent);
  font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  padding:.3rem .8rem;border-radius:9999px;margin-bottom:1rem;
}
.section-title{
  font-family:'Space Grotesk',sans-serif;
  font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;
  color:var(--dark);line-height:1.2;margin-bottom:1rem;
}
.section-sub{font-size:1rem;color:#6B7280;line-height:1.7;max-width:560px;margin:0 auto}
.text-center{text-align:center}

/* BÉNÉFICES */
#benefits{background:#F9FAFB}
.benefits-grid{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:1.5rem;margin-top:3rem;
}
.benefit-card{
  background:#fff;border-radius:1.25rem;padding:2rem 1.5rem;
  border:1px solid #F3F4F6;box-shadow:0 4px 16px rgba(0,0,0,.04);
}
.benefit-icon{
  width:3rem;height:3rem;border-radius:.875rem;
  background:linear-gradient(135deg,rgba(101,66,240,.1),rgba(171,48,232,.1));
  display:flex;align-items:center;justify-content:center;
  font-size:1.5rem;margin-bottom:1.25rem;
}
.benefit-card h3{font-size:1.05rem;font-weight:700;color:var(--dark);margin-bottom:.5rem}
.benefit-card p{font-size:.875rem;color:#6B7280;line-height:1.65}

/* ÉTAPES */
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin-top:3rem}
.step{text-align:center;padding:1.5rem}
.step-num{
  width:3.5rem;height:3.5rem;border-radius:50%;margin:0 auto 1.25rem;
  background:linear-gradient(135deg,var(--c1),var(--c2));
  color:#fff;font-family:'Space Grotesk',sans-serif;
  font-size:1.25rem;font-weight:800;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 20px rgba(101,66,240,.3);
}
.step h3{font-size:1rem;font-weight:700;color:var(--dark);margin-bottom:.5rem}
.step p{font-size:.875rem;color:#6B7280;line-height:1.65}

/* TÉMOIGNAGES */
#testimonials{background:linear-gradient(160deg,#F5F3FF,#fff)}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;margin-top:3rem}
.review-card{background:#fff;border-radius:1.25rem;padding:2rem;border:1px solid #EDE9FE;box-shadow:0 4px 20px rgba(0,0,0,.05)}
.review-stars{color:#FBBF24;font-size:1rem;margin-bottom:1rem}
.review-text{font-size:.9rem;color:#374151;line-height:1.7;font-style:italic;margin-bottom:1.25rem}
.review-author{display:flex;align-items:center;gap:.75rem}
.review-avatar{
  width:2.5rem;height:2.5rem;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--c1),var(--c2));
  color:#fff;font-weight:700;font-size:.9rem;
  display:flex;align-items:center;justify-content:center;
}
.review-name{font-weight:700;font-size:.875rem;color:var(--dark)}
.review-info{font-size:.75rem;color:#9CA3AF}

/* GARANTIE */
#guarantee{
  background:linear-gradient(135deg,var(--c1),var(--c2));
  color:#fff;text-align:center;padding:5rem 1.25rem;
}
.guar-box{
  background:rgba(255,255,255,.1);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.2);border-radius:2rem;
  padding:3rem 2rem;max-width:640px;margin:0 auto;
}
#guarantee h2{font-family:'Space Grotesk',sans-serif;font-size:2rem;font-weight:800;margin-bottom:1rem}
#guarantee p{font-size:1rem;opacity:.9;line-height:1.7}

/* FAQ */
.faq-item{border-bottom:1px solid #E5E7EB;padding:1.25rem 0}
.faq-q{
  font-weight:700;color:var(--dark);cursor:pointer;
  display:flex;align-items:center;justify-content:space-between;
  gap:1rem;font-size:.95rem;
}
.faq-q .icon{font-size:1.25rem;transition:transform .2s;color:var(--c1);flex-shrink:0}
.faq-a{font-size:.875rem;color:#6B7280;line-height:1.7;max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s}
.faq-item.open .faq-q .icon{transform:rotate(45deg)}
.faq-item.open .faq-a{max-height:200px;padding-top:.75rem}

/* CTA FINAL */
#final-cta{background:var(--dark);text-align:center;padding:5rem 1.25rem;color:#fff}
#final-cta h2{font-family:'Space Grotesk',sans-serif;font-size:clamp(1.5rem,4vw,2.5rem);font-weight:800;margin-bottom:1rem}
#final-cta p{font-size:1rem;color:rgba(255,255,255,.7);margin-bottom:2rem;line-height:1.7}

/* FOMO */
#fomo{position:fixed;bottom:1.5rem;left:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;pointer-events:none}
.fomo-toast{
  background:#fff;border-radius:.875rem;box-shadow:0 8px 32px rgba(0,0,0,.15);
  border:1px solid #E5E7EB;padding:.75rem 1rem;
  display:flex;align-items:center;gap:.75rem;
  font-size:.8rem;max-width:280px;pointer-events:none;
  animation:slideIn .3s ease;
}
.fomo-ava{
  width:2.25rem;height:2.25rem;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--c1),var(--c2));
  color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;
}
@keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes fadeOut{from{opacity:1}to{opacity:0;transform:translateX(-20px)}}

/* MODAL */
#modal-overlay{
  position:fixed;inset:0;z-index:10000;
  background:rgba(0,0,0,.6);backdrop-filter:blur(4px);
  display:none;align-items:center;justify-content:center;padding:1rem;
}
#modal-overlay.show{display:flex}
.modal-box{
  background:#fff;border-radius:2rem;padding:2.5rem 2rem;
  max-width:420px;width:100%;text-align:center;position:relative;
  box-shadow:0 32px 80px rgba(0,0,0,.25);
}
.modal-close{position:absolute;top:1rem;right:1.25rem;font-size:1.5rem;line-height:1;color:#9CA3AF;cursor:pointer;background:none;border:none}
.modal-badge{
  display:inline-block;background:rgba(101,66,240,.08);color:var(--c1);
  border:1px solid rgba(101,66,240,.2);
  padding:.3rem 1rem;border-radius:9999px;font-size:.75rem;font-weight:700;margin-bottom:1.25rem;
}
.modal-box h3{font-family:'Space Grotesk',sans-serif;font-size:1.5rem;font-weight:800;color:var(--dark);margin-bottom:.75rem}
.modal-box p{font-size:.875rem;color:#6B7280;line-height:1.65;margin-bottom:1.5rem}

@media(max-width:640px){
  #hero{padding:4rem 1rem 3rem}
  #social-bar{gap:.5rem}
  .stat-num{font-size:1.35rem}
  #product-grid{grid-template-columns:1fr!important}
}
</style>
</head>
<body>

<!-- ══════════ BARRE D'URGENCE + COMPTE À REBOURS ══════════ -->
<div id="ub">
  🔥&nbsp;Offre limitée — se termine dans&nbsp;
  <span class="cd" id="cd-h">00</span>:<span class="cd" id="cd-m">00</span>:<span class="cd" id="cd-s">00</span>
  &nbsp;— Plus que&nbsp;<strong id="stock-left">12</strong>&nbsp;en stock
</div>

<!-- ══════════ HERO ══════════ -->
<section id="hero">
  <div class="badge-pill">⚡ OFFRE EXCLUSIVE · QUANTITÉS LIMITÉES</div>
  <h1>
    [TITRE ACCROCHEUR DU PRODUIT]<br>
    <em>[Complément percutant en couleur]</em>
  </h1>
  <p class="sub">
    [Description courte et bénéfice principal. Répondez à : en quoi votre produit
    change-t-il la vie du client ? 1-2 phrases, concrètes et persuasives.]
  </p>
  <a href="#lp-order-form" class="cta-btn">✅ Je commande maintenant</a>
  <p class="cta-sub">Paiement à la livraison &middot; Livraison 24-48h &middot; Retour gratuit</p>

  <div id="hero-img">
    <!-- Remplacez par : <img src="URL_IMAGE_PRODUIT" alt="NOM_PRODUIT"> -->
    <div class="img-ph">📸 Remplacez par votre image produit</div>
  </div>
</section>

<!-- ══════════ CHIFFRES CLÉS ══════════ -->
<div id="social-bar">
  <div>
    <div class="stat-num">+4 200</div>
    <div class="stat-lbl">Clients satisfaits</div>
  </div>
  <div>
    <div class="stat-num">4,8 ★</div>
    <div class="stat-lbl">Note moyenne</div>
  </div>
  <div>
    <div class="stat-num">98%</div>
    <div class="stat-lbl">Satisfaction</div>
  </div>
</div>

<!-- ══════════ BÉNÉFICES ══════════ -->
<section id="benefits">
  <div class="text-center">
    <span class="section-tag">Pourquoi nous choisir</span>
    <h2 class="section-title">[Titre de la section bénéfices]</h2>
    <p class="section-sub">[Sous-titre qui renforce la valeur de votre offre]</p>
  </div>
  <div class="benefits-grid">
    <div class="benefit-card">
      <div class="benefit-icon">🚀</div>
      <h3>[Bénéfice 1 — ex : Livraison Express]</h3>
      <p>[Description orientée résultat pour le client. Concrète et courte.]</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">💎</div>
      <h3>[Bénéfice 2 — ex : Qualité Premium]</h3>
      <p>[Description orientée résultat pour le client. Concrète et courte.]</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">🔒</div>
      <h3>[Bénéfice 3 — ex : Paiement Sécurisé]</h3>
      <p>[Description orientée résultat pour le client. Concrète et courte.]</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">🎁</div>
      <h3>[Bénéfice 4 — ex : Bonus Offert]</h3>
      <p>[Description orientée résultat pour le client. Concrète et courte.]</p>
    </div>
  </div>
</section>

<!-- ══════════ COMMENT ÇA MARCHE ══════════ -->
<section>
  <div class="text-center">
    <span class="section-tag">Processus</span>
    <h2 class="section-title">Commander en 3 étapes simples</h2>
  </div>
  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <h3>Remplissez le formulaire</h3>
      <p>Saisissez votre nom et votre adresse de livraison en 30 secondes.</p>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <h3>On prépare votre commande</h3>
      <p>Votre colis est préparé et expédié sous 24h après confirmation.</p>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <h3>Recevez et payez</h3>
      <p>Livraison à domicile. Vous payez uniquement à la réception.</p>
    </div>
  </div>
</section>

<!-- ══════════ DESCRIPTION PRODUIT ══════════ -->
<section style="background:#F9FAFB">
  <div id="product-grid" style="max-width:860px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center">
    <div style="border-radius:1.5rem;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.1)">
      <!-- Remplacez par : <img src="URL_IMAGE_DETAIL" style="width:100%;display:block"> -->
      <div style="height:320px;background:linear-gradient(135deg,#EDE9FE,#DDD6FE);display:flex;align-items:center;justify-content:center;color:var(--c1);font-weight:600">
        📸 Image détail produit
      </div>
    </div>
    <div>
      <span class="section-tag">Le produit</span>
      <h2 class="section-title" style="text-align:left">[Nom complet du produit]</h2>
      <p style="color:#6B7280;line-height:1.8;font-size:.95rem;margin-bottom:1.5rem">
        [Description détaillée : caractéristiques, matériaux, dimensions, et tous
        les détails qui rassurent l'acheteur et justifient le prix.]
      </p>
      <ul style="list-style:none">
        <li style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;font-size:.875rem;color:#374151"><span style="color:var(--accent);font-weight:700">✓</span> [Caractéristique clé 1]</li>
        <li style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;font-size:.875rem;color:#374151"><span style="color:var(--accent);font-weight:700">✓</span> [Caractéristique clé 2]</li>
        <li style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;font-size:.875rem;color:#374151"><span style="color:var(--accent);font-weight:700">✓</span> [Caractéristique clé 3]</li>
        <li style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;color:#374151"><span style="color:var(--accent);font-weight:700">✓</span> [Caractéristique clé 4]</li>
      </ul>
    </div>
  </div>
</section>

<!-- ══════════ TÉMOIGNAGES ══════════ -->
<section id="testimonials">
  <div class="text-center">
    <span class="section-tag">Avis clients</span>
    <h2 class="section-title">Ce que disent nos clients</h2>
    <p class="section-sub">Plus de 4 200 clients ont déjà commandé et sont satisfaits</p>
  </div>
  <div class="reviews">
    <div class="review-card">
      <div class="review-stars">★★★★★</div>
      <p class="review-text">"[Témoignage 1 : réel et spécifique. Mentionnez un bénéfice concret vécu par le client.]"</p>
      <div class="review-author">
        <div class="review-avatar">A</div>
        <div>
          <div class="review-name">[Prénom Nom 1]</div>
          <div class="review-info">[Ville] · il y a [X] jours</div>
        </div>
      </div>
    </div>
    <div class="review-card">
      <div class="review-stars">★★★★★</div>
      <p class="review-text">"[Témoignage 2 : mentionnez une objection que le client avait et comment le produit l'a dissipée.]"</p>
      <div class="review-author">
        <div class="review-avatar">B</div>
        <div>
          <div class="review-name">[Prénom Nom 2]</div>
          <div class="review-info">[Ville] · il y a [X] jours</div>
        </div>
      </div>
    </div>
    <div class="review-card">
      <div class="review-stars">★★★★★</div>
      <p class="review-text">"[Témoignage 3 : précis sur le résultat obtenu — chiffres, temps, transformation visible.]"</p>
      <div class="review-author">
        <div class="review-avatar">C</div>
        <div>
          <div class="review-name">[Prénom Nom 3]</div>
          <div class="review-info">[Ville] · il y a [X] jours</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ══════════ GARANTIE ══════════ -->
<section id="guarantee">
  <div class="guar-box">
    <div style="font-size:3rem;margin-bottom:1rem">🛡️</div>
    <h2>Satisfait ou remboursé — [X] jours</h2>
    <p>
      Vous n'êtes pas entièrement satisfait ? Contactez-nous dans les [X] jours
      suivant la réception et nous vous remboursons intégralement, sans question,
      sans condition.
    </p>
  </div>
</section>

<!-- ══════════ FAQ ══════════ -->
<section id="faq">
  <div class="text-center" style="margin-bottom:2.5rem">
    <span class="section-tag">Questions fréquentes</span>
    <h2 class="section-title">Vous avez des questions ?</h2>
  </div>
  <div style="max-width:680px;margin:0 auto">
    <div class="faq-item open">
      <div class="faq-q" onclick="toggleFaq(this)">
        [Q1 — ex : Quel est le délai de livraison ?]
        <span class="icon">+</span>
      </div>
      <div class="faq-a">[Réponse 1 : précise, rassurante et courte.]</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        [Q2 — ex : Comment se passe le paiement ?]
        <span class="icon">+</span>
      </div>
      <div class="faq-a">[Réponse 2 : précise, rassurante et courte.]</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        [Q3 — ex : Puis-je retourner le produit ?]
        <span class="icon">+</span>
      </div>
      <div class="faq-a">[Réponse 3 : précise, rassurante et courte.]</div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        [Q4 — ex : Le produit est-il disponible en stock ?]
        <span class="icon">+</span>
      </div>
      <div class="faq-a">[Réponse 4 : précise, rassurante et courte.]</div>
    </div>
  </div>
</section>

<!-- ══════════ CTA FINAL ══════════ -->
<section id="final-cta">
  <h2>[Titre d'urgence final — ex : Ne ratez pas cette offre unique]</h2>
  <p>[Rappel valeur + urgence : prix barré, stock limité, délai de livraison rapide.]</p>
  <a href="#lp-order-form" class="cta-btn" style="font-size:1.1rem;padding:1rem 2.75rem">
    ✅ Commander maintenant
  </a>
  <p class="cta-sub" style="color:rgba(255,255,255,.5);margin-top:1rem">
    Paiement à la livraison &middot; Stock limité
  </p>
</section>

<!-- ══════════ NOTIFICATIONS FOMO ══════════ -->
<div id="fomo"></div>

<!-- ══════════ MODAL POPUP PROMO ══════════ -->
<div id="modal-overlay">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal()">&#x2715;</button>
    <div style="font-size:2.5rem;margin-bottom:.75rem">🎁</div>
    <span class="modal-badge">OFFRE SPÉCIALE</span>
    <h3>[Titre du popup — ex : Attendez ! On a quelque chose pour vous]</h3>
    <p>[Message de l'offre — ex : Commandez maintenant et bénéficiez de la livraison GRATUITE, valable uniquement aujourd'hui.]</p>
    <a href="#lp-order-form" class="cta-btn" onclick="closeModal()" style="display:flex;width:100%;justify-content:center">
      ✅ J'en profite maintenant
    </a>
    <p style="font-size:.7rem;color:#9CA3AF;margin-top:.75rem;cursor:pointer" onclick="closeModal()">Non merci, je renonce à cette offre</p>
  </div>
</div>

<script>
// Compte à rebours 30 minutes
(function(){
  var end=Date.now()+30*60*1000;
  function tick(){
    var r=Math.max(0,end-Date.now());
    var h=Math.floor(r/3600000),m=Math.floor((r%3600000)/60000),s=Math.floor((r%60000)/1000);
    document.getElementById('cd-h').textContent=String(h).padStart(2,'0');
    document.getElementById('cd-m').textContent=String(m).padStart(2,'0');
    document.getElementById('cd-s').textContent=String(s).padStart(2,'0');
    if(r>0)setTimeout(tick,1000);
  }
  tick();
})();

// Décompte stock
(function(){
  var s=12;
  setInterval(function(){
    if(s>3&&Math.random()<0.15){s--;var el=document.getElementById('stock-left');if(el)el.textContent=s;}
  },8000);
})();

// Notifications FOMO
(function(){
  var names=['Aminata','Kofi','Fatou','Ibrahima','Mariam','Seydou','Aissatou','Moussa','Adja','Lamine'];
  var cities=['Dakar','Abidjan','Douala','Bamako','Conakry','Lomé','Cotonou','Niamey','Libreville','Thiès'];
  var actions=['vient de commander','a commandé il y a 2 min','vient de confirmer sa commande'];
  function show(){
    var n=names[Math.floor(Math.random()*names.length)];
    var c=cities[Math.floor(Math.random()*cities.length)];
    var a=actions[Math.floor(Math.random()*actions.length)];
    var t=document.createElement('div');
    t.className='fomo-toast';
    t.innerHTML='<div class="fomo-ava">'+n[0]+'</div><div><b style="color:#0F0A1E">'+n+'</b> de '+c+'<br><span style="color:#6B7280">'+a+'</span><div style="font-size:.7rem;color:#9CA3AF;margin-top:.1rem">À l\'instant</div></div>';
    var c2=document.getElementById('fomo');
    c2.appendChild(t);
    setTimeout(function(){t.style.animation='fadeOut .3s ease forwards';setTimeout(function(){t.remove();},300);},4000);
  }
  setTimeout(function(){show();setInterval(show,12000);},5000);
})();

// FAQ accordion
function toggleFaq(el){
  var item=el.parentElement;
  var wasOpen=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(f){f.classList.remove('open');});
  if(!wasOpen)item.classList.add('open');
}

// Modal — 8s ou exit intent
var modalShown=false;
setTimeout(function(){
  if(!modalShown){modalShown=true;document.getElementById('modal-overlay').classList.add('show');}
},8000);
document.addEventListener('mouseleave',function(e){
  if(e.clientY<20&&!modalShown){modalShown=true;document.getElementById('modal-overlay').classList.add('show');}
});
function closeModal(){document.getElementById('modal-overlay').classList.remove('show');}
document.getElementById('modal-overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});
</script>
</body>
</html>`;
