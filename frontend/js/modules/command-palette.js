/**
 * Command Palette Keyboard & Search Modal Module
 */

/* global bootstrap */

import { el } from './ui-utils.js';

export function setupCommandPalette() {
  const modal = el("command-palette");
  const trigger = el("cmd-palette-trigger");
  const input = el("cmd-input");
  const results = el("cmd-results");

  if (!modal || !trigger) return;

  const openPalette = () => {
    modal.showModal();
    if (input) { input.value = ""; input.focus(); }
  };

  const closePalette = () => {
    modal.close();
  };

  trigger.addEventListener("click", openPalette);

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      modal.open ? closePalette() : openPalette();
    } else if (e.key === "Escape" && modal.open) {
      closePalette();
    }
  });

  results?.addEventListener("click", (e) => {
    const item = e.target.closest(".cmd-item");
    if (!item) return;
    const action = item.dataset.action;
    const target = item.dataset.target;

    if (action === "nav") {
      const tabBtn = el(target.replace("#", ""));
      if (tabBtn) {
        const bsTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
        bsTab.show();
      }
    } else if (action === "trigger") {
      el(target)?.click();
    }
    closePalette();
  });

  input?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const items = results.querySelectorAll(".cmd-item");
    items.forEach(item => {
      const txt = item.textContent.toLowerCase();
      item.style.display = txt.includes(q) ? "flex" : "none";
    });
  });
}
