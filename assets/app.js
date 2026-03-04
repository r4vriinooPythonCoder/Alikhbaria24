// assets/app.js
(function () {
  const $ = (q) => document.querySelector(q);

  // ---------- Helpers ----------
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" });
  }

  // Convert stored text like "فقرة 1\\nفقرة 2" -> real newlines
  function normalizeNewlines(text) {
    const s = String(text ?? "");
    return s.replace(/\\n/g, "\n"); // convert literal backslash-n to newline
  }

  function contentToParagraphs(content) {
    const normalized = normalizeNewlines(content);
    return normalized
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  // ---------- Theme ----------
  const THEME_KEY = "alikhbaria24_theme";
  const themeBtn = $("#themeBtn");

  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(THEME_KEY, t);
  };

  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);

  themeBtn?.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  // ---------- Clock (Taza) ----------
  const clockEl = $("#tazaClock");
  function updateClock() {
    if (!clockEl) return;
    const fmt = new Intl.DateTimeFormat("ar-MA", {
      timeZone: "Africa/Casablanca",
      hour: "2-digit",
      minute: "2-digit"
    });
    clockEl.textContent = fmt.format(new Date());
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ---------- Footer year ----------
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Reveal animations ----------
  function initReveal() {
    const revealEls = Array.from(document.querySelectorAll(".reveal"));
    if (!revealEls.length) return;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });

    revealEls.forEach(el => io.observe(el));
  }
  initReveal();

  // ---------- Smooth scroll (interruptible) ----------
  let scrolling = false;
  let cancelScroll = () => { };

  function startSmoothScrollTo(target) {
    if (!target) return;
    if (scrolling) cancelScroll();

    scrolling = true;
    let cancelled = false;

    const stop = () => { cancelled = true; cleanup(); };
    const cleanup = () => {
      window.removeEventListener("wheel", stop, { passive: true });
      window.removeEventListener("touchmove", stop, { passive: true });
      window.removeEventListener("keydown", onKey, true);
      cancelScroll = () => { };
      scrolling = false;
    };
    const onKey = (e) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      if (keys.includes(e.key)) stop();
    };

    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", onKey, true);

    cancelScroll = stop;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { if (!cancelled) cleanup(); }, 1200);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-scroll]");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;

    const el = document.querySelector(href);
    if (!el) return;

    e.preventDefault();
    startSmoothScrollTo(el);
  });

  $("#toTop")?.addEventListener("click", () => startSmoothScrollTo(document.getElementById("top")));

  // ---------- Card HTML ----------
  function cardHTML(p) {
    const img = p.main_image_url ? escapeHtml(p.main_image_url) : "";
    return `
      <a class="card" href="./post.html?id=${encodeURIComponent(p.id)}">
        <div class="card-media" style="background-image:url('${img}')"></div>
        <div class="card-body">
          <div class="card-top">
            <span class="badge">${escapeHtml(p.category_label || "")}</span>
            <span class="muted small">${escapeHtml(formatDate(p.created_at))}</span>
          </div>
          <h3 class="card-title">${escapeHtml(p.title || "")}</h3>
          <p class="card-excerpt">${escapeHtml(p.excerpt || "")}</p>
          <div class="card-bottom">
            <span class="muted small">بقلم: ${escapeHtml(p.author || "")}</span>
            <span class="muted small">اقرأ المزيد ←</span>
          </div>
        </div>
      </a>
    `;
  }

  // ---------- Supabase fetch ----------
  async function fetchSlider() {
    const { data, error } = await window.sb
      .from("slider")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    return data || [];
  }

  async function fetchPosts() {
    const { data, error } = await window.sb
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) return [];
    return data || [];
  }

  // ---------- Home page init ----------
  async function initHome() {
    const sliderWrap = $("#sliderWrap");
    const tickerMove = $("#tickerMove");
    const grid = $("#grid");
    const meta = $("#newsMeta");

    if (!sliderWrap && !grid) return;

    const [slides, posts] = await Promise.all([fetchSlider(), fetchPosts()]);

    // Slider
    if (sliderWrap) {
      let idx = 0;

      if (!slides.length) {
        sliderWrap.innerHTML = `<div class="slide is-active" style="background:#111827"></div>`;
      } else {
        sliderWrap.innerHTML = slides.map((s, i) => `
          <div class="slide ${i === 0 ? "is-active" : ""}" style="background-image:url('${escapeHtml(s.image_url)}')">
            <div class="slide-overlay">
              <h1 class="slide-title">${escapeHtml(s.title || "")}</h1>
            </div>
          </div>
        `).join("");

        const nodes = Array.from(sliderWrap.querySelectorAll(".slide"));
        setInterval(() => {
          nodes[idx].classList.remove("is-active");
          idx = (idx + 1) % nodes.length;
          nodes[idx].classList.add("is-active");
        }, 4500);
      }
    }

    // Ticker
    if (tickerMove) {
      const titles = posts.slice(0, 10).map(p => `🟣 ${p.title}`).join("   —   ");
      tickerMove.textContent = titles || " ";
    }

    // Grid
    if (grid) {
      grid.innerHTML = posts.map(cardHTML).join("");
      if (meta) meta.textContent = `عدد الأخبار: ${posts.length}`;
    }
  }

  // ---------- Post page init ----------
  async function initPostPage() {
    const root = $("#postRoot");
    if (!root) return;

    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    const { data: p, error } = await window.sb.from("posts").select("*").eq("id", id).single();
    if (error || !p) {
      root.innerHTML = `<div class="contact"><b>الخبر غير موجود</b></div>`;
      return;
    }

    document.title = `${p.title} | الإخبارية24 - تازة`;

    const allImgs = [p.main_image_url, ...(p.gallery_urls || [])].filter(Boolean).slice(0, 4);
    const url = location.href;
    const waShare = `https://wa.me/?text=${encodeURIComponent(p.title + " - " + url)}`;

    const paragraphs = contentToParagraphs(p.content);

    // Hero background fallback if no image
    const heroStyle = p.main_image_url
      ? `background-image:url('${escapeHtml(p.main_image_url)}')`
      : `background-image:linear-gradient(135deg, rgba(56,189,248,.25), rgba(167,139,250,.20))`;

    root.innerHTML = `
      <div class="post">
        <div class="post-hero" style="${heroStyle}"></div>

        <div class="post-body">
          <div class="post-top">
            <span class="badge">${escapeHtml(p.category_label || "")}</span>
            <span class="muted small">${escapeHtml(formatDate(p.created_at))}</span>
          </div>

          <h1 class="post-title">${escapeHtml(p.title || "")}</h1>

          <div class="post-meta muted">
            بقلم: <b>${escapeHtml(p.author || "")}</b>
          </div>

          <div class="post-content">
            ${paragraphs.map(par => `<p>${escapeHtml(par)}</p>`).join("")}
          </div>

          ${allImgs.length > 1 ? `
            <div class="post-gallery">
              ${allImgs.map((src, i) => `
                <button class="gimg" type="button" data-img="${escapeHtml(src)}" aria-label="صورة ${i + 1}">
                  <img src="${escapeHtml(src)}" alt="صورة الخبر" loading="lazy"/>
                </button>
              `).join("")}
            </div>
          ` : ""}

          <div class="post-actions">
            <button class="btn" id="copyLinkBtn" type="button">نسخ الرابط</button>
            <a class="btn" href="${waShare}" target="_blank" rel="noopener">مشاركة واتساب</a>
            <a class="btn" href="./index.html#news">المزيد من الأخبار</a>
          </div>
        </div>
      </div>
    `;

    $("#copyLinkBtn")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(url); alert("تم نسخ الرابط ✅"); }
      catch { alert("لم أستطع نسخ الرابط."); }
    });

    // Lightbox
    const lightbox = $("#lightbox");
    const lightboxImg = $("#lightboxImg");
    const lightboxClose = $("#lightboxClose");

    function openLightbox(src) {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.src = src;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    }
    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
    }

    root.addEventListener("click", (e) => {
      const btn = e.target.closest("button.gimg");
      if (!btn) return;
      const src = btn.getAttribute("data-img");
      if (src) openLightbox(src);
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

    // Related
    const relatedGrid = $("#relatedGrid");
    if (relatedGrid) {
      const { data: related } = await window.sb
        .from("posts")
        .select("*")
        .eq("category", p.category)
        .neq("id", p.id)
        .order("created_at", { ascending: false })
        .limit(6);

      relatedGrid.innerHTML = (related || []).map(cardHTML).join("");
    }
  }

  // ---------- Boot ----------
  initHome();
  initPostPage();

  // Faster refresh so new posts appear quickly
  setInterval(() => {
    if ($("#grid")) initHome();
  }, 8000);
})();