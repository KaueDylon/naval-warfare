/**
 * Sound effects service — Naval Warfare 1941
 * Uses Web Audio API to generate procedural sounds (no external audio files needed).
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Generate white noise buffer */
function createNoiseBuffer(ctx, duration) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Explosion-like sound for hits */
export function playHit() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Low-frequency boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Noise burst (impact)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.15);
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 1;
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  } catch (e) {
    console.warn('[SFX] playHit failed:', e);
  }
}

/** Water splash sound for misses */
export function playMiss() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Filtered noise (splash)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);

    // Small plop tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn('[SFX] playMiss failed:', e);
  }
}

/** Larger explosion for sinking a ship */
export function playSunk() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Deep boom
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.exponentialRampToValueAtTime(20, now + 0.6);
    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Secondary crunch
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(200, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.4);
    gain2.gain.setValueAtTime(0.3, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.4);

    // Extended noise (debris)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.8);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.8);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.8);
  } catch (e) {
    console.warn('[SFX] playSunk failed:', e);
  }
}

/** Victory fanfare */
export function playVictory() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
      gain.gain.setValueAtTime(0.3, start + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch (e) {
    console.warn('[SFX] playVictory failed:', e);
  }
}

/** Defeat/loss sound */
export function playDefeat() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const notes = [392, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4 (descending minor)
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.25;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
      gain.gain.setValueAtTime(0.25, start + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch (e) {
    console.warn('[SFX] playDefeat failed:', e);
  }
}

/** Radar ping — usado quando um oponente é encontrado/contato estabelecido */
export function playContactEstablished() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Ping principal — tom limpo e curto, característico de radar/sonar
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Eco sutil (segundo ping mais baixo, levemente depois)
    const echo = ctx.createOscillator();
    const echoGain = ctx.createGain();
    echo.type = 'sine';
    echo.frequency.setValueAtTime(900, now + 0.18);
    echoGain.gain.setValueAtTime(0.0001, now + 0.18);
    echoGain.gain.exponentialRampToValueAtTime(0.12, now + 0.2);
    echoGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    echo.connect(echoGain);
    echoGain.connect(ctx.destination);
    echo.start(now + 0.18);
    echo.stop(now + 0.55);
  } catch (e) {
    console.warn('[SFX] playContactEstablished failed:', e);
  }
}

/**
 * Clique de botão — usado em ações de decisão (confirmar, criar, entrar,
 * atacar, se render). Som curto de relé/switch mecânico, discreto o
 * suficiente para não cansar em uso repetido.
 */
export function playClick() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Estalo curto e seco (switch mecânico)
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.03);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2500;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.03);

    // Tom breve grave (corpo do clique)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
    oscGain.gain.setValueAtTime(0.06, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    console.warn('[SFX] playClick failed:', e);
  }
}


// ===================== AMBIENTE: SALA DE GUERRA =====================
// Trilha ambiente contínua para a fase de posicionamento (SetupPhase).
// Estado isolado do resto do módulo — precisa de start/stop explícitos
// porque, diferente dos efeitos pontuais, toca indefinidamente em loop.
let warRoomNodes = null; // { masterGain, drone, sub, radio, pingTimeout, morseTimeout, crackleTimeout } ou null se parado

/** Cria um drone grave contínuo com leve "beating" (duas ondas dessintonizadas). */
function createDrone(ctx, masterGain) {
  const freqBase = 55; // A1 — grave, sentido mais que ouvido
  const detune = 3; // Hz de diferença — gera o batimento tenso

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = freqBase;

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freqBase + detune;

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.09;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 220;

  osc1.connect(droneGain);
  osc2.connect(droneGain);
  droneGain.connect(lowpass);
  lowpass.connect(masterGain);

  osc1.start();
  osc2.start();

  return { osc1, osc2, droneGain };
}

/** Sub-bass quase infrassônico com LFO lento de volume — "respiração" opressiva. */
function createSubPulse(ctx, masterGain) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 38;

  const gain = ctx.createGain();
  gain.gain.value = 0.05;

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();

  // LFO manual via setInterval — sobe/desce lentamente o volume do sub
  // (evita usar outro oscillator como LFO para manter o código simples de parar)
  let phase = 0;
  const lfoInterval = setInterval(() => {
    phase += 0.05;
    const now = ctx.currentTime;
    const value = 0.03 + Math.abs(Math.sin(phase)) * 0.045;
    gain.gain.linearRampToValueAtTime(value, now + 0.5);
  }, 500);

  return { osc, gain, lfoInterval };
}

/** Ruído filtrado muito sutil de fundo — textura de estática de sala de rádio. */
function createRadioTexture(ctx, masterGain) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.4;

  const gain = ctx.createGain();
  gain.gain.value = 0.012;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start();

  return { noise, gain };
}

/** Ping grave distante — pulso tático esparso e irregular, não musical. */
function scheduleDistantPing(ctx, masterGain, scheduleNext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 1.2);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 1.5);

  // Próximo ping em 12–24s — intervalo irregular, sem pulso previsível
  const nextDelay = 12000 + Math.random() * 12000;
  return setTimeout(scheduleNext, nextDelay);
}

// Alfabeto Morse — usado para transmitir frases táticas curtas reais de vez
// em quando pelo "rádio" da sala de guerra (não é decorativo: é a codificação
// genuína das letras).
const MORSE_CODE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};

// Frases táticas curtas — mensagens plausíveis de sala de guerra, transmitidas
// em morse de verdade (codificação correta letra a letra).
const MORSE_PHRASES = [
  'HOLD POSITION',
  'ALL CLEAR',
  'STAND BY',
  'CONFIRM',
  'SECTOR SEVEN',
  'NO CONTACT',
];

/** Toca um único "dit" ou "dah" de CW (tom de rádio Morse) a partir de startTime. */
function playMorseUnit(ctx, masterGain, startTime, duration, freq) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  // Ataque/decay rápidos mas não instantâneos — evita "click" digital,
  // mantém o timbre suave de tom de rádio CW
  gain.gain.linearRampToValueAtTime(0.035, startTime + 0.008);
  gain.gain.setValueAtTime(0.035, startTime + duration - 0.008);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/**
 * Agenda a transmissão completa de uma frase em código Morse real, respeitando
 * a proporção clássica de timing (dah = 3× dit; espaço entre símbolos = 1 dit;
 * entre letras = 3 dit; entre palavras = 7 dit). Distante e discreta — tom
 * grave-médio de rádio CW, não deve soar como melodia.
 */
function scheduleMorsePhrase(ctx, masterGain, scheduleNext) {
  const phrase = MORSE_PHRASES[Math.floor(Math.random() * MORSE_PHRASES.length)];
  const unit = 0.07; // duração do "dit" em segundos — velocidade de operador experiente
  const freq = 620 + Math.random() * 60; // leve variação de tom entre transmissões

  let t = ctx.currentTime + 0.3;
  for (const char of phrase) {
    if (char === ' ') {
      t += unit * 7; // espaço entre palavras
      continue;
    }
    const code = MORSE_CODE[char];
    if (!code) continue;
    for (const symbol of code) {
      const duration = symbol === '-' ? unit * 3 : unit;
      playMorseUnit(ctx, masterGain, t, duration, freq);
      t += duration + unit; // espaço entre símbolos da mesma letra
    }
    t += unit * 2; // completa o espaço entre letras (já tinha +1 unit acima)
  }

  // Próxima transmissão em 25–50s — esparsa, não deve competir com o drone
  const nextDelay = 25000 + Math.random() * 25000;
  return setTimeout(scheduleNext, nextDelay);
}

/** Estalo curto de estática/squelch de rádio — interferência atmosférica breve. */
function playRadioCrackle(ctx, masterGain) {
  const now = ctx.currentTime;
  const duration = 0.05 + Math.random() * 0.1;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500 + Math.random() * 1500;
  filter.Q.value = 0.6;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.03 + Math.random() * 0.02, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(now);
  noise.stop(now + duration);
}

/** Agenda estalos de squelch de rádio em intervalos curtos e irregulares. */
function scheduleRadioCrackle(ctx, masterGain, scheduleNext) {
  playRadioCrackle(ctx, masterGain);
  // Às vezes vem em pequenas "rajadas" de 2-3 estalos, como ajuste de dial
  if (Math.random() < 0.35) {
    setTimeout(() => playRadioCrackle(ctx, masterGain), 90 + Math.random() * 120);
  }
  const nextDelay = 4000 + Math.random() * 9000;
  return setTimeout(scheduleNext, nextDelay);
}

/**
 * Inicia a trilha ambiente de sala de guerra tática — grave, contínua,
 * calma mas opressiva. Usada durante a fase de posicionamento de navios.
 * Idempotente: chamar novamente enquanto já está tocando não duplica.
 */
export function startWarRoomAmbience() {
  if (warRoomNodes) return; // já tocando
  try {
    const ctx = getCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2); // fade-in suave
    masterGain.connect(ctx.destination);

    const drone = createDrone(ctx, masterGain);
    const sub = createSubPulse(ctx, masterGain);
    const radio = createRadioTexture(ctx, masterGain);

    let pingTimeout = null;
    function loopPing() {
      pingTimeout = scheduleDistantPing(ctx, masterGain, loopPing);
    }
    // Primeiro ping só depois de um tempo — não anunciar logo na entrada
    pingTimeout = setTimeout(loopPing, 8000 + Math.random() * 6000);

    let morseTimeout = null;
    function loopMorse() {
      morseTimeout = scheduleMorsePhrase(ctx, masterGain, loopMorse);
    }
    // Primeira transmissão em morse só depois de um tempo maior — deixa o
    // clima se estabelecer antes de qualquer "voz" de rádio aparecer
    morseTimeout = setTimeout(loopMorse, 15000 + Math.random() * 10000);

    let crackleTimeout = null;
    function loopCrackle() {
      crackleTimeout = scheduleRadioCrackle(ctx, masterGain, loopCrackle);
    }
    crackleTimeout = setTimeout(loopCrackle, 3000 + Math.random() * 4000);

    warRoomNodes = { masterGain, drone, sub, radio, pingTimeout, morseTimeout, crackleTimeout };
  } catch (e) {
    console.warn('[SFX] startWarRoomAmbience failed:', e);
  }
}

/** Para a trilha ambiente de sala de guerra, com fade-out suave. */
export function stopWarRoomAmbience() {
  if (!warRoomNodes) return;
  const { masterGain, drone, sub, radio, pingTimeout, morseTimeout, crackleTimeout } = warRoomNodes;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    clearTimeout(pingTimeout);
    clearTimeout(morseTimeout);
    clearTimeout(crackleTimeout);
    clearInterval(sub.lfoInterval);

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 1);

    setTimeout(() => {
      try {
        drone.osc1.stop();
        drone.osc2.stop();
        sub.osc.stop();
        radio.noise.stop();
      } catch {
        // nodes já podem ter parado — ignora
      }
    }, 1100);
  } catch (e) {
    console.warn('[SFX] stopWarRoomAmbience failed:', e);
  } finally {
    warRoomNodes = null;
  }
}
