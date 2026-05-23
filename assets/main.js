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
