/* [통합 1019] 특장점 판(퍼블리싱-특장점-1015 37차 js/scene.js) 복사본. 바꾼 곳은 전부 '[통합]' 표시:
   에셋 경로 assets/feat/ · 스크롤 S = scrollY/vh − 상단 PMAX(상단 다리가 끝난 곳이 이 엔진의 0) · 트랙 높이 = (PMAX + SMAX + 1)·100vh
   · 로드 시퀀스(시간 2.6s)를 상단 다리 진행 bu 로 대체: 호 1·2 = 상단 판 다리와 같은 창·거리 · 첫 타이틀 = 37차 규칙의 '둘째 호 자리'를 다리에서 지날 때
   · 하늘(skyBase)은 다리 동안 카메라와 같이 올라와 상단 하늘의 아랫단이 된다(교체 없음) · 호 도트는 다리(03 이후)부터.
   ibex 특장점 4섹션 v2 — 풀화면 고정 무대 엔진 (춘봉 2026-10-15). 바닐라, 외부 의존 없음.
   무대 1920×1080 고정(카메라 고정). 스크롤 트랙 500vh, 진행도 P = scrollY/vh (0~4), 단계 n = P 의 정수부.
   0 로드   : 원들이 아래에서 천천히 올라와 모인다 — 맨 위 큰 호가 빠르고 아래로 갈수록 느리게(?load=4|6 = 총 길이 초). 그 뒤 OXYGEN 글자. 도트 없음(사장님 2차: 추후).
   1 (0→1)  : OXYGEN 글자 퇴장. 위 호부터 차례로 위로 빠져나가고(각 호 LIFT=2509.6 만큼), 맨 아래 구가 화면 가운데(540)에 오면 PRESSURE 글자.
   v21: 지면 띠 i 눌림 = q·.85·k_i·Δ(x), k = 원본 띠별 골 깊이비(위 깊고 아래 얕게). ?press=lock = 양끝 두께 84 고정 대안.
   2 (1→2)  : PRESSURE 퇴장. 뒤 호들 위로 옅어져 사라짐. 구는 r481→303 으로 작아지며 400 까지 떠올랐다가 지면(평평한 선 6줄, WebGL)으로 떨어진다.
              닿으면 지면이 눌린다 — 지면 변형량 q 는 구의 침투 깊이를 목표로 하는 스프링(ζ.6 ω11, 1회 오버슈트). q=1 = 피그마 PROGRAM 그림 그대로(리본 텍스처 1:1).
   3 (2→3)  : 구가 위로 사라지며 같은 구간에 인물이 아래에서 위로 스르륵 올라온다(교차). 지면은 옅어짐. 인물 부유·글로우 한 위상 루프.
   4 (3→4)  : 인물이 계속 위로 올라가며(540) CONTROL 글자 — 한 화면 안에서.
   스크롤 값은 dt lerp λ8 로 스무딩(도트 λ5). reduced-motion / ?motion=0 : 로드·루프·스프링 없이 상태만. */
(() => {
  'use strict';
  const W = 1920, H = 1080, PROG_Y = 3983;
  const M = {
    lambdaScroll: 6, lambdaDots: 5,              // 스크롤 스무딩 λ 8→6: 꼬리가 길게
    stage: [2, 1, 1, .5],                        // 단계 길이(vh) 기본값 — 실제론 M.scale 배(기본 2.0 → 4·2·2·1vh). 멈춤 구간은 그대로
    dwell: 1.0,                                  // 글자 지점마다 멈춤 구간(vh): OXYGEN(0) · PRESSURE(1단 끝) · PROGRAM(2단 끝) · CONTROL(3단 끝). 그 안에선 스크롤해도 아무것도 안 움직인다(네이티브 스크롤, JS 이동 없음)
    speedA: { lateStart: .42, fastSpan: .52, earlyStart: 0, slowSpan: .96 },   // v29(사장님 '원래 판이 낫다' → 26차 값 복귀, ?s1=27 은 .62 판). v28 중간값 .52/.45/.88: v26 .42/.52/.96 과 v27 .62/.38/.80 의 중간. v27(사장님 27차 '위 공 아래 공 모션이 따로'): 위 큰 호가 먼저 0~.80, 아래 작은 호·구는 .62 에 출발해 빠르게 따라붙음(춘봉 픽). ?s1=55 대안(.55/.45). v26: .42/.52/0/.96
    rest: { x: 964, gap: 90, rowY: 200, bottomStep: 40 },   // PRESSURE 정지 자세: 호 n 의 왼쪽 가장자리가 행 y=200 에서 구보다 90n 바깥, 바닥은 구 바닥보다 40n 위(구 뒤로 숨음) — 두 조건으로 중심(x 964 수직선)·반지름이 정해진다 → 옆구리 띠 폭 균일   // 1단 속도차: A = 큰 호(k=0) 늦게 출발·빠르게, 작은 호(k=7)·구 일찍 출발·느리게 (B 는 반대). 끝 자세는 동일
    ringsOut: [0, .22], ringsShrink: .85,         // 사장님 11차: 바닥이 올라오기 시작(u≈.25)하기 전에 호가 없어야 → 0~.22        // 2단: 뒤 호 8개는 정지 자세 그대로 구 정지 중심(964,540) 앵커로 살짝(1→.92) 줄며 알파로 사라진다(0~.35, 상승 없음 — 사장님 9차 — 사장님 10차: 더 줄이며 .85). ?ring=0.78 대안
    shrink: [0, .35], hoverY: 200,               // 2단 ①: 구 축소 + 200 까지 떠오름(바닥 평선 577 보다 위 — 눌림 0)
    fall: [.5, .85], fallPow: 1.6,               // 2단 ③: 낙하(스크롤 묶음) → 닿으면 쿠션
    offY: 130.6,                                 // PROGRAM 장면 세로 가운데: 구 안착 y = 409.4+130.6 = 540
    groundIn: [.1, .5], groundSlide: 620,        // 2단 ②: 평평한 바닥(q=0)이 화면 아래(+620)에서 위로 올라온다
    // v21(사장님 20차 '가운데는 더 눌리고 아래는 일정'): 띠 i 의 변위 = q·amp·k_i·Δ(x). k_i = 피그마 PROGRAM 그림 띠별 골 깊이(가장자리→가운데) 실측비 541·490·425·356·290·235 / 541
    //   평평(q=0)은 두께 84 균일. 눌리면 가운데는 위 띠가 얇아지고(최소 ≈45) 양옆은 밀려 올라 두꺼워진다(≈110) — 쿠션 부피 보존. ?press=lock = 양끝 84 고정·가운데만 감쇠(대안)
    ground: { T: 84, amp: .85, k: [1, .906, .786, .658, .536, .434], kLock: [1, .91, .82, .73, .64, .55] },
    spring: { zeta: .6, omega: 11 },             // 지면 눌림 스프링 (침대: 1회 작은 오버슈트)
    orbSpring: { zeta: .85, omega: 16 },         // 구 위치 추종(착지 때 아주 작은 정착)
    // v26(사장님 26차 '이미지 겹치고 도트도 미리 나와서 겹치고 … 안 겹치고 부드럽게'): 3단 = PROGRAM 먼저 다 빠짐(0~.42) → 그 뒤 인물(.40~) → CONTROL 도트(.54~). 두 장면 알파 합 ≤ 1
    orbExit: [0, .5], orbExitLift: 30, orbFade: [0, .5], orbExitScale: .92,  // v27(사장님 27차 '구는 천천히, 위아래로 흩어지지 않게'): 제자리에서 천천히 페이드 + .92 로 살짝 축소, 위로 30 만 (v26: 900 위로 0~.45)
    groundOut: [0, .38], groundLift: 0, progToneOut: [0, .42],   // v27: 지면·톤 제자리 페이드(아래로 이동 0) — v26: 아래로 120   // 3단: 지면은 아래로 120 빠지며 옅어짐, 톤도 같이 (v25: [0,.5]·위로 60, 톤은 인물과 교차)
    controlIn: [.38, .58], controlRise: [.36, .75], controlFrom: 640,   // v27: 지면이 다 빠진 .38 부터(이때 구 알파 ≈.14 — 구와만 잠깐 겹침)    // 3단: 지면이 다 빠진 뒤(.40) 인물이 아래(+640)에서 올라옴 (v25: [0,.35]·[0,.6] — 지면과 이중 노출)
    controlLiftIn: [.7, .97], controlLiftIn2: 260,            // 3단 뒤: 올라오자마자 살짝 더 올라가며(260) 글자 → 3단 끝에서 멈춤
    controlLift: 70, controlLiftWin: [0, .9],   // 4단(0.5vh): 조금 더 올라감. 통합 2차(사장님 '한번더 스크롤 내리면 텍스트랑 이미지랑 너무 간격이 많이 벌어지던데 … 아주 약간만'): 300→70, ?clift=300 이전
    text: { oxyOut: [0, .1], pressIn: [.86, 1], pressOut: [0, .15], progIn: [.8, .97], progOut: [0, .15], ctrlIn: [.7, .92], lift: 16, loadAt: .001 },   // 순차 등장 창을 조금 넓힘
    load: { total: 2.6, outerFrac: .42, innerFrac: 1.0, startSpread: .18 },   // 총 2.6초(10-16 사장님 "조금만 더 느리게", 전 2초), ?load=3 대안   // 총 길이(초). 호1 은 total·outerFrac, 안쪽으로 갈수록 innerFrac 까지 길어진다. 출발은 startSpread·total 안에서 순차
    control: { period: 7, float: 7 }
  };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const win = (w, x) => ss(w[0], w[1], x);
  const s6 = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };   // smootherstep: 양끝 가속도 0 — 더 완만한 꼬리
  const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const qs = new URLSearchParams(location.search);
  const noMotion = qs.get('motion') === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (qs.get('load')) M.load.total = parseFloat(qs.get('load')) || 2;
  M.speed = (qs.get('speed') || 'B').toUpperCase();   // 1단 속도차: 기본 B(사장님 6차 픽) = 큰 호 일찍·느리게, 작은 호·구 늦게·빠르게. ?speed=A 대안
  M.scale = parseFloat(qs.get('scale')) || 1.6;
  M.pressLock = qs.get('press') === 'lock';
  if (qs.get('s1') === '55') { M.speedA.lateStart = .55; M.speedA.fastSpan = .45; }
  if (qs.get('s1') === '26') Object.assign(M.speedA, { lateStart: .42, fastSpan: .52, slowSpan: .96 });   // 비교용: 26차(원래) 시차
  M.orb1Mix = qs.get('orb1') === 'old' ? 1 : qs.get('orb1') === 'new' ? 0 : qs.get('orb1') ? parseFloat(qs.get('orb1')) : .5;   // v31(사장님 '지금과 전거의 중간'): 1단 구 지연 = 30차(0)와 29차(1)의 절반. ?orb1=old|new|0~1   // v30: 29차 구 동작(1단에도 위치 스프링 — 호보다 뒤처짐) 비교용
  if (qs.get('s1') === '27') Object.assign(M.speedA, { lateStart: .62, fastSpan: .38, slowSpan: .80 });   // 비교용: 27차 시차
  // v22 호마다 도트 띠: rows 줄·간격 38·림 +22. 점 5.5→2.2, 알파 .30→×.35. 바깥 원 림까지 거리 fade[0]~[1] 에서 사라짐. lag = 원마다 위상 지연(안→밖) — 사장님 23차 '일정하게 같이' → 기본 0(모든 원 같은 박자), ?lag=0.1 대안
  M.dots = { rows: parseInt(qs.get('rows')) || 4, gap: 38, off: 22, sizeIn: 5.5, sizeOut: 2.2, alpha: .3, alphaOut: .35, fade: [10, 40], lag: qs.get('lag') ? parseFloat(qs.get('lag')) : 0, freeze: qs.get('dotfreeze') === '1', fixT: qs.get('dott') !== null ? parseFloat(qs.get('dott')) : null,
    progIn: [.85, 1], progOut: [0, .3], ctrlIn: [.38, .72],   // v33(사장님 '구가 옅게 사라지고 인물 머리가 들어올 때부터 도트가 슬며시'): .52→.38(인물 등장과 같이 시작, 끝 .72 그대로라 더 천천히 차오름). ?cin=52 이전. v24 PROGRAM 도트 창(2단·3단) / v26 CONTROL 도트 = 인물 등장 70% 이후
    ctrl: { cx: 980, cy: 500, rx: 600, ry: 600, tilt: 0, rows: 12 },   // v25 CONTROL(사장님 25차 '동그란 원으로, 모델을 살짝 덮어도'): 정원 — 글로우 중심 근처, r600 = 몸통·빛·발끝까지 감쌈, 12줄이면 화면 양옆에 닿음 (v24 타원: 990,495 700×370 −18°)
    boost: 1.35,
    // v28 하늘 채움(PROGRAM): a = 첫 옅은 줄 최종 알파(흰색), far = 위끝에서 a 의 배율, span = 그 거리(px), rad 2.0→1.6, relax = 지면 휨이 풀리는 거리, orbFade = 구 띠 경계에서 스며드는 폭. ?sky=0 끔(27차), ?sky=.12/.20 대안
    sky: { a: qs.get('sky') !== null ? parseFloat(qs.get('sky')) : .16, far: .55, span: 600, rad: 2.2, radFar: 2.0, relax: 160, orbFade: 70 } };   // v25: PROGRAM·CONTROL 만 알파 ×1.35 (.30→.405) — 밝은 배경에 묻히지 않게   // ?dott=초 = 검증용 시각 고정
  // v29(사장님 29차 '네 번째 섹션 도트의 등장 모션 — 촤악 펼쳐진다던가 인트로'): CONTROL 도트 등장 = 스크롤 창(ctrlIn)이 열리면 시간 인트로가 돈다. 진행 e = min(시간 이징, 스크롤 창) → 빠르게 스크롤해도 펼쳐짐이 보이고, 되감으면 스크롤 따라 접힌다.
  //   a 파문(기본 후보): 림에서 바깥으로 물결 앞선이 지나가며 줄이 차례로 피어남(제자리 안쪽 slide px 에서 밀려 나오며 커짐) / b 둘레: 맨 위에서 양쪽으로 원 둘레를 따라 촤르륵, 바깥 줄일수록 살짝 늦게 / c 아코디언: 림에 접혀 있던 줄 간격이 바깥으로 펼쳐짐 / 0 = 28차(옅게 페이드)
  if (qs.get('clift')) M.controlLift = parseFloat(qs.get('clift'));
  if (qs.get('cin') === '52') M.dots.ctrlIn = [.52, .72];   // v33 비교: 이전 시작점
  M.intro = { mode: (qs.get('intro') || 'a').toLowerCase(), a: { dur: 1.5, band: 150, slide: 34 }, b: { dur: 1.7, band: .55, lag: .045 }, c: { dur: 1.3, from: .22 } };
  if (qs.get('idur')) M.intro[M.intro.mode] && (M.intro[M.intro.mode].dur = parseFloat(qs.get('idur')));
  if (qs.get('ring')) M.ringsShrink = parseFloat(qs.get('ring')) || .85;
  { const v = (qs.get('step') || 'C').toUpperCase();   // 구 주위 도트(사장님 16차 '움직이고 있어야'): C 기본 = 스텝 이동 .45 + 멈춤 .5(초당 한 칸, 톡·톡·톡) / FLOW = 멈춤 없이 연속, 한 칸 1.6s / A·B 는 14차 안
    M.dotStep = v === 'FLOW' ? { move: 1.6, hold: 0 } : v === 'A' ? { move: .35, hold: 1.2 } : v === 'B' ? { move: .5, hold: 2.0 } : { move: .45, hold: .5 }; }
  // v25(사장님 25차 '딱딱 바뀌는 거 말고 슬슬 계속 지속적으로 퍼져나가는'): 기본 = 연속 흐름(멈춤 없이 선형, 한 칸 M.dots flow 초). ?dots=step = 24차 C 스텝 그대로
  M.dotMode = qs.get('dots') === 'step' ? 'step' : 'flow'; if (M.dotMode === 'flow') M.dotStep = { move: parseFloat(qs.get('flow')) || 1.5, hold: 0 };   /* 통합 7차(사장님 '도트모션 속도를 살짝만 빠르게'): 2.2→1.8s → 9차('좀더 빠르면 좋을듯 1.5로 해볼까?') 1.5s. ?flow=1.8 / ?flow=2.2 이전 */   // 한 칸 2.2s(춘봉 픽, ?flow=2.8 대안)        // 전환 구간 스크롤 길이 배율 — 기본 1.6(사장님 7차 픽), ?scale=2 대안
  document.documentElement.classList.add(noMotion ? 'no-motion' : 'has-motion');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* 22차: 캔버스(도트 A·C, 지면)가 그리는 영역 = 상자(1920×1080)가 기본. 세로·초광폭 화면은 rwd.js 가 상자 밖으로 넓힌 영역(RWD.R)을 준다 */
  const R0 = { x0: 0, y0: 0, x1: W, y1: H };
  function rgn() { return (window.RWD && RWD.on && RWD.R) || R0; }
  function styleRgn(cv, r) { if (r === R0) { cv.style.left = cv.style.top = cv.style.width = cv.style.height = ''; return; }
    cv.style.left = r.x0 + 'px'; cv.style.top = r.y0 + 'px'; cv.style.width = (r.x1 - r.x0) + 'px'; cv.style.height = (r.y1 - r.y0) + 'px'; }
  const CVS = [];
  function placeCv(cv) { const r = rgn(), s = r === R0 ? dpr : Math.min(2, K * (window.devicePixelRatio || 1)), w = Math.round((r.x1 - r.x0) * s), h = Math.round((r.y1 - r.y0) * s);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; cv._clr = false; } cv._s = s; cv._r = r; styleRgn(cv, r); }
  /* 23차: 소프트웨어 GL(SwiftShader·GPU 블록리스트 등)이면 지면 WebGL 을 반 해상도로 — CPU 가 전체 화면 셰이더를 그리고 되읽는 비용이 첫 등장 때 120ms+ 멈춤이 된다. 실제 GPU 는 그대로. ?softgl=0 끔 */
  const SOFTGL = qs.get('softgl') !== '0' && (() => { try { const g = document.createElement('canvas').getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info');
    const r = e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ''; const lose = g && g.getExtension('WEBGL_lose_context'); lose && lose.loseContext(); return /swiftshader|llvmpipe|software|basic render/i.test(r); } catch (_) { return false; } })();
  /* ---------- 레이아웃: cover 스케일 ---------- */
  let K = 1, VH = 1080;
  function layout() {
    const cw = document.documentElement.clientWidth, ch = window.innerHeight;
    K = Math.max(cw / W, ch / H); VH = ch;
    if (window.RWD && RWD.on) { K = RWD.K; VH = RWD.vh; }   // 22차 반응형(js/rwd.js)
    document.documentElement.style.setProperty('--k', K);
    const gl = document.getElementById('gl'); const s = clamp(K * dpr, .5, 2) * (SOFTGL ? .5 : 1), rg = rgn();   // 23차: 소프트웨어 GL 이면 지면만 반 해상도
    const gw = Math.round((rg.x1 - rg.x0) * s), gh = Math.round((rg.y1 - rg.y0) * s);
    if (gl.width !== gw || gl.height !== gh) { gl.width = gw; gl.height = gh; }
    styleRgn(gl, rg);
    CVS.forEach(placeCv);
  }
  layout(); addEventListener('resize', layout);

  const img = (L, cls) => { const el = new Image(); el.className = cls; el.src = 'assets/feat/' + L.file; el.alt = ''; el.decoding = 'async';
    el.style.left = L.x + 'px'; el.style.top = L.y + 'px'; el.style.width = L.w + 'px'; el.style.height = L.h + 'px'; return el; };
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'assets/feat/' + src; });

  /* [통합] 트랙: 상단(0 ~ PMAX) + 특장점(SEG, 원 판과 같은 멈춤·단계) — 한 트랙·한 무대. 원 판 engine() 안의 SEG 계산을 그대로 앞으로 꺼냄 */
  const JOIN = window.JOIN = window.JOIN || {};
  M.stage = M.stage.map(v => v * M.scale);
  const SEG = []; { let s = 0; const push = (len, p0, p1) => { SEG.push({ s0: s, s1: s + len, p0, p1 }); s += len; };
    push(M.dwell, 0, 0); push(M.stage[0], 0, M.stage[0]); push(M.dwell, M.stage[0], M.stage[0]);
    const b2 = M.stage[0] + M.stage[1]; push(M.stage[1], M.stage[0], b2); push(M.dwell, b2, b2);
    const b3 = b2 + M.stage[2]; push(M.stage[2], b2, b3); push(M.dwell, b3, b3); push(M.stage[3], b3, b3 + M.stage[3]); }
  const SMAX = SEG[SEG.length - 1].s1;
  const PMAX0 = () => JOIN.PMAX || 0;
  document.getElementById('track').style.height = (PMAX0() + SMAX + 1) * 100 + 'vh';
  JOIN.SMAX = SMAX;
  // [통합] 이음 대안: ?bdots=land = 호 도트를 호가 내려앉는 끝(.86~1)에 페이드인(기본 ride = 원 판 로드처럼 호와 같이 올라옴)
  const BDOTS = qs.get('bdots') === 'land' ? 'land' : 'ride';

  fetch('assets/feat/layers.json').then(r => r.json()).then(build).catch(e => { console.error(e); document.documentElement.classList.add('is-ready'); });

  async function build(L) {
    document.getElementById('skyBase').appendChild(img(L.skyBase, 'layer'));
    // PROGRAM 배경 입체감 톤(사장님 15차 요청): 그림 교체 없이 반투명 그라데이션 한 장 — 위는 그대로, 지평선(띠)으로 갈수록 깊은 블루 + 구 뒤 은은한 빛
    const progTone = document.createElement('div'); progTone.className = 'progTone'; document.getElementById('skyBase').after(progTone);
    const arcsEl = document.getElementById('arcs'), discs = [];
    // 원 9개 = 실측 원 값 그대로(사장님 5차 기준: 피그마 구조). 텍스처 = 정원을 3072px 로 크게 만든 한 장(orb-hires)을 반지름에 맞춰 줄여 쓴다(큰 호는 ×1.4, 작은 호는 ×0.5 → 블록·번짐 없음)
    const MEAS = [[953, 1775, 1411], [961, 2154, 1294], [968, 2369, 1120], [965, 2484, 951], [966, 2598, 835], [968, 2672, 711], [967, 2804, 647], [966, 2917, 550], [964, 3048, 479]];
    const HT = L.orbHires, discImg = (cx, cy, r, cls) => { const sc = r / HT.rpx, w = HT.size * sc; return img({ file: HT.file, x: cx - w / 2, y: cy - w / 2, w, h: w }, cls); };
    // 호 = v10 생김새(정원 구운 림 텍스처를 반지름에 맞춰 줄여 씀) 그대로, 해상도만: 화면 지름 2r·DPR 이 2600 을 넘으면 6144 판(사장님 10차)
    // 텍스처 상한 4096(사장님 12차: 6144 가 실제 GPU 에서 사각 조각으로 깨짐)
    const discImgHR = (cx, cy, r, cls) => { const T = (2 * r * dpr * (rgn() === R0 ? 1 : K) > 2600 && L.orbHires4096) ? L.orbHires4096 : HT; const sc = r / T.rpx, w = T.size * sc; return img({ file: T.file, x: cx - w / 2, y: cy - w / 2, w, h: w }, cls); };
    // ---- 도트 레이어 A(사장님 12차: 화면 한 장, 통째로 변형). 흰 30%, 간격 38, 줄마다 반 칸 엇갈림, 바깥일수록 작게. 점은 제자리, 줄 단위 안→밖 파동만(CSS dotwave 7s).
    //      그룹 P = PRESSURE 정지 기하(구 아래쪽 6줄 + 호 n 림 바깥 2줄, 안쪽 원에 덮이는 점 제거) / 그룹 O = OXYGEN 기하(실측 호1 위 4줄·호2 2줄, 좌표는 −LIFT) — 두 그룹이 1단에서 교차(한 SVG 안)
    const SVGNS = 'http://www.w3.org/2000/svg', DOT_GAP = 38, DOT_ROWS = 28;
    const dotSize = g => lerp(6.5, 1.8, clamp(g / (DOT_ROWS - 1), 0, 1));
    const ringRow = (parent, cx, cy, R, g, odd, keep, a0, a1) => {
      const grp = document.createElementNS(SVGNS, 'g'); grp.setAttribute('class', 'dotrow'); grp.style.setProperty('--p', (g / DOT_ROWS).toFixed(4));
      const n = Math.max(8, Math.round(2 * Math.PI * R / DOT_GAP)), rad = dotSize(g); let cnt = 0;
      for (let i = 0; i < n; i++) { const a = (i + (odd ? .5 : 0)) / n * 2 * Math.PI; if (a0 !== undefined && (a < a0 || a > a1)) continue;
        const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); if (keep && !keep(x, y)) continue;
        const c = document.createElementNS(SVGNS, 'circle'); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', rad.toFixed(2)); grp.appendChild(c); cnt++; }
      if (cnt) parent.appendChild(grp); return cnt;
    };
    const makeSvg = (w, h) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('class', 'dots'); s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', `0 0 ${w} ${h}`); return s; };
    const REST = M.rest, restOf = n => {   // 구(964,540,479) 기준. 행 rowY 에서 구 왼쪽 가장자리 xo; 호 n 은 xo − gap·n 을 지나고 바닥이 1019 − bottomStep·n
      const xo = 964 - Math.sqrt(479 * 479 - (REST.rowY - 540) ** 2), a = (xo - REST.gap * n) - 964, B = 1019 - REST.bottomStep * n;
      const c = (B * B - REST.rowY * REST.rowY - a * a) / (2 * B - 2 * REST.rowY); return { x: REST.x, y: c, r: B - c }; };
    for (let k = 0; k < 8; k++) {
      const [cx, cy, r] = MEAS[k]; const n = 8 - k; const el = discImgHR(cx, cy, r, 'layer disc');
      arcsEl.appendChild(el); discs.push({ el, cx, cy, r, top: cy - r, rest: restOf(n) });
    }
    const ORB0 = { x: MEAS[8][0], y: MEAS[8][1], r: MEAS[8][2] };
    const G = L.orbProg, ORB1 = { x: G.cx, y: G.cy - PROG_Y + M.offY, r: G.r };
    const orbEl = document.getElementById('orb'); orbEl.style.left = ORB0.x + 'px'; orbEl.style.top = ORB0.y + 'px';
    const press = discImg(0, 0, ORB0.r, 'layer orb__look orb__look--press');
    const f = ORB0.r / ORB1.r;
    const prog = img({ file: G.file, x: (G.x - G.cx) * f, y: (G.y - G.cy) * f, w: G.w * f, h: G.h * f }, 'layer orb__look orb__look--prog');
    orbEl.appendChild(press); orbEl.appendChild(prog);
    // ---- v22 도트(사장님 21차 '구마다 이런 패턴이 달려 있고 퍼지는 모션'): 호 1~8 + 구, 각자 림 바깥에 자기 띠 M.dots.rows 줄.
    //      캔버스 한 장(호들 위·구 아래)이 매 프레임 엔진이 넘겨 준 각 원의 현재 중심·반지름·불투명도를 읽어 둘레에 점을 찍는다 → 1단 이동·2단 축소에도 림에 붙어 다님.
    //      줄 = 림 +22 부터 38 간격. 림 바로 위 줄이 가장 크고 진하고, 바깥 줄로 갈수록 작고 흐리게. 바깥 원 림에 가까워지면 사라짐(호 사이 빈 하늘 확보), 안쪽 원에 덮이는 점은 안 그림.
    //      모션 = C 리듬(이동 .45s + 멈춤 .5s): 이동 동안 모든 줄이 한 칸 바깥으로(작아지며), 끝 줄은 흐려져 소멸, 림 자리에 새 줄이 자라남. 원마다 위상을 안→밖 M.dots.lag 초씩 늦춤.
    const dotsA = document.createElement('canvas'); dotsA.id = 'dotsA'; placeCv(dotsA); CVS.push(dotsA);   // 22차: 영역·배율 = placeCv(기본은 1920·1080 × dpr 그대로)
    const dctx = dotsA.getContext('2d'), DT = M.dots, NB = 12;
    const s5 = t => t * t * t * (t * (t * 6 - 15) + 10);
    let dotT0 = null;
    // 박자(모든 섹션 공통): k = 위상 지연 순번(기본 lag 0 → 전부 같은 박자). ph 0→1 = 한 칸 이동, step = 지난 박 수
    const phaseOf = (now, lagIdx) => {
      if (dotT0 === null) dotT0 = now; const TT = M.dotStep.move + M.dotStep.hold;
      if (noMotion || DT.freeze) return { ph: 1, step: 0 };
      const fx = window.__dott != null ? window.__dott : DT.fixT, u = ((fx !== null ? fx * 1000 : now - dotT0) / 1000 - lagIdx * DT.lag) / TT, kk = Math.floor(u), uu = (u - kk) * TT;
      return { step: kk, ph: M.dotStep.hold === 0 ? uu / M.dotStep.move : (uu < M.dotStep.move ? s5(uu / M.dotStep.move) : 1) };
    };
    // 줄 i(0 = 새 줄)의 기준선으로부터 거리·반지름·알파 — 전 섹션 같은 문법. rows 줄, 새 줄은 기준선 안쪽(−16)에서 크기 0 으로 출발
    const rowLook = (i, ph, rows) => { const pos = (i - 1 + ph) * DT.gap, tt = clamp(pos / (rows * DT.gap), 0, 1);
      let rad = lerp(DT.sizeIn, DT.sizeOut, tt), a = DT.alpha * lerp(1, DT.alphaOut, tt); if (i === 0) { rad *= ph; a *= ph; } if (i === rows) { a *= 1 - ph; rad *= 1 - ph; } return { d: DT.off + pos, rad, a }; };
    const newBuckets = () => { const b = []; for (let i = 0; i < NB; i++) b.push(new Path2D()); return b; };
    const putDot = (B, x, y, rad, a) => { const bi = Math.min(NB - 1, Math.round(a / DT.alpha * (NB - 1))); if (bi <= 0 || rad < .3) return; B[bi].moveTo(x + rad, y); B[bi].arc(x, y, rad, 0, 2 * Math.PI); };
    const fillBuckets = (ctx, B, op) => { ctx.fillStyle = '#fff'; for (let b = 1; b < NB; b++) { ctx.globalAlpha = DT.alpha * b / (NB - 1) * op; ctx.fill(B[b]); } ctx.globalAlpha = 1; };
    function drawArcDots(now, C, top) {   // C[k] = { x, y, r, op, am? } k 0(바깥 큰 호)…7(작은 호), 8 = 구. top = 지면 윗선 함수(있으면 구 띠를 그 위로만)
      const cs = dotsA._s, rr = dotsA._r; dctx.setTransform(cs, 0, 0, cs, -rr.x0 * cs, -rr.y0 * cs);   // 22차
      const orbB = newBuckets(), orbIn = newBuckets(); let orbInUsed = false;
      const paths = newBuckets(), inner = newBuckets();
      for (let k = 0; k < C.length; k++) {
        const c = C[k]; if (!c || c.op <= .003) continue;
        const R0 = c.r + DT.off, dth = DT.gap / R0, nq = Math.floor(Math.PI / dth); let innerUsed = false;
        const o8 = C[8], orbBand = (o8 && o8.op > .003) ? { x: o8.x, y: o8.y, R: o8.r + DT.off + (DT.rows - 1) * DT.gap + DT.gap * .5 } : null;
        const { ph, step } = phaseOf(now, C.length - 1 - k), out = k > 0 ? C[k - 1] : null;
        const isOrb = k === 8, Bmain = isOrb ? orbB : paths, Binner = isOrb ? orbIn : inner;
        for (let i = 0; i <= DT.rows; i++) {
          // 모든 줄 = (i−1+ph) 칸(rowLook). i=0 은 림 안쪽(r−16)에서 크기 0 으로 태어나 밀려 나오며 커짐, 끝 줄은 크기·알파 0 으로 녹음
          const L = rowLook(i, ph, DT.rows), R = c.r + L.d, rad = L.rad; if (L.a <= .002 || rad < .3) continue;
          const P = (i === 0 && R - rad < c.r) ? Binner : Bmain, off = ((step - i) & 1) ? .5 : 0;
          for (let q = -nq; q <= nq; q++) {
            const ang = -Math.PI / 2 + (q + off) * dth, x = c.x + R * Math.cos(ang), y = c.y + R * Math.sin(ang);
            if (y < rr.y0 - 8 || y > rr.y1 + 8 || x < rr.x0 - 8 || x > rr.x1 + 8) continue;
            if (isOrb && top && y - rad > top(x)) continue;
            let a = L.a * c.op;
            // 바깥 원 비움 규칙 — 호가 사라지는 만큼(op) 풀린다(2단: 호가 빠지면 구 띠가 둘레 전체로 이어짐)
            if (isOrb && out && Math.hypot(x - out.x, y - out.y) >= out.r) {
              let md = 1e9, mo = 0; for (let j = 0; j < 8; j++) { const o = C[j]; if (!o || o.op <= .003) continue; const dj = Math.hypot(x - o.x, y - o.y) - o.r - rad; if (dj < md) { md = dj; mo = o.op; } }
              if (md < 1e9) { const f = md <= DT.fade[0] ? 0 : ss(DT.fade[0], DT.fade[1], md); a *= 1 - mo * (1 - f); }
            } else if (out && out.op > .003) { const dd = out.r - Math.hypot(x - out.x, y - out.y) - rad, f = dd <= DT.fade[0] ? 0 : ss(DT.fade[0], DT.fade[1], dd); a *= 1 - out.op * (1 - f); }
            if (k === 0 && orbBand && Math.hypot(x - orbBand.x, y - orbBand.y) < orbBand.R) continue;   // 호1 하늘 띠와 구 띠가 겹치면 구 쪽 우선
            let hid = false; for (let j = k + 1; j < 8 && j < C.length; j++) { const o = C[j]; if (o && o.op > .5 && Math.hypot(x - o.x, y - o.y) < o.r + rad) { hid = true; break; } }
            if (hid) continue;
            const bi = Math.min(NB - 1, Math.round(a / DT.alpha * (NB - 1))); if (bi <= 0) continue;
            if (P === inner) innerUsed = true; if (P === orbIn) orbInUsed = true;
            P[bi].moveTo(x + rad, y); P[bi].arc(x, y, rad, 0, 2 * Math.PI);
          }
        }
        if (innerUsed) {   // 원 바깥만 남기는 클립(evenodd: 화면 사각형 − 원) — 원 안쪽에 점이 비치지 않게
          dctx.save(); const cp = new Path2D(); cp.rect(rr.x0 - 10, rr.y0 - 10, rr.x1 - rr.x0 + 20, rr.y1 - rr.y0 + 20); cp.arc(c.x, c.y, c.r, 0, 2 * Math.PI); dctx.clip(cp, 'evenodd'); fillBuckets(dctx, inner, 1); dctx.restore();
          for (let bb = 0; bb < NB; bb++) inner[bb] = new Path2D();
        }
      }
      fillBuckets(dctx, paths, 1);
      // 구 띠: 지면이 있으면 윗선 위로만(클립), PROGRAM 진하기(am) 반영. 구 안쪽은 구 요소가 덮는다(캔버스가 구 아래)
      const c8 = C[8], am = c8 && c8.am ? c8.am : 1;
      dctx.save(); if (top) { const cp = new Path2D(); cp.moveTo(rr.x0 - 20, rr.y0 - 20); for (let x = rr.x0 - 20; x <= rr.x1 + 20; x += 16) cp.lineTo(x, top(x)); cp.lineTo(rr.x1 + 20, rr.y0 - 20); cp.closePath(); dctx.clip(cp); }
      fillBuckets(dctx, orbB, am); if (orbInUsed) fillBuckets(dctx, orbIn, am); dctx.restore();
    }
    orbEl.parentNode.insertBefore(dotsA, orbEl);   // 호들 위, 구 아래
    // ---- v24 PROGRAM 도트(사장님 24차 '비슷한 톤으로 다음 섹션에도'): 안착 구 둘레 4줄 + 지면 첫 띠 윗선 위로 평행 4줄(법선 방향으로 퍼짐, q 를 따라 휨).
    //      지면 아래·띠에 걸린 점은 '윗선 위 영역' 클립으로 가림(새 줄은 윗선 아래 −16 에서 태어나 넘어오며 보임). 구 띠와 겹치는 지면 점은 구 우선.
    function drawProgDots(now, Pg) {   // Pg = { orb:{x,y,r}, top: x => y(무대), op }
      const { ph, step } = phaseOf(now, 0), B = newBuckets(), rows = DT.rows, o = Pg.orb, top = Pg.top;
      const cs = dotsA._s, rr = dotsA._r, j0 = Math.floor(rr.x0 / DT.gap) - 1, j1 = Math.ceil(rr.x1 / DT.gap); dctx.setTransform(cs, 0, 0, cs, -rr.x0 * cs, -rr.y0 * cs);   // 22차
      const R0 = o.r + DT.off, dth = DT.gap / R0, nq = Math.floor(Math.PI / dth), band = o.r + DT.off + (rows - 1) * DT.gap + DT.gap * .5;
      for (let i = 0; i <= rows; i++) {
        const L = rowLook(i, ph, rows); if (L.a <= .002) continue; const R = o.r + L.d, off = ((step - i) & 1) ? .5 : 0;
        // (v25: 구 둘레 띠는 drawArcDots 의 구(k=8)가 PRESSURE→2단→PROGRAM 한 흐름으로 그린다)
        for (let j = j0; j <= j1; j++) { const x0 = (j + off) * DT.gap, y0 = top(x0), sl = (top(x0 + 1) - top(x0 - 1)) / 2, nn = Math.hypot(sl, 1), x = x0 + sl / nn * L.d, y = y0 - L.d / nn;
          if (y < rr.y0 - 8 || x < rr.x0 - 8 || x > rr.x1 + 8 || Math.hypot(x - o.x, y - o.y) < band) continue; putDot(B, x, y, L.rad, L.a); }
      }
      const cp = new Path2D(); cp.moveTo(rr.x0 - 20, rr.y0 - 20); for (let x = rr.x0 - 20; x <= rr.x1 + 20; x += 16) cp.lineTo(x, top(x)); cp.lineTo(rr.x1 + 20, rr.y0 - 20); cp.closePath();
      dctx.save(); dctx.clip(cp); fillBuckets(dctx, B, Pg.op); dctx.restore();
      // v28(사장님 28차 '배경이 많은 화면에서는 도트가 옅게 좀 더 채워져 있으면'): 하늘 채움 — 지면 평행 띠를 그대로 위로 이어 화면 위끝까지.
      //   같은 위상·같은 칸(38)·같은 엇갈림이라 기존 4줄의 끝 줄이 이 옅은 줄로 넘겨지며 계속 올라간다. 위로 갈수록 휨이 풀려 수평, 더 옅게. 구 띠 근처는 비움(부드럽게).
      const SK = DT.sky; if (!SK || SK.a <= 0) return;
      const SB = [], NS = 16; for (let b = 0; b < NS; b++) SB.push(new Path2D());
      const d0 = DT.off + (rows - 1) * DT.gap, flat = Math.min(top(-20), top(1940)), nUp = Math.ceil((flat - rr.y0 + 40) / DT.gap) + 2;
      for (let i = rows; i <= rows + nUp; i++) {
        const pos = (i - 1 + ph) * DT.gap, d = DT.off + pos, far = clamp((d - d0) / SK.span, 0, 1), w = Math.exp(-(d - d0) / SK.relax);
        const a = SK.a * lerp(1, SK.far, far) * (i === rows ? ph : 1), rad = lerp(SK.rad, SK.radFar, far); if (a <= .001) continue;
        const off = ((step - i) & 1) ? .5 : 0;
        for (let j = j0; j <= j1; j++) { const x0 = (j + off) * DT.gap, y0 = top(x0), sl = (top(x0 + 1) - top(x0 - 1)) / 2, nn = Math.hypot(sl, 1);
          const x = x0 + sl / nn * d * w, y = (y0 - d / nn) * w + (flat - d) * (1 - w); if (y < rr.y0 - 8 || x < rr.x0 - 8 || x > rr.x1 + 8) continue;
          const od = Math.hypot(x - o.x, y - o.y); if (od < band) continue; const aa = a * ss(band, band + SK.orbFade, od);
          const bi = Math.min(NS - 1, Math.round(aa / SK.a * (NS - 1))); if (bi <= 0) continue; SB[bi].moveTo(x + rad, y); SB[bi].arc(x, y, rad, 0, 2 * Math.PI); }
      }
      dctx.save(); dctx.clip(cp); dctx.fillStyle = '#fff'; const op0 = Pg.op / M.dots.boost;
      for (let b = 1; b < NS; b++) { dctx.globalAlpha = SK.a * b / (NS - 1) * op0; dctx.fill(SB[b]); } dctx.globalAlpha = 1; dctx.restore();
    }
    // ---- v24 CONTROL 도트(사장님 24차 '원으로 크게 주위에 도트 — 기존 레퍼런스처럼'): 인물+글로우를 감싸는 보이지 않는 기울어진 타원(실측: 인물·글로우 픽셀을 다 덮는 최소 타원 + 여유)
    //      바깥으로 동심 띠 M.dots.ctrl.rows 줄. 타원 안·CONTROL 글자 상자(+30)는 비움. 캔버스 dotsC(인물 위·글자 아래).
    const dotsC = document.createElement('canvas'); dotsC.id = 'dotsC'; placeCv(dotsC); CVS.push(dotsC); const cctx = dotsC.getContext('2d');
    const CE = M.dots.ctrl, thList = (() => { const a = CE.rx + DT.off, b = CE.ry + DT.off, L = []; let t = -Math.PI / 2; const end = t + 2 * Math.PI;
      while (t < end - 1e-6) { L.push(t); t += DT.gap / Math.hypot(a * Math.sin(t), b * Math.cos(t)); } const n = L.length, M2 = L.map((v, i) => (v + (i + 1 < n ? L[i + 1] : end)) / 2); return [L, M2]; })();
    function drawCtrlDots(now, Q) {   // Q = { x, y, op, box:[x0,y0,x1,y1] }
      const { ph, step } = phaseOf(now, 0), B = newBuckets(), rows = CE.rows, c = Math.cos(CE.tilt), sn = Math.sin(CE.tilt), bx = Q.box;
      const cs = dotsC._s, rr = dotsC._r; cctx.setTransform(cs, 0, 0, cs, -rr.x0 * cs, -rr.y0 * cs); cctx.clearRect(rr.x0, rr.y0, rr.x1 - rr.x0, rr.y1 - rr.y0);   // 22차
      // v29 인트로: e(0→1). 1 이면 28차와 한 픽셀도 다르지 않다(펼쳐짐 계수 전부 1) → 인트로 끝 = 연속 흐름 그대로
      const e = Q.e == null ? 1 : Q.e, IM = M.intro.mode, IA = M.intro.a, IB = M.intro.b, IC = M.intro.c, Dmax = DT.off + rows * DT.gap;
      const frontA = lerp(-IA.band, Dmax + IA.band, e), frontB = lerp(-IB.band, Math.PI + IB.band + rows * IB.lag, e), sC = lerp(IC.from, 1, e);
      for (let i = 0; i <= rows; i++) {
        const L = rowLook(i, ph, rows); if (L.a <= .002) continue; const TH = thList[((step - i) & 1) ? 1 : 0];
        let d = L.d, rowRv = 1, rA = 1;
        if (e < 1 && IM === 'a') { rowRv = ss(0, 1, (frontA - L.d) / IA.band); d = L.d - IA.slide * (1 - rowRv); }
        else if (e < 1 && IM === 'c') { d = DT.off * sC + (L.d - DT.off) * sC; rA = ss(0, .55, e); }
        const a = CE.rx + d, b = CE.ry + d, lagB = (L.d - DT.off) / DT.gap * IB.lag;
        for (let k = 0; k < TH.length; k++) { const u = a * Math.cos(TH[k]), v = b * Math.sin(TH[k]), x = Q.x + u * c - v * sn, y = Q.y + u * sn + v * c;
          if (y < rr.y0 - 8 || y > rr.y1 + 8 || x < rr.x0 - 8 || x > rr.x1 + 8) continue; if (bx && x > bx[0] && x < bx[2] && y > bx[1] && y < bx[3]) continue;
          let rv = rowRv * rA;
          if (e < 1 && IM === 'b') { let dl = TH[k] + Math.PI / 2; dl = Math.abs(((dl + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI); rv = ss(0, 1, (frontB - dl - lagB) / IB.band); }
          if (rv <= .01) continue;
          putDot(B, x, y, L.rad * (IM === 'c' ? 1 : Math.sqrt(rv)), L.a * rv); }
      }
      const cp = new Path2D(); cp.rect(rr.x0 - 20, rr.y0 - 20, rr.x1 - rr.x0 + 40, rr.y1 - rr.y0 + 40); cp.ellipse(Q.x, Q.y, CE.rx, CE.ry, CE.tilt, 0, 2 * Math.PI);
      cctx.save(); cctx.clip(cp, 'evenodd'); fillBuckets(cctx, B, Q.op * M.dots.boost); cctx.restore();
    }
    const gP = null, gO = null;
    const orbShadow = document.getElementById('orbShadow'); orbShadow.style.top = (ORB1.r * f * .92) + 'px';
    const figure = document.getElementById('figure');
    figure.appendChild(img({ file: L.control.file, x: 0, y: 0, w: L.control.w, h: L.control.h }, 'layer control__img'));
    const cDots = makeSvg(1920, 1081); cDots.classList.add('dots--c'); const keepC = (x, y) => x > 0 && x < 1920 && y > 0 && y < 1081 && (((x - 900) / 660) ** 2 + ((y - 470) / 370) ** 2 > 1) && !(x > 540 && x < 1380 && y > 620 && y < 920);
    // CONTROL 도트(C)·PROGRAM 도트(B)는 이번 라운드(사장님 13차 '하나씩')엔 숨김 — 코드는 남겨 둠
    // WebGL 지면 텍스처
    const ribbonImgs = await Promise.all(L.ribbons.map(R => loadImg(R.tex))), ribbonAvgs = await Promise.all(L.ribbons.map(R => loadImg(R.avg)));
    const ground = initGround(document.getElementById('gl'), L, ribbonImgs, ribbonAvgs);
    const ready = () => document.documentElement.classList.add('is-ready');
    // 통합 10차(사장님 '첫화면 로딩될 때 흰바탕에 원·커튼이 화면 깨지듯이 로딩돼'): 원인 = ① 상단 하늘(CSS 배경 sky-col.png)은 document.images 가 아니라 안 기다림 → 하늘 없이 뒤의 특장점 호가 비침 ② 엔진 첫 프레임 전에 보여서 호가 기본 자리(OXYGEN)에 한순간 섬.
    //   → 하늘 그림까지 기다리고, 엔진을 먼저 돌려 첫 프레임을 그린 뒤(rAF 두 번) 보인다. ?ld10=0 이전
    const skyImg = new Promise(r => { const im = new Image(); im.onload = im.onerror = () => Promise.resolve(im.decode && im.decode()).catch(() => 0).then(r); im.src = 'assets/top/sky-col.png'; });
    await Promise.all([...document.images].map(i => i.decode().catch(() => 0)).concat(qs.get('ld10') === '0' ? [] : [skyImg]));
    document.getElementById('control').after(dotsC);   // 인물 위, 글자 아래
    if (qs.get('ld10') === '0') ready();
    engine({ discs, ORB0, ORB1, orbEl, orbShadow, prog, figure, ground, dotsA, drawArcDots, progTone, dotsC, drawProgDots, drawCtrlDots });
    // 23차 ①: 첫 화면이 보인 뒤(is-ready + 0.6s) 한가한 틈에 지면 GPU 데우기. 이미 지면 구간에 와 있으면(되돌아온 방문·앵커) 건너뜀. ?warm=0 이전
    if (ground && qs.get('warm') !== '0') { const idle = window.requestIdleCallback || (f => setTimeout(f, 200));
      const go = () => { if (!document.documentElement.classList.contains('is-ready')) return setTimeout(go, 200);
        setTimeout(() => idle(() => { if (!document.getElementById('ground')._on) ground.warm(); window.__groundWarm = performance.now(); }, { timeout: 2000 }), 600); };
      go(); }
    if (qs.get('ld10') !== '0') requestAnimationFrame(() => requestAnimationFrame(ready));
  }

  /* ---------- WebGL 지면 v5: 띠 6줄 = 벡터 메시(윗선 = a + q(b cosθ + c cos2θ)) + 세로 1D 그라데이션(LUT, 윗면 밝음 → 아랫면 파랑). 이미지 없음.
     d(윗선 아래 거리)만으로 색이 정해져 결·얼룩·이음이 없다. 윗선 위(d<−14)는 버린다(파란 띠 없음). 6번째 띠 아래는 마지막 색이 바닥까지. ---------- */
  function initGround(canvas, L, ribbonImgs, ribbonAvgs) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return null;
    const vs = `attribute vec2 aPos; attribute float aD; uniform vec2 uRes; varying float vD; varying float vU;
      uniform vec2 uOff; void main(){ vD = aD; vU = aPos.x / 1920.0; vec2 c = (aPos - uOff) / uRes * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }`;   // 22차: 영역 원점 uOff(기본 0)·텍스처 u 는 1920 기준 그대로
    const fs = `precision mediump float; uniform sampler2D uLut; uniform sampler2D uAvg; uniform float uD0, uD1, uSoft, uQ; varying float vD; varying float vU;
      void main(){ if (vD < -14.0) discard;
        float a = uSoft > 0.5 ? smoothstep(-12.0, 4.0, vD) : clamp((vD + 14.0) / 1.5, 0.0, 1.0);   // 첫 띠: 하늘에서 16px 에 걸쳐 녹아든다(경계선 0)
        float dd = uSoft > 0.5 ? max(vD, -5.0) : vD;                                              // 첫 띠: 윗면 그늘 줄(−14..−6 의 진한 파랑)은 쓰지 않는다
        vec2 tc = vec2(vU, clamp((dd - uD0) / (uD1 - uD0), 0.0, 1.0));
        vec3 c = mix(texture2D(uAvg, vec2(0.5, tc.y)).rgb, texture2D(uLut, tc).rgb, uQ);   // v19: 평평(q=0)은 가로 평균 프로파일(가장자리 직선), 눌릴수록(q→1) 원본 결로
        gl_FragColor = vec4(c * a, a); }`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const prg = gl.createProgram(); gl.attachShader(prg, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prg, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prg); gl.useProgram(prg);
    const aPos = gl.getAttribLocation(prg, 'aPos'), aD = gl.getAttribLocation(prg, 'aD'), uRes = gl.getUniformLocation(prg, 'uRes'), uOff = gl.getUniformLocation(prg, 'uOff');
    gl.uniform1f(gl.getUniformLocation(prg, 'uD0'), L.ribbons[0].d0); gl.uniform1f(gl.getUniformLocation(prg, 'uD1'), L.ribbons[0].d1); const uSoft = gl.getUniformLocation(prg, 'uSoft'), uQ = gl.getUniformLocation(prg, 'uQ'); gl.uniform1i(gl.getUniformLocation(prg, 'uLut'), 0); gl.uniform1i(gl.getUniformLocation(prg, 'uAvg'), 1);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const mkTex = im => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); return t; };
    const lutTex = ribbonImgs.map(mkTex), avgTex = ribbonAvgs.map(mkTex);
    const N = 240, buf = gl.createBuffer(), arr = new Float32Array((N + 1) * 2 * 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(aD); gl.vertexAttribPointer(aD, 1, gl.FLOAT, false, 12, 8);
    const RIB = L.ribbonCurves, D0 = L.ribbons[0].d0, DEPTH = 1400;
    const lineY = (i, x, q) => {   // 띠 i 윗선(무대 y, offY·gy 제외)
      const [a0, b0, c0] = RIB[0], th = (x - 960) * Math.PI / 960, d = b0 * Math.cos(th) + c0 * Math.cos(2 * th);
      if (!M.pressLock) return a0 + i * M.ground.T + q * M.ground.amp * M.ground.k[i] * d;
      const e = c0 - b0;   // 대안: 가장자리 상승(e)은 모든 띠 같이, 가장자리→가운데 골(d − e)만 k 로 감쇠 → 양끝 두께 84 고정
      return a0 + i * M.ground.T + q * M.ground.amp * (e + M.ground.kLock[i] * (d - e));
    };
    function draw(q, gy, offY) {
      const rr = rgn(); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, rr.x1 - rr.x0, rr.y1 - rr.y0); gl.uniform2f(uOff, rr.x0, rr.y0);   // 22차
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      for (let i = 0; i < lutTex.length; i++) {
        // v21: 윗선 y_i = Y0 + i·T + q·amp·k_i·Δ(x) (Δ = 피그마 첫 띠 곡선). 국소 두께 th = y_{i+1} − y_i 로 텍스처 정규화(d_tex = d_screen·110/th)
        const T = M.ground.T, nB = lutTex.length;
        for (let j = 0; j <= N; j++) {
          const x = rr.x0 + j * (rr.x1 - rr.x0) / N;
          const yt = lineY(i, x, q) + offY + gy, o = j * 6;
          const thick = i === nB - 1 ? T : lineY(i + 1, x, q) - lineY(i, x, q), kT = 110 / thick;
          const yb = i === nB - 1 ? yt + DEPTH : yt + thick + 14 / kT;   // 다음 띠 글로우(d −14) 밑까지만, 마지막 띠는 바닥까지
          arr[o] = x; arr[o + 1] = yt + D0 / kT; arr[o + 2] = D0;
          arr[o + 3] = x; arr[o + 4] = yb; arr[o + 5] = (yb - yt) * kT;
        }
        gl.uniform1f(uSoft, i === 0 ? 1 : 0); gl.uniform1f(uQ, clamp(q, 0, 1));
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, avgTex[i]); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, lutTex[i]); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLE_STRIP, 0, (N + 1) * 2);
      }
    }
    // ---- 도트 B(PROGRAM 띠 평행): 포인트 스프라이트. 윗선 위 8줄·마지막 띠 아래 6줄, 간격 38, 멀수록 작게, 구 자리(955.6,540) r345 비움. 줄 파동은 uTime 로 ----
    const pvs = `attribute vec2 aPos; attribute float aSize; attribute float aRow; uniform vec2 uRes; uniform float uScale, uTime, uRows; varying float vA;
      void main(){ vec2 c = aPos / uRes * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); gl_PointSize = aSize * uScale;
        float ph = fract(uTime / 7.0 - aRow / uRows); float dim = ph < 0.03 ? ph / 0.03 : (ph < 0.11 ? 1.0 - (ph - 0.03) / 0.08 : 0.0);   // 줄 번호 순서로 옅어지는 파동
        vA = 0.3 * (1.0 - 0.88 * dim); }`;
    const pfs = `precision mediump float; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = (1.0 - smoothstep(0.42, 0.5, d)) * vA; gl_FragColor = vec4(a, a, a, a); }`;
    const pprg = gl.createProgram(); gl.attachShader(pprg, sh(gl.VERTEX_SHADER, pvs)); gl.attachShader(pprg, sh(gl.FRAGMENT_SHADER, pfs)); gl.linkProgram(pprg);
    const pPos = gl.getAttribLocation(pprg, 'aPos'), pSize = gl.getAttribLocation(pprg, 'aSize'), pRow = gl.getAttribLocation(pprg, 'aRow');
    const pRes = gl.getUniformLocation(pprg, 'uRes'), pScale = gl.getUniformLocation(pprg, 'uScale'), pTime = gl.getUniformLocation(pprg, 'uTime'), pRows = gl.getUniformLocation(pprg, 'uRows');
    const pbuf = gl.createBuffer(); const NX = Math.floor(1920 / 38) + 2, ROWS_UP = 5, ROWS_DN = 4, PR = ROWS_UP + ROWS_DN; const parr = new Float32Array(NX * PR * 4);
    function drawDots(q, gy, offY, time) {
      let k = 0;
      for (let row = 0; row < PR; row++) {
        const up = row < ROWS_UP, i = up ? row : row - ROWS_UP, [a, b, c] = up ? RIB[0] : RIB[5], odd = row % 2 === 1;
        const size = up ? lerp(6, 2.4, i / (ROWS_UP - 1)) : lerp(5.5, 2.4, i / (ROWS_DN - 1));
        for (let ix = 0; ix < NX; ix++) {
          const x = (ix + (odd ? .5 : 0)) * 38, th = (x - 960) * Math.PI / 960, yt = a + q * (b * Math.cos(th) + c * Math.cos(2 * th)) + offY + gy;
          const y = up ? yt - 38 * (i + 1) : yt + 70 + 38 * i;
          if (Math.hypot(x - 955.6, y - 540) < 345 || y < 0 || y > 1080) continue;
          parr[k++] = x; parr[k++] = y; parr[k++] = size; parr[k++] = row;
        }
      }
      gl.useProgram(pprg); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, parr.subarray(0, k), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(pPos); gl.vertexAttribPointer(pPos, 2, gl.FLOAT, false, 16, 0); gl.enableVertexAttribArray(pSize); gl.vertexAttribPointer(pSize, 1, gl.FLOAT, false, 16, 8); gl.enableVertexAttribArray(pRow); gl.vertexAttribPointer(pRow, 1, gl.FLOAT, false, 16, 12);
      gl.uniform2f(pRes, W, H); gl.uniform1f(pScale, canvas.width / W); gl.uniform1f(pTime, time); gl.uniform1f(pRows, PR);
      gl.drawArrays(gl.POINTS, 0, k / 4);
      gl.useProgram(prg); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 12, 0); gl.enableVertexAttribArray(aD); gl.vertexAttribPointer(aD, 1, gl.FLOAT, false, 12, 8);
    }
    /* 23차(사장님 '스크롤 하다 보면 잠깐 로딩 걸리듯 틱틱 끊길 데가 있는데 밑에를 미리 로딩해 놓고'): 실측 = PRESSURE→PROGRAM 에서 지면이 처음 보이는 프레임에
       GPU 가 미뤄 둔 일(셰이더 컴파일·텍스처 12장 올리기·첫 그리기)을 한꺼번에 함(실제 GPU 50~67ms 프레임 · SwiftShader 120~137ms longtask, 원인 GLES2::ReadPixels 대기).
       ① warm: 첫 화면 뒤 한가한 때 한 번 그려 GPU 일을 미리 끝내고 지움(지면은 opacity 0·무대 숨김 상태라 화면에 안 보임)
       ② 같은 값이면 다시 안 그림: q(1e-4)·세로 오프셋(.01px)·캔버스 크기가 지난번과 같으면 그 프레임은 건너뜀(합성기가 지난 그림을 그대로 씀). PROGRAM 멈춤에서 매 프레임 전체 화면 셰이더를 돌리던 것 */
    let lastKey = null;
    return { draw: (q, gy, offY, time) => {
        const key = (M.dotsB || qs.get('gskip') === '0') ? null :   /* ?gskip=0 = 매 프레임 그림(이전) */ Math.round(q * 1e4) + '|' + Math.round(gy * 100) + '|' + offY + '|' + canvas.width + 'x' + canvas.height + '|' + rgn().x0 + ',' + rgn().y0;
        if (key !== null && key === lastKey) return; lastKey = key;
        draw(q, gy, offY); if (M.dotsB) drawDots(q, gy, offY, noMotion ? 0 : time); },
      invalidate: () => { lastKey = null; },
      warm: () => { draw(0, M.groundSlide, M.offY); const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);   // 1px 되읽기 = GPU 가 미룬 일을 지금(한가할 때) 끝내게
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.flush(); lastKey = null; },
      flat0: RIB[0][0], topY: (x, q, gy, offY) => lineY(0, x, q) + offY + gy };
  }

  /* ---------- 스프링 (코딩노트 '모션 물리' 2절) ---------- */
  function spring(s, target, dt, omega, zeta) {
    dt = Math.min(dt, .032);
    const f = 1 + 2 * dt * zeta * omega, oo = omega * omega, hoo = dt * oo, hhoo = dt * hoo, det = 1 / (f + hhoo);
    s.x = (f * s.x + dt * s.v + hhoo * target) * det; s.v = (s.v + hoo * (target - s.x)) * det; return s.x;
  }

  /* ---------- 엔진 ---------- */
  function engine(S_) {
    const { discs, ORB0, ORB1, orbEl, orbShadow, prog, figure, ground, dotsA, drawArcDots, progTone, dotsC, drawProgDots, drawCtrlDots } = S_;
    const DC = []; dotsA.style.opacity = 1; dotsC.style.opacity = 1;
    // CONTROL 글자 상자(무대 좌표, +30): 글자 덩어리 잉크 범위를 Range 로 재서 합침 — 글자는 움직이지 않는다(인물만 올라감)
    let ctrlBox = null; const measureCtrlBox = () => { const st = document.getElementById('control').parentElement.getBoundingClientRect(), k = st.width / 1920; let b = null;
      for (const el of document.getElementById('copyControl').children) { const r = document.createRange(); r.selectNodeContents(el); const q = r.getBoundingClientRect(); if (!q.width) continue;
        const x0 = (q.left - st.left) / k, y0 = (q.top - st.top) / k, x1 = (q.right - st.left) / k, y1 = (q.bottom - st.top) / k; b = b ? [Math.min(b[0], x0), Math.min(b[1], y0), Math.max(b[2], x1), Math.max(b[3], y1)] : [x0, y0, x1, y1]; }
      ctrlBox = b && [b[0] - 30, b[1] - 30, b[2] + 30, b[3] + 30]; window.__ctrlBox = ctrlBox; };
    addEventListener('resize', () => { ctrlBox = null; });   // 22차: 글자 크기·자리가 화면 따라 바뀜
    const skyBaseEl = document.getElementById('skyBase');
    const groundEl = document.getElementById('ground'), controlEl = document.getElementById('control'), glow = document.getElementById('glow');
    const copy = { oxy: document.getElementById('copyOxygen'), press: document.getElementById('copyPressure'), prog: document.getElementById('copyProgram'), ctrl: document.getElementById('copyControl') };
    const LIFT = ORB0.y - 540;
    const SP = M.speedA, arcWin = k => { const f = k / 8; const fa = M.speed === 'B' ? 1 - f : f;   // k 0..8 (8 = 구)
      const st = lerp(SP.lateStart, SP.earlyStart, fa), sp = lerp(SP.fastSpan, SP.slowSpan, fa); return [st, st + sp]; };
    const FLAT0 = ground ? ground.flat0 + M.offY : 736.7;
    const RESTPEN = (ORB1.y + ORB1.r) - FLAT0;           // 안착 때 침투 깊이 → q=1
    // 로드 시퀀스: 보이는 호(윗선이 1080 안)만 의미 있다. 맨 위(큰 호)가 빠르고 아래로 갈수록 느리게, 출발은 위부터 조금씩 늦게 — 천천히 모이는 느낌
    const visIdx = discs.map((d, k) => k).filter(k => discs[k].top < H + 60);
    const loadPlan = {}; let tText = 0; const T = M.load.total, nV = Math.max(1, visIdx.length - 1);
    visIdx.forEach((k, i) => { const dist = H + 40 - discs[k].top; const f = i / nV;
      const dur = T * lerp(M.load.outerFrac, M.load.innerFrac, f) * (1 - M.load.startSpread * f), delay = T * M.load.startSpread * f;
      loadPlan[k] = { dist, dur, delay }; tText = Math.max(tText, delay + dur); });
    // 36차(사장님 '이젠 너무 빨리 — 첫 구의 등장 후 등장'): 글자 시작 = 첫(맨 위·큰) 호가 다 올라온 시점 × .9. ?tat=.55/.12/.001 로 이전 방식(전체 로드 비율)
    // 37차(사장님 '두 번째 구가 올라올 때 — 지금보단 살짝 빠르게'): 둘째 호가 올라오는 도중(둘째 호 출발 .47s + dur·.08 ≈ .64s, 36차 .98s보다 살짝 빠름). ?tt=1 = 36차(첫 호 도착 ×.9)
    { const p0 = loadPlan[visIdx[0]], p1 = loadPlan[visIdx[1]];
      tText = qs.get('tat') ? tText * parseFloat(qs.get('tat')) : qs.get('tt') === '1' || !p1 ? (p0 ? (p0.delay + p0.dur) * .9 : tText * .4) : p1.delay + p1.dur * .08;
      window.__tText = tText; }
    const t0 = performance.now() / 1000;
    /* [통합] 로드 시퀀스 → 상단 다리. 호 k(0·1)의 세로 오프셋 = 상단 판 다리 공식 그대로: from·(1 − s6((bu − win0)/(win1 − win0))). 다리가 끝나면(bu=1) 0 = 원 판 로드 끝 자세 */
    const BA = JOIN.arcs || [{ win: [.02, .80], from: 760 }, { win: [.16, 1], from: 720 }];
    const s6u = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
    const bridgeOff = (k, bu) => { const a = BA[k]; if (!a) return 0; const t = Math.min(1, Math.max(0, (bu - a.win[0]) / (a.win[1] - a.win[0]))); return a.from * (1 - (a.ease === 'out' ? 1 - Math.pow(1 - t, 3) : s6u(t))); };   // 24차 ease 'out' = 처음 빠르게 슥 → 끝 느리게
    const loadOff = k => bridgeOff(k, JOIN.bu == null ? 1 : JOIN.bu);
    /* [통합] 첫 타이틀(37차 '두 번째 구가 올라올 때'): 원 판에서 글자가 시작하는 순간(tText) 기준 호가 제자리까지 남긴 거리를 잰다 → 다리에서 그 호가 같은 높이를 지나는 순간 글자 창이 열린다.
       37차 = 둘째 호(k=1): 남은 거리 = dist·(1 − expoOut(.08)) ≈ 149px(화면 아래끝 위로 ≈71px 막 드러남). ?tt=1(36차) = 첫 호 dur×.9 지점. ?tat= 는 통합판에선 쓰지 않음(시간 비율이라 다리에 대응 없음) */
    const TREF = (() => { const ref = (qs.get('tt') === '1' || !loadPlan[visIdx[1]]) ? visIdx[0] : visIdx[1], p = loadPlan[ref];
      const rem = p ? p.dist * (1 - expoOut(clamp((tText - p.delay) / p.dur, 0, 1))) : 0; return { k: ref, rem }; })();
    window.__titleRef = TREF;
    let tOpen = null;
    const loadText = nowS => {   // 원 판과 같은 1.25s 시간 창 — 단 시작점이 시간 tText 가 아니라 '다리에서 그 호가 그 높이를 지난 순간'. 되감아 다시 내려가면 닫힘
      const open = (JOIN.bu == null ? 1 : JOIN.bu) > 0 && bridgeOff(TREF.k, JOIN.bu == null ? 1 : JOIN.bu) <= TREF.rem + 1e-6;
      if (!open) { tOpen = null; return 0; } if (tOpen === null) tOpen = nowS;
      return noMotion ? 1 : clamp((nowS - tOpen) / 1.25, 0, 1); };

    let pTarget = 0, Ps = null, Pd = null, last = performance.now();
    // 원 스크롤 S(vh) → 진행도 P: [멈춤0][1단][멈춤1][2단][멈춤2][3단][멈춤3][4단]
    // [통합] SEG·SMAX 는 위(트랙)에서 계산
    const mapP = S => { for (const g of SEG) if (S <= g.s1) return g.p0 + (g.p1 - g.p0) * (g.s1 > g.s0 ? (S - g.s0) / (g.s1 - g.s0) : 0); return SEG[SEG.length - 1].p1; };
    const onScroll = () => { pTarget = mapP(clamp((window.scrollY || document.documentElement.scrollTop) / VH - PMAX0(), 0, SMAX)); };   // [통합] 상단 다리 끝 = 0
    const track = document.getElementById('track'); track.style.height = (PMAX0() + SMAX + 1) * 100 + 'vh';
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
    const qS = { x: 0, v: 0 }, oS = { x: 0, v: 0 }, oF = { x: ORB0.y, v: 0 };
    // 순차 등장(사장님 17차): 타이틀 → 부제 → 본문. 스크롤 창 p 가 열리면(시간 게이트) 덩어리 k 가 k·0.18s 뒤에 0.45s 동안 아래 16px 에서 떠오르며 페이드 — 스크롤 속도와 무관하게 간격 0.18s 보장. 퇴장(outF)은 함께. 창이 닫히면(p≈0) 리셋.
    const setText = (el, p, outF, extra) => { const kids = el.children; const n = kids.length, now = performance.now() / 1000;
      if (p > .02) { if (el._t0 == null) el._t0 = now; } else el._t0 = null;
      const gate = ss(0, .5, p);
      for (let k = 0; k < n; k++) { const tk = el._t0 == null ? 0 : (noMotion ? 1 : ss(0, .45, now - el._t0 - k * .18)), pk = Math.min(gate, tk), op = pk * outF;
        kids[k].style.opacity = op.toFixed(3); kids[k].style.transform = `translate3d(0,${((1 - pk) * M.text.lift).toFixed(1)}px,0)`; }
      el.style.opacity = 1; el.style.transform = `translate3d(0,${(extra || 0).toFixed(1)}px,0)`; };

    function frame(now) {
      const dt = Math.min((now - last) / 1000, .05); last = now; const t = now / 1000 - t0;
      if (Ps === null) { Ps = pTarget; Pd = pTarget; }
      Ps += (pTarget - Ps) * (1 - Math.exp(-M.lambdaScroll * dt));
      Pd += (pTarget - Pd) * (1 - Math.exp(-M.lambdaDots * dt));
      const L = M.stage, b1 = L[0], b2 = b1 + L[1], b3 = b2 + L[2];
      const s1 = clamp(Ps / L[0], 0, 1), s2 = clamp((Ps - b1) / L[1], 0, 1), s3 = clamp((Ps - b2) / L[2], 0, 1), s4 = clamp((Ps - b3) / L[3], 0, 1);
      const d1 = clamp(Pd, 0, 1), d2 = clamp(Pd - 1, 0, 1);
      // ---- 호 ----
      const ringsOp = 1 - win(M.ringsOut, s2);
      for (let k = 0; k < 8; k++) {
        const d = discs[k], aw = arcWin(k), e = s6(aw[0], aw[1], s1), rs = lerp(1, M.ringsShrink, win(M.ringsOut, s2));   // rs: 2단 살짝 축소(구 정지 중심 앵커)
        const rx = 964 + (d.rest.x - 964) * rs, ry = 540 + (d.rest.y - 540) * rs, rr = d.rest.r * rs;
        const tx = (rx - d.cx) * e, ty = loadOff(k) - (d.cy - ry) * e, sc = 1 + (rr / d.r - 1) * e;
        d.el.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${sc.toFixed(5)})`; d.el.style.opacity = ringsOp.toFixed(3);
        DC[k] = { x: d.cx + tx, y: d.cy + ty, r: d.r * sc, op: ringsOp };
      }
      // ---- 구 ----
      const sh = win(M.shrink, s2), fallU = clamp((s2 - M.fall[0]) / (M.fall[1] - M.fall[0]), 0, 1);
      const sc = lerp(1, ORB1.r / ORB0.r, sh);
      const ow = arcWin(8); const oy1 = ORB0.y - LIFT * s6(ow[0], ow[1], s1);   // 1단: 구는 스택의 가장 안쪽 — 작은 호 쪽 속도로 올라와 540 에서 끝
      let oy = lerp(oy1, M.hoverY, sh);                                      // 2단 앞: 떠오름
      oy = lerp(oy, ORB1.y, Math.pow(fallU, M.fallPow));                     // 2단 뒤: 낙하
      const ox = lerp(ORB0.x, ORB1.x, sh);
      // v30(사장님 30차 '마지막 구만 혼자 너무 따로'): 원인 = 구에만 걸린 위치 스프링(ζ.85 ω16) — 호들은 스크롤을 그대로 따르는데 구만 1단에서 최대 수백 px 뒤처짐.
      //   스프링은 2단 착지용이므로 2단 변위(oy − oy1)에만 건다 → 1단 구는 호와 같은 스크롤 값으로 움직이고, 2단은 이전과 동일(스프링은 평행이동 불변), 되감을 때도 끊김 없음. ?orb1=old = 29차(구 전체에 스프링)
      const oyS = noMotion ? oy : lerp(oy1 + spring(oS, oy - oy1, dt, M.orbSpring.omega, M.orbSpring.zeta), spring(oF, oy, dt, M.orbSpring.omega, M.orbSpring.zeta), M.orb1Mix);
      const orbExit = -M.orbExitLift * win(M.orbExit, s3), groundOut = win(M.groundOut, s3), gTy = -M.groundLift * groundOut, scX = sc * lerp(1, M.orbExitScale, win(M.orbFade, s3));
      orbEl.style.transform = `translate3d(${(ox - ORB0.x).toFixed(2)}px,${(oyS - ORB0.y + orbExit).toFixed(2)}px,0) scale(${scX.toFixed(5)})`;
      orbEl.style.opacity = (1 - win(M.orbFade, s3)).toFixed(3);
      prog.style.opacity = sh.toFixed(3);
      // 도트(v22): 호 8 + 구, 매 프레임 현재 기하로. 구 도트는 구와 함께 움직이고 2단에서 호와 같이 사라진다
      // v25(사장님 25차 '이때도 도트가'): 구 띠는 호와 따로 — PRESSURE 부터 2단 전환(축소·떠오름·낙하)·PROGRAM 까지 끊김 없이 구를 따라감, 3단 앞에 사라짐. PROGRAM 쪽으로 갈수록 진하게(am)
      DC[8] = { x: ox, y: oyS + orbExit, r: ORB0.r * scX, op: 1 - win(M.dots.progOut, s3), am: lerp(1, M.dots.boost, win(M.dots.progIn, s2)) }; window.__dotGeom = DC; window.__s1 = s1; window.__orbT = oy;
      // ---- 지면 (눌림 스프링) ----
      const gIn = win(M.groundIn, s2), gy = (M.groundSlide + Math.max(0, rgn().y1 - H)) * (1 - gIn);   // 22차: 세로 화면은 상자 아래(rgn y1)까지 보여서 출발점을 그만큼 더 아래로          // 바닥 세로 오프셋: +620 → 0 (아래서 위로)
      const bottom = oyS + ORB0.r * sc;
      const qT = (gIn >= 1 && fallU > 0) ? clamp((bottom - FLAT0) / RESTPEN, 0, 1.0) : 0;   // 바닥이 다 올라온 뒤, 공이 내려와 닿아야 눌린다
      const q = noMotion ? qT : spring(qS, qT, dt, M.spring.omega, M.spring.zeta);
      const gOp = (gIn > 0 ? 1 : 0) * (1 - groundOut);
      skyBaseEl.style.opacity = (1 - groundOut).toFixed(3);
      // [통합] 하늘 아랫단: 다리 동안 상단 카메라와 같이(깊이 1) 올라와 다리 끝(cam 3204)에 원 판 자리(0). 상단 하늘 띠는 3204 위까지만 → 교체·이음 없음
      { const sy = Math.max(0, (JOIN.C4 || 3204) - (JOIN.cam == null ? 3204 : JOIN.cam)); skyBaseEl.style.transform = sy > .005 ? `translate3d(0,${sy.toFixed(2)}px,0)` : ''; }
      progTone.style.opacity = (ss(.25, .85, s2) * (1 - win(M.progToneOut, s3))).toFixed(3);   // 2단 바닥 상승~안착에 서서히 진해지고, PROGRAM 멈춤 유지, 인물 등장과 함께 빠짐
      groundEl.style.opacity = gOp.toFixed(3); groundEl.style.transform = `translate3d(0,${gTy.toFixed(1)}px,0)`;
      if (ground && gOp > 0) { if (!groundEl._on) ground.invalidate(); ground.draw(q, gy, M.offY, now / 1000); } groundEl._on = gOp > 0;   // 23차: 다시 보이기 시작하는 프레임은 꼭 그림
      // PROGRAM 도트(v24): 바닥이 올라오고 구가 앉은 뒤(2단 .85~1) 페이드인, 3단 앞(0~.3)에 페이드아웃. 같은 캔버스·같은 박자
      // 지면 윗선 띠(v25): 바닥이 올라오는 만큼(gIn) 함께 페이드인, 3단 앞에 페이드아웃. 같은 캔버스·같은 위상
      const progOp = gIn * (1 - win(M.dots.progOut, s3)) * gOp;
      const dA = dotsA.getContext('2d'); if (!dotsA._clr) { dA.setTransform(1, 0, 0, 1, 0, 0); dA.clearRect(0, 0, dotsA.width, dotsA.height); }
      // [통합] 호 도트: 상단 03 이전(cam ≤ C3)엔 그리지 않는다(호가 아직 화면 밖 — 도트 띠만 화면 아래에 걸림). 다리부터 원 판 로드처럼 호와 같이(아래 구름 뒤)
      const bridgeOn = JOIN.cam == null || JOIN.cam > (JOIN.C3 || 0), bdA = !bridgeOn ? 0 : BDOTS === 'land' ? ss(.86, 1, JOIN.bu == null ? 1 : JOIN.bu) : 1;
      if (dotsA._bd !== bdA) { dotsA.style.opacity = bdA; dotsA._bd = bdA; }
      { const yo = gTy, qq = q, gyy = gy, top = (ground && gOp > 0) ? (x => ground.topY(x, qq, gyy, M.offY) + yo) : null;
        if (bdA > 0 && (DC[8].op > .003 || ringsOp > 0)) drawArcDots(now, DC, top);
        if (top && progOp > .003) drawProgDots(now, { orb: { x: ox, y: oyS + orbExit, r: ORB0.r * sc }, top, op: progOp * M.dots.boost }); }
      dotsA._clr = ringsOp <= 0 && DC[8].op <= .003 && progOp <= .003;
      orbShadow.style.opacity = (.9 * clamp(q, 0, 1) * gOp * (1 - win(M.orbExit, s3))).toFixed(3);
      // ---- CONTROL: 3단 아래서 위로 스르륵(구 퇴장과 교차), 4단 계속 위로 ----
      const cIn = win(M.controlIn, s3), cRise = M.controlFrom * (1 - win(M.controlRise, s3)), cLift = -M.controlLiftIn2 * win(M.controlLiftIn, s3) - M.controlLift * win(M.controlLiftWin, s4);
      controlEl.style.opacity = cIn.toFixed(3);
      controlEl.style.transform = `translate3d(0,${(cRise + cLift).toFixed(1)}px,0)`;
      // CONTROL 도트(v24): 인물과 함께 나타나고(cIn) 함께 올라감(cRise+cLift+부유)
      let cDot = win(M.dots.ctrlIn, s3), cE = 1;
      if (M.intro.mode !== '0' && !noMotion) {   // v29: 창이 열린 순간부터 시간 인트로(quart-out: 촤악 빠르게 열고 길게 눕는다), 스크롤 창과 min — 되감으면 접힘
        const IMd = M.intro[M.intro.mode] || M.intro.a, nowS = now / 1000;
        if (cDot > .003) { if (dotsC._t0 == null) dotsC._t0 = nowS; } else dotsC._t0 = null;
        const tt = dotsC._t0 == null ? 0 : clamp((window.__introT != null ? window.__introT : nowS - dotsC._t0) / IMd.dur, 0, 1);
        cE = Math.min(1 - Math.pow(1 - tt, 4), cDot); cDot = cDot > .003 ? 1 : 0; }
      window.__dbg = { s1, s2, s3, ringsOp, gOp, gyTop: (ground ? ground.flat0 + M.offY : 0) + gy + gTy, orbOp: +orbEl.style.opacity, cIn, cDot, cE, progOp };   // 검증용(전환 겹침 측정)
      if (cDot > .003) { if (!ctrlBox) measureCtrlBox(); const fl = (!noMotion && !window.__noFloat) ? -M.control.float * (.5 - .5 * Math.cos(2 * Math.PI * (now / 1000) / M.control.period)) : 0;
        drawCtrlDots(now, { x: M.dots.ctrl.cx, y: M.dots.ctrl.cy + cRise + cLift + fl, op: cDot, e: cE, box: ctrlBox }); dotsC._clr = false; }
      else if (!dotsC._clr) { const cc = dotsC.getContext('2d'); cc.setTransform(1, 0, 0, 1, 0, 0); cc.clearRect(0, 0, dotsC.width, dotsC.height); dotsC._clr = true; }
      if (cIn > 0 && !noMotion) {
        const ph = .5 - .5 * Math.cos(2 * Math.PI * (now / 1000) / M.control.period);
        figure.style.transform = `translate3d(0,${(-M.control.float * ph).toFixed(2)}px,0)`;
        glow.style.opacity = ph.toFixed(3);
      }
      // ---- 글자 ----
      setText(copy.oxy, loadText(now / 1000), 1 - win(M.text.oxyOut, s1));   // [통합] 다리 기준 창
      JOIN.feat = { Ps, s1, title: +copy.oxy.children[0].style.opacity };
      setText(copy.press, win(M.text.pressIn, s1), 1 - win(M.text.pressOut, s2));
      setText(copy.prog, win(M.text.progIn, s2), 1 - win(M.text.progOut, s3), orbExit + (oyS - ORB1.y));   // v27: 글자는 구와 함께(제자리, 위로 30 만)   // 공이 눌리며 내려앉는 만큼 같이
      setText(copy.ctrl, win(M.text.ctrlIn, s3), 1);   // 인물이 올라오자마자(3단 .62~.85)
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
