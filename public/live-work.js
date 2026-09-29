async function loadJobs() {
  let jobs = [];
  try { jobs = await api('/api/posts?type=job'); } catch {}
  $('#workGrid').innerHTML = jobs.map(post => {
    const createdAt = new Date(post.createdAt || Date.now());
    const age = Date.now() - createdAt.getTime();
    const isNew = age >= 0 && age < 24 * 60 * 60 * 1000;
    const digits = String(post.whatsapp || post.phone || '').replace(/\D/g, '');
    const whatsapp = digits.length === 10 ? `91${digits}` : digits.length === 12 && digits.startsWith('91') ? digits : '';
    const dateTime = createdAt.toLocaleString('hi-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    return `<article class="work-card" data-detail-id="${escapeHTML(post._id || '')}">
      <div class="work-card-top">${isNew ? '<span class="work-new-badge">नया</span>' : '<span></span>'}<time datetime="${escapeHTML(createdAt.toISOString())}">${escapeHTML(dateTime)}</time></div>
      <h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.description || 'काम की जानकारी उपलब्ध है।')}</p>
      <div class="work-tags"><span>📍 ${escapeHTML(post.location?.city || 'स्थान देखें')}</span><span>👥 ${escapeHTML(post.details?.peopleNeeded || 1)} लोग चाहिए</span><span>₹ ${escapeHTML(post.details?.pay || 'भुगतान तय करें')}</span><span>⏱ ${escapeHTML(post.details?.duration || 'समय देखें')}</span></div>
      <div class="work-card-actions"><button data-post-id="${escapeHTML(post._id || '')}" data-contact="${escapeHTML(post.phone || '')}" data-name="${escapeHTML(post.providerName || '')}">काम के लिए संपर्क करें →</button>${whatsapp ? `<a class="work-whatsapp" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div>
    </article>`;
  }).join('');
  $('#emptyWork').hidden = jobs.length > 0;
  $('#workGrid').querySelectorAll('[data-contact]').forEach(button => {
    button.onclick = () => contactProvider(button.dataset.contact, button.dataset.name, button.dataset.postId);
  });
}
