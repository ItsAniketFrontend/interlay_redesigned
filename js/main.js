/* =========================================================
   INTERLAY — Main JS
   GSAP + Lenis + Custom Cursor + Loader + Scroll animations
   ========================================================= */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ---------- Helper: split text into lines/words ---------- */
function splitWords(el) {
  // Words wrapped manually in HTML (.line > .word). Returns words for animation.
  return el.querySelectorAll('.word');
}

function splitTextLines(el) {
  // Wrap each word/line for masking. We split by manual <br> if present, else by line via clone.
  const text = el.innerHTML;
  // Already prepared with .line/.word? skip.
  if (el.querySelector('.line')) return;

  // Wrap nodes: split by <br> first.
  const segments = text.split(/<br\s*\/?>/i);
  el.innerHTML = segments
    .map(seg => `<span class="line"><span class="line-inner">${seg.trim()}</span></span>`)
    .join('');
}

/* =========================================================
   PAGE LOADER
   ========================================================= */
function runLoader() {
  return new Promise((resolve) => {
    const counterEl = document.getElementById('loaderCount');
    const barEl = document.querySelector('.loader__bar span');
    const brand = document.querySelector('.loader__brand-text');
    const curtain = document.querySelector('.loader__curtain');
    const loader = document.getElementById('loader');

    // brand reveal
    gsap.to(brand, { y: '0%', duration: 1.1, ease: 'expo.out', delay: 0.1 });

    // count up + bar
    const obj = { val: 0 };
    gsap.to(obj, {
      val: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        const v = Math.round(obj.val);
        counterEl.textContent = v;
        barEl.style.width = v + '%';
      },
      onComplete: () => {
        const tl = gsap.timeline({
          onComplete: () => {
            loader.style.display = 'none';
            document.body.classList.add('is-loaded');
            resolve();
          }
        });
        tl.to('.loader__inner', { y: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
          .to(curtain, { y: '0%', duration: 1, ease: 'power4.inOut' }, '-=0.3')
          .to(loader, { opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
    });
  });
}

/* =========================================================
   CUSTOM CURSOR
   ========================================================= */
function initCursor() {
  if (window.matchMedia('(max-width: 992px)').matches) return;

  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');

  const cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const dotPos = { x: cursorPos.x, y: cursorPos.y };
  const target = { x: cursorPos.x, y: cursorPos.y };

  // show cursor immediately at viewport centre — user shouldn't have to wiggle
  // their mouse to find it
  gsap.to([cursor, dot], { opacity: 1, duration: 0.4, delay: 0.05 });

  window.addEventListener('mousemove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
  });

  // hide when mouse leaves the window, reappear when it returns
  document.addEventListener('mouseleave', () => {
    gsap.to([cursor, dot], { opacity: 0, duration: 0.25 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to([cursor, dot], { opacity: 1, duration: 0.25 });
  });

  gsap.ticker.add(() => {
    // smooth follow
    cursorPos.x += (target.x - cursorPos.x) * 0.18;
    cursorPos.y += (target.y - cursorPos.y) * 0.18;
    dotPos.x += (target.x - dotPos.x) * 0.6;
    dotPos.y += (target.y - dotPos.y) * 0.6;

    cursor.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px) translate(-50%, -50%)`;
    dot.style.transform = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%, -50%)`;
  });

  // Hover variants — use event delegation so dynamically-added elements
  // (e.g. work-index rows built by initWorkPage) work without re-binding.
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (!t) return;
    const variant = t.getAttribute('data-cursor');
    cursor.classList.remove('is-active', 'is-view');
    if (variant === 'hover') cursor.classList.add('is-active');
    else if (variant === 'view') cursor.classList.add('is-view');
  });

  document.addEventListener('mouseout', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (!t) return;
    // only clear when leaving toward something that ISN'T also data-cursor
    const next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-cursor]');
    if (!next) cursor.classList.remove('is-active', 'is-view');
  });
}

/* =========================================================
   LENIS SMOOTH SCROLL + GSAP SYNC
   ========================================================= */
function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 1.5,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

  // anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4, offset: -20 });
    });
  });

  return lenis;
}

/* =========================================================
   NAVBAR
   ========================================================= */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');

  ScrollTrigger.create({
    start: 'top -50',
    end: 99999,
    onUpdate: self => {
      if (self.scroll() > 50) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    }
  });

  // populate data-text for nav link hover effect (text-up reveal)
  // only the direct child span of .nav__link — avoid nested spans inside dropdowns
  nav.querySelectorAll('.nav__link > span').forEach(span => {
    span.setAttribute('data-text', span.textContent);
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('is-open');
      menu.classList.toggle('is-open');
    });
    // close mobile menu when any link clicked, but NOT when toggling the expand group
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('is-open');
        menu.classList.remove('is-open');
      });
    });
  }

  // mobile expand groups (e.g. Services)
  document.querySelectorAll('[data-mobile-toggle]').forEach(btn => {
    const group = btn.closest('.mobile-menu__group');
    const sub = group ? group.querySelector('.mobile-menu__sub') : null;
    if (!group || !sub) return;
    gsap.set(sub, { height: 0 });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = group.classList.toggle('is-open');
      if (open) {
        gsap.to(sub, {
          height: sub.scrollHeight,
          duration: 0.5, ease: 'power3.inOut',
          onComplete: () => { sub.style.height = 'auto'; }
        });
      } else {
        gsap.set(sub, { height: sub.scrollHeight });
        gsap.to(sub, { height: 0, duration: 0.45, ease: 'power3.inOut' });
      }
    });
  });
}

/* =========================================================
   HERO ANIMATION
   ========================================================= */
function initHero() {
  if (!document.querySelector('.hero')) return;
  const tl = gsap.timeline({ delay: 0.1 });

  tl.to('.hero__title .word', {
    y: '0%',
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.08
  })
  .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.9')
  .from('.hero__meta-block', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, '-=0.7')
  .from('.hero__marquee', { opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5');

  // bg parallax + scale-in
  gsap.to('.hero__bg img', {
    scale: 1,
    duration: 2,
    ease: 'expo.out'
  });

  gsap.to('.hero__bg img', {
    yPercent: 25,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* =========================================================
   FADE / LINE / STEP ANIMATIONS
   ========================================================= */
function initScrollReveals() {
  // simple fades
  gsap.utils.toArray('[data-anim="fade"]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // step reveals
  gsap.utils.toArray('[data-anim="step"]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // line reveals (split into lines, mask up)
  gsap.utils.toArray('[data-anim="lines"]').forEach(el => {
    splitTextLines(el);
    const lines = el.querySelectorAll('.line-inner');
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
}

/* =========================================================
   COUNTERS
   ========================================================= */
function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(obj.val);
          }
        });
      }
    });
  });
}

/* =========================================================
   MARQUEES
   ========================================================= */
function initMarquees() {
  document.querySelectorAll('.marquee').forEach(m => {
    const track = m.querySelector('.marquee__track');
    if (!track) return;

    const trackWidth = track.scrollWidth / 2; // we duplicated content
    const speed = parseFloat(m.getAttribute('data-speed') || 0.4);
    const duration = trackWidth / (60 * speed); // approximate seconds

    gsap.to(track, {
      x: -trackWidth,
      duration: duration,
      ease: 'none',
      repeat: -1
    });
  });
}

/* =========================================================
   SERVICE LIST — image preview follows cursor
   ========================================================= */
function initServicePreview() {
  if (window.matchMedia('(max-width: 992px)').matches) return;

  const preview = document.getElementById('servicePreview');
  const previewImg = document.getElementById('servicePreviewImg');
  const services = document.querySelectorAll('.service');

  let target = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };

  document.addEventListener('mousemove', (e) => {
    target.x = e.clientX + 30;
    target.y = e.clientY - 200;
  });

  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.1;
    pos.y += (target.y - pos.y) * 0.1;
    preview.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });

  services.forEach(service => {
    const imgUrl = service.getAttribute('data-img');
    service.addEventListener('mouseenter', () => {
      previewImg.src = imgUrl;
      preview.classList.add('is-visible');
    });
    service.addEventListener('mouseleave', () => {
      preview.classList.remove('is-visible');
    });
  });
}

/* =========================================================
   WORK — HORIZONTAL SCROLL (full-section pin)
   The whole .work section pins at the top of the viewport. While pinned,
   vertical scroll translates the card track horizontally. The pin only
   releases AFTER the last card has scrolled into view, so the next
   (dark) section never peeks in until the slider is exhausted.
   ========================================================= */
function initHorizontalWork() {
  const section = document.getElementById('work');
  const scroller = document.getElementById('workScroller');
  const track = document.getElementById('workTrack');
  if (!section || !scroller || !track) return;

  ScrollTrigger.matchMedia({
    '(min-width: 769px)': () => {
      const padX = () => {
        const el = document.querySelector('.work .container-fluid');
        return el ? parseFloat(getComputedStyle(el).paddingLeft) || 32 : 32;
      };
      const distance = () => track.scrollWidth - window.innerWidth + padX();

      gsap.to(track, {
        x: () => -(distance()),
        ease: 'none',
        scrollTrigger: {
          trigger: section,         // pin the whole section, not just the inner scroller
          start: 'top top',         // engage when section reaches top of viewport
          end: () => '+=' + distance(),
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // subtle image scale on entry, no nested parallax (avoid horizontal scroll context issues)
      gsap.utils.toArray('.project__media img').forEach(img => {
        gsap.from(img, {
          scale: 1.15,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: img, start: 'left 90%' }
        });
      });
    },
    '(max-width: 768px)': () => {
      // mobile: native horizontal scroll
      scroller.style.overflowX = 'auto';
      scroller.style.scrollSnapType = 'x mandatory';
      track.style.transform = 'none';
    }
  });
}

/* =========================================================
   MAGNETIC BUTTONS
   ========================================================= */
function initMagnetic() {
  if (window.matchMedia('(max-width: 992px)').matches) return;

  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    const inner = btn.querySelector('.btn-magnetic__inner');
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.25, y: y * 0.5, duration: 0.6, ease: 'power3.out' });
      gsap.to(inner, { x: x * 0.15, y: y * 0.3, duration: 0.6, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  });

  // testimonial nav buttons – subtle magnetic
  document.querySelectorAll('.t-nav-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.4, y: y * 0.4, duration: 0.5 });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
  });
}

/* =========================================================
   PAGE HERO (about + contact)
   ========================================================= */
function initPageHero() {
  const title = document.querySelector('.page-hero__title');
  if (!title) return;

  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.page-hero__title .word', {
    y: '0%',
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.07
  })
  .from('.page-hero__crumb', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.9')
  .from('.page-hero__meta > div', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, '-=0.6')
  .from('.page-hero__mail', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out' }, '-=0.6');
}

/* =========================================================
   STUDIO SHOT — parallax on scroll
   ========================================================= */
function initParallaxImages() {
  document.querySelectorAll('[data-parallax]').forEach(img => {
    const speed = parseFloat(img.getAttribute('data-parallax')) || 0.3;
    gsap.to(img, {
      yPercent: -speed * 30,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('section') || img.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });
}

/* =========================================================
   GALLERY — staggered reveal + light parallax
   ========================================================= */
function initGallery() {
  const items = document.querySelectorAll('.gallery__item');
  if (!items.length) return;

  items.forEach((item, i) => {
    const img = item.querySelector('img');
    gsap.from(item, {
      y: 60, opacity: 0,
      duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 90%' }
    });
    gsap.fromTo(img, { scale: 1.15 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

/* =========================================================
   TEAM — image reveal
   ========================================================= */
function initTeam() {
  document.querySelectorAll('.member').forEach(m => {
    const img = m.querySelector('.member__media img');
    gsap.fromTo(img, { scale: 1.2 }, {
      scale: 1,
      duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: m, start: 'top 85%' }
    });
  });
}

/* =========================================================
   CONTACT FORM
   ========================================================= */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // floating focus underline
  form.querySelectorAll('.field input, .field textarea').forEach(input => {
    input.addEventListener('focus', () => input.closest('.field').classList.add('is-focused'));
    input.addEventListener('blur', () => {
      if (!input.value) input.closest('.field').classList.remove('is-focused');
    });
  });

  // chip groups (single-select)
  document.querySelectorAll('.chip-group').forEach(group => {
    const hiddenId = group.id === 'projectChips' ? 'projectType'
                    : group.id === 'budgetChips' ? 'budget' : null;
    const hidden = hiddenId ? document.getElementById(hiddenId) : null;

    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        if (hidden) hidden.value = chip.getAttribute('data-value');
        gsap.fromTo(chip, { scale: 0.94 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
      });
    });
  });

  // submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const success = document.getElementById('formSuccess');
    const submit = form.querySelector('.form-submit');

    // basic validation
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    if (!name.value.trim() || !email.value.trim()) {
      gsap.fromTo([name, email].filter(i => !i.value.trim()),
        { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      return;
    }

    // simulate submit
    submit.disabled = true;
    submit.querySelector('.form-submit__text').innerHTML = '<span>Sending…</span><span>Sending…</span>';

    setTimeout(() => {
      success.classList.add('is-visible');
      gsap.fromTo(success,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });

      submit.querySelector('.form-submit__text').innerHTML = '<span>Sent ✓</span><span>Sent ✓</span>';
      form.reset();
      document.querySelectorAll('.chip.is-active').forEach(c => c.classList.remove('is-active'));
      document.querySelectorAll('.field.is-focused').forEach(f => f.classList.remove('is-focused'));
    }, 800);
  });
}

/* =========================================================
   FAQ ACCORDION
   ========================================================= */
function initAccordion() {
  document.querySelectorAll('.accordion-item-c').forEach(item => {
    const toggle = item.querySelector('.accordion-toggle');
    const body = item.querySelector('.accordion-body');
    if (!toggle || !body) return;

    // ensure starts collapsed
    gsap.set(body, { height: 0 });

    toggle.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // close any other open
      document.querySelectorAll('.accordion-item-c.is-open').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          gsap.to(other.querySelector('.accordion-body'), {
            height: 0, duration: 0.5, ease: 'power3.inOut'
          });
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        gsap.to(body, { height: 0, duration: 0.5, ease: 'power3.inOut' });
      } else {
        item.classList.add('is-open');
        gsap.to(body, {
          height: body.scrollHeight, duration: 0.6, ease: 'power3.inOut',
          onComplete: () => { body.style.height = 'auto'; }
        });
      }
    });
  });
}

/* =========================================================
   WORK PAGE — filters, view toggle, grid reveals, index view
   ========================================================= */
function initWorkPage() {
  const grid = document.getElementById('workGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.work-card'));
  const chips = document.querySelectorAll('.filter-link');
  const viewBtns = document.querySelectorAll('.view-toggle__btn');
  const empty = document.getElementById('workEmpty');
  const indexList = document.getElementById('workIndexList');

  // ----- staggered card reveal on scroll -----
  cards.forEach(c => c.setAttribute('data-anim-init', '0'));
  ScrollTrigger.batch(cards, {
    start: 'top 90%',
    onEnter: batch => {
      gsap.to(batch, {
        opacity: 1, y: 0,
        duration: 1, ease: 'power3.out',
        stagger: 0.08,
        onStart: () => batch.forEach(b => b.removeAttribute('data-anim-init'))
      });
    }
  });

  // ----- filter logic -----
  let currentFilter = 'all';
  function applyFilter(filter) {
    currentFilter = filter;

    const tl = gsap.timeline();
    // fade out current visible cards
    const visible = cards.filter(c => !c.classList.contains('is-hidden'));
    tl.to(visible, {
      opacity: 0, scale: 0.96, y: 12,
      duration: 0.35, ease: 'power2.inOut', stagger: 0.02
    });

    tl.add(() => {
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const match = filter === 'all' || cat === filter;
        if (match) card.classList.remove('is-hidden');
        else card.classList.add('is-hidden');
      });

      // empty state
      const remaining = cards.filter(c => !c.classList.contains('is-hidden'));
      empty.classList.toggle('is-visible', remaining.length === 0);

      // refresh ScrollTrigger because layout changed
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    // fade in newly visible
    tl.to({}, { duration: 0.05 });  // tiny delay
    tl.call(() => {
      const remaining = cards.filter(c => !c.classList.contains('is-hidden'));
      gsap.fromTo(remaining,
        { opacity: 0, scale: 0.96, y: 16 },
        {
          opacity: 1, scale: 1, y: 0,
          duration: 0.7, ease: 'power3.out',
          stagger: 0.06
        });
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.classList.contains('is-active')) return;
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilter(chip.getAttribute('data-filter'));
    });
  });

  // ----- build index view from cards -----
  cards.forEach((card, i) => {
    const num = String(i + 1).padStart(2, '0');
    const title = card.querySelector('.work-card__title').textContent;
    const cat = card.querySelector('.work-card__cat').textContent;
    const loc = card.querySelector('.work-card__loc').textContent;
    const year = card.querySelector('.work-card__year').textContent;
    const img = card.querySelector('.work-card__media img').src;

    const li = document.createElement('li');
    li.innerHTML = `
      <a href="#" class="work-index__row" data-category="${card.getAttribute('data-category')}" data-cursor="view">
        <span class="work-index__num">${num}</span>
        <span class="work-index__title">${title}</span>
        <span class="work-index__cat">${cat}</span>
        <span class="work-index__loc">${loc}</span>
        <span class="work-index__year">${year}</span>
        <span class="work-index__arrow"><i class="bi bi-arrow-up-right"></i></span>
        <img class="work-index__preview" src="${img}" alt="" loading="lazy" />
      </a>
    `;
    indexList.appendChild(li);
  });

  // sync filter to index rows
  function applyFilterToIndex() {
    const rows = indexList.querySelectorAll('.work-index__row');
    rows.forEach(r => {
      const match = currentFilter === 'all' || r.getAttribute('data-category') === currentFilter;
      r.parentElement.style.display = match ? '' : 'none';
    });
  }

  // re-run filter sync when chips clicked (after fade timeline)
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      setTimeout(applyFilterToIndex, 380);
    });
  });

  // ----- view toggle -----
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      viewBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const view = btn.getAttribute('data-view');
      document.body.setAttribute('data-view', view);
      requestAnimationFrame(() => ScrollTrigger.refresh());
      // re-apply filter to whichever view is now visible
      applyFilterToIndex();

      // animate the view that just appeared
      if (view === 'index') {
        const rows = indexList.querySelectorAll('li:not([style*="none"]) .work-index__row');
        gsap.fromTo(rows,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04 });
      } else {
        const visible = cards.filter(c => !c.classList.contains('is-hidden'));
        gsap.fromTo(visible,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04 });
      }
    });
  });

  // initial set
  document.body.setAttribute('data-view', 'grid');
  applyFilterToIndex();
}

/* =========================================================
   FOOTER REVEAL
   ========================================================= */
function initFooter() {
  gsap.from('.footer__big', {
    yPercent: 30,
    opacity: 0,
    duration: 1.4,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.footer', start: 'top 80%' }
  });
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  // load fonts before measuring text
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }

  await runLoader();

  initSmoothScroll();
  initCursor();
  initNav();
  initHero();           // home only — no-ops gracefully if .hero missing
  initPageHero();       // about + contact
  initScrollReveals();
  initCounters();
  initMarquees();
  initServicePreview();
  initHorizontalWork();
  initMagnetic();
  initParallaxImages(); // studio-shot etc.
  initGallery();
  initTeam();
  initContactForm();
  initAccordion();
  initWorkPage();
  initFooter();

  // refresh after everything mounts
  requestAnimationFrame(() => ScrollTrigger.refresh());
});
