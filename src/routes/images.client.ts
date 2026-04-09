// Client-side script for /admin/images.
// Served as inline <script type="module">. Plain JS.

export const imagesClientScript = `
const MAX_1X = 1600;
const MAX_2X = 3200;
const QUALITY = 0.85;
const baseUrl = window.__ASSET_BASE_URL__;

const $ = (id) => document.getElementById(id);
const dropZone = $("drop-zone");
const fileInput = $("file-input");
const previewArea = $("preview-area");
const gallery = $("gallery");

let pending = [];
let editingId = null;

// ----- Gallery -----
async function loadGallery() {
  const res = await fetch("/admin/images/data");
  const { images } = await res.json();
  gallery.innerHTML = "";
  for (const img of images) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.cssText = "position:relative;aspect-ratio:1;background:#f3f4f6;border-radius:.375rem;overflow:hidden;cursor:pointer";
    const i = document.createElement("img");
    i.src = baseUrl + "/" + img.key;
    i.loading = "lazy";
    i.style.cssText = "width:100%;height:100%;object-fit:cover";
    tile.appendChild(i);
    tile.addEventListener("click", () => openMenu(img));
    gallery.appendChild(tile);
  }
}

// ----- Action menu -----
function openMenu(img) {
  const menu = document.createElement("div");
  menu.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100";
  menu.innerHTML = \`
    <div style="background:#fff;border-radius:.5rem;padding:1.5rem;min-width:280px;max-width:90vw">
      <img src="\${baseUrl}/\${img.key}" style="max-width:100%;max-height:40vh;display:block;margin:0 auto 1rem">
      <div style="font-size:.75rem;color:#6b7280;margin-bottom:1rem;text-align:center">\${img.width}×\${img.height} · \${formatSize(img.size)}</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        <button data-action="copy" style="\${btnStyle()}">\\\\i \${img.id} をコピー</button>
        <button data-action="edit" style="\${btnStyle()}">編集 (再トリミング)</button>
        <button data-action="delete" style="\${btnStyle('danger')}">削除</button>
        <button data-action="close" style="\${btnStyle('plain')}">閉じる</button>
      </div>
    </div>
  \`;
  document.body.appendChild(menu);
  menu.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    if (action === "close") { document.body.removeChild(menu); return; }
    if (action === "copy") {
      await navigator.clipboard.writeText("\\\\i " + img.id + "\\n\\n\\\\");
      e.target.textContent = "コピーしました";
      return;
    }
    if (action === "edit") {
      document.body.removeChild(menu);
      startEdit(img);
      return;
    }
    if (action === "delete") {
      document.body.removeChild(menu);
      await deleteImage(img.id);
      return;
    }
  });
}

function btnStyle(kind) {
  const base = "padding:.5rem 1rem;border-radius:.375rem;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:.875rem;font-family:inherit";
  if (kind === "danger") return base + ";color:#dc2626;border-color:#fecaca";
  if (kind === "plain") return base + ";color:#6b7280";
  return base;
}

function formatSize(b) {
  if (b < 1024) return b + "B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + "KB";
  return (b / 1024 / 1024).toFixed(1) + "MB";
}

// ----- Delete -----
async function deleteImage(id) {
  const refsRes = await fetch("/admin/images/" + id + "/references");
  const { references } = await refsRes.json();
  let msg = "この画像を削除しますか?";
  if (references.length > 0) {
    msg = "この画像は " + references.length + " 件の記事で参照されています:\\n" +
          references.map((r) => "  - " + r.title).join("\\n") +
          "\\n本当に削除しますか?";
  }
  if (!confirm(msg)) return;
  await fetch("/admin/images/" + id, { method: "DELETE" });
  await loadGallery();
}

// ----- Upload flow -----
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", () => handleFiles(fileInput.files));

async function handleFiles(files) {
  for (const f of files) {
    pending.push(f);
  }
  if (pending.length > 0) await processNext();
}

async function processNext() {
  if (pending.length === 0) {
    await loadGallery();
    return;
  }
  const file = pending.shift();
  const img = await loadImage(file);
  showCropper(img, file.name, async (cropRect) => {
    await uploadImage(img, cropRect, file.name, null);
    await processNext();
  });
}

function loadImage(fileOrUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof fileOrUrl === "string") {
      img.src = fileOrUrl;
    } else {
      img.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

// ----- Cropper -----
function showCropper(img, name, onConfirm) {
  previewArea.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.cssText = "margin-top:1rem;padding:1rem;border:1px solid #e5e7eb;border-radius:.5rem;background:#fafafa";
  const title = document.createElement("div");
  title.textContent = name + " — ドラッグでトリミング、未指定なら全体";
  title.style.cssText = "font-size:.75rem;color:#6b7280;margin-bottom:.5rem";
  wrap.appendChild(title);

  const canvasWrap = document.createElement("div");
  canvasWrap.style.cssText = "position:relative;display:inline-block;max-width:100%";
  const displayMaxW = Math.min(800, img.naturalWidth);
  const scale = displayMaxW / img.naturalWidth;
  const dispW = Math.round(img.naturalWidth * scale);
  const dispH = Math.round(img.naturalHeight * scale);

  const previewImg = document.createElement("img");
  previewImg.src = img.src;
  previewImg.style.cssText = "display:block;width:" + dispW + "px;height:" + dispH + "px;user-select:none;-webkit-user-drag:none";
  canvasWrap.appendChild(previewImg);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;cursor:crosshair";
  canvasWrap.appendChild(overlay);

  const rect = document.createElement("div");
  rect.style.cssText = "position:absolute;border:2px dashed #111827;background:rgba(255,255,255,.15);display:none;pointer-events:none";
  canvasWrap.appendChild(rect);

  let dragging = false;
  let startX = 0, startY = 0, curX = 0, curY = 0;
  overlay.addEventListener("pointerdown", (e) => {
    dragging = true;
    const r = overlay.getBoundingClientRect();
    startX = e.clientX - r.left;
    startY = e.clientY - r.top;
    curX = startX; curY = startY;
    updateRect();
    overlay.setPointerCapture(e.pointerId);
  });
  overlay.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const r = overlay.getBoundingClientRect();
    curX = Math.max(0, Math.min(dispW, e.clientX - r.left));
    curY = Math.max(0, Math.min(dispH, e.clientY - r.top));
    updateRect();
  });
  overlay.addEventListener("pointerup", () => { dragging = false; });
  function updateRect() {
    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);
    if (w < 5 || h < 5) { rect.style.display = "none"; return; }
    rect.style.display = "block";
    rect.style.left = x + "px";
    rect.style.top = y + "px";
    rect.style.width = w + "px";
    rect.style.height = h + "px";
  }

  wrap.appendChild(canvasWrap);

  const buttons = document.createElement("div");
  buttons.style.cssText = "margin-top:.75rem;display:flex;gap:.5rem";
  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "アップロード";
  confirmBtn.style.cssText = btnStyle();
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "選択解除";
  resetBtn.style.cssText = btnStyle("plain");
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  cancelBtn.style.cssText = btnStyle("plain");
  buttons.appendChild(confirmBtn);
  buttons.appendChild(resetBtn);
  buttons.appendChild(cancelBtn);
  wrap.appendChild(buttons);

  resetBtn.addEventListener("click", () => {
    startX = startY = curX = curY = 0;
    rect.style.display = "none";
  });
  cancelBtn.addEventListener("click", () => {
    previewArea.removeChild(wrap);
    processNext();
  });
  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "処理中...";
    let cropRect = null;
    if (rect.style.display !== "none") {
      const x = Math.min(startX, curX) / scale;
      const y = Math.min(startY, curY) / scale;
      const w = Math.abs(curX - startX) / scale;
      const h = Math.abs(curY - startY) / scale;
      cropRect = { x, y, w, h };
    }
    previewArea.removeChild(wrap);
    await onConfirm(cropRect);
  });

  previewArea.appendChild(wrap);
}

// ----- Encode + upload -----
async function encodeWebp(img, sx, sy, sw, sh, targetW, targetH) {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
}

async function uploadImage(img, cropRect, originalFilename, editId) {
  const sx = cropRect ? cropRect.x : 0;
  const sy = cropRect ? cropRect.y : 0;
  const sw = cropRect ? cropRect.w : img.naturalWidth;
  const sh = cropRect ? cropRect.h : img.naturalHeight;

  // 1x: capped at MAX_1X
  const ratio1x = Math.min(1, MAX_1X / sw);
  const w1 = Math.round(sw * ratio1x);
  const h1 = Math.round(sh * ratio1x);
  const blob1x = await encodeWebp(img, sx, sy, sw, sh, w1, h1);

  // 2x: capped at MAX_2X. Only if source is large enough.
  let blob2x = null;
  if (sw >= w1 * 1.5) {
    const ratio2x = Math.min(1, MAX_2X / sw);
    const w2 = Math.round(sw * ratio2x);
    const h2 = Math.round(sh * ratio2x);
    blob2x = await encodeWebp(img, sx, sy, sw, sh, w2, h2);
  }

  const form = new FormData();
  form.append("file", blob1x, "image.webp");
  if (blob2x) form.append("file2x", blob2x, "image@2x.webp");
  form.append("width", String(w1));
  form.append("height", String(h1));
  form.append("originalFilename", originalFilename);

  const url = editId ? "/admin/images/" + editId : "/admin/images";
  const method = editId ? "PUT" : "POST";
  const res = await fetch(url, { method, body: form });
  if (!res.ok) {
    alert("アップロードに失敗しました");
    return;
  }
}

async function startEdit(imgMeta) {
  const url = baseUrl + "/" + (imgMeta.key2x || imgMeta.key);
  let img;
  try {
    img = await loadImage(url);
  } catch {
    alert("画像の読み込みに失敗しました (CORS の可能性)");
    return;
  }
  showCropper(img, "編集中", async (cropRect) => {
    await uploadImage(img, cropRect, imgMeta.originalFilename || "edited.webp", imgMeta.id);
    await loadGallery();
  });
}

loadGallery();
`;
