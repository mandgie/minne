/* Minne — the app replicas act out what they do.
 *
 * Two timelines: the Minne key drafting a reply, and the chat answering a
 * question. Both are plain DOM; this file only sets a `data-state` on the
 * figure and streams text into elements that are already in the markup. A
 * replica runs while it is on screen and stops when it is not, and under
 * prefers-reduced-motion it simply holds its finished state. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Types the text that is already in `root`, tag by tag: every text node is
   * emptied, then refilled a few characters at a time, and the block it lives
   * in stays hidden until its first character lands. Returns a stop handle. */
  function stream(root, speed, done) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var parts = [];
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      parts.push({ node: node, text: node.nodeValue, block: blockOf(node, root) });
      node.nodeValue = "";
    }
    parts.forEach(function (p) {
      if (p.block) p.block.style.visibility = "hidden";
    });

    var index = 0;
    var written = 0;
    var timer = 0;

    function tick() {
      if (index >= parts.length) {
        if (done) done();
        return;
      }
      var part = parts[index];
      if (part.block) part.block.style.visibility = "";
      written += 2 + Math.floor(Math.random() * 3);
      part.node.nodeValue = part.text.slice(0, written);
      if (written >= part.text.length) {
        index += 1;
        written = 0;
      }
      timer = setTimeout(tick, speed);
    }
    timer = setTimeout(tick, speed);

    return function stop(fill) {
      clearTimeout(timer);
      parts.forEach(function (p) {
        if (p.block) p.block.style.visibility = "";
        p.node.nodeValue = fill ? p.text : "";
      });
    };
  }

  function blockOf(textNode, root) {
    var el = textNode.parentNode;
    while (el && el !== root && getComputedStyle(el).display === "inline") el = el.parentNode;
    return el === root ? null : el;
  }

  /* A timeline is a list of [state, milliseconds, onEnter?] steps that loops. */
  function timeline(figure, steps) {
    var step = 0;
    var timer = 0;
    var teardown = null;
    var running = false;

    function enter() {
      var current = steps[step % steps.length];
      figure.dataset.state = current[0];
      if (teardown) teardown = (teardown(true), null);
      if (current[2]) teardown = current[2]() || null;
      timer = setTimeout(function () {
        step += 1;
        enter();
      }, current[1]);
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        enter();
      },
      stop: function () {
        running = false;
        clearTimeout(timer);
        if (teardown) teardown = (teardown(true), null);
      },
      rest: function (state) {
        figure.dataset.state = state;
      },
    };
  }

  function whenVisible(el, player) {
    if (!("IntersectionObserver" in window)) {
      player.start();
      return;
    }
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) player.start();
          else player.stop();
        });
      },
      { threshold: 0.25 }
    ).observe(el);
  }

  /* ── the Minne key ─────────────────────────────────────────────────── */

  var keyFigure = document.querySelector('[data-ui="key"]');
  if (keyFigure) {
    var draft = keyFigure.querySelector(".key__text");
    var status = keyFigure.querySelector(".key__status");
    var draftText = draft.textContent;

    if (reduce) {
      keyFigure.dataset.state = "ready";
      status.textContent = "Draft ready";
    } else {
      var keyPlayer = timeline(keyFigure, [
        [
          "thinking",
          2600,
          function () {
            status.textContent = "Drafting a reply…";
            draft.textContent = draftText;
          },
        ],
        [
          "writing",
          2900,
          function () {
            status.textContent = "Drafting a reply…";
            return stream(draft, 34);
          },
        ],
        [
          "ready",
          4200,
          function () {
            status.textContent = "Draft ready";
            draft.textContent = draftText;
          },
        ],
        [
          "inserted",
          2400,
          function () {
            status.textContent = "Inserted — ⌘Z puts it back";
          },
        ],
      ]);
      whenVisible(keyFigure, keyPlayer);
    }
  }

  /* ── the chat panel ────────────────────────────────────────────────── */

  var chatFigure = document.querySelector('[data-ui="chat"]');
  if (chatFigure) {
    var answer = chatFigure.querySelector(".chat__answer");
    var subject = chatFigure.querySelector(".chat__subject");
    var toolText = chatFigure.querySelector(".chat__toolText");
    var question = chatFigure.querySelector(".chat__bubble").textContent;

    if (reduce) {
      chatFigure.dataset.state = "hold";
      subject.textContent = question;
      toolText.textContent = "Searched memory for “yesterday”";
    } else {
      var chatPlayer = timeline(chatFigure, [
        [
          "empty",
          2200,
          function () {
            subject.textContent = "New chat";
          },
        ],
        [
          "asked",
          900,
          function () {
            subject.textContent = question;
          },
        ],
        [
          "searching",
          1600,
          function () {
            toolText.textContent = "Searching your memory…";
          },
        ],
        [
          "answer",
          5200,
          function () {
            toolText.textContent = "Searched memory for “yesterday”";
            return stream(answer, 22);
          },
        ],
        ["hold", 4200, null],
      ]);
      whenVisible(chatFigure, chatPlayer);
    }
  }
})();
