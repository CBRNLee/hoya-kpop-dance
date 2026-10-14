'use strict';

/* =========================================================
   호야의 K-POP 댄스 파티 - 게임 코드

   동작 원리
   1) 댄스 영상과 카메라 화면에서 각각 사람의 관절(어깨·팔꿈치·손목·무릎 등)을 찾아요.
   2) 팔·다리가 가리키는 방향을 서로 비교해서 얼마나 비슷한지 0~1 점수로 계산해요.
   3) 1.5초마다 판정해서 "최고야 / 잘했어 / 좋아 / 다시 해봐"를 보여 줘요.

   댄스 영상은 두 가지 중에 고를 수 있어요
   - ▶ 유튜브: 유튜브 영상을 게임 안에서 틀어요. "이 탭 공유"를 허용하면 영상 속 댄서와 비교해 채점해요.
   - 🎬 내 영상: 선생님이 가진 영상 파일(mp4)을 넣어서 틀어요.
   ========================================================= */

// ---------- 1. 무대 그림 (노래 카드에 들어가는 작은 그림) ----------
const ICONS = {
  seoul: `<svg viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="78" cy="16" r="8" fill="#fff6c2"/>
      <circle cx="18" cy="20" r="1.6" fill="#fff"/><circle cx="30" cy="10" r="1.2" fill="#fff"/><circle cx="68" cy="38" r="1.4" fill="#fff"/>
      <path d="M0 96 Q48 52 96 96Z" fill="#3fa36b"/>
      <rect x="45" y="24" width="6" height="48" rx="2" fill="#fff"/>
      <ellipse cx="48" cy="34" rx="12" ry="6" fill="#fff"/>
      <rect x="47" y="8" width="2" height="16" fill="#fff"/>
    </svg>`,
  palace: `<svg viewBox="0 0 96 96" aria-hidden="true">
      <path d="M6 40 Q48 18 90 40 Q78 37 72 44 H24 Q18 37 6 40Z" fill="#3a2e2a"/>
      <rect x="22" y="44" width="52" height="8" fill="#2a9d8f"/>
      <rect x="22" y="47" width="52" height="2" fill="#e63946"/>
      <rect x="26" y="52" width="6" height="30" fill="#c0392b"/>
      <rect x="45" y="52" width="6" height="30" fill="#c0392b"/>
      <rect x="64" y="52" width="6" height="30" fill="#c0392b"/>
      <rect x="16" y="82" width="64" height="6" rx="2" fill="#e9d8b4"/>
    </svg>`,
  jeju: `<svg viewBox="0 0 96 96" aria-hidden="true">
      <path d="M4 80 L38 34 Q48 26 58 34 L92 80Z" fill="#4f9d69"/>
      <path d="M40 36 Q48 30 56 36 L52 40 Q48 37 44 40Z" fill="#fff"/>
      <rect x="0" y="80" width="96" height="16" fill="#38bdf8"/>
      <circle cx="72" cy="66" r="14" fill="#ff9f1c"/>
      <path d="M72 52 Q78 44 86 48 Q80 54 72 52Z" fill="#3bb273"/>
    </svg>`,
  busan: `<svg viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="44" r="18" fill="#ffd166"/>
      <path d="M16 24 q4 -4 8 0 q4 -4 8 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M64 18 q3 -3 6 0 q3 -3 6 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M0 58 Q12 50 24 58 T48 58 T72 58 T96 58 V96 H0Z" fill="#1e88e5"/>
      <path d="M0 72 Q12 64 24 72 T48 72 T72 72 T96 72 V96 H0Z" fill="#4fc3f7"/>
    </svg>`,
};

// ---------- 2. 노래 목록 (곡을 바꾸거나 늘리려면 여기를 고치세요) ----------
// youtube: 처음에 연결해 둔 유튜브 영상 (선생님이 노래 카드의 [주소 바꾸기]로 바꿀 수 있어요)
// defaultSource: 'file'이면 처음 열었을 때 '🎬 내 영상'이 골라져 있어요
//   (소다팝·골든은 저스트댄스 팬 영상이 다른 사이트 재생을 막아 둬서, 선생님이 찍은 영상을 쓰기로 했어요)
const SONGS = [
  { id: 'soda-pop',    title: '소다팝',   en: 'Soda Pop',    artist: '케이팝 데몬 헌터스', stage: '서울 남산 무대', icon: ICONS.seoul,  bg: 'linear-gradient(160deg, #3b2a8f 0%, #ff5fa2 100%)',
    defaultSource: 'file', youtube: { id: 'eny0BqmSwmM', label: '넷플릭스 공식 가사 영상' } },
  { id: 'golden',      title: '골든',     en: 'Golden',      artist: '케이팝 데몬 헌터스', stage: '경복궁 무대',    icon: ICONS.palace, bg: 'linear-gradient(160deg, #ffcf3f 0%, #ff8a3d 100%)',
    defaultSource: 'file', youtube: { id: 'VqpB787pGpE', label: '넷플릭스 공식 MAMA 무대' } },
  { id: 'its-me',      title: '잇츠미',   en: "IT'S ME",     artist: '아일릿',             stage: '제주도 무대',    icon: ICONS.jeju,   bg: 'linear-gradient(160deg, #9be15d 0%, #00b894 100%)',
    youtube: { id: 'xYQiE4SZ1F0', label: '저스트댄스 팬메이드 · EvmeJD' } },
  { id: 'catch-catch', title: '캐치캐치', en: 'Catch Catch', artist: '최예나',             stage: '부산 바다 무대', icon: ICONS.busan,  bg: 'linear-gradient(160deg, #4facfe 0%, #00c6e0 100%)',
    youtube: { id: 'LrhZClX_1-Q', label: '저스트댄스 팬메이드 · Jean Braz' } },
];

// ---------- 3. 난이도 (숫자가 낮을수록 점수를 후하게 줘요) ----------
const DIFFICULTY = {
  easy:   { perfect: 0.62, great: 0.45, good: 0.28 },
  normal: { perfect: 0.72, great: 0.55, good: 0.38 },
  hard:   { perfect: 0.82, great: 0.67, good: 0.50 },
};

// ---------- 4. 판정 종류 ----------
const JUDGES = {
  perfect: { text: '최고야!',    emoji: '🌟', points: 100, color: '#ffb703', buddy: '우와, 최고야! 🌟' },
  great:   { text: '잘했어!',    emoji: '👏', points: 70,  color: '#3bb273', buddy: '잘했어! 👏' },
  good:    { text: '좋아!',      emoji: '🙂', points: 40,  color: '#3a86ff', buddy: '좋아, 계속 가자!' },
  miss:    { text: '다시 해봐!', emoji: '💪', points: 0,   color: '#ffffff', buddy: '영상을 보고 따라 해 봐!' },
  away:    { text: '어디 있지?', emoji: '👀', points: 0,   color: '#ffffff', buddy: '카메라 앞으로 와 줘!' },
};

// ---------- 5. 세부 설정 ----------
const VISION_VER = '0.10.14';
const VISION_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VER}/vision_bundle.mjs`;
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VER}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const YT_API_URL = 'https://www.youtube.com/iframe_api';

const JUDGE_INTERVAL = 1.5; // 몇 초마다 판정할지
const LAG_WINDOW = 1.0;     // 아이가 조금 늦게 따라 해도 봐주는 시간(초)
const DETECT_MS = 66;       // 인식 간격(밀리초) → 1초에 약 15번
const VIS_MIN = 0.5;        // 이만큼 또렷하게 보이는 관절만 사용
const ENERGY_FULL = 0.8;    // 이만큼 움직이면 '열심히 움직임' 만점
const READY_HOLD = 1.0;     // 몸이 보이고 이 시간(초)이 지나면 자동 시작

// 관절 번호 (MediaPipe 기준): 11·12 어깨, 13·14 팔꿈치, 15·16 손목, 23·24 엉덩이, 25·26 무릎, 27·28 발목
// [이름, 시작 관절, 끝 관절, 중요도] — 유치원 춤은 팔 동작이 중심이라 팔을 더 중요하게 봐요
const SEGMENTS = [
  ['왼쪽 위팔',   11, 13, 1.0],
  ['왼쪽 아래팔', 13, 15, 1.0],
  ['오른쪽 위팔', 12, 14, 1.0],
  ['오른쪽 아래팔', 14, 16, 1.0],
  ['왼쪽 허벅지', 23, 25, 0.3],
  ['왼쪽 정강이', 25, 27, 0.3],
  ['오른쪽 허벅지', 24, 26, 0.3],
  ['오른쪽 정강이', 26, 28, 0.3],
];
const MIRROR = [2, 3, 0, 1, 6, 7, 4, 5];   // 왼쪽 ↔ 오른쪽 짝
const ENERGY_POINTS = [13, 14, 15, 16, 25, 26, 27, 28];
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
const JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// ---------- 6. 게임 상태 ----------
const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const el = {
  danceVideo: $('dance-video'), danceCanvas: $('dance-canvas'),
  camVideo: $('cam-video'), camCanvas: $('cam-canvas'),
  captureVideo: $('capture-video'),
  videoBox: $('video-box'), judge: $('judge'),
};

const S = {
  song: null,
  phase: 'idle',          // idle | loading | ready | countdown | playing | paused | ended | error
  readyStep: 'body',      // capture(화면 공유 준비) | body(몸 보이는지 확인)
  runId: 0,
  countToken: 0,
  raf: 0,
  lastTick: 0, lastCamDetect: 0, lastVidDetect: 0,
  camStream: null,
  capture: null,          // 화면 공유 { stream, track }
  models: null,           // { cam, vid } 자세 인식기 2개 (카메라용, 영상용)
  modelPromise: null,
  settings: { difficulty: 'easy', flip: false, debug: false, source: {}, yt: {} },
  videos: {},             // 노래 id → { blob, name, url }
  best: {},
  pickingFor: null,
  dbOk: true,
  // 한 판 동안 쓰는 값
  score: 0, combo: 0, maxCombo: 0, judged: 0,
  counts: { perfect: 0, great: 0, good: 0, miss: 0 },
  winStart: 0, win: null,
  dancerHist: [], prevDancer: null, prevChild: null,
  lastChild: null, readyTime: 0, childColor: '#ffffff',
  stallTime: 0, debugDancer: '',
};

const sourceOf = (song) => S.settings.source[song.id] || song.defaultSource || 'youtube';
const ytIdOf = (song) => S.settings.yt[song.id] || song.youtube.id;
const ytLabelOf = (song) => (S.settings.yt[song.id] ? '선생님이 넣은 유튜브 영상' : song.youtube.label);

/* =========================================================
   저장하기 (설정·최고 점수는 localStorage, 영상은 IndexedDB)
   ========================================================= */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장 못 해도 게임은 계속 */ }
}
const saveSettings = () => saveJSON('hoya-settings', S.settings);

const DB_NAME = 'hoya-dance', DB_STORE = 'videos';
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(id, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGetAll() {
  const db = await openDB();
  const out = {};
  await Promise.all(SONGS.map((song) => new Promise((resolve) => {
    const req = db.transaction(DB_STORE).objectStore(DB_STORE).get(song.id);
    req.onsuccess = () => { if (req.result) out[song.id] = req.result; resolve(); };
    req.onerror = () => resolve();
  })));
  return out;
}

async function loadStoredVideos() {
  try {
    const stored = await dbGetAll();
    for (const [id, v] of Object.entries(stored)) {
      S.videos[id] = { blob: v.blob, name: v.name, url: URL.createObjectURL(v.blob) };
    }
  } catch (e) {
    console.warn('영상 저장소를 열 수 없어요', e);
    setStorageWarning();
  }
}
function setStorageWarning() {
  S.dbOk = false;
  const note = $('storage-note');
  note.textContent = '⚠️ 이 브라우저에서는 영상을 저장할 수 없어요. 게임을 새로 열 때마다 영상을 다시 넣어 주세요.';
  note.hidden = false;
}

/* =========================================================
   화면 전환
   ========================================================= */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
}

function setPhase(phase) {
  S.phase = phase;
  $('ov-loading').classList.toggle('show', phase === 'loading');
  $('ov-ready').classList.toggle('show', phase === 'ready');
  $('ov-countdown').classList.toggle('show', phase === 'countdown');
  $('ov-pause').classList.toggle('show', phase === 'paused');
  $('ov-error').classList.toggle('show', phase === 'error');
}

/* =========================================================
   노래 고르기 화면
   ========================================================= */
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderSongs() {
  const grid = $('song-grid');
  grid.innerHTML = '';
  for (const song of SONGS) {
    const src = sourceOf(song);
    const v = S.videos[song.id];
    const best = S.best[song.id];
    let info;
    if (src === 'youtube') {
      info = `<span class="status ok" title="${escapeHTML(ytLabelOf(song))}">📺 ${escapeHTML(ytLabelOf(song))}</span>
              <button class="link-btn btn-yt">주소 바꾸기</button>`;
    } else if (v) {
      info = `<span class="status ok" title="${escapeHTML(v.name)}">✅ ${escapeHTML(v.name)}</span>
              <button class="link-btn btn-load">영상 바꾸기</button>`;
    } else {
      info = `<span class="status no">🎬 영상을 넣어 주세요</span>
              <button class="link-btn btn-load">영상 넣기</button>`;
    }
    const card = document.createElement('article');
    card.className = 'song-card';
    card.innerHTML = `
      <div class="art" style="background:${song.bg}">
        <span class="stage-name">📍 ${song.stage}</span>
        ${song.icon}
      </div>
      <div class="body">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">${song.en} · ${song.artist}</div>
        <div class="source-tabs">
          <button data-src="youtube" class="${src === 'youtube' ? 'active' : ''}">▶ 유튜브</button>
          <button data-src="file" class="${src === 'file' ? 'active' : ''}">🎬 내 영상</button>
        </div>
        <div class="source-info">${info}</div>
        <div class="best">${best ? `🏆 최고 점수 ${best}점` : ''}</div>
        <div class="card-buttons">
          <button class="btn btn-primary btn-play" ${src === 'youtube' || v ? '' : 'disabled'}>춤추기! 💃</button>
        </div>
      </div>`;
    card.querySelectorAll('.source-tabs button').forEach((b) => b.addEventListener('click', () => {
      S.settings.source[song.id] = b.dataset.src;
      saveSettings();
      renderSongs();
    }));
    card.querySelector('.btn-play').addEventListener('click', () => startSong(song));
    const ytBtn = card.querySelector('.btn-yt');
    if (ytBtn) ytBtn.addEventListener('click', () => changeYouTube(song));
    const loadBtn = card.querySelector('.btn-load');
    if (loadBtn) loadBtn.addEventListener('click', () => pickVideo(song));
    grid.appendChild(card);
  }
}

// 유튜브 주소에서 영상 번호(11글자)만 뽑아요
function parseYouTubeId(text) {
  const t = text.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function changeYouTube(song) {
  const current = S.settings.yt[song.id];
  const input = prompt(
    `'${song.title}'에 연결할 유튜브 주소를 붙여 넣어 주세요.\n(비워 두고 확인을 누르면 처음 연결된 영상으로 돌아가요)`,
    current ? `https://youtu.be/${current}` : '',
  );
  if (input === null) return;
  if (!input.trim()) {
    delete S.settings.yt[song.id];
  } else {
    const id = parseYouTubeId(input);
    if (!id) { alert('유튜브 주소를 알아볼 수 없어요. 주소를 다시 확인해 주세요.'); return; }
    S.settings.yt[song.id] = id;
  }
  saveSettings();
  renderSongs();
}

function pickVideo(song) {
  S.pickingFor = song.id;
  const input = $('file-input');
  input.value = '';
  input.click();
}

async function onVideoPicked(e) {
  const file = e.target.files && e.target.files[0];
  const id = S.pickingFor;
  if (!file || !id) return;
  if (!file.type.startsWith('video/') && !/\.(mp4|m4v|mov|webm)$/i.test(file.name)) {
    alert('영상 파일(mp4 등)만 넣을 수 있어요.');
    return;
  }
  if (S.videos[id]) URL.revokeObjectURL(S.videos[id].url);
  S.videos[id] = { blob: file, name: file.name, url: URL.createObjectURL(file) };
  S.settings.source[id] = 'file';
  saveSettings();
  renderSongs();
  if (S.dbOk) {
    try { await dbPut(id, { blob: file, name: file.name }); }
    catch (err) { console.warn('영상 저장 실패', err); setStorageWarning(); }
  }
}

function renderSettings() {
  document.querySelectorAll('#difficulty button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === S.settings.difficulty);
  });
  $('opt-flip').checked = S.settings.flip;
  $('opt-debug').checked = S.settings.debug;
}

/* =========================================================
   자세 인식 준비 (MediaPipe) + 카메라 켜기
   ========================================================= */
function taggedError(kind, code) {
  const err = new Error(kind + ':' + code);
  err.kind = kind;
  err.code = code;
  return err;
}

function ensureModels() {
  if (S.models) return Promise.resolve();
  if (!S.modelPromise) {
    S.modelPromise = (async () => {
      const vision = await import(VISION_URL);
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      const make = (delegate) => vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      // 카메라용·영상용 인식기를 따로 만들어요 (서로 섞이지 않게)
      let cam = null, vid = null;
      try {
        cam = await make('GPU');
        vid = await make('GPU');
      } catch (e) {
        console.warn('GPU로 실행할 수 없어 CPU로 바꿔요', e);
        if (cam) cam.close();
        cam = await make('CPU');
        vid = await make('CPU');
      }
      S.models = { cam, vid };
    })().catch((e) => {
      S.modelPromise = null;
      console.error(e);
      throw taggedError('model', e && e.message);
    });
  }
  return S.modelPromise;
}

async function ensureCamera() {
  const cam = el.camVideo;
  if (!S.camStream || !S.camStream.active) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw taggedError('camera', 'unsupported');
    try {
      S.camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
    } catch (e) {
      throw taggedError('camera', e && e.name);
    }
    cam.srcObject = S.camStream;
  }
  await cam.play().catch(() => {});
  if (cam.readyState < 2) await new Promise((resolve) => cam.addEventListener('loadeddata', resolve, { once: true }));
}

function stopCamera() {
  if (S.camStream) S.camStream.getTracks().forEach((t) => t.stop());
  S.camStream = null;
  el.camVideo.srcObject = null;
}

function waitVideoReady() {
  const v = el.danceVideo;
  if (v.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const ok = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(taggedError('video', 'load')); };
    const cleanup = () => { v.removeEventListener('loadeddata', ok); v.removeEventListener('error', fail); };
    v.addEventListener('loadeddata', ok);
    v.addEventListener('error', fail);
  });
}

/* =========================================================
   유튜브 영상 틀기
   ========================================================= */
const yt = { player: null, apiPromise: null, wait: null, lastRaw: 0, rawAt: 0 };

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!yt.apiPromise) {
    yt.apiPromise = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve();
      const s = document.createElement('script');
      s.src = YT_API_URL;
      s.onerror = () => { yt.apiPromise = null; reject(taggedError('youtube', 'api')); };
      document.head.appendChild(s);
    });
  }
  return yt.apiPromise;
}

async function prepareYouTube(videoId) {
  await loadYouTubeAPI();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(null), 6000); // 신호가 늦게 와도 6초 뒤엔 그냥 진행
    const finish = (err) => {
      clearTimeout(timer);
      yt.wait = null;
      if (err) reject(err); else resolve();
    };
    yt.wait = finish;
    yt.lastRaw = 0;
    yt.rawAt = 0;
    if (yt.player) {
      yt.player.cueVideoById(videoId);
    } else {
      yt.player = new YT.Player('yt-player', {
        host: 'https://www.youtube-nocookie.com', // 개인정보 보호 모드
        videoId,
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0, origin: location.origin },
        events: {
          onReady: () => yt.wait && yt.wait(null),
          onStateChange: onYouTubeState,
          onError: onYouTubeError,
        },
      });
    }
  });
}

function onYouTubeState(e) {
  if (e.data === 5 && yt.wait) yt.wait(null); // 5 = 영상 준비됨
  if (e.data === 1) hideCaptions();           // 1 = 재생 중
  if (e.data === 0) onVideoEnded();           // 0 = 영상 끝남
}

// 자동 자막이 댄서 다리를 가리지 않게 꺼요
function hideCaptions() {
  try {
    yt.player.unloadModule('captions');
    yt.player.unloadModule('cc');
  } catch (e) { /* 자막 기능이 없는 영상이면 그냥 넘어가요 */ }
}

function onYouTubeError(e) {
  const err = taggedError('youtube', String(e.data));
  if (yt.wait) yt.wait(err);
  else if (['ready', 'countdown', 'playing', 'paused'].includes(S.phase)) { media.stop(); showError(err); }
}

// 내 영상 / 유튜브 영상을 똑같은 방법으로 다루게 해 주는 도우미
const media = {
  kind: 'file',
  time() {
    if (this.kind === 'file') return el.danceVideo.currentTime;
    const p = yt.player;
    if (!p || !p.getCurrentTime) return 0;
    const raw = p.getCurrentTime() || 0;
    const now = performance.now();
    if (raw !== yt.lastRaw) { yt.lastRaw = raw; yt.rawAt = now; }
    // 유튜브는 시간을 띄엄띄엄 알려 줘서, 그 사이 시간을 짐작해서 채워요
    return this.playing() ? raw + Math.min(0.5, (now - yt.rawAt) / 1000) : raw;
  },
  duration() {
    if (this.kind === 'file') return el.danceVideo.duration || 0;
    return (yt.player && yt.player.getDuration && yt.player.getDuration()) || 0;
  },
  playing() {
    if (this.kind === 'file') return !el.danceVideo.paused && !el.danceVideo.ended;
    return !!yt.player && yt.player.getPlayerState && yt.player.getPlayerState() === 1;
  },
  // 영상 시간이 실제로 흘러가는 중인지 (유튜브 광고나 버퍼링 중에는 채점하지 않아요)
  advancing() {
    if (this.kind === 'file') return this.playing();
    return this.playing() && performance.now() - yt.rawAt < 700;
  },
  play() {
    if (this.kind === 'file') return el.danceVideo.play();
    yt.player.playVideo();
    return Promise.resolve();
  },
  pause() {
    if (this.kind === 'file') el.danceVideo.pause();
    else if (yt.player && yt.player.pauseVideo) yt.player.pauseVideo();
  },
  stop() {
    if (this.kind === 'file') el.danceVideo.pause();
    else if (yt.player && yt.player.stopVideo) yt.player.stopVideo();
  },
};

/* =========================================================
   화면 공유 (유튜브 영상 속 댄서를 보기 위해)
   유튜브 영상은 게임이 직접 들여다볼 수 없어서,
   "이 탭 공유"를 허용받아 영상이 있는 부분만 잘라서 봐요.
   ========================================================= */
async function startCapture() {
  if (S.capture) return 'ok';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.CropTarget) return 'unsupported';
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 15 } },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'exclude',
      monitorTypeSurfaces: 'exclude',
    });
  } catch (e) {
    return 'cancel';
  }
  const track = stream.getVideoTracks()[0];
  try {
    // 영상 부분만 잘라 내기 (다른 탭이나 창을 골랐으면 여기서 실패해요)
    await track.cropTo(await CropTarget.fromElement($('yt-wrap')));
  } catch (e) {
    console.warn('영상 부분 자르기 실패', e);
    stream.getTracks().forEach((t) => t.stop());
    return 'wrong';
  }
  track.addEventListener('ended', () => { // 크롬 위쪽의 [공유 중지]를 누른 경우
    S.capture = null;
    el.captureVideo.srcObject = null;
    updateScoreMode();
  });
  el.captureVideo.srcObject = stream;
  await el.captureVideo.play().catch(() => {});
  S.capture = { stream, track };
  return 'ok';
}

function stopCapture() {
  if (S.capture) S.capture.stream.getTracks().forEach((t) => t.stop());
  S.capture = null;
  el.captureVideo.srcObject = null;
}

async function onCaptureClick() {
  const msg = $('capture-msg');
  msg.textContent = '';
  const result = await startCapture();
  if (S.phase !== 'ready') return;
  if (result === 'ok') {
    showReadyStep('body');
    updateScoreMode();
  } else if (result === 'wrong') {
    msg.textContent = '앗, 다른 화면이 골라졌어요. 꼭 "이 탭"을 골라 주세요.';
  } else if (result === 'unsupported') {
    msg.textContent = '이 브라우저는 화면 공유 채점을 할 수 없어요. 크롬 최신 버전을 써 주세요.';
  } else {
    msg.textContent = '공유가 취소되었어요. 다시 누르거나 [공유 없이 할래요]를 눌러 주세요.';
  }
}

function updateScoreMode() {
  const exact = media.kind === 'file' || !!S.capture;
  $('score-mode').textContent = exact ? '🎯 동작 비교 채점 중' : '💃 움직임 채점 중 (화면 공유 꺼짐)';
  S.debugDancer = exact ? '댄서 찾는 중…' : '화면 공유 꺼짐 (움직임으로 채점)';
  if (S.settings.debug) $('debug-badge').textContent = S.debugDancer;
}

/* =========================================================
   오류 안내
   ========================================================= */
function errorText(err) {
  if (err && err.kind === 'camera') {
    switch (err.code) {
      case 'NotAllowedError':
      case 'SecurityError':
        return ['카메라 사용이 막혀 있어요 📷', '주소창에 있는 카메라 아이콘을 눌러 "허용"으로 바꾼 뒤 [다시 시도]를 눌러 주세요.'];
      case 'NotFoundError':
      case 'OverconstrainedError':
        return ['카메라를 찾을 수 없어요', '웹캠이 잘 연결되어 있는지 확인해 주세요.'];
      case 'NotReadableError':
        return ['카메라를 다른 곳에서 쓰고 있어요', '줌, 팀즈처럼 카메라를 쓰는 프로그램을 끄고 다시 시도해 주세요.'];
      default:
        return ['카메라를 켤 수 없어요', '크롬(Chrome) 브라우저로 열었는지 확인해 주세요.'];
    }
  }
  if (err && err.kind === 'video') {
    return ['영상을 열 수 없어요 🎬', 'mp4 영상인지 확인하고, 노래 고르기 화면에서 [영상 바꾸기]로 다시 넣어 주세요.'];
  }
  if (err && err.kind === 'youtube') {
    switch (err.code) {
      case 'file':
      case '153':
        return ['파일을 직접 열면 유튜브가 나오지 않아요', '사용법의 "게임 여는 법"대로 열거나, 노래 카드에서 [🎬 내 영상]을 골라 주세요.'];
      case '101':
      case '150':
        return ['이 영상은 다른 곳에서 틀 수 없게 막혀 있어요', '노래 고르기 화면에서 [주소 바꾸기]로 다른 영상을 넣어 주세요.'];
      case '100':
        return ['유튜브 영상을 찾을 수 없어요', '지워졌거나 비공개가 된 영상이에요. [주소 바꾸기]로 다른 영상을 넣어 주세요.'];
      case '2':
        return ['유튜브 주소가 올바르지 않아요', '노래 고르기 화면에서 [주소 바꾸기]로 주소를 다시 넣어 주세요.'];
      default:
        return ['유튜브 영상을 불러오지 못했어요', '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'];
    }
  }
  return ['춤 인식 프로그램을 불러오지 못했어요', '인터넷 연결을 확인한 뒤 다시 시도해 주세요. 이 게임은 인터넷이 연결되어 있어야 해요.'];
}

function showError(err) {
  const [title, desc] = errorText(err);
  $('error-title').textContent = title;
  $('error-desc').textContent = desc;
  setPhase('error');
}

/* =========================================================
   자세 계산 (팔·다리 방향 비교)
   ========================================================= */
function unitVec(a, b) {
  if (!a || !b) return null;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  return len < 1e-4 ? null : { x: dx / len, y: dy / len };
}
const midPoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// 관절 좌표 → 팔·다리 방향, 움직임 계산용 점
function makePose(lm, aspect) {
  const pick = (i) => {
    const p = lm[i];
    return p && (p.visibility ?? 1) >= VIS_MIN ? { x: p.x * aspect, y: p.y } : null;
  };
  const pts = {};
  for (const i of JOINTS) pts[i] = pick(i);

  const raw = SEGMENTS.map(([, a, b]) => unitVec(pts[a], pts[b]));
  const flip = raw.map((v) => (v ? { x: -v.x, y: v.y } : null));
  const armCount = raw.slice(0, 4).filter(Boolean).length;

  // 몸통 길이로 나눠서, 카메라에서 멀리 있든 가까이 있든 같은 기준으로 움직임을 재요
  let torso = null;
  const ls = pts[11], rs = pts[12], lh = pts[23], rh = pts[24];
  if (ls && rs) {
    const shoulder = distance(ls, rs);
    torso = lh && rh ? distance(midPoint(ls, rs), midPoint(lh, rh)) : shoulder * 1.4;
    torso = Math.max(torso, shoulder * 0.8, 0.02);
  }
  const epts = torso ? ENERGY_POINTS.map((i) => (pts[i] ? { x: pts[i].x / torso, y: pts[i].y / torso } : null)) : null;
  return { raw, flip, armCount, epts };
}

const DOWN = { x: 0, y: 1 };
const angleDeg = (a, b) => Math.acos(clamp(a.x * b.x + a.y * b.y, -1, 1)) * 180 / Math.PI;

// 두 자세가 얼마나 비슷한지 (0 = 전혀 다름, 1 = 똑같음)
function similarity(childSegs, dancerSegs, mirror) {
  let sum = 0, wsum = 0, arms = 0;
  for (let i = 0; i < SEGMENTS.length; i++) {
    const c = childSegs[i];
    const d = dancerSegs[mirror ? MIRROR[i] : i];
    if (!c || !d) continue;
    // 팔을 내리고 있는 '쉬운 자세'보다 팔을 든 '특별한 동작'을 더 중요하게 봐요
    // (그래야 가만히 서 있기만 해서는 점수를 받기 어려워요)
    const special = angleDeg(d, DOWN) / 180; // 0 = 아래로 내림, 1 = 위로 듦
    const w = SEGMENTS[i][3] * (0.15 + 0.85 * special);
    sum += w * clamp((90 - angleDeg(c, d)) / 65, 0, 1); // 25° 이내면 만점, 90° 넘게 다르면 0점
    wsum += w;
    if (i < 4) arms++;
  }
  return arms >= 2 ? sum / wsum : null; // 팔이 2개 부분 이상 보여야 비교해요
}

// 거울처럼 따라 해도, 같은 쪽으로 따라 해도 모두 인정해요 (아이들은 좌우를 헷갈리니까요)
function bestMatch(child, dancer) {
  const a = similarity(child.flip, dancer.segs, true);   // 거울처럼 따라 함
  const b = similarity(child.raw, dancer.segs, false);   // 같은 쪽 손발로 따라 함
  if (a === null && b === null) return null;
  return Math.max(a ?? 0, b ?? 0);
}

// 직전 자세와 비교해서 1초에 얼마나 움직였는지
function moveSpeed(prev, cur, dt) {
  if (!prev || !cur || !prev.epts || !cur.epts || dt <= 0 || dt > 0.5) return null;
  let sum = 0, n = 0;
  for (let i = 0; i < cur.epts.length; i++) {
    if (prev.epts[i] && cur.epts[i]) { sum += distance(prev.epts[i], cur.epts[i]); n++; }
  }
  return n ? sum / n / dt : null;
}

/* =========================================================
   뼈대 그리기
   ========================================================= */
function drawSkeleton(canvas, video, lm, color) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  if (!lm) return;

  const ok = (i) => lm[i] && (lm[i].visibility ?? 1) >= VIS_MIN;
  const lw = Math.max(5, w / 90);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass === 0 ? 'rgba(0,0,0,.35)' : color;
    ctx.lineWidth = pass === 0 ? lw + 6 : lw;
    for (const [a, b] of BONES) {
      if (!ok(a) || !ok(b)) continue;
      ctx.beginPath();
      ctx.moveTo(lm[a].x * w, lm[a].y * h);
      ctx.lineTo(lm[b].x * w, lm[b].y * h);
      ctx.stroke();
    }
  }
  ctx.fillStyle = color;
  for (const i of JOINTS) {
    if (!ok(i)) continue;
    ctx.beginPath();
    ctx.arc(lm[i].x * w, lm[i].y * h, lw * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (ok(0) && ok(11) && ok(12)) {
    const r = Math.hypot((lm[11].x - lm[12].x) * w, (lm[11].y - lm[12].y) * h) * 0.35;
    ctx.beginPath();
    ctx.arc(lm[0].x * w, lm[0].y * h, r, 0, Math.PI * 2);
    ctx.lineWidth = lw;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

/* =========================================================
   게임 진행
   ========================================================= */
function newWindow() {
  return { childFrames: 0, poseScores: [], childEnergy: 0, childEnergyN: 0, dancerEnergy: 0, dancerEnergyN: 0 };
}

function resetGame() {
  Object.assign(S, {
    score: 0, combo: 0, maxCombo: 0, judged: 0,
    counts: { perfect: 0, great: 0, good: 0, miss: 0 },
    winStart: 0, win: newWindow(),
    dancerHist: [], prevDancer: null, prevChild: null,
    lastChild: null, readyTime: 0, childColor: '#ffffff',
    stallTime: 0,
  });
  $('hud-score').textContent = '0';
  $('progress-fill').style.width = '0%';
  $('beat-fill').style.width = '0%';
  $('combo').textContent = '';
  $('buddy-bubble').textContent = '같이 춤춰요!';
  $('ready-fill').style.width = '0%';
  $('capture-msg').textContent = '';
  el.judge.className = 'judge';
  el.danceCanvas.getContext('2d').clearRect(0, 0, el.danceCanvas.width, el.danceCanvas.height);
}

async function startSong(song) {
  const src = sourceOf(song);
  const v = S.videos[song.id];
  if (src === 'file' && !v) return;
  const runId = ++S.runId;
  S.countToken++;
  S.song = song;
  media.stop();
  media.kind = src;
  resetGame();

  $('screen-play').style.setProperty('--stage-bg', song.bg);
  $('hud-stage').textContent = '📍 ' + song.stage;
  $('hud-title').textContent = `${song.title} (${song.en})`;
  el.videoBox.classList.toggle('mode-youtube', src === 'youtube');
  el.videoBox.classList.toggle('flip', src === 'file' && S.settings.flip);
  // 유튜브 영상 위에 글자가 있으면 댄서 인식을 방해해서, 판정 글자를 오른쪽 칸에 띄워요
  (src === 'youtube' ? $('buddy') : el.videoBox).appendChild(el.judge);
  $('debug-badge').hidden = !S.settings.debug;

  showScreen('play');
  setPhase('loading');
  startLoop();

  try {
    let prepare;
    if (src === 'youtube') {
      if (location.protocol === 'file:') throw taggedError('youtube', 'file');
      prepare = prepareYouTube(ytIdOf(song));
    } else {
      el.danceVideo.src = v.url;
      el.danceVideo.currentTime = 0;
      prepare = waitVideoReady();
    }
    await Promise.all([ensureModels(), ensureCamera(), prepare]);
  } catch (err) {
    if (runId === S.runId) showError(err);
    return;
  }
  if (runId !== S.runId || S.phase !== 'loading') return; // 그사이 그만두었으면 멈춤
  updateScoreMode();
  showReadyStep(src === 'youtube' && !S.capture ? 'capture' : 'body');
  setPhase('ready');
}

function showReadyStep(step) {
  S.readyStep = step;
  S.readyTime = 0;
  $('ready-capture').hidden = step !== 'capture';
  $('ready-body').hidden = step !== 'body';
}

function beginDancing() {
  if (S.phase !== 'ready') return;
  runCountdown(() => {
    S.winStart = media.time();
    S.win = newWindow();
    playVideo();
  });
}

function playVideo() {
  S.stallTime = 0;
  media.play()
    .then(() => setPhase('playing'))
    .catch(() => setPhase('paused')); // 브라우저가 자동 재생을 막으면 [계속하기]를 눌러 시작
}

function runCountdown(done) {
  setPhase('countdown');
  const token = ++S.countToken;
  const steps = ['3', '2', '1', '시작!'];
  const num = $('count-num');
  let i = 0;
  const step = () => {
    if (token !== S.countToken || S.phase !== 'countdown') return;
    if (i === steps.length) { done(); return; }
    num.textContent = steps[i];
    num.classList.remove('pop');
    void num.offsetWidth; // 애니메이션 다시 시작
    num.classList.add('pop');
    beep(i < 3 ? 660 : 990, i < 3 ? 0.12 : 0.35);
    i++;
    setTimeout(step, i === steps.length ? 500 : 800);
  };
  step();
}

function pauseGame() {
  if (S.phase !== 'playing') return;
  media.pause();
  S.prevChild = null;
  S.prevDancer = null;
  setPhase('paused');
}

function resumeGame() {
  if (S.phase !== 'paused') return;
  runCountdown(playVideo);
}

function quitToSelect() {
  S.runId++;
  S.countToken++;
  media.stop();
  stopLoop();
  setPhase('idle');
  renderSongs();
  showScreen('select');
}

/* ---------- 매 화면마다 실행 (1초에 약 60번) ---------- */
function startLoop() {
  if (!S.raf) { S.lastTick = 0; S.raf = requestAnimationFrame(tick); }
}
function stopLoop() {
  cancelAnimationFrame(S.raf);
  S.raf = 0;
}

function detect(landmarker, video, ts) {
  try {
    const res = landmarker.detectForVideo(video, ts);
    return (res && res.landmarks && res.landmarks[0]) || null;
  } catch (e) {
    console.warn('인식 오류', e);
    return null;
  }
}

function tick() {
  S.raf = requestAnimationFrame(tick);
  const now = performance.now();
  const dt = S.lastTick ? (now - S.lastTick) / 1000 : 0;
  S.lastTick = now;
  if (!S.models) return;

  const cam = el.camVideo;
  if (cam.readyState >= 2 && now - S.lastCamDetect >= DETECT_MS) {
    S.lastCamDetect = now;
    onChildPose(detect(S.models.cam, cam, now), now);
  }
  // 댄서를 볼 화면: 내 영상이면 영상 그 자체, 유튜브면 화면 공유로 받은 영상
  const src = media.kind === 'file' ? el.danceVideo : S.capture ? el.captureVideo : null;
  if (src && S.phase === 'playing' && media.advancing() && src.readyState >= 2 && now - S.lastVidDetect >= DETECT_MS) {
    S.lastVidDetect = now;
    onDancerPose(detect(S.models.vid, src, now), media.time(), src);
  }
  if (S.phase === 'ready' && S.readyStep === 'body') updateReady(dt);
  if (S.phase === 'playing') updatePlaying(dt);
}

// 카메라 속 아이의 자세가 들어왔을 때
function onChildPose(lm, now) {
  drawSkeleton(el.camCanvas, el.camVideo, lm, S.childColor);
  S.lastChild = lm;
  if (S.phase !== 'playing' || !media.advancing()) return;

  const pose = lm ? makePose(lm, el.camVideo.videoWidth / el.camVideo.videoHeight) : null;
  if (!pose || pose.armCount < 2) { S.prevChild = null; return; }

  const w = S.win;
  w.childFrames++;
  if (S.prevChild) {
    const sp = moveSpeed(S.prevChild.pose, pose, (now - S.prevChild.time) / 1000);
    if (sp !== null) { w.childEnergy += sp; w.childEnergyN++; }
  }
  S.prevChild = { pose, time: now };

  // 최근 1초 동안의 댄서 자세 중 가장 비슷한 것과 비교 (조금 늦게 따라 해도 괜찮아요)
  const vt = media.time();
  let best = null;
  for (const d of S.dancerHist) {
    if (d.t < vt - LAG_WINDOW || d.t > vt + 0.1) continue;
    const s = bestMatch(pose, d);
    if (s !== null && (best === null || s > best)) best = s;
  }
  if (best !== null) w.poseScores.push(best);
}

// 댄스 영상 속 댄서의 자세가 들어왔을 때
function onDancerPose(lm, vt, src) {
  if (S.settings.debug) {
    if (media.kind === 'file') drawSkeleton(el.danceCanvas, el.danceVideo, lm, '#ffe14d');
    S.debugDancer = lm ? '댄서 인식 ✅' : '댄서 인식 ❌ (움직임으로 채점)';
    $('debug-badge').textContent = S.debugDancer;
  }
  const pose = lm ? makePose(lm, src.videoWidth / src.videoHeight) : null;
  if (!pose || pose.armCount < 2) { S.prevDancer = null; return; }

  S.dancerHist.push({ t: vt, segs: pose.raw });
  while (S.dancerHist.length && S.dancerHist[0].t < vt - 2) S.dancerHist.shift();

  if (S.prevDancer) {
    const sp = moveSpeed(S.prevDancer.pose, pose, vt - S.prevDancer.t);
    if (sp !== null) { S.win.dancerEnergy += sp; S.win.dancerEnergyN++; }
  }
  S.prevDancer = { pose, t: vt };
}

// 시작 전: 아이 몸이 잘 보이는지 확인
function updateReady(dt) {
  const lm = S.lastChild;
  const visible = !!lm && [11, 12, 23, 24].every((i) => (lm[i].visibility ?? 0) >= 0.6);
  S.readyTime = visible ? S.readyTime + dt : Math.max(0, S.readyTime - dt * 2);
  $('ready-fill').style.width = clamp(S.readyTime / READY_HOLD, 0, 1) * 100 + '%';
  $('ready-msg').textContent = !lm
    ? '카메라에 내 모습이 보이게 서 주세요!'
    : visible ? '좋아요! 곧 시작해요 😊' : '한 걸음 뒤로 가 볼까요? 👣';
  if (S.readyTime >= READY_HOLD) beginDancing();
}

// 춤추는 중: 진행 막대 + 1.5초마다 판정
function updatePlaying(dt) {
  const vt = media.time();
  const dur = media.duration();
  $('progress-fill').style.width = (dur ? clamp(vt / dur, 0, 1) * 100 : 0) + '%';
  $('beat-fill').style.width = clamp((vt - S.winStart) / JUDGE_INTERVAL, 0, 1) * 100 + '%';

  // 유튜브가 멈춰 버리면 (자동 재생이 막혔거나 영상을 눌러 멈춘 경우) 멈춤 화면을 보여 줘요
  if (media.kind === 'youtube') {
    const state = yt.player && yt.player.getPlayerState ? yt.player.getPlayerState() : -1;
    S.stallTime = state === 2 || state === 5 || state === -1 ? S.stallTime + dt : 0;
    if (S.stallTime > 3) { pauseGame(); return; }
  }

  if (vt - S.winStart >= JUDGE_INTERVAL) {
    judgeWindow();
    S.winStart += JUDGE_INTERVAL;
    if (vt - S.winStart >= JUDGE_INTERVAL) S.winStart = vt; // 너무 밀리면 다시 맞춤
    S.win = newWindow();
  }
}

function judgeWindow() {
  const w = S.win;
  const th = DIFFICULTY[S.settings.difficulty] || DIFFICULTY.easy;
  let kind, score = 0;

  if (w.childFrames < 2) {
    kind = 'away';
  } else {
    const childEnergy = w.childEnergyN ? w.childEnergy / w.childEnergyN : 0;
    const dancerEnergy = w.dancerEnergyN ? w.dancerEnergy / w.dancerEnergyN : 0;
    if (w.poseScores.length >= 3) {
      // 잘 따라 한 순간들(상위 절반)의 평균 → 아이들에게 너그럽게
      const sorted = [...w.poseScores].sort((a, b) => b - a);
      const top = sorted.slice(0, Math.ceil(sorted.length / 2));
      score = top.reduce((a, b) => a + b, 0) / top.length;
      // 댄서는 신나게 움직이는데 가만히 서 있으면 점수를 줄여요
      // (댄서의 절반만큼만 움직여도 감점 없음, 아예 안 움직이면 점수의 20%만)
      if (dancerEnergy > 0.3) score *= 0.2 + 0.8 * clamp(childEnergy / (dancerEnergy * 0.5), 0, 1);
    } else {
      // 영상 속 댄서를 못 찾았을 때는 얼마나 열심히 움직였는지로 채점 (동작 확인이 안 되니 최대 '잘했어!'까지)
      score = th.great * Math.sqrt(Math.min(1, childEnergy / ENERGY_FULL));
    }
    kind = score >= th.perfect ? 'perfect' : score >= th.great ? 'great' : score >= th.good ? 'good' : 'miss';
  }
  if (S.settings.debug) $('debug-badge').textContent = `${S.debugDancer} · 이번 점수 ${score.toFixed(2)}`;
  applyJudge(kind);
}

function applyJudge(kind) {
  const J = JUDGES[kind];
  S.judged++;
  S.score += J.points;
  S.counts[kind === 'away' ? 'miss' : kind]++;
  S.combo = J.points > 0 ? S.combo + 1 : 0;
  S.maxCombo = Math.max(S.maxCombo, S.combo);
  S.childColor = J.color;

  const scoreEl = $('hud-score');
  scoreEl.textContent = S.score.toLocaleString();
  if (J.points > 0) restartAnim(scoreEl, 'bump');

  el.judge.className = 'judge ' + kind;
  el.judge.querySelector('.judge-emoji').textContent = J.emoji;
  el.judge.querySelector('.judge-text').textContent = J.text;
  el.judge.querySelector('.judge-points').textContent = J.points ? '+' + J.points : '';
  restartAnim(el.judge, 'show');

  $('buddy-bubble').textContent = J.buddy;
  $('combo').textContent = S.combo >= 3 ? `${S.combo} 콤보! 🔥` : '';
  if (J.points > 0) restartAnim($('buddy-mascot'), 'happy');

  if (kind === 'perfect') { beep(880, 0.1); setTimeout(() => beep(1320, 0.15), 90); }
  else if (kind === 'great') beep(784, 0.12);
  else if (kind === 'good') beep(659, 0.1);
}

function restartAnim(node, cls) {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

function onVideoEnded() {
  if (S.phase !== 'playing') return;
  if (media.time() - S.winStart >= 0.7) judgeWindow(); // 마지막 남은 부분도 판정
  finishGame();
}

/* =========================================================
   결과 화면
   ========================================================= */
function finishGame() {
  setPhase('ended');
  stopLoop();
  const song = S.song;
  const pct = S.judged ? S.score / (S.judged * 100) : 0;
  const stars = pct >= 0.7 ? 3 : pct >= 0.4 ? 2 : 1; // 끝까지 춤추면 별 1개는 꼭 받아요

  const isRecord = S.score > 0 && S.score > (S.best[song.id] || 0);
  if (isRecord) { S.best[song.id] = S.score; saveJSON('hoya-best', S.best); }

  $('result-stage').textContent = `📍 ${song.stage} · ${song.title}`;
  document.querySelectorAll('#stars span').forEach((s, i) => {
    s.classList.toggle('on', i < stars);
    s.style.animationDelay = i * 0.25 + 's';
  });
  $('result-msg').textContent = {
    3: '우와! 최고의 댄스왕이에요! 👑',
    2: '정말 잘했어요! 짝짝짝 👏',
    1: '멋지게 춤췄어요! 다음엔 더 잘할 수 있어요 💪',
  }[stars];
  $('result-score').textContent = S.score.toLocaleString();
  $('new-record').hidden = !isRecord;
  $('breakdown').innerHTML = [
    `🌟 최고야 ${S.counts.perfect}`,
    `👏 잘했어 ${S.counts.great}`,
    `🙂 좋아 ${S.counts.good}`,
    `💪 다시 해봐 ${S.counts.miss}`,
    `🔥 최대 콤보 ${S.maxCombo}`,
  ].map((t) => `<span class="chip">${t}</span>`).join('');

  showScreen('result');
  launchConfetti(stars);
  beep(523, 0.15); setTimeout(() => beep(659, 0.15), 150); setTimeout(() => beep(784, 0.3), 300);
}

/* ---------- 색동 꽃가루 ---------- */
function launchConfetti(stars) {
  const canvas = $('confetti');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth);
  const H = (canvas.height = canvas.clientHeight);
  const colors = ['#e63946', '#ffc93c', '#3bb273', '#4cc9f0', '#ff6fa5', '#9b5de5', '#ffffff'];
  const parts = Array.from({ length: 60 * stars }, () => ({
    x: Math.random() * W, y: -20 - Math.random() * H * 0.5,
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
    r: 5 + Math.random() * 6, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  const frame = (t) => {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.a += p.va;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    }
    if (t - start < 4500 && document.getElementById('screen-result').classList.contains('active')) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}

/* ---------- 효과음 ---------- */
let audioCtx = null;
function beep(freq, dur = 0.12, vol = 0.08) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* 소리가 안 나도 게임은 계속 */ }
}

/* =========================================================
   버튼 연결 + 시작
   ========================================================= */
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

function bindUI() {
  $('btn-start').addEventListener('click', () => { beep(660); showScreen('select'); });
  $('btn-home').addEventListener('click', () => { stopCamera(); stopCapture(); showScreen('title'); });
  $('btn-fullscreen').addEventListener('click', toggleFullscreen);
  $('file-input').addEventListener('change', onVideoPicked);

  document.querySelectorAll('#difficulty button').forEach((b) => b.addEventListener('click', () => {
    S.settings.difficulty = b.dataset.value;
    saveSettings();
    renderSettings();
  }));
  $('opt-flip').addEventListener('change', (e) => { S.settings.flip = e.target.checked; saveSettings(); });
  $('opt-debug').addEventListener('change', (e) => { S.settings.debug = e.target.checked; saveSettings(); });

  $('btn-capture').addEventListener('click', onCaptureClick);
  $('btn-no-capture').addEventListener('click', () => { showReadyStep('body'); updateScoreMode(); });
  $('btn-skip-ready').addEventListener('click', beginDancing);
  $('btn-pause').addEventListener('click', () => (S.phase === 'paused' ? resumeGame() : pauseGame()));
  $('btn-resume').addEventListener('click', resumeGame);
  $('btn-quit').addEventListener('click', quitToSelect);
  $('btn-pause-quit').addEventListener('click', quitToSelect);
  $('btn-error-retry').addEventListener('click', () => S.song && startSong(S.song));
  $('btn-error-back').addEventListener('click', quitToSelect);
  $('btn-retry').addEventListener('click', () => S.song && startSong(S.song));
  $('btn-other').addEventListener('click', () => { renderSongs(); showScreen('select'); });

  el.danceVideo.addEventListener('ended', onVideoEnded);

  // 스페이스바: 멈춤 / 계속하기 / 바로 시작
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || !$('screen-play').classList.contains('active')) return;
    e.preventDefault();
    if (S.phase === 'playing') pauseGame();
    else if (S.phase === 'paused') resumeGame();
    else if (S.phase === 'ready' && S.readyStep === 'body') beginDancing();
  });

  // 다른 창으로 가면 자동으로 멈춤
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
}

async function init() {
  const saved = loadJSON('hoya-settings', {});
  S.settings = Object.assign(S.settings, saved);
  S.settings.source = Object.assign({}, saved.source);
  S.settings.yt = Object.assign({}, saved.yt);
  S.best = loadJSON('hoya-best', {});

  if (location.protocol === 'file:') {
    const note = $('file-note');
    note.textContent = '⚠️ 지금은 파일을 직접 연 상태라 유튜브 영상이 나오지 않아요. 사용법의 "게임 여는 법"을 봐 주세요. (🎬 내 영상은 쓸 수 있어요)';
    note.hidden = false;
  }

  bindUI();
  renderSettings();
  renderSongs();
  await loadStoredVideos();
  renderSongs();
}

init();
