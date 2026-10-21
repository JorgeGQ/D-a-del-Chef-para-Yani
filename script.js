/**
 * OVERCOOKED ARCADE: CHEF YANI & POLLO
 * Juego secuencial de cocina con progresión coherente, notas breves y cero emojis
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ========================================================================
     1. SINTETIZADOR DE EFECTOS DE SONIDO DE COCINA (WEB AUDIO API)
     ======================================================================== */
  let audioCtx = null;

  function initAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playKitchenSound(type) {
    try {
      initAudioCtx();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(460, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'grind') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'sizzle') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(520, now + 0.11);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'locked') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'stage-clear') {
        [587.33, 880].forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          const t = now + idx * 0.08;
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.24, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          o.start(t);
          o.stop(t + 0.18);
        });
      } else if (type === 'fanfare') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          const t = now + idx * 0.09;
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.24, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          o.start(t);
          o.stop(t + 0.25);
        });
      }
    } catch {
      // Continuar silenciosamente si el navegador bloquea Web Audio
    }
  }

  /* ========================================================================
     2. REPRODUCTOR MUSICAL EN TOP BAR (TWENTY ONE PILOTS & TAYLOR SWIFT)
     ======================================================================== */
  const PLAYLIST = [
    {
      title: 'Jumpsuit',
      artist: 'Twenty One Pilots',
      tag: 'TRENCH ||-//',
      logo: '||-//',
      theme: 'trench',
      localSrc: 'audios/twenty one pilots - Jumpsuit (Official Audio).mp3',
      remoteSrc: 'https://pub-554fa68fd7184f5fb44d7e3a93650749.r2.dev/audios/audios/twenty%20one%20pilots%20-%20Jumpsuit%20(Official%20Audio).mp3'
    },
    {
      title: 'My Blood',
      artist: 'Twenty One Pilots',
      tag: 'TRENCH ||-//',
      logo: '||-//',
      theme: 'trench',
      localSrc: 'audios/Twenty One Pilots - My Blood (Audio).mp3',
      remoteSrc: 'https://pub-554fa68fd7184f5fb44d7e3a93650749.r2.dev/audios/audios/Twenty%20One%20Pilots%20-%20My%20Blood%20(Audio).mp3'
    },
    {
      title: 'Shake It Off',
      artist: 'Taylor Swift',
      tag: "1989 (TAYLOR'S VERSION)",
      logo: '1989',
      theme: 'taylor',
      localSrc: 'audios/Shake It Off (Taylors Version).mp3',
      remoteSrc: 'https://pub-554fa68fd7184f5fb44d7e3a93650749.r2.dev/audios/audios/Shake%20It%20Off%20(Taylors%20Version).mp3'
    }
  ];

  const audio = document.getElementById('audio-engine');
  const topbarPlayer = document.getElementById('topbar-player');
  const topVinyl = document.getElementById('top-vinyl');
  const vinylTag = document.getElementById('vinyl-tag');
  const playIcon = document.getElementById('play-icon');
  const btnPrev = document.getElementById('btn-prev');
  const btnPlay = document.getElementById('btn-play');
  const btnNext = document.getElementById('btn-next');
  const songTitleEl = document.getElementById('top-song-title');
  const songArtistEl = document.getElementById('top-song-artist');
  const songTagEl = document.getElementById('top-song-tag');
  const topEq = document.getElementById('top-eq');
  const seekBar = document.getElementById('track-seek-bar');
  const seekFill = document.getElementById('track-seek-fill');
  const quickChips = document.querySelectorAll('.q-chip');

  let currentTrackIdx = 0;
  let isPlaying = false;
  let usedRemoteFallback = false;

  function setPlayerUi(playing) {
    isPlaying = playing;
    topVinyl.classList.toggle('playing', playing);
    topEq.classList.toggle('playing', playing);
    if (playIcon) {
      playIcon.innerHTML = playing
        ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
        : '<polygon points="7,4 19,12 7,20"/>';
    }
  }

  function loadTrack(idx, autoPlay = false) {
    currentTrackIdx = (idx + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[currentTrackIdx];
    usedRemoteFallback = false;

    songTitleEl.textContent = track.title;
    songArtistEl.textContent = track.artist;
    songTagEl.textContent = track.tag;
    vinylTag.textContent = track.logo;
    seekFill.style.width = '0%';

    topbarPlayer.classList.toggle('theme-taylor', track.theme === 'taylor');

    quickChips.forEach((chip, i) => {
      chip.classList.toggle('active', i === currentTrackIdx);
    });

    audio.src = encodeURI(track.localSrc);
    audio.load();

    if (autoPlay) {
      playSong();
    } else {
      setPlayerUi(false);
    }
  }

  function playSong() {
    initAudioCtx();
    audio.play().then(() => {
      setPlayerUi(true);
    }).catch(() => {
      const track = PLAYLIST[currentTrackIdx];
      if (!usedRemoteFallback && track.remoteSrc) {
        usedRemoteFallback = true;
        audio.src = track.remoteSrc;
        audio.load();
        audio.play().then(() => setPlayerUi(true)).catch(() => setPlayerUi(false));
      } else {
        setPlayerUi(false);
      }
    });
  }

  function pauseSong() {
    audio.pause();
    setPlayerUi(false);
  }

  btnPlay.addEventListener('click', () => {
    if (audio.paused) playSong(); else pauseSong();
  });

  btnPrev.addEventListener('click', () => loadTrack(currentTrackIdx - 1, true));
  btnNext.addEventListener('click', () => loadTrack(currentTrackIdx + 1, true));

  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const idx = parseInt(chip.getAttribute('data-idx'), 10);
      if (idx === currentTrackIdx) {
        if (audio.paused) playSong(); else pauseSong();
      } else {
        loadTrack(idx, true);
      }
    });
  });

  audio.addEventListener('timeupdate', () => {
    if (audio.duration && Number.isFinite(audio.duration)) {
      const pct = Math.min(100, (audio.currentTime / audio.duration) * 100);
      seekFill.style.width = `${pct}%`;
    }
  });

  if (seekBar) {
    seekBar.addEventListener('click', (e) => {
      if (!audio.duration || !Number.isFinite(audio.duration)) return;
      const rect = seekBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * audio.duration;
    });
  }

  audio.addEventListener('ended', () => loadTrack(currentTrackIdx + 1, true));

  audio.addEventListener('error', () => {
    const track = PLAYLIST[currentTrackIdx];
    if (!usedRemoteFallback && track && track.remoteSrc) {
      usedRemoteFallback = true;
      audio.src = track.remoteSrc;
      audio.load();
      if (isPlaying) audio.play().catch(() => setPlayerUi(false));
    }
  });

  loadTrack(0, false);

  /* ========================================================================
     3. LÓGICA DEL JUEGO DE COCINA POR ETAPAS COHERENTES
     ======================================================================== */
  let score = 0;
  let dishesDone = 0;
  let currentStage = 1; // 1: Despensa, 2: Metate, 3: Cazuela, 4: El Pase
  let chopsDone = 0;
  const chopsNeeded = 5;
  let cooksDone = 0;
  const cooksNeeded = 5;
  const collectedIngredients = new Set();

  // Elementos del HUD y Comanda
  const hudScoreEl = document.getElementById('hud-score');
  const dishesDoneCount = document.getElementById('dishes-done-count');
  const ticketOrderNum = document.getElementById('ticket-order-num');
  const ticketStatusText = document.getElementById('ticket-status-text');
  const dishStageDesc = document.getElementById('dish-stage-description');
  const whisperSpeaker = document.getElementById('whisper-speaker');
  const whisperText = document.getElementById('whisper-text');
  const dishBarFill = document.getElementById('dish-bar-fill');
  const dishStepText = document.getElementById('dish-step-text');
  const cazuelaStateTag = document.getElementById('cazuela-state-tag');

  // Capas coherentes de la cazuela en vivo
  const layerRaw = document.getElementById('dish-layer-raw');
  const previewChiles = document.getElementById('preview-ing-chiles');
  const previewCacao = document.getElementById('preview-ing-cacao');
  const previewCaldo = document.getElementById('preview-ing-caldo');
  const layerPaste = document.getElementById('dish-layer-paste');
  const layerSimmer = document.getElementById('dish-layer-simmer');
  const layerFinal = document.getElementById('dish-layer-final');

  // Checklist de la receta
  const chk1 = document.getElementById('chk-1');
  const chk2 = document.getElementById('chk-2');
  const chk3 = document.getElementById('chk-3');
  const chk4 = document.getElementById('chk-4');

  // Stepper lineal
  const pill1 = document.getElementById('step-pill-1');
  const pill2 = document.getElementById('step-pill-2');
  const pill3 = document.getElementById('step-pill-3');
  const pill4 = document.getElementById('step-pill-4');
  const conn1 = document.getElementById('conn-1');
  const conn2 = document.getElementById('conn-2');
  const conn3 = document.getElementById('conn-3');

  // Estaciones
  const stationPantry = document.getElementById('station-pantry');
  const stationCutting = document.getElementById('station-cutting');
  const stationStove = document.getElementById('station-stove');
  const stationDelivery = document.getElementById('station-delivery');

  const badgePantry = document.getElementById('badge-pantry');
  const badgeCutting = document.getElementById('badge-cutting');
  const badgeStove = document.getElementById('badge-stove');
  const badgeDelivery = document.getElementById('badge-delivery');

  // Controles de Estación 2 (Metate)
  const cuttingBoard = document.getElementById('cutting-board');
  const btnChopAction = document.getElementById('btn-chop-action');
  const chopLabel = document.getElementById('chop-label');
  const chopBtnBadge = document.getElementById('chop-btn-badge');
  const chopCounter = document.getElementById('chop-counter');
  const chopStatusNote = document.getElementById('chop-status-note');
  const cutMeterFill = document.getElementById('cut-meter-fill');
  const cutFeedback = document.getElementById('cut-feedback');
  const knifeArm = document.getElementById('knife-arm');
  const pasteSpread = document.getElementById('paste-spread');

  // Controles de Estación 3 (Cazuela)
  const stoveUnit = document.getElementById('stove-unit');
  const btnCookAction = document.getElementById('btn-cook-action');
  const cookLabel = document.getElementById('cook-label');
  const cookBtnBadge = document.getElementById('cook-btn-badge');
  const cookCounter = document.getElementById('cook-counter');
  const cookStatusNote = document.getElementById('cook-status-note');
  const stoveMeterFill = document.getElementById('stove-meter-fill');
  const cookFeedback = document.getElementById('cook-feedback');
  const panFood = document.getElementById('pan-food-simmer');
  const simmerBubbles = document.getElementById('simmer-bubbles');
  const woodenSpoon = document.getElementById('wooden-spoon');

  // Controles de Estación 4 (El Pase)
  const deliveryZone = document.getElementById('delivery-zone');
  const btnDeliverAction = document.getElementById('btn-deliver-action');
  const deliverLabel = document.getElementById('deliver-label');
  const deliverBtnBadge = document.getElementById('deliver-btn-badge');
  const deliveryDome = document.getElementById('delivery-bell-dome');
  const deliveryMsg = document.getElementById('delivery-msg');
  const passMeterFill = document.getElementById('pass-meter-fill');
  const passFeedback = document.getElementById('pass-feedback');

  // Modal de victoria
  const servedPopup = document.getElementById('served-popup');
  const popupRibbonText = document.getElementById('popup-ribbon-text');
  const popupDishTitle = document.getElementById('popup-dish-title');
  const popupCongratsText = document.getElementById('popup-congrats-text');
  const popupQuoteNote = document.getElementById('popup-quote-note');
  const btnPopupOk = document.getElementById('btn-popup-ok');

  // Notas breves y creativas para cada ingrediente en Etapa 1
  const INGREDIENT_NOTES = {
    chiles: {
      speaker: 'CHEF YANI:',
      text: 'Chiles mulato y ancho listos. Pasados por el comal dan color oscuro sin amargar.',
      preview: previewChiles
    },
    cacao: {
      speaker: 'POLLO:',
      text: 'Cacao de mesa y canela en rama. El toque exacto para que huela a hogar.',
      preview: previewCacao
    },
    caldo: {
      speaker: 'CHEF YANI:',
      text: 'Ajonjolí dorado y buen fondo de pollo. Ya tenemos la base completa.',
      preview: previewCaldo
    }
  };

  // Notas progresivas en Etapa 2 (Metate)
  const GRIND_NOTES = [
    'Quebrando los chiles secos sobre la piedra...',
    'Integrando la canela en rama con las semillas...',
    'Fundiendo el cacao con el calor del metate...',
    'Afinando la molienda para no dejar grumos...',
    'Pasta de mole tersa, aromática y en su punto.'
  ];

  // Notas progresivas en Etapa 3 (Cazuela)
  const SIMMER_NOTES = [
    'Deshaciendo la pasta de mole en el caldo caliente...',
    'Moviendo con la pala de madera en círculos...',
    'El chocolate empieza a soltar su brillo en el barro...',
    'Fuego lento constante hasta lograr espesor...',
    'Sazón impecable de la Chef Yani.'
  ];

  // Mensajes de celebración variados por ronda servida
  const ORDER_REWARDS = [
    {
      ribbon: 'COMANDA #01 ENTREGADA',
      title: 'Mole Clásico de Tres Estrellas',
      text: 'Espeso, brillante y en su punto. Ya sabemos cocinar tinga y mole; oficialmente estamos listos para abrir el restaurante y evadir impuestos. juasjuas',
      quote: 'Feliz Día de la Chef, Yani. Qué orgullo ver el talento que tienes en las manos. — Pollo'
    },
    {
      ribbon: 'COMANDA #02 ENTREGADA',
      title: 'Especialidad de la Casa',
      text: 'Ni un solo grumo en la cazuela. Pollo ya aprobó el control de calidad (se comió media porción antes de tocar la campana).',
      quote: 'Cocinar contigo hace que cualquier receta salga mejor. Feliz día, mi Chef favorita.'
    },
    {
      ribbon: 'TURNO COMPLETADO · 3 DE 3',
      title: 'Restaurante Yani & Pollo Inaugurado',
      text: 'Tres cazuelas perfectas en tiempo récord. El menú secreto está listo, la música suena bien y nuestra sociedad es invencible.',
      quote: 'Feliz Día de la Chef, Yani. Mi lugar favorito siempre va a ser donde estés cocinando tú.'
    }
  ];

  function updateWhisper(speaker, text) {
    whisperSpeaker.textContent = speaker;
    whisperText.textContent = text;
  }

  function addScore(pts) {
    score += pts;
    hudScoreEl.textContent = '$' + score.toLocaleString('es-MX');
    hudScoreEl.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.18)' },
      { transform: 'scale(1)' }
    ], { duration: 240 });
  }

  function scrollStationIntoViewIfMobile(stationEl) {
    if (window.innerWidth <= 760 && stationEl) {
      setTimeout(() => {
        stationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 180);
    }
  }

  // Aviso coherente si el usuario toca una estación que aún no corresponde
  [stationPantry, stationCutting, stationStove, stationDelivery].forEach(st => {
    st.addEventListener('click', (e) => {
      const stageNum = parseInt(st.getAttribute('data-stage'), 10);
      if (stageNum !== currentStage) {
        // Evitar disparar si ya fue completada sin problema, solo aclarar el paso actual
        playKitchenSound('locked');
        st.classList.remove('shake-locked');
        void st.offsetWidth;
        st.classList.add('shake-locked');

        const stageNames = {
          1: 'la Estación 1 (Despensa)',
          2: 'la Estación 2 (Metate)',
          3: 'la Estación 3 (Cazuela)',
          4: 'la Estación 4 (El Pase)'
        };
        updateWhisper(
          'ORDEN DE COCINA:',
          `Completa primero ${stageNames[currentStage]} para seguir el orden de la receta.`
        );
        e.stopPropagation();
      }
    });
  });

  function advanceStage(newStage) {
    currentStage = newStage;
    playKitchenSound('stage-clear');

    if (newStage === 2) {
      // Cerrar Etapa 1
      stationPantry.classList.remove('active-focus');
      stationPantry.classList.add('completed-step');
      badgePantry.textContent = 'COMPLETADA';
      pill1.className = 'step-pill done';
      conn1.classList.add('done');
      chk1.className = 'chk-item done';

      // Abrir Etapa 2
      stationCutting.classList.remove('stage-locked');
      stationCutting.classList.add('active-focus');
      badgeCutting.textContent = 'ACTIVA';
      pill2.className = 'step-pill active';
      chk2.className = 'chk-item current';

      btnChopAction.disabled = false;
      chopBtnBadge.textContent = 'TOCAR 5 VECES';
      chopStatusNote.textContent = 'Presiona el botón o la piedra para moler';
      cutFeedback.textContent = 'A MOLER';
      document.getElementById('cutting-items-visual').style.opacity = '1';

      ticketStatusText.textContent = 'PASO 2 · METATE';
      dishStageDesc.textContent = 'Los chiles, el cacao y el ajonjolí ya están tostados. Muélelos en piedra hasta obtener una pasta uniforme.';
      updateWhisper('POLLO:', 'Fuerza en la muñeca. Si nos queda terso, el restaurante se paga solo.');
      dishBarFill.style.width = '32%';
      dishStepText.textContent = 'PASO 2 DE 4';
      cazuelaStateTag.textContent = 'BASE TOSTADA';

      scrollStationIntoViewIfMobile(stationCutting);

    } else if (newStage === 3) {
      // Cerrar Etapa 2
      stationCutting.classList.remove('active-focus');
      stationCutting.classList.add('completed-step');
      badgeCutting.textContent = 'COMPLETADA';
      pill2.className = 'step-pill done';
      conn2.classList.add('done');
      chk2.className = 'chk-item done';

      // Transición visual coherente en la cazuela: ingredientes -> pasta molida
      layerRaw.classList.remove('visible');
      layerPaste.classList.add('visible');
      cazuelaStateTag.textContent = 'PASTA EN CAZUELA';

      // Abrir Etapa 3
      stationStove.classList.remove('stage-locked');
      stationStove.classList.add('active-focus');
      badgeStove.textContent = 'ACTIVA';
      pill3.className = 'step-pill active';
      chk3.className = 'chk-item current';

      btnCookAction.disabled = false;
      cookBtnBadge.textContent = 'MOVER 5 VECES';
      cookStatusNote.textContent = 'Mueve la pala de madera para espesar';
      cookFeedback.textContent = 'EN EL FUEGO';
      panFood.style.opacity = '1';
      simmerBubbles.style.opacity = '1';

      ticketStatusText.textContent = 'PASO 3 · CAZUELA';
      dishStageDesc.textContent = 'La pasta ya está en la cazuela de barro. Mueve con la pala de madera a fuego lento para que espese y brille.';
      updateWhisper('CHEF YANI:', 'El secreto del mole es no dejar de mover para que el cacao y el chile se fundan.');
      dishBarFill.style.width = '68%';
      dishStepText.textContent = 'PASO 3 DE 4';

      scrollStationIntoViewIfMobile(stationStove);

    } else if (newStage === 4) {
      // Cerrar Etapa 3
      stationStove.classList.remove('active-focus');
      stationStove.classList.add('completed-step');
      badgeStove.textContent = 'COMPLETADA';
      pill3.className = 'step-pill done';
      conn3.classList.add('done');
      chk3.className = 'chk-item done';

      // Transición visual coherente: mole hirviendo -> plato emplatado con arroz, pollo y ajonjolí
      layerPaste.classList.remove('visible');
      layerSimmer.classList.remove('visible');
      layerFinal.classList.add('visible');
      cazuelaStateTag.textContent = 'LISTA PARA SERVIR';

      // Abrir Etapa 4
      stationDelivery.classList.remove('stage-locked');
      stationDelivery.classList.add('active-focus');
      badgeDelivery.textContent = 'ACTIVA';
      pill4.className = 'step-pill active';
      chk4.className = 'chk-item current';

      btnDeliverAction.disabled = false;
      deliverBtnBadge.textContent = 'CAMPANA';
      passMeterFill.style.width = '100%';
      passFeedback.textContent = 'ORDEN LISTA';
      deliveryMsg.textContent = 'Mole coronado con ajonjolí. Toca la campana.';

      ticketStatusText.textContent = 'PASO 4 · EL PASE';
      dishStageDesc.textContent = 'Cazuela servida con arroz rojo, pieza de pollo bañada en mole y lluvia de ajonjolí. Toca la campana para entregar.';
      updateWhisper('POLLO:', 'Plato limpio y olor increíble. Toca la campana que esa mesa ya tiene hambre.');
      dishBarFill.style.width = '92%';
      dishStepText.textContent = 'PASO 4 DE 4';

      scrollStationIntoViewIfMobile(stationDelivery);
    }
  }

  // ==================== ETAPA 1: SELECCIÓN DE INGREDIENTES ====================
  layerRaw.classList.add('visible');

  document.querySelectorAll('.ingredient-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentStage !== 1) return;

      const ing = card.getAttribute('data-ing');
      if (collectedIngredients.has(ing)) return;

      collectedIngredients.add(ing);
      card.classList.add('used');
      card.querySelector('.ing-status').textContent = 'LISTO';
      playKitchenSound('select');
      spawnParticlesAt(card, ['#c0392b', '#e67e22', '#f1c40f']);

      const info = INGREDIENT_NOTES[ing];
      if (info) {
        updateWhisper(info.speaker, info.text);
        if (info.preview) info.preview.classList.add('visible');
      }

      const count = collectedIngredients.size;
      cazuelaStateTag.textContent = `INGREDIENTES ${count}/3`;
      dishBarFill.style.width = `${8 + count * 7}%`;

      if (count === 3) {
        setTimeout(() => advanceStage(2), 260);
      }
    });
  });

  // ==================== ETAPA 2: MOLIENDA EN PIEDRA DE METATE ====================
  function doChop(e) {
    if (e) e.stopPropagation();
    if (currentStage !== 2) return;
    if (chopsDone >= chopsNeeded) return;

    chopsDone++;
    playKitchenSound('grind');
    chopCounter.textContent = `${chopsDone}/${chopsNeeded}`;
    cutMeterFill.style.width = `${(chopsDone / chopsNeeded) * 100}%`;
    chopStatusNote.textContent = GRIND_NOTES[chopsDone - 1];
    updateWhisper('EN EL METATE:', GRIND_NOTES[chopsDone - 1]);

    // Animar la mano del metate (metlapil) y expandir la pasta
    knifeArm.animate([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(0, 10px) scaleX(1.03)' },
      { transform: 'translate(0, -5px)' },
      { transform: 'translate(0, 0)' }
    ], { duration: 150 });

    if (pasteSpread) {
      const rx = 36 + chopsDone * 3;
      const ry = 16 + chopsDone * 1.4;
      pasteSpread.setAttribute('rx', String(rx));
      pasteSpread.setAttribute('ry', String(ry));
    }

    dishBarFill.style.width = `${32 + chopsDone * 6}%`;
    spawnParticlesAt(cuttingBoard, ['#4e342e', '#922b21', '#d35400']);

    if (chopsDone === chopsNeeded) {
      btnChopAction.disabled = true;
      chopLabel.textContent = 'Pasta Lista';
      chopBtnBadge.textContent = '5/5';
      cutFeedback.textContent = 'BIEN MOLIDO';
      setTimeout(() => advanceStage(3), 240);
    }
  }

  btnChopAction.addEventListener('click', doChop);
  cuttingBoard.addEventListener('click', doChop);

  // ==================== ETAPA 3: SAZÓN EN CAZUELA DE BARRO ====================
  function doCook(e) {
    if (e) e.stopPropagation();
    if (currentStage !== 3) return;
    if (cooksDone >= cooksNeeded) return;

    cooksDone++;
    playKitchenSound('sizzle');
    cookCounter.textContent = `${cooksDone}/${cooksNeeded}`;
    stoveMeterFill.style.width = `${(cooksDone / cooksNeeded) * 100}%`;
    cookStatusNote.textContent = SIMMER_NOTES[cooksDone - 1];
    updateWhisper('EN EL FUEGO:', SIMMER_NOTES[cooksDone - 1]);

    // En el primer movimiento pasamos la vista de la cazuela a hervor vivo
    if (cooksDone === 1) {
      layerPaste.classList.remove('visible');
      layerSimmer.classList.add('visible');
      cazuelaStateTag.textContent = 'HIRVIENDO A FUEGO LENTO';
    }

    // Animar pala de madera moviendo en círculo
    woodenSpoon.animate([
      { transform: 'rotate(0deg) translate(0, 0)' },
      { transform: 'rotate(-14deg) translate(-8px, 3px)' },
      { transform: 'rotate(10deg) translate(6px, -2px)' },
      { transform: 'rotate(0deg) translate(0, 0)' }
    ], { duration: 180 });

    dishBarFill.style.width = `${68 + cooksDone * 4.5}%`;
    spawnParticlesAt(stoveUnit, ['#e74c3c', '#f1c40f', '#4e342e']);

    if (cooksDone === cooksNeeded) {
      btnCookAction.disabled = true;
      cookLabel.textContent = 'Mole en su Punto';
      cookBtnBadge.textContent = '5/5';
      cookFeedback.textContent = 'PUNTO EXACTO';
      setTimeout(() => advanceStage(4), 240);
    }
  }

  btnCookAction.addEventListener('click', doCook);
  stoveUnit.addEventListener('click', doCook);

  // ==================== ETAPA 4: CAMPANA Y ENTREGA EN EL PASE ====================
  function doDeliver(e) {
    if (e) e.stopPropagation();
    if (currentStage !== 4) return;

    btnDeliverAction.disabled = true;
    playKitchenSound('fanfare');

    const rewardIdx = Math.min(dishesDone, ORDER_REWARDS.length - 1);
    const reward = ORDER_REWARDS[rewardIdx];

    dishesDone++;
    dishesDoneCount.textContent = Math.min(dishesDone, 3);

    const pDot = document.getElementById(`p-dot-${dishesDone - 1}`);
    if (pDot) pDot.classList.add('done');

    pill4.className = 'step-pill done';
    chk4.className = 'chk-item done';
    stationDelivery.classList.remove('active-focus');
    stationDelivery.classList.add('completed-step');
    badgeDelivery.textContent = 'SERVIDA';
    deliverLabel.textContent = 'Orden Servida';
    deliverBtnBadge.textContent = 'OK';
    dishBarFill.style.width = '100%';

    deliveryDome.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-16px)' },
      { transform: 'translateY(0)' }
    ], { duration: 300 });

    addScore(50000);
    spawnVictoryBurst();

    popupRibbonText.textContent = reward.ribbon;
    popupDishTitle.textContent = reward.title;
    popupCongratsText.textContent = reward.text;
    popupQuoteNote.textContent = reward.quote;

    servedPopup.classList.remove('hidden');
  }

  btnDeliverAction.addEventListener('click', doDeliver);
  deliveryZone.addEventListener('click', doDeliver);

  btnPopupOk.addEventListener('click', () => {
    servedPopup.classList.add('hidden');
    resetNextRound();
  });

  function resetNextRound() {
    currentStage = 1;
    chopsDone = 0;
    cooksDone = 0;
    collectedIngredients.clear();

    const nextOrderNum = String(dishesDone + 1).padStart(2, '0');
    ticketOrderNum.textContent = `COMANDA #${nextOrderNum}`;
    ticketStatusText.textContent = 'PASO 1 · DESPENSA';
    dishStageDesc.textContent = 'Un buen mole empieza por elegir bien la base. Reúne los tres ingredientes de la despensa para encender el comal.';
    updateWhisper('NOTA DE COCINA:', 'Selecciona los 3 ingredientes de la Estación 1 para iniciar la siguiente cazuela.');
    dishBarFill.style.width = '8%';
    dishStepText.textContent = 'PASO 1 DE 4';
    cazuelaStateTag.textContent = 'CAZUELA VACÍA';

    // Reiniciar capas de la cazuela
    layerRaw.classList.add('visible');
    previewChiles.classList.remove('visible');
    previewCacao.classList.remove('visible');
    previewCaldo.classList.remove('visible');
    layerPaste.classList.remove('visible');
    layerSimmer.classList.remove('visible');
    layerFinal.classList.remove('visible');

    // Reiniciar checklist
    chk1.className = 'chk-item current';
    chk2.className = 'chk-item';
    chk3.className = 'chk-item';
    chk4.className = 'chk-item';

    // Reiniciar stepper
    pill1.className = 'step-pill active';
    pill2.className = 'step-pill locked';
    pill3.className = 'step-pill locked';
    pill4.className = 'step-pill locked';
    conn1.classList.remove('done');
    conn2.classList.remove('done');
    conn3.classList.remove('done');

    // Reiniciar estaciones
    stationPantry.className = 'station-island island-pantry active-focus';
    stationCutting.className = 'station-island island-cutting stage-locked';
    stationStove.className = 'station-island island-stove stage-locked';
    stationDelivery.className = 'station-island island-delivery stage-locked';

    badgePantry.textContent = 'ACTIVA';
    badgeCutting.textContent = 'EN ESPERA';
    badgeStove.textContent = 'EN ESPERA';
    badgeDelivery.textContent = 'EN ESPERA';

    document.querySelectorAll('.ingredient-card').forEach(c => {
      c.classList.remove('used');
      c.querySelector('.ing-status').textContent = 'ELEGIR';
    });

    chopLabel.textContent = 'Moler en Piedra';
    chopBtnBadge.textContent = 'PASO 2';
    chopCounter.textContent = '0/5';
    chopStatusNote.textContent = 'Esperando ingredientes...';
    cutMeterFill.style.width = '0%';
    cutFeedback.textContent = 'PIEDRA LISTA';
    btnChopAction.disabled = true;
    document.getElementById('cutting-items-visual').style.opacity = '0.2';
    if (pasteSpread) {
      pasteSpread.setAttribute('rx', '36');
      pasteSpread.setAttribute('ry', '16');
    }

    cookLabel.textContent = 'Mover la Cazuela';
    cookBtnBadge.textContent = 'PASO 3';
    cookCounter.textContent = '0/5';
    cookStatusNote.textContent = 'Esperando molienda...';
    stoveMeterFill.style.width = '0%';
    cookFeedback.textContent = 'FUEGO LENTO';
    btnCookAction.disabled = true;
    panFood.style.opacity = '0.25';
    simmerBubbles.style.opacity = '0';

    deliverLabel.textContent = 'Servir Cazuela';
    deliverBtnBadge.textContent = 'PASO 4';
    btnDeliverAction.disabled = true;
    passMeterFill.style.width = '0%';
    passFeedback.textContent = 'VENTANA LISTA';
    deliveryMsg.textContent = 'Esperando cazuela terminada...';

    scrollStationIntoViewIfMobile(stationPantry);
  }

  /* ========================================================================
     4. SISTEMA DE PARTÍCULAS GEOMÉTRICAS EN CANVAS (CERO EMOJIS)
     ======================================================================== */
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function spawnParticlesAt(el, colors) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        alpha: 1,
        decay: 0.045
      });
    }
    if (!animId) animateCanvas();
  }

  function spawnVictoryBurst() {
    const colors = ['#f1c40f', '#e67e22', '#2ecc71', '#c0392b', '#4e342e'];
    for (let i = 0; i < 85; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4.5,
        vy: 2.2 + Math.random() * 4.5,
        size: 6 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: 'rect',
        alpha: 1,
        decay: 0.008
      });
    }
    if (!animId) animateCanvas();
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    });

    particles = particles.filter(p => p.alpha > 0);

    if (particles.length > 0) {
      animId = requestAnimationFrame(animateCanvas);
    } else {
      animId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

});
