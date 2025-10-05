/* app.js - improved, robust version
   Features:
   - sorting, filtering, pagination
   - favourites persisted in localStorage
   - accessible modal for restaurant details + reviews
   - safe DOM event handling (no reliance on global `event`)
*/

const restaurants = [
  {id:1,name:'Pasta Palace',cuisine:'italian',rating:4.5,price:2,desc:'Cozy spot for handmade pastas',image:'🍝',reviews:[{name:'Amy',text:'Loved the carbonara!',rating:5}]},
  {id:2,name:'Spice Route',cuisine:'indian',rating:4.6,price:2,desc:'Regional Indian dishes & thalis',image:'🍛',reviews:[{name:'Raj',text:'Best biryani near me',rating:5}]},
  {id:3,name:'Dragon Express',cuisine:'chinese',rating:4.1,price:1,desc:'Quick & tasty Chinese classics',image:'🥡',reviews:[]},
  {id:4,name:'Bangkok Bites',cuisine:'thai',rating:4.3,price:2,desc:'Street-style Thai flavours',image:'🍜',reviews:[]},
  {id:5,name:'Fine Dine Steakhouse',cuisine:'american',rating:4.8,price:3,desc:'Premium steaks & wine list',image:'🥩',reviews:[{name:'Liam',text:'Perfect steak and service',rating:5}]},
  {id:6,name:'Vegan Vibes',cuisine:'fusion',rating:4.2,price:2,desc:'Plant-based comfort food',image:'🥗',reviews:[]},
  {id:7,name:'Bella Pizza',cuisine:'italian',rating:4.0,price:1,desc:'Thin crust pizzas, classic flavours',image:'🍕',reviews:[]},
  {id:8,name:'Noodle House',cuisine:'chinese',rating:3.9,price:1,desc:'Comforting noodle bowls',image:'🍜',reviews:[]},
  {id:9,name:'Curry Corner',cuisine:'indian',rating:4.4,price:1,desc:'Homestyle curries & breads',image:'🍛',reviews:[]},
  {id:10,name:'Green Garden',cuisine:'fusion',rating:4.3,price:2,desc:'Fresh seasonal bowls & juices',image:'🥗',reviews:[]},
];

const refs = {
  cards: document.getElementById('cards'),
  resultsCount: document.getElementById('resultsCount'),
  resultsTitle: document.getElementById('resultsTitle'),
  priceFilter: document.getElementById('priceFilter'),
  cuisineFilter: document.getElementById('cuisineFilter'),
  minRating: document.getElementById('minRating'),
  ratingValue: document.getElementById('ratingValue'),
  applyFilters: document.getElementById('applyFilters'),
  resetFilters: document.getElementById('resetFilters'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  heroLocation: document.getElementById('heroLocation'),
  findBtn: document.getElementById('findBtn'),
  sortSelect: document.getElementById('sortSelect'),
  favoritesBtn: document.getElementById('favoritesBtn'),
  modal: document.getElementById('modal'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
};

const state = {
  page: 1,
  perPage: 6,
  filtered: restaurants.slice(),
  sort: 'popular',
  favourites: new Set(),
};

function loadFavourites(){
  try{
    const arr = JSON.parse(localStorage.getItem('favs') || '[]');
    state.favourites = new Set(Array.isArray(arr) ? arr : []);
  }catch(e){
    state.favourites = new Set();
  }
}
function saveFavourites(){
  localStorage.setItem('favs', JSON.stringify(Array.from(state.favourites)));
}

function escapeHtml(str=''){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function averageRating(reviews){
  if(!reviews || reviews.length===0) return 0;
  const sum = reviews.reduce((s,r)=>s + (Number(r.rating) || 0), 0);
  return +(sum / reviews.length).toFixed(2);
}

function applyFiltersAndSearch(){
  let list = restaurants.slice();
  const price = refs.priceFilter.value;
  const cuisine = refs.cuisineFilter.value;
  const minR = parseFloat(refs.minRating.value || 0);
  const q = (refs.searchInput.value || '').trim().toLowerCase();

  if(price !== 'any'){
    list = list.filter(r => r.price === parseInt(price, 10));
  }
  if(cuisine !== 'any'){
    list = list.filter(r => r.cuisine === cuisine);
  }
  if(minR > 0){
    list = list.filter(r => (r.rating || 0) >= minR);
  }
  if(q){
    list = list.filter(r => {
      return r.name.toLowerCase().includes(q)
        || r.desc.toLowerCase().includes(q)
        || r.cuisine.toLowerCase().includes(q);
    });
  }

  state.filtered = list;
  state.page = 1;
  render();
}

function sortList(list){
  switch(state.sort){
    case 'rating':
      return list.sort((a,b)=> (b.rating||0) - (a.rating||0));
    case 'price_low':
      return list.sort((a,b)=> a.price - b.price);
    case 'price_high':
      return list.sort((a,b)=> b.price - a.price);
    case 'name':
      return list.sort((a,b)=> a.name.localeCompare(b.name));
    default:
      return list;
  }
}

function render(){
  const all = sortList(state.filtered.slice());
  const total = all.length;
  const start = (state.page - 1) * state.perPage;
  const pageItems = all.slice(start, start + state.perPage);

  refs.cards.innerHTML = '';
  if(pageItems.length === 0){
    refs.cards.innerHTML = '<div class="no-results">No restaurants found.</div>';
  } else {
    const fragment = document.createDocumentFragment();
    pageItems.forEach(r => {
      const article = document.createElement('article');
      article.className = 'card';
      article.innerHTML = `
        <div class="media" aria-hidden="true">${escapeHtml(r.image)}</div>
        <div class="content">
          <h4>${escapeHtml(r.name)}</h4>
          <div class="meta">
            <div>${escapeHtml(r.cuisine.toUpperCase())} • ${'$'.repeat(r.price)}</div>
            <div>⭐ ${Number(r.rating || 0).toFixed(1)}</div>
          </div>
          <p style="color:var(--muted);margin:8px 0 0">${escapeHtml(r.desc)}</p>
          <div class="actions">
            <div style="display:flex;gap:8px">
              <button class="btn js-view" data-id="${r.id}" aria-label="View ${escapeHtml(r.name)}">View</button>
              <button class="btn secondary js-directions" data-id="${r.id}" aria-label="Directions to ${escapeHtml(r.name)}">Directions</button>
            </div>
            <button class="like js-fav" data-id="${r.id}" aria-pressed="${state.favourites.has(r.id)}">${state.favourites.has(r.id) ? '♥' : '♡'}</button>
          </div>
        </div>
      `;
      fragment.appendChild(article);
    });
    refs.cards.appendChild(fragment);
  }

  refs.resultsCount.textContent = `${total} results`;
  refs.pageInfo.textContent = state.page;
  refs.prevPage.disabled = state.page <= 1;
  refs.nextPage.disabled = (state.page * state.perPage) >= total;
}

// Event handlers (single-responsibility)
refs.cards.addEventListener('click', (e) => {
  const viewBtn = e.target.closest('.js-view');
  const favBtn = e.target.closest('.js-fav');
  const dirBtn = e.target.closest('.js-directions');

  if(viewBtn){
    const id = Number(viewBtn.dataset.id);
    openDetailsModal(id);
    return;
  }
  if(favBtn){
    const id = Number(favBtn.dataset.id);
    toggleFavourite(id, favBtn);
    return;
  }
  if(dirBtn){
    // Placeholder - in real app you'd open maps
    alert('Directions: This is a demo. Integrate maps for real directions.');
  }
});

function toggleFavourite(id, btnEl){
  if(state.favourites.has(id)){
    state.favourites.delete(id);
    if(btnEl) btnEl.textContent = '♡';
    if(btnEl) btnEl.setAttribute('aria-pressed','false');
  } else {
    state.favourites.add(id);
    if(btnEl) btnEl.textContent = '♥';
    if(btnEl) btnEl.setAttribute('aria-pressed','true');
  }
  saveFavourites();
}

// Modal helpers
function openModal(){
  refs.modal.setAttribute('aria-hidden','false');
  refs.modal.style.display = 'flex';
  // trap focus if needed (simple)
  refs.modalClose.focus();
}
function closeModal(){
  refs.modal.setAttribute('aria-hidden','true');
  refs.modal.style.display = 'none';
}

// Build modal content and attach local listeners (removed on close to avoid duplicates)
function openDetailsModal(id){
  const r = restaurants.find(x => x.id === id);
  if(!r) return;

  // Recalculate rating from reviews (in case reviews changed)
  r.rating = averageRating(r.reviews.length ? r.reviews : []);

  refs.modalBody.innerHTML = `
    <h2>${escapeHtml(r.name)} <small style="color:var(--muted);font-weight:500">· ${escapeHtml(r.cuisine.toUpperCase())} · ${'$'.repeat(r.price)}</small></h2>
    <p style="margin-top:6px;color:var(--muted)">${escapeHtml(r.desc)}</p>
    <div style="display:flex;gap:12px;align-items:center;margin-top:10px">
      <div style="font-size:28px">${escapeHtml(r.image)}</div>
      <div style="font-weight:700">⭐ ${Number(r.rating || 0).toFixed(1)}</div>
      <button id="modalFavBtn" class="ghost">${state.favourites.has(r.id) ? '♥ Remove favourite' : '♡ Add to favourites'}</button>
    </div>

    <hr style="margin:12px 0">

    <section id="reviewsSection">
      <h3>Reviews (${r.reviews.length})</h3>
      <div id="reviewsList">
        ${r.reviews.length ? r.reviews.map(rv => `<div style="margin-bottom:8px"><strong>${escapeHtml(rv.name)}</strong> · ⭐ ${Number(rv.rating)}<div style="color:var(--muted)">${escapeHtml(rv.text)}</div></div>`).join('') : '<div style="color:var(--muted)">No reviews yet — be the first!</div>'}
      </div>
    </section>

    <form id="reviewForm" style="margin-top:12px">
      <h4>Add a review</h4>
      <label style="display:block;margin-bottom:6px"><input id="revName" placeholder="Your name" required style="padding:8px;width:100%;border-radius:8px;border:1px solid #eaeaea"></label>
      <label style="display:block;margin-bottom:6px">Rating:
        <select id="revRating" required>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Very good</option>
          <option value="3">3 - Good</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Awful</option>
        </select>
      </label>
      <label style="display:block;margin-bottom:6px"><textarea id="revText" rows="3" placeholder="Write your review" required style="padding:8px;width:100%;border-radius:8px;border:1px solid #eaeaea"></textarea></label>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn">Post review</button>
        <button type="button" id="cancelReview" class="ghost">Cancel</button>
      </div>
    </form>
  `;

  // Attach local handlers
  const modalFavBtn = document.getElementById('modalFavBtn');
  const reviewForm = document.getElementById('reviewForm');
  const cancelReview = document.getElementById('cancelReview');

  const onModalFav = () => {
    toggleFavourite(r.id, document.querySelector(`.js-fav[data-id="${r.id}"]`));
    modalFavBtn.textContent = state.favourites.has(r.id) ? '♥ Remove favourite' : '♡ Add to favourites';
    // also update card favourite visual if visible
    const cardFavBtn = document.querySelector(`.js-fav[data-id="${r.id}"]`);
    if(cardFavBtn) cardFavBtn.textContent = state.favourites.has(r.id) ? '♥' : '♡';
  };
  modalFavBtn.addEventListener('click', onModalFav);

  const onReviewSubmit = (ev) => {
    ev.preventDefault();
    const name = document.getElementById('revName').value.trim();
    const rating = Number(document.getElementById('revRating').value);
    const text = document.getElementById('revText').value.trim();
    if(!name || !text) return alert('Please enter name and review text.');
    r.reviews.unshift({name, rating, text});
    r.rating = averageRating(r.reviews);
    // Re-render the modal content (clean approach: re-open)
    openDetailsModal(r.id); // this replaces modalBody and rebinds handlers
    // Also re-render listings so rating updates reflect
    applyFiltersAndSearch();
  };
  reviewForm.addEventListener('submit', onReviewSubmit);

  cancelReview.addEventListener('click', () => {
    reviewForm.reset();
  });

  openModal();

  // When modal closes we should remove these listeners -- keep simple by re-rendering modal body on open (handlers are lost)
  // If you want to explicitly remove handlers, store references and remove on close.
}

// favorites modal
refs.favoritesBtn.addEventListener('click', () => {
  const favIds = Array.from(state.favourites);
  if(favIds.length === 0){
    refs.modalBody.innerHTML = `<h3>Favourites</h3><div style="color:var(--muted)">You have no favourites yet. Click ♥ on a restaurant to add it here.</div>`;
    openModal();
    return;
  }
  const favItems = restaurants.filter(r => state.favourites.has(r.id));
  refs.modalBody.innerHTML = `
    <h3>Favourites (${favItems.length})</h3>
    <div>
      ${favItems.map(r => `<div style="padding:8px 0;border-bottom:1px solid #f1f1f1"><strong>${escapeHtml(r.name)}</strong> · ⭐ ${Number(r.rating || 0).toFixed(1)} <div style="color:var(--muted)">${escapeHtml(r.desc)}</div></div>`).join('')}
    </div>
  `;
  openModal();
});

// other UI listeners
refs.applyFilters.addEventListener('click', applyFiltersAndSearch);
refs.resetFilters.addEventListener('click', () => {
  refs.priceFilter.value = 'any';
  refs.cuisineFilter.value = 'any';
  refs.minRating.value = 0;
  refs.ratingValue.textContent = '0+';
  refs.searchInput.value = '';
  state.filtered = restaurants.slice();
  state.page = 1;
  render();
});
refs.searchBtn.addEventListener('click', applyFiltersAndSearch);
refs.searchInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') applyFiltersAndSearch(); });
refs.findBtn.addEventListener('click', () => {
  const loc = refs.heroLocation.value.trim();
  refs.resultsTitle.textContent = loc ? `Popular in ${escapeHtml(loc)}` : 'Popular near you';
  applyFiltersAndSearch();
});
refs.sortSelect.addEventListener('change', (e) => { state.sort = e.target.value; render(); });
refs.prevPage.addEventListener('click', () => { if(state.page > 1){ state.page--; render(); }});
refs.nextPage.addEventListener('click', () => { state.page++; render(); });

// modal close/trap
refs.modalClose.addEventListener('click', closeModal);
refs.modal.addEventListener('click', (e) => {
  if(e.target === refs.modal) closeModal(); // click outside content closes modal
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && refs.modal.getAttribute('aria-hidden') === 'false') closeModal();
});

// rating range UI
refs.minRating.addEventListener('input', () => { refs.ratingValue.textContent = `${refs.minRating.value}+`; });

// init
function init(){
  loadFavourites();
  state.filtered = restaurants.slice();
  state.page = 1;
  state.sort = refs.sortSelect ? refs.sortSelect.value : 'popular';
  render();
}
init();
