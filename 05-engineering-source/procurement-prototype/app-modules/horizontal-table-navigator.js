(function registerHorizontalTableNavigatorModule(root) {
  const registry = new Map();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeGroups(groups = []) {
    return groups
      .filter((group) => group && group.id && group.selector)
      .map((group) => ({
        id: String(group.id),
        label: String(group.label || group.id),
        selector: String(group.selector),
      }));
  }

  function shellFor(config = {}) {
    if (config.shell instanceof Element) return config.shell;
    if (config.shellSelector) return document.querySelector(config.shellSelector);
    if (config.id) return document.querySelector(`[data-horizontal-nav="${config.id}"]`);
    return null;
  }

  function ensureNavBar(state, position) {
    const shell = shellFor(state.config);
    if (!shell || !shell.parentElement) return null;
    const className = `horizontal-table-nav horizontal-table-nav-${position}`;
    const selector = `[data-horizontal-nav-ui="${state.id}"][data-horizontal-nav-position="${position}"]`;
    let bar = shell.parentElement.querySelector(selector);
    if (!bar) {
      bar = document.createElement("div");
      bar.className = className;
      bar.dataset.horizontalNavUi = state.id;
      bar.dataset.horizontalNavPosition = position;
      if (position === "top") shell.parentElement.insertBefore(bar, shell);
      else shell.parentElement.insertBefore(bar, shell.nextSibling);
    }
    return bar;
  }

  function removeNavBar(state, position) {
    const shell = shellFor(state.config);
    if (!shell || !shell.parentElement) return;
    shell.parentElement
      .querySelector(`[data-horizontal-nav-ui="${state.id}"][data-horizontal-nav-position="${position}"]`)
      ?.remove();
  }

  function groupMetrics(state) {
    const shell = shellFor(state.config);
    if (!shell) return [];
    return state.groups.map((group) => {
      const element = shell.querySelector(group.selector);
      if (!element) return null;
      const left = element.offsetLeft;
      const width = element.offsetWidth || 1;
      return {
        ...group,
        left,
        width,
        center: left + (width / 2),
      };
    }).filter(Boolean);
  }

  function currentGroup(state) {
    const shell = shellFor(state.config);
    const metrics = groupMetrics(state);
    if (!shell || !metrics.length) return null;
    const viewportCenter = shell.scrollLeft + (shell.clientWidth / 2);
    return metrics
      .map((group) => ({ ...group, distance: Math.abs(group.center - viewportCenter) }))
      .sort((left, right) => left.distance - right.distance)[0] || null;
  }

  function positionLabel(shell) {
    if (!shell) return "Centered";
    const maxScroll = Math.max(0, shell.scrollWidth - shell.clientWidth);
    if (!maxScroll) return "All columns visible";
    const ratio = shell.scrollLeft / maxScroll;
    if (ratio < 0.1) return "Start columns";
    if (ratio > 0.9) return "End columns";
    return "Middle columns";
  }

  function stateSnapshot(state) {
    const shell = shellFor(state.config);
    const group = currentGroup(state);
    const maxScroll = shell ? Math.max(0, shell.scrollWidth - shell.clientWidth) : 0;
    return {
      id: state.id,
      currentGroupId: group?.id || "",
      currentGroupLabel: group?.label || "",
      positionLabel: positionLabel(shell),
      hasOverflow: Boolean(maxScroll > 4),
      canScrollLeft: Boolean(shell && shell.scrollLeft > 0),
      canScrollRight: Boolean(shell && shell.scrollLeft < maxScroll - 4),
    };
  }

  function renderBar(state, position) {
    const shell = shellFor(state.config);
    const maxScroll = shell ? Math.max(0, shell.scrollWidth - shell.clientWidth) : 0;
    if (!shell || maxScroll <= 4) {
      removeNavBar(state, position);
      return;
    }
    const bar = ensureNavBar(state, position);
    if (!shell || !bar) return;
    const groups = groupMetrics(state);
    const snapshot = stateSnapshot(state);
    bar.innerHTML = `
      <div class="horizontal-table-nav__controls">
        <button class="ghost" type="button" data-horizontal-nav-action="left" data-horizontal-nav-id="${state.id}" ${snapshot.canScrollLeft ? "" : "disabled"}>Previous columns</button>
        <button class="ghost" type="button" data-horizontal-nav-action="right" data-horizontal-nav-id="${state.id}" ${snapshot.canScrollRight ? "" : "disabled"}>Next columns</button>
      </div>
      <div class="horizontal-table-nav__status">
        <strong>${snapshot.currentGroupLabel || state.config.label || "Scrollable columns"}</strong>
        <span>${snapshot.positionLabel}</span>
      </div>
      <div class="horizontal-table-nav__groups">
        ${groups.length
    ? groups.map((group) => `<button class="horizontal-table-nav__group ${group.id === snapshot.currentGroupId ? "active" : ""}" type="button" data-horizontal-nav-group="${group.id}" data-horizontal-nav-id="${state.id}">${group.label}</button>`).join("")
    : `<span class="horizontal-table-nav__hint">Use Previous / Next columns to navigate this evidence table.</span>`}
      </div>`;
  }

  function notify(state) {
    const snapshot = stateSnapshot(state);
    if (typeof state.config.onStateChange === "function") state.config.onStateChange(snapshot);
  }

  function render(state) {
    const positions = Array.isArray(state.config.positions) ? state.config.positions : ["top", "bottom"];
    ["top", "bottom"].forEach((position) => {
      if (positions.includes(position)) renderBar(state, position);
      else removeNavBar(state, position);
    });
    notify(state);
  }

  function scrollByStep(id, direction = 1) {
    const state = registry.get(id);
    const shell = state ? shellFor(state.config) : null;
    if (!shell) return;
    const amount = Math.max(240, Math.round(shell.clientWidth * 0.72)) * direction;
    shell.scrollBy({ left: amount, behavior: "smooth" });
  }

  function scrollToGroup(id, groupId) {
    const state = registry.get(id);
    const shell = state ? shellFor(state.config) : null;
    if (!state || !shell) return;
    const group = groupMetrics(state).find((item) => item.id === groupId);
    if (!group) return;
    const targetLeft = clamp(group.left - 16, 0, Math.max(0, shell.scrollWidth - shell.clientWidth));
    shell.scrollTo({ left: targetLeft, behavior: "smooth" });
  }

  function refresh(id) {
    const state = registry.get(id);
    if (state) render(state);
  }

  function mount(config = {}) {
    if (!config.id) return null;
    const state = {
      id: String(config.id),
      config,
      groups: normalizeGroups(config.groups),
      boundScroll: null,
    };
    registry.set(state.id, state);
    const shell = shellFor(config);
    if (!shell) return state;
    if (!shell.dataset.horizontalNavBound) {
      const rerender = () => {
        const latest = registry.get(state.id) || state;
        render(latest);
      };
      state.boundScroll = rerender;
      shell.addEventListener("scroll", rerender, { passive: true });
      window.addEventListener("resize", rerender);
      shell.dataset.horizontalNavBound = "true";
    }
    render(state);
    return state;
  }

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-horizontal-nav-action]");
    if (action) {
      const direction = action.dataset.horizontalNavAction === "left" ? -1 : 1;
      scrollByStep(action.dataset.horizontalNavId, direction);
      return;
    }
    const group = event.target.closest("[data-horizontal-nav-group]");
    if (group) scrollToGroup(group.dataset.horizontalNavId, group.dataset.horizontalNavGroup);
  });

  const api = {
    mount,
    refresh,
    scrollByStep,
    scrollToGroup,
    currentGroup(id) {
      const state = registry.get(id);
      return stateSnapshot(state || { id, config: {}, groups: [] });
    },
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.horizontalTableNavigator = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
