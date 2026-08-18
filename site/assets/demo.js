/* Minne — the demo stage.
 *
 * One mechanism, four moments. Each scene is already in the markup with its
 * finished text in a data attribute; this file empties it, then plays the
 * story: the caret waiting, the key going down, Minne's panel appearing and
 * thinking, the draft streaming in, Insert, and the words landing in the
 * field. Then it moves to the next moment.
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
    var ask = scene.querySelector(".chat__ask");
    scene.draft = field ? field.textContent.trim() : "";
    scene.question = ask ? ask.textContent.trim() : "";
  });
  var tabs = [].slice.call(document.querySelectorAll(".tab"));
  var overlay = document.getElementById("overlay");
  var keycap = document.getElementById("keycap");
  var hudSay = document.getElementById("hudSay");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var status = overlay.querySelector(".key__status");
  var draftText = overlay.querySelector(".key__text");
  var context = overlay.querySelector(".key__ctx");
  var keycapKey = keycap.querySelector(".keycap__key");
  var keycapLabel = keycap.querySelector(".keycap__label");

  /* What each moment says underneath, and how long it runs. */
  var SAYS = [
    "Minne read the thread, remembered what you promised Ingrid, and wrote it the way you write.",
    "It knew where that work stands, so the reply says something instead of asking for a time.",
    "An instruction, not a prompt: it turned three weeks of work into the note you needed.",
    "Or skip the writing and just ask. No scrolling back, no “what did we decide?”."
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
  var STATES = ["is-caret", "is-landing", "is-searching", "is-answered", "is-fading", "has-text"];
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
    var ask = scene.querySelector(".chat__ask");
    if (ask) ask.textContent = "";
  }

  /* The finished state, which is also what a visitor without JavaScript
     (or with reduced motion) sees. */
  function settle(scene) {
    var field = scene.querySelector(".composer__text");
    if (field) {
      field.textContent = scene.draft || "";
      scene.classList.add("has-text");
    }
    var ask = scene.querySelector(".chat__ask");
    if (ask) {
      ask.textContent = scene.question || "";
      scene.classList.add("is-answered");
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
    keycapKey.textContent = scene.dataset.key || "⌥";
    keycapLabel.textContent = scene.dataset.keylabel || "right Option";
    context.textContent = scene.querySelector(".win__title").textContent;
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
    var chat = scene.classList.contains("scene--chat");
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
    } else if (!chat) {
      scene.classList.add("is-caret");
      t += 500;
    } else {
      t += 300;
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

    if (chat) {
      var ask = scene.querySelector(".chat__ask");
      at(t, function () {
        type(ask, scene.question || "", 26);
      });
      t += 1500;
      at(t, function () {
        scene.classList.add("is-searching");
        scene.querySelector(".chat__toolText").textContent = "Looking through your memory…";
      });
      t += 1700;
      at(t, function () {
        scene.classList.add("is-answered");
        scene.querySelector(".chat__toolText").textContent = "Looked through your memory";
      });
      runMs = t + 4200;
      return;
    }

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
      status.textContent = "Draft ready";
    });
    t += 1050;
    at(t, function () {
      stage.classList.add("is-inserting");
    });
    t += 420;

    // The words land in the field and Minne gets out of the way.
    at(t, function () {
      stage.classList.remove("is-open", "is-inserting");
      scene.classList.add("is-landing", "has-text");
      if (instruction) field.textContent = "";
      type(field, draft, 9, function () {
        scene.classList.remove("is-landing");
      });
    });
    runMs = t + 3200;
  }

  /* ── switching between moments ────────────────────────────────────── */

  var current = 0;
  var running = false;
  var advance = 0;

  function go(index, fromClick) {
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
    if (fromClick) return;
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      go(i, true);
    });
    tab.addEventListener("keydown", function (event) {
      var next = event.key === "ArrowRight" ? i + 1 : event.key === "ArrowLeft" ? i - 1 : null;
      if (next === null) return;
      event.preventDefault();
      var target = (next + tabs.length) % tabs.length;
      tabs[target].focus();
      go(target, true);
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
