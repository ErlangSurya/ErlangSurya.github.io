// game.js — Spelling Bee state machine (sudden-death, last player standing).
// The HOST is authoritative: it picks words, validates spellings, advances turns.
// Clients render purely from broadcast messages. All player IDs are strings.
const Game = (() => {
  let words = null;
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

  // UI callbacks
  let cb = {};
  // WebRTC senders
  let broadcast = null;
  let sendToHost = null;

  const RESULT_DELAY_MS = 2500;

  async function loadWords() {
    if (words) return words;
    const res = await fetch('words.json');
    words = await res.json();
    return words;
  }

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
  }

  function setState(s) { state = s; cb.onStateChange(state); }

  // ===== HOST: lifecycle =====

  async function startGame() {
    if (!isHost) return;
    await loadWords();
    alive = allPlayers.map(p => p.id);
    turnPointer = 0;
    setState('PLAYING');
    broadcast({ type: 'start_game', players: allPlayers });
    await nextRound();
  }

  function restart() {
    if (!isHost) return;
    alive = allPlayers.map(p => p.id);
    turnPointer = 0;
    setState('PLAYING');
    broadcast({ type: 'restart_game', players: allPlayers });
    nextRound();
  }

  // ===== HOST: round logic =====

  async function pickWord() {
    const difficulties = Object.keys(words);
    const MAX_ATTEMPTS = 10;
    const tried = new Set();
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
      const list = words[diff];
      const word = list[Math.floor(Math.random() * list.length)];
      if (tried.has(word)) continue;
      tried.add(word);
      const data = await DictionaryAPI.fetchWordData(word);
      if (data && data.audioUrl && data.meanings.length > 0) return data;
    }
    return null;
  }

  async function nextRound() {
    if (!isHost) return;
    if (alive.length <= 1) return checkWinner();

    const wordData = await pickWord();
    if (!wordData) {
      // Extremely unlikely; skip turn and retry.
      setTimeout(() => nextRound(), 500);
      return;
    }

    currentWord = wordData;
    currentActiveId = alive[turnPointer];
    const activePlayer = allPlayers.find(p => p.id === currentActiveId);

    const payload = {
      type: 'new_round',
      wordData: { meanings: wordData.meanings, audioUrl: wordData.audioUrl },
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
    setState('GAME_OVER');
    const payload = {
      type: 'game_over',
      winnerId,
      winnerName: winner ? winner.name : 'Nobody'
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

  return {
    loadWords, init, setPlayers,
    startGame, restart, submitAttempt, handleSubmission, handleMessage,
    getState, getAllPlayers, getActiveId, isPlayerAlive
  };
})();
