/* ==========================
   FitStance — Upgraded master.js
   - Improved UX, accessibility, dark-mode toggle
   - Preserves Tools page calculations (no change to formulas)
   - Works with css/style.css provided
   - Usage: save as js/master.js and reference with <script src="js/master.js" defer></script>
   ========================== */

(function () {
  "use strict";

  // Helpers
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const exists = (el) => !!el;

  // Small safe logger
  const log = (...args) => {
    if (window.console) console.log("%c[master.js]", "color:#00bfa6;font-weight:700", ...args);
  };

  // Debounce helper
  const debounce = (fn, wait = 100) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  // Document ready
  document.addEventListener("DOMContentLoaded", () => {
    log("booting...");

    /* ------------------------------
       0. GLOBAL FOOTER LOADER
       (tries multiple paths, inserts into #footer or #footer-container)
    ------------------------------ */
    (function loadFooter() {
      const footerContainer = document.getElementById("footer") || document.getElementById("footer-container");
      const tryFetchFooter = (path) =>
        fetch(path)
          .then((res) => (res.ok ? res.text() : Promise.reject("Footer not found")))
          .then((html) => {
            if (footerContainer) footerContainer.innerHTML = html;
          });

      if (footerContainer) {
        tryFetchFooter("/footer.html")
          .catch(() => tryFetchFooter("footer.html"))
          .catch(() => tryFetchFooter("../footer.html"))
          .catch((err) => console.warn("⚠ Footer load skipped:", err));
      } else {
        // if no container present, create one and try again
        const created = document.createElement("div");
        created.id = "footer-container";
        document.body.appendChild(created);
        tryFetchFooter("../footer.html").catch((err) => console.warn("⚠ Footer load skipped:", err));
      }
    })();

    /* ------------------------------
       1. NAV / MOBILE MENU / ACTIVE LINKS
    ------------------------------ */
    (function navSetup() {
      const headerInner = document.querySelector(".header-inner");
      const nav = document.querySelector(".nav");
      const menuToggle = document.querySelector(".menu-toggle");

      // If nav doesn't exist, try to create a minimal one (defensive)
      if (!nav && headerInner) {
        const navEl = document.createElement("nav");
        navEl.className = "nav";
        navEl.innerHTML = `
          <a href="index.html">Home</a>
          <a href="workouts.html">Workouts</a>
          <a href="diet.html">Diet</a>
          <a href="tools.html">Tools</a>
          <a href="protips.html">Pro Tips</a>
          <a href="about.html">About</a>
          <a href="contact.html">Contact</a>
        `;
        headerInner.appendChild(navEl);
      }

      const navEl = document.querySelector(".nav");
      if (menuToggle && navEl) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.addEventListener("click", () => {
          const expanded = menuToggle.getAttribute("aria-expanded") === "true";
          menuToggle.setAttribute("aria-expanded", String(!expanded));
          navEl.classList.toggle("active");
          menuToggle.classList.toggle("open");
        });
      }

      // Close mobile nav when clicking a link
      if (navEl) {
        navEl.addEventListener("click", (e) => {
          if (e.target.tagName === "A") {
            navEl.classList.remove("active");
            menuToggle?.classList.remove("open");
          }
        });
      }

      // Mark the active nav link based on current path
      (function markActiveLink() {
        const path = (location.pathname || "").split("/").pop() || "index.html";
        const links = $$("nav a, .nav a");
        links.forEach((a) => {
          const href = (a.getAttribute("href") || "").split("/").pop();
          if (!href) return;
          if (href === path || (href === "index.html" && path === "")) {
            a.classList.add("active-link");
            a.setAttribute("aria-current", "page");
          } else {
            a.classList.remove("active-link");
            a.removeAttribute("aria-current");
          }
        });
      })();
    })();

    /* ------------------------------
       2. CARD CLICK NAVIGATION (Home grid cards)
       - Uses data-link OR derives from data-title
    ------------------------------ */
    (function cardLinks() {
      const cards = $$(".card");
      cards.forEach((card) => {
        // If card already has an <a> inside, skip
        if (card.querySelector("a")) return;

        // extract link from data-link or data-title
        const link = card.dataset.link || (card.dataset.title ? `${card.dataset.title.toLowerCase().replace(/\s+/g, "")}.html` : null);
        if (!link) return;

        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
          // allow internal clickable elements (buttons, anchors) to work normally
          const tag = e.target.tagName.toLowerCase();
          if (["a", "button", "input"].includes(tag)) return;
          window.location.href = link;
        });

        // keyboard accessibility
        card.setAttribute("tabindex", "0");
        card.addEventListener("keypress", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.location.href = link;
          }
        });
      });
    })();

    /* ------------------------------
       3. Smooth anchor scrolling (for internal anchors)
    ------------------------------ */
    (function smoothAnchors() {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
          const href = anchor.getAttribute("href");
          if (!href || href === "#") return;
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          const nav = document.querySelector(".nav");
          const menuToggle = document.querySelector(".menu-toggle");
          if (nav && nav.classList.contains("active")) {
            nav.classList.remove("active");
            menuToggle?.classList.remove("open");
          }
        });
      });
    })();

    /* ------------------------------
       4. Accordions (workouts / FAQs)
    ------------------------------ */
    (function accordions() {
      const headers = $$(".accordion-header");
      headers.forEach((header) => {
        header.setAttribute("role", "button");
        header.setAttribute("tabindex", "0");
        header.addEventListener("click", () => toggleAccordion(header));
        header.addEventListener("keypress", (e) => {
          if (e.key === "Enter" || e.key === " ") toggleAccordion(header);
        });
      });

      function toggleAccordion(header) {
        const item = header.parentElement;
        headers.forEach((h) => {
          if (h !== header && h.parentElement) h.parentElement.classList.remove("active");
        });
        if (item) {
          item.classList.toggle("active");
          header.setAttribute("aria-expanded", item.classList.contains("active"));
        }
      }
    })();

    /* ------------------------------
       5. Workout Goals (sublevels & showPlan)
       - Backwards-compatible with inline onclick attributes
       - Also adds nicer animation & accessibility
    ------------------------------ */
    (function workoutGoals() {
      const sublevels = $$(".sublevels");
      const workoutPlans = $$(".workout-plan");
      window.toggleSublevels = (id) => {
        if (!id) return;
        const targetId = `${id}-sub`;
        sublevels.forEach((sub) => {
          const willShow = sub.id === targetId && !sub.classList.contains("show");
          sub.classList.toggle("show", willShow);
        });
        // hide plans when toggling goals
        workoutPlans.forEach((p) => p.classList.remove("show"));
      };

      window.showPlan = (id) => {
        if (!id) return;
        workoutPlans.forEach((plan) => {
          const willShow = plan.id === id;
          plan.classList.toggle("show", willShow);
          if (willShow) {
            setTimeout(() => plan.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
          }
        });
      };

      // Also attach to any .goal-card or .sublevel-btn elements for a better event model
      $$(".goal-card").forEach((el) => {
        el.addEventListener("click", () => {
          const key = el.dataset.goal || el.textContent.trim().toLowerCase().replace(/\s+/g, "");
          if (key) window.toggleSublevels(key);
        });
        el.setAttribute("tabindex", "0");
        el.addEventListener("keypress", (e) => { if (e.key === "Enter") el.click(); });
      });

      $$(".sublevel-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = btn.dataset.target || btn.getAttribute("data-target") || btn.textContent.trim().toLowerCase().replace(/\s+/g, "-");
          // prefer explicit attribute 'data-target'; fallback to composed id
          const id = btn.dataset.plan || target;
          // try to map to element ids used in HTML (e.g., 'fatloss-beginner')
          if (id) window.showPlan(id);
        });
      });
    })();

    /* ------------------------------
       6. Back to Top (debounced scroll)
    ------------------------------ */
    (function backToTop() {
      const btn = document.querySelector(".back-to-top");
      if (!btn) return;
      const onScroll = debounce(() => {
        btn.classList.toggle("show", window.scrollY > 300);
      }, 80);
      window.addEventListener("scroll", onScroll);
      btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    })();

    /* ------------------------------
       7. IntersectionObserver for .fade-in
    ------------------------------ */
    (function fadeInObserver() {
      const faders = $$(".fade-in");
      if (!faders.length) return;
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("appear");
              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.28, rootMargin: "0px 0px -50px 0px" }
        );
        faders.forEach((f) => io.observe(f));
      } else {
        faders.forEach((f) => f.classList.add("appear"));
      }
    })();

    /* ------------------------------
       8. Tools Page — FITNESS CALCULATOR (FORMULAS PRESERVED)
       - This block is intentionally left with the original formulas and flow.
       - UX improvements: inline field focus + small validation behavior,
         but math is unchanged.
    ------------------------------ */
    (function toolsCalculator() {
      const fitnessForm = document.getElementById("fitness-form");
      const resultsBox = document.querySelector(".results");
      if (!fitnessForm || !resultsBox) return;

      // enhance UX: focus styling is handled by CSS; show placeholders for results
      fitnessForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.target;

        // Inputs (unchanged formulas)
        const age = parseInt(form.age?.value);
        const gender = form.gender?.value;
        const activity = parseFloat(form.activity?.value);
        const goal = form.goal?.value;
        const weight = parseFloat(form.weightKg?.value || form.weight?.value);

        // Height
        const feet = parseFloat(form.heightFt?.value) || 0;
        const inches = parseFloat(form.heightIn?.value) || 0;
        let height = feet || inches ? feet * 30.48 + inches * 2.54 : parseFloat(form.heightCm?.value);

        if ([age, height, weight, activity].some((v) => isNaN(v)) || !gender || !goal) {
          alert("⚠ Please fill in all fields correctly.");
          return;
        }

        // BMR (original formulas preserved)
        const bmr =
          gender === "male"
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;

        // TDEE & Goal
        const tdee = bmr * activity;
        let calories = tdee;
        if (goal === "gain") calories += 300;
        if (goal === "lose") calories -= 300;

        // BMI
        const bmi = weight / Math.pow(height / 100, 2);
        let bmiCategory = "";
        let bmiClass = "";
        if (bmi < 18.5) {
          bmiCategory = "Underweight";
          bmiClass = "bmi-warning";
        } else if (bmi < 25) {
          bmiCategory = "Normal weight";
          bmiClass = "bmi-normal";
        } else if (bmi < 30) {
          bmiCategory = "Overweight";
          bmiClass = "bmi-warning";
        } else {
          bmiCategory = "Obese";
          bmiClass = "bmi-danger";
        }

        // Water Intake
        const water = (weight * 40) / 1000;

        // Macronutrients
        const protein = Math.round(weight * 1.7);
        const proteinCalories = protein * 4;
        const remainingCalories = calories - proteinCalories;
        const carbs = Math.round((remainingCalories * 0.6) / 4);
        const fats = Math.round((remainingCalories * 0.4) / 9);

        // Update Results Helper (small animation)
        const updateResult = (id, value, cssClass = null) => {
          const el = document.getElementById(id);
          if (el) {
            el.textContent = value;
            el.className = "";
            if (cssClass) el.classList.add(cssClass);
            el.classList.add("highlight");
            setTimeout(() => el.classList.remove("highlight"), 800);
          }
        };

        // Apply updates (IDs must match your HTML)
        updateResult("bmr", Math.round(bmr));
        updateResult("bmi", bmi.toFixed(1));
        updateResult("bmi-category", bmiCategory, bmiClass);
        updateResult("tdee", Math.round(tdee));
        updateResult("water", water.toFixed(2));
        updateResult("protein", protein);
        updateResult("carbs", carbs);
        updateResult("fats", fats);

        resultsBox.classList.add("show");
        resultsBox.scrollIntoView({ behavior: "smooth" });
      });
    })();

    /* ------------------------------
       9. Media auto-scaling helper
    ------------------------------ */
    (function mediaScaling() {
      document.querySelectorAll(".media-container img, .media-container video").forEach((media) => {
        media.style.width = "100%";
        media.style.height = "auto";
      });
    })();

    /* ------------------------------
       10. DARK MODE TOGGLE (persistent, non-intrusive)
       - If there is a .dark-toggle button in your header, it will be used.
       - Otherwise we inject a small toggle button into .header-inner
    ------------------------------ */
    (function darkModeToggle() {
      const root = document.documentElement;
      const storageKey = "fitstance-theme";
      const saved = localStorage.getItem(storageKey);

      // Apply saved theme on load
      if (saved === "dark") root.setAttribute("data-theme", "dark");
      if (saved === "light") root.removeAttribute("data-theme");

      const createToggle = () => {
        const btn = document.createElement("button");
        btn.className = "dark-toggle btn secondary";
        btn.type = "button";
        btn.setAttribute("aria-label", "Toggle dark mode");
        btn.innerHTML = '<span class="moon">🌙</span><span class="sun" style="display:none">☀️</span>';
        return btn;
      };

      const headerInner = document.querySelector(".header-inner");
      let toggle = document.querySelector(".dark-toggle");
      if (!toggle && headerInner) {
        toggle = createToggle();
        // insert before nav or at end of header
        const nav = document.querySelector(".nav");
        if (nav) headerInner.insertBefore(toggle, nav);
        else headerInner.appendChild(toggle);
      }

      if (!toggle) return;

      // Reflect current state
      const setUi = () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        toggle.setAttribute("aria-pressed", String(isDark));
        toggle.querySelector(".moon").style.display = isDark ? "none" : "inline";
        toggle.querySelector(".sun").style.display = isDark ? "inline" : "none";
      };
      setUi();

      toggle.addEventListener("click", () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        if (isDark) {
          root.removeAttribute("data-theme");
          localStorage.setItem(storageKey, "light");
        } else {
          root.setAttribute("data-theme", "dark");
          localStorage.setItem(storageKey, "dark");
        }
        setUi();
      });
    })();

    /* ------------------------------
       11. Small accessibility helpers
    ------------------------------ */
    (function a11yHelpers() {
      // Add role & labels for back-to-top
      const b2t = document.querySelector(".back-to-top");
      if (b2t) {
        b2t.setAttribute("role", "button");
        b2t.setAttribute("aria-label", "Back to top");
        b2t.tabIndex = 0;
        b2t.addEventListener("keypress", (e) => {
          if (e.key === "Enter") b2t.click();
        });
      }
    })();

    /* ------------------------------
       12. Finished
    ------------------------------ */
    log("ready ✅");
  }); // DOMContentLoaded end
})();
