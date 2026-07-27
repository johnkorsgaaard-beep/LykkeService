(() => {
  const root = document.getElementById("heroVideos");
  if (!root) return;

  const panels = [...root.querySelectorAll(".video-panel")];
  const videos = panels.map((panel) => panel.querySelector("video"));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const playSafe = async (video) => {
    if (!video) return;
    try {
      video.currentTime = 0;
      await video.play();
    } catch {
      /* autoplay may be blocked — muted + playsinline usually OK */
    }
  };

  const setTop = (index) => {
    panels.forEach((panel, i) => {
      panel.classList.toggle("is-top", i === index);
    });
  };

  const runSequence = async () => {
    root.dataset.state = "stack";

    for (let i = 0; i < panels.length; i += 1) {
      const panel = panels[i];
      panel.classList.add("is-in");
      setTop(i);
      await playSafe(videos[i]);
      await wait(reduceMotion ? 120 : 900);
    }

    await wait(reduceMotion ? 80 : 700);

    /* Keep all playing, then fan out side-by-side */
    root.dataset.state = "split";
    panels.forEach((panel) => {
      panel.classList.add("is-in");
      panel.classList.remove("is-top");
    });

    await Promise.all(videos.map((video) => playSafe(video)));
  };

  const start = () => {
    if (reduceMotion) {
      root.dataset.state = "split";
      panels.forEach((panel) => panel.classList.add("is-in"));
      videos.forEach((video) => playSafe(video));
      return;
    }

    /* Small beat so first paint feels intentional */
    wait(280).then(runSequence);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
