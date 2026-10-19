/* [22차 1019] 반응형 — 춘봉. 사장님: "이걸 이제 해상도에 따라 변형되게 해줄수 있어? 반응형으로"
   top.js · scene.js · lower.js 보다 먼저 실행된다. 엔진은 여기 값(window.RWD)을 읽기만 하고, 모션 문법(순서·타이밍·스크롤 진행)은 그대로다.

   무대(상단·특장점) — 1920×1080 '상자'는 그대로 두고, 화면이 상자를 어떻게 보느냐만 바꾼다.
     K = min(cover, vw / 1000, vh / 960)
       · cover = max(vw/1920, vh/1080) — 지금(21차까지) 방식. 1920·1440·1280·2560·1180 가로는 여기서 끝(= 지금과 같은 화면, 차이 0).
       · vw/1000 — 창 폭이 세계 1000px(구 958 + 여유) 아래로 좁아지지 않게(세로 화면). 그만큼 상자 위아래가 넓게 보인다(Y 연장).
       · vh/960  — 창 높이가 세계 960px 아래로 낮아지지 않게(초광폭 3440). 그만큼 상자 양옆이 넓게 보인다(X 연장).
     창이 1300 보다 좁으면(narrow) 카메라가 장면의 주인공을 따라 좌우로 시선을 옮긴다(pan): 01 얼굴 → 02 문장 → 03·특장점 가운데.
       pan 은 카메라(cam)의 매끈한 함수(s6 이음) — 스크롤이 멈추면 같이 멈추고, 되감으면 되돌아간다. 시간 모션 없음.
     글자는 화면 px 바닥을 둔다(세로 폰에서 상자째 줄면 본문이 7px 가 되므로): 크기 배율 = max(1, 바닥 / (원래 크기 · K)).
   하단·GNB·플로팅 — 폭 1200 미만은 흐름 배치(flow): 하단은 zoom 1 의 실제 px 레이아웃(style.css 22차 블록), GNB 는 로고 + 메뉴 버튼, 플로팅은 아래 가운데 알약.
   ?rwd=0 → 전부 끔(21차 그대로, 비교용). */
(() => {
  'use strict';
  const qs = new URLSearchParams(location.search);
  const root = document.documentElement;
  const OFF = qs.get('rwd') === '0';
  const W = 1920, H = 1080, WMIN = 1000, HMIN = 960, NARROW = 1300, FLOW = 1200;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const s6 = t => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * t * (t * (t * 6 - 15) + 10); };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* 화면 높이: 터치 기기는 주소창이 접혔다 펴질 때마다 innerHeight 가 바뀐다 → 큰 뷰포트(100lvh = CSS 100vh)로 고정.
     트랙 높이(100vh 단위)와 진행도(scrollY / VH)가 같은 자를 쓰게 되어, 주소창이 움직여도 장면이 튀지 않는다. 데스크톱 = innerHeight 그대로 */
  let probe = null;
  const vhNow = () => {
    if (OFF || !coarse) return innerHeight;
    if (!probe) { probe = document.createElement('div'); probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe); }
    return probe.offsetHeight || innerHeight;
  };

  const R = window.RWD = { on: !OFF, gen: 0, K: 1, vh: innerHeight, vw: 1920, kw: 1, stage: false, ext: false, narrow: false, flow: false, phone: false,
    X: 0, Y: 0, Ww: 1920, Hw: 1080, m: 0, R: null, fx: 960, frame: null };

  /* pan 기준점(카메라 cam → 창 가운데 세계 x). narrow 일 때만 */
  let PAN = null;
  function compute() {
    const vw = root.clientWidth, vh = vhNow();
    const Kc = Math.max(vw / W, vh / H);
    const K = OFF ? Kc : Math.min(Kc, vw / WMIN, vh / HMIN);
    const ext = !OFF && K < Kc - 1e-9;
    const Ww = vw / K, Hw = vh / K;
    const narrow = !OFF && Ww < NARROW;
    Object.assign(R, { gen: R.gen + 1, K, vh, vw, ext, narrow, stage: ext || narrow, Ww, Hw,
      X: ext ? Math.max(0, (Ww - W) / 2) : 0, Y: ext ? Math.max(0, (Hw - H) / 2) : 0,
      flow: !OFF && vw < FLOW, kw: !OFF && vw < FLOW ? 1 : vw / W,
      phone: !OFF && Math.min(screen.width, screen.height) < 600 });
    R.m = Math.max(24, vw * .06) / K;   // 화면 가장자리 여백(세계 px) — 폰 24px · 태블릿 6%
    /* 캔버스(도트·지면)가 그려야 할 영역(상자 좌표). 무대 모드가 아니면 상자 그대로(= 지금과 같은 크기의 캔버스) */
    R.R = R.stage ? { x0: Math.floor(960 - Ww / 2 - 16), x1: Math.ceil(960 + Ww / 2 + 16), y0: Math.floor(Math.min(0, 540 - Hw / 2 - 16)), y1: Math.ceil(Math.max(H, 540 + Hw / 2 + 16)) } : null;
    /* 글자 바닥(화면 px) */
    const sc = (minPx, base) => OFF ? 1 : Math.max(1, minPx / (base * K));
    const ts = { hs: sc(40, 87.678), bs: sc(15, 36), ns: sc(34, 87), fts: sc(32, 68), fss: sc(15.5, 24), fbs: sc(13, 18) };
    const any = Object.values(ts).some(v => v > 1.0001);
    for (const k in ts) root.style.setProperty('--' + k, ts[k].toFixed(4));
    /* narrow 자리: 01 얼굴(세계 x 1040~1720, 가운데 1300) · 02 문장(328 그대로, 왼쪽 여백 m) · 03 '이젠' 은 특장점과 같은 가운데 창의 왼쪽 여백 */
    const lim = x => clamp(x, Ww / 2, W - Ww / 2);
    /* 25차(사장님 '모바일일 때 모델이 화면에 잘려도 되니 오른쪽으로 붙여주고'): 폰 세로(폭 < 768)는 얼굴(세계 x 1040~1720)을 창 오른쪽 절반에 두고 오른쪽에서 자름 →
       창 왼쪽 절반(세계 540~1040)이 맑은 하늘 — '산소 ON, ibex' 를 데스크톱과 같은 높이(404)에 그 하늘 위로. 태블릿 세로는 22차 그대로(얼굴 가운데, 히어로 얼굴 아래) */
    R.mobile = !OFF && vw < 768;
    const f01 = lim(narrow && R.mobile ? 1040 : 1300), f02 = lim(328 - R.m + Ww / 2), f03 = 960;
    PAN = narrow ? [[0, f01], [1000, f02], [2124, f03], [3204, 960]] : null;
    root.style.setProperty('--heroL', (f01 - Ww / 2 + R.m).toFixed(1) + 'px');
    root.style.setProperty('--nowL', (f03 - Ww / 2 + R.m).toFixed(1) + 'px');
    root.style.setProperty('--ww', Ww.toFixed(1) + 'px');
    root.style.setProperty('--wm', R.m.toFixed(1) + 'px');
    root.style.setProperty('--vh', vh + 'px');
    if (R.R) for (const k of ['x0', 'x1', 'y0', 'y1']) root.style.setProperty('--r' + k, R.R[k] + 'px');
    root.style.setProperty('--ex', R.X.toFixed(1) + 'px');
    /* 하단 흐름 배치의 카드 배율: LINE UP 카드(피그마 480.33 폭) · MEDIA 카드(385 폭) — 사진 크롭·회전은 피그마 px 그대로 두고 통째로 줄인다 */
    if (R.flow) {
      const pad = clamp(vw * .06, 20, 56);
      const swipe = vw < 1024;
      root.style.setProperty('--lz', (swipe ? Math.min(.74 * vw, 340) / 480.33 : (vw - 2 * pad) / 1521).toFixed(4));
      root.style.setProperty('--mz', (vw < 768 ? Math.min(.72 * vw, 300) / 385 : .8).toFixed(4));
      root.classList.toggle('rwd-swipe', swipe);
    } else root.classList.remove('rwd-swipe');
    root.classList.toggle('rwd-stage', R.stage);
    root.classList.toggle('rwd-ext', R.ext);
    root.classList.toggle('rwd-narrow', narrow);
    root.classList.toggle('rwd-wide', R.X > 0);
    root.classList.toggle('rwd-ts', any);
    root.classList.toggle('rwd-flow', R.flow);
    root.classList.toggle('rwd-mobile', !OFF && vw < 768);
    if (!R.flow) closeMenu();
    if (!R.stage) clearView();
    wideClouds();
    place(lastCam);
  }

  /* 무대 배치: 상자 가운데(540)는 화면 가운데, 세계 x fx 는 화면 가운데 */
  const view = document.getElementById('view');
  let lastCam = 0;
  const panAt = cam => {
    if (!PAN) return 960;
    if (cam <= PAN[0][0]) return PAN[0][1];
    for (let i = 0; i < PAN.length - 1; i++) { const [c0, a] = PAN[i], [c1, b] = PAN[i + 1]; if (cam <= c1) return a + (b - a) * s6((cam - c0) / (c1 - c0)); }
    return PAN[PAN.length - 1][1];
  };
  function place(cam) {
    if (!R.stage || !view) return;
    R.fx = panAt(cam);
    const tx = R.vw / 2 - R.fx * R.K, ty = R.vh / 2 - 540 * R.K;
    view.style.transform = `translate3d(${tx.toFixed(3)}px,${ty.toFixed(3)}px,0) scale(${R.K.toFixed(6)})`;
  }
  function clearView() { if (view) view.style.transform = ''; }

  /* 초광폭: 아래 구름(좌우가 불투명하게 잘린 그림)을 좌우로 거울 복제 — 이음선이 거울면이라 끊김이 없다. 변환·불투명도는 원본을 매 프레임 따라감 */
  const cB = document.getElementById('cloudB'); let clones = null;
  function wideClouds() {
    const need = R.X > 0;
    if (need && !clones && cB) {
      clones = [-1, 1].map(side => { const c = cB.cloneNode(); c.removeAttribute('id'); c.classList.add('cloud--mirror'); c.setAttribute('aria-hidden', 'true');
        c.style.left = (side * 1920) + 'px'; cB.after(c); return c; });
    }
    if (clones) clones.forEach(c => { c.style.display = need ? '' : 'none'; });
  }

  /* top.js 가 매 프레임 끝에 부른다(그 프레임의 카메라로 — 한 프레임 늦는 일 없음) */
  /* 좁은 창: 히어로 글자는 얼굴 아래로 옮겨서 데스크톱보다 늦게 화면을 떠난다(위로 넓게 보이는 세로 화면이면 02 에서도 위에 남음).
     데스크톱에서 화면 위로 빠지는 구간(cam ≈ 250~650)에 같이 흐려지게 — 모델 퇴장(cam 120~800)과 같은 문법(스크롤 연동, s6) */
  const hero = document.getElementById('copyHero');
  R.frame = cam => {
    lastCam = cam;
    /* 25차: 폰은 히어로가 데스크톱처럼 위로 빠져 나가므로 흐림 없음 */
    if (hero) { const o = R.narrow && !R.mobile ? 1 - s6((cam - 250) / 400) : 1; if (o !== hero._o) { hero._o = o; hero.style.opacity = o >= 1 ? '' : o.toFixed(3); } }
    if (R.stage) place(cam);
    if (clones && R.X > 0) { const t = cB.style.transform, o = cB.style.opacity; clones.forEach(c => { c.style.transform = t + ' scaleX(-1)'; c.style.opacity = o; }); }
  };

  /* GNB 메뉴(흐름 배치에서만 보이는 버튼) */
  const btn = document.getElementById('gnbMenu'), nav = document.getElementById('gnbNav');
  function closeMenu() { if (!root.classList.contains('menu-open')) return; root.classList.remove('menu-open'); if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', '메뉴 열기'); } }
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = !root.classList.contains('menu-open');
      root.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      if (open) { const a = nav.querySelector('a'); a && a.focus({ preventScroll: true }); }
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { closeMenu(); btn.focus(); } });
  }

  compute();
  /* 창 크기·회전: 엔진(top/scene/lower)의 resize 보다 먼저 돈다(이 파일이 먼저 등록). 터치 기기에서 높이만 조금 바뀐 것(주소창)은 vhNow 가 같아 결과가 같다 */
  let lastKey = '';
  addEventListener('resize', () => { const key = root.clientWidth + 'x' + vhNow(); if (key === lastKey) return; lastKey = key; compute(); });
  lastKey = root.clientWidth + 'x' + vhNow();
  if (OFF) root.classList.add('rwd-off');
})();
