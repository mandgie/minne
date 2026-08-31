/* Minne — the demo stage.
 *
 * One mechanism, four apps. Each scene is a drawn replica of an app — Slack,
 * Gmail, X, Notion — already in the markup with its finished text in the
 * field; this file empties it, then plays the story: the caret waiting, the
 * key going down, Minne's panel appearing and thinking, the draft streaming
 * in, Insert, and the words landing in the field. Then it moves to the next
 * app.
 *
 * Without this file the page still reads: every scene shows its finished
 * state. With prefers-reduced-motion the same is true, and the tabs simply
 * switch between them.
 */
(function () {
  "use strict";

  var stage = document.getElementById("stage");
  if (!stage) return;

  var scenes = [].slice.call(stage.querySelectorAll(".scene"));

  /* The finished text ships in the markup, so the page reads without this
     file at all. Take a copy, then let the story put it back. */
  scenes.forEach(function (scene) {
    var field = scene.querySelector(".composer__text");
    scene.draft = field ? field.textContent.trim() : "";
  });
  var tabs = [].slice.call(document.querySelectorAll(".tab"));
  var overlay = document.getElementById("overlay");
  var keycap = document.getElementById("keycap");
  var hudSay = document.getElementById("hudSay");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var status = overlay.querySelector(".key__status");
  var draftText = overlay.querySelector(".key__text");
  var context = overlay.querySelector(".key__ctx");
  var ground = overlay.querySelector(".key__ground");

  /* What each moment says underneath. */
  var SAYS = [
    "Minne read the thread, remembered that the dinner moved, and answered the way you write.",
    "It knew where the retry work stands, so the reply says something instead of asking for a time.",
    "A public reply with the facts in it — what you actually decided, not a confident guess.",
    "An instruction, not a prompt: three weeks of work became the note you needed."
  ];

  var timers = [];
  function at(ms, fn) {
    timers.push(setTimeout(fn, ms));
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* Fills an element one character at a time, and reports when it is done. */
  function type(el, text, speed, done) {
    var i = 0;
    el.textContent = "";
    (function step() {
      i = Math.min(text.length, i + 1 + Math.floor(Math.random() * 3));
      el.textContent = text.slice(0, i);
      if (i < text.length) timers.push(setTimeout(step, speed));
      else if (done) timers.push(setTimeout(done, 40));
    })();
  }

  /* Every transient state a scene can be in, so switching never leaves one
     behind. `is-on` is not in the list: that is which scene is showing. */
  var STATES = ["is-caret", "is-landing", "is-fading", "has-text"];
  function clearStates(scene) {
    STATES.forEach(function (name) {
      scene.classList.remove(name);
    });
  }

  function reset(scene) {
    stage.className = "stage";
    clearStates(scene);
    overlay.hidden = false;
    draftText.textContent = "";
    var field = scene.querySelector(".composer__text");
    if (field) field.textContent = "";
  }

  /* The finished state, which is also what a visitor without JavaScript
     (or with reduced motion) sees. */
  function settle(scene) {
    var field = scene.querySelector(".composer__text");
    if (field) {
      field.textContent = scene.draft || "";
      scene.classList.add("has-text");
    }
  }

  function show(index, animate) {
    clearTimers();
    scenes.forEach(function (s, i) {
      s.hidden = i !== index;
      s.classList.toggle("is-on", i === index);
      if (i !== index) clearStates(s);
    });
    tabs.forEach(function (t, i) {
      t.classList.toggle("is-on", i === index);
      t.setAttribute("aria-selected", i === index ? "true" : "false");
      t.tabIndex = i === index ? 0 : -1;
    });
    var scene = scenes[index];
    hudSay.textContent = SAYS[index] || "";
    stage.dataset.app = scene.dataset.app || "";
    context.textContent = scene.dataset.app || "";
    ground.textContent = scene.dataset.ground || "";
    scene.classList.add("is-fading");

    if (!animate) {
      settle(scene);
      return;
    }
    reset(scene);
    scene.classList.add("is-fading");
    play(index, scene);
  }

  /* ── the story ────────────────────────────────────────────────────── */

  var runMs = 15000;

  function play(index, scene) {
    var instruction = scene.dataset.instruction;
    var draft = scene.draft || "";
    var field = scene.querySelector(".composer__text");
    var t = 520;

    status.textContent = scene.dataset.think || "Checking your memory…";

    // An instruction the person types themselves, before the key.
    if (instruction) {
      scene.classList.add("is-caret", "has-text");
      at(t, function () {
        type(field, instruction, 42);
      });
      t += 1350;
    } else {
      // Long enough to read the message before the key goes down.
      scene.classList.add("is-caret");
      t += 1300;
    }

    // The key goes down.
    at(t, function () {
      keycap.classList.add("is-down");
    });
    at(t + 170, function () {
      keycap.classList.remove("is-down");
      scene.classList.remove("is-caret");
    });
    t += 420;

    // Minne wakes up at the caret and thinks.
    at(t, function () {
      stage.classList.add("is-open", "is-thinking");
    });
    t += 1500;

    // The draft streams in.
    at(t, function () {
      stage.classList.remove("is-thinking");
      stage.classList.add("is-writing");
      status.textContent = "Drafting…";
      type(draftText, draft, 13);
    });
    t += Math.min(3000, 700 + draft.length * 18);

    // Ready, then Insert.
    at(t, function () {
      stage.classList.remove("is-writing");
      stage.classList.add("is-ready");
      status.textContent = "Draft ready";
    });
    t += 1250;
    at(t, function () {
      stage.classList.add("is-inserting");
    });
    t += 420;

    // The words land in the field and Minne gets out of the way.
    at(t, function () {
      stage.classList.remove("is-open", "is-inserting", "is-ready");
      scene.classList.add("is-landing", "has-text");
      if (instruction) field.textContent = "";
      type(field, draft, 9, function () {
        scene.classList.remove("is-landing");
      });
    });
    runMs = t + 3400;
  }

  /* ── switching between apps ───────────────────────────────────────── */

  var current = 0;
  var running = false;
  var advance = 0;

  function go(index) {
    current = (index + scenes.length) % scenes.length;
    show(current, !reduce && running);
    clearTimeout(advance);
    if (reduce || !running) return;
    // The tab's underline is the clock; keep them to the same number.
    tabs[current].style.setProperty("--run", runMs + "ms");
    tabs[current].querySelector(".tab__bar").style.animation = "none";
    void tabs[current].offsetWidth;
    tabs[current].querySelector(".tab__bar").style.animation = "";
    advance = setTimeout(function () {
      go(current + 1);
    }, runMs);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      go(i);
    });
    tab.addEventListener("keydown", function (event) {
      var next = event.key === "ArrowRight" ? i + 1 : event.key === "ArrowLeft" ? i - 1 : null;
      if (next === null) return;
      event.preventDefault();
      var target = (next + tabs.length) % tabs.length;
      tabs[target].focus();
      go(target);
    });
  });

  if (reduce) {
    scenes.forEach(function (s, i) {
      s.hidden = i !== 0;
      settle(s);
    });
    show(0, false);
    return;
  }

  // Play only while the stage is on screen.
  show(0, false);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !running) {
            running = true;
            go(current);
          } else if (!entry.isIntersecting && running) {
            running = false;
            clearTimers();
            clearTimeout(advance);
          }
        });
      },
      { threshold: 0.3 }
    ).observe(stage);
  } else {
    running = true;
    go(0);
  }
})();
