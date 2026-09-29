const previousAdminLoader = window.loadAdminData;
function adminConfirm(message, heading = 'कृपया पुष्टि करें') {
  return new Promise(resolve => {
    openModal(`<h2 id="modalTitle">${escapeHTML(heading)}</h2><p class="modal-intro">${escapeHTML(message)}</p><div class="modal-actions"><button class="button" id="confirmCancel">रद्द करें</button><button class="button orange-button" id="confirmAccept">जारी रखें</button></div>`);
    document.querySelector('#confirmCancel').onclick = () => { closeModal(); resolve(false); };
    document.querySelector('#confirmAccept').onclick = () => { closeModal(); resolve(true); };
    document.querySelector('#modalClose').onclick = () => { closeModal(); resolve(false); };
  });
}
function editInModal(title, fields, onSave) {
  openModal(`<h2 id="modalTitle">${escapeHTML(title)}</h2><form id="adminEditForm" class="admin-edit-form">${fields}<button class="button primary-button form-submit">सेव करें</button></form>`);
  document.querySelector('#adminEditForm').onsubmit = async event => { event.preventDefault(); try { await onSave(Object.fromEntries(new FormData(event.currentTarget))); closeModal(); window.loadAdminData(); notify('जानकारी सेव हो गई।'); } catch (error) { notify(error.message); } };
}

window.loadAdminData = async function () {
  if (adminTab === 'posts') return previousAdminLoader();
  const list = document.querySelector('#adminList');
  if (!list) return;
  try {
    if (adminTab === 'categories') {
      const categories = await api('/api/categories');
      list.innerHTML = `<form id="newCategoryForm" class="field"><label>नई श्रेणी</label><div class="admin-add-row"><input name="name" required placeholder="श्रेणी का नाम"><input name="icon" maxlength="4" placeholder="🧰"><button class="button primary-button">जोड़ें</button></div></form>` + categories.map(category => `<article class="admin-item"><div><b>${escapeHTML(category.icon)} ${escapeHTML(category.name)}</b></div><button data-category-edit="${category._id}" data-name="${escapeHTML(category.name)}" data-icon="${escapeHTML(category.icon)}">संपादित</button><button class="danger" data-category-delete="${category._id}">हटाएँ</button></article>`).join('');
      document.querySelector('#newCategoryForm').onsubmit = async event => { event.preventDefault(); try { await api('/api/categories', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); await loadCategories(); window.loadAdminData(); notify('श्रेणी जोड़ दी गई।'); } catch (error) { notify(error.message); } };
      list.querySelectorAll('[data-category-edit]').forEach(button => button.onclick = () => editInModal('श्रेणी संपादित करें', `<div class="field"><label>श्रेणी का नाम</label><input name="name" required value="${escapeHTML(button.dataset.name)}"></div><div class="field"><label>आइकन</label><input name="icon" value="${escapeHTML(button.dataset.icon)}"></div>`, data => api(`/api/categories/${button.dataset.categoryEdit}`, { method: 'PATCH', body: JSON.stringify(data) }).then(loadCategories)));
      list.querySelectorAll('[data-category-delete]').forEach(button => button.onclick = async () => { if (!await adminConfirm('यह श्रेणी हटाएँ?', 'श्रेणी हटाएँ')) return; try { await api(`/api/categories/${button.dataset.categoryDelete}`, { method: 'DELETE' }); await loadCategories(); window.loadAdminData(); } catch (error) { notify(error.message); } });
    } else if (adminTab === 'users') {
      const users = await api('/api/auth/admin/users');
      list.innerHTML = users.length ? users.map(user => `<article class="admin-item"><div><b>${escapeHTML(user.name)}</b><small>${escapeHTML(user.phone || user.email || '')} · ${escapeHTML(user.role)} · ${escapeHTML(user.location?.city || '')}</small></div><button data-user-edit="${user._id}" data-name="${escapeHTML(user.name)}" data-phone="${escapeHTML(user.phone || '')}" data-role="${escapeHTML(user.role)}">संपादित</button><button class="danger" data-user-delete="${user._id}">हटाएँ</button></article>`).join('') : '<p class="modal-intro">अभी कोई ग्राहक या प्रदाता पंजीकृत नहीं है।</p>';
      list.querySelectorAll('[data-user-edit]').forEach(button => button.onclick = () => editInModal('यूज़र संपादित करें', `<div class="field"><label>नाम</label><input name="name" required value="${escapeHTML(button.dataset.name)}"></div><div class="field"><label>मोबाइल</label><input name="phone" value="${escapeHTML(button.dataset.phone)}"></div><div class="field"><label>अकाउंट प्रकार</label><select name="role"><option value="customer" ${button.dataset.role === 'customer' ? 'selected' : ''}>ग्राहक</option><option value="provider" ${button.dataset.role === 'provider' ? 'selected' : ''}>सेवा प्रदाता</option></select></div>`, data => api(`/api/auth/admin/users/${button.dataset.userEdit}`, { method: 'PATCH', body: JSON.stringify(data) })));
      list.querySelectorAll('[data-user-delete]').forEach(button => button.onclick = async () => { if (!await adminConfirm('यूज़र और उनकी पोस्ट हटाएँ?', 'यूज़र हटाएँ')) return; try { await api(`/api/auth/admin/users/${button.dataset.userDelete}`, { method: 'DELETE' }); window.loadAdminData(); } catch (error) { notify(error.message); } });
    } else if (adminTab === 'leads') {
      const leads = await api('/api/leads/admin');
      list.innerHTML = leads.length ? leads.map(lead => `<article class="admin-item lead-item"><div><b>${escapeHTML(lead.name)} · ${escapeHTML(lead.phone)}</b><small>पोस्ट: ${escapeHTML(lead.postTitle)} · प्रदाता: ${escapeHTML(lead.providerName || '')} (${escapeHTML(lead.providerPhone)})</small><small>${new Date(lead.createdAt).toLocaleString('hi-IN')} · ${escapeHTML(lead.status)}</small></div><a class="button primary-button admin-mini" href="tel:${encodeURIComponent(lead.phone)}">ग्राहक को कॉल</a><a class="button green-button admin-mini" href="tel:${encodeURIComponent(lead.providerPhone)}">प्रदाता को कॉल</a>${lead.status !== 'contacted' ? `<button data-lead-status="contacted" data-id="${lead._id}">संपर्क हुआ</button>` : ''}<button class="danger" data-lead-status="closed" data-id="${lead._id}">बंद करें</button></article>`).join('') : '<p class="modal-intro">अभी कोई callback request नहीं आई है।</p>';
      list.querySelectorAll('[data-lead-status]').forEach(button => button.onclick = async () => { try { await api(`/api/leads/${button.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ status: button.dataset.leadStatus }) }); window.loadAdminData(); } catch (error) { notify(error.message); } });
    }
  } catch (error) { list.textContent = error.message; }
};

new MutationObserver(() => {
  const tabs = document.querySelector('#modalContent .admin-tabs');
  if (!tabs || !tabs.querySelector('[data-admin="posts"]') || tabs.dataset.inboxReady) return;
  tabs.dataset.inboxReady = 'true';
  const inbox = document.createElement('button');
  inbox.type = 'button'; inbox.dataset.admin = 'leads'; inbox.textContent = 'कॉल रिक्वेस्ट';
  inbox.onclick = () => { adminTab = 'leads'; tabs.querySelectorAll('[data-admin]').forEach(tab => tab.classList.toggle('active', tab === inbox)); window.loadAdminData(); };
  tabs.append(inbox);
}).observe(document.querySelector('#modalContent'), { childList: true, subtree: true });

window.deletePost = async function (id) {
  if (!await adminConfirm('यह पोस्ट हमेशा के लिए हटाएँ?', 'पोस्ट हटाएँ')) return;
  try { await api(`/api/posts/${id}`, { method: 'DELETE' }); notify('पोस्ट हटा दी गई।'); window.loadAdminData(); window.loadPosts(); loadJobs(); }
  catch (error) { notify(error.message); }
};
