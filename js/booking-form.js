(() => {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const success = document.getElementById("booking-success");
  const errorEl = document.getElementById("booking-error");
  const submitBtn = form.querySelector(".booking-submit");
  const required = [...form.querySelectorAll("[required]")];

  const mark = (field, ok) => {
    const wrap = field.closest(".booking-field");
    wrap?.classList.toggle("is-invalid", !ok);
  };

  const setBusy = (busy) => {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.classList.toggle("is-loading", busy);
    submitBtn.setAttribute("aria-busy", busy ? "true" : "false");
  };

  const showError = (message) => {
    if (!errorEl) {
      window.alert(message);
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  };

  const hideMessages = () => {
    if (success) success.hidden = true;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
  };

  required.forEach((field) => {
    field.addEventListener("input", () => mark(field, field.checkValidity()));
    field.addEventListener("change", () => mark(field, field.checkValidity()));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();

    let valid = true;
    required.forEach((field) => {
      const ok = field.checkValidity();
      mark(field, ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      form
        .querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea")
        ?.focus();
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      service: String(data.get("service") || "").trim(),
      date: String(data.get("date") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };

    setBusy(true);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result = null;
      try {
        result = await res.json();
      } catch {
        result = null;
      }

      if (!res.ok || !result?.ok) {
        throw new Error(
          result?.error ||
            "Kunne ikke sende booking. Prøv igen, eller ring 30 41 42 42."
        );
      }

      form.reset();
      required.forEach((field) => mark(field, true));
      if (success) {
        success.hidden = false;
        success.focus?.();
      }
    } catch (err) {
      showError(
        err?.message ||
          "Kunne ikke sende booking. Prøv igen, eller ring 30 41 42 42."
      );
    } finally {
      setBusy(false);
    }
  });
})();
