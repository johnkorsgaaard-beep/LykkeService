(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  root.classList.add("motion-ready");
  if (reduce) root.classList.add("motion-reduce");

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  /* Wait 2 frames so CSS can paint the "hidden" state before we fade in */
  const afterPaint = (fn) =>
    requestAnimationFrame(() => requestAnimationFrame(fn));

  /* ---------- HERO ---------- */
  const hero = document.querySelector(".hero");
  afterPaint(() => hero?.classList.add("is-hero-in"));

  /* ---------- SCROLL REVEALS ---------- */
  const revealPlan = [
    [".services-header > *", "up"],
    [".service-card", "up"],
    [".values-item", "up"],
    [".about-kicker, .about-kicker-rule, .about-title, .about-lead", "up"],
    [".about-list li", "left"],
    [".about-media, .about-visual", "right"],
    [".about-card, .about-namecard", "scale"],
    [".about-bar-item", "up"],
    [".why-header > *", "up"],
    [".why-card", "up"],
    [".why-cta", "scale"],
    [".footer-brand, .footer-col", "up"],
    [".footer-contact", "up"],
    [".footer-bottom > *", "up"],
  ];

  const revealEls = [];
  revealPlan.forEach(([selector, type]) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add("reveal", `reveal-${type}`);
      el.style.setProperty("--reveal-delay", `${Math.min(i * 80, 480)}ms`);
      revealEls.push(el);
    });
  });

  const revealNow = (el) => {
    if (!el.classList.contains("is-in")) el.classList.add("is-in");
  };

  if (reduce) {
    revealEls.forEach(revealNow);
  } else {
    afterPaint(() => {
      const vh = window.innerHeight;
      revealEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) revealNow(el);
      });

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              revealNow(entry.target);
              io.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
        );
        revealEls.forEach((el) => {
          if (!el.classList.contains("is-in")) io.observe(el);
        });
      } else {
        revealEls.forEach(revealNow);
      }

      /* Safety: never leave content invisible */
      setTimeout(() => revealEls.forEach(revealNow), 4500);
    });
  }

  /* ---------- HEADER + NAV ---------- */
  const header = document.querySelector(".site-header");
  const sections = [...document.querySelectorAll(".nav-link")]
    .map((link) => {
      const id = link.getAttribute("href");
      const section = id?.startsWith("#") ? document.querySelector(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  let scrollY = window.scrollY;
  let scrollTicking = false;

  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  const onScrollFrame = () => {
    header?.classList.toggle("is-scrolled", scrollY > 28);

    const probe = scrollY + window.innerHeight * 0.35;
    let current = sections[0];
    sections.forEach((item) => {
      if (item.section.offsetTop <= probe) current = item;
    });
    sections.forEach(({ link }) => {
      link.classList.toggle("is-active", link === current?.link);
    });

    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${clamp(max > 0 ? scrollY / max : 0, 0, 1)})`;
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );
  onScrollFrame();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      const target = id && id !== "#" ? document.querySelector(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  if (reduce) return;

  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("pointerenter", () => card.classList.add("is-shine"), {
      passive: true,
    });
    card.addEventListener("pointerleave", () => card.classList.remove("is-shine"), {
      passive: true,
    });
  });

  const garden = document.querySelector(".why-cta-garden");
  if (garden && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          garden.classList.toggle("is-alive", entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    ).observe(garden);
  }

  const footerMap = document.querySelector(".footer-map");
  if (footerMap && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          footerMap.classList.toggle("is-live", entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    ).observe(footerMap);
  } else {
    footerMap?.classList.add("is-live");
  }

  const countEls = [...document.querySelectorAll(".count-up[data-count]")];

  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute("data-count") || "");
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const dur = 2000;
    const tick = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = String(Math.round(target));
    };
    el.textContent = "0";
    requestAnimationFrame(tick);
  };

  if (countEls.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );
    countEls.forEach((el) => cio.observe(el));
  }
})();
