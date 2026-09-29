// One free-text location filter searches address, village, crossing, PIN, city and state.
window.normalizeWhatsAppNumber = value => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return '';
};
const filterRow = document.querySelector('.filters');
filterRow.innerHTML = '<label>📍 <input id="locationSearch" placeholder="गाँव, चौराहा, पिनकोड, शहर या राज्य" aria-label="इलाके से खोजें"></label><button id="clearFilters">फ़िल्टर हटाएँ</button>';
document.querySelector('#locationSearch').oninput = debounce(window.loadPosts, 450);
const categoryGrid = document.querySelector('#categoryGrid');
const categoryToggle = document.querySelector('#categoryToggle');
categoryGrid.hidden = false;
categoryToggle.onclick = () => {
  categoryGrid.hidden = !categoryGrid.hidden;
  categoryToggle.setAttribute('aria-expanded', String(!categoryGrid.hidden));
  categoryToggle.textContent = categoryGrid.hidden ? 'श्रेणियाँ दिखाएँ +' : 'श्रेणियाँ छिपाएँ −';
};
categoryGrid.addEventListener('click', event => {
  if (!event.target.closest('.category-card')) return;
  setTimeout(() => {
    document.querySelector('.listing-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}, true);
document.querySelector('#showAllCategories').onclick = event => {
  event.preventDefault();
  selectedCategory = '';
  renderCategories();
  categoryGrid.hidden = false;
  categoryToggle.setAttribute('aria-expanded', 'true');
  categoryToggle.textContent = 'श्रेणियाँ छिपाएँ −';
  window.loadPosts();
};
document.querySelector('#clearFilters').onclick = () => {
  document.querySelector('#locationSearch').value = '';
  document.querySelector('#availabilityFilter').value = '';
  document.querySelector('#searchInput').value = '';
  selectedCategory = '';
  renderCategories();
  window.loadPosts();
};
window.loadPosts = async function () {
  const params = new URLSearchParams({ type: 'service' });
  if (selectedCategory) params.set('category', selectedCategory);
  const serviceTerm = document.querySelector('#searchInput').value.trim();
  const locationTerm = document.querySelector('#locationSearch').value.trim();
  const available = document.querySelector('#availabilityFilter').value;
  if (serviceTerm) params.set('q', serviceTerm);
  if (locationTerm) params.set('location', locationTerm);
  if (available) params.set('available', available);
  let posts = [];
  try { posts = await api(`/api/posts?${params}`); } catch {}
  if (!posts.length && !selectedCategory && !serviceTerm && !locationTerm) posts = sampleCards();
  renderPosts(posts);
};

// Open a complete listing in a separate tab when its card is clicked.
const detailObserver = new MutationObserver(() => {
  document.querySelectorAll('[data-detail-id]').forEach(card => {
    const id = card.dataset.detailId;
    if (!id || card.dataset.detailBound) return;
    card.dataset.detailBound = 'true';
    card.style.cursor = 'pointer';
    card.addEventListener('click', event => {
      if (event.target.closest('button,a')) return;
      window.open(`/post/${encodeURIComponent(id)}`, '_blank', 'noopener');
    });
  });
});
detailObserver.observe(document.querySelector('#serviceGrid'), { childList: true, subtree: true });
detailObserver.observe(document.querySelector('#workGrid'), { childList: true, subtree: true });
const normalizeWhatsAppLinks = new MutationObserver(() => {
  document.querySelectorAll('a.wa[href*="wa.me/"]').forEach(link => {
    const number = window.normalizeWhatsAppNumber(link.href.split('/').pop());
    if (number) link.href = `https://wa.me/${number}`;
  });
});
normalizeWhatsAppLinks.observe(document.querySelector('#serviceGrid'), { childList: true, subtree: true });
normalizeWhatsAppLinks.observe(document.querySelector('#workGrid'), { childList: true, subtree: true });

window.contactProvider = function (_phone, name, postId) {
  openModal(`<h2 id="modalTitle">${escapeHTML(name)} से संपर्क करें</h2><p class="modal-intro">कॉल रिक्वेस्ट Admin inbox में इस पोस्ट और सेवा प्रदाता के साथ दर्ज होगी।</p><form id="callbackForm"><div class="field"><label>आपका नाम</label><input name="name" required autocomplete="name" placeholder="पूरा नाम"></div><div class="field"><label>मोबाइल नंबर</label><input name="phone" required inputmode="numeric" pattern="[0-9]{10}" placeholder="10 अंकों का नंबर"></div><button class="button primary-button form-submit">मुझे कॉल करें</button></form>`);
  document.querySelector('#callbackForm').onsubmit = async event => {
    event.preventDefault();
    if (!postId) return notify('इस sample पोस्ट के लिए कॉल रिक्वेस्ट उपलब्ध नहीं है।');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api('/api/leads', { method: 'POST', body: JSON.stringify({ ...form, postId }) });
      closeModal(); notify('कॉल रिक्वेस्ट Admin inbox में भेज दी गई है।');
    } catch (error) { notify(error.message); }
  };
};

document.querySelector('#locationBtn').onclick = () => {
  openModal(`<h2 id="modalTitle">अपने आसपास खोजें</h2><p class="modal-intro">गाँव, चौराहा, पिनकोड, शहर या राज्य लिखें।</p><form id="locationForm"><div class="field"><label>इलाका</label><input name="location" value="${escapeHTML(document.querySelector('#locationSearch').value)}" placeholder="जैसे — वर्तक नगर, 400606, ठाणे" autofocus></div><button class="button primary-button form-submit">इस इलाके में खोजें</button></form>`);
  document.querySelector('#locationForm').onsubmit = event => {
    event.preventDefault(); document.querySelector('#locationSearch').value = new FormData(event.currentTarget).get('location').trim();
    document.querySelector('#locationLabel').textContent = document.querySelector('#locationSearch').value || 'इलाका चुनें';
    closeModal(); window.loadPosts(); document.querySelector('#services').scrollIntoView({ behavior: 'smooth' });
  };
};
