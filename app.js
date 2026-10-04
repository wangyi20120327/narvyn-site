/* ============================================================
   Narvyn — landing page script
   原则：内容默认可见；所有动效均为增强。
   - 全部 GSAP 用法都守卫在 window.gsap 存在的前提下
   - 全部滚动动效守卫在 prefers-reduced-motion: no-preference 下
   - 开屏动画仅首次访问出现（localStorage: narvyn_seen_intro）
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'narvyn_seen_intro';
  var INTRO_MIN_MS = 2500;      // 开屏最少停留
  var BAR_DELAY = 0.3;          // 进度条起始延迟（秒）
  var BAR_DURATION = 2.2;       // 进度条时长（秒）

  var doc = document;
  var docEl = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) window.gsap.registerPlugin(window.ScrollTrigger);

  function markSeen() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* 隐私模式等，忽略 */ }
  }
  function hasSeen() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }

  /* ----------------------------------------------------------
     导航：滚动超过 24px 后显示发丝线
     ---------------------------------------------------------- */
  var nav = doc.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('nav--scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     开屏加载动画（仅首次访问 + 支持 GSAP + 未减弱动效）
     ---------------------------------------------------------- */
  var loader = doc.getElementById('loader');

  function heroCascade(delaySec) {
    if (!hasGsap || reduceMotion) return;
    var items = doc.querySelectorAll('.hero .st, .hero-phone-wrap');
    window.gsap.from(items, {
      y: 28,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      delay: delaySec || 0,
      clearProps: 'all'
    });
  }

  function runIntro() {
    if (!loader) { heroCascade(0.1); return; }
    var wordmark = doc.getElementById('loaderWordmark');
    var fill = doc.getElementById('loaderBarFill');
    if (!wordmark || !fill) { loader.hidden = true; heroCascade(0.1); return; }

    loader.hidden = false;
    docEl.classList.add('is-intro');

    var startedAt = Date.now();
    var gsap = window.gsap;

    gsap.set(wordmark, { autoAlpha: 0, filter: 'blur(12px)', scale: 0.96 });
    gsap.set(fill, { scaleX: 0 });

    var tl = gsap.timeline();
    tl.to(wordmark, {
      autoAlpha: 1, filter: 'blur(0px)', scale: 1,
      duration: 0.9, ease: 'power2.out'
    }, 0.1);
    tl.to(fill, {
      scaleX: 1, duration: BAR_DURATION, ease: 'power1.inOut'
    }, BAR_DELAY);

    var loaded = new Promise(function (resolve) {
      if (doc.readyState === 'complete') resolve();
      else window.addEventListener('load', function () { resolve(); }, { once: true });
    });
    var minTime = new Promise(function (resolve) {
      var wait = Math.max(0, INTRO_MIN_MS - (Date.now() - startedAt));
      setTimeout(resolve, wait);
    });

    Promise.all([loaded, minTime]).then(function () {
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut',
        onStart: function () {
          docEl.classList.remove('is-intro');
          heroCascade(0.35);
        },
        onComplete: function () {
          loader.hidden = true;
          loader.setAttribute('aria-hidden', 'true');
          gsap.set(loader, { clearProps: 'all' });
          markSeen();
        }
      });
    });
  }

  if (loader) {
    if (hasSeen()) {
      loader.hidden = true; /* 回访：直接打开 */
    } else if (hasGsap && !reduceMotion) {
      runIntro(); /* 完成后才写入 narvyn_seen_intro */
    } else {
      /* 无 GSAP 或用户偏好减弱动效：不开屏，并记住，以后也不再开屏 */
      loader.hidden = true;
      markSeen();
    }
  }

  /* ----------------------------------------------------------
     滚动动效（全部为增强，内容默认可见）
     ---------------------------------------------------------- */
  if (hasGsap && hasST && !reduceMotion) {
    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var mm = gsap.matchMedia();

    /* 桌面端（精确指针）：长廊 pin + 横向 scrub */
    mm.add('(min-width: 768px) and (pointer: fine)', function () {
      var section = doc.querySelector('.gallery');
      var viewport = section && section.querySelector('.gallery-viewport');
      var track = section && section.querySelector('.gallery-track');
      if (!section || !viewport || !track) return;

      section.classList.add('gallery--pinned');
      var distance = function () {
        return Math.max(0, track.scrollWidth - viewport.clientWidth);
      };
      gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + distance(); },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      return function () { section.classList.remove('gallery--pinned'); };
    });

    /* 其余滚动动效：任何尺寸，只要未减弱动效 */
    mm.add('(prefers-reduced-motion: no-preference)', function () {

      /* bento 卡片交错入场 */
      var cards = gsap.utils.toArray('.bento-card');
      if (cards.length) {
        gsap.set(cards, { y: 32, autoAlpha: 0 });
        ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              y: 0, autoAlpha: 1,
              duration: 0.8, ease: 'power3.out',
              stagger: 0.09, overwrite: true
            });
          }
        });
      }

      /* 数字 count-up（HTML 里已是最终值，动画只是增强） */
      gsap.utils.toArray('[data-count]').forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: function () {
            var obj = { v: 0 };
            el.textContent = '0';
            gsap.to(obj, {
              v: target,
              duration: 1.6,
              ease: 'power2.out',
              onUpdate: function () { el.textContent = String(Math.round(obj.v)); }
            });
          }
        });
      });

      /* 区块标题轻微上浮 */
      gsap.utils.toArray('.section-head').forEach(function (head) {
        gsap.from(head, {
          y: 24,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: head, start: 'top 86%', once: true }
        });
      });

      /* Hero：机型轻浮动 + 滚动视差 */
      var heroMock = doc.querySelector('.hero .phone-mockup');
      if (heroMock) {
        gsap.to(heroMock, {
          y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1
        });
      }
      var heroPhone = doc.getElementById('heroPhone');
      if (heroPhone) {
        gsap.to(heroPhone, {
          y: -70,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      }
    });
  }

  /* ----------------------------------------------------------
     Service Worker：注册后二次访问全部资源走本地缓存，
     秒开；update.json 在 sw.js 里被排除，永不缓存。
     ---------------------------------------------------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
