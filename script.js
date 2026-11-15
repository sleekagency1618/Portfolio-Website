/* =====================================================================
   SLEEK DESIGN AGENCY — shared behaviour for every page
   All text lives in the HTML (in French and English). This file only:
   1. remembers and switches the language
   2. filters the project cards (home page)
   3. drives the scroll-folding box (home page)
   ===================================================================== */

/* ---------- 1. LANGUAGE: set before the page paints, so there is no flash ---------- */
(function(){
  let lang = null;
  try{ lang = localStorage.getItem("sleek-lang"); }catch(e){}
  if (!lang) lang = (navigator.language || "fr").startsWith("en") ? "en" : "fr";
  document.documentElement.lang = lang;
})();

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // old links like index.html#nordalys now go to the project's own page
  const legacy = location.hash.slice(1);
  if (legacy && document.querySelector(`.card[href="projects/${legacy}.html"]`)){
    location.replace(`projects/${legacy}.html`);
    return;
  }

  // the whole toggle is one button: any click flips to the other language
  const toggle = document.querySelector(".lang");
  const syncToggle = () => {
    toggle.dataset.active = root.lang;   // moves the sliding pill (see .lang::before in styles.css)
    toggle.setAttribute("aria-label", root.lang === "fr" ? "Switch to English" : "Passer en français");
  };
  syncToggle();
  toggle.addEventListener("click", () => {
    root.lang = root.lang === "fr" ? "en" : "fr";
    try{ localStorage.setItem("sleek-lang", root.lang); }catch(e){}
    syncToggle();
  });
  // turn on the pill's slide only after the first paint, so it doesn't animate on page load
  requestAnimationFrame(() => requestAnimationFrame(() => toggle.classList.add("ready")));

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 2. PROJECT CARDS: filters (home page only) ---------- */
  const filters = document.getElementById("filters");
  const grid = document.getElementById("grid");
  if (filters && grid){
    filters.addEventListener("click", e => {
      const btn = e.target.closest("button[data-cat]"); if (!btn) return;
      const cat = btn.dataset.cat;
      filters.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === btn));
      grid.querySelectorAll(".card").forEach(card => {
        card.hidden = cat !== "all" && !card.dataset.cats.split(" ").includes(cat);
      });
      // the large first card only makes sense in the full list
      grid.classList.toggle("filtered", cat !== "all");
    });
  }

  /* ---------- 3. FOLD: scroll position drives the box assembly (home page only) ---------- */
  const fold = document.getElementById("fold");
  if (fold){
    const stage = document.getElementById("fold-stage");
    const rig = document.getElementById("rig");
    const steps = document.querySelectorAll(".fold-steps li");
    const clamp01 = v => Math.min(1, Math.max(0, v));
    const seg = (p, a, b) => clamp01((p - a) / (b - a));                   // 0→1 progress inside one stage
    const ease = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;    // smooth in and out
    const lerp = (a, b, x) => a + (b - a) * x;

    const setFold = p => {
      // stages of the fold, each mapped to part of the scroll
      const sides = ease(seg(p, .05, .45));
      const flaps = ease(seg(p, .42, .58));
      const lid   = ease(seg(p, .56, .78));
      const tuck  = ease(seg(p, .72, .86));
      const turn  = ease(seg(p, 0, 1));
      rig.style.setProperty("--a", 90 * sides);   // side, back, side panels
      rig.style.setProperty("--g", 90 * sides);   // glue flap
      rig.style.setProperty("--d", 90 * flaps);   // dust flaps
      rig.style.setProperty("--b", 90 * flaps);   // bottom
      rig.style.setProperty("--l", 90 * lid);     // top lid
      rig.style.setProperty("--t", 90 * tuck);    // tuck tab

      // flat net is 502px wide; assembled box is 160×200×80. Keep it centred and fitted.
      // never larger than its designed size, which grows with rem on wide screens (see html in styles.css)
      const remScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      const fit = Math.min(remScale, stage.clientWidth / 540, stage.clientHeight / 420);
      const s  = fit * lerp(1, 1.35, turn);
      const tx = lerp(-229, -80, sides), ty = lerp(-91, -100, sides), tz = lerp(0, 40, sides);
      rig.style.transform =
        `scale(${s}) rotateX(${lerp(0, -22, turn)}deg) rotateY(${lerp(0, -38, turn)}deg) translate3d(${tx}px, ${ty}px, ${tz}px)`;

      const active = p < .4 ? 0 : p < .8 ? 1 : 2;
      steps.forEach((li, i) => li.classList.toggle("on", i === active));
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const travel = fold.offsetHeight - window.innerHeight;
        setFold(clamp01(-fold.getBoundingClientRect().top / travel));
      });
    };
    if (reduceMotion){
      setFold(1);
      window.addEventListener("resize", () => setFold(1));
    } else {
      window.addEventListener("scroll", onScroll, {passive:true});
      window.addEventListener("resize", onScroll);
      onScroll();
    }
  }
});
