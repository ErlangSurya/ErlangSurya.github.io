// dictionary.js — Free Dictionary API client (dictionaryapi.dev)
// Returns normalized word data, or null on 404 / missing data.
const DictionaryAPI = (() => {
  const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const MAX_DEFS_PER_POS = 2;

  // Replace the target word (and obvious variants) inside a definition string
  // with a blank so we never leak the answer to players.
  function censor(text, word) {
    if (!text) return text;
    const w = word.toLowerCase();
    // Build a few simple variants: plural, -ing, -ed, -s.
    const stems = [w, w + 's', w + 'es', w + 'd', w + 'ed', w + 'ing'];
    if (w.endsWith('e')) stems.push(w.slice(0, -1) + 'ing');
    if (w.endsWith('y')) stems.push(w.slice(0, -1) + 'ies');
    // Longest first so we censor the biggest match.
    stems.sort((a, b) => b.length - a.length);
    let out = text;
    for (const stem of stems) {
      const re = new RegExp('\\b' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      out = out.replace(re, '_____');
    }
    return out;
  }

  async function fetchWordData(word) {
    let res;
    try {
      res = await fetch(BASE_URL + encodeURIComponent(word));
    } catch (e) {
      return null; // network error
    }
    if (!res.ok) return null; // 404 / no definition

    let data;
    try {
      data = await res.json();
    } catch (e) {
      return null;
    }
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];

    // Find first usable audio across all entries.
    let audioUrl = null;
    for (const e of data) {
      const a = (e.phonetics || []).find(p => p.audio && p.audio.length > 0);
      if (a) { audioUrl = a.audio; break; }
    }

    // Collect meanings, censoring the word out of every definition.
    const meanings = (entry.meanings || [])
      .map(m => ({
        partOfSpeech: m.partOfSpeech,
        definitions: (m.definitions || [])
          .slice(0, MAX_DEFS_PER_POS)
          .map(d => censor(d.definition, entry.word))
      }))
      .filter(m => m.definitions.length > 0);

    if (meanings.length === 0) return null;

    return {
      word: entry.word.toLowerCase(),
      meanings,
      audioUrl
    };
  }

  return { fetchWordData };
})();
