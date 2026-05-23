const filterButtons = document.querySelectorAll(".filter-button");
const appCards = document.querySelectorAll(".app-card");
const dialog = document.querySelector(".preview-dialog");
const previewImage = document.querySelector("#preview-image");
const previewTitle = document.querySelector("#preview-title");
const closeDialog = document.querySelector(".dialog-close");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    appCards.forEach((card) => {
      const categories = card.dataset.category || "";
      card.classList.toggle("is-hidden", filter !== "all" && !categories.includes(filter));
    });
  });
});

document.querySelectorAll(".preview-button[data-preview]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!dialog || !previewImage || !previewTitle) return;

    previewImage.src = button.dataset.preview;
    previewImage.alt = `Skjermbilde av ${button.dataset.title}`;
    previewTitle.textContent = button.dataset.title;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }
  });
});

closeDialog?.addEventListener("click", () => dialog?.close());

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});

document.querySelector("#leadForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);
  const note = document.querySelector("#formNote");
  const payload = {
    name: data.get("name") || "",
    email: data.get("email") || "",
    company: data.get("company") || "",
    message: data.get("message") || "",
    interests: [data.get("interest") || "Ikke sikker ennå"]
  };
  const subject = encodeURIComponent("Ny prosjektbrief fra ChatGenius.pro");
  const body = encodeURIComponent(
    [
      `Navn: ${payload.name}`,
      `E-post: ${payload.email}`,
      `Bedrift: ${payload.company}`,
      `Interesse: ${payload.interests.join(", ")}`,
      "",
      "Behov:",
      payload.message
    ].join("\n")
  );

  if (note) {
    note.textContent = "Sender briefen...";
  }

  fetch("/api/submit_lead.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Lead endpoint unavailable");
      }

      return response.json();
    })
    .then(() => {
      form.reset();

      if (note) {
        note.textContent = "Takk! Vi tar kontakt med konkrete forslag.";
      }
    })
    .catch(() => {
      window.location.href = `mailto:post@chatgenius.pro?subject=${subject}&body=${body}`;

      if (note) {
        note.textContent = "E-postklienten din åpnes med prosjektbriefen ferdig utfylt.";
      }
    });
});
