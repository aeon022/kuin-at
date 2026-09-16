// Shared submit handler for forms that POST to Orbiter's public, unauthenticated
// `POST /api/form/:formId` endpoint (@a83/orbiter-admin) — submissions land in
// the admin's Inbox. The <form> itself keeps a real `action`/`method` pointing
// at the same URL, so it still works with JavaScript disabled (the browser
// just navigates to the JSON response instead of showing the inline message).
const ADMIN_URL = import.meta.env.PUBLIC_ORBITER_ADMIN_URL as string;

export function wireOrbiterForm(form: HTMLFormElement): void {
  const formId = form.dataset.formId;
  if (!formId) throw new Error('wireOrbiterForm: form is missing data-form-id');

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  const statusEl = form.querySelector('[data-form-status]') as HTMLElement | null;
  const submitLabel = submitBtn?.textContent ?? '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'text-sm'; }
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet …'; }

    try {
      const res = await fetch(`${ADMIN_URL}/api/form/${formId}`, {
        method: 'POST',
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      form.hidden = true;
      if (statusEl) {
        statusEl.textContent = 'Danke! Deine Nachricht ist angekommen.';
        statusEl.className = 'text-sm font-medium text-matcha-900';
        statusEl.hidden = false;
      }
    } catch {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      if (statusEl) {
        statusEl.textContent = 'Das hat leider nicht geklappt. Schreib uns direkt an office@kuin.at.';
        statusEl.className = 'text-sm font-medium text-kuin-dark';
        statusEl.hidden = false;
      }
    }
  });
}
