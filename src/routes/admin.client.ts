// Client-side script for /admin/posts editor.
// Served as inline <script type="module">. Plain JS.

export const adminClientScript = `
const title = document.getElementById("title");
const slug = document.getElementById("slug");
const body = document.getElementById("body");
const status = document.getElementById("save-status");
const form = document.getElementById("post-form");
const draftId = form.querySelector('input[name="draftId"]').value;

let timer = null;
let saving = false;
let lastSaved = { title: title.value, slug: slug.value, body: body.value };

function hasChanges() {
  return title.value !== lastSaved.title
    || slug.value !== lastSaved.slug
    || body.value !== lastSaved.body;
}

async function autosave() {
  if (saving || !hasChanges()) return;
  saving = true;
  status.textContent = "Saving...";
  try {
    const res = await fetch("/admin/posts/" + draftId + "/autosave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.value,
        slug: slug.value,
        body: body.value,
      }),
    });
    if (res.ok) {
      lastSaved = { title: title.value, slug: slug.value, body: body.value };
      status.textContent = "Saved";
    } else {
      status.textContent = "Save failed";
    }
  } catch {
    status.textContent = "Save failed";
  }
  saving = false;
}

function scheduleAutosave() {
  if (timer) clearTimeout(timer);
  if (hasChanges()) {
    status.textContent = "Unsaved changes";
  }
  timer = setTimeout(autosave, 2000);
}

async function save() {
  if (saving) return;
  saving = true;
  status.textContent = "Saving...";
  try {
    const formData = new FormData(form);
    const res = await fetch("/admin/posts/" + draftId, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.ok) {
      lastSaved = { title: title.value, slug: slug.value, body: body.value };
      status.textContent = data.published ? "Published" : "Saved";
    } else {
      status.textContent = data.errors.join(", ");
    }
  } catch {
    status.textContent = "Save failed";
  }
  saving = false;
}

form.addEventListener("submit", (e) => {
  // Let preview (formaction) submit normally
  if (e.submitter && e.submitter.hasAttribute("formaction")) return;
  e.preventDefault();
  if (timer) clearTimeout(timer);
  save();
});

title.addEventListener("input", scheduleAutosave);
slug.addEventListener("input", scheduleAutosave);
body.addEventListener("input", scheduleAutosave);
`;
