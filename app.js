/* ============================================================
   Narvyn — landing page script（墨玻璃版）
   原则：内容默认可见；所有动效均为增强。
   - 全部 GSAP 用法都守卫在 window.gsap 存在的前提下
   - 全部滚动动效守卫在 prefers-reduced-motion: no-preference 下
   - 开屏动画仅首次访问出现（localStorage: narvyn_seen_intro_v2，
     v2 = 墨玻璃改版后的新开屏，老访客也能看到一次）
   - 动效曲线翻译自 ShiCe tokens.dart 的弹簧：
     springDefault ≈ power3.out；springBouncy ≈ back.out(1.3)
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'narvyn_seen_intro_v2';
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
     导航：滚动后玻璃提亮（材质随层级变化）
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
     玻璃标志先落位（带回弹），再亮字，最后进度条走完上滑离场
     ---------------------------------------------------------- */
  var loader = doc.getElementById('loader');

  function heroCascade(delaySec) {
    if (!hasGsap || reduceMotion) return;
    var items = doc.querySelectorAll('.hero .st, .hero-phone-wrap');
    window.gsap.from(items, {
      y: 16,                    /* entrance.dart：rise 16 */
      autoAlpha: 0,
      duration: 0.55,
      ease: 'power3.out',       /* ≈ springDefault */
      stagger: 0.06,            /* ≈ 40-60ms 错峰 */
      delay: delaySec || 0,
      clearProps: 'all'
    });
    /* 手机样机：springBouncy 的贴上来的分量感 */
    var phone = doc.querySelector('.hero-phone-wrap');
    if (phone) {
      window.gsap.from(phone, {
        scale: 0.94,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'back.out(1.3)',
        delay: (delaySec || 0) + 0.2,
        clearProps: 'all'
      });
    }
  }

  function runIntro() {
    if (!loader) { heroCascade(0.1); return; }
    var mark = doc.getElementById('loaderMark');
    var word = doc.getElementById('loaderWord');
    var fill = doc.getElementById('loaderBarFill');
    if (!mark || !word || !fill) { loader.hidden = true; heroCascade(0.1); return; }

    loader.hidden = false;
    docEl.classList.add('is-intro');

    var startedAt = Date.now();
    var gsap = window.gsap;

    gsap.set(mark, { autoAlpha: 0, scale: 0.9, filter: 'blur(10px)' });
    gsap.set(word, { autoAlpha: 0, y: 8 });
    gsap.set(fill, { scaleX: 0 });

    var tl = gsap.timeline();
    tl.to(mark, {
      autoAlpha: 1, scale: 1, filter: 'blur(0px)',
      duration: 0.7, ease: 'back.out(1.4)'   /* springBouncy */
    }, 0.05);
    tl.to(word, {
      autoAlpha: 1, y: 0,
      duration: 0.5, ease: 'power2.out'
    }, 0.3);
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
      heroCascade(0);
    } else if (hasGsap && !reduceMotion) {
      runIntro(); /* 完成后才写入 narvyn_seen_intro_v2 */
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

      /* 特性卡片交错入场（entrance.dart：错峰 + 上浮 + 微缩放） */
      var cards = gsap.utils.toArray('.fcard');
      if (cards.length) {
        gsap.set(cards, { y: 20, scale: 0.97, autoAlpha: 0 });
        ScrollTrigger.batch(cards, {
          start: 'top 88%',
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              y: 0, scale: 1, autoAlpha: 1,
              duration: 0.6, ease: 'power3.out',
              stagger: 0.06, overwrite: true
            });
          }
        });
      }

      /* 截图长廊卡片入场（移动端也能看到，横向滚动时不重播） */
      var gcards = gsap.utils.toArray('.gcard');
      if (gcards.length) {
        gsap.set(gcards, { y: 20, autoAlpha: 0 });
        ScrollTrigger.batch(gcards, {
          start: 'top 92%',
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              y: 0, autoAlpha: 1,
              duration: 0.6, ease: 'power3.out',
              stagger: 0.06, overwrite: true
            });
          }
        });
      }

      /* 数字 count-up（HTML 里已是最终值，动画只是增强；等宽数字不跳动） */
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
              duration: 1.4,
              ease: 'power2.out',
              onUpdate: function () { el.textContent = String(Math.round(obj.v)); }
            });
          }
        });
      });

      /* 区块标题轻微上浮 */
      gsap.utils.toArray('.section-head').forEach(function (head) {
        gsap.from(head, {
          y: 20,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: head, start: 'top 86%', once: true }
        });
      });

      /* 下载大卡入场：底部贴上来（bouncy 的克制用法） */
      var dlCard = doc.querySelector('.dl-card');
      if (dlCard) {
        gsap.from(dlCard, {
          y: 32,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'back.out(1.2)',
          scrollTrigger: { trigger: dlCard, start: 'top 86%', once: true }
        });
      }

      /* Hero：机型轻浮动 + 滚动视差（克制） */
      var heroMock = doc.querySelector('.hero .phone');
      if (heroMock) {
        gsap.to(heroMock, {
          y: -8, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1
        });
      }
      var heroPhone = doc.getElementById('heroPhone');
      if (heroPhone) {
        gsap.to(heroPhone, {
          y: -40,
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
