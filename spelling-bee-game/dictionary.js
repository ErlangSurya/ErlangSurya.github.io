// dictionary.js — Definition lookup with fallback, plus human audio URL.
//   Definitions: dictionaryapi.dev  ->  Datamuse API
//   Audio:       dictionaryapi.dev human recording (when available)
// Speech synthesis is handled client-side from the word text and is always
// available. Returns null only when NO definition can be found anywhere (the
// caller then retries with a different word).
const DictionaryAPI = (() => {
  const DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const DATAMUSE_URL = 'https://api.datamuse.com/words';
  const MAX_DEFS_PER_POS = 2;

  // Datamuse encodes part of speech as short tags; expand the common ones.
  const POS_MAP = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: '' };

  // Derive likely "core" stems from a word by stripping common inflectional
  // suffixes (-s, -es, -ed, -ing, -ies, -ied) and collapsing a doubled final
  // consonant. Returns a set that always includes the original word.
  function coreWords(w) {
    const cores = new Set([w]);
    if (w.endsWith('ies') && w.length > 4) cores.add(w.slice(0, -3) + 'y'); // studies -> study
    if (w.endsWith('ied') && w.length > 4) cores.add(w.slice(0, -3) + 'y'); // studied -> study
    if (w.endsWith('ing') && w.length > 4) {
      cores.add(w.slice(0, -3));        // jumping -> jump
      cores.add(w.slice(0, -3) + 'e');  // making  -> make
    }
    if (w.endsWith('ed') && w.length > 3) {
      cores.add(w.slice(0, -2));        // jumped -> jump
      cores.add(w.slice(0, -1));        // baked  -> bake
    }
    if (w.endsWith('es') && w.length > 3) cores.add(w.slice(0, -2)); // boxes -> box
    if (w.endsWith('s') && w.length > 2) cores.add(w.slice(0, -1));  // cats  -> cat
    // Collapse a doubled final consonant left over from stripping (runn -> run).
    for (const c of [...cores]) {
      if (/([^aeiou])\1$/.test(c) && c.length > 2) cores.add(c.slice(0, -1));
    }
    return cores;
  }

  // Expand a stem back into its inflected forms (-s, -es, -ed, -ing, -ies, etc.),
  // accounting for trailing 'e', trailing 'y', and doubled final consonants.
  function applySuffixes(stem) {
    const v = new Set([stem, stem + 's', stem + 'es', stem + 'ed', stem + 'd', stem + 'ing']);
    if (stem.endsWith('e')) {
      v.add(stem.slice(0, -1) + 'ing'); // make -> making
      v.add(stem.slice(0, -1) + 'ed');  // (harmless extra)
    }
    if (stem.endsWith('y')) {
      v.add(stem.slice(0, -1) + 'ies'); // study -> studies
      v.add(stem.slice(0, -1) + 'ied'); // study -> studied
    }
    if (/[^aeiou][aeiou][^aeiouwxy]$/.test(stem)) { // run -> running / runned, stop -> stopped
      const d = stem + stem.slice(-1);
      v.add(d + 'ing');
      v.add(d + 'ed');
    }
    return v;
  }

  // Replace the target word and all of its inflected variants inside a
  // definition with a blank so the answer can't leak in any form. Additionally,
  // blank any word that shares >= MIN_SHARED contiguous letters with the target
  // (two words share an N-letter run iff one contains an N-gram of the other).
  const MIN_SHARED = 5;

  function censor(text, word) {
    if (!text) return text;
    const w = word.toLowerCase();

    const variants = new Set([w]);
    for (const core of coreWords(w)) {
      for (const v of applySuffixes(core)) variants.add(v);
    }

    // Don't censor very short fragments (would blank unrelated words), but
    // always censor the original word itself.
    const tokens = [...variants]
      .filter(t => t === w || t.length >= 3)
      .sort((a, b) => b.length - a.length); // longest match first

    // All contiguous MIN_SHARED-letter substrings of the target word.
    const grams = new Set();
    for (let i = 0; i + MIN_SHARED <= w.length; i++) grams.add(w.slice(i, i + MIN_SHARED));

    let out = text;

    // 1) Blank exact variants / inflections (handles short words too).
    for (const t of tokens) {
      const re = new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      out = out.replace(re, '_____');
    }

    // 2) Blank any remaining word sharing a MIN_SHARED-letter run with the target.
    if (grams.size > 0) {
      out = out.replace(/[A-Za-z]+/g, (m) => {
        const lm = m.toLowerCase();
        for (const g of grams) if (lm.includes(g)) return '_____';
        return m;
      });
    }

    return out;
  }

  // ---- Primary: dictionaryapi.dev ----
  // Returns { meanings, audioUrl } | null. meanings may be empty (e.g. audio
  // present but no definitions); audioUrl is null when no human recording.
  async function fetchPrimary(word) {
    let res;
    try {
      res = await fetch(DICT_URL + encodeURIComponent(word));
    } catch (e) {
      return null; // network error
    }
    if (!res.ok) return null; // 404 / no entry

    let data;
    try { data = await res.json(); } catch (e) { return null; }
    if (!Array.isArray(data) || data.length === 0) return null;

    // First usable human audio recording across all entries.
    let audioUrl = null;
    for (const e of data) {
      const a = (e.phonetics || []).find(p => p.audio && p.audio.length > 0);
      if (a) { audioUrl = a.audio; break; }
    }

    const meanings = (data[0].meanings || [])
      .map(m => ({
        partOfSpeech: m.partOfSpeech,
        definitions: (m.definitions || [])
          .slice(0, MAX_DEFS_PER_POS)
          .map(d => censor(d.definition, word))
      }))
      .filter(m => m.definitions.length > 0);

    return { meanings, audioUrl };
  }

  // ---- Fallback: Datamuse (definitions only, no audio) ----
  async function fetchDatamuse(word) {
    let data;
    try {
      const res = await fetch(`${DATAMUSE_URL}?sp=${encodeURIComponent(word)}&md=d&max=1`);
      data = await res.json();
    } catch (e) {
      return [];
    }
    if (!Array.isArray(data) || data.length === 0) return [];
    const entry = data[0];
    // Only trust an exact spelling match so we don't define a different word.
    if (!entry.defs || (entry.word || '').toLowerCase() !== word.toLowerCase()) return [];

    // Group "pos\tdefinition" lines by part of speech.
    const byPos = new Map();
    for (const raw of entry.defs) {
      const [posTag, ...rest] = raw.split('\t');
      const def = rest.join('\t').trim();
      if (!def) continue;
      const pos = POS_MAP[posTag] !== undefined ? POS_MAP[posTag] : posTag;
      if (!byPos.has(pos)) byPos.set(pos, []);
      if (byPos.get(pos).length < MAX_DEFS_PER_POS) {
        byPos.get(pos).push(censor(def, word));
      }
    }
    return [...byPos.entries()].map(([partOfSpeech, definitions]) => ({ partOfSpeech, definitions }));
  }

  // Main entry: returns normalized word data or null (no definition anywhere).
  // audioUrl is the human recording when available (else null); pronunciation
  // via speech synthesis is always possible from the word text.
  async function fetchWordData(word) {
    const w = word.toLowerCase();

    const primary = await fetchPrimary(w);
    const audioUrl = primary ? primary.audioUrl : null;
    let meanings = primary && primary.meanings.length > 0 ? primary.meanings : null;

    // Definition fallback to Datamuse if the primary had no usable meanings.
    if (!meanings) {
      const dm = await fetchDatamuse(w);
      if (dm.length > 0) meanings = dm;
    }

    if (!meanings || meanings.length === 0) return null; // caller retries word

    return { word: w, meanings, audioUrl };
  }

  return { fetchWordData };
})();
