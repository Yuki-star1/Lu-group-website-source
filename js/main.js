/* 移动端导航开关 */
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  /* 论文摘要展开/收起 */
  var toggles = document.querySelectorAll(".abs-toggle");
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var abs = document.getElementById(btn.getAttribute("data-target"));
      if (abs) {
        var hidden = abs.classList.toggle("hidden");
        btn.textContent = hidden ? "Show abstract" : "Hide abstract";
      }
    });
  });

  /* 自动生成成员头像首字母 */
  document.querySelectorAll(".avatar[data-name]").forEach(function (el) {
    var name = el.getAttribute("data-name") || "";
    el.textContent = name.charAt(0).toUpperCase();
  });
});
/* 首页滚动图片放映：自动播放 + 左右箭头 + 圆点 + 触摸滑动 */
function initCarousel() {
  var carousel = document.getElementById("carousel");
  if (!carousel) return;
  var slides = carousel.querySelectorAll(".carousel-slide");
  var dotsWrap = carousel.querySelector(".carousel-dots");
  var index = 0, timer = null, interval = 5000;

  slides.forEach(function (_, i) {
    var dot = document.createElement("button");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", function () { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
  });
  var dots = dotsWrap.children;

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle("active", k === index); });
    for (var k = 0; k < dots.length; k++) dots[k].classList.toggle("active", k === index);
  }
  function next() { goTo(index + 1); }
  function restart() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, interval);
  }

  carousel.querySelector(".prev").addEventListener("click", function () { goTo(index - 1); restart(); });
  carousel.querySelector(".next").addEventListener("click", function () { goTo(index + 1); restart(); });
  carousel.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
  carousel.addEventListener("mouseleave", restart);

  var startX = null;
  carousel.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : goTo(index - 1); restart(); }
    startX = null;
  }, { passive: true });

  goTo(0);
  restart();
}
document.addEventListener("DOMContentLoaded", initCarousel);
/* Scroll-reveal animation: fade-up as elements enter the viewport */
document.addEventListener("DOMContentLoaded", function () {
  var body = document.body;
  if (!body) return;
  body.classList.add("anim-ready");

  var selector = [
    ".card", ".news-item", ".pub-item", ".member-card", ".dir-block",
    ".section-title", ".highlight-bar", ".page-head", ".prose",
    ".contact-card", ".group-label"
  ].join(", ");
  var els = body.querySelectorAll(selector);
  if (!els.length) return;

  /* Stagger reveal for siblings in the same container */
  var perParent = new Map();
  els.forEach(function (el) {
    el.classList.add("reveal");
    var parent = el.parentNode;
    var n = perParent.get(parent) || 0;
    perParent.set(parent, n + 1);
    if (n > 0) el.style.transitionDelay = Math.min(n * 90, 450) + "ms";
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("in-view"); });
  }
});

/* Research accordion: clicking a direction expands its details
   and collapses the others (accordion behavior) */
document.addEventListener("DOMContentLoaded", function () {
  var accordion = document.getElementById("dirAccordion");
  if (!accordion) return;
  var heads = accordion.querySelectorAll(".dir-head");

  heads.forEach(function (head) {
    head.addEventListener("click", function () {
      var block = head.closest(".dir-block");
      var wasOpen = block.classList.contains("open");

      accordion.querySelectorAll(".dir-block.open").forEach(function (b) {
        b.classList.remove("open");
        var h = b.querySelector(".dir-head");
        if (h) h.setAttribute("aria-expanded", "false");
      });

      if (!wasOpen) {
        block.classList.add("open");
        head.setAttribute("aria-expanded", "true");
      }
    });
  });
});

/* Deep-link support: #dir-N expands that research direction and scrolls to it
   (used when clicking a research card on the home page) */
function openResearchFromHash() {
  var accordion = document.getElementById("dirAccordion");
  if (!accordion) return;
  var m = (window.location.hash || "").match(/^#dir-(\d+)$/);
  if (!m) return;
  var block = document.getElementById("dir-" + m[1]);
  if (!block || !accordion.contains(block)) return;

  accordion.querySelectorAll(".dir-block.open").forEach(function (b) {
    b.classList.remove("open");
    var h = b.querySelector(".dir-head");
    if (h) h.setAttribute("aria-expanded", "false");
  });
  block.classList.add("open");
  var head = block.querySelector(".dir-head");
  if (head) head.setAttribute("aria-expanded", "true");

  setTimeout(function () {
    block.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}
document.addEventListener("DOMContentLoaded", openResearchFromHash);
window.addEventListener("hashchange", openResearchFromHash);



/* Publications: year filter (top) + pagination (bottom) */
document.addEventListener("DOMContentLoaded", function () {
  var filterWrap = document.getElementById("pubYearFilter");
  var pager = document.getElementById("pubPagination");
  if (!pager) return;

  var allItems = Array.prototype.slice.call(document.querySelectorAll(".pub-item[data-year]"));
  var pageSize = 4;
  var filter = "all";
  var current = 1;
  var emptyMsg = document.getElementById("pubEmpty");
  var beforeYear = 2020; // years before this are grouped into the "Before" filter

  function yearList() {
    var set = {};
    allItems.forEach(function (it) {
      var y = it.getAttribute("data-year");
      if (y) set[y] = true;
    });
    return Object.keys(set).map(Number).sort(function (a, b) { return b - a; });
  }

  function matches(item) {
    var y = item.getAttribute("data-year");
    if (filter === "all") return true;
    if (filter === "before") return Number(y) < beforeYear;
    return y === filter;
  }

  function filteredItems() {
    return allItems.filter(matches);
  }

  function buildButton(label, cls, disabled) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className = cls || "page-num";
    btn.disabled = !!disabled;
    return btn;
  }

  function renderFilter() {
    if (!filterWrap) return;
    filterWrap.innerHTML = "";
    var years = yearList();
    var specs = [{ v: "all", label: "All" }];
    years.forEach(function (y) { if (y >= beforeYear) specs.push({ v: String(y), label: String(y) }); });
    if (years.length) specs.push({ v: "before", label: "Before " + beforeYear });

    specs.forEach(function (s) {
      var btn = buildButton(s.label, "yr-btn" + (filter === s.v ? " active" : ""));
      btn.addEventListener("click", function () {
        if (filter === s.v) return;
        filter = s.v;
        current = 1;
        renderFilter();
        render();
      });
      filterWrap.appendChild(btn);
    });
  }

  function render() {
    var list = filteredItems();
    var pageCount = Math.max(1, Math.ceil(list.length / pageSize));
    if (current > pageCount) current = pageCount;

    allItems.forEach(function (item) {
      var idx = list.indexOf(item);
      var inPage = idx !== -1 && Math.floor(idx / pageSize) + 1 === current;
      item.classList.toggle("hidden", !inPage);
      if (inPage) item.classList.add("in-view");
    });

    if (emptyMsg) emptyMsg.classList.toggle("hidden", list.length > 0);

    pager.innerHTML = "";
    var prev = buildButton("\u2039 Prev", "page-nav", current === 1);
    prev.addEventListener("click", function () { goTo(current - 1); });
    pager.appendChild(prev);

    for (var p = 1; p <= pageCount; p++) {
      (function (page) {
        var numBtn = buildButton(String(page), "page-num" + (page === current ? " active" : ""));
        numBtn.addEventListener("click", function () { goTo(page); });
        pager.appendChild(numBtn);
      })(p);
    }

    var next = buildButton("Next \u203A", "page-nav", current === pageCount);
    next.addEventListener("click", function () { goTo(current + 1); });
    pager.appendChild(next);
  }

  function goTo(page) {
    var pageCount = Math.max(1, Math.ceil(filteredItems().length / pageSize));
    if (page < 1 || page > pageCount) return;
    current = page;
    render();
  }

  function openPubFromHash() {
    var m = (window.location.hash || "").match(/^#pub-([\w-]+)$/);
    if (!m) return;
    var target = document.getElementById("pub-" + m[1]);
    if (!target || !target.classList.contains("pub-item")) return;

    var y = target.getAttribute("data-year");
    if (y) filter = Number(y) < beforeYear ? "before" : y;

    var list = filteredItems();
    var idx = list.indexOf(target);
    if (idx === -1) return;

    current = Math.floor(idx / pageSize) + 1;
    renderFilter();
    render();

    setTimeout(function () {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.classList.add("pub-flash");
      setTimeout(function () {
        target.classList.remove("pub-flash");
      }, 2200);
    }, 80);
  }

  renderFilter();
  render();

  openPubFromHash();
  window.addEventListener("hashchange", openPubFromHash);
});
