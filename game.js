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
// fixedFile: 게임 폴더의 videos 폴더에 있는 영상으로 고정 (예: videos/soda-pop.mp4)
//   (소다팝·골든은 저스트댄스 팬 영상이 다른 사이트 재생을 막아 둬서, 컴퓨터에 있는 영상을 쓰기로 했어요)
const SONGS = [
  { id: 'soda-pop',    title: '소다팝',   en: 'Soda Pop',    artist: '케이팝 데몬 헌터스', stage: '서울 남산 무대', icon: ICONS.seoul,  bg: 'linear-gradient(160deg, #3b2a8f 0%, #ff5fa2 100%)',
    fixedFile: 'videos/soda-pop' },
  { id: 'golden',      title: '골든',     en: 'Golden',      artist: '케이팝 데몬 헌터스', stage: '경복궁 무대',    icon: ICONS.palace, bg: 'linear-gradient(160deg, #ffcf3f 0%, #ff8a3d 100%)',
    fixedFile: 'videos/golden' },
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

// ---------- 4-1. 두 명이 할 때의 팀 (민화 '까치호랑이'에서 따온 짝) ----------
// 카메라 화면에서 왼쪽에 선 아이가 호랑이팀, 오른쪽에 선 아이가 까치팀이에요
const TEAMS = [
  { name: '호랑이팀', emoji: '🐯', color: '#e63946' },
  { name: '까치팀',   emoji: '🐦', color: '#2f80ed' },
];
const RANK = { away: 0, miss: 1, good: 2, great: 3, perfect: 4 }; // 판정 순서 (효과음·말풍선 고를 때 사용)

// ---------- 5. 세부 설정 ----------
const VISION_VER = '0.10.14';
const VISION_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VER}/vision_bundle.mjs`;
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VER}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const YT_API_URL = 'https://www.youtube.com/iframe_api';
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v']; // videos 폴더에서 찾아볼 영상 종류

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
  camVideo2: $('cam-video-2'), camCanvas2: $('cam-canvas-2'),
  captureVideo: $('capture-video'),
  videoBox: $('video-box'),
  judges: [$('judge')],   // 판정 글자 (두 명이면 2개)
};

const S = {
  song: null,
  phase: 'idle',          // idle | loading | ready | countdown | playing | paused | ended | error
  readyStep: 'body',      // capture(화면 공유 준비) | body(몸 보이는지 확인)
  runId: 0,
  countToken: 0,
  raf: 0,
  lastTick: 0, lastCamDetect: [0, 0], lastVidDetect: 0,
  camStream: null,
  camStream2: null,       // 카메라 두 대일 때 두 번째(까치팀) 카메라
  twoCams: false,         // 이번 판에 카메라 두 대를 쓰는지
  camNote: '',            // 카메라 두 대를 못 켰을 때 안내 문구
  capture: null,          // 화면 공유 { stream, track }
  models: null,           // { cam, vid } 자세 인식기 2개 (카메라용, 영상용)
  modelPromise: null,
  // camMode: 두 명일 때 카메라 'one'(한 대로 같이) / 'two'(두 대로 따로), camOrder: 두 대일 때 [호랑이팀, 까치팀] 카메라 번호
  settings: { difficulty: 'easy', flip: false, debug: false, players: 1, camMode: 'one', camOrder: [], source: {}, yt: {} },
  videos: {},             // 노래 id → { blob, name, url }  (영상 넣기로 고른 영상)
  fixed: {},              // 노래 id → videos 폴더에서 찾은 영상 주소 (없으면 null)
  best: {},
  pickingFor: null,
  dbOk: true,
  // 한 판 동안 쓰는 값
  players: [],            // 춤추는 아이들 (1명 또는 2명) → newPlayer() 참고
  winStart: 0,
  dancerWin: null,        // 이번 판정 구간 동안 댄서가 움직인 양
  dancerHist: [], prevDancer: null,
  readyTime: 0,
  stallTime: 0, debugDancer: '',
  directPlay: false,      // 자동 재생이 막혀서 [계속하기]를 누르는 순간 틀어야 할 때
};

const sourceOf = (song) => (song.fixedFile ? 'fixed' : S.settings.source[song.id] || 'youtube');
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
// 고정 곡(소다팝·골든)의 영상이 videos 폴더에 있는지 찾아봐요
async function findFixedVideos() {
  // videos 폴더는 이 맥에서 열 때(localhost)만 있어요. 인터넷 주소에서는 찾지 않아요
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
  await Promise.all(SONGS.filter((s) => s.fixedFile).map(async (song) => {
    S.fixed[song.id] = null;
    for (const ext of VIDEO_EXTS) {
      const url = `${song.fixedFile}.${ext}`;
      try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) { S.fixed[song.id] = url; return; }
      } catch (e) { /* 다음 종류로 다시 찾아봐요 */ }
    }
  }));
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
    const fixedUrl = S.fixed[song.id];
    let info;
    if (src === 'fixed' && fixedUrl) {
      // 이 맥에서 열었을 때: videos 폴더 영상을 자동으로 써요
      info = `<span class="status ok" title="${escapeHTML(fixedUrl)}">✅ ${escapeHTML(fixedUrl)}</span>`;
    } else if (src === 'youtube') {
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
        ${src === 'fixed'
          ? '<div class="source-fixed">📁 이 기기에 있는 영상으로 고정</div>'
          : `<div class="source-tabs">
              <button data-src="youtube" class="${src === 'youtube' ? 'active' : ''}">▶ 유튜브</button>
              <button data-src="file" class="${src === 'file' ? 'active' : ''}">🎬 내 영상</button>
            </div>`}
        <div class="source-info">${info}</div>
        <div class="best">${best ? `🏆 최고 점수 ${best}점` : ''}</div>
        <div class="card-buttons">
          <button class="btn btn-primary btn-play" ${src === 'youtube' || fixedUrl || v ? '' : 'disabled'}>춤추기! 💃</button>
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
    // 파일을 Blob으로 바꿔서 저장해요 (사파리에서도 안전하게 저장되도록)
    try { await dbPut(id, { blob: new Blob([file], { type: file.type || 'video/mp4' }), name: file.name }); }
    catch (err) { console.warn('영상 저장 실패', err); setStorageWarning(); }
  }
}

function renderSettings() {
  document.querySelectorAll('#difficulty button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === S.settings.difficulty);
  });
  document.querySelectorAll('#players-seg button').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.value) === S.settings.players);
  });
  // 카메라 설정은 2명일 때만 보여요. 아이패드에서는 '두 대로 따로'를 쓸 수 없어요
  $('cam-setting').hidden = S.settings.players !== 2;
  document.querySelectorAll('#cam-seg button').forEach((b) => {
    const two = b.dataset.value === 'two';
    b.disabled = two && !twoCamsSupported();
    b.title = b.disabled ? '아이패드에서는 카메라를 한 대만 쓸 수 있어요' : '';
    b.classList.toggle('active', b.dataset.value === (twoCamsSupported() ? S.settings.camMode : 'one'));
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
      const make = (delegate, numPoses) => vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numPoses,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      // 카메라용·영상용 인식기를 따로 만들어요 (서로 섞이지 않게)
      // 카메라는 아이를 최대 2명까지 찾고, 영상은 댄서 1명만 찾아요
      let cam = null, vid = null, delegate = 'GPU';
      try {
        cam = await make('GPU', 2);
        vid = await make('GPU', 1);
      } catch (e) {
        console.warn('GPU로 실행할 수 없어 CPU로 바꿔요', e);
        if (cam) cam.close();
        delegate = 'CPU';
        cam = await make('CPU', 2);
        vid = await make('CPU', 1);
      }
      // cam2: 카메라 두 대일 때만 필요해서 나중에 만들어요 (ensureCam2Model)
      S.models = { cam, vid, cam2: null, makeCam: () => make(delegate, 2) };
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
  stopCamera2();
}

function stopCamera2() {
  if (S.camStream2) S.camStream2.getTracks().forEach((t) => t.stop());
  S.camStream2 = null;
  el.camVideo2.srcObject = null;
}

/* ---------- 카메라 두 대로 따로 (2명 모드) ---------- */
// 아이패드·아이폰 사파리는 카메라를 한 번에 한 대만 켤 수 있어요
function twoCamsSupported() {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  return !iOS && !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices);
}
const twoCamsWanted = () => S.settings.players === 2 && S.settings.camMode === 'two' && twoCamsSupported();
const deviceIdOf = (stream) => (stream && stream.getVideoTracks()[0] ? stream.getVideoTracks()[0].getSettings().deviceId : '');

function openCamera(deviceId) {
  return navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
}

async function playVideoEl(v) {
  await v.play().catch(() => {});
  if (v.readyState < 2) await new Promise((resolve) => v.addEventListener('loadeddata', resolve, { once: true }));
}

// 카메라 준비: 두 대로 따로가 안 되면(카메라가 1대뿐 등) 알아서 한 대로 같이 해요
async function ensureCameras() {
  S.camNote = '';
  S.twoCams = false;
  await ensureCamera(); // 먼저 한 대를 켜서 허락을 받아요 (그래야 카메라 목록을 볼 수 있어요)
  if (!twoCamsWanted()) { stopCamera2(); return; }

  const ids = (await navigator.mediaDevices.enumerateDevices())
    .filter((d) => d.kind === 'videoinput' && d.deviceId).map((d) => d.deviceId);
  if (ids.length < 2) {
    stopCamera2();
    S.camNote = '📷 카메라가 1대만 연결되어 있어서, 한 대로 같이 해요.';
    return;
  }
  // [호랑이팀, 까치팀] 카메라: 지난번에 정한 순서가 있으면 그대로
  const order = (S.settings.camOrder || []).filter((id) => ids.includes(id));
  for (const id of ids) if (order.length < 2 && !order.includes(id)) order.push(id);

  try {
    if (deviceIdOf(S.camStream) !== order[0]) {
      stopCamera();
      S.camStream = await openCamera(order[0]);
      el.camVideo.srcObject = S.camStream;
    }
    if (deviceIdOf(S.camStream2) !== order[1]) {
      stopCamera2();
      S.camStream2 = await openCamera(order[1]);
      el.camVideo2.srcObject = S.camStream2;
    }
    await Promise.all([playVideoEl(el.camVideo), playVideoEl(el.camVideo2)]);
    await new Promise((r) => setTimeout(r, 300));
    const live = (s) => s && s.getVideoTracks().every((t) => t.readyState === 'live');
    if (!live(S.camStream) || !live(S.camStream2)) throw new Error('두 카메라를 동시에 켤 수 없어요');
  } catch (e) {
    console.warn('카메라 두 대 켜기 실패', e);
    stopCamera();
    await ensureCamera();
    S.camNote = '📷 두 번째 카메라를 켤 수 없어서 한 대로 같이 해요. (웹캠을 컴퓨터의 다른 USB 구멍에 나눠 꽂아 보세요)';
    return;
  }
  S.twoCams = true;
  S.settings.camOrder = order.slice(0, 2);
  saveSettings();
}

// 두 번째 카메라용 자세 인식기 (카메라마다 따로 있어야 서로 섞이지 않아요)
async function ensureCam2Model() {
  if (!S.models.cam2) S.models.cam2 = await S.models.makeCam();
}

// [↔ 카메라 서로 바꾸기]: 호랑이팀·까치팀 카메라를 맞바꿔요
async function swapCameras() {
  if (!S.twoCams) return;
  [S.camStream, S.camStream2] = [S.camStream2, S.camStream];
  el.camVideo.srcObject = S.camStream;
  el.camVideo2.srcObject = S.camStream2;
  await Promise.all([playVideoEl(el.camVideo), playVideoEl(el.camVideo2)]);
  S.settings.camOrder = [deviceIdOf(S.camStream), deviceIdOf(S.camStream2)];
  saveSettings();
  S.players.forEach((P) => { P.lm = null; P.prevChild = null; });
  S.readyTime = 0;
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

// "이 탭 공유"로 영상 부분만 잘라 보는 기능이 있는 브라우저인지 (크롬은 O, 사파리·아이패드는 X)
function captureSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.CropTarget);
}

function updateScoreMode() {
  const exact = media.kind === 'file' || !!S.capture;
  $('score-mode').textContent = exact ? '🎯 동작 비교 채점 중'
    : captureSupported() ? '💃 움직임 채점 중 (화면 공유 꺼짐)' : '💃 움직임 채점 중';
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
// items: [{ lm: 관절 좌표, color: 색 }, ...]  centerLine: 두 명일 때 가운데 점선
function drawSkeletons(canvas, video, items, centerLine = false) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  if (centerLine) {
    ctx.save();
    ctx.setLineDash([w / 40, w / 60]);
    ctx.lineWidth = Math.max(3, w / 200);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.restore();
  }
  for (const { lm, color } of items) if (lm) drawOneSkeleton(ctx, lm, w, h, color);
}

function drawOneSkeleton(ctx, lm, w, h, color) {
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
// 판정 구간(1.5초) 동안 아이 한 명의 기록
function newWindow() {
  return { childFrames: 0, poseScores: [], childEnergy: 0, childEnergyN: 0 };
}

// 춤추는 아이 한 명의 점수판
function newPlayer(i) {
  return {
    team: TEAMS[i],
    score: 0, combo: 0, maxCombo: 0, judged: 0,
    counts: { perfect: 0, great: 0, good: 0, miss: 0 },
    win: newWindow(),
    prevChild: null,      // 바로 전 자세 (움직인 양 계산용)
    lm: null,             // 지금 카메라에서 찾은 관절
    color: '#ffffff',     // 한 명일 때 뼈대 색 (판정에 따라 바뀜)
  };
}

const isDuo = () => S.players.length > 1;

// 새 판정 구간 시작: 아이들 기록과 댄서 움직임을 비워요
function resetWindows() {
  S.players.forEach((P) => { P.win = newWindow(); });
  S.dancerWin = { sum: 0, n: 0 };
}

// 위쪽 점수판: 한 명이면 '점수', 두 명이면 팀마다 따로
function renderHudScores() {
  $('hud-scores').innerHTML = S.players.map((P, i) => `
    <div class="hud-score${isDuo() ? ' team' : ''}" style="--team:${P.team.color}">
      <small>${isDuo() ? `${P.team.emoji} ${P.team.name}` : '점수'}</small>
      <span id="score-${i}">0</span>
    </div>`).join('');
}

// 판정 글자 준비: 아이 모습 위에 띄워요
// - 카메라 한 대 + 두 명: 한 화면의 왼쪽(호랑이)·오른쪽(까치)에 하나씩
// - 카메라 두 대: 각자 자기 카메라 화면 가운데에
function setupJudges() {
  document.querySelectorAll('.judge.clone').forEach((n) => n.remove());
  const base = $('judge');
  el.judges = [base];
  if (isDuo()) {
    const copy = base.cloneNode(true);
    copy.removeAttribute('id');
    el.judges.push(copy);
  }
  el.judges.forEach((j, i) => {
    const slot = isDuo() && !S.twoCams ? (i === 0 ? ' slot-left' : ' slot-right') : '';
    j.dataset.base = 'judge' + (i > 0 ? ' clone' : '') + slot + (isDuo() ? ` team-${i}` : '');
    j.className = j.dataset.base;
    j.querySelector('.judge-team').textContent = isDuo() ? `${TEAMS[i].emoji} ${TEAMS[i].name}` : '';
    $(S.twoCams && i === 1 ? 'cam-box-2' : 'cam-box').appendChild(j);
  });
}

// 카메라 한 대/두 대에 맞춰 화면 배치·이름표·판정 글자를 바꿔요
function applyCamLayout() {
  $('screen-play').classList.toggle('two-cams', S.twoCams);
  $('cam-box-2').hidden = !S.twoCams;
  $('cam-label').textContent = S.twoCams ? `${TEAMS[0].emoji} ${TEAMS[0].name}` : isDuo() ? '우리의 춤 🪞' : '나의 춤 🪞';
  $('btn-swap-cams').hidden = !S.twoCams;
  $('cam-note').textContent = S.camNote;
  setupJudges();
}

function resetGame() {
  S.players = Array.from({ length: S.settings.players === 2 ? 2 : 1 }, (_, i) => newPlayer(i));
  Object.assign(S, {
    winStart: 0,
    dancerHist: [], prevDancer: null,
    readyTime: 0,
    stallTime: 0,
  });
  resetWindows();
  renderHudScores();
  $('screen-play').classList.toggle('duo', isDuo());
  $('ready-sub').textContent = !isDuo() ? '머리부터 무릎까지 보이면 저절로 시작해요'
    : twoCamsWanted() ? '🐯 호랑이팀, 🐦 까치팀 각자 자기 카메라 앞에! 머리부터 무릎까지 보이면 저절로 시작해요'
    : '왼쪽은 🐯 호랑이팀, 오른쪽은 🐦 까치팀! 머리부터 무릎까지 보이면 저절로 시작해요';
  $('progress-fill').style.width = '0%';
  $('beat-fill').style.width = '0%';
  $('combo').textContent = '';
  $('buddy-bubble').textContent = isDuo() ? '둘이 같이 춤춰요!' : '같이 춤춰요!';
  $('ready-fill').style.width = '0%';
  $('capture-msg').textContent = '';
  el.danceCanvas.getContext('2d').clearRect(0, 0, el.danceCanvas.width, el.danceCanvas.height);
}

async function startSong(song) {
  const src = sourceOf(song);
  const v = S.videos[song.id];
  // 고정 곡: 이 맥에서는 videos 폴더 영상, 사이트·아이패드에서는 '영상 넣기'로 고른 영상
  const fileUrl = src === 'fixed' ? S.fixed[song.id] || (v && v.url) : v && v.url;
  if (src !== 'youtube' && !fileUrl) return;
  const runId = ++S.runId;
  S.countToken++;
  S.song = song;
  media.stop();
  media.kind = src === 'youtube' ? 'youtube' : 'file'; // videos 폴더 영상도 '내 영상'과 똑같이 틀어요
  resetGame();

  $('screen-play').style.setProperty('--stage-bg', song.bg);
  $('hud-stage').textContent = '📍 ' + song.stage;
  $('hud-title').textContent = `${song.title} (${song.en})`;
  el.videoBox.classList.toggle('mode-youtube', src === 'youtube');
  el.videoBox.classList.toggle('flip', src !== 'youtube' && S.settings.flip);
  // 판정 글자는 카메라 화면(아이 모습) 위에 띄워요
  // (유튜브 영상을 가리지 않아서 화면 공유 채점도 방해하지 않아요)
  // 카메라를 켜기 전에는 일단 한 대 배치로 보여 주고, 켠 뒤에 다시 맞춰요
  S.twoCams = false;
  S.camNote = '';
  applyCamLayout();
  $('debug-badge').hidden = !S.settings.debug;
  if (src !== 'youtube') {
    el.danceVideo.src = fileUrl;
    unlockVideo(); // 버튼을 누른 지금 바로 해야 사파리가 나중에 소리 있는 재생을 허락해요
  }

  showScreen('play');
  setPhase('loading');
  startLoop();

  try {
    let prepare;
    if (src === 'youtube') {
      if (location.protocol === 'file:') throw taggedError('youtube', 'file');
      prepare = prepareYouTube(ytIdOf(song));
    } else {
      prepare = waitVideoReady();
    }
    await Promise.all([ensureModels(), ensureCameras(), prepare]);
  } catch (err) {
    if (runId === S.runId) showError(err);
    return;
  }
  if (S.twoCams) {
    try { await ensureCam2Model(); }
    catch (e) {
      console.warn('두 번째 인식기를 만들 수 없어요', e);
      S.twoCams = false;
      stopCamera2();
      S.camNote = '📷 컴퓨터가 카메라 두 대를 감당하기 어려워서 한 대로 같이 해요.';
    }
  }
  if (runId !== S.runId || S.phase !== 'loading') return; // 그사이 그만두었으면 멈춤
  applyCamLayout();
  updateScoreMode();
  showReadyStep(src === 'youtube' && !S.capture && captureSupported() ? 'capture' : 'body');
  setPhase('ready');
}

// 사파리(특히 아이패드)는 사람이 버튼을 누른 순간에만 소리 있는 영상을 틀 수 있게 해요.
// 그래서 [춤추기]를 누를 때 소리를 끈 채 아주 잠깐 틀었다 멈춰서 미리 허락을 받아 둬요.
function unlockVideo() {
  const v = el.danceVideo;
  v.muted = true;
  const p = v.play();
  const restore = () => { v.pause(); v.muted = false; v.currentTime = 0; };
  if (p && p.then) p.then(restore, () => { v.muted = false; });
  else restore();
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
    resetWindows();
    playVideo();
  });
}

function playVideo() {
  S.stallTime = 0;
  S.directPlay = false;
  media.play()
    .then(() => setPhase('playing'))
    .catch(() => showPause(true)); // 브라우저가 자동 재생을 막으면 [계속하기]를 누르는 순간 바로 틀어요
}

// 멈춤 화면 보여 주기 (direct: 자동 재생이 막혀서 버튼을 눌러야 시작할 수 있을 때)
function showPause(direct) {
  S.directPlay = direct;
  const title = $('pause-title'); // 브라우저가 예전 화면 파일을 기억하고 있어도 멈추지 않게 확인
  if (title) title.textContent = direct ? '▶ 계속하기를 누르면 시작해요' : '잠깐 쉬는 중이에요';
  setPhase('paused');
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

function pauseGame(direct = false) {
  if (S.phase !== 'playing') return;
  media.pause();
  S.players.forEach((P) => { P.prevChild = null; });
  S.prevDancer = null;
  showPause(direct);
}

function resumeGame() {
  if (S.phase !== 'paused') return;
  // 자동 재생이 막혔던 경우에는 카운트다운 없이 누른 순간 바로 틀어요 (사파리·아이패드)
  if (S.directPlay) playVideo();
  else runCountdown(playVideo);
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

// 찾은 사람들의 관절 목록 (없으면 빈 목록)
function detectPoses(landmarker, video, ts) {
  try {
    const res = landmarker.detectForVideo(video, ts);
    return (res && res.landmarks) || [];
  } catch (e) {
    console.warn('인식 오류', e);
    return [];
  }
}

// 거울처럼 보이는 카메라 화면에서 사람이 선 가로 위치 (0 = 왼쪽 끝, 1 = 오른쪽 끝)
function screenX(lm) {
  let joints = [11, 12, 23, 24].filter((i) => (lm[i].visibility ?? 0) >= VIS_MIN);
  if (!joints.length) joints = [0, 11, 12];
  return 1 - joints.reduce((s, i) => s + lm[i].x, 0) / joints.length;
}

// 사람이 화면에서 얼마나 크게 보이는지 (클수록 카메라에 가까이 있어요)
function bodySize(lm) {
  const shoulder = Math.abs(lm[11].x - lm[12].x);
  const torso = Math.abs((lm[11].y + lm[12].y) / 2 - (lm[23].y + lm[24].y) / 2);
  return Math.max(shoulder, torso);
}

// 가장 크게(가까이) 보이는 사람 (뒤에 선생님이 지나가도 헷갈리지 않게)
function closestPose(list) {
  return list.length ? list.reduce((a, b) => (bodySize(b) > bodySize(a) ? b : a)) : null;
}

// 카메라 한 대에서 찾은 사람들을 아이 자리에 나눠 줘요
// - 한 명 모드: 가장 가까이 보이는 사람
// - 두 명 모드: 화면 왼쪽 = 🐯 호랑이팀, 오른쪽 = 🐦 까치팀
function assignPlayers(list) {
  if (!isDuo()) return [closestPose(list)];
  const sorted = [...list].sort((a, b) => screenX(a) - screenX(b));
  if (sorted.length >= 2) return [sorted[0], sorted[sorted.length - 1]];
  if (sorted.length === 1) return screenX(sorted[0]) < 0.5 ? [sorted[0], null] : [null, sorted[0]];
  return [null, null];
}

function tick() {
  S.raf = requestAnimationFrame(tick);
  const now = performance.now();
  const dt = S.lastTick ? (now - S.lastTick) / 1000 : 0;
  S.lastTick = now;
  if (!S.models) return;

  // 카메라 인식: 두 대면 한 번에 한 대씩 번갈아 해서 컴퓨터 부담을 나눠요
  const cams = S.twoCams && S.models.cam2 ? [el.camVideo, el.camVideo2] : [el.camVideo];
  for (let c = 0; c < cams.length; c++) {
    if (cams[c].readyState < 2 || now - S.lastCamDetect[c] < DETECT_MS) continue;
    S.lastCamDetect[c] = now;
    onCameraPoses(c, detectPoses(c === 0 ? S.models.cam : S.models.cam2, cams[c], now), now);
    break;
  }
  // 댄서를 볼 화면: 내 영상이면 영상 그 자체, 유튜브면 화면 공유로 받은 영상
  const src = media.kind === 'file' ? el.danceVideo : S.capture ? el.captureVideo : null;
  if (src && S.phase === 'playing' && media.advancing() && src.readyState >= 2 && now - S.lastVidDetect >= DETECT_MS) {
    S.lastVidDetect = now;
    onDancerPose(detectPoses(S.models.vid, src, now)[0] || null, media.time(), src);
  }
  if (S.phase === 'ready' && S.readyStep === 'body') updateReady(dt);
  if (S.phase === 'playing') updatePlaying(dt);
}

// 카메라(c번)에서 찾은 사람들이 들어왔을 때
function onCameraPoses(c, list, now) {
  if (!S.twoCams) { onChildPoses(list, now); return; }
  // 카메라 두 대: 카메라마다 가장 가까이 보이는 아이 한 명 (0번 = 호랑이팀, 1번 = 까치팀)
  const lm = closestPose(list);
  const [video, canvas] = c === 0 ? [el.camVideo, el.camCanvas] : [el.camVideo2, el.camCanvas2];
  drawSkeletons(canvas, video, [{ lm, color: TEAMS[c].color }]);
  const P = S.players[c];
  P.lm = lm;
  if (S.phase !== 'playing' || !media.advancing()) return;
  scoreChildFrame(P, lm, now, media.time(), video);
}

// 카메라 한 대에서 아이들의 자세가 들어왔을 때
function onChildPoses(list, now) {
  const assigned = assignPlayers(list);
  // 한 명일 때는 판정 색, 두 명일 때는 팀 색으로 뼈대를 그려요
  drawSkeletons(el.camCanvas, el.camVideo,
    assigned.map((lm, i) => ({ lm, color: isDuo() ? TEAMS[i].color : S.players[0].color })), isDuo());
  assigned.forEach((lm, i) => { S.players[i].lm = lm; });
  if (S.phase !== 'playing' || !media.advancing()) return;

  const vt = media.time();
  assigned.forEach((lm, i) => scoreChildFrame(S.players[i], lm, now, vt));
}

// 아이 한 명의 이번 순간 자세를 채점 기록에 더해요
function scoreChildFrame(P, lm, now, vt, video = el.camVideo) {
  const { videoWidth: cw, videoHeight: ch } = video;
  const pose = lm ? makePose(lm, cw && ch ? cw / ch : 16 / 9) : null; // 화면 크기를 아직 모르면 16:9로 봐요
  if (!pose || pose.armCount < 2) { P.prevChild = null; return; }

  const w = P.win;
  w.childFrames++;
  if (P.prevChild) {
    const sp = moveSpeed(P.prevChild.pose, pose, (now - P.prevChild.time) / 1000);
    if (sp !== null) { w.childEnergy += sp; w.childEnergyN++; }
  }
  P.prevChild = { pose, time: now };

  // 최근 1초 동안의 댄서 자세 중 가장 비슷한 것과 비교 (조금 늦게 따라 해도 괜찮아요)
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
    if (media.kind === 'file') drawSkeletons(el.danceCanvas, el.danceVideo, [{ lm, color: '#ffe14d' }]);
    S.debugDancer = lm ? '댄서 인식 ✅' : '댄서 인식 ❌ (움직임으로 채점)';
    $('debug-badge').textContent = S.debugDancer;
  }
  const pose = lm ? makePose(lm, src.videoWidth / src.videoHeight) : null;
  if (!pose || pose.armCount < 2) { S.prevDancer = null; return; }

  S.dancerHist.push({ t: vt, segs: pose.raw });
  while (S.dancerHist.length && S.dancerHist[0].t < vt - 2) S.dancerHist.shift();

  if (S.prevDancer) {
    const sp = moveSpeed(S.prevDancer.pose, pose, vt - S.prevDancer.t);
    if (sp !== null) { S.dancerWin.sum += sp; S.dancerWin.n++; }
  }
  S.prevDancer = { pose, t: vt };
}

// 시작 전: 아이(들) 몸이 잘 보이는지 확인
function updateReady(dt) {
  const seen = S.players.map((P) => !!P.lm);
  const visible = S.players.map((P) => !!P.lm && [11, 12, 23, 24].every((i) => (P.lm[i].visibility ?? 0) >= 0.6));
  const allVisible = visible.every(Boolean);
  S.readyTime = allVisible ? S.readyTime + dt : Math.max(0, S.readyTime - dt * 2);
  $('ready-fill').style.width = clamp(S.readyTime / READY_HOLD, 0, 1) * 100 + '%';
  let msg;
  if (allVisible) msg = '좋아요! 곧 시작해요 😊';
  else if (!isDuo()) msg = seen[0] ? '한 걸음 뒤로 가 볼까요? 👣' : '카메라에 내 모습이 보이게 서 주세요!';
  else if (!seen.some(Boolean)) msg = '두 친구 모두 카메라에 보이게 서 주세요!';
  else {
    msg = TEAMS.map((t, i) => `${t.emoji} ${visible[i] ? '✅' : '👀'}`).join('   ')
      + (S.twoCams ? '   각자 자기 카메라 앞에서 한 걸음 뒤로!' : '   양쪽에 한 명씩, 한 걸음 뒤로!');
  }
  $('ready-msg').textContent = msg;
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
    if (S.stallTime > 3) { pauseGame(true); return; } // 다시 누르면 카운트다운 없이 바로 틀어요
  }

  if (vt - S.winStart >= JUDGE_INTERVAL) {
    judgeWindow();
    S.winStart += JUDGE_INTERVAL;
    if (vt - S.winStart >= JUDGE_INTERVAL) S.winStart = vt; // 너무 밀리면 다시 맞춤
    resetWindows();
  }
}

// 1.5초마다: 아이마다 따로 판정해요
function judgeWindow() {
  const th = DIFFICULTY[S.settings.difficulty] || DIFFICULTY.easy;
  const dancerEnergy = S.dancerWin.n ? S.dancerWin.sum / S.dancerWin.n : 0;
  const results = S.players.map((P) => judgePlayer(P.win, th, dancerEnergy));
  if (S.settings.debug) {
    $('debug-badge').textContent = `${S.debugDancer} · 이번 점수 ${results.map((r) => r.score.toFixed(2)).join(' / ')}`;
  }
  results.forEach((r, i) => applyJudge(S.players[i], r.kind, i));
  afterJudge(results.map((r) => r.kind));
}

// 아이 한 명의 1.5초 기록 → 판정 종류와 0~1 점수
function judgePlayer(w, th, dancerEnergy) {
  let kind, score = 0;

  if (w.childFrames < 2) {
    kind = 'away';
  } else {
    const childEnergy = w.childEnergyN ? w.childEnergy / w.childEnergyN : 0;
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
  return { kind, score };
}

// 아이 한 명의 판정을 점수판과 판정 글자에 보여 줘요
function applyJudge(P, kind, i) {
  const J = JUDGES[kind];
  P.judged++;
  P.score += J.points;
  P.counts[kind === 'away' ? 'miss' : kind]++;
  P.combo = J.points > 0 ? P.combo + 1 : 0;
  P.maxCombo = Math.max(P.maxCombo, P.combo);
  P.color = J.color;

  const scoreEl = $('score-' + i);
  scoreEl.textContent = P.score.toLocaleString();
  if (J.points > 0) restartAnim(scoreEl, 'bump');

  const judge = el.judges[i];
  judge.className = judge.dataset.base + ' ' + kind;
  judge.querySelector('.judge-emoji').textContent = J.emoji;
  judge.querySelector('.judge-text').textContent = J.text;
  judge.querySelector('.judge-points').textContent = J.points ? '+' + J.points : '';
  restartAnim(judge, 'show');
}

// 판정이 끝난 뒤: 호랑이 말풍선·콤보·효과음 (두 명이면 더 잘한 쪽 기준으로 한 번만)
function afterJudge(kinds) {
  const top = kinds.reduce((a, b) => (RANK[b] > RANK[a] ? b : a));
  $('buddy-bubble').textContent = JUDGES[top].buddy;
  $('combo').textContent = isDuo()
    ? S.players.filter((P) => P.combo >= 3).map((P) => `${P.team.emoji} ${P.combo}콤보`).join(' · ') + (S.players.some((P) => P.combo >= 3) ? ' 🔥' : '')
    : S.players[0].combo >= 3 ? `${S.players[0].combo} 콤보! 🔥` : '';
  if (JUDGES[top].points > 0) restartAnim($('buddy-mascot'), 'happy');

  if (top === 'perfect') { beep(880, 0.1); setTimeout(() => beep(1320, 0.15), 90); }
  else if (top === 'great') beep(784, 0.12);
  else if (top === 'good') beep(659, 0.1);
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
// 끝까지 춤추면 별 1개는 꼭 받아요
function starsOf(P) {
  const pct = P.judged ? P.score / (P.judged * 100) : 0;
  return pct >= 0.7 ? 3 : pct >= 0.4 ? 2 : 1;
}

function breakdownChips(P) {
  return [
    `🌟 최고야 ${P.counts.perfect}`,
    `👏 잘했어 ${P.counts.great}`,
    `🙂 좋아 ${P.counts.good}`,
    `💪 다시 해봐 ${P.counts.miss}`,
    `🔥 최대 콤보 ${P.maxCombo}`,
  ].map((t) => `<span class="chip">${t}</span>`).join('');
}

function finishGame() {
  setPhase('ended');
  stopLoop();
  const song = S.song;
  const stars = S.players.map(starsOf);

  // 최고 점수: 두 명이면 더 높은 점수로 기록해요
  const top = S.players.reduce((a, b) => (b.score > a.score ? b : a));
  const isRecord = top.score > 0 && top.score > (S.best[song.id] || 0);
  if (isRecord) { S.best[song.id] = top.score; saveJSON('hoya-best', S.best); }

  $('result-stage').textContent = `📍 ${song.stage} · ${song.title}`;
  $('stars').hidden = isDuo();
  $('result-solo').hidden = isDuo();
  $('result-duo').hidden = !isDuo();

  if (!isDuo()) {
    const P = S.players[0];
    document.querySelectorAll('#stars span').forEach((s, i) => {
      s.classList.toggle('on', i < stars[0]);
      s.style.animationDelay = i * 0.25 + 's';
    });
    $('result-msg').textContent = {
      3: '우와! 최고의 댄스왕이에요! 👑',
      2: '정말 잘했어요! 짝짝짝 👏',
      1: '멋지게 춤췄어요! 다음엔 더 잘할 수 있어요 💪',
    }[stars[0]];
    $('result-score').textContent = P.score.toLocaleString();
    $('new-record').hidden = !isRecord;
    $('breakdown').innerHTML = breakdownChips(P);
  } else {
    // 두 명: 이긴 사람·진 사람 없이 둘 다 칭찬해요
    $('result-msg').textContent = '둘 다 정말 멋지게 춤췄어요! 👏👏';
    const praise = { 3: '최고의 댄스왕! 👑', 2: '정말 잘했어요! 👏', 1: '멋지게 췄어요! 💪' };
    $('result-duo').innerHTML = S.players.map((P, i) => `
      <div class="result-player" style="--team:${P.team.color}">
        <div class="rp-team">${P.team.emoji} ${P.team.name}</div>
        <div class="stars small">${[0, 1, 2].map((k) => `<span class="${k < stars[i] ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
        <div class="rp-praise">${praise[stars[i]]}</div>
        <div class="rp-score"><span>${P.score.toLocaleString()}</span>점${isRecord && P === top ? ' <span class="new-record">🎉 새 기록!</span>' : ''}</div>
        <div class="breakdown small">${breakdownChips(P)}</div>
      </div>`).join('');
  }

  showScreen('result');
  launchConfetti(Math.max(...stars));
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
    if (audioCtx.state === 'suspended') audioCtx.resume(); // 사파리는 소리 장치가 잠들어 있을 수 있어요
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
  const d = document, root = d.documentElement;
  // 사파리(아이패드)는 webkit으로 시작하는 이름을 써요
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    return;
  }
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) { alert('이 기기에서는 전체 화면을 쓸 수 없어요.'); return; }
  const r = request.call(root);
  if (r && r.catch) r.catch(() => {});
}

function bindUI() {
  $('btn-start').addEventListener('click', async () => {
    beep(660);
    showScreen('select');
    await findFixedVideos(); // 그사이 videos 폴더에 영상을 넣었을 수도 있으니 다시 찾아봐요
    renderSongs();
  });
  $('btn-home').addEventListener('click', () => { stopCamera(); stopCapture(); showScreen('title'); });
  $('btn-fullscreen').addEventListener('click', toggleFullscreen);
  $('file-input').addEventListener('change', onVideoPicked);

  document.querySelectorAll('#difficulty button').forEach((b) => b.addEventListener('click', () => {
    S.settings.difficulty = b.dataset.value;
    saveSettings();
    renderSettings();
  }));
  document.querySelectorAll('#players-seg button').forEach((b) => b.addEventListener('click', () => {
    S.settings.players = Number(b.dataset.value);
    saveSettings();
    renderSettings();
  }));
  document.querySelectorAll('#cam-seg button').forEach((b) => b.addEventListener('click', () => {
    S.settings.camMode = b.dataset.value;
    saveSettings();
    renderSettings();
  }));
  $('btn-swap-cams').addEventListener('click', swapCameras);
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
  await Promise.all([loadStoredVideos(), findFixedVideos()]);
  renderSongs();
}

init();
