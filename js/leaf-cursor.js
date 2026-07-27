(() => {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer) return;

  const el = document.createElement("div");
  el.className = "leaf-cursor";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<img src="assets/cursor-leaf-float.png?v=zip1" alt="" width="64" height="64" draggable="false" />`;
  document.body.appendChild(el);
  document.documentElement.classList.add("has-leaf-cursor");

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let scale = 1;
  let targetScale = 1;
  let visible = false;
  let hot = false;
  let running = false;

  const ease = reduceMotion ? 1 : 0.18;

  const isTextTarget = (node) => {
    if (!(node instanceof Element)) return false;
    return Boolean(node.closest("input, textarea, select, [contenteditable='true']"));
  };

  const paint = () => {
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
  };

  const tick = () => {
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    scale += (targetScale - scale) * 0.14;

    const dx = targetX - x;
    const dy = targetY - y;
    paint();

    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2 || Math.abs(targetScale - scale) > 0.004) {
      requestAnimationFrame(tick);
    } else {
      x = targetX;
      y = targetY;
      scale = targetScale;
      paint();
      running = false;
    }
  };

  const kick = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!visible) {
        visible = true;
        x = targetX;
        y = targetY;
        el.classList.add("is-visible");
        paint();
      }

      const nextHot = Boolean(
        e.target.closest?.("a, button, .btn, .why-btn, .service-card, .nav-link")
      );
      if (nextHot !== hot) {
        hot = nextHot;
        targetScale = hot ? 1.12 : 1;
        el.classList.toggle("is-hot", hot);
      }

      el.classList.toggle("is-text", isTextTarget(e.target));
      kick();
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => {
    visible = false;
    el.classList.remove("is-visible");
  });
  window.addEventListener("blur", () => {
    visible = false;
    el.classList.remove("is-visible");
  });
})();
