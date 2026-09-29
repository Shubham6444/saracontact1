// Add the user directory to the admin panel while preserving its post/category views.
const loadAdminDataWithoutUsers = window.loadAdminData;
new MutationObserver(() => {
  const form = document.querySelector('#authForm');
  const phone = form?.elements.namedItem('phone');
  if (phone && !form.elements.namedItem('name')) {
    phone.removeAttribute('pattern');
    phone.removeAttribute('inputmode');
    phone.placeholder = 'मोबाइल नंबर या Admin email';
    const label = phone.closest('.field')?.querySelector('label');
    if (label && label.textContent !== 'मोबाइल नंबर या Admin email') label.replaceChildren('मोबाइल नंबर या Admin email');
  }
}).observe(document.querySelector('#modalContent'), { childList: true, subtree: true });
window.loadPosts = async function () {
  const params = new URLSearchParams();
  params.set('type', currentPostType);
  if (selectedCategory) params.set('category', selectedCategory);
  if (document.querySelector('#searchInput').value.trim()) params.set('q', document.querySelector('#searchInput').value.trim());
  for (const [key, selector] of [['city', '#cityFilter'], ['state', '#stateFilter'], ['pincode', '#pincodeFilter'], ['available', '#availabilityFilter']]) {
    const value = document.querySelector(selector)?.value.trim();
    if (value) params.set(key, value);
  }
  let posts = [];
  try { posts = await api(`/api/posts?${params}`); } catch {}
  if (!posts.length && currentPostType === 'service' && !selectedCategory && !document.querySelector('#searchInput').value && !document.querySelector('#pincodeFilter').value) {
    posts = sampleCards().filter(post => !document.querySelector('#cityFilter').value || post.location.city.toLowerCase().includes(document.querySelector('#cityFilter').value.toLowerCase()));
  }
  renderPosts(posts);
};
const stateFilter = document.createElement('label');
stateFilter.innerHTML = '⌖ <input id="stateFilter" placeholder="राज्य" aria-label="राज्य">';
document.querySelector('.filters').insertBefore(stateFilter, document.querySelector('#clearFilters'));
document.querySelector('#stateFilter').oninput = debounce(window.loadPosts, 500);
document.querySelector('#clearFilters').addEventListener('click', () => { document.querySelector('#stateFilter').value = ''; }, { capture: true });
window.loadAdminData = async function () {
  if (adminTab !== 'users') return loadAdminDataWithoutUsers();
  const list = document.querySelector('#adminList');
  if (!list) return;
  try {
    const users = await api('/api/auth/admin/users');
    list.innerHTML = users.length ? users.map(user => `<article class="admin-item"><div><b>${escapeHTML(user.name)}</b><small>${escapeHTML(user.phone)} · ${escapeHTML(user.role)} · ${escapeHTML(user.location?.city || '')}</small></div><button data-user-edit="${user._id}" data-name="${escapeHTML(user.name)}" data-role="${user.role}">संपादित</button><button class="danger" data-user-delete="${user._id}">हटाएँ</button></article>`).join('') : '<p class="modal-intro">अभी कोई ग्राहक या प्रदाता पंजीकृत नहीं है।</p>';
    list.querySelectorAll('[data-user-edit]').forEach(button => button.onclick = async () => {
      const name = prompt('नाम अपडेट करें', button.dataset.name);
      if (!name) return;
      const role = prompt('Role: customer या provider', button.dataset.role);
      if (!['customer', 'provider'].includes(role)) return notify('Role customer या provider होना चाहिए।');
      try { await api(`/api/auth/admin/users/${button.dataset.userEdit}`, { method: 'PATCH', body: JSON.stringify({ name, role }) }); window.loadAdminData(); }
      catch (error) { notify(error.message); }
    });
    list.querySelectorAll('[data-user-delete]').forEach(button => button.onclick = async () => {
      if (!confirm('यूज़र और उनकी पोस्ट हटाएँ?')) return;
      try { await api(`/api/auth/admin/users/${button.dataset.userDelete}`, { method: 'DELETE' }); window.loadAdminData(); }
      catch (error) { notify(error.message); }
    });
  } catch (error) { list.textContent = error.message; }
};
window.contactProvider = function (phone, name) {
  if (currentUser) { location.href = `tel:${phone}`; return; }
  openModal(`<h2 id="modalTitle">${escapeHTML(name)} से संपर्क करें</h2><p class="modal-intro">अपना नाम और मोबाइल नंबर दें। प्रदाता आपसे संपर्क करेगा।</p><form id="callbackForm"><div class="field"><label>आपका नाम</label><input name="name" required autocomplete="name" placeholder="पूरा नाम"></div><div class="field"><label>मोबाइल नंबर</label><input name="phone" required inputmode="numeric" pattern="[0-9]{10}" placeholder="10 अंकों का नंबर"></div><button class="button primary-button form-submit">मुझे कॉल करें</button></form>`);
  document.querySelector('#callbackForm').onsubmit = async event => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try { await api('/api/leads', { method: 'POST', body: JSON.stringify({ ...form, providerPhone: phone, providerName: name }) }); closeModal(); notify('आपकी कॉल रिक्वेस्ट भेज दी गई है।'); }
    catch (error) { notify(error.message); }
  };
};
new MutationObserver(() => {
  const form = document.querySelector('#postForm');
  if (!form || form.dataset.uploadReady) return;
  form.dataset.uploadReady = 'true';
  const previousImages = form.elements.namedItem('images');
  const hiddenImages = document.createElement('input');
  hiddenImages.type = 'hidden';
  hiddenImages.name = 'images';
  hiddenImages.value = previousImages?.value || (window.editPostImages || []).join('\n');
  previousImages?.remove();
  form.append(hiddenImages);
  const field = document.createElement('div');
  const categorySelect = form.querySelector('#postCategory');
  if (categorySelect && categories.length) {
    const selected = categorySelect.value;
    categorySelect.innerHTML = '<option value="">श्रेणी चुनें</option>' + categories.map(category => `<option>${escapeHTML(category.name)}</option>`).join('') + '<option value="custom">अन्य — अपना नाम लिखें</option>';
    categorySelect.value = selected;
  }
  if (form.elements.namedItem('peopleNeeded')) {
    const statusField = document.createElement('div');
    statusField.className = 'field';
    statusField.innerHTML = '<label>काम की स्थिति</label><select name="available"><option value="true">खुला — लोग चाहिए</option><option value="false">Full / बंद</option></select>';
    form.querySelector('.form-grid')?.append(statusField);
  }
  field.className = 'field full';
  field.innerHTML = '<label>तस्वीरें अपलोड करें (कम से कम 3, JPG / PNG / WebP)</label><input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple><small>हर तस्वीर 5 MB तक, अधिकतम 8 तस्वीरें।</small>';
  form.querySelector('.form-grid')?.prepend(field);
  const submit = form.onsubmit;
  form.onsubmit = async event => {
    const input = form.elements.namedItem('photos');
    const imageCount = hiddenImages.value.split(/\n|,/).map(value => value.trim()).filter(Boolean).length;
    if (!input?.files?.length && !form.elements.namedItem('peopleNeeded') && imageCount < 3) {
      event.preventDefault();
      return notify('सेवा पोस्ट के लिए कम से कम 3 तस्वीरें अपलोड करें।');
    }
    if (!input?.files?.length) return submit.call(form, event);
    event.preventDefault();
    if (!form.elements.namedItem('peopleNeeded') && imageCount + input.files.length < 3) return notify('सेवा पोस्ट के लिए कम से कम 3 तस्वीरें अपलोड करें।');
    const button = form.querySelector('[type="submit"]') || form.querySelector('.form-submit');
    if (button) button.disabled = true;
    try {
      const data = new FormData();
      for (const file of input.files) data.append('photos', file);
      const response = await fetch('/api/uploads', { method: 'POST', body: data, credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'तस्वीरें अपलोड नहीं हो सकीं।');
      const imageField = form.elements.namedItem('images');
      imageField.value = [...imageField.value.split(/\n|,/).map(value => value.trim()).filter(Boolean), ...result.images].join('\n');
      await submit.call(form, event);
    } catch (error) { notify(error.message); }
    finally { if (button) button.disabled = false; }
  };
}).observe(document.querySelector('#modalContent'), { childList: true, subtree: true });
