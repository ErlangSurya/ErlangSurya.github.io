// game.js — Spelling Bee state machine (sudden-death, last player standing).
// The HOST is authoritative: it picks words, validates spellings, advances turns.
// Clients render purely from broadcast messages. All player IDs are strings.
const Game = (() => {
  let words = null;
  let wordPackFile = 'words.json';
  let state = 'LOBBY'; // LOBBY | PLAYING | ROUND_ACTIVE | ROUND_RESULT | GAME_OVER
  let isHost = false;

  // allPlayers: [{ id, name }]  — full roster, never mutated mid-game
  // alive: array of ids still in the game
  // turnPointer: index into `alive` whose turn it is
  let allPlayers = [];
  let alive = [];
  let turnPointer = 0;
  let currentActiveId = null; // whose turn — synced to clients via new_round
  let currentWord = null;     // host only: the actual answer for this round

  // Cross-session continuity (host-authoritative): win tallies persist across
  // "Play Again", and the previous session's winner starts the next one.
  let wins = {};              // playerId -> number of session wins
  let lastWinnerId = null;

  // Difficulty is fixed per round-robin cycle so everyone in a pass faces the
  // same difficulty (different words). A new cycle = a fresh random difficulty.
  let currentDifficulty = null;
  let turnTakenThisCycle = new Set(); // player ids that already played this cycle
  let showDifficulty = false; // whether to reveal the difficulty level to players
  let categorized = true;     // false for flat/uncategorized word packs

  // UI callbacks
  let cb = {};
  // WebRTC senders
  let broadcast = null;
  let sendToHost = null;

  const RESULT_DELAY_MS = 2500;

  async function loadWords() {
    if (words) return words;
    const res = await fetch(wordPackFile);
    const raw = await res.json();
    // Accept either a categorized object { easy:[], medium:[], hard:[] } or a
    // flat array of words (uncategorized pack). A single-bucket object is also
    // treated as uncategorized since there's no meaningful difficulty to show.
    if (Array.isArray(raw)) {
      words = { all: raw };
      categorized = false;
    } else {
      words = raw;
      categorized = Object.keys(raw).length > 1;
    }
    return words;
  }

  function setWordPack(file) {
    if (file === wordPackFile) return;
    wordPackFile = file;
    words = null; // force reload of the newly selected pack
  }

  function setShowDifficulty(v) { showDifficulty = !!v; }

  function init(options) {
    isHost = options.isHost;
    broadcast = options.broadcast || null;
    sendToHost = options.sendToHost || null;
    cb = {
      onStateChange: options.onStateChange || (() => {}),
      onRoundStart: options.onRoundStart || (() => {}),
      onRoundResult: options.onRoundResult || (() => {}),
      onGameOver: options.onGameOver || (() => {})
    };
  }

  function setPlayers(playerList) {
    allPlayers = playerList.map(p => ({ id: String(p.id), name: p.name }));
    alive = allPlayers.map(p => p.id);
    turnPointer = 0;
    // Fresh multi-session run: reset win tallies and winner history.
    wins = {};
    allPlayers.forEach(p => { wins[p.id] = 0; });
    lastWinnerId = null;
    resetCycle();
  }

  function resetCycle() {
    currentDifficulty = null;
    turnTakenThisCycle = new Set();
  }

  function setState(s) { state = s; cb.onStateChange(state); }

  // ===== HOST: lifecycle =====

  async function startGame() {
    if (!isHost) return;
    await loadWords();
    alive = allPlayers.map(p => p.id);
    turnPointer = 0;
    resetCycle();
    setState('PLAYING');
    broadcast({ type: 'start_game', players: allPlayers, showDifficulty });
    await nextRound();
  }

  function restart() {
    if (!isHost) return;
    alive = allPlayers.map(p => p.id);
    // The previous session's winner starts the new session.
    const startIdx = lastWinnerId ? alive.indexOf(lastWinnerId) : -1;
    turnPointer = startIdx >= 0 ? startIdx : 0;
    resetCycle();
    setState('PLAYING');
    broadcast({ type: 'restart_game', players: allPlayers, showDifficulty });
    nextRound();
  }

  // ===== HOST: round logic =====

  function randomDifficulty() {
    const ds = Object.keys(words);
    return ds[Math.floor(Math.random() * ds.length)];
  }

  // Try to find a usable word (has audio + definitions) within one difficulty.
  async function pickWordFrom(difficulty) {
    const list = words[difficulty] || [];
    if (list.length === 0) return null;
    const tried = new Set();
    const MAX_ATTEMPTS = 10;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const word = list[Math.floor(Math.random() * list.length)];
      if (tried.has(word)) continue;
      tried.add(word);
      // fetchWordData handles the definition fallback (Datamuse) and audio
      // synthesis flag internally; it returns null only when NO definition
      // exists anywhere, in which case we try another word.
      const data = await DictionaryAPI.fetchWordData(word);
      if (data && data.meanings.length > 0) return data;
    }
    return null;
  }

  // Pick from the requested difficulty; fall back to any difficulty only if
  // that difficulty can't yield a usable word, so the game never stalls.
  async function pickWord(difficulty) {
    let data = await pickWordFrom(difficulty);
    if (data) return data;
    for (let i = 0; i < 10; i++) {
      data = await pickWordFrom(randomDifficulty());
      if (data) return data;
    }
    return null;
  }

  async function nextRound() {
    if (!isHost) return;
    if (alive.length <= 1) return checkWinner();

    currentActiveId = alive[turnPointer];

    // New cycle when the very first round runs, or when we return to a player
    // who has already played in the current cycle (a full pass completed).
    if (currentDifficulty === null || turnTakenThisCycle.has(currentActiveId)) {
      currentDifficulty = randomDifficulty();
      turnTakenThisCycle = new Set();
    }
    turnTakenThisCycle.add(currentActiveId);

    const wordData = await pickWord(currentDifficulty);
    if (!wordData) {
      // Extremely unlikely; skip turn and retry.
      setTimeout(() => nextRound(), 500);
      return;
    }

    currentWord = wordData;
    const activePlayer = allPlayers.find(p => p.id === currentActiveId);

    // Audio: send the human recording URL when available, and always include
    // the text so clients can also speak it via synthesis. (ttsText is the
    // answer — used ONLY for audio, never displayed.)
    const wd = {
      meanings: wordData.meanings,
      audioUrl: wordData.audioUrl, // may be null
      ttsText: wordData.word
    };

    const payload = {
      type: 'new_round',
      wordData: wd,
      difficulty: categorized ? currentDifficulty : null,
      activePlayerId: currentActiveId,
      activePlayerName: activePlayer ? activePlayer.name : 'Player'
    };

    setState('ROUND_ACTIVE');
    broadcast(payload);
    cb.onRoundStart(payload);
  }

  // ===== HOST: submission handling =====

  function handleSubmission(playerId, attempt) {
    if (!isHost || state !== 'ROUND_ACTIVE') return;
    const fromId = String(playerId);
    if (fromId !== currentActiveId) return; // only the active player counts

    const activePlayer = allPlayers.find(p => p.id === fromId);
    const correct =
      attempt.toLowerCase().trim() === currentWord.word.toLowerCase().trim();

    const result = {
      type: 'round_result',
      playerId: fromId,
      playerName: activePlayer ? activePlayer.name : 'Player',
      attempt,
      correct,
      actualWord: currentWord.word
    };

    setState('ROUND_RESULT');
    broadcast(result);
    cb.onRoundResult(result);

    // Advance turn / eliminate.
    if (correct) {
      turnPointer = (turnPointer + 1) % alive.length;
    } else {
      alive = alive.filter(id => id !== fromId);
      if (alive.length > 0 && turnPointer >= alive.length) turnPointer = 0;
    }

    if (alive.length <= 1) return setTimeout(checkWinner, RESULT_DELAY_MS);
    setTimeout(() => nextRound(), RESULT_DELAY_MS);
  }

  function checkWinner() {
    if (!isHost) return;
    const winnerId = alive[0] || null;
    const winner = allPlayers.find(p => p.id === winnerId);
    if (winnerId) {
      wins[winnerId] = (wins[winnerId] || 0) + 1;
      lastWinnerId = winnerId;
    }
    setState('GAME_OVER');
    const payload = {
      type: 'game_over',
      winnerId,
      winnerName: winner ? winner.name : 'Nobody',
      scores: allPlayers.map(p => ({ id: p.id, name: p.name, wins: wins[p.id] || 0 }))
    };
    broadcast(payload);
    cb.onGameOver(payload);
  }

  // ===== CLIENT: inbound message handling =====

  function handleMessage(data) {
    switch (data.type) {
      case 'start_game':
      case 'restart_game':
        allPlayers = data.players.map(p => ({ id: String(p.id), name: p.name }));
        alive = allPlayers.map(p => p.id);
        turnPointer = 0;
        currentActiveId = null;
        showDifficulty = !!data.showDifficulty;
        setState('PLAYING');
        break;

      case 'new_round':
        currentActiveId = String(data.activePlayerId);
        setState('ROUND_ACTIVE');
        cb.onRoundStart(data);
        break;

      case 'round_result':
        setState('ROUND_RESULT');
        cb.onRoundResult(data);
        if (!data.correct) {
          alive = alive.filter(id => id !== String(data.playerId));
        }
        break;

      case 'game_over':
        currentActiveId = null;
        setState('GAME_OVER');
        cb.onGameOver(data);
        break;
    }
  }

  // ===== Submit (host or client) =====

  function submitAttempt(attempt) {
    if (isHost) {
      handleSubmission(currentActiveId, attempt);
    } else {
      sendToHost({ type: 'submit_attempt', attempt });
    }
  }

  // ===== Getters (for UI rendering) =====

  function getState() { return state; }
  function getAllPlayers() { return allPlayers; }
  function getActiveId() { return currentActiveId; }
  function isPlayerAlive(id) { return alive.includes(String(id)); }
  function getShowDifficulty() { return showDifficulty; }

  return {
    loadWords, setWordPack, setShowDifficulty, getShowDifficulty, init, setPlayers,
    startGame, restart, submitAttempt, handleSubmission, handleMessage,
    getState, getAllPlayers, getActiveId, isPlayerAlive
  };
})();
