"use strict";

// Two data structures keep product information and storage names organized.
const bakeryProducts = [
  { id: "bread", name: "Artisan breads" },
  { id: "pastries", name: "Pastries" },
  { id: "cakes", name: "Celebration cakes" }
];

const storageKeys = {
  favorites: "northStarBakeryFavorites",
  contact: "northStarBakeryContact"
};

const validationMessages = {
  nameRequired: "Please enter your full name.",
  nameShort: "Your name must contain at least 2 characters.",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address, such as name@example.com.",
  dateRequired: "Please choose a preferred pickup date.",
  datePast: "Please choose today or a future pickup date.",
  detailsRequired: "Please tell us what you would like to order or ask about.",
  detailsShort: "Please enter at least 10 characters so we have enough detail."
};

function readJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProductName(id) {
  const product = bakeryProducts.find((item) => item.id === id);
  return product ? product.name : id;
}

function renderFavorites(favorites) {
  const list = document.querySelector("#favorites-list");
  const message = document.querySelector("#favorites-message");
  const clearButton = document.querySelector("#clear-favorites");
  if (!list || !message || !clearButton) return;

  list.innerHTML = "";
  document.querySelectorAll(".favorite-button").forEach((button) => {
    const isSaved = favorites.includes(button.dataset.favoriteId);
    button.setAttribute("aria-pressed", String(isSaved));
    button.textContent = isSaved ? "Saved favorite" : "Save favorite";
    button.closest(".product-card")?.classList.toggle("is-favorite", isSaved);
  });

  if (favorites.length === 0) {
    message.textContent = "No favorites saved yet.";
    clearButton.hidden = true;
    return;
  }

  message.textContent = `${favorites.length} favorite${favorites.length === 1 ? "" : "s"} saved in this browser and restored automatically:`;
  favorites.forEach((id) => {
    const item = document.createElement("li");
    item.textContent = getProductName(id);
    list.appendChild(item);
  });
  clearButton.hidden = false;
}

function toggleFavorite(id) {
  const favorites = readJSON(storageKeys.favorites, []);
  const updated = favorites.includes(id)
    ? favorites.filter((favoriteId) => favoriteId !== id)
    : [...favorites, id];
  saveJSON(storageKeys.favorites, updated);
  renderFavorites(updated);
}

function initializeFavorites() {
  const buttons = document.querySelectorAll(".favorite-button");
  if (!buttons.length) return;

  renderFavorites(readJSON(storageKeys.favorites, []));
  buttons.forEach((button) => {
    button.addEventListener("click", () => toggleFavorite(button.dataset.favoriteId));
  });

  document.querySelector("#clear-favorites")?.addEventListener("click", () => {
    saveJSON(storageKeys.favorites, []);
    renderFavorites([]);
  });
}

function showFieldError(field, message) {
  const error = document.querySelector(`#${field.id}-error`);
  field.classList.toggle("has-error", Boolean(message));
  field.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
}

function validateName(field) {
  const value = field.value.trim();
  if (!value) return validationMessages.nameRequired;
  if (value.length < 2) return validationMessages.nameShort;
  return "";
}

function validateEmail(field) {
  const value = field.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) return validationMessages.emailRequired;
  if (!emailPattern.test(value)) return validationMessages.emailInvalid;
  return "";
}

function validatePickupDate(field) {
  if (!field.value) return validationMessages.dateRequired;
  const selected = new Date(`${field.value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) return validationMessages.datePast;
  return "";
}

function validateDetails(field) {
  const value = field.value.trim();
  if (!value) return validationMessages.detailsRequired;
  if (value.length < 10) return validationMessages.detailsShort;
  return "";
}

function validateForm(form) {
  const checks = [
    [form.elements.name, validateName],
    [form.elements.email, validateEmail],
    [form.elements["pickup-date"], validatePickupDate],
    [form.elements["item-details"], validateDetails]
  ];

  let firstInvalid = null;
  checks.forEach(([field, validator]) => {
    const message = validator(field);
    showFieldError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function saveContactPreference(form) {
  const remember = form.elements["remember-contact"].checked;
  if (!remember) {
    localStorage.removeItem(storageKeys.contact);
    return;
  }
  saveJSON(storageKeys.contact, {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    remember: true
  });
}

function restoreContactPreference(form) {
  const saved = readJSON(storageKeys.contact, null);
  if (!saved || !saved.remember) return;
  form.elements.name.value = saved.name || "";
  form.elements.email.value = saved.email || "";
  form.elements["remember-contact"].checked = true;

  const note = document.createElement("p");
  note.className = "storage-note";
  note.textContent = "Your saved name and email were restored from this browser.";
  form.prepend(note);
}

function initializeFormValidation() {
  const form = document.querySelector("#preorder-form");
  if (!form) return;
  restoreContactPreference(form);

  const liveChecks = {
    name: validateName,
    email: validateEmail,
    "pickup-date": validatePickupDate,
    "item-details": validateDetails
  };

  Object.entries(liveChecks).forEach(([name, validator]) => {
    const field = form.elements[name];
    field.addEventListener("input", () => showFieldError(field, validator(field)));
    field.addEventListener("blur", () => showFieldError(field, validator(field)));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.querySelector("#form-status");
    if (!validateForm(form)) {
      status.textContent = "Please correct the highlighted fields before submitting your request.";
      status.className = "form-status";
      return;
    }

    saveContactPreference(form);
    status.textContent = "Thanks! Your request passed validation and is ready for the bakery to review.";
    status.className = "form-status success";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeFavorites();
  initializeFormValidation();
});
