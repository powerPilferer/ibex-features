/* [4차 하단 1019 · 5차 하단 패럴랙스 1019] LINE UP · MEDIA · PROFESSIONALS · Q&A · 푸터 — 춘봉
   위쪽 엔진(top.js·scene.js)은 건드리지 않는다. 여기서 하는 일:
   ① GNB 톤: GNB 띠(위 75px) 밑에 있는 하단 섹션을 찾아 html[data-gnb] 를 씀(무대 구간 = 속성 없음 → 위쪽 그대로)
   ② [5차] 스무딩 + 묶음 패럴랙스(기본): 위쪽 엔진과 같은 스크롤 스무딩(λ6 지수 lerp, 관성·오버슈트 0)을 하단에도 —
        Ys(스무딩된 scrollY)로 하단 전체를 그린다: .lower 는 translate(scrollY − Ys), 풀리는 무대(.stage)도 같은 Ys 로(무대가 고정인 동안은 0 — 위쪽 화면 무변화).
        그 위에 섹션 안 '묶음'(제목+부제 / 카드 줄 / 배경 도트 …)마다 깊이 k: 화면 가운데에서 0(= 피그마 자리), 가운데에서 d 떨어지면 k·d 만큼 더 밀림.
        등장은 시간 모션(.rise)이 아니라 스크롤 연동 불투명도(묶음 윗선이 화면 아래 12% 띠를 지나는 동안 0→1) — 스크롤이 멈추면 같이 멈춘다.
        ?lpar=0 → 4차 그대로(네이티브 1:1 + 시간 등장 .rise) · ?lpar=2 → 깊이 2배 · ?lsm=0 → 스무딩 없이 패럴랙스만 · ?lfade=0 → 불투명도 등장 없음
   ③ 등장(?lpar=0 일 때만): .rise 가 화면 아래 12% 선을 넘으면 한 번 떠오름. ?rise=0 · reduce 끔
   ④ MEDIA 가로 넘김: 트랙패드·Shift+휠·키보드는 브라우저 기본. 마우스 드래그만 직접 — 놓으면 관성(지수 감쇠 τ 325ms, 오버슈트 0) */
(() => {
  const qs = new URLSearchParams(location.search);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.get('motion') === '0';

  /* ⓪ 하단 그림은 data-src — 특장점 엔진이 시작 전에 document.images 전부의 decode() 를 기다리므로(scene.js), 무대가 준비된 뒤에 붙인다.
       (loading=lazy 로 두면 화면 밖 그림이 끝내 안 불려 엔진이 멈췄다 — 4차 작업 중 실측) */
  /* [9차 1019] 하단 도트 파동 — 사장님: "라인업이랑 큐엔에이 부분에서 패턴이 존재하는데 거기도 모션이 걸려야해. 최상단의 모션을 참고해서 작업해줘"
     상단 도트(top.js DOT_V.a, 8~12차 승인)와 같은 문법을 여기 복제(top.js 는 안 건드림): 무늬의 진짜 중심에서 띠가 생겨 바깥으로 번지고,
     띠가 지나간 점은 floor(.3)까지 작아짐. 점 하나(거리 k = 중심 거리 / 가장 먼 점) = 띠 도착(주기 시작 + k·D) → tin 동안 floor → 제 크기(s6) → hold → tout 동안 → floor.
     그리기 = 점마다 Path2D 캔버스(점 자기 중심 기준 스케일), 붙은 점 덩어리는 격자 점으로 쪼갠 판(통째로 튀지 않게).
     · LINE UP 332:29687 = 상단 왼쪽 도트와 같은 벡터(경로 1109개 좌표 차 ≤ .1) → 상단이 쓰는 assets/top/dots-split.json 그대로 읽음. 중심 (529,528) = 상단 파동 중심과 같은 격자점(상단은 좌우 반전 1058−529 = 529).
       화면에선 상자째 90° 회전(상자 가운데가 무늬 중심이라 회전해도 그 자리) → 섹션 좌표 (1611,348).
     · Q&A 338:20017 = 72.3 간격 격자, 가운데 큰 원 + 상하좌우 4점이 한 경로 → assets/lower/qna-dots-split.json(도구/split_qna_dots.py, IoU .996). 중심 = 가운데 원 (375,374) → 섹션 (263,922).
     · 지금 보이는 모양은 그대로: 흰 점 30%·블러 1.5(LINE UP) / #4276B2 10%·블러 2(Q&A) 를 캔버스 요소의 opacity·filter 로(svg 그룹 opacity 와 같은 순서 — 겹친 점 이중 합성 없음).
     · 섹션이 화면에 있을 때만 그림(IntersectionObserver). 시각은 페이지 시계 그대로라 들어오는 순간 이미 파동 중 = '첨부터 바로'. 첫 그림은 불러오자마자 한 번.
     ?ldw=0 → 이전 판(svg 그림 그대로, 정지) · ?ldw=full → 캔버스·쪼갠 점을 제 크기로 정지(검증용) · ?ldwp= 주기 · ?ldwf= 바닥 · reduce / ?motion=0 → 이전 판 */
  const LDW = reduce || qs.get('ldw') === '0' ? '' : qs.get('ldw') === 'full' ? 'full' : 'wave';
  const LWP = { D: 3.0, tin: .55, hold: .15, tout: .6, period: 2.0, floor: .3 };   // = top.js DOT_V.a (9차 '더 빠르게·빈 공간 없게', 12차 '첨부터 바로')
  if (qs.get('ldwp')) LWP.period = parseFloat(qs.get('ldwp'));
  if (qs.get('ldwf')) LWP.floor = parseFloat(qs.get('ldwf'));
  /* 11차(사장님 'Q&A 도트패턴은 이 원본형태가 그래도 느껴지는 모션이 좋을거 같은데'): Q&A 는 점 크기 차이(가운데 꽃·고리)가 무늬 자체라 floor .3 이면 형태가 사라진다
     → 같은 파동 문법이되 바닥 .78(점이 제 크기의 78% 밑으로 안 줄어 무늬가 늘 읽힘), 박자는 살짝 느긋하게(주기 2.6·띠 3.6s). ?qdf= 바닥 · ?qdw=9 9차(LINE UP 과 같은 값) */
  /* 12차(사장님 'Q&A 도트 모션이 좀 약해. 가운데 부분은 나두고 주위로 퍼져나가는 도트들을 기존처럼 퍼져나가게'): 가운데 꽃(중심 k 0 · 꽃잎 .18 · 대각 .26)은 제 크기로 고정,
     그 바깥(k ≥ .375)은 9차(= 상단·LINE UP) 파동 그대로(바닥 .3). 사이(.26~.375)는 고정 정도를 부드럽게 섞음. ?qdw=11 11차(전체 바닥 .78) · ?qdw=9 9차 */
  const QWP = qs.get('qdw') === '9' ? LWP : qs.get('qdw') === '11' ? Object.assign({}, LWP, { floor: qs.get('qdf') ? parseFloat(qs.get('qdf')) : .78, period: 2.6, D: 3.6 })
            : qs.get('qdw') === '12' ? Object.assign({}, LWP, { hold0: .26, hold1: .375 })
            /* 14차(사장님 '가운데에도 모션 — 작은 원들과 정가운데 겹쳐져 있는 원들 이렇게 두 개로 나눠서'): 두 묶음
               ① 가운데 겹친 원 5개(중심 k 0 · 꽃잎 .18) = 한 덩어리로 숨쉼 — 띠가 가운데에서 태어나는 순간 꽃 전체가 같은 박자로 .72까지 오므렸다 펴짐(꽃잎도 중심과 같은 위상, 모양 유지)
               ② 나머지 작은 원들(대각 .26 부터) = 상단·LINE UP 과 같은 파동(바닥 .3)으로 바깥으로 번짐. ?qdw=12 13차(가운데 고정) · ?qcf= 꽃 바닥 */
            : Object.assign({}, LWP, { core: .2, coreFloor: qs.get('qcf') ? parseFloat(qs.get('qcf')) : .72 });
  const dotPats = [];
  if (LDW) {
    const mk = (img, cls) => { const c = document.createElement('canvas'); c.className = cls; c.setAttribute('aria-hidden', 'true'); c.width = +img.getAttribute('width'); c.height = +img.getAttribute('height'); img.replaceWith(c); return c; };
    const luImgs = [...document.querySelectorAll('.lineup__dots img')], qImg = document.querySelector('img.qna__dots');
    if (luImgs.length === 2 && qImg) {
      dotPats.push({ name: 'lineup', src: 'assets/top/dots-split.json', W: 1058, H: 1056, cx: 529, cy: 528, color: '#fff', sec: document.getElementById('lineup'),
                     cv: mk(luImgs[0], 'ldw-cv'), spill: mk(luImgs[1], 'ldw-cv'), olds: luImgs });
      dotPats.push({ name: 'qna', src: 'assets/lower/qna-dots-split.json', W: 750, H: 748, cx: 375, cy: 374, color: '#4276B2', P: QWP, sec: document.getElementById('qna'),
                     cv: mk(qImg, 'qna__dots ldw-cv'), olds: [qImg] });
      root.classList.add('ldw-on');
    }
  }
  const lowerImgs = [...document.querySelectorAll('.lower img[data-src]')];
  const loadLower = () => { lowerImgs.forEach(im => { if (!im.getAttribute('src')) im.src = im.dataset.src; }); startDots(); };
  function startDots() {
    if (!dotPats.length || startDots.on) return; startDots.on = true;
    const s6 = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * t * (t * (t * 6 - 15) + 10); };   // top.js 와 같은 smootherstep
    const wave = (tl, k, P) => { const on = P.period - P.tin - P.hold;   // top.js dotWave 와 같은 식(rel 0 — 인트로 없음, tl 은 늘 k·D 보다 큼)
      const t = (tl - k * P.D) % P.period;
      if (t < P.tout) return 1 - s6(t / P.tout);
      if (t < on) return 0;
      if (t < on + P.tin) return s6((t - on) / P.tin);
      return 1;
    };
    const sizeOf = d => { const kw = parseFloat(getComputedStyle(root).getPropertyValue('--kw')) || 1; return Math.min(2, (devicePixelRatio || 1) * kw); };
    const fit = d => { const s = sizeOf(d); if (s === d.s) return; d.s = s; d.cv.width = Math.round(d.W * s); d.cv.height = Math.round(d.H * s);
      if (d.spill) { d.spill.width = d.cv.width; d.spill.height = d.cv.height; } };
    const draw = (d, tl) => {
      const c = d.ctx, s = d.s; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, d.cv.width, d.cv.height); c.fillStyle = d.color;
      for (const p of d.paths) {
        const P = d.P || LWP, isCore = P.core != null && p.k <= P.core;
        const gw = isCore ? P.coreFloor + (1 - P.coreFloor) * wave(tl, 0, P) : P.floor + (1 - P.floor) * wave(tl, p.k, P);   // 꽃 = 다섯 원이 한 위상(k 0)
        const hf = P.hold0 != null ? s6((p.k - P.hold0) / (P.hold1 - P.hold0)) : 1, g = LDW === 'full' ? 1 : 1 - hf * (1 - gw);   // hf 0 = 고정(13차 ?qdw=12)
        c.setTransform(s * g, 0, 0, s * g, s * p.cx * (1 - g), s * p.cy * (1 - g));   // 점 자기 중심 기준 스케일
        c.fill(p.p);
      }
      /* LINE UP 넘침 겹(spill): 같은 그림의 '회전 전 왼쪽 띠'(= 회전 뒤 위쪽 180px + 패럴랙스 여유)만 옮겨 그림. 보일 때만 */
      if (d.spill && LD === 'spill' && parseFloat(spillEl.style.getPropertyValue('--spill')) > 0) {
        const w = Math.min(d.cv.width, Math.round(320 * s)); d.sctx.clearRect(0, 0, w, d.cv.height); d.sctx.drawImage(d.cv, 0, 0, w, d.cv.height, 0, 0, w, d.cv.height); d.spillDrawn = true;
      }
    };
    const T0 = 4;   // 시각 오프셋(초) — 첫 프레임부터 모든 점이 주기 안(tl ≥ D)
    const now = () => window.LDOTS && LDOTS.freeze != null ? LDOTS.freeze : performance.now() / 1000 + T0;   // freeze = 캡처 도구 전용
    let raf = 0;
    const loop = () => { let any = false; for (const d of dotPats) if (d.paths && d.vis) { const t0 = performance.now(); draw(d, now()); const ms = performance.now() - t0; window.LDOTS.stat.n++; window.LDOTS.stat.ms += ms; window.LDOTS.stat.max = Math.max(window.LDOTS.stat.max, ms); any = true; } raf = any && LDW === 'wave' ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { for (const e of es) { const d = dotPats.find(x => x.sec === e.target); if (d) d.vis = e.isIntersecting; } kick(); }) : null;
    dotPats.forEach(d => {
      d.ctx = d.cv.getContext('2d'); if (d.spill) d.sctx = d.spill.getContext('2d');
      fetch(d.src).then(r => r.json()).then(J => {
        const R = Math.max(...J.paths.map(([, x, y]) => Math.hypot(x - d.cx, y - d.cy)));   // 가장 먼 점 = k 1
        d.paths = J.paths.map(([p, x, y]) => ({ p: new Path2D(p), cx: x, cy: y, k: Math.hypot(x - d.cx, y - d.cy) / R }));
        d.R = R; fit(d); draw(d, now());                            // 화면 밖이어도 한 번 — 들어오는 첫 프레임이 비지 않게
        if (io) io.observe(d.sec); else { d.vis = true; kick(); }
      }).catch(() => {                                              // 못 불러오면 이전 판(svg)으로 되돌림
        d.olds.forEach((im, i) => { (i ? d.spill : d.cv).replaceWith(im); if (!im.getAttribute('src')) im.src = im.dataset.src; });
      });
    });
    addEventListener('resize', () => dotPats.forEach(d => { if (d.paths) { fit(d); draw(d, now()); } }));
    /* spill 겹은 무대가 풀린 뒤에야 보인다 — 파동이 멈춘 판(full)이나 화면 밖에서 처음 보이게 될 때를 위해 한 번 더 */
    addEventListener('scroll', () => { for (const d of dotPats) if (d.spill && d.paths && !d.spillDrawn) draw(d, now()); }, { passive: true });
    const stat = { n: 0, ms: 0, max: 0 };
    const draw0 = draw;
    window.LDOTS = { pats: dotPats, P: LWP, stat, get raf() { return raf; },   // 검증용
      freeze: null, at(tl) { this.freeze = tl; dotPats.forEach(d => { if (d.paths) draw0(d, tl); }); } };   // 캡처 도구가 같은 시각을 찍을 때만
  }
  const t0 = performance.now();   // 특장점 루프가 돈다(JOIN.feat) = decode 대기가 끝났다. 8초 넘으면 그냥 붙임
  const waitReady = () => (window.JOIN && JOIN.feat) || performance.now() - t0 > 8000 ? (window.requestIdleCallback || setTimeout)(loadLower, { timeout: 1500 }) : setTimeout(waitReady, 200);
  waitReady();

  /* LINE UP 도트가 프레임 위로 넘치는 부분(피그마 178px):
     spill(기본) = 무대가 풀리기 시작한 뒤 첫 140px 동안 넘친 부분만 차오름 — 패널 윗선이 칼같이 안 보이고, CONTROL 끝 화면은 그대로
     over = 피그마 그대로 늘 넘침(CONTROL 마지막 0.16vh 에 오른쪽 아래로 미리 보임) / clip = 프레임에서 자름 / fade = 프레임 안 위쪽 240px 를 서서히 */
  /* 16차(사장님 'LINE UP 도트패턴을 좀 더 내려서 (CONTROL 도트와) 모션이 겹쳐지지 않게'): down(기본) = 무늬를 섹션 안으로 300px 내림(위 넘침 없음, 패럴랙스 ±86 에도 윗선 안 닿음). ?ldots=spill 이전 */
  const LD = ['clip', 'over', 'fade', 'spill', 'down'].includes(qs.get('ldots')) ? qs.get('ldots') : 'down';
  root.classList.add('ld-' + LD);
  const lineup = document.getElementById('lineup'), spillEl = document.getElementById('lineupSpill');
  const setSpill = () => {
    if (LD !== 'spill') return;
    const r = innerHeight - lineup.getBoundingClientRect().top, R = 140 * (parseFloat(getComputedStyle(root).getPropertyValue('--kw')) || 1);
    const u = Math.min(1, Math.max(0, r / R)), v = u * u * (3 - 2 * u);   // smoothstep — 스크롤과 같이 멈춘다(시간 이징 없음)
    spillEl.style.setProperty('--spill', v.toFixed(3));
  };
  /* ① GNB 톤 */
  const zones = [...document.querySelectorAll('.lower [data-gnb]')];
  const gnb = document.getElementById('gnb');
  let tone = null;
  const setTone = () => {
    const y = gnb.getBoundingClientRect().height / 2;   // GNB 띠 가운데 줄
    let t = null;
    for (const z of zones) { const r = z.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { t = z.dataset.gnb; break; } }
    if (t !== tone) { tone = t; if (t) root.dataset.gnb = t; else delete root.dataset.gnb; }
  };

  /* ② [5차] 스무딩 + 묶음 패럴랙스 */
  const LPAR = qs.get('lpar') === '0' ? 0 : (parseFloat(qs.get('lpar')) || 1);
  if (reduce || !LPAR) {
    /* 4차 그대로: 네이티브 1:1, 시간 등장 */
    addEventListener('scroll', setSpill, { passive: true }); addEventListener('resize', setSpill); setSpill();
    addEventListener('scroll', setTone, { passive: true }); addEventListener('resize', setTone); setTone();
    /* ② 등장 */
    const rises = [...document.querySelectorAll('.lower .rise')];
    if (!reduce && qs.get('rise') !== '0' && 'IntersectionObserver' in window) {
      root.classList.add('rise-on');
      const order = new Map(rises.map((el, i) => [el, i]));
      const io = new IntersectionObserver(entries => {
        const inn = entries.filter(e => e.isIntersecting).map(e => e.target).sort((a, b) => order.get(a) - order.get(b));
        inn.forEach((el, k) => { el.style.setProperty('--rd', Math.min(k, 5) * 120 + 'ms'); el.classList.add('is-in'); io.unobserve(el); });
      }, { rootMargin: '0px 0px -12% 0px' });
      rises.forEach(el => io.observe(el));
    }
  } else {
    root.classList.add('lpar-on');
    const LAMBDA = 6;                                   // 위쪽 엔진과 같은 값(top.js M.lambda · scene.js lambdaScroll)
    const SMOOTH = qs.get('lsm') !== '0', FADE = qs.get('lfade') !== '0';
    /* [7차 1019] CONTROL → LINE UP 이음. 사장님: "라인업 넘어가는 지점에서 한번 뚝 마지막처럼 끊기고 부드럽지 못하게 넘어가는데 부드럽게"
       원인(실측, 휠 100px 틱): CONTROL 글자가 다 나온 뒤 무대 끝까지 1.93vh 를 스크롤해도 화면이 거의 안 움직였다 — 멈춤 1vh 는 0(56프레임·917ms 연속 정지),
       4단 0.8vh 는 인물만 70px. 그리고 무대가 풀리는 순간 화면 속도가 0.05 → 15px/프레임으로 한 프레임에 붙었다(속도 계단).
       고친 방식: 장면(scene.js)은 그대로 두고, 무대가 '풀리는 방식'만 — 화면 속도 v(x)(스크롤 1px 당 무대가 올라가는 px, x = 무대 끝까지 남은 스크롤 vh)를
         ① CONTROL 글자가 다 나올 무렵(x0)부터 0 → v0 로 천천히 붙여 ② 읽는 동안 v0(아주 느린 흐름)로 유지하다 ③ x2 부터 1:1 까지 길게 가속.
       v 는 끊김 없는 곡선(smoothstep 이음 — 속도 연속, 가속도 유계, 오버슈트 0). 끝점 b 는 ∫v = b 가 되도록 풀어 b 이후 = 5차와 같은 자리(하단 배치·앵커 무변화).
       ?ctail=slow(기본) · ?ctail=ease(멈춤 없이 0 → 1 한 번에 가속하는 대안) · ?ctail=0(6차 이전 = 멈춤 뒤 1:1). reduce / ?motion=0 / ?lpar=0 은 네이티브 경로라 해당 없음 */
    const TAIL = ['slow', 'ease', '0'].includes(qs.get('ctail')) ? qs.get('ctail') : 'slow';
    const TP = { slow: { x0: -2.0, x1: -1.6, v0: .12, x2: -.7 }, ease: { x0: -1.95, x1: -1.95, v0: 0, x2: -1.95 } }[TAIL];
    const sm = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
    const vAt = (x, b) => x < TP.x1 ? TP.v0 * sm((x - TP.x0) / (TP.x1 - TP.x0 || 1)) : TP.v0 + (1 - TP.v0) * sm((x - TP.x2) / (b - TP.x2));
    const FN = 1200; let FB = 0, FT = null;                           // F 표(x0 → b, FN 칸, 사다리꼴 적분) — vh 단위라 화면 크기와 무관, 한 번만
    if (TP) {
      const build = b => { const h = (b - TP.x0) / FN, f = new Float64Array(FN + 1); let a = 0, pv = vAt(TP.x0, b);
        for (let i = 1; i <= FN; i++) { const v = vAt(TP.x0 + i * h, b); a += (pv + v) * h / 2; pv = v; f[i] = a; } return f; };
      let lo = .05, hi = 4; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (build(m)[FN] > m) lo = m; else hi = m; }   // ∫v(b) − b 는 b 에 대해 감소
      FB = (lo + hi) / 2; FT = build(FB);
    }
    const Fx = x => { if (x <= TP.x0) return 0; if (x >= FB) return x; const u = (x - TP.x0) / (FB - TP.x0) * FN, i = Math.min(FN - 1, Math.floor(u)); return FT[i] + (FT[i + 1] - FT[i]) * (u - i); };
    /* 보이는 자리 Y(Ys): x0 앞(무대 고정 구간)은 Ys 그대로 — 무대 변환 0, 하단은 화면 밑에 세워 둠. 그 뒤는 yEnd + F(x)·VH */
    const effY = ys => { if (!TP) return ys; const x = (ys - yEnd) / VH; return x <= TP.x0 ? ys : yEnd + Fx(x) * VH; };
    const invY = yv => { if (!TP || yv - yEnd >= FB * VH || yv <= yEnd) return yv;   // 앵커·포커스: 보이는 자리 yv 가 되는 scrollY (F 는 단조 증가 → 이분법)
      let lo = TP.x0, hi = FB; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (yEnd + Fx(m) * VH < yv) lo = m; else hi = m; } return yEnd + hi * VH; };
    /* 묶음 = [선택자, 깊이 k, 배경?]. k < 0 = 뒤(느리게), k > 0 = 앞(빠르게). 화면 가운데에서 0 → 피그마 배치.
       가운데에서 d(화면 px, ±1vh 로 자름) 떨어지면 k·d. 1080 화면 위·아래 끝(d ≈ ±540)에서 도트 ∓43 · 제목 ∓22 · 카드 ±16px */
    const DEF = [
      ['.lineup__dots', -.08, 1],                      // 두 겹(프레임 안 + 넘친 spill) 같이
      ['.lineup__title, .lineup__sub', -.04],
      ['.lineup__list', .03],
      ['.media__title, .media__sub', -.04],
      ['.media__scroller', .03],
      ['.pro__head, .pro__form', -.04],                // 배너 사진은 섹션에 꼭 맞는 크기라 움직이면 가장자리가 드러난다 → 띠 전체(0)에 둠
      ['.qna__dots', -.08, 1],
      ['.qna__title, .qna__sub', -.04],
      ['.qna__list', .03],
    ];
    const lower = document.getElementById('lower'), stage = document.getElementById('stage'), track = document.getElementById('track');
    const spacer = document.createElement('div'); spacer.className = 'lower-spacer'; spacer.id = 'lowerSpacer'; spacer.setAttribute('aria-hidden', 'true');
    lower.after(spacer);                                // .lower 가 고정 판이 되면서 비는 문서 높이를 채움
    const groups = DEF.map(([sel, k, bg]) => ({ els: [...document.querySelectorAll(sel)], k: k * LPAR, bg: !!bg, c: 0, top: 0, off: 0 }));
    const luDots = groups[0];
    const zoneDoc = zones.map(() => [0, 0]);
    let kw = 1, VH = window.RWD && RWD.on ? RWD.vh : innerHeight, yEnd = 0, lowerDoc = 0, lowerH = 0, lineupRel = 0, gnbMid = 0;
    let Ys = scrollY, last = 0, raf = 0;
    /* 배치 재기: 변환을 다 걷고(.lower 는 화면 0 에 놓임) 하단 안 상대 좌표(화면 px)로. 크기·트랙 높이가 바뀔 때만 */
    const measure = () => {
      lower.style.translate = ''; stage.style.translate = '';
      groups.forEach(g => g.els.forEach(el => { el.style.translate = ''; }));
      kw = parseFloat(getComputedStyle(root).getPropertyValue('--kw')) || 1; VH = window.RWD && RWD.on ? RWD.vh : innerHeight;   // 22차: 터치 기기는 큰 뷰포트 높이(주소창 무관)
      const L0 = lower.getBoundingClientRect(); lowerH = L0.height;
      spacer.style.height = lowerH + 'px';
      lowerDoc = track.getBoundingClientRect().bottom + scrollY;   // 무대 트랙이 끝나는 문서 y = 하단 맨 위(소수 px 그대로 — offsetHeight 는 반올림돼 4차보다 .44px 어긋났다)
      yEnd = lowerDoc - VH;                                                          // 무대가 풀리기 시작하는 scrollY
      lineupRel = lineup.getBoundingClientRect().top - L0.top;
      gnbMid = gnb.getBoundingClientRect().height / 2;
      zones.forEach((z, i) => { const r = z.getBoundingClientRect(); zoneDoc[i] = [r.top - L0.top + lowerDoc, r.bottom - L0.top + lowerDoc]; });
      groups.forEach(g => { let t = Infinity, b = -Infinity;
        g.els.forEach(el => { const r = el.getBoundingClientRect(); t = Math.min(t, r.top); b = Math.max(b, r.bottom); });
        g.top = t - L0.top + lowerDoc; g.c = (t + b) / 2 - L0.top + lowerDoc; });
      apply();
    };
    const s3 = u => u * u * (3 - 2 * u);
    /* 화면 픽셀에 맞춤 — 소수 px 변환은 글자를 흐리게 다시 그린다(정착 화면에서 4차 대비 글자 테가 번졌던 것). 네이티브 스크롤도 정수 px 로 움직인다 */
    const rp = v => { const r = devicePixelRatio || 1; return Math.round(v * r) / r; };
    const apply = () => {
      const Y = effY(Ys);   // [7차] 보이는 자리 — 무대 끝(CONTROL 꼬리)에선 느린 흐름 → 1:1 로 이어진 값. 그 밖에선 Ys 그대로
      /* [7차] 꼬리의 느린 흐름(스크롤 1px 당 .12px)은 화면 px 반올림이면 몇 프레임 0 → 1px 계단이 된다(트랙패드 느린 입력에서 0 프레임 11연속 실측).
         그래서 꼬리 구간에서 '움직이는 동안'만 소수 px 그대로 — 멈추는 프레임(Ys = scrollY)엔 다시 반올림해서 정착 화면 글자는 선명(5차 규칙 유지) */
      const xr = (Y - yEnd) / VH, rpm = (TP && xr > TP.x0 && xr < FB + 1 && Ys !== scrollY) ? (v => v) : rp;
      /* 무대: 트랙 안에선 0(= sticky 고정과 같은 자리), 트랙이 끝나면 Y 만큼 위로 */
      const st = -rpm(Math.max(0, Y - yEnd));
      stage.style.translate = st < -.0001 ? `0 ${st.toFixed(4)}px` : '';   // [7차] 소수 4자리 — 하단과 같은 값(이음 틈 0)
      /* 하단: 화면 y = lowerDoc − Ys. 화면 아래로 멀리 있으면(무대 구간) 화면 바로 밑 한 자리에 세워 둠(숨기진 않음 — 키보드 포커스가 닿아야 함) */
      const ly = Math.min(VH + 40, VH - rpm(Y - yEnd));   // = lowerDoc − Ys 를 무대 바닥과 같은 반올림으로 — 이음 틈 0
      lower.style.translate = `0 ${(ly / kw).toFixed(5)}px`;
      for (const g of groups) {
        const d = Math.max(-VH, Math.min(VH, g.c - Y - VH / 2)), off = rp(g.k * d);
        const tr = `0 ${(off / kw).toFixed(3)}px`;
        for (const el of g.els) el.style.translate = tr;
        if (FADE && !g.bg) { const u = Math.max(0, Math.min(1, (VH - (g.top - Y + off)) / (VH * .12))), o = s3(u);
          for (const el of g.els) el.style.opacity = o > .999 ? '' : o.toFixed(3); }
        g.off = off;
      }
      /* LINE UP 도트: 프레임 윗선은 도트가 아니라 섹션에 붙어 있어야 한다 — 도트가 o 만큼 움직이면 자르는 선을 반대로 o 만큼(요소 좌표) */
      if (LD === 'spill') {
        const o = luDots.off / kw, cut = 180 - o;
        luDots.els[0].style.clipPath = `inset(${cut.toFixed(2)}px 0 0 0)`;
        luDots.els[1].style.clipPath = `inset(0 0 ${(1056 - cut).toFixed(2)}px 0)`;
        const r = VH - (lowerDoc + lineupRel - Y), u = Math.min(1, Math.max(0, r / (140 * kw)));
        spillEl.style.setProperty('--spill', s3(u).toFixed(3));
      }
      /* GNB 톤 — 보이는 자리(Y) 기준 */
      let t = null;
      for (let i = 0; i < zones.length; i++) { const top = zoneDoc[i][0] - Y, bot = zoneDoc[i][1] - Y; if (top <= gnbMid && bot > gnbMid) { t = zones[i].dataset.gnb; break; } }
      if (t !== tone) { tone = t; if (t) root.dataset.gnb = t; else delete root.dataset.gnb; }
      if (window.__lowerHook) window.__lowerHook(Ys);   // 검증 도구용(그린 바로 그 값)
    };
    const tick = now => {
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      const y = scrollY;
      if (SMOOTH) { Ys += (y - Ys) * (1 - Math.exp(-LAMBDA * dt)); if (Math.abs(y - Ys) < .05) Ys = y; } else Ys = y;
      apply();
      if (Ys !== y) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { measure(); kick(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { Ys = scrollY; last = 0; } });   // 탭 다녀오면 따라잡기 없이 제자리
    new ResizeObserver(() => { measure(); kick(); }).observe(track);
    new ResizeObserver(() => { measure(); kick(); }).observe(lower);
    measure();
    /* 고정 판 안의 요소는 브라우저가 스스로 스크롤해 보여 주지 못한다 → 대신 해 준다
       ⓐ #앵커(GNB MEDIA·PROFESSIONALS 등): 그 섹션 맨 위가 화면 맨 위(네이티브 앵커와 같은 자리) — 이동은 같은 스무딩으로 미끄러짐
       ⓑ 키보드 포커스: 화면 밖이면 화면 40% 높이로 */
    const docTopOf = el => el.getBoundingClientRect().top - lower.getBoundingClientRect().top + lowerDoc;
    const goHash = (h, push) => { let el = null; try { el = h && h.length > 1 && document.querySelector(h); } catch (_) {}
      if (!el || !lower.contains(el)) return false;
      if (push) history.pushState(null, '', h);
      scrollTo({ top: Math.round(invY(docTopOf(el))), behavior: 'instant' }); return true; };
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a && !e.defaultPrevented && goHash(a.getAttribute('href'), true)) e.preventDefault(); });
    addEventListener('hashchange', () => goHash(location.hash, false));
    if (location.hash) addEventListener('load', () => setTimeout(() => { measure(); goHash(location.hash, false); }, 50));
    lower.addEventListener('focusin', e => { const r = e.target.getBoundingClientRect();
      if (r.top < gnbMid * 2 || r.bottom > VH) scrollTo({ top: Math.round(invY(r.top - lower.getBoundingClientRect().top + lowerDoc - VH * .4)), behavior: 'instant' }); });
    window.LOWER = { get Ys() { return Ys; }, get Y() { return effY(Ys); }, TAIL, get yEnd() { return yEnd; }, get lowerDoc() { return lowerDoc; }, groups };   // 검증용(읽기만)
  }

  /* ③ MEDIA 드래그 */
  const sc = document.getElementById('mediaScroller');
  if (sc) {
    let down = false, moved = 0, x0 = 0, s0 = 0, lastX = 0, lastT = 0, v = 0, raf = 0, k = 1;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    sc.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;   // 터치·펜 = 브라우저 기본 스크롤
      stop(); down = true; moved = 0; x0 = lastX = e.clientX; s0 = sc.scrollLeft; lastT = performance.now(); v = 0;
      k = sc.getBoundingClientRect().width / sc.clientWidth || 1;   // zoom 배율(화면 px / 요소 px)
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - x0; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5 && !sc.classList.contains('is-drag')) { sc.classList.add('is-drag'); try { sc.setPointerCapture(e.pointerId); } catch (_) {} }
      sc.scrollLeft = s0 - dx / k;
      const now = performance.now(), dt = Math.max(1, now - lastT);
      const vi = -(e.clientX - lastX) / k / dt;            // 요소 px / ms
      v = v * .6 + vi * .4; lastX = e.clientX; lastT = now;  // 마지막 몇 이벤트 평균
    });
    const up = e => {
      if (!down) return; down = false;
      if (performance.now() - lastT > 80) v = 0;            // 멈췄다 놓으면 관성 없음
      if (sc.classList.contains('is-drag')) setTimeout(() => sc.classList.remove('is-drag'), 0);
      if (reduce || Math.abs(v) < .05) return;
      { const TAU = 325, mx = sc.scrollWidth - sc.clientWidth, s = sc.scrollLeft, end = Math.min(mx, Math.max(0, s + v * TAU));
        v = (end - s) / TAU; }                                // 관성 총 이동 = v0·τ — 끝을 넘을 거면 속도를 줄여 가장자리에 미끄러져 선다(벽에 '탁' 없음)
      let t0 = performance.now(), pos = sc.scrollLeft;         // 위치는 실수로 따로 — scrollLeft 는 정수로 반올림돼 끝물의 작은 이동이 사라진다
      const tick = now => {                                 // v(t) = v0·e^(−t/τ) — 속도 연속, 오버슈트 0
        const dt = Math.min(32, now - t0); t0 = now;
        pos += v * dt; v *= Math.exp(-dt / 325); sc.scrollLeft = pos;
        if (Math.abs(v) < .002) { sc.scrollLeft = Math.round(pos); raf = 0; return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    sc.addEventListener('wheel', stop, { passive: true });
    sc.addEventListener('click', e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
    sc.addEventListener('dragstart', e => e.preventDefault());
  }

  /* PROFESSIONALS 폼: 모양만 — 전송하지 않음 */
  const f = document.getElementById('proForm');
  if (f) f.addEventListener('submit', e => e.preventDefault());
})();
