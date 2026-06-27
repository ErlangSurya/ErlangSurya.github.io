// webrtc.js — Pure WebRTC "Star Network" (no signaling server).
// Host keeps one RTCPeerConnection + RTCDataChannel per joiner.
// Joiners connect only to the host. All IDs are strings.
const WebRTC = (() => {
  const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  // ---- Host state ----
  const peers = {};        // id -> RTCPeerConnection
  const channels = {};     // id -> RTCDataChannel
  const playerNames = {};  // id -> name
  let onMessageCallback = null;

  // ---- Joiner state ----
  let hostChannel = null;
  let myName = '';

  // Wait until ICE gathering finishes (or a safety timeout) so the SDP we
  // encode contains the candidates. Robust against the "complete" event
  // firing before we attach a listener.
  function waitForIce(pc) {
    return new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      };
      const onChange = () => { if (pc.iceGatheringState === 'complete') finish(); };
      pc.addEventListener('icegatheringstatechange', onChange);
      pc.addEventListener('icecandidate', e => { if (!e.candidate) finish(); });
      // Don't hang forever if a candidate never closes gathering.
      setTimeout(finish, 4000);
    });
  }

  function getPlayerNames() { return { ...playerNames }; }
  function getConnectedPlayerIds() {
    return Object.keys(channels).filter(id => channels[id].readyState === 'open');
  }

  // ============ HOST ============

  function initializeAsHost(playerCount, onMessage) {
    onMessageCallback = onMessage;
    playerNames['1'] = ''; // host (player 1); name set via setHostName

    const panelPlayerIds = [];
    for (let i = 2; i <= playerCount; i++) {
      const id = String(i);
      playerNames[id] = `Player ${i}`;
      panelPlayerIds.push(id);
    }

    return {
      panelPlayerIds,
      setHostName(name) { playerNames['1'] = name; },
      generateLink,
      acceptAnswer,
      broadcast,
      sendTo
    };
  }

  async function generateLink(playerId) {
    const id = String(playerId);
    const pc = new RTCPeerConnection(rtcConfig);
    peers[id] = pc;
    channels[id] = pc.createDataChannel('game');
    setupHostChannel(channels[id], id);
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        if (onMessageCallback) onMessageCallback({ type: '_player_left', playerId: id });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);
    return btoa(JSON.stringify(pc.localDescription));
  }

  async function acceptAnswer(playerId, b64Answer) {
    const id = String(playerId);
    const decoded = JSON.parse(atob(b64Answer.trim()));
    await peers[id].setRemoteDescription(decoded);
  }

  function setupHostChannel(channel, playerId) {
    const id = String(playerId);
    channel.onopen = () => {
      if (onMessageCallback) onMessageCallback({ type: '_channel_open', playerId: id });
    };
    channel.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === '_name') {
        playerNames[id] = data.name;
        if (onMessageCallback) onMessageCallback({ type: '_player_joined', playerId: id, name: data.name });
        return;
      }
      if (onMessageCallback) onMessageCallback(data, id);
    };
  }

  function broadcast(msg) {
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    Object.values(channels).forEach(ch => {
      if (ch.readyState === 'open') ch.send(payload);
    });
  }

  function sendTo(playerId, msg) {
    const id = String(playerId);
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (channels[id] && channels[id].readyState === 'open') channels[id].send(payload);
  }

  // ============ JOINER ============

  async function initializeAsJoiner(offerBase64, onMessage) {
    onMessageCallback = onMessage;
    const pc = new RTCPeerConnection(rtcConfig);

    pc.ondatachannel = (event) => {
      hostChannel = event.channel;
      hostChannel.onopen = () => {
        hostChannel.send(JSON.stringify({ type: '_name', name: myName || 'Player' }));
        if (onMessageCallback) onMessageCallback({ type: '_connected' });
      };
      hostChannel.onmessage = (e) => {
        let data;
        try { data = JSON.parse(e.data); } catch { return; }
        if (onMessageCallback) onMessageCallback(data);
      };
    };

    const decodedOffer = JSON.parse(atob(offerBase64));
    await pc.setRemoteDescription(decodedOffer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIce(pc);

    return {
      answerBase64: btoa(JSON.stringify(pc.localDescription)),
      sendToHost(msg) {
        const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
        if (hostChannel && hostChannel.readyState === 'open') hostChannel.send(payload);
      },
      setName(name) {
        myName = name;
        // If already connected, push the updated name to the host.
        if (hostChannel && hostChannel.readyState === 'open') {
          hostChannel.send(JSON.stringify({ type: '_name', name: myName }));
        }
      }
    };
  }

  return {
    initializeAsHost,
    initializeAsJoiner,
    getPlayerNames,
    getConnectedPlayerIds
  };
})();
