const DEFAULT_CATEGORIES = [
  ["प्लंबर", "🔧"],
  ["इलेक्ट्रिशियन", "⚡"],
  ["घर की सफ़ाई", "🧹"],
  ["ब्यूटी पार्लर", "💇"],
  ["पेंटर", "🎨"],
  ["AC सर्विस", "❄️"],
  ["कारपेंटर", "🪚"],
  ["बाइक/कार मैकेनिक", "🏍️"],
  ["कंप्यूटर/मोबाइल रिपेयर", "📱"],
  ["दुकान", "🏪"],
  ["टेंट/इवेंट", "🎪"],
  ["अन्य सेवा", "🧰"],
];
let currentUser = null,
  categories = [],
  selectedCategory = "",
  currentPostType = "service",
  authMode = "login",
  authRole = "customer",
  adminTab = "posts",
  toastTimer;
const $ = (s) => document.querySelector(s);
const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "कुछ गड़बड़ हुई।");
  return data;
}
function notify(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2900);
}
function openModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("#modalBackdrop").hidden = true;
  document.body.style.overflow = "";
}
function catIcon(name) {
  return (
    categories.find((c) => c.name === name)?.icon ||
    DEFAULT_CATEGORIES.find((c) => c[0] === name)?.[1] ||
    "🧰"
  );
}
async function loadCategories() {
  try {
    categories = await api("/api/categories");
  } catch {}
  renderCategories();
}
function renderCategories() {
  const list = categories.length
    ? categories
    : DEFAULT_CATEGORIES.map(([name, icon]) => ({ name, icon }));
  $("#categoryGrid").innerHTML = list
    .map(
      (c) =>
        `<button class="category-card ${selectedCategory === c.name ? "active" : ""}" data-category="${escapeHTML(c.name)}"><span class="category-icon">${escapeHTML(c.icon)}</span><b>${escapeHTML(c.name)}</b></button>`,
    )
    .join("");
  document.querySelectorAll(".category-card").forEach(
    (btn) =>
      (btn.onclick = () => {
        selectedCategory =
          selectedCategory === btn.dataset.category ? "" : btn.dataset.category;
        renderCategories();
        loadPosts();
      }),
  );
}
function sampleCards() {
  return [
    {
      title: "Raju Plumbing Service",
      providerName: "राजू",
      category: "प्लंबर",
      location: { city: "Thane", state: "Maharashtra" },
      description: "पानी की टंकी, पाइप लीकेज, नल और बाथरूम रिपेयर।",
      phone: "9999999999",
      available: true,
      images: [
        "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=300&q=75",
      ],
    },
    {
      title: "Shyam Electrician",
      providerName: "श्याम",
      category: "इलेक्ट्रिशियन",
      location: { city: "Thane", state: "Maharashtra" },
      description: "घर की वायरिंग, पंखा, स्विच बोर्ड और बिजली रिपेयर।",
      phone: "9888888888",
      available: true,
      images: [
        "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=300&q=75",
      ],
    },
    {
      title: "Fresh Home Cleaning",
      providerName: "Fresh Home",
      category: "घर की सफ़ाई",
      location: { city: "Thane", state: "Maharashtra" },
      description: "घर और ऑफ़िस की डीप क्लीनिंग सर्विस।",
      phone: "9777777777",
      available: true,
      images: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=75",
      ],
    },
    {
      title: "Cool Air AC Service",
      providerName: "Cool Air",
      category: "AC सर्विस",
      location: { city: "Thane", state: "Maharashtra" },
      description: "AC installation, servicing, gas refill और repair.",
      phone: "9666666666",
      available: false,
      images: [
        "https://images.unsplash.com/photo-1631545806609-90f8e4cae6c8?auto=format&fit=crop&w=300&q=75",
      ],
    },
  ];
}
async function loadPosts() {
  const params = new URLSearchParams();
  params.set("type", currentPostType);
  if (selectedCategory) params.set("category", selectedCategory);
  if ($("#searchInput").value.trim())
    params.set("q", $("#searchInput").value.trim());
  if ($("#cityFilter").value.trim())
    params.set("city", $("#cityFilter").value.trim());
  if ($("#pincodeFilter").value.trim())
    params.set("pincode", $("#pincodeFilter").value.trim());
  if ($("#availabilityFilter").value)
    params.set("available", $("#availabilityFilter").value);
  let posts = [];
  try {
    posts = await api(`/api/posts?${params}`);
  } catch {}
  if (
    !posts.length &&
    currentPostType === "service" &&
    !selectedCategory &&
    !$("#searchInput").value &&
    !$("#pincodeFilter").value
  )
    posts = sampleCards().filter(
      (p) =>
        !$("#cityFilter").value ||
        p.location.city
          .toLowerCase()
          .includes($("#cityFilter").value.toLowerCase()),
    );
  renderPosts(posts);
}
function renderPosts(posts) {
  $("#serviceGrid").innerHTML = posts
    .map((p) => {
      const image = p.images?.[0] || "";
      return `<article class="service-card" data-detail-id="${escapeHTML(p._id || "")}">${image ? `<img class="service-photo" src="${escapeHTML(image)}" alt="${escapeHTML(p.title)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false">` : ''}<div class="service-avatar" ${image ? 'hidden' : ''} aria-label="${escapeHTML(p.providerName || p.title)}">👤</div><div class="service-info"><h3>${escapeHTML(p.title || p.providerName)}</h3><div class="service-meta">📍 ${escapeHTML([p.location?.city, p.location?.state].filter(Boolean).join(", ") || "स्थान नहीं दिया")}<br><span class="availability ${p.available === false ? "off" : ""}">● ${p.available === false ? "अभी उपलब्ध नहीं" : "अभी उपलब्ध"}</span><br>${escapeHTML(p.description || p.category || "")}</div><div class="service-actions"><button data-post-id="${escapeHTML(p._id || "")}" data-contact="${escapeHTML(p.phone || "")}" data-name="${escapeHTML(p.providerName || p.title)}">☎ संपर्क करें</button>${p.whatsapp ? `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(p.whatsapp.replace(/\D/g, ""))}">WhatsApp</a>` : ""}</div></div></article>`;
    })
    .join("");
  $("#emptyServices").hidden = posts.length > 0;
  document
    .querySelectorAll("[data-contact]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          contactProvider(b.dataset.contact, b.dataset.name, b.dataset.postId)),
    );
}
function contactProvider(phone, name) {
  if (currentUser) {
    location.href = `tel:${phone}`;
    return;
  }
  openModal(
    `<h2 id="modalTitle">${escapeHTML(name)} से संपर्क करें</h2><p class="modal-intro">अपना नाम और मोबाइल नंबर दें। हम आपको कॉल करवाने में मदद करेंगे।</p><form id="callbackForm"><div class="field"><label>आपका नाम</label><input name="name" required autocomplete="name" placeholder="पूरा नाम"></div><div class="field"><label>मोबाइल नंबर</label><input name="phone" required inputmode="numeric" pattern="[0-9]{10}" placeholder="10 अंकों का नंबर"></div><button class="button primary-button form-submit">मुझे कॉल करें</button></form>`,
  );
  $("#callbackForm").onsubmit = (e) => {
    e.preventDefault();
    closeModal();
    notify("धन्यवाद! प्रदाता से सीधे कॉल करने के लिए लॉगिन करें।");
  };
}
async function loadJobs() {
  let jobs = [];
  try {
    jobs = await api("/api/posts?type=job");
  } catch {}
  $("#workGrid").innerHTML = jobs
    .map(
      (p) =>
        `<article class="work-card" data-detail-id="${escapeHTML(p._id || "")}"><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description || "काम की जानकारी उपलब्ध है।")}</p><div class="work-tags"><span>📍 ${escapeHTML(p.location?.city || "स्थान देखें")}</span><span>👥 ${escapeHTML(p.details?.peopleNeeded || 1)} लोग चाहिए</span><span>₹ ${escapeHTML(p.details?.pay || "भुगतान तय करें")}</span><span>⏱ ${escapeHTML(p.details?.duration || "समय देखें")}</span></div><button data-post-id="${escapeHTML(p._id || "")}" data-contact="${escapeHTML(p.phone || "")}" data-name="${escapeHTML(p.providerName)}">काम के लिए संपर्क करें →</button></article>`,
    )
    .join("");
  $("#emptyWork").hidden = jobs.length > 0;
  $("#workGrid")
    .querySelectorAll("[data-contact]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          contactProvider(b.dataset.contact, b.dataset.name, b.dataset.postId)),
    );
}
function openAuth(mode = "login", role = "customer") {
  authMode = mode;
  authRole = role;
  renderAuth();
}
function renderAuth() {
  const signup = authMode === "signup";
  openModal(
    `<h2 id="modalTitle">${signup ? "SevaMitra से जुड़ें" : "वापस स्वागत है"}</h2><p class="modal-intro">${signup ? "अपना अकाउंट बनाएँ और अपने आसपास के लोगों से जुड़ें।" : "अपने मोबाइल नंबर से लॉगिन करें।"}</p><div class="tabs"><button data-role="customer" class="${authRole === "customer" ? "active" : ""}">ग्राहक</button><button data-role="provider" class="${authRole === "provider" ? "active" : ""}">सेवा प्रदाता</button></div><form id="authForm">${signup ? `<div class="field"><label>पूरा नाम</label><input name="name" required autocomplete="name" placeholder="आपका नाम"></div>` : ""}<div class="field"><label>मोबाइल नंबर</label><input name="phone" required inputmode="numeric" pattern="[0-9]{10}" autocomplete="tel" placeholder="10 अंकों का मोबाइल नंबर"></div><div class="field"><label>पासवर्ड</label><input name="password" type="password" required minlength="6" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="कम से कम 6 अक्षर"></div>${signup ? `<div class="form-grid"><div class="field"><label>शहर</label><input name="city" placeholder="जैसे Thane"></div><div class="field"><label>पिनकोड</label><input name="pincode" inputmode="numeric" maxlength="6" placeholder="400601"></div><div class="field full"><label>राज्य</label><input name="state" placeholder="Maharashtra"></div></div><div class="helper-note">📍 अभी शहर और पिनकोड भरें। लोकेशन की अनुमति देने पर ब्राउज़र से वर्तमान जगह ली जा सकती है।</div>` : ""}<button class="button primary-button form-submit">${signup ? "अकाउंट बनाएँ" : "लॉगिन करें"}</button></form><p class="auth-switch">${signup ? "पहले से अकाउंट है?" : "नए हैं?"} <button id="authSwitch">${signup ? "लॉगिन करें" : "साइन अप करें"}</button></p>${!signup ? "" : ""}`,
  );
  document.querySelectorAll("[data-role]").forEach(
    (b) =>
      (b.onclick = () => {
        authRole = b.dataset.role;
        renderAuth();
      }),
  );
  $("#authSwitch").onclick = () => {
    authMode = signup ? "login" : "signup";
    renderAuth();
  };
  $("#authForm").onsubmit = submitAuth;
}
async function submitAuth(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  try {
    const result = await api(`/api/auth/${authMode}`, {
      method: "POST",
      body: JSON.stringify({ ...data, role: authRole }),
    });
    currentUser = result.user;
    updateNav();
    closeModal();
    notify(`नमस्ते ${currentUser.name}!`);
    if (currentUser.role === "admin") openAdmin();
    else if (currentUser.role === "provider" && authMode === "signup")
      openDashboard();
    else {
      loadPosts();
      loadJobs();
    }
  } catch (error) {
    notify(error.message);
  }
}
function updateNav() {
  const logged = !!currentUser;
  $("#loginBtn").textContent = logged ? `👤 ${currentUser.name}` : "👤 लॉगिन";
  $("#dashboardBtn").hidden = !logged;
  $("#dashboardBtn").textContent =
    currentUser?.role === "admin" ? "Admin Panel" : "मेरा पैनल";
  $("#loginBtn").onclick = () => (logged ? openDashboard() : openAuth("login"));
  $("#dashboardBtn").onclick = () =>
    currentUser?.role === "admin" ? openAdmin() : openDashboard();
}
function requestProvider(role = "provider") {
  if (!currentUser) {
    openAuth("signup", role);
    return;
  }
  if (currentUser.role === "customer") {
    openModal(
      `<h2 id="modalTitle">सेवा प्रदाता अकाउंट चाहिए</h2><p class="modal-intro">सेवा पोस्ट करने के लिए प्रदाता के रूप में नया अकाउंट बनाएँ। ग्राहक अकाउंट से भी Live Work पोस्ट कर सकते हैं।</p><button class="button primary-button form-submit" id="providerSignup">प्रदाता के रूप में साइन अप करें</button>`,
    );
    $("#providerSignup").onclick = () => openAuth("signup", "provider");
    return;
  }
  openPostForm("service");
}
function openPostForm(type = "service", post = null) {
  if (!currentUser) {
    openAuth("login", type === "service" ? "provider" : "customer");
    return;
  }
  currentPostType = type;
  const job = type === "job";
  const cats = [
    ...DEFAULT_CATEGORIES.map((c) => c[0]),
    ...categories
      .map((c) => c.name)
      .filter((n) => !DEFAULT_CATEGORIES.some((c) => c[0] === n)),
  ];
  openModal(`<h2 id="modalTitle">${post ? "पोस्ट संपादित करें" : job ? "Live Work पोस्ट करें" : "अपनी सेवा जोड़ें"}</h2><p class="modal-intro">${post ? "अपनी पोस्ट की जानकारी अपडेट करें।" : "जानकारी भरें। पोस्ट लाइव होते ही दिखेगी। एडमिन जरूरत पड़ने पर इसे hold कर सकता है।"}</p><form id="postForm"><div class="form-grid">
${!job ? `<div class="field"><label>सेवा का नाम *</label><input name="title" required value="${escapeHTML(post?.title || "")}" placeholder="जैसे Raju Plumbing Service"></div><div class="field"><label>दुकान / ब्रांड नाम</label><input name="businessName" value="${escapeHTML(post?.businessName || "")}" placeholder="बिज़नेस का नाम"></div><div class="field"><label>सेवा श्रेणी *</label><select name="category" required id="postCategory"><option value="">श्रेणी चुनें</option>${cats.map((c) => `<option ${post?.category === c ? "selected" : ""}>${escapeHTML(c)}</option>`).join("")}<option value="custom">अन्य — अपना नाम लिखें</option></select></div><div class="field" id="customCatField" hidden><label>अपनी श्रेणी</label><input name="customCategory" placeholder="श्रेणी का नाम"></div><div class="field"><label>लिस्टिंग का प्रकार</label><select name="listingKind"><option value="service">घर / ऑनसाइट सेवा</option><option value="shop">दुकान / सामान</option><option value="vehicle">वाहन सेवा</option><option value="online">ऑनलाइन सेवा</option><option value="tent">टेंट / इवेंट</option></select></div><div class="field"><label>सेवा / सामान की जानकारी</label><input name="items" placeholder="सेवा या सामान का नाम"></div>` : `<div class="field"><label>काम का शीर्षक *</label><input name="title" required placeholder="जैसे पेंटर के लिए 2 लोगों की ज़रूरत" value="${escapeHTML(post?.title || "")}"></div><div class="field"><label>कितने लोग चाहिए?</label><input name="peopleNeeded" type="number" min="1" value="1"></div><div class="field"><label>काम की अवधि</label><input name="duration" placeholder="जैसे 8 घंटे, 2 दिन"></div><div class="field"><label>भुगतान</label><input name="pay" placeholder="जैसे ₹500 / 8 घंटे"></div><div class="field"><label>ज़रूरी योग्यता</label><input name="requirements" placeholder="अनुभव, हुनर आदि"></div>`}
<div class="field full"><label>तस्वीर के URL (वैकल्पिक, हर लाइन पर एक)</label><textarea name="images" placeholder="https://example.com/photo.jpg">${escapeHTML((post?.images || []).filter(image => /^https?:\/\//i.test(image)).join("\n"))}</textarea><small>एक पोस्ट में अधिकतम 8 URL</small></div><div class="field full"><label>विवरण</label><textarea name="description" placeholder="अपने काम या सेवा के बारे में बताएँ">${escapeHTML(post?.description || "")}</textarea></div><div class="field full"><label>${job ? "काम की जगह" : "पता"} *</label><input name="address" required placeholder="गाँव / मोहल्ला, चौराहा, लैंडमार्क सहित पूरा पता"></div><div class="field"><label>शहर *</label><input name="city" required value="${escapeHTML(post?.location?.city || "")}" placeholder="शहर"></div><div class="field"><label>राज्य</label><input name="state" value="${escapeHTML(post?.location?.state || "")}" placeholder="राज्य"></div><div class="field"><label>पिनकोड *</label><input name="pincode" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="${escapeHTML(post?.location?.pincode || "")}" placeholder="6 अंकों का पिनकोड"></div><div class="field"><label>संपर्क नंबर *</label><input name="phone" required inputmode="numeric" pattern="[0-9]{10}" value="${escapeHTML(post?.phone || currentUser.phone || "")}" placeholder="10 अंकों का नंबर"></div><div class="field"><label>WhatsApp नंबर</label><input name="whatsapp" inputmode="numeric" value="${escapeHTML(post?.whatsapp || "")}" placeholder="WhatsApp नंबर"></div><div class="field"><label>दूसरा नंबर</label><input name="alternatePhone" inputmode="numeric" placeholder="वैकल्पिक नंबर"></div>
${!job ? `<div class="field"><label>उपलब्धता</label><select name="available"><option value="true">अभी उपलब्ध / Open</option><option value="false">अभी उपलब्ध नहीं / Closed</option></select></div><div class="field"><label>समय का तरीका</label><select name="hoursMode"><option value="manual">मैं खुद Open / Close करूँगा</option><option value="schedule">तय समय-सारणी</option></select></div><div class="field full"><label>समय / शेड्यूल</label><input name="hours" placeholder="जैसे रोज़ 9 AM–8 PM"></div>` : `<div class="field"><label>WhatsApp नंबर वही है?</label><select name="sameWhatsapp"><option value="yes">हाँ</option><option value="no">नहीं</option></select></div>`}
</div><div class="helper-note">🛡️ आपकी पोस्ट पहले Admin review में जाएगी। मंज़ूर होने के बाद यह ग्राहकों को दिखेगी। पोस्ट 10 दिन बाद अपने आप expire होगी।</div><button class="button primary-button form-submit">${post ? "बदलाव सेव करें" : job ? "काम पोस्ट करें" : "रिव्यू के लिए भेजें"}</button></form>`);
  $("#postCategory")?.addEventListener(
    "change",
    (e) => ($("#customCatField").hidden = e.target.value !== "custom"),
  );
  $("#postForm").onsubmit = (e) => submitPost(e, type, post);
}
async function submitPost(e, type, post) {
  e.preventDefault();
  const f = new FormData(e.currentTarget || e.target),
    d = Object.fromEntries(f);
  const job = type === "job",
    category = d.category === "custom" ? d.customCategory : d.category;
  const payload = {
    type,
    title: d.title,
    providerName: currentUser.name,
    businessName: d.businessName,
    category: job ? "Live Work" : category,
    customCategory: d.customCategory,
    description: d.description,
    phone: d.phone,
    whatsapp: d.whatsapp || d.phone,
    alternatePhone: d.alternatePhone,
    location: {
      address: d.address,
      city: d.city,
      state: d.state,
      pincode: d.pincode,
    },
    available: d.available !== "false",
    hoursMode: d.hoursMode || "manual",
    hours: d.hours,
    listingKind: d.listingKind,
    ...(d.images?.trim() ? { images: d.images.split(/\r?\n/).map(image => image.trim()).filter(Boolean).slice(0, 8) } : {}),

    details: job
      ? {
          peopleNeeded: d.peopleNeeded,
          pay: d.pay,
          duration: d.duration,
          requirements: d.requirements,
        }
      : { items: d.items },
  };
  try {
    await api(post ? `/api/posts/${post._id}` : "/api/posts", {
      method: post ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    closeModal();
    notify("पोस्ट live हो गई है। एडमिन जरूरत पड़ने पर इसे hold कर सकता है।");
    loadPosts();
    loadJobs();
  } catch (err) {
    notify(err.message);
  }
}
function openDashboard() {
  if (!currentUser) return openAuth("login");
  openModal(
    `<h2 id="modalTitle">मेरा पैनल</h2><p class="modal-intro">नमस्ते ${escapeHTML(currentUser.name)} — अपनी पोस्ट और अकाउंट मैनेज करें।</p><div class="admin-tabs"><button id="myPostsTab" class="active">मेरी पोस्ट</button><button id="newServiceTab">+ सेवा जोड़ें</button><button id="newJobTab">+ Live Work</button><button id="logoutTab">लॉग आउट</button></div><div class="admin-list" id="myPostList">लोड हो रहा है...</div>`,
  );
  $("#newServiceTab").onclick = () => openPostForm("service");
  $("#newJobTab").onclick = () => openPostForm("job");
  $("#logoutTab").onclick = logout;
  $("#myPostsTab").onclick = loadMyPosts;
  loadMyPosts();
}
async function loadMyPosts() {
  const list = $("#myPostList");
  if (!list) return;
  try {
    const posts = await api("/api/posts/mine");
    list.innerHTML = posts.length
      ? posts
          .map(
            (p) =>
              `<article class="admin-item"><div><b>${escapeHTML(p.title)}</b><small>${escapeHTML(p.type)} · ${escapeHTML(p.status)} · ${escapeHTML(p.location?.city || "")}</small></div><button data-edit="${p._id}">संपादित</button><button class="danger" data-delete="${p._id}">हटाएँ</button></article>`,
          )
          .join("")
      : '<p class="modal-intro">आपने अभी कोई पोस्ट नहीं बनाई है।</p>';
    list.querySelectorAll("[data-edit]").forEach(
      (b) =>
        (b.onclick = async () => {
          const p = posts.find((x) => x._id === b.dataset.edit);
          openPostForm(p.type, p);
        }),
    );
    list
      .querySelectorAll("[data-delete]")
      .forEach((b) => (b.onclick = () => deletePost(b.dataset.delete)));
  } catch (e) {
    list.textContent = e.message;
  }
}
async function deletePost(id) {
  if (!confirm("यह पोस्ट हटाएँ?")) return;
  try {
    await api(`/api/posts/${id}`, { method: "DELETE" });
    notify("पोस्ट हटा दी गई।");
    loadMyPosts();
    loadPosts();
    loadJobs();
  } catch (e) {
    notify(e.message);
  }
}
async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {}
  currentUser = null;
  updateNav();
  closeModal();
  notify("आप लॉग आउट हो गए।");
}
async function openAdmin() {
  if (!currentUser || currentUser.role !== "admin") return;
  openModal(
    `<h2 id="modalTitle">Admin Panel</h2><p class="modal-intro">पोस्ट, यूज़र और सेवा श्रेणियाँ मैनेज करें।</p><div class="admin-tabs"><button data-admin="posts" class="active">पोस्ट review</button><button data-admin="categories">श्रेणियाँ</button><button data-admin="users">यूज़र</button><button id="adminLogout">लॉग आउट</button></div><div class="admin-list" id="adminList">लोड हो रहा है...</div>`,
  );
  document.querySelectorAll("[data-admin]").forEach(
    (b) =>
      (b.onclick = () => {
        adminTab = b.dataset.admin;
        document
          .querySelectorAll("[data-admin]")
          .forEach((x) => x.classList.toggle("active", x === b));
        loadAdminData();
      }),
  );
  $("#adminLogout").onclick = logout;
  loadAdminData();
}
async function loadAdminData() {
  const list = $("#adminList");
  if (!list) return;
  try {
    if (adminTab === "posts") {
      const posts = await api("/api/posts/admin/all");
      list.innerHTML = posts.length
        ? posts
            .map(
              (p) =>
                `<article class="admin-item"><div><b>${escapeHTML(p.title)} <small>(${escapeHTML(p.type)})</small></b><small>${escapeHTML(p.providerName)} · ${escapeHTML(p.category)} · ${escapeHTML(p.status)} · ${escapeHTML(p.location?.city || "")}</small></div>${p.status !== "approved" ? `<button data-approve="${p._id}">मंज़ूर</button>` : `<button data-status="held" data-id="${p._id}">होल्ड</button>`}<button data-editadmin="${p._id}">संपादित</button><button class="danger" data-delete="${p._id}">हटाएँ</button></article>`,
            )
            .join("")
        : '<p class="modal-intro">कोई पोस्ट नहीं मिली।</p>';
      list
        .querySelectorAll("[data-approve]")
        .forEach(
          (b) => (b.onclick = () => reviewPost(b.dataset.approve, "approved")),
        );
      list
        .querySelectorAll("[data-status]")
        .forEach(
          (b) => (b.onclick = () => reviewPost(b.dataset.id, b.dataset.status)),
        );
      list.querySelectorAll("[data-editadmin]").forEach(
        (b) =>
          (b.onclick = async () => {
            const p = posts.find((x) => x._id === b.dataset.editadmin);
            openPostForm(p.type, p);
          }),
      );
      list
        .querySelectorAll("[data-delete]")
        .forEach((b) => (b.onclick = () => deletePost(b.dataset.delete)));
    } else if (adminTab === "categories") {
      const cats = await api("/api/categories");
      list.innerHTML =
        `<form id="categoryForm" class="field"><label>नई श्रेणी जोड़ें</label><div style="display:flex;gap:8px"><input name="name" required placeholder="जैसे मोबाइल रिपेयर"><input name="icon" style="max-width:75px" placeholder="🧰"><button class="button primary-button">जोड़ें</button></div></form>` +
        cats
          .map(
            (c) =>
              `<article class="admin-item"><div><b>${escapeHTML(c.icon)} ${escapeHTML(c.name)}</b></div><button data-cat-edit="${c._id}" data-name="${escapeHTML(c.name)}">नाम बदलें</button><button class="danger" data-cat-delete="${c._id}">हटाएँ</button></article>`,
          )
          .join("");
      $("#categoryForm").onsubmit = async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        try {
          await api("/api/categories", {
            method: "POST",
            body: JSON.stringify(d),
          });
          loadCategories();
          loadAdminData();
          notify("श्रेणी जोड़ दी गई।");
        } catch (err) {
          notify(err.message);
        }
      };
      list.querySelectorAll("[data-cat-edit]").forEach(
        (b) =>
          (b.onclick = async () => {
            const name = prompt("श्रेणी का नया नाम", b.dataset.name);
            if (!name) return;
            try {
              await api(`/api/categories/${b.dataset.catEdit}`, {
                method: "PATCH",
                body: JSON.stringify({ name }),
              });
              loadCategories();
              loadAdminData();
            } catch (e) {
              notify(e.message);
            }
          }),
      );
      list.querySelectorAll("[data-cat-delete]").forEach(
        (b) =>
          (b.onclick = async () => {
            if (!confirm("श्रेणी हटाएँ?")) return;
            try {
              await api(`/api/categories/${b.dataset.catDelete}`, {
                method: "DELETE",
              });
              loadCategories();
              loadAdminData();
            } catch (e) {
              notify(e.message);
            }
          }),
      );
    } else {
      list.innerHTML =
        '<p class="modal-intro">यूज़र सूची को देखने और मैनेज करने के लिए User API इस्तेमाल करें।</p>';
    }
  } catch (e) {
    list.textContent = e.message;
  }
}
async function reviewPost(id, status) {
  try {
    await api(`/api/posts/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    notify(
      status === "approved" ? "पोस्ट मंज़ूर हो गई।" : "पोस्ट होल्ड पर है।",
    );
    loadAdminData();
    loadPosts();
    loadJobs();
  } catch (e) {
    notify(e.message);
  }
}
$("#searchForm").onsubmit = (e) => {
  e.preventDefault();
  loadPosts();
  $("#services").scrollIntoView({ behavior: "smooth" });
};
$("#availabilityFilter").onchange = loadPosts;
$("#cityFilter").oninput = debounce(loadPosts, 500);
$("#pincodeFilter").oninput = debounce(loadPosts, 500);
$("#clearFilters").onclick = () => {
  $("#cityFilter").value = "";
  $("#pincodeFilter").value = "";
  $("#availabilityFilter").value = "";
  selectedCategory = "";
  renderCategories();
  loadPosts();
};
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
$("#loginBtn").onclick = () =>
  currentUser ? openDashboard() : openAuth("login");
$("#providerBtn").onclick = () => requestProvider();
$("#providerCta").onclick = () => requestProvider();
$("#addServiceHero").onclick = () => requestProvider();
$("#postJobBtn").onclick = () =>
  currentUser ? openPostForm("job") : openAuth("login");
$("#emptyAdd").onclick = () => requestProvider();
$("#modalClose").onclick = closeModal;
$("#modalBackdrop").onclick = (e) => {
  if (e.target === $("#modalBackdrop")) closeModal();
};
$("#menuBtn").onclick = () => $(".main-nav").classList.toggle("open");
$("#locationBtn").onclick = () => {
  const city = prompt("अपने शहर का नाम लिखें", $("#cityFilter").value || "");
  if (city !== null) {
    $("#cityFilter").value = city;
    $("#locationLabel").textContent = city || "शहर चुनें";
    loadPosts();
  }
};
$("#showAllCategories").onclick = (e) => {
  e.preventDefault();
  selectedCategory = "";
  renderCategories();
  loadPosts();
};
$("#showAllServices").onclick = (e) => {
  e.preventDefault();
  selectedCategory = "";
  $("#searchInput").value = "";
  renderCategories();
  loadPosts();
};
(async () => {
  try {
    const result = await api("/api/auth/me");
    currentUser = result.user;
  } catch {}
  updateNav();
  await loadCategories();
  await loadPosts();
  await loadJobs();
})();
