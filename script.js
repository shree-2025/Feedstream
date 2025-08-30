// FeedStream interactions – reveal, parallax, carousel
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Year
  const y = new Date().getFullYear();
  const yEl = $('#year'); if (yEl) yEl.textContent = y;

  // Reveal on scroll
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.2});
  $$('[data-animate]').forEach(el=> io.observe(el));

  // Mobile nav toggle
  (function(){
    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primaryNav');
    if (!btn || !nav) return;
    const body = document.body;
    const close = ()=>{
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      body.style.overflow = '';
    };
    const open = ()=>{
      nav.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      body.style.overflow = 'hidden';
    };
    btn.addEventListener('click', ()=>{
      const isOpen = nav.classList.contains('open');
      isOpen ? close() : open();
    });
    // Close when clicking a link
    nav.addEventListener('click', (e)=>{
      if (e.target.closest('a')) close();
    });
    // Close on resize to desktop
    window.addEventListener('resize', ()=>{
      if (window.innerWidth > 820) close();
    });
  })();

  // Demo sidebar page switching + hash persistence + mini charts
  (function(){
    // Mobile demo menu toggle
    (function(){
      const toggle = document.querySelector('.demo-menu-toggle');
      const side = document.getElementById('demoSide');
      if (toggle && side){
        const open = ()=>{ side.classList.add('open'); toggle.setAttribute('aria-expanded','true'); };
        const close = ()=>{ side.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); };
        toggle.addEventListener('click', ()=>{
          const isOpen = side.classList.contains('open');
          isOpen ? close() : open();
        });
        // Close when a nav link inside sidebar is clicked (mobile)
        side.addEventListener('click', (e)=>{
          if (e.target.closest('a[data-page]')) close();
        });
        // Close on resize to desktop
        window.addEventListener('resize', ()=>{ if (window.innerWidth > 820) close(); });
      }
    })();

    const nav = document.querySelector('.demo-nav');
    const panels = $$('.demo-main .panel');
    if (!nav || panels.length === 0) return;

    // Mini charts
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const drawBars = ()=>{
      const c = document.getElementById('chart-bars');
      if (!c) return;
      const ctx = c.getContext('2d');
      const cssW = c.clientWidth || 400; const cssH = 160;
      c.width = Math.floor(cssW * dpr); c.height = Math.floor(cssH * dpr);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0,0,cssW,cssH);
      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      for(let y=20; y<cssH; y+=28){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cssW,y); ctx.stroke(); }
      // data
      const values = [50,68,45,72,90,76,110];
      const maxV = 120;
      const barW = Math.max(10, (cssW - 40) / values.length - 10);
      values.forEach((v,i)=>{
        const h = (v/maxV) * (cssH - 30);
        const x = 20 + i * (barW + 10);
        const y = cssH - h - 10;
        const grad = ctx.createLinearGradient(0,y,0,y+h);
        grad.addColorStop(0,'rgba(70,95,255,0.9)');
        grad.addColorStop(1,'rgba(70,95,255,0.25)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(70,95,255,0.45)';
        ctx.lineWidth = 1;
        const r = 6;
        // rounded bar
        ctx.beginPath();
        ctx.moveTo(x, y+r);
        ctx.arcTo(x, y, x+r, y, r);
        ctx.lineTo(x+barW-r, y);
        ctx.arcTo(x+barW, y, x+barW, y+r, r);
        ctx.lineTo(x+barW, y+h);
        ctx.lineTo(x, y+h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    };

    const drawDonut = ()=>{
      const c = document.getElementById('chart-donut');
      if (!c) return;
      const ctx = c.getContext('2d');
      const cssW = c.clientWidth || 220; const cssH = 160; const size = Math.min(cssW, cssH);
      c.width = Math.floor(cssW * dpr); c.height = Math.floor(cssH * dpr);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0,0,cssW,cssH);
      const cx = cssW/2, cy = cssH/2, r = Math.min(size/2 - 10, 70), t = 18;
      const arcs = [ {v:0.2, col:'#2ecc71'}, {v:0.4, col:'#f1c40f'}, {v:0.4, col:'#34495e'} ];
      let a0 = -Math.PI/2;
      arcs.forEach(a=>{
        const a1 = a0 + a.v * Math.PI*2;
        ctx.beginPath();
        ctx.strokeStyle = a.col; ctx.lineWidth = t; ctx.lineCap = 'round';
        ctx.arc(cx, cy, r, a0, a1);
        ctx.stroke();
        a0 = a1;
      });
      // inner glow
      ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=10; ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    };

    const drawAnalyticsBars = ()=>{
      const c = document.getElementById('chart-analytics-bars');
      if (!c) return;
      const ctx = c.getContext('2d');
      const cssW = c.clientWidth || 440; const cssH = 180;
      c.width = Math.floor(cssW * dpr); c.height = Math.floor(cssH * dpr);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0,0,cssW,cssH);
      // axes/grid
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      for(let y=20; y<cssH; y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cssW,y); ctx.stroke(); }
      const values = [120,140,130,180,240,200,180];
      const maxV = 260;
      const barW = Math.max(12, (cssW - 40) / values.length - 12);
      values.forEach((v,i)=>{
        const h = (v/maxV) * (cssH - 30);
        const x = 20 + i * (barW + 12);
        const y = cssH - h - 10;
        const grad = ctx.createLinearGradient(0,y,0,y+h);
        grad.addColorStop(0,'rgba(70,95,255,0.95)');
        grad.addColorStop(1,'rgba(70,95,255,0.25)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(70,95,255,0.45)';
        ctx.lineWidth = 1;
        const r = 6;
        ctx.beginPath();
        ctx.moveTo(x, y+r);
        ctx.arcTo(x, y, x+r, y, r);
        ctx.lineTo(x+barW-r, y);
        ctx.arcTo(x+barW, y, x+barW, y+r, r);
        ctx.lineTo(x+barW, y+h);
        ctx.lineTo(x, y+h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    };

    const drawAnalyticsDonut = ()=>{
      const c = document.getElementById('chart-analytics-donut');
      if (!c) return;
      const ctx = c.getContext('2d');
      const cssW = c.clientWidth || 260; const cssH = 180; const size = Math.min(cssW, cssH);
      c.width = Math.floor(cssW * dpr); c.height = Math.floor(cssH * dpr);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0,0,cssW,cssH);
      const cx = cssW/2, cy = cssH/2, r = Math.min(size/2 - 10, 70), t = 18;
      const arcs = [ {v:0.68, col:'#2ecc71'}, {v:0.22, col:'#f1c40f'}, {v:0.06, col:'#e67e22'}, {v:0.04, col:'#e74c3c'} ];
      let a0 = -Math.PI/2;
      arcs.forEach(a=>{ const a1 = a0 + a.v * Math.PI*2; ctx.beginPath(); ctx.strokeStyle=a.col; ctx.lineWidth=t; ctx.lineCap='round'; ctx.arc(cx,cy,r,a0,a1); ctx.stroke(); a0=a1; });
      ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=10; ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    };

    const renderCharts = ()=>{ drawBars(); drawDonut(); };
    const renderAnalyticsCharts = ()=>{ drawAnalyticsBars(); drawAnalyticsDonut(); };

    const setActive = (key)=>{
      panels.forEach(p=> p.classList.toggle('active', p.dataset.panel === key));
      nav.querySelectorAll('a').forEach(a=> a.classList.toggle('active', a.dataset.page === key));
      // Persist hash and render if dashboard
      const newHash = `#demo-${key}`;
      if (location.hash !== newHash) history.replaceState(null,'',newHash);
      if (key === 'dashboard') setTimeout(renderCharts, 0);
      if (key === 'analytics') setTimeout(renderAnalyticsCharts, 0);
    };

    // Apply initial from hash
    const fromHash = ()=>{
      const m = (location.hash || '').match(/^#demo-(.+)$/);
      const page = m ? m[1] : 'dashboard';
      setActive(page);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);

    nav.addEventListener('click', (e)=>{
      const a = e.target.closest('a[data-page]');
      if (!a) return;
      e.preventDefault();
      setActive(a.dataset.page);
    });
    // Keyboard support
    nav.querySelectorAll('a[data-page]').forEach(a=>{
      a.setAttribute('role','button');
      a.setAttribute('tabindex','0');
      a.addEventListener('keydown', (ev)=>{
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setActive(a.dataset.page);} 
      });
    });

    // Responses search filter (simple client-side)
    const setupResponsesFilter = ()=>{
      const panel = document.querySelector('.panel[data-panel="responses"]');
      if (!panel) return;
      const input = panel.querySelector('input.search');
      const rows = Array.from(panel.querySelectorAll('.table .row')).filter(r=>!r.classList.contains('head'));
      if (!input || rows.length===0) return;
      input.addEventListener('input', ()=>{
        const q = input.value.trim().toLowerCase();
        rows.forEach(r=>{
          const title = (r.children[0]?.textContent || '').toLowerCase();
          r.style.display = title.includes(q) ? '' : 'none';
        });
      });
    };
    setupResponsesFilter();

    // Re-render charts on resize
    window.addEventListener('resize', ()=>{
      const active = document.querySelector('.demo-main .panel.active');
      if (!active) return;
      if (active.dataset.panel === 'dashboard') renderCharts();
      if (active.dataset.panel === 'analytics') renderAnalyticsCharts();
    });
  })();

  // Parallax hero layers (mouse + scroll)
  const layers = $$('.layer');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mx=0, my=0;
  if (!prefersReduced && layers.length){
    const hero = $('.section-hero');
    if (hero){
      hero.addEventListener('mousemove', (e)=>{
        const rect = hero.getBoundingClientRect();
        mx = (e.clientX - rect.left)/rect.width - 0.5;
        my = (e.clientY - rect.top)/rect.height - 0.5;
        layers.forEach(layer=>{
          const d = parseFloat(layer.dataset.depth||'0.2');
          layer.style.transform = `translate3d(${mx * d * 20}px, ${my * d * 20}px, 0)`;
        });
      });
      window.addEventListener('scroll', ()=>{
        const y = window.scrollY;
        layers.forEach(layer=>{
          const d = parseFloat(layer.dataset.depth||'0.2');
          layer.style.transform = `translate3d(${mx * d * 20}px, ${my * d * 20 + y * d * 0.1}px, 0)`;
        });
      }, { passive:true });
    }
  }

  // Pricing: billing toggle (monthly/annual)
  (function(){
    const toggle = document.getElementById('billingToggle');
    const section = document.querySelector('.section-pricing');
    if (!toggle || !section) return;
    const amounts = section.querySelectorAll('.amount');
    const perTexts = section.querySelectorAll('.per');
    const apply = (annual)=>{
      toggle.setAttribute('aria-pressed', annual ? 'true' : 'false');
      section.classList.toggle('annual', annual);
      amounts.forEach(el=>{
        const month = el.getAttribute('data-month');
        const year = el.getAttribute('data-annual');
        el.textContent = annual ? year : month;
      });
      perTexts.forEach(el=>{
        const m = el.getAttribute('data-month-text') || el.textContent;
        const y = el.getAttribute('data-annual-text') || el.textContent;
        el.textContent = annual ? y : m;
      });
      try { localStorage.setItem('billingPeriod', annual ? 'annual' : 'monthly'); } catch {}
    };
    // init from storage
    let annual = false;
    try { annual = (localStorage.getItem('billingPeriod') === 'annual'); } catch {}
    apply(annual);
    toggle.addEventListener('click', ()=>{ annual = !annual; apply(annual); });
    toggle.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); annual=!annual; apply(annual);} });
  })();

  // Testimonials carousel (guarded)
  (function(){
    const track = document.querySelector('.carousel-track');
    if (!track) return;
    const slides = track.querySelectorAll('.t-card');
    const prev = document.querySelector('.carousel-btn.prev');
    const next = document.querySelector('.carousel-btn.next');
    const dotsWrap = document.querySelector('.carousel-dots');
    let index = 0;
    const update = ()=>{
      const width = track.getBoundingClientRect().width;
      track.scrollTo({left: index * width, behavior: 'smooth'});
      if (dotsWrap){
        dotsWrap.querySelectorAll('button').forEach((b,i)=> b.classList.toggle('active', i===index));
      }
    };
    if (dotsWrap){
      dotsWrap.innerHTML = '';
      slides.forEach((_,i)=>{
        const b = document.createElement('button');
        b.setAttribute('aria-label', `Go to slide ${i+1}`);
        b.addEventListener('click', ()=>{ index = i; update(); });
        dotsWrap.appendChild(b);
      });
    }
    prev && prev.addEventListener('click', ()=>{ index = Math.max(0, index-1); update(); });
    next && next.addEventListener('click', ()=>{ index = Math.min(slides.length-1, index+1); update(); });
  })();

  // Keyboard accessibility for carousel
  window.addEventListener('keydown', (e)=>{
    const activeEl = document.activeElement;
    if (activeEl && activeEl.closest && activeEl.closest('.carousel')){
      const car = activeEl.closest('.carousel');
      const prevBtn = car.querySelector('.carousel-btn.prev');
      const nextBtn = car.querySelector('.carousel-btn.next');
      if (e.key === 'ArrowLeft'){ e.preventDefault(); prevBtn && prevBtn.click(); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); nextBtn && nextBtn.click(); }
    }
  });

  // Custom cursor (pointer devices only)
  const pointerFine = window.matchMedia('(pointer: fine)').matches;
  const cursorEl = $('#cursor');
  if (!prefersReduced && pointerFine && cursorEl){
    document.body.classList.add('cursor-active');
    let x = window.innerWidth/2, y = window.innerHeight/2;
    let tx = x, ty = y; // target
    let vx = x, vy = y; // visual
    let raf;
    let idleTimer;

    const move = (e)=>{
      tx = e.clientX; ty = e.clientY;
      cursorEl.classList.remove('cursor--hidden');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(()=> cursorEl.classList.add('cursor--hidden'), 2000);
    };
    const loop = ()=>{
      // Lerp
      vx += (tx - vx) * 0.18;
      vy += (ty - vy) * 0.18;
      // Position using left/top so CSS transform scale from classes remains intact
      cursorEl.style.left = vx + 'px';
      cursorEl.style.top = vy + 'px';
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move, { passive:true });
    window.addEventListener('mouseleave', ()=>cursorEl.classList.add('cursor--hidden'));
    window.addEventListener('mouseenter', ()=>cursorEl.classList.remove('cursor--hidden'));
    window.addEventListener('mousedown', ()=>cursorEl.classList.add('cursor--down'));
    window.addEventListener('mouseup', ()=>cursorEl.classList.remove('cursor--down'));

    const interactiveSel = 'a, button, .btn, [role="button"], .feature, .card, input, textarea, select, .carousel-btn';
    document.addEventListener('mouseover', (e)=>{
      if (e.target.closest(interactiveSel)) cursorEl.classList.add('cursor--hover');
    });
    document.addEventListener('mouseout', (e)=>{
      if (e.target.closest(interactiveSel)) cursorEl.classList.remove('cursor--hover');
    });
  }

  // Magnetic hover effect for CTA and any .magnetic
  if (!prefersReduced){
    const mags = $$('.magnetic');
    const maxShift = 18; // px
    mags.forEach(el=>{
      let over = false;
      el.style.transition = 'transform .2s ease';
      el.addEventListener('mouseenter', ()=>{ over = true; });
      el.addEventListener('mouseleave', ()=>{ over = false; el.style.transform = 'translate3d(0,0,0)'; });
      el.addEventListener('mousemove', (e)=>{
        if (!over) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width/2; const cy = r.top + r.height/2;
        let dx = (e.clientX - cx) / (r.width/2);
        let dy = (e.clientY - cy) / (r.height/2);
        dx = Math.max(-1, Math.min(1, dx));
        dy = Math.max(-1, Math.min(1, dy));
        const tx = dx * maxShift;
        const ty = dy * maxShift;
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    });
  }
})();
