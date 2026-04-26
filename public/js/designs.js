/* ═══════════════════════════════════════════════════════════
   Silai — Design Collection
   Trending Pakistani women's stitching styles
   Photos: Pexels (free commercial use)
═══════════════════════════════════════════════════════════ */

// Helper: build a Pexels image URL with crop
const px = (id, w=480, h=560) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

const DESIGNS = [

  // ─── Casual / Pret ────────────────────────────────────
  {
    id: 'tulip-lawn',
    name: 'Tulip Suit',
    subtitle: 'Lawn Season Favourite',
    category: 'casual',
    garment: 'fullsuit',
    photo: px(20777204),
    tags: ['Lawn','Casual','Summer'],
    desc: 'Fitted tulip-cut trousers with a relaxed straight kameez. The most-worn silhouette in Pakistani pret right now — elegant yet comfortable for daily wear.',
    preset: { fabric:'Lawn', neckline:'Round', notes:'Tulip shalwar cut, relaxed fit on kameez' },
    trend: '🔥 Trending',
  },
  {
    id: 'cigarette-chic',
    name: 'Cigarette Pants Suit',
    subtitle: 'Smart Casual',
    category: 'casual',
    garment: 'fullsuit',
    photo: px(31874451),
    tags: ['Cotton','Chiffon','Office Wear'],
    desc: 'Slim cigarette-cut trousers with an embellished or plain kameez. Polished enough for the office, light enough for brunch. A wardrobe staple.',
    preset: { fabric:'Cotton', neckline:'Ban Collar', notes:'Cigarette pants, slightly flared kameez hem' },
    trend: '💼 Bestseller',
  },
  {
    id: 'kaftan-casual',
    name: 'Kaftan Kurta',
    subtitle: 'Effortless Flow',
    category: 'casual',
    garment: 'kameez',
    photo: px(25185003),
    tags: ['Lawn','Chiffon','Resort','Casual'],
    desc: 'Loose, flowing kaftan-style kameez with wide sleeves. Airy and comfortable — perfect for summer afternoons, family gatherings or casual outings.',
    preset: { fabric:'Chiffon', neckline:'Round', notes:'Kaftan style — wide sleeves, loose body, below-knee length' },
    trend: '☀️ Summer Hit',
  },
  {
    id: 'digital-lawn',
    name: 'Digital Print Suit',
    subtitle: 'Khaddi / Gul Ahmed Style',
    category: 'casual',
    garment: 'fullsuit',
    photo: px(20777166),
    tags: ['Lawn','Printed','Pret'],
    desc: 'Bold digital floral or geometric prints on lawn fabric. Bring your own printed fabric — we stitch it to your exact silhouette: straight shirt, wide-leg or tulip trousers.',
    preset: { fabric:'Lawn', neckline:'Round', notes:'Straight shirt, use fabric prints as design — keep embellishments minimal' },
    trend: '📱 Most Ordered',
  },

  // ─── Formal ────────────────────────────────────────────
  {
    id: 'ban-collar-formal',
    name: 'Ban Collar Formal',
    subtitle: 'Pakistani Tuxedo Look',
    category: 'formal',
    garment: 'fullsuit',
    photo: px(31874455),
    tags: ['Velvet','Silk','Formal','Office'],
    desc: 'Clean ban (mandarin) collar with a structured straight-cut kameez and cigarette trousers. Exudes boardroom power while staying rooted in Pakistani elegance.',
    preset: { fabric:'Silk', neckline:'Ban Collar', notes:'Structured collar, straight cut, minimal embellishment, clean formal lines' },
    trend: '🏆 Editor\'s Pick',
  },
  {
    id: 'schiffli-chiffon',
    name: 'Schiffli Chiffon Suit',
    subtitle: 'Machine Embroidery Classic',
    category: 'formal',
    garment: 'fullsuit',
    photo: px(31874445),
    tags: ['Chiffon','Embroidered','Formal'],
    desc: 'Delicate machine-embroidered (schiffli) chiffon with a fully embroidered front panel. Flows beautifully — ideal for formal dinners and eid gatherings.',
    preset: { fabric:'Chiffon', neckline:'Round', notes:'Schiffli embroidered front panel, flowy straight cut, add inner lining' },
    trend: '✨ Eid Favourite',
  },
  {
    id: 'peplum-suit',
    name: 'Peplum Kameez',
    subtitle: 'Flattering Silhouette',
    category: 'formal',
    garment: 'fullsuit',
    photo: px(31874435),
    tags: ['Cotton','Silk','Formal','Wedding'],
    desc: 'A flared peplum hem at the hips over slim cigarette trousers. Exceptionally flattering — creates a natural waist, a go-to choice for formal functions.',
    preset: { fabric:'Silk', neckline:'V-Neck', notes:'Peplum flare at hips, V-neck, fitted body, cigarette trousers' },
    trend: '💛 Most Flattering',
  },
  {
    id: 'asymmetric-hem',
    name: 'Asymmetric Hem Kameez',
    subtitle: 'High-Low Drama',
    category: 'formal',
    garment: 'fullsuit',
    photo: px(20614162),
    tags: ['Chiffon','Organza','Formal'],
    desc: 'Front shorter, back dramatically longer — a contemporary high-low cut. Pairs with straight trousers or palazzo for a modern formal statement.',
    preset: { fabric:'Chiffon', neckline:'V-Neck', notes:'Asymmetric hemline — front knee length, back floor length, straight trousers' },
    trend: '🎭 Statement Look',
  },

  // ─── Party Wear ────────────────────────────────────────
  {
    id: 'anarkali-flared',
    name: 'Anarkali',
    subtitle: 'Floor-Length Flared',
    category: 'party',
    garment: 'fullsuit',
    photo: px(34091706),
    tags: ['Organza','Velvet','Party','Wedding'],
    desc: 'Classic floor-length flared kameez with a fitted bodice — the Anarkali never goes out of style. Add embroidery, piping or lace trim for full impact.',
    preset: { fabric:'Organza', neckline:'Round', notes:'Full Anarkali flare, fitted bodice, floor length, add embroidery detailing' },
    trend: '👑 All-Time Classic',
  },
  {
    id: 'palazzo-coord',
    name: 'Palazzo Co-ord Set',
    subtitle: 'Wide-Leg Power',
    category: 'party',
    garment: 'fullsuit',
    photo: px(34077588),
    tags: ['Silk','Chiffon','Party','Sangeet'],
    desc: 'Short embellished kameez (mid-thigh) with wide-leg matching palazzo trousers. The palazzo co-ord is dominating Pakistani party wear right now.',
    preset: { fabric:'Silk', neckline:'Square', notes:'Short kameez mid-thigh, palazzo trousers, matching fabric, add sequin or gota trim' },
    trend: '🔥 Trending 2025',
  },
  {
    id: 'cape-kameez',
    name: 'Cape-Style Suit',
    subtitle: 'Dupatta-Free Drama',
    category: 'party',
    garment: 'fullsuit',
    photo: px(34658495),
    tags: ['Chiffon','Organza','Party','Modern'],
    desc: 'An attached chiffon or organza cape replaces the separate dupatta — effortlessly chic. Looks stunning for dinners, mehndi functions and semi-formal events.',
    preset: { fabric:'Chiffon', neckline:'Boat Neck', notes:'Attached cape overlay, boat neck, straight trousers, no separate dupatta' },
    trend: '⚡ Ultra Modern',
  },
  {
    id: 'cold-shoulder',
    name: 'Cold Shoulder Kameez',
    subtitle: 'Cut-Out Glamour',
    category: 'party',
    garment: 'fullsuit',
    photo: px(34091727),
    tags: ['Velvet','Silk','Party','Night Out'],
    desc: 'Shoulder cut-outs with flowing sleeves from the elbow — sultry yet tasteful. A head-turner at dinner parties and mehndi functions.',
    preset: { fabric:'Velvet', neckline:'Boat Neck', notes:'Cold shoulder cut-outs, half sleeves from elbow, fitted body, heavy dupatta' },
    trend: '✨ Night Out',
  },

  // ─── Bridal / Festive ──────────────────────────────────
  {
    id: 'bridal-lehenga',
    name: 'Bridal Lehenga Style',
    subtitle: 'Festive & Bridal',
    category: 'bridal',
    garment: '3piece',
    photo: px(29460598),
    tags: ['Velvet','Silk','Bridal','Wedding'],
    desc: 'A heavily embellished kameez with a flared lehenga skirt and dupatta — our signature 3-piece bridal piece. Send us your fabric and we handle the entire stitching.',
    preset: { fabric:'Velvet', neckline:'Square', notes:'Lehenga style — flared skirt, heavily embellished kameez, matching dupatta finishing' },
    trend: '💍 Bridal',
  },
  {
    id: 'mirror-work',
    name: 'Mirror Work Festive',
    subtitle: 'Shisha Embellishment',
    category: 'bridal',
    garment: 'fullsuit',
    photo: px(29460594),
    tags: ['Cotton','Silk','Eid','Festive'],
    desc: 'Traditional shisha (mirror) embellishment on the neckline and sleeves — a staple of festive Pakistani dressing. Vibrant, handcrafted, deeply cultural.',
    preset: { fabric:'Cotton', neckline:'Round', notes:'Mirror/shisha work on neckline, cuffs and hem, straight kameez, shalwar' },
    trend: '🪞 Eid Special',
  },
  {
    id: 'gota-festive',
    name: 'Gota Work Suit',
    subtitle: 'Gold Ribbon Trim',
    category: 'bridal',
    garment: 'fullsuit',
    photo: px(29396108),
    tags: ['Chiffon','Silk','Festive','Mehndi'],
    desc: 'Gota patti — gold or silver ribbon appliqué on the neckline, sleeves and hemline. Festive, regal, and deeply rooted in Mughal textile tradition. Perfect for mehndi and walima.',
    preset: { fabric:'Chiffon', neckline:'Round', notes:'Gota patti trim on neckline, cuffs and hemline, straight cut, add lining' },
    trend: '🌟 Mehndi Must-Have',
  },

  // ─── Traditional ───────────────────────────────────────
  {
    id: 'gharara-classic',
    name: 'Gharara Set',
    subtitle: 'Mughal Court Heritage',
    category: 'traditional',
    garment: '3piece',
    photo: px(34076976),
    tags: ['Silk','Velvet','Traditional','Bridal'],
    desc: 'Wide-flared gharara bottoms with a short kameez and dupatta — a piece of Pakistani cultural heritage. Ideal for nikah, baraat and traditional formal events.',
    preset: { fabric:'Silk', neckline:'Square', notes:'Gharara wide flared bottoms, short kameez, matching dupatta, traditional embroidery on hem' },
    trend: '🏛️ Heritage Style',
  },
  {
    id: 'angrakha',
    name: 'Angrakha Style',
    subtitle: 'Wrap-Front Elegance',
    category: 'traditional',
    garment: 'kameez',
    photo: px(5922737),
    tags: ['Cotton','Lawn','Casual','Traditional'],
    desc: 'Wrap-around front panel with a tie or button closure — the Angrakha is having a major revival in Pakistani fashion. Flattering for all body types.',
    preset: { fabric:'Cotton', neckline:'V-Neck', notes:'Angrakha wrap-around front with tie closure, tulip shalwar or cigarette pants' },
    trend: '🔄 Major Revival',
  },
  {
    id: 'patiala-suit',
    name: 'Patiala Shalwar Suit',
    subtitle: 'Pleated Comfort',
    category: 'traditional',
    garment: 'fullsuit',
    photo: px(18380705),
    tags: ['Cotton','Lawn','Casual','Traditional'],
    desc: 'Heavily pleated Patiala shalwar paired with a short kameez — comfortable, vibrant and joyful. A favourite for casual festive wear and cultural events.',
    preset: { fabric:'Cotton', neckline:'Round', notes:'Patiala shalwar — heavy pleats, short kameez above knee, traditional dupatta' },
    trend: '🎉 Always In Style',
  },
  {
    id: 'sharara-festive',
    name: 'Sharara Set',
    subtitle: 'Flared from the Waist',
    category: 'traditional',
    garment: '3piece',
    photo: px(13562538),
    tags: ['Organza','Chiffon','Festive','Bridal'],
    desc: 'Sharara trousers flare dramatically from the waist — different from gharara which flares from the knee. A regal silhouette for eid, mehndi and formal occasions.',
    preset: { fabric:'Organza', neckline:'Square', notes:'Sharara flare from waist, heavy embellished kameez, matching dupatta with border' },
    trend: '👑 Royal Look',
  },

  // ─── Modern Fusion ─────────────────────────────────────
  {
    id: 'coord-set-modern',
    name: 'Coord Set',
    subtitle: 'Matching Two-Piece',
    category: 'modern',
    garment: 'fullsuit',
    photo: px(31874429),
    tags: ['Cotton','Linen','Modern','Casual'],
    desc: 'Matching top and trouser in a tonal or contrasting co-ord set. Monochrome co-ords are dominating Pakistani modern fashion — clean, minimal, effortless.',
    preset: { fabric:'Cotton', neckline:'Ban Collar', notes:'Matching co-ord set, minimal embellishment, clean modern lines, same fabric top and bottom' },
    trend: '🤍 Minimal Chic',
  },
  {
    id: 'fusion-maxi',
    name: 'Fusion Maxi Dress',
    subtitle: 'East Meets West',
    category: 'modern',
    garment: 'kameez',
    photo: px(34933703),
    tags: ['Chiffon','Silk','Modern','Party'],
    desc: 'A floor-length kameez with western-inspired silhouette — structured shoulders, fitted waist, flared hem. Perfect for diaspora events and multicultural celebrations.',
    preset: { fabric:'Chiffon', neckline:'V-Neck', notes:'Maxi length, fitted waist, flared hem, structured shoulders — fusion silhouette' },
    trend: '🌍 Diaspora Fave',
  },
  {
    id: 'linen-coord',
    name: 'Linen Summer Set',
    subtitle: 'Breathable & Chic',
    category: 'modern',
    garment: 'fullsuit',
    photo: px(25184951),
    tags: ['Cotton','Linen','Summer','Modern'],
    desc: 'Relaxed linen kameez with wide-leg trousers — muted earth tones, zero fuss. The linen co-ord trend is everywhere in 2025, and our tailors can stitch it perfectly from your fabric.',
    preset: { fabric:'Cotton', neckline:'Ban Collar', notes:'Relaxed linen fit, wide-leg trousers, earth tones, minimal stitching detail' },
    trend: '🌿 2025 Trend',
  },
];

// ─── Render the designs grid ──────────────────────────────
window.renderDesigns = function(filter) {
  const grid = document.getElementById('designs-grid');
  if (!grid) return;

  const active = filter || 'all';
  const filtered = active === 'all' ? DESIGNS : DESIGNS.filter(d => d.category === active);

  grid.innerHTML = filtered.map(d => `
    <div class="design-card" data-category="${d.category}" data-id="${d.id}">
      <div class="design-card-hero">
        <img src="${d.photo}" alt="${d.name}" loading="lazy"
             onerror="this.parentElement.style.background='linear-gradient(135deg,#1b4434,#225340)';this.style.display='none'">
        ${d.trend ? `<span class="design-trend-badge">${d.trend}</span>` : ''}
      </div>
      <div class="design-card-body">
        <div class="design-card-tags">
          ${d.tags.map(t => `<span class="design-tag">${t}</span>`).join('')}
        </div>
        <h3 class="design-card-name">${d.name}</h3>
        <p class="design-card-subtitle">${d.subtitle}</p>
        <p class="design-card-desc">${d.desc}</p>
        <button class="btn btn-primary w-full design-order-btn" onclick="window.orderDesign('${d.id}')">
          🛍️ Order This Style
        </button>
      </div>
    </div>
  `).join('');
};

// Navigate to order flow with the selected design pre-applied
window.orderDesign = function(designId) {
  const d = DESIGNS.find(x => x.id === designId);
  if (!d) return;
  window.location.hash = '#order';
  setTimeout(() => {
    if (typeof window.openConfigModal === 'function') {
      window.openConfigModal(d.garment, d.preset);
    }
  }, 350);
};

// ─── Filter bar wiring ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('designs-filter-bar');
  if (bar) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.designs-filter-btn');
      if (!btn) return;
      bar.querySelectorAll('.designs-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.renderDesigns(btn.dataset.filter);
    });
  }
  if ((window.location.hash || '').replace('#','') === 'designs') window.renderDesigns();
});
