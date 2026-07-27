(() => {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const success = document.getElementById("booking-success");
  const required = [...form.querySelectorAll("[required]")];

  const mark = (field, ok) => {
    const wrap = field.closest(".booking-field");
    wrap?.classList.toggle("is-invalid", !ok);
  };

  required.forEach((field) => {
    field.addEventListener("input", () => mark(field, field.checkValidity()));
    field.addEventListener("change", () => mark(field, field.checkValidity()));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    required.forEach((field) => {
      const ok = field.checkValidity();
      mark(field, ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea")?.focus();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const service = String(data.get("service") || "").trim();
    const date = String(data.get("date") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent(`Booking: ${service} – ${name}`);
    const body = encodeURIComponent(
      [
        "Ny bookingforespørgsel fra hjemmesiden",
        "",
        `Navn: ${name}`,
        `Telefon: ${phone}`,
        `E-mail: ${email}`,
        `Ydelse: ${service}`,
        `Ønsket dato: ${date || "Ikke angivet"}`,
        "",
        "Beskrivelse:",
        message || "(ingen)",
      ].join("\n")
    );

    if (success) success.hidden = false;
    window.location.href = `mailto:lykkeservice@outlook.com?subject=${subject}&body=${body}`;
  });
})();
