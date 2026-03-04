// assets/admin.js
(function(){
  // Prevent double-binding if script is injected twice
  if (window.__ADMIN_INIT_DONE__) return;
  window.__ADMIN_INIT_DONE__ = true;

  const $ = (q) => document.querySelector(q);
  const BUCKET = "stf";

  const categoryLabelMap = {
    local: "محليات تازة",
    incidents: "حوادث",
    sports: "رياضة",
    society: "مجتمع",
  };

  // UI refs
  const loginBox = $("#loginBox");
  const dashboard = $("#dashboard");
  const logoutBtn = $("#logoutBtn");

  const helloPill = $("#helloPill");
  const helloName = $("#helloName");
  const helloEmail = $("#helloEmail");

  const authMsg = $("#authMsg");
  const postMsg = $("#postMsg");
  const slideMsg = $("#slideMsg");

  const postsList = $("#postsList");
  const slidesList = $("#slidesList");
  const whoamiBox = $("#whoamiBox");

  // form
  const pTitle = $("#pTitle");
  const pExcerpt = $("#pExcerpt");
  const pContent = $("#pContent");
  const pCategory = $("#pCategory");
  const pAuthor = $("#pAuthor");
  const pTags = $("#pTags");
  const pMainImg = $("#pMainImg");
  const pGallery = $("#pGallery");
  const pFeatured = $("#pFeatured"); // new checkbox

  // preview
  const previewTitle = $("#previewTitle");
  const previewExcerpt = $("#previewExcerpt");
  const previewAuthor = $("#previewAuthor");
  const previewCat = $("#previewCat");
  const previewDate = $("#previewDate");
  const previewImg = $("#previewImg");
  const previewFeaturedBadge = $("#previewFeaturedBadge"); // optional

  // slider form
  const slideTitle = $("#slideTitle");
  const slideFile = $("#slideFile");

  // buttons
  const loginBtn = $("#loginBtn");
  const publishBtn = $("#publishBtn");
  const refreshPostsBtn = $("#refreshPostsBtn");
  const addSlideBtn = $("#addSlideBtn");
  const refreshSlidesBtn = $("#refreshSlidesBtn");

  let editingPostId = null;
  let isPublishing = false;

  function setMsg(el, t){ if (el) el.textContent = t || ""; }

  function escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  async function getSession(){
    const { data } = await window.sb.auth.getSession();
    return data.session;
  }

  function greetingName(email){
    if (!email) return "مسؤول";
    if (email.toLowerCase() === "jamalbella19@gmail.com") return "جمال";
    return email.split("@")[0];
  }

  function resetPostForm(){
    editingPostId = null;
    isPublishing = false;
    publishBtn.disabled = false;
    publishBtn.textContent = "نشر الخبر";

    pTitle.value = "";
    pExcerpt.value = "";
    pContent.value = "";
    pTags.value = "";
    pCategory.value = "local";
    pAuthor.value = "هيئة التحرير";
    pMainImg.value = "";
    pGallery.value = "";
    if (pFeatured) pFeatured.checked = false;

    updatePreview();
  }

  // Title limit (phrase)
  const TITLE_MAX = 80; // short phrase
  function enforceTitleLimit(){
    if (!pTitle) return;
    if (pTitle.value.length > TITLE_MAX){
      pTitle.value = pTitle.value.slice(0, TITLE_MAX);
    }
  }

  function updatePreview(){
    enforceTitleLimit();

    previewTitle.textContent = pTitle.value.trim() || "عنوان الخبر";
    previewExcerpt.textContent = pExcerpt.value.trim() || "الوصف القصير";
    previewAuthor.textContent = `بقلم: ${pAuthor.value.trim() || "هيئة التحرير"}`;
    previewCat.textContent = categoryLabelMap[pCategory.value] || "أخبار";
    previewDate.textContent = new Date().toLocaleDateString("ar-MA");

    if (previewFeaturedBadge){
      previewFeaturedBadge.style.display = (pFeatured?.checked ? "" : "none");
    }

    const file = pMainImg.files?.[0];
    if (file){
      const url = URL.createObjectURL(file);
      previewImg.style.backgroundImage = `url('${url}')`;
    } else {
      previewImg.style.backgroundImage = "linear-gradient(135deg,var(--brand),var(--brand2))";
    }
  }

  ["input","change"].forEach(evt=>{
    pTitle?.addEventListener(evt, updatePreview);
    pExcerpt?.addEventListener(evt, updatePreview);
    pAuthor?.addEventListener(evt, updatePreview);
    pCategory?.addEventListener(evt, updatePreview);
    pMainImg?.addEventListener(evt, updatePreview);
    pFeatured?.addEventListener(evt, updatePreview);
  });

  // Tabs
  function setTab(name){
    document.querySelectorAll(".admin-tab").forEach(b=>{
      b.classList.toggle("is-active", b.dataset.tab === name);
    });
    $("#tab-posts").style.display = name === "posts" ? "" : "none";
    $("#tab-slider").style.display = name === "slider" ? "" : "none";
    $("#tab-security").style.display = name === "security" ? "" : "none";
  }

  document.addEventListener("click", (e)=>{
    const btn = e.target.closest(".admin-tab");
    if (!btn) return;
    setTab(btn.dataset.tab);
  });

  async function refreshWhoami(){
    if (!whoamiBox) return;
    try{
      const { data, error } = await window.sb.rpc("whoami");
      if (error) throw error;
      whoamiBox.textContent = JSON.stringify(data, null, 2);
    } catch (e){
      whoamiBox.textContent = `whoami error: ${e?.message || e}`;
    }
  }

  // Upload
  async function uploadToBucket(file){
    const session = await getSession();
    if (!session) throw new Error("Not logged in");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${session.user.id}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

    const { error } = await window.sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg"
    });
    if (error) throw error;

    const { data } = window.sb.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function showUI(){
    const session = await getSession();
    const email = session?.user?.email || "";
    const uid = session?.user?.id || "";

    if (session){
      loginBox.style.display = "none";
      dashboard.style.display = "";
      logoutBtn.style.display = "";
      helloPill.style.display = "";
      helloName.textContent = greetingName(email);
      helloEmail.textContent = `${email} • uid:${uid.slice(0,8)}…`;
      setTab("posts");
      updatePreview();
      await Promise.all([refreshPosts(), refreshSlides(), refreshWhoami()]);
    } else {
      loginBox.style.display = "";
      dashboard.style.display = "none";
      logoutBtn.style.display = "none";
      helloPill.style.display = "none";
      resetPostForm();
      setMsg(postMsg, "");
      setMsg(slideMsg, "");
    }
  }

  loginBtn?.addEventListener("click", async ()=>{
    setMsg(authMsg, "...");
    const email = $("#email").value.trim();
    const password = $("#password").value;
    const { error } = await window.sb.auth.signInWithPassword({ email, password });
    if (error) setMsg(authMsg, `فشل تسجيل الدخول: ${error.message}`);
    else setMsg(authMsg, "");
    await showUI();
  });

  logoutBtn?.addEventListener("click", async ()=>{
    await window.sb.auth.signOut();
    await showUI();
  });

  // POSTS list
  function renderPostRow(p){
    const featured = p.is_featured ? `<span class="badge" style="margin-inline-start:8px;">عاجل</span>` : "";
    const featureBtn = p.is_featured
      ? `<button class="admin-danger" data-unfeature="${p.id}" type="button">حذف العاجل</button>`
      : `<button class="admin-btn" data-feature="${p.id}" type="button">جعله عاجل</button>`;

    return `
      <div class="admin-item" data-post-row="${p.id}">
        <div class="admin-thumb" style="background-image:url('${escapeHtml(p.main_image_url || "")}')"></div>
        <div class="admin-item-body">
          <div class="admin-item-title">${escapeHtml(p.title)} ${featured}</div>
          <div class="muted small">${escapeHtml(p.category_label || "")} • ${new Date(p.created_at).toLocaleString("ar-MA")}</div>
          <div class="admin-item-actions">
            <a class="admin-btn" href="./post.html?id=${p.id}" target="_blank" rel="noopener">فتح</a>
            <button class="admin-btn" data-edit-post="${p.id}" type="button">تعديل</button>
            ${featureBtn}
            <button class="admin-danger" data-del-post="${p.id}" type="button">حذف</button>
          </div>
        </div>
      </div>
    `;
  }

  async function refreshPosts(){
    const { data, error } = await window.sb
      .from("posts")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);

    if (error){
      setMsg(postMsg, `خطأ تحميل الأخبار: ${error.message}`);
      return;
    }
    postsList.innerHTML = (data || []).map(renderPostRow).join("");
  }

  refreshPostsBtn?.addEventListener("click", refreshPosts);

  // Delete post
  document.addEventListener("click", async (e)=>{
    const delBtn = e.target.closest("[data-del-post]");
    if (!delBtn) return;

    const id = delBtn.getAttribute("data-del-post");
    if (!confirm("متأكد تريد حذف هذا الخبر؟")) return;

    const { error } = await window.sb.from("posts").delete().eq("id", id);
    if (error){
      setMsg(postMsg, `فشل حذف الخبر: ${error.message}`);
      return;
    }
    document.querySelector(`[data-post-row="${CSS.escape(id)}"]`)?.remove();
    setMsg(postMsg, "تم الحذف ✅");
  });

  // Set featured (breaking)
  document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("[data-feature]");
    if (!btn) return;
    const id = btn.getAttribute("data-feature");
    if (!confirm("جعل هذا الخبر (عاجل)؟ سيُلغى العاجل من أي خبر آخر.")) return;

    // Unfeature everyone, then feature this (safe with unique index)
    const r1 = await window.sb.from("posts").update({ is_featured: false }).eq("is_featured", true);
    if (r1.error){ setMsg(postMsg, `فشل: ${r1.error.message}`); return; }

    const r2 = await window.sb.from("posts").update({ is_featured: true }).eq("id", id);
    if (r2.error){ setMsg(postMsg, `فشل: ${r2.error.message}`); return; }

    setMsg(postMsg, "تم تعيين العاجل ✅");
    await refreshPosts();
  });

  // Remove featured
  document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("[data-unfeature]");
    if (!btn) return;
    const id = btn.getAttribute("data-unfeature");
    if (!confirm("حذف العاجل من هذا الخبر؟")) return;

    const r = await window.sb.from("posts").update({ is_featured: false }).eq("id", id);
    if (r.error){ setMsg(postMsg, `فشل: ${r.error.message}`); return; }

    setMsg(postMsg, "تم حذف العاجل ✅");
    await refreshPosts();
  });

  // Edit load
  document.addEventListener("click", async (e)=>{
    const editBtn = e.target.closest("[data-edit-post]");
    if (!editBtn) return;

    const id = editBtn.getAttribute("data-edit-post");
    editingPostId = id;
    publishBtn.textContent = "حفظ التعديل";

    const { data, error } = await window.sb.from("posts").select("*").eq("id", id).single();
    if (error || !data){
      setMsg(postMsg, `فشل تحميل الخبر: ${error?.message || ""}`);
      return;
    }

    pTitle.value = data.title || "";
    pExcerpt.value = data.excerpt || "";
    pContent.value = data.content || "";
    pCategory.value = data.category || "local";
    pAuthor.value = data.author || "هيئة التحرير";
    pTags.value = (data.tags || []).join(", ");
    if (pFeatured) pFeatured.checked = !!data.is_featured;

    previewImg.style.backgroundImage = data.main_image_url
      ? `url('${data.main_image_url}')`
      : "linear-gradient(135deg,var(--brand),var(--brand2))";

    updatePreview();
    setMsg(postMsg, "وضع التعديل ✅");
  });

  // Publish / Save (FIX double post)
  publishBtn?.addEventListener("click", async ()=>{
    if (isPublishing) return;              // ✅ prevent double
    isPublishing = true;
    publishBtn.disabled = true;

    try{
      setMsg(postMsg, "...");
      const session = await getSession();
      if (!session) { setMsg(postMsg, "سجّل الدخول أولاً."); return; }

      enforceTitleLimit();

      const title = pTitle.value.trim();
      const excerpt = pExcerpt.value.trim();
      const content = pContent.value.trim();
      const category = pCategory.value;
      const author = pAuthor.value.trim() || "هيئة التحرير";
      const tags = pTags.value.split(",").map(x=>x.trim()).filter(Boolean);
      const wantsFeatured = !!(pFeatured && pFeatured.checked);

      if (!title || !excerpt || !content){
        setMsg(postMsg, "أكمل العنوان والوصف والمحتوى.");
        return;
      }

      if (editingPostId){
        const { data: current } = await window.sb
          .from("posts")
          .select("main_image_url,gallery_urls")
          .eq("id", editingPostId)
          .single();

        let mainUrl = current?.main_image_url || null;
        const newMain = pMainImg.files?.[0];
        if (newMain) mainUrl = await uploadToBucket(newMain);

        let galleryUrls = (current?.gallery_urls || []).slice(0,3);
        const newGallery = Array.from(pGallery.files || []).slice(0,3);
        if (newGallery.length){
          galleryUrls = [];
          for (const f of newGallery) galleryUrls.push(await uploadToBucket(f));
        }

        // featured logic
        if (wantsFeatured){
          const r1 = await window.sb.from("posts").update({ is_featured: false }).eq("is_featured", true);
          if (r1.error) throw r1.error;
        }

        const payload = {
          title, excerpt, content,
          category,
          category_label: categoryLabelMap[category] || "أخبار",
          author,
          tags: tags ?? [],
          main_image_url: mainUrl,
          gallery_urls: galleryUrls ?? [],
          is_featured: wantsFeatured
        };

        const r2 = await window.sb.from("posts").update(payload).eq("id", editingPostId);
        if (r2.error) throw r2.error;

        setMsg(postMsg, "تم حفظ التعديل ✅");
        resetPostForm();
        await refreshPosts();
        return;
      }

      // New post needs main image
      const mainFile = pMainImg.files?.[0];
      if (!mainFile){ setMsg(postMsg, "الصورة الرئيسية ضرورية."); return; }

      const mainUrl = await uploadToBucket(mainFile);

      const galleryFiles = Array.from(pGallery.files || []).slice(0,3);
      const galleryUrls = [];
      for (const f of galleryFiles) galleryUrls.push(await uploadToBucket(f));

      // featured logic
      if (wantsFeatured){
        const r1 = await window.sb.from("posts").update({ is_featured: false }).eq("is_featured", true);
        if (r1.error) throw r1.error;
      }

      const payload = {
        title, excerpt, content,
        category,
        category_label: categoryLabelMap[category] || "أخبار",
        author,
        tags: tags ?? [],
        main_image_url: mainUrl,
        gallery_urls: galleryUrls ?? [],
        is_featured: wantsFeatured
      };

      const r = await window.sb.from("posts").insert(payload);
      if (r.error) throw r.error;

      setMsg(postMsg, "تم نشر الخبر ✅");
      resetPostForm();
      await refreshPosts();
    } catch (e){
      setMsg(postMsg, `فشل نشر الخبر: ${e?.message || e}`);
    } finally {
      isPublishing = false;
      publishBtn.disabled = false;
    }
  });

  // SLIDER
  async function refreshSlides(){
    const { data, error } = await window.sb
      .from("slider")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error){
      setMsg(slideMsg, `خطأ تحميل السلايدر: ${error.message}`);
      return;
    }

    slidesList.innerHTML = (data || []).map(s => `
      <div class="admin-item" data-slide-row="${s.id}">
        <div class="admin-thumb" style="background-image:url('${escapeHtml(s.image_url || "")}')"></div>
        <div class="admin-item-body">
          <div class="admin-item-title">${escapeHtml(s.title || "بدون عنوان")}</div>
          <div class="muted small">${new Date(s.created_at).toLocaleString("ar-MA")}</div>
          <div class="admin-item-actions">
            <button class="admin-danger" data-del-slide="${s.id}" type="button">حذف</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  refreshSlidesBtn?.addEventListener("click", refreshSlides);

  addSlideBtn?.addEventListener("click", async ()=>{
    if (isPublishing) return;
    isPublishing = true;
    addSlideBtn.disabled = true;

    try{
      setMsg(slideMsg, "...");
      const session = await getSession();
      if (!session){ setMsg(slideMsg, "سجّل الدخول أولاً."); return; }

      const file = slideFile.files?.[0];
      if (!file){ setMsg(slideMsg, "اختر صورة."); return; }

      const { data: countData } = await window.sb.from("slider").select("id").limit(25);
      if ((countData || []).length >= 20){
        setMsg(slideMsg, "وصلت للحد الأقصى (20). احذف صورة قديمة.");
        return;
      }

      const url = await uploadToBucket(file);
      const r = await window.sb.from("slider").insert({ title: slideTitle.value.trim(), image_url: url });
      if (r.error) throw r.error;

      slideTitle.value = "";
      slideFile.value = "";
      setMsg(slideMsg, "تمت الإضافة ✅");
      await refreshSlides();
    } catch (e){
      setMsg(slideMsg, `فشل رفع السلايدر: ${e?.message || e}`);
    } finally {
      isPublishing = false;
      addSlideBtn.disabled = false;
    }
  });

  document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("[data-del-slide]");
    if (!btn) return;

    const id = btn.getAttribute("data-del-slide");
    if (!confirm("متأكد تريد حذف صورة السلايدر؟")) return;

    const r = await window.sb.from("slider").delete().eq("id", id);
    if (r.error){
      setMsg(slideMsg, `فشل حذف السلايدر: ${r.error.message}`);
      return;
    }

    document.querySelector(`[data-slide-row="${CSS.escape(id)}"]`)?.remove();
    setMsg(slideMsg, "تم الحذف ✅");
  });

  // Boot
  showUI();
})();