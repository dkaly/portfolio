function buildMedia(media) {
  const wrap = document.createElement("div");
  wrap.className = "node-media";
  const src = media.src;
  if (!src) return wrap;

  if (/\.gif($|\?)/i.test(src)) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = media.alt || "";
    img.loading = "lazy";
    wrap.append(img);
    return wrap;
  }

  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";
  video.setAttribute("muted", "");
  if (media.poster) video.poster = media.poster;
  video.src = src;
  wrap.append(video);

  const watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) video.play().catch(function () {});
      else video.pause();
    });
  }, { rootMargin: "160px" });
  watcher.observe(wrap);
  return wrap;
}

function externalLink(href) {
  return /^https?:/i.test(href);
}

function renderPortfolio() {
  const data = window.PORTFOLIO;
  const page = document.getElementById("page");
  document.title = data.name + " — Software engineering";

  const header = document.createElement("header");
  header.className = "hero";

  const copy = document.createElement("div");
  copy.className = "hero-copy";

  const name = document.createElement("h1");
  name.className = "name";
  name.textContent = data.name;

  const headline = document.createElement("p");
  headline.className = "headline";
  headline.textContent = data.headline;

  const lede = document.createElement("p");
  lede.className = "lede";
  lede.textContent = data.lede;

  copy.append(name, headline, lede);

  const stage = document.createElement("div");
  stage.className = "hero-art";
  const owl = document.createElement("canvas");
  owl.className = "owl";
  owl.setAttribute("role", "img");
  owl.setAttribute("aria-label", "Colored ASCII portrait of a barn owl");
  stage.append(owl);
  header.append(copy, stage);

  const links = (data.links || []).filter(function (link) { return link && link.href; });
  if (links.length) {
    const list = document.createElement("ul");
    list.className = "links";
    links.forEach(function (link) {
      const item = document.createElement("li");
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (externalLink(link.href)) {
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
      }
      item.append(anchor);
      list.append(item);
    });
    copy.append(list);
  }

  const main = document.createElement("main");
  main.id = "timeline";

  (data.groups || []).forEach(function (group) {
    const section = document.createElement("section");
    section.className = "group";
    section.id = group.id;

    const heading = document.createElement("h2");
    heading.textContent = group.label;

    const list = document.createElement("ol");
    list.className = "nodes";

    (group.nodes || []).forEach(function (node) {
      const item = document.createElement("li");
      item.className = "node";

      const title = document.createElement("h3");
      title.textContent = node.title;

      const summary = document.createElement("p");
      summary.textContent = node.summary;

      if (node.date) {
        const time = document.createElement("time");
        time.textContent = node.date;
        item.append(time);
      }
      item.append(title, summary);

      if (node.stack) {
        const stack = document.createElement("p");
        stack.className = "stack";
        stack.textContent = node.stack;
        item.append(stack);
      }

      if (node.href) {
        const anchor = document.createElement("a");
        anchor.href = node.href;
        anchor.textContent = "View project";
        if (externalLink(node.href)) {
          anchor.target = "_blank";
          anchor.rel = "noreferrer";
        }
        item.append(anchor);
      }

      if (node.media && node.media.src) item.append(buildMedia(node.media));
      list.append(item);
    });

    section.append(heading, list);
    main.append(section);
  });

  const footer = document.createElement("footer");
  footer.className = "footer";
  const swan = document.createElement("canvas");
  swan.id = "swan";
  swan.setAttribute("role", "img");
  swan.setAttribute("aria-label", "A swan swimming");
  footer.append(swan);

  page.append(header, main, footer);
  window.mountOwl(owl, "owl1.jpg");
  window.mountButterflies(document.getElementById("butterflies"));
  window.mountSwan(swan, footer);
  markReading();
  window.addEventListener("scroll", markReading, { passive: true });
}

function markReading() {
  const nodes = document.querySelectorAll(".node");
  const vh = window.innerHeight || 1;
  let current = null;
  let best = Infinity;
  nodes.forEach(function (node) {
    const rect = node.getBoundingClientRect();
    const dist = Math.abs(rect.top + rect.height / 2 - vh * 0.42);
    if (dist < best) {
      best = dist;
      current = node;
    }
  });
  nodes.forEach(function (node) {
    node.classList.toggle("is-current", node === current && best < vh * 0.45);
  });
}

renderPortfolio();
