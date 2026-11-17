/* sky/prompts — dashboard admin: PIN, CRUD, publish ke GitHub. */
(function () {
  "use strict";

  var CFG = window.PROMPTLIB_CONFIG || {};
  var DRAFT_KEY = "promptlib-draft-v1";
  var TOKEN_KEY = "promptlib-gh-token";
  var ADMIN_KEY = "promptlib-admin";

  var state = { prompts: [], dirty: false, admin: sessionStorage.getItem(ADMIN_KEY) === "1" };

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("prompt-" + Date.now());
  }
  function b64encodeUnicode(s) {
    return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, function (_, h) {
      return String.fromCharCode(parseInt(h, 16));
    }));
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function copyText(text, btn, doneLabel) {
    function done() {
      if (!btn) return;
      var original = btn.dataset.label || btn.textContent;
      btn.dataset.label = original;
      btn.textContent = doneLabel || "Disalin ✓";
      btn.classList.add("btn-copied");
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove("btn-copied");
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(); toast("Disalin ke clipboard."); })
        .catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); toast("Disalin ke clipboard."); }
    catch (e) { toast("Gagal menyalin — salin manual ya."); }
    document.body.removeChild(ta);
  }

  /* ---------- data ---------- */
  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (e) { return null; }
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.prompts, null, 2)); } catch (e) {}
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function load() {
    fetch("prompts.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var list = Array.isArray(data) ? data : data.prompts;
        if (!Array.isArray(list)) throw new Error("format prompts.json salah");
        var draft = loadDraft();
        if (draft) {
          state.prompts = draft;
          state.dirty = true;
        } else {
          state.prompts = list;
        }
        renderAll();
        updatePublish();
      })
      .catch(function () {
        toast("prompts.json nggak kebaca. Pastikan file-nya ada di folder yang sama.");
      });
  }

  /* ---------- render ---------- */
  function categories() {
    var seen = {};
    var out = [];
    state.prompts.forEach(function (p) {
      var c = (p.category || "Lainnya").trim() || "Lainnya";
      if (!seen[c]) { seen[c] = true; out.push(c); }
    });
    return out.sort(function (a, b) { return a.localeCompare(b); });
  }

  function byId(id) {
    for (var i = 0; i < state.prompts.length; i++) {
      if (state.prompts[i].id === id) return state.prompts[i];
    }
    return null;
  }

  function rowHTML(p, i) {
    var gh = p.github ? '<a class="mini-btn" href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub ↗</a>' : "";
    return '<div class="row-item" style="--i:' + i + '">' +
      '<div class="row-main">' +
        '<p class="row-title">' + esc(p.title) + ' <span class="badge">' + esc(p.category || "Lainnya") + "</span></p>" +
        '<p class="row-desc">' + esc(p.description || "") + "</p>" +
      "</div>" +
      '<div class="row-actions">' +
        '<button class="mini-btn" type="button" data-copy="' + esc(p.id) + '">Salin</button>' + gh +
        '<button class="mini-btn" type="button" data-edit="' + esc(p.id) + '">Edit</button>' +
        '<button class="mini-btn danger" type="button" data-del="' + esc(p.id) + '">Hapus</button>' +
      "</div></div>";
  }

  function renderAll() {
    $("statTotal").textContent = String(state.prompts.length);
    $("statCats").textContent = String(categories().length);
    var rows = $("rows");
    rows.innerHTML = state.prompts.map(rowHTML).join("");
    $("rowsEmpty").hidden = state.prompts.length !== 0;
    var dl = $("catList");
    if (dl) dl.innerHTML = categories().map(function (c) { return "<option value=\"" + esc(c) + "\">"; }).join("");
    rows.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var p = byId(b.dataset.copy);
        if (p) copyText(p.prompt || "", b);
      });
    });
    rows.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { openForm(b.dataset.edit); });
    });
    rows.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { removePrompt(b.dataset.del); });
    });
  }

  function updatePublish() {
    var clean = !state.dirty;
    $("statStatus").textContent = clean ? "Live" : "Belum dipublish";
    $("statStatus").classList.toggle("is-dirty", !clean);
    $("pubMsg").textContent = clean
      ? "Semua perubahan sudah live."
      : "Ada perubahan yang belum dipublish.";
    $("pubDot").style.background = clean ? "#3fb97f" : "#f0b429";
    var saved = "";
    try { saved = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) {}
    if (saved && !$("ghToken").value) $("ghToken").value = saved;
  }

  function markDirty() {
    state.dirty = true;
    saveDraft();
    renderAll();
    updatePublish();
  }

  /* ---------- modal ---------- */
  function openModal(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal(el) {
    var m = el.closest ? el.closest(".modal") : null;
    if (!m) return;
    m.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () { closeModal(el); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal:not([hidden])").forEach(function (m) { m.hidden = true; });
      document.body.style.overflow = "";
    }
  });

  /* ---------- form (tambah / edit) ---------- */
  function openForm(id) {
    var p = id ? byId(id) : null;
    $("formTitle").textContent = p ? "Edit prompt" : "Tambah prompt";
    $("fId").value = p ? p.id : "";
    $("fTitle").value = p ? p.title : "";
    $("fCategory").value = p ? p.category : "";
    $("fDesc").value = p ? p.description : "";
    $("fGithub").value = p ? p.github || "" : "";
    $("fPrompt").value = p ? p.prompt : "";
    $("formError").hidden = true;
    openModal("formModal");
    setTimeout(function () { $("fTitle").focus(); }, 60);
  }
  $("addBtn").addEventListener("click", function () { openForm(null); });

  $("promptForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = $("fTitle").value.trim();
    var category = $("fCategory").value.trim() || "Lainnya";
    var desc = $("fDesc").value.trim();
    var github = $("fGithub").value.trim();
    var prompt = $("fPrompt").value.trim();
    var err = $("formError");
    if (!title || !prompt) {
      err.textContent = "Judul dan isi prompt wajib diisi.";
      err.hidden = false;
      return;
    }
    var id = $("fId").value;
    if (id && byId(id)) {
      var p = byId(id);
      p.title = title; p.category = category; p.description = desc; p.github = github; p.prompt = prompt;
    } else {
      var nid = slugify(title);
      var n = 2;
      while (byId(nid)) { nid = slugify(title) + "-" + (n++); }
      state.prompts.unshift({ id: nid, title: title, category: category, description: desc, github: github, prompt: prompt });
    }
    markDirty();
    closeModal($("formModal"));
    toast("Prompt disimpan (draft). Jangan lupa publish.");
  });

  function removePrompt(id) {
    var p = byId(id);
    if (!p) return;
    if (!window.confirm('Hapus prompt "' + p.title + '"?')) return;
    state.prompts = state.prompts.filter(function (x) { return x.id !== id; });
    markDirty();
    toast("Prompt dihapus (draft). Jangan lupa publish.");
  }

  /* ---------- PIN gate ---------- */
  function showDash(on) {
    $("dash").hidden = !on;
    $("pinGate").hidden = on;
    $("logoutBtn").hidden = !on;
  }
  function setAdmin(on) {
    state.admin = on;
    if (on) sessionStorage.setItem(ADMIN_KEY, "1");
    else sessionStorage.removeItem(ADMIN_KEY);
    showDash(on);
    if (on) load();
  }
  $("pinForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("pinInput").value === String(CFG.ADMIN_PIN || "")) {
      setAdmin(true);
      toast("Selamat datang di dashboard.");
    } else {
      $("pinError").hidden = false;
      $("pinInput").select();
    }
  });
  $("logoutBtn").addEventListener("click", function () {
    setAdmin(false);
    $("pinInput").value = "";
    $("pinError").hidden = true;
    toast("Keluar dari dashboard.");
  });

  /* ---------- publish ---------- */
  function jsonText() { return JSON.stringify(state.prompts, null, 2) + "\n"; }

  $("downloadBtn").addEventListener("click", function () {
    var blob = new Blob([jsonText()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prompts.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast("prompts.json terdownload — ganti file itu di repo, Vercel redeploy otomatis.");
  });

  $("copyJsonBtn").addEventListener("click", function () {
    copyText(jsonText(), $("copyJsonBtn"), "JSON disalin ✓");
  });

  $("discardBtn").addEventListener("click", function () {
    if (!window.confirm("Buang semua perubahan draft dan kembali ke prompts.json yang live?")) return;
    clearDraft();
    state.dirty = false;
    load();
    toast("Draft dibuang.");
  });

  $("publishBtn").addEventListener("click", function () {
    var token = $("ghToken").value.trim();
    if (!token) {
      toast("Isi GitHub token dulu (fine-grained, akses Contents: write ke repo ini).");
      $("ghToken").focus();
      return;
    }
    try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
    publishToGitHub(token);
  });

  function publishToGitHub(token) {
    var owner = CFG.GITHUB_OWNER, repo = CFG.GITHUB_REPO;
    var branch = CFG.GITHUB_BRANCH || "main", path = CFG.GITHUB_PATH || "prompts.json";
    var base = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path;
    var btn = $("publishBtn");
    btn.disabled = true;
    btn.textContent = "Publishing…";
    toast("Lagi publish ke GitHub…");
    fetch(base + "?ref=" + encodeURIComponent(branch), {
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" },
    })
      .then(function (r) { return r.status === 404 ? null : r.json(); })
      .then(function (existing) {
        var body = {
          message: "Update prompts via dashboard admin",
          content: b64encodeUnicode(jsonText()),
          branch: branch,
        };
        if (existing && existing.sha) body.sha = existing.sha;
        return fetch(base, {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (j) { throw new Error((j && j.message) || ("HTTP " + r.status)); });
        return r.json();
      })
      .then(function () {
        clearDraft();
        state.dirty = false;
        updatePublish();
        toast("Berhasil dipublish — Vercel akan redeploy otomatis.");
      })
      .catch(function (err) {
        toast("Publish gagal: " + err.message + ". Cek token & nama repo di config.js.");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Publish ke GitHub";
      });
  }

  /* ---------- init ---------- */
  if (state.admin) { showDash(true); load(); }
  else { showDash(false); setTimeout(function () { $("pinInput").focus(); }, 60); }
})();
