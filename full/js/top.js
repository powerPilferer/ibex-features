/* [통합 1019] 상단 판(퍼블리싱-상단-1016 15차 js/top.js) 복사본. 바꾼 곳은 전부 '[통합]' 표시:
   에셋 경로 assets/top/ · 리본 세트 v3 만 · 다리의 호 1·2 와 OXYGEN 글자는 특장점 엔진(js/scene.js)의 것으로(여기선 지움)
   · 트랙 높이는 scene.js 가 (상단 PMAX + 특장점 SMAX + 1) 로 세움 · 매 프레임 카메라를 window.JOIN 에 넘김 · 정지판 대신 '시간 모션만 끈' 스크롤 판.
   ibex 상단 엔진 — 춘봉 2026-10-16 1차. 바닐라, 외부 의존 없음. 특장점(scene.js) 문법을 잇는다:
   sticky 100vh 무대 + 스크롤 진행도 P(= scrollY / vh, λ6 스무딩) → 레이어 transform/opacity. 휠 이벤트·스크롤 위치는 절대 만지지 않는다.

   한 장의 하늘(세로 4284px 세계) 위를 카메라 cam 이 내려간다. 레이어 i 의 화면 y = (세계 y − A_i) − (cam − A_i)·d_i
   (A = 그 레이어가 피그마 자리와 정확히 같아지는 cam, d = 깊이: 뒤 < 1 < 앞). 그래서 각 장면의 멈춤 지점에서는 화면 = 피그마.

   8차(사장님 '여기는 그냥 자연스럽게 스크롤로'): 멈춤 구간(seg)과 구간마다 s6(양끝 속도 0)를 걷어냈다. cam = 스크롤의 매끈한 함수(Hermite, 속도 > 0 어디서나).
   장면 사이에서 깊이가 바뀌는 레이어는 깊이 자체를 smoothstep 으로 섞고 적분한다(parB) — 멈춤이 없으니 깊이를 뚝 바꾸면 속도가 꺾인다.
   아래 표는 7차까지의 구간(참고용). 7차 판 = _v7/.
   구간(P, vh 단위)             cam            내용
   0   ~ 1   멈춤 01            0              로드: 하늘 → 모델 떠오름 → "산소 ON," → "ibex", 도트 가운데서 번짐
   1   ~ 3   01→02             0 → 1000       하늘 1·모델 1·도트 1.1·글자 1.25 — 깊이 차. 리본은 어깨에서 앞으로 부풀었다(막) 자리 잡음
   3   ~ 4   멈춤 02            1000           문장 한 줄씩
   4   ~ 6   02→03             1000 → 2124    리본 꼬리 위로 빠짐(1.35, 앞으로 커짐), 구름 아래서 떠오름(1.25), 하늘 밝아짐
   6   ~ 7   멈춤 03            2124           "이젠, 산소의 시간"
   7   ~ 9   03→04 다리         2124 → 3204    하늘이 아이스 블루(특장점 sky-base)로, 구름은 뒤로(0.45) 걷히고 그 뒤에서 호 1·2 가 떠올라 OXYGEN 자세
   9   ~ 10  멈춤 04            3204           = 특장점 첫 화면(OXYGEN ON). 합칠 때 여기서 특장점 트랙으로 넘어간다
*/
(() => {
  'use strict';
  const W = 1920, H = 1080, WORLD = 4284;
  const qs = new URLSearchParams(location.search);
  const noMotion = qs.get('motion') === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add(noMotion ? 'no-motion' : 'has-motion');

  const M = {
    lambda: 6,                                   // 스크롤 스무딩(특장점과 같음)
    cam: [0, 1000, 2124, 3204],                  // 장면 지점의 카메라(세계 y) — 8차부터는 멈추지 않고 지나가는 점
    // 8차 카메라: 스크롤 1px 당 세계 px(1920 폭 기준 = 화면 px). .75 → 읽는 글자(깊이 1.15~1.25)는 휠과 거의 1:1, 하늘은 뒤에서 느리게. ?cv=
    //   h = 장면 지점(02·03)에서의 속도 / 평균(1 = 등속, <1 = 장면에서 살짝 늦춤). end = 마지막(특장점 첫 화면 도착) 속도 / 평균. ?camh=
    camRate: parseFloat(qs.get('cv')) || .75, camH: qs.get('camh') !== null ? parseFloat(qs.get('camh')) : 1, camEnd: .5,
    d: { cloudTop: .8, dots: 1.1, model: 1, modelAfter: 1.1, hero: 1.25, brand: 1.15, ribbonAfter: 1.35, cloudB: 1.25, now: qs.get('now') === 'old' || qs.get('now') === '5' ? 1.15 : (parseFloat(qs.get('nowd')) || (qs.get('nowv') === '14' ? .35 : qs.get('nowv') === '15' ? 1.45 : .55)),   /* 17차(사장님 '타이틀이 너무 늦게 나와 — 커튼 바로 아래에 나와서 스크롤 따라 천천히 올라가면'): 1.45→.55. ?nowv=15 15차 */   /* 15차(사장님 '구름보다 텍스트가 더 높은 뎁스 — 지금은 뎁스가 반대로 느껴져'): 글자는 구름 위에 그려지니 구름(1.25)보다 빨라야 앞 → .35→1.45. ?nowv=14 이전 */ cloudBridge: .45, nowBridge: 1.2 },
    // 4차 커튼: 첫 화면엔 어깨 아래에서 화면 왼쪽 끝 밖까지 가로질러 덮고(자유단은 화면 밖), 스크롤하면 오른쪽으로 물러나며 3차 멈춤 02 자세로.
    //   바깥 자세 = 어깨(1880,1120) 기준 translate(x, y) rotate(r) scale(s) — 멈춤 02 = (0,0,0,1). 카메라 이동은 따로 더한다(모델과 한 몸).
    //   slide = 물러나는 창(P). 01 멈춤 중에도 바로 반응하도록 0.15 에서 시작, 문장이 다 드러난 뒤 멈춤 02 안(3.55)에서 끝.
    curtain: { p0: { x: -993, y: -96, r: 30, s: 1.36 }, slide: [0, 900] },   // 8차: 물러남 창 = 카메라(세계 px). 첫 휠부터 물러나 문장이 화면 가운데 오기 전에 다 걷힘
    reveal: { in: 20, out: 100 },                // 문장 드러냄: 커튼 왼쪽 경계 − in 까지 또렷, + out 에서 0 (커튼 밑에서 나옴)
    ribbonGrow: .18,                             // 02→03 리본이 앞으로 커짐(꼬리가 위로 빠지는 동안)
    load: { /* 12차 도트 [0,.5,.35](사장님 '첨부터 바로'): 이전 [.5,1.3,.9] */ model: [.25, 1.8, 36], hero: [1.0, .9, 22], heroGap: .22, dots: [0, .5, .35] },   // 도트 [시작 s, 거리 지연 폭 s, 점 하나 자라는 s]   // [시작 s, 길이 s, 아래에서 px]
    text: { gap: .16, ramp: .55, rise: 18 },     // 줄 순차 등장: 창이 열린 순간부터 k·gap 지연, ramp 동안 rise px 아래에서
    arcs: qs.get('arcv') !== '24' ? [   /* 24차 기각(사장님 '구 등장은 이전이 낫다.. 그냥 이전으로') → 기본 = 이전 판, ?arcv=24 기각안 */ { m: [953, 1775, 1411], win: [.02, .80], from: 760 }, { m: [961, 2154, 1294], win: [.16, 1], from: 720 } ]
      /* 24차(사장님 '구름과 특장점 등장 사이에 구의 등장을 아예 화면 아래에서 슥 올라오게'): 출발을 화면 밖 아래로 더 깊게(760→1150, 720→1100), 구름이 걷히기 시작한 뒤(.22/.34)부터, 처음 빠르고 끝 느리게(cubic-out). ?arcv=0 이전 */
      : [ { m: [953, 1775, 1411], win: [.22, .86], from: 1150, ease: 'out' }, { m: [961, 2154, 1294], win: [.34, 1], from: 1100, ease: 'out' } ],   // 특장점 MEAS 호1·2, 위(큰 호)가 먼저·빠르게
    cloudBridgeFade: [.38, .86],
    // 8차 깊이 섞는 창(카메라 세계 px): [시작, 끝, 뒤 깊이]. 앞 깊이는 d 의 값
    blend: { model: [1000, 1400], ribbon: [1000, 1400], cloudB: [1874, 2324, parseFloat(qs.get('cbd')) || .45],   /* 통합 3차(사장님 '다음 섹션으로 넘어가는 모션에서 구름도 위로 서서히 올라가면서 전환'): 다리 깊이 .03→.45, ?cbd=.03 이전 */ now: [2024, 2424] },
    brandFade: [1100, 1400],                     // 문장이 위로 빠지며 GNB 닿기 전에 흐려짐
    nowWin: [[.35, .70], [.50, .85]],          // 5차: '이젠,' / '산소의 시간' 줄별 등장 창(02→03 진행 segU(3)) — 아래 구름이 화면에 들어온 직후부터, 문장 퇴장(0~.45)과 살짝 겹침
    nowOld: qs.get('now') === 'old', now5: qs.get('now') === '5',   // ?now=5 = 5차(스크롤 줄별), ?now=old = 4차
    mFade: qs.get('mfade') === '0' ? null : [parseFloat(qs.get('mf0')) || 120, parseFloat(qs.get('mf1')) || 800],   // 11차 사장님 '?mf1=800 이걸로' (10차 520).   // 10차 모델 알파 퇴장 창(카메라 세계 y). ?mf0 ?mf1
    // 통합 8차(사장님 '이젠도 아래에서 위로 등장 · 커튼하고 살짝 겹치니 좀 아래로 · 사라질 때도 산소 ON ibex 처럼 — 지금은 갑자기 위로 슝'): ?nowv=7 이전
    now8: qs.get('nowv') === '7' ? null : { dy: 80, rise: 60, dur: 1.1, bridge: .6, blend: [2024, 2924], fade: [.15, .5] },
    nowOpen: qs.get('nowv') === '14' ? .42 : qs.get('nowv') === '15' ? .62 : qs.get('nowv') === '17' ? .3 : .16,   /* 19차(사장님 '이젠 산소의 시간 좀 더 빨리') .3→.16, ?nowv=17 이전 */   // 17차: 위 문장이 거의 흐려진 뒤·커튼 꼬리 바로 아래(.3, 화면 y≈600)에서 열림   // 15차: 깊이 1.45 라 .42 면 화면 맨 아래에서 열림 → .62(화면 아래 1/4쯤에서 떠오름)                                // 6차: 02→03 진행 .25(아래 구름이 화면에 막 들어옴)에서 첫 타이틀식 등장 시작. 깊이 d.now .35 = 배경(1.25)보다 훨씬 느려 위에서 먼저 보이고 멈춤 03 에서 피그마 자리. ?nowd= 로 깊이
    drift: { amp: 10, period: 56 }               // 구름 흐름(시간): 알아채기 어려울 만큼
  };
  // 첫 화면 커튼 대안(기본 = 어깨 아래에서 왼쪽 위로 비스듬히): ?cur=a 화면 아래 단으로 낮게 깔림 · ?cur=b 목 아래를 스카프처럼 가로지름(턱·플로팅에 닿음)
  const CUR_ALT = { a: { x: -956, y: 57, r: 22, s: 1.32 }, b: { x: -911, y: -218, r: 12, s: 1.28 } };
  if (CUR_ALT[qs.get('cur')]) M.curtain.p0 = CUR_ALT[qs.get('cur')];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const s6 = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };     // smootherstep: 양끝 속도·가속도 0
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const quartOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 4);
  const $ = id => document.getElementById(id);

  /* ---------- 레이아웃 ---------- */
  let K = 1, VH = innerHeight;
  function layout() {
    const cw = document.documentElement.clientWidth, ch = innerHeight;
    K = Math.max(cw / W, ch / H); VH = ch;
    const RW = window.RWD && RWD.on ? RWD : null;   // 22차 반응형: 배율·화면 높이·하단 폭 배율은 js/rwd.js 가 정함(데스크톱 가로는 같은 값)
    if (RW) { K = RW.K; VH = RW.vh; }
    document.documentElement.style.setProperty('--k', K);
    document.documentElement.style.setProperty('--kw', RW ? RW.kw : cw / W);
  }
  layout(); addEventListener('resize', layout);

  /* ---------- 리본 설정 — 파일·크기·색은 여기 한 곳만 고친다 ----------
     enc  = 인코딩 해상도, crop = 원본 1920×1080 프레임에서 잘라 쓴 사각형(x0,y0,x1,y1) → 화면 크기·자리는 crop 기준으로 자동 계산(원본 1px = fit 1px)
     filter = 색 맞춤 CSS 필터. 색을 구운 판(모선 v2)이 오면 'none'.
     4차 마지막 단계에서 v2 로 갈아끼움(기본). 다른 판이 오면 세트 하나 추가하고 RIBBON_USE 만 바꾼다. */
  const RIBBON_SETS = {   // [통합] v3(15차 기본)만 복사 — ?ribv=1|2 는 원본 폴더에서
    v3: { dir: 'assets/top/ribbon/v3/', webm: 'ribbon-v3-x15-vp9-M.webm', mov: 'ribbon-v3-x15-hevc-M.mov', poster: 'ribbon-v3-x15-poster.webp',
          enc: [2880, 1506], crop: [0, 16, 1920, 1020], tau0: 4.069, filter: 'none', outline: 'assets/top/ribbon/ribbon-outline.json' },
    // 통합 13차(사장님 '거꾸로 돌리니 이질감 — 끝나는 부분을 첫씬과 동일하게 끝내서 반복'): 모선 v4 = Kling 시작=끝 프레임 재생성 → SeedVR2 ×2 → 재키잉. 정방향 9.958s 루프(핑퐁 아님), 0초 자세에서 시작
    v4: { dir: 'assets/top/ribbon/v4/', webm: 'ribbon-v4-x15-vp9-M.webm', mov: 'ribbon-v4-x15-hevc-M.mov', poster: 'ribbon-v4-x15-poster.webp',
          enc: [2880, 1506], crop: [0, 16, 1920, 1020], tau0: 0, filter: 'none', outline: 'assets/top/ribbon/v4/ribbon-outline-v4.json' }
  };
  // 22차: 폰(짧은 변 < 600)은 같은 루프를 2/3 크기(1920×1004)로 다시 구운 S 판 — 화면에 그려지는 커튼 폭이 1920 상자보다 작다
  if (window.RWD && RWD.on && RWD.phone && qs.get('ribq') !== 'M') Object.assign(RIBBON_SETS.v4, { webm: 'ribbon-v4-x1-vp9-S.webm', mov: 'ribbon-v4-x1-hevc-S.mov' });
  const RIBBON_USE = qs.get('ribv') === '3' ? 'v3' : 'v4';   // 13차 기본 v4(정방향 루프), ?ribv=3 = v3(핑퐁)   // 15차 기본 v3, ?ribv=2 = v2(원해상도), ?ribv=1 = 3차   // ?ribv=1 = 3차 영상(0.8배 축소 + CSS 색 필터)
  const RB = RIBBON_SETS[RIBBON_USE];

  /* ---------- 리본 영상: 사파리(맥·iOS 전부) = HEVC 알파, 그 외 = VP9 알파. 실패하면 포스터(정지) ---------- */
  const ribbon = $('ribbon'), video = $('ribbonVideo'), ribbonFit = $('ribbonFit');
  // fit 상자 = crop 사각형. 3차 맞춤(원본 프레임 기준 회전 −12°·1.35, 원본 점 (1101.84,656.52) → 세계 (1616.84,1306.52))을 crop 과 무관하게 유지
  { const [x0, y0, x1, y1] = RB.crop;
    Object.assign(ribbonFit.style, { left: (515 + x0) + 'px', top: (667 + y0 - 17) + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px',
      transformOrigin: `${(1101.84 - x0).toFixed(2)}px ${(656.52 - y0).toFixed(2)}px`, filter: qs.get('rib') === 'raw' ? 'none' : RB.filter });
    $('ribbonPoster').src = RB.dir + RB.poster; }
  const ua = navigator.userAgent;
  const isWebKitOnly = /iP(hone|ad|od)/.test(ua) || (/^((?!chrome|chromium|crios|fxios|android|edg).)*safari/i.test(ua));
  const RIB = { tau0: RB.tau0, src: RB.dir + (isWebKitOnly ? RB.mov : RB.webm) };
  if (!noMotion && qs.get('rib') !== 'still') {
    video.src = RIB.src;
    video.addEventListener('loadedmetadata', () => { if (!RIB.tau0) { video.play().catch(() => {}); return; } try { video.currentTime = RIB.tau0; } catch (e) {} }, { once: true });
    video.addEventListener('seeked', () => { video.play().catch(() => {}); }, { once: true });
    video.addEventListener('playing', () => ribbon.classList.add('is-playing'), { once: true });
    video.addEventListener('error', () => ribbon.classList.remove('is-playing'));
    video.load();
  }
  window.__ribbonSrc = RIB.src;
  if (qs.get('rib') === 'raw') document.documentElement.classList.add('rib-raw');
  if (qs.get('ell') === '1') document.documentElement.classList.add('ell-on');

  /* ---------- 다리: 특장점 호 1·2 (같은 텍스처·같은 실측 원) ---------- */
  const dpr = Math.min(devicePixelRatio || 1, 2);
  // [통합] 다리의 호 1·2 는 특장점 엔진의 discs[0..1] 을 이 다리 진행(bu)으로 움직인다(scene.js). 창·출발 거리 = M.arcs 그대로 → JOIN.arcs

  /* ---------- 왼쪽 도트: 피그마 벡터(332:29546) 점마다 Path2D. 로드 인트로 = 무늬 중심에서 거리순으로 점이 0 → 제 크기(quart-out) ---------- */
  const dotsCv = $('dots'), DOTS = { paths: null, done: false };
  // 반복 모션. ?dotw=0 끔(인트로 뒤 정지) · ?dotw=7 7차 물결(기각, 비교용) · 기본 = 8차 파동
  const DOTW = qs.get('dotw') === '0' ? 0 : qs.get('dotw') === '7' ? 7 : 8;
  const DW = { on: DOTW === 7, t0: M.load.dots[0] + M.load.dots[1] + M.load.dots[2], period: parseFloat(qs.get('dotp')) || 5.5, waves: 1.2, amp: parseFloat(qs.get('dota')) || .38 };   // 7차 물결
  /* 8차 파동(사장님 '가운데서부터 서서히 나타나며 바깥으로 퍼지며 사라지는'): 가운데에서 생긴 띠가 바깥으로 번지고, 띠가 지나간 점은 사라진다.
     점 하나 기준(거리 k, 0 가운데 ~ 1 끝): 띠가 오면 tin 동안 0 → 제 크기(s6), hold 머묾, tout 동안 → 0(s6). 띠 도착 = 이번 주기 시작 + k·D.
     인트로가 첫 띠의 앞머리다 — 무늬가 다 펼쳐진 뒤(rel) 그 띠의 꼬리가 가운데부터 지나가며 걷히고, 그다음부터 주기마다 새 띠.
     띠 폭(반경 비율) = (tin + hold + tout) / D. 바운스 없음(s6 는 0~1 밖으로 안 나감). */
  const DOT_V = {
    // 9차(사장님 '더 빠르게, 가운데 사라지고 테두리만 움직이는 빈 공간이 안 느껴지게'): 퍼지는 속도 1.5배(D 4.5→3.0), 주기 5.5→2.0s 라 띠가 늘 1.5개 겹쳐 있고, 바닥 floor .3 — 점이 완전히 꺼지지 않는다
    a:    { D: 3.0, tin: .55, hold: .15, tout: .6, period: 2.0, floor: .3 },   // 띠 간격 반경 .67 → 무늬 안에 띠 1.5개, 한 점이 켜진 시간 65%
    v8:   { D: 4.5, tin: 1.0, hold: .2, tout: 1.1, period: 5.5, floor: 0 },   // ?dotv=v8 = 8차 기본(띠 폭 .51, 한 점이 보이는 시간 42%)
    thin: { D: 3.6, tin: .55, hold: .1, tout: .75, period: 4.2 },    // ?dotv=thin 얇은 파문: 띠 폭 .39, 빠른 박동
    slow: { D: 6.0, tin: 1.6, hold: .5, tout: 1.8, period: 8.0 }     // ?dotv=slow 넓고 느린 숨: 띠 폭 .65
  };
  const DP = Object.assign({}, DOT_V[qs.get('dotv')] || DOT_V.a);
  if (qs.get('dotp')) DP.period = parseFloat(qs.get('dotp'));
  if (qs.get('dotf')) DP.floor = parseFloat(qs.get('dotf'));   // ?dotf= 바닥(0 = 완전히 꺼짐)
  DP.floor = DP.floor || 0;
  if (qs.get('dotb')) { const f = parseFloat(qs.get('dotb')); DP.tin *= f; DP.hold *= f; DP.tout *= f; }
  // 11차(사장님 '처음 등장하고 반복되기까지 한참 걸림'): 인트로가 다 펼쳐질 때(3.5s)까지 기다리지 않고, 가운데 점이 자라자마자(1.4s) 첫 꼬리가 출발 → 인트로가 곧 첫 파동. ?dotrel= 초
  DP.rel = qs.get('dotrel') ? parseFloat(qs.get('dotrel')) : M.load.dots[0] + M.load.dots[2];   // 10차: dots 합계 + .8 = 3.5s
  const dotWave = (tl, k) => {
    const tau = tl - DP.rel - k * DP.D;
    if (tau < 0) return 1;
    const t = tau % DP.period, on = DP.period - DP.tin - DP.hold;
    if (t < DP.tout) return 1 - s6(t / DP.tout);
    if (t < on) return 0;
    if (t < on + DP.tin) return s6((t - on) / DP.tin);
    return 1;
  };
  const dctx = dotsCv.getContext('2d');
  { const s = Math.min(2, dpr * K); dotsCv.width = Math.round(1058 * s); dotsCv.height = Math.round(1056 * s); DOTS.s = s; }
  function drawDots(tl) {
    if (!DOTS.paths) return;
    const I = M.load.dots, s = DOTS.s; let all = true;
    dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.clearRect(0, 0, dotsCv.width, dotsCv.height); dctx.fillStyle = 'rgb(76,180,236)';
    for (const d of DOTS.paths) {
      let g = noMotion ? 1 : quartOut((tl - I[0] - d.k * I[1]) / I[2]);   // 인트로: 승인된 번짐 중심('+' 교차점) 그대로
      if (g < 1) all = false;
      if (DOTW === 8 && !noMotion) g *= DP.floor + (1 - DP.floor) * dotWave(tl, d.kw);
      if (g <= 0) continue;
      // 7차(사장님 '배경에 묻힌 패턴도 반복 모션'): 인트로가 끝난 점부터 무늬 중심 → 바깥으로 숨결 물결이 계속 지나간다(점이 살짝 작아졌다 돌아옴). ?dotw=0 끔
      if (DW.on && !noMotion) { const ph = (tl - DW.t0) / DW.period - d.k * DW.waves, w = .5 - .5 * Math.cos(2 * Math.PI * ph);
        g *= 1 - DW.amp * w * Math.min(1, Math.max(0, (tl - DW.t0) / 1.5)); }
      // 피그마 노드는 좌우 반전 배치(metadata x 596 = 반전 원점, 596 − 1050 − 인셋 4 = −458 = 실측 자리) → x' = 1058 − x
      dctx.setTransform(-s * g, 0, 0, s * g, s * (1058 - d.cx * (1 - g)), s * d.cy * (1 - g));
      dctx.fill(d.p);
    }
    DOTS.done = all;
  }
  // 8차: 움직이는 판은 dots-split.json — 피그마에서 붙어 한 경로가 된 점 덩어리(가운데 원판·좌우 호 등 5개)를 격자 점으로 되살린 것(IoU .88~.94, 도구/split_dot_clusters.py).
  //   덩어리째 커졌다 작아지면 큰 조각이 통째로 튄다. 정지판(?motion=0)·?dotw=0/7 은 피그마 원본 그대로.
  const dotsReady = fetch(!noMotion && DOTW === 8 ? 'assets/top/dots-split.json' : 'assets/top/dots-vector.json').then(r => r.json()).then(J => {
    const OX = 728, OY = 420;   // 인트로 번짐 중심 = 보이는 무늬의 '+' 교차점(세계 270,860) — 승인된 인트로 그대로
    const WX = 529, WY = 528;   // 8차 파동 중심 = 무늬 동심원의 진짜 중심(점 1106개 중심·격자점, 세계 71,968). 다른 데서 퍼지면 띠가 고리를 가로질러 초승달로 깨진다
    const R = Math.max(...J.paths.map(([, cx, cy]) => Math.hypot((1058 - cx) - OX, cy - OY)));
    const RW = Math.max(...J.paths.map(([, cx, cy]) => Math.hypot((1058 - cx) - WX, cy - WY)));
    DOTS.paths = J.paths.map(([d, cx, cy]) => ({ p: new Path2D(d), cx, cy, k: Math.hypot((1058 - cx) - OX, cy - OY) / R, kw: Math.hypot((1058 - cx) - WX, cy - WY) / RW }));
    if (noMotion) drawDots(99);
  });

  const ready = () => document.documentElement.classList.add('is-ready');
  // [통합] 정지판(긴 한 장) 대신: 같은 스크롤 판에서 시간 모션(로드 인트로·도트 파동·리본 영상·구름 흐름)만 끈다 — 특장점 쪽 noMotion 과 같은 뜻
  const JOIN = window.JOIN = window.JOIN || {};

  /* ---------- 트랙 ---------- */
  // 8차 카메라: 장면 지점 (Pk, Ck) 를 지나는 3차 Hermite. 평균 기울기 R(세계 px / vh) = camRate·1080 이 모든 구간에서 같고,
  //   지점 기울기 = 시작 1·R(첫 휠부터 움직임) · 02·03 camH·R · 끝 camEnd·R. 단조(기울기 ≤ 3R) → 어디서나 속도 > 0, 멈춤 없음.
  //   마지막 구간(다리)만 길이를 평균 기울기 = (시작 + 끝)/2 로 잡는다 → 속도가 다리 내내 곧게 줄어 특장점 첫 화면에 내려앉는다(중간 불룩 없음).
  const R = M.camRate * H, CK = M.cam;
  // 13차(사장님 '커튼 좌→우 움직이는 스크롤을 조금만 더 길게'): 01→02 구간만 카메라를 느리게(S1 .72 → 그 구간 스크롤 길이 ×1.39). 02 지점 기울기는 두 구간 평균. ?cs1=1 이전
  const S1 = parseFloat(qs.get('cs1')) || .36;   /* 21차(사장님 '커튼 스크롤하면 움직이는 스피드를 좀 더 느리게'): .48→.36(커튼 구간 스크롤 ×1.33, 14차 대비). ?cs1=.48 이전 */   // 14차 사장님 '1.5배 늘려도' .72→.48(커튼 구간 스크롤 ×1.5), ?cs1=.72 13차
  const MK = [S1, (S1 + 1) / 2 * M.camH, M.camH, M.camEnd].map(m => m * R);
  const PK = [0]; for (let i = 1; i < CK.length; i++) PK.push(PK[i - 1] + (CK[i] - CK[i - 1]) / (i === CK.length - 1 ? (MK[i - 1] + MK[i]) / 2 : i === 1 ? R * S1 : R));
  const PMAX = PK[PK.length - 1];
  JOIN.PMAX = PMAX; JOIN.C3 = CK[2]; JOIN.C4 = CK[3]; JOIN.arcs = M.arcs; JOIN.cam = 0; JOIN.bu = 0;   // [통합] 트랙 높이는 scene.js 가 (PMAX + SMAX + 1)·100vh 로
  function camAt(p) {
    p = clamp(p, 0, PMAX);
    let i = 0; while (i < PK.length - 2 && p > PK[i + 1]) i++;
    const h = PK[i + 1] - PK[i], t = (p - PK[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * CK[i] + (t3 - 2 * t2 + t) * h * MK[i] + (-2 * t3 + 3 * t2) * CK[i + 1] + (t3 - t2) * h * MK[i + 1];
  }
  // 깊이 섞기: 창 [c0,c1] 에서 깊이 d0 → d1(smoothstep). 누적 이동량 D(c) = ∫ d. 화면 y 이동 = −A − (D(cam) − D(A)) → cam = A 에서 피그마 자리
  const Jss = t => t <= 0 ? 0 : t >= 1 ? t - .5 : t * t * t - t * t * t * t / 2;
  const Dint = (c, d0, d1, c0, c1) => d0 * c + (d1 - d0) * (c1 - c0) * Jss((c - c0) / (c1 - c0));
  const parB = (cam, A, d0, d1, w) => -A - (Dint(cam, d0, d1, w[0], w[1]) - Dint(A, d0, d1, w[0], w[1]));
  const camU = (cam, a, b) => clamp((cam - a) / (b - a), 0, 1);

  const L = { ell: $('ellipse'), sky: $('sky'), cTL: $('cloudTL'), cTR: $('cloudTR'), cB: $('cloudB'), dots: $('dots'), model: $('model'), hero: $('copyHero'), brand: $('copyBrand'), now: $('copyNow') };
  const lines = el => Array.from(el.querySelectorAll('.copy__line, :scope > p'));
  const T = { hero: lines(L.hero), brand: lines(L.brand), now: lines(L.now) };
  const gate = { brand: null, now: null, ox: null };
  T.brand.forEach(el => { el.style.opacity = '1'; });   // 4차: 문장은 줄 순차 대신 커튼 경계 마스크로 드러남
  const fix = v => v.toFixed(2);
  const ty = (el, y, extra = '') => { el.style.transform = `translate3d(0,${fix(y)}px,0)${extra}`; };
  // 레이어 화면 이동량: (A, d) → translateY = −A − (cam − A)·d
  const par = (cam, A, d) => -A - (cam - A) * d;

  // 줄 순차 등장(특장점 setText 문법): 창 p 가 열린 순간 시각을 잡고, 줄 k 는 k·gap 뒤 ramp 동안. 창이 닫히면 리셋(되감기)
  function seqText(key, list, open, now, outF) {
    if (open && gate[key] === null) gate[key] = now;
    if (!open) gate[key] = null;
    const t0 = gate[key];
    list.forEach((el, k) => {
      const e = t0 === null ? 0 : quartOut((now - t0 - k * M.text.gap) / M.text.ramp);
      el.style.opacity = (e * outF).toFixed(3);
      el.style.transform = `translate3d(0,${fix((1 - e) * M.text.rise)}px,0)`;
    });
  }

  /* ---------- 커튼 자세 · 문장 드러냄 ---------- */
  const RO = [1880, 1120];                     // 바깥 자세 기준점 = 어깨(.ribbon transform-origin)
  // 8차: 물러남(k)·위로 빠짐(깊이 1 → 1.35 섞기)·앞으로 커짐(02→03)을 한 식으로 — 장면 경계에서 속도가 꺾이지 않게
  const curtainK = cam => 1 - s6((cam - M.curtain.slide[0]) / (M.curtain.slide[1] - M.curtain.slide[0]));   // 1 = 첫 화면 자세, 0 = 02 자세
  function curtainPose(cam) {
    const [, C2, C3] = M.cam, c = M.curtain, k = curtainK(cam);
    const grow = 1 + M.ribbonGrow * s6((cam - C2) / (C3 - C2));
    return { x: c.p0.x * k, y: parB(cam, C2, 1, M.d.ribbonAfter, M.blend.ribbon) + c.p0.y * k, r: c.p0.r * k, s: (1 + (c.p0.s - 1) * k) * grow };
  }
  // 커튼 윤곽(루프 합집합, 원본 프레임 좌표) → 세계(3차 fit: 원본 (1101.84,656.52) ↦ (1616.84,1306.52), 회전 −12°·1.35)
  let OUT = null;
  fetch(RB.outline).then(r => r.json()).then(J => {
    const a = -12 * Math.PI / 180, c = Math.cos(a) * 1.35, s = Math.sin(a) * 1.35, n = J.pts.length / 2;
    OUT = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const x = J.pts[2 * i] - 1101.84, y = J.pts[2 * i + 1] - 656.52; OUT[2 * i] = 1616.84 + c * x - s * y; OUT[2 * i + 1] = 1306.52 + s * x + c * y; }
  });
  const BR = { x: 328, top: 1346, lh: 54 };   // 문장 상자(세계): 4줄 × 54 (36px / 1.5)
  // 줄마다: 그 줄 높이 띠에 걸친 커튼 점 중 가장 왼쪽 x = 커튼 왼쪽 경계. 글자는 경계 − in 까지 또렷, 경계 + out 에서 0
  //   → 커튼 밑에서 글자가 나온다(글자는 커튼 위 레이어지만 경계 안쪽에선 녹아 있음). 띠에 커튼이 없으면 물러남 진행으로 판정.
  const BRISE = qs.get('brise') === '6' ? { y: 36, dur: .9, gap: .14, ease: 'quart' } : { y: qs.get('brise') !== null && !isNaN(parseFloat(qs.get('brise'))) ? parseFloat(qs.get('brise')) : 64, dur: 1.15, gap: .16, ease: 'expo', block: qs.get('brise') !== '19' }   /* 20차(사장님 '그냥 덩어리 하나로 가자. 한줄한줄 말고. 모션이 아무래도 이상해'): 네 줄이 한 덩어리로 같이 떠오름. ?brise=19 19차(줄마다) */   /* 19차(사장님 '한 줄씩 나오는데 텐션이 빠르고 느리게 슥'): 36px quart .9s → 64px expo-out 1.15s(처음 확 → 끝 길게 감속). ?brise=6 이전 */, BT = [null, null, null, null];
  function revealBrand(CP, bY, outF, cam) {
    const n = T.brand.length, edges = new Array(n).fill(null);
    const k = curtainK(cam);
    // 22차: 문장 상자를 요소에서 다시 잼(세로 화면은 글자가 커짐). 데스크톱 = 328 · 1346 · 54 그대로
    if (window.RWD && RWD.on && BR.gen !== RWD.gen) { BR.gen = RWD.gen; BR.x = L.brand.offsetLeft; BR.top = L.brand.offsetTop; BR.lh = parseFloat(getComputedStyle(T.brand[0]).lineHeight) || 54; }
    if (OUT) {
      const a = CP.r * Math.PI / 180, c = Math.cos(a) * CP.s, s = Math.sin(a) * CP.s;
      const top = BR.top + bY;
      for (let i = 0; i < OUT.length; i += 2) {
        const dx = OUT[i] - RO[0], dy = OUT[i + 1] - RO[1];
        const li = Math.floor((RO[1] + CP.y + s * dx + c * dy - top) / BR.lh);
        if (li < 0 || li >= n) continue;
        const sx = RO[0] + CP.x + c * dx - s * dy;
        if (edges[li] === null || sx < edges[li]) edges[li] = sx;
      }
    }
    T.brand.forEach((el, i) => {
      const edge = edges[i] !== null ? edges[i] : (k < .5 ? 1e4 : -1e4);
      const e = edge - BR.x;
      const g = `linear-gradient(90deg,#000 ${fix(e - M.reveal.in)}px,transparent ${fix(e + M.reveal.out)}px)`;
      el.style.webkitMaskImage = g; el.style.maskImage = g;
      // 통합 6차(사장님 '마스크로 벗겨지듯 등장 … 여기서 아래에서 위로 슥 한줄씩 등장도 추가'): 커튼 경계가 그 줄에 닿는 순간 시간 등장(아래 BRISE.y px → 0, BRISE.dur s)을 건다. 되감아 줄이 다시 덮이면 풀린다. ?brise=0 이전
      if (BRISE.y) {
        const shown = e + M.reveal.out > 0;   // 마스크가 줄 첫 글자에 닿음
        if (shown && BT[i] === null) BT[i] = BRISE.block ? (BT.find(v => v !== null) ?? performance.now()) : Math.max(performance.now(), i && BT[i - 1] !== null ? BT[i - 1] + BRISE.gap * 1000 : 0);   // 20차 block: 첫 줄이 열린 시각을 네 줄이 같이 씀   // 윗줄보다 최소 gap 뒤 — 커튼이 여러 줄을 한꺼번에 걷어도 한 줄씩
        else if (!shown) { BT[i] = null; if (BRISE.block) BT.fill(null); }
        const u = BT[i] === null ? 0 : noMotion ? 1 : (BRISE.ease === 'expo' ? expoOut(clamp((performance.now() - BT[i]) / 1000 / BRISE.dur, 0, 1)) : quartOut((performance.now() - BT[i]) / 1000 / BRISE.dur));   // 시작 전(gap 대기)엔 음수 → 0
        el.style.transform = `translate3d(0,${fix((1 - u) * BRISE.y)}px,0)`;
      }
    });
    L.brand.style.opacity = outF.toFixed(3);
  }

  const FEAT = document.getElementById('feat');
  let P = 0, Pt = 0, last = performance.now(), t0 = null;
  const fixT = qs.get('t') !== null ? parseFloat(qs.get('t')) : null;   // 검증: 로드 시각 고정
  let camNow = 0;
  window.__top = { get P() { return P; }, get cam() { return camNow; }, camAt, PMAX, M };
  function frame(now) {
    if (t0 === null && (noMotion || qs.get('ld10') === '0' || document.documentElement.classList.contains('is-ready'))) t0 = now;   // 통합 10차: 로드 인트로 시계는 화면이 보이기 시작할 때부터(하늘 기다리는 동안 인트로가 안 보이게 지나가지 않게)
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const tl = noMotion ? 99 : fixT !== null ? fixT : t0 === null ? 0 : (now - t0) / 1000;   // 로드 후 시간(s) — [통합] 모션 끔이면 로드 끝 상태
    Pt = clamp(scrollY / VH, 0, PMAX);
    P += (Pt - P) * (1 - Math.exp(-M.lambda * dt));
    if (Math.abs(Pt - P) < 1e-4) P = Pt;
    if (window.__P !== undefined) P = window.__P;            // 검증 훅

    // 카메라
    const [C0, C2, C3, C4] = M.cam;
    const cam = camNow = camAt(P);
    const drift = noMotion ? 0 : M.drift.amp * Math.sin(2 * Math.PI * tl / M.drift.period);

    // 하늘(d 1)
    ty(L.sky, -cam);
    // 위 구름(뒤, 0.8) + 흐름
    L.cTL.style.transform = `translate3d(${fix(drift)}px,${fix(par(cam, 0, M.d.cloudTop))}px,0)`;
    L.cTR.style.transform = `translate3d(${fix(-drift * .6)}px,${fix(par(cam, 0, M.d.cloudTop))}px,0)`;

    // 도트: 1.1. 로드 인트로 동안만 다시 그림
    if (!DOTS.done || (DOTW && cam < C3)) drawDots(tl);   // 반복 모션은 도트가 화면에 있는 동안(03 전까지) 매 프레임
    ty(L.dots, par(cam, 0, M.d.dots));

    // 모델: 01→02 는 하늘과 같이(1), 02 뒤로는 1.1 로 위로 빠짐. 로드: 아래 36px 에서 떠오름
    const mE = expoOut(clamp((tl - M.load.model[0]) / M.load.model[1], 0, 1));
    const mY = parB(cam, C2, 1, M.d.modelAfter, M.blend.model);   // 8차: 깊이 1 → 1.1 을 02 지나며 섞음
    // 10차(사장님 '스크롤되서 내려올 때 모델이 잘려 보이니 이상 — 자연스럽게 알파로 사라지게'): 얼굴이 화면 위로 빠지기 시작하면(cam mFade[0]) 서서히 투명, 목·어깨만 남기 전에(mFade[1]) 0. ?mfade=0 끔
    const mF = M.mFade ? 1 - s6((cam - M.mFade[0]) / (M.mFade[1] - M.mFade[0])) : 1;
    ty(L.model, mY + (1 - mE) * M.load.model[2]); L.model.style.opacity = (mE * mF).toFixed(3);
    ty(L.ell, mY + (1 - mE) * M.load.model[2]); L.ell.style.opacity = (mE * mF).toFixed(3);   // Ellipse 1 = 몸의 그늘, 모델과 한 몸

    // 01 글자: 로드 순차("산소 ON," → 한 박자 뒤 "ibex"), 스크롤엔 1.25 로 앞서 올라감
    ty(L.hero, par(cam, 0, M.d.hero));
    T.hero.forEach((el, k) => {
      const e = quartOut((tl - M.load.hero[0] - k * M.load.heroGap) / M.load.hero[1]);
      el.style.opacity = e.toFixed(3); el.style.transform = `translate3d(0,${fix((1 - e) * M.load.hero[2])}px,0)`;
    });

    // 리본(커튼): 01→02 = 첫 화면 자세 → 멈춤 02 자세(오른쪽으로 물러남). 02→03 = 3차 그대로(1.35 로 위로, 앞으로 18% 커짐)
    const CP = curtainPose(cam);
    ribbon.style.transform = `translate3d(${fix(CP.x)}px,${fix(CP.y)}px,0) rotate(${CP.r.toFixed(3)}deg) scale(${CP.s.toFixed(4)})`;

    // 02 문장: 1.15, 멈춤 02 직전(.85)에 창이 열림. 02→03 앞부분에 위로 빠지며 흐려짐
    const bY = par(cam, C2, M.d.brand);
    ty(L.brand, bY);
    revealBrand(CP, bY, 1 - ss(M.brandFade[0], M.brandFade[1], cam), cam);

    // 아래 구름: 02→03 은 1.25 로 떠오름. 다리에선 화면에 거의 머문 채(위로 M.cloudLift 만) 걷힌다 — 그 뒤에서 호가 올라와 구름 윗선 자리에 선다
    const bu = camU(cam, C3, C4);
    const wB = M.blend.cloudB, cBY = parB(cam, C3, M.d.cloudB, wB[2], wB);   // 8차: 1.25 → .03 을 03 지나며 섞음 — 다리에선 화면에 거의 머문 채 걷힌다(멈춤 없이)
    L.cB.style.transform = `translate3d(${fix(drift * .5)}px,${fix(cBY)}px,0)`;
    L.cB.style.opacity = (1 - ss(M.cloudBridgeFade[0], M.cloudBridgeFade[1], bu)).toFixed(3);

    // 03 글자
    const N8 = M.now8;   // 8차: 다리 깊이 1.2→.6, 섞는 창 400→900px(가속 없이 스르륵 — 첫 타이틀이 하늘과 거의 같이 빠지듯), 자리 +80 아래
    const nY = N8 ? parB(cam, C3, M.d.now, N8.bridge, N8.blend) + N8.dy : parB(cam, C3, M.d.now, M.d.nowBridge, M.blend.now);
    ty(L.now, nY);
    // 5차(사장님 '구름이 등장할 때부터 서서히 한 줄씩'): 시간 게이트 대신 스크롤 창 — 02→03 구간 안에서 줄마다 [시작, 끝](segU(3) 기준). ?now=old 이전(03 멈춤 직전 시간 순차)
    const u3 = (cam - C2) / (C3 - C2);   // 02→03 진행(카메라 기준)
    if (M.nowOld) seqText('now', T.now, u3 >= .92, now / 1000, 1 - ss(0, .3, bu));
    else if (!M.now5) {   // 6차(사장님 '첫 타이틀과 같은 등장모션, 더 위에서 먼저, 배경과 시간차 두고 하단 끝까지 가면 원래 위치로 딱')
      const open = u3 >= M.nowOpen, tN = now / 1000;   // 8차: 창 = 카메라 기준 그대로(.42), 끝 장면까지 열린 채
      if (open && gate.now === null) gate.now = tN; if (!open) gate.now = null;
      const nOut = N8 ? 1 - ss(N8.fade[0], N8.fade[1], bu) : 1 - ss(0, .3, bu), nR = N8 ? N8.rise : M.load.hero[2], nD = N8 ? N8.dur : M.load.hero[1];
      T.now.forEach((el, k) => { const e = gate.now === null ? 0 : noMotion ? 1 : quartOut((tN - gate.now - k * M.load.heroGap) / nD);
        el.style.opacity = (e * nOut).toFixed(3); el.style.transform = `translate3d(0,${fix((1 - e) * nR)}px,0)`; }); }
    else { const nOut = 1 - ss(0, .3, bu);
      T.now.forEach((el, k) => { const w = M.nowWin[k] || M.nowWin[M.nowWin.length - 1], e = s6(clamp((u3 - w[0]) / (w[1] - w[0]), 0, 1));
        el.style.opacity = (e * nOut).toFixed(3); el.style.transform = `translate3d(0,${fix((1 - e) * M.text.rise)}px,0)`; }); }

    // [통합] 다리의 호 1·2·OXYGEN 글자 = 특장점 엔진(scene.js)이 이 값으로 그린다
    JOIN.cam = cam; JOIN.bu = bu; JOIN.P = P;
    if (window.RWD && RWD.frame) RWD.frame(cam);   // 22차: 세로 화면 시점 이동(pan)·초광폭 구름 복제 — 같은 프레임의 카메라로
    // 통합 10차(사장님 '첫화면 로딩 때 흰바탕에 원·커튼이 깨지듯 로딩'): 다리(03) 전까지 특장점 무대는 상단 하늘이 다 덮으므로 아예 숨긴다 — 하늘 그림이 늦게 칠해져도 그 뒤 OXYGEN 호·옅은 바탕이 비치지 않게. ?ld10=0 이전
    if (FEAT) { const vis = qs.get('ld10') === '0' || cam >= C3 - 1; if (vis !== FEAT._vis) { FEAT._vis = vis; FEAT.style.visibility = vis ? 'visible' : 'hidden'; } }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // 첫 프레임 쓰고 나서 보이기(등장 전 상태가 한 번 깜빡이지 않게)
  requestAnimationFrame(() => requestAnimationFrame(ready));
})();
