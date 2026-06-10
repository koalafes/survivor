(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    levelText: document.getElementById("levelText"),
    xpText: document.getElementById("xpText"),
    xpFill: document.getElementById("xpFill"),
    healthText: document.getElementById("healthText"),
    healthFill: document.getElementById("healthFill"),
    weaponText: document.getElementById("weaponText"),
    timeText: document.getElementById("timeText"),
    killText: document.getElementById("killText"),
    goldText: document.getElementById("goldText"),
    abilityBar: document.getElementById("abilityBar"),
    pauseButton: document.getElementById("pauseButton"),
    languageButton: document.getElementById("languageButton"),
    languageJa: document.getElementById("languageJa"),
    languageEn: document.getElementById("languageEn"),
    touchControls: document.getElementById("touchControls"),
    joystickBase: document.getElementById("joystickBase"),
    joystickKnob: document.getElementById("joystickKnob"),
    upgradeOverlay: document.getElementById("upgradeOverlay"),
    upgradeEyebrow: document.getElementById("upgradeEyebrow"),
    upgradeTitle: document.getElementById("upgradeTitle"),
    upgradeCards: document.getElementById("upgradeCards"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    pauseEyebrow: document.getElementById("pauseEyebrow"),
    pauseTitle: document.getElementById("pauseTitle"),
    resumeButton: document.getElementById("resumeButton"),
    gameOverOverlay: document.getElementById("gameOverOverlay"),
    resultEyebrow: document.getElementById("resultEyebrow"),
    resultTitle: document.getElementById("resultTitle"),
    resultStats: document.getElementById("resultStats"),
    restartButton: document.getElementById("restartButton"),
  };

  const TAU = Math.PI * 2;
  const keys = new Set();
  const pointer = {
    id: null,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    stickX: 0,
    stickY: 0,
    active: false,
    mode: "target",
  };
  const stickRadius = 54;

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let viewWidth = 0;
  let viewHeight = 0;
  let lastFrame = performance.now();
  let backgroundStars = [];
  let state = createState();
  let language = getInitialLanguage();

  const i18n = {
    en: {
      pageTitle: "Nightfall Survivors",
      canvasAria: "Nightfall Survivors game field",
      abilityAria: "Current abilities",
      switchLanguage: "Switch language to Japanese",
      pause: "Pause",
      resume: "Resume",
      retry: "Retry",
      paused: "Paused",
      pauseEyebrow: "Nightfall",
      levelUp: "Level Up",
      choosePower: "Choose Power",
      level: "Level {level}",
      levelShort: "Lv {level}",
      upgradeLevel: "Lv {current} -> {next}",
      upgradeLevelMax: "Lv {current} -> {next} / {max}",
      damageUnit: "{value} dmg",
      kills: "{value} KOs",
      gold: "{value} gold",
      resultEyebrow: "Run Complete",
      resultOverrun: "Overrun",
      resultNightHolds: "Night Holds",
      elite: "Elite",
      nightLord: "Night Lord",
      bossDown: "Boss Down",
      abilities: {
        wand: "Wand",
        sickle: "Sickle",
        ward: "Ward",
        magnet: "Magnet",
        pierce: "Pierce",
      },
    },
    ja: {
      pageTitle: "ナイトフォール・サバイバーズ",
      canvasAria: "ナイトフォール・サバイバーズのゲーム画面",
      abilityAria: "現在のアビリティ",
      switchLanguage: "英語に切り替え",
      pause: "一時停止",
      resume: "再開",
      retry: "リトライ",
      paused: "一時停止",
      pauseEyebrow: "ナイトフォール",
      levelUp: "レベルアップ",
      choosePower: "強化を選択",
      level: "レベル {level}",
      levelShort: "Lv {level}",
      upgradeLevel: "Lv {current} → {next}",
      upgradeLevelMax: "Lv {current} → {next} / {max}",
      damageUnit: "攻撃 {value}",
      kills: "{value} 撃破",
      gold: "金貨 {value}",
      resultEyebrow: "リザルト",
      resultOverrun: "制圧された",
      resultNightHolds: "夜はまだ終わらない",
      elite: "エリート",
      nightLord: "夜の王",
      bossDown: "ボス撃破",
      abilities: {
        wand: "杖",
        sickle: "鎌",
        ward: "結界",
        magnet: "磁石",
        pierce: "貫通",
      },
    },
  };

  const upgrades = [
    {
      id: "tempo",
      name: "Quickened Wand",
      badge: "Wand",
      text: "Shorter spell rhythm and tighter volleys.",
      jaName: "速射の杖",
      jaBadge: "杖",
      jaText: "魔弾の間隔が短くなり、連射が安定する。",
      color: "#88c7ff",
      apply: (game) => {
        game.stats.fireRate += 0.22;
        game.cooldowns.wand = Math.min(game.cooldowns.wand, 0.14);
      },
    },
    {
      id: "thorn",
      name: "Silver Thorn",
      badge: "Damage",
      text: "Every bolt lands with more bite.",
      jaName: "銀の棘",
      jaBadge: "攻撃",
      jaText: "魔弾の威力が上がる。",
      color: "#f3c45b",
      apply: (game) => {
        game.stats.damage += 4;
      },
    },
    {
      id: "boots",
      name: "Fleet Boots",
      badge: "Move",
      text: "More space between you and the swarm.",
      jaName: "疾風のブーツ",
      jaBadge: "移動",
      jaText: "群れとの距離を取りやすくなる。",
      color: "#43e0b7",
      apply: (game) => {
        game.stats.speed += 18;
      },
    },
    {
      id: "magnet",
      name: "Magnet Stone",
      badge: "Gather",
      text: "Loose shards wake up from farther away.",
      jaName: "磁力石",
      jaBadge: "回収",
      jaText: "欠片が遠くから引き寄せられる。",
      color: "#ff5f86",
      apply: (game) => {
        game.stats.magnet += 42;
      },
    },
    {
      id: "pact",
      name: "Blood Pact",
      badge: "Vital",
      text: "A larger health pool with an instant mend.",
      jaName: "血の契約",
      jaBadge: "体力",
      jaText: "最大体力が増え、すぐに少し回復する。",
      color: "#ff6b5f",
      apply: (game) => {
        game.player.maxHealth += 18;
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 28);
      },
    },
    {
      id: "pierce",
      name: "Piercing Hex",
      badge: "Pierce",
      text: "Bolts keep cutting through the pack.",
      jaName: "貫通の呪い",
      jaBadge: "貫通",
      jaText: "魔弾が敵の群れを突き抜ける。",
      color: "#d7a7ff",
      apply: (game) => {
        game.stats.pierce += 1;
      },
    },
    {
      id: "sickle",
      name: "Moon Sickle",
      badge: "Orbit",
      text: "A blade circles close and clips anything greedy.",
      jaName: "月の鎌",
      jaBadge: "旋回",
      jaText: "刃が周囲を回り、近づいた敵を斬る。",
      color: "#f4f2e8",
      maxLevel: 5,
      max: (game) => (game.upgradeLevels.sickle || 0) < 5,
      apply: (game) => {
        game.stats.orbitals += 1;
      },
    },
    {
      id: "ward",
      name: "Sun Ward",
      badge: "Pulse",
      text: "A brighter ward burns nearby crowds faster and shoves them back.",
      jaName: "太陽の結界",
      jaBadge: "波動",
      jaText: "結界の波動が強まり、群れを押し返しながら焼く。",
      color: "#ffd56d",
      apply: (game) => {
        game.stats.auraDamage += 5;
        game.stats.auraRadius += 11;
        game.stats.auraInterval = Math.max(1.1, game.stats.auraInterval - 0.2);
        game.stats.auraKnockback += 8;
        game.cooldowns.aura = Math.min(game.cooldowns.aura, 0.18);
      },
    },
    {
      id: "sigil",
      name: "Wide Sigil",
      badge: "Area",
      text: "Bolts, blades, and wards take up more room.",
      jaName: "拡張の印",
      jaBadge: "範囲",
      jaText: "弾、刃、結界の範囲が広がる。",
      color: "#9df1cf",
      apply: (game) => {
        game.stats.area += 0.14;
      },
    },
  ];

  function createState() {
    return {
      mode: "running",
      time: 0,
      kills: 0,
      gold: 0,
      level: 1,
      xp: 0,
      xpToNext: 18,
      levelQueue: 0,
      upgradeLevels: {},
      upgradeChoices: [],
      enemies: [],
      projectiles: [],
      gems: [],
      particles: [],
      floaters: [],
      pickups: [],
      spawnTimer: 0.85,
      eliteTimer: 19,
      bossSpawned: false,
      shake: 0,
      flash: 0,
      player: {
        x: 0,
        y: 0,
        radius: 18,
        health: 110,
        maxHealth: 110,
        hurtCooldown: 1.2,
        facing: 1,
        bob: 0,
      },
      stats: {
        speed: 205,
        fireRate: 1,
        damage: 14,
        projectileSpeed: 560,
        pierce: 0,
        magnet: 108,
        area: 1,
        orbitals: 1,
        auraDamage: 9,
        auraRadius: 122,
        auraInterval: 2.35,
        auraKnockback: 10,
      },
      cooldowns: {
        wand: 0,
        aura: 1.45,
      },
      camera: {
        x: 0,
        y: 0,
      },
    };
  }

  function getInitialLanguage() {
    try {
      const saved = window.localStorage.getItem("nightfall-language");
      if (saved === "ja" || saved === "en") return saved;
    } catch {
      // Private browsing or file previews can block localStorage.
    }
    return navigator.language && navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  function copy(key, vars = {}) {
    const value = i18n[language][key] || i18n.en[key] || key;
    return Object.entries(vars).reduce(
      (result, [name, replacement]) => result.replace(`{${name}}`, replacement),
      value,
    );
  }

  function abilityCopy(key) {
    return i18n[language].abilities[key] || i18n.en.abilities[key] || key;
  }

  function upgradeCopy(upgrade, field) {
    if (language === "ja") {
      return upgrade[`ja${field}`] || upgrade[field.toLowerCase()];
    }
    return upgrade[field.toLowerCase()];
  }

  function upgradeLevel(upgrade) {
    return state.upgradeLevels[upgrade.id] || 0;
  }

  function upgradeLevelCopy(upgrade) {
    const current = upgradeLevel(upgrade);
    const next = current + 1;
    if (upgrade.maxLevel) {
      return copy("upgradeLevelMax", { current, next, max: upgrade.maxLevel });
    }
    return copy("upgradeLevel", { current, next });
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === "ja" ? "ja" : "en";
    try {
      window.localStorage.setItem("nightfall-language", language);
    } catch {
      // The language still changes for this session if persistence is unavailable.
    }

    document.documentElement.lang = language;
    document.title = copy("pageTitle");
    canvas.setAttribute("aria-label", copy("canvasAria"));
    ui.abilityBar.setAttribute("aria-label", copy("abilityAria"));
    ui.upgradeEyebrow.textContent = copy("levelUp");
    ui.pauseEyebrow.textContent = copy("pauseEyebrow");
    ui.pauseTitle.textContent = copy("paused");
    ui.resumeButton.textContent = copy("resume");
    ui.resultEyebrow.textContent = copy("resultEyebrow");
    ui.restartButton.textContent = copy("retry");
    ui.languageButton.setAttribute("aria-label", copy("switchLanguage"));
    ui.languageJa.classList.toggle("active", language === "ja");
    ui.languageEn.classList.toggle("active", language === "en");
    updatePauseButtonLabel();

    if (state.mode === "upgrade") {
      ui.upgradeTitle.textContent = copy("level", { level: state.level });
      renderUpgradeCards();
    } else {
      ui.upgradeTitle.textContent = copy("choosePower");
    }

    if (state.mode === "over") {
      renderResult();
    }

    ui.abilityBar.dataset.html = "";
    updateHud(true);
  }

  function toggleLanguage() {
    setLanguage(language === "ja" ? "en" : "ja");
  }

  function updatePauseButtonLabel() {
    ui.pauseButton.setAttribute("aria-label", state.mode === "paused" ? copy("resume") : copy("pause"));
  }

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    viewWidth = Math.max(320, window.innerWidth);
    viewHeight = Math.max(320, window.innerHeight);
    canvas.width = Math.floor(viewWidth * dpr);
    canvas.height = Math.floor(viewHeight * dpr);
    canvas.style.width = `${viewWidth}px`;
    canvas.style.height = `${viewHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBackgroundStars();
  }

  function buildBackgroundStars() {
    const count = Math.ceil((viewWidth * viewHeight) / 22000);
    backgroundStars = Array.from({ length: count }, (_, index) => ({
      x: hash(index * 11.31) * viewWidth,
      y: hash(index * 31.77) * viewHeight,
      r: 0.6 + hash(index * 71.19) * 1.8,
      a: 0.18 + hash(index * 17.63) * 0.32,
    }));
  }

  function hash(value) {
    return fract(Math.sin(value * 12.9898) * 43758.5453);
  }

  function fract(value) {
    return value - Math.floor(value);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function distance(a, b, c, d) {
    const dx = a - c;
    const dy = b - d;
    return Math.hypot(dx, dy);
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60).toString().padStart(2, "0");
    const secs = (total % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function worldToScreen(x, y) {
    return {
      x: x - state.camera.x + viewWidth / 2,
      y: y - state.camera.y + viewHeight / 2,
    };
  }

  function screenToWorld(x, y) {
    return {
      x: x + state.camera.x - viewWidth / 2,
      y: y + state.camera.y - viewHeight / 2,
    };
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function choose(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function weightedType(gameTime) {
    const roll = Math.random();
    if (gameTime > 140 && roll < 0.12) return "wraith";
    if (gameTime > 82 && roll < 0.2) return "brute";
    if (gameTime > 38 && roll < 0.44) return "shade";
    return "bat";
  }

  function enemyTemplate(type, elapsed) {
    const scale = 1 + elapsed / 340;
    const templates = {
      bat: {
        radius: 13,
        hp: 18 * scale,
        speed: 104 + Math.min(34, elapsed * 0.2),
        damage: 5,
        value: 4,
        color: "#ff5f86",
        accent: "#ffc1d0",
      },
      shade: {
        radius: 18,
        hp: 42 * scale,
        speed: 88 + Math.min(28, elapsed * 0.14),
        damage: 8,
        value: 7,
        color: "#88c7ff",
        accent: "#d5ecff",
      },
      brute: {
        radius: 28,
        hp: 112 * scale,
        speed: 58 + Math.min(20, elapsed * 0.08),
        damage: 14,
        value: 16,
        color: "#f3c45b",
        accent: "#fff2b6",
      },
      wraith: {
        radius: 20,
        hp: 74 * scale,
        speed: 146 + Math.min(22, elapsed * 0.08),
        damage: 12,
        value: 12,
        color: "#d7a7ff",
        accent: "#f1ddff",
      },
      boss: {
        radius: 48,
        hp: 900 + elapsed * 3.6,
        speed: 54,
        damage: 22,
        value: 130,
        color: "#ff6b5f",
        accent: "#ffe1bd",
      },
    };
    return templates[type];
  }

  function spawnEnemy(type = weightedType(state.time), elite = false) {
    const template = enemyTemplate(type, state.time);
    const spawnRadius = Math.max(viewWidth, viewHeight) * 0.62 + randRange(60, 180);
    const angle = randRange(0, TAU);
    const enemy = {
      type,
      x: state.player.x + Math.cos(angle) * spawnRadius,
      y: state.player.y + Math.sin(angle) * spawnRadius,
      radius: template.radius * (elite ? 1.28 : 1),
      hp: template.hp * (elite ? 2.8 : 1),
      maxHp: template.hp * (elite ? 2.8 : 1),
      speed: template.speed * (elite ? 0.86 : 1),
      damage: template.damage * (elite ? 1.25 : 1),
      value: Math.ceil(template.value * (elite ? 3.4 : 1)),
      color: template.color,
      accent: template.accent,
      elite,
      hitFlash: 0,
      contactCooldown: 0,
      orbitalCooldown: 0,
    };
    if (type === "boss") {
      enemy.radius = template.radius;
      enemy.hp = template.hp;
      enemy.maxHp = template.hp;
      enemy.elite = true;
      enemy.value = template.value;
    }
    state.enemies.push(enemy);
  }

  function spawnWave(dt) {
    const pressure = 1 + state.time / 95;
    const targetDelay = clamp(0.9 - state.time * 0.003, 0.15, 0.9);
    state.spawnTimer -= dt * pressure;

    while (state.spawnTimer <= 0 && state.enemies.length < 230) {
      const packChance = state.time < 15 ? 0.06 : 0.2;
      const pack = Math.random() < packChance ? 2 + Math.floor(Math.random() * 4) : 1;
      for (let i = 0; i < pack; i += 1) {
        spawnEnemy();
      }
      state.spawnTimer += targetDelay + Math.random() * 0.17;
    }

    state.eliteTimer -= dt;
    if (state.eliteTimer <= 0) {
      spawnEnemy(weightedType(state.time + 40), true);
      state.eliteTimer = clamp(34 - state.time * 0.05, 17, 34);
      addFloater(state.player.x, state.player.y - 72, copy("elite"), "#f3c45b");
    }

    if (!state.bossSpawned && state.time >= 90) {
      state.bossSpawned = true;
      spawnEnemy("boss", true);
      state.shake = 1;
      addFloater(state.player.x, state.player.y - 88, copy("nightLord"), "#ff6b5f");
    }
  }

  function nearestEnemy(maxDistance = 920) {
    let best = null;
    let bestDistance = maxDistance;
    for (const enemy of state.enemies) {
      const d = distance(state.player.x, state.player.y, enemy.x, enemy.y);
      if (d < bestDistance) {
        best = enemy;
        bestDistance = d;
      }
    }
    return best;
  }

  function fireWand() {
    const target = nearestEnemy();
    if (!target) return;

    const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
    const spread = state.level >= 12 ? 0.12 : state.level >= 6 ? 0.08 : 0;
    const shots = state.level >= 18 ? 3 : state.level >= 9 ? 2 : 1;
    const center = (shots - 1) / 2;

    for (let i = 0; i < shots; i += 1) {
      const shotAngle = angle + (i - center) * spread;
      state.projectiles.push({
        x: state.player.x + Math.cos(shotAngle) * 20,
        y: state.player.y + Math.sin(shotAngle) * 20,
        vx: Math.cos(shotAngle) * state.stats.projectileSpeed,
        vy: Math.sin(shotAngle) * state.stats.projectileSpeed,
        radius: 7 * state.stats.area,
        damage: state.stats.damage,
        pierce: state.stats.pierce,
        life: 1.24,
        age: 0,
        spin: randRange(0, TAU),
      });
    }
  }

  function updatePlayer(dt) {
    const player = state.player;
    let dx = 0;
    let dy = 0;
    const keyboardX =
      (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) -
      (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
    const keyboardY =
      (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) -
      (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
    const hasKeyboardMove = keyboardX !== 0 || keyboardY !== 0;

    if (hasKeyboardMove) {
      dx = keyboardX;
      dy = keyboardY;
    }

    if (pointer.active && !hasKeyboardMove && pointer.mode === "stick") {
      dx = pointer.stickX;
      dy = pointer.stickY;
    } else if (pointer.active && !hasKeyboardMove) {
      const target = screenToWorld(pointer.x, pointer.y);
      dx = target.x - player.x;
      dy = target.y - player.y;
      const len = Math.hypot(dx, dy);
      if (len < 18) {
        dx = 0;
        dy = 0;
      }
    }

    const length = Math.hypot(dx, dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
      player.x += dx * state.stats.speed * dt;
      player.y += dy * state.stats.speed * dt;
      player.facing = dx === 0 ? player.facing : Math.sign(dx);
    }

    player.bob += dt * (length > 0 ? 9 : 4);
    player.hurtCooldown = Math.max(0, player.hurtCooldown - dt);
    state.camera.x = lerp(state.camera.x, player.x, 1 - Math.pow(0.0002, dt));
    state.camera.y = lerp(state.camera.y, player.y, 1 - Math.pow(0.0002, dt));
  }

  function updateWeapons(dt) {
    state.cooldowns.wand -= dt;
    const wandDelay = clamp(0.62 / state.stats.fireRate, 0.11, 0.82);
    if (state.cooldowns.wand <= 0) {
      fireWand();
      state.cooldowns.wand += wandDelay;
    }

    state.cooldowns.aura -= dt;
    const auraDelay = clamp(state.stats.auraInterval - state.level * 0.018, 1.05, state.stats.auraInterval);
    if (state.cooldowns.aura <= 0) {
      pulseAura();
      state.cooldowns.aura += auraDelay;
    }
  }

  function pulseAura() {
    const radius = state.stats.auraRadius * state.stats.area;
    const damage = state.stats.auraDamage + state.level * 0.38;
    const knockback = state.stats.auraKnockback * state.stats.area;
    state.particles.push({
      type: "ring",
      x: state.player.x,
      y: state.player.y,
      radius,
      maxRadius: radius,
      age: 0,
      life: 0.42,
      color: "#f3c45b",
    });

    for (const enemy of state.enemies) {
      if (distance(state.player.x, state.player.y, enemy.x, enemy.y) <= radius + enemy.radius) {
        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        const len = Math.hypot(dx, dy);
        const angle = len > 0 ? Math.atan2(dy, dx) : state.time;
        const pressure = 1 - Math.min(1, len / (radius + enemy.radius));
        const shove = knockback * (0.7 + pressure * 0.8);
        enemy.x += Math.cos(angle) * shove;
        enemy.y += Math.sin(angle) * shove;
        damageEnemy(enemy, damage, "#f3c45b");
      }
    }
  }

  function updateProjectiles(dt) {
    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = state.projectiles[i];
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.age += dt;
      projectile.life -= dt;
      projectile.spin += dt * 8;

      let remove = projectile.life <= 0;
      for (const enemy of state.enemies) {
        if (remove) break;
        if (distance(projectile.x, projectile.y, enemy.x, enemy.y) < projectile.radius + enemy.radius) {
          damageEnemy(enemy, projectile.damage, "#88c7ff");
          burst(projectile.x, projectile.y, "#88c7ff", 4, 0.36);
          projectile.pierce -= 1;
          remove = projectile.pierce < 0;
        }
      }

      if (remove) {
        state.projectiles.splice(i, 1);
      }
    }
  }

  function updateOrbitals(dt) {
    if (state.stats.orbitals <= 0) return;

    const count = state.stats.orbitals;
    const orbitRadius = (66 + count * 8) * state.stats.area;
    const bladeRadius = 15 * state.stats.area;
    const spin = state.time * (1.9 + count * 0.08);

    for (const enemy of state.enemies) {
      enemy.orbitalCooldown = Math.max(0, enemy.orbitalCooldown - dt);
      if (enemy.orbitalCooldown > 0) continue;

      for (let i = 0; i < count; i += 1) {
        const angle = spin + (TAU / count) * i;
        const x = state.player.x + Math.cos(angle) * orbitRadius;
        const y = state.player.y + Math.sin(angle) * orbitRadius;
        if (distance(x, y, enemy.x, enemy.y) < bladeRadius + enemy.radius) {
          damageEnemy(enemy, 10 + state.stats.damage * 0.42, "#f4f2e8");
          enemy.orbitalCooldown = 0.28;
          burst(x, y, "#f4f2e8", 3, 0.28);
          break;
        }
      }
    }
  }

  function updateEnemies(dt) {
    const player = state.player;
    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 8);
      enemy.contactCooldown = Math.max(0, enemy.contactCooldown - dt);

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const len = Math.hypot(dx, dy) || 1;
      const wobble = Math.sin(state.time * 2.4 + enemy.x * 0.012 + enemy.y * 0.011) * 0.24;
      const nx = dx / len;
      const ny = dy / len;
      const sideX = -ny * wobble;
      const sideY = nx * wobble;
      const speed = enemy.speed * (enemy.hitFlash > 0 ? 0.72 : 1);

      enemy.x += (nx + sideX) * speed * dt;
      enemy.y += (ny + sideY) * speed * dt;

      const touching = len < enemy.radius + player.radius;
      if (touching && enemy.contactCooldown <= 0 && player.hurtCooldown <= 0) {
        player.health -= enemy.damage;
        player.hurtCooldown = 0.44;
        enemy.contactCooldown = 0.8;
        state.shake = Math.max(state.shake, 0.5);
        burst(player.x, player.y, "#ff6b5f", 9, 0.52);
        addFloater(player.x, player.y - 38, `-${Math.round(enemy.damage)}`, "#ff6b5f");

        if (player.health <= 0) {
          player.health = 0;
          endRun();
          break;
        }
      }

      if (enemy.hp <= 0) {
        killEnemy(enemy);
        state.enemies.splice(i, 1);
      }
    }
  }

  function damageEnemy(enemy, amount, color) {
    enemy.hp -= amount;
    enemy.hitFlash = 1;
    if (Math.random() < 0.35) {
      addParticle(enemy.x, enemy.y, color, randRange(24, 92), randRange(0.18, 0.42));
    }
  }

  function killEnemy(enemy) {
    state.kills += 1;
    state.gold += enemy.elite ? 5 + Math.floor(enemy.value / 8) : Math.random() < 0.25 ? 1 : 0;
    burst(enemy.x, enemy.y, enemy.color, enemy.elite ? 18 : 8, enemy.elite ? 0.82 : 0.48);
    dropGem(enemy.x, enemy.y, enemy.value);
    if (enemy.elite && enemy.type !== "boss") {
      dropPickup(enemy.x, enemy.y);
    }
    if (enemy.type === "boss") {
      state.flash = 1;
      for (let i = 0; i < 18; i += 1) {
        dropGem(enemy.x + randRange(-40, 40), enemy.y + randRange(-40, 40), 18 + Math.floor(Math.random() * 12));
      }
      addFloater(enemy.x, enemy.y - 60, copy("bossDown"), "#f3c45b");
    }
  }

  function dropGem(x, y, value) {
    state.gems.push({
      x: x + randRange(-12, 12),
      y: y + randRange(-12, 12),
      vx: randRange(-36, 36),
      vy: randRange(-36, 36),
      value,
      radius: 5 + Math.min(5, value / 20),
      age: 0,
    });
  }

  function dropPickup(x, y) {
    if (Math.random() > 0.65) return;
    state.pickups.push({
      x,
      y,
      radius: 11,
      kind: "heart",
      age: 0,
    });
  }

  function updateGems(dt) {
    const player = state.player;
    for (let i = state.gems.length - 1; i >= 0; i -= 1) {
      const gem = state.gems[i];
      gem.age += dt;
      gem.vx *= Math.pow(0.08, dt);
      gem.vy *= Math.pow(0.08, dt);

      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      const len = Math.hypot(dx, dy) || 1;
      const pullRange = state.stats.magnet;
      if (len < pullRange) {
        const force = 760 * (1 - len / pullRange) + 110;
        gem.vx += (dx / len) * force * dt;
        gem.vy += (dy / len) * force * dt;
      }

      gem.x += gem.vx * dt;
      gem.y += gem.vy * dt;

      if (len < player.radius + gem.radius + 5) {
        gainXp(gem.value);
        burst(gem.x, gem.y, "#43e0b7", 4, 0.26);
        state.gems.splice(i, 1);
      }
    }

    for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = state.pickups[i];
      pickup.age += dt;
      if (distance(player.x, player.y, pickup.x, pickup.y) < player.radius + pickup.radius + 5) {
        const heal = Math.min(28, player.maxHealth - player.health);
        player.health += heal;
        addFloater(player.x, player.y - 44, `+${Math.round(heal)}`, "#43e0b7");
        burst(pickup.x, pickup.y, "#43e0b7", 10, 0.44);
        state.pickups.splice(i, 1);
      }
    }
  }

  function gainXp(amount) {
    state.xp += amount;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level += 1;
      state.levelQueue += 1;
      state.xpToNext = Math.floor(18 + state.level * 9 + Math.pow(state.level, 1.36) * 4);
    }

    if (state.levelQueue > 0 && state.mode === "running") {
      showUpgrade();
    }
  }

  function showUpgrade() {
    state.mode = "upgrade";
    resetPointer();
    state.levelQueue -= 1;
    state.upgradeChoices = rollUpgrades();
    ui.upgradeTitle.textContent = copy("level", { level: state.level });
    renderUpgradeCards();
    ui.upgradeOverlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      const first = ui.upgradeCards.querySelector("button");
      if (first) first.focus();
    });
    updateHud();
  }

  function renderUpgradeCards() {
    ui.upgradeCards.innerHTML = "";

    for (const upgrade of state.upgradeChoices) {
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.type = "button";
      button.style.setProperty("--accent", upgrade.color);
      button.innerHTML = `
        <span class="upgrade-card-top">
          <span class="upgrade-badge" style="background:${upgrade.color}">${upgradeCopy(upgrade, "Badge")}</span>
          <span class="upgrade-level">${upgradeLevelCopy(upgrade)}</span>
        </span>
        <strong>${upgradeCopy(upgrade, "Name")}</strong>
        <p>${upgradeCopy(upgrade, "Text")}</p>
      `;
      button.addEventListener("click", () => chooseUpgrade(upgrade));
      ui.upgradeCards.appendChild(button);
    }
  }

  function rollUpgrades() {
    const available = upgrades.filter((upgrade) => !upgrade.max || upgrade.max(state));
    const pool = [...available];
    const choices = [];
    while (choices.length < 3 && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(index, 1)[0]);
    }
    return choices;
  }

  function chooseUpgrade(upgrade) {
    upgrade.apply(state);
    state.upgradeLevels[upgrade.id] = upgradeLevel(upgrade) + 1;
    ui.upgradeOverlay.classList.add("hidden");
    state.flash = Math.max(state.flash, 0.22);
    addFloater(state.player.x, state.player.y - 72, upgradeCopy(upgrade, "Badge"), upgrade.color);
    burst(state.player.x, state.player.y, upgrade.color, 18, 0.54);

    if (state.levelQueue > 0) {
      showUpgrade();
    } else {
      state.mode = "running";
    }
    updateHud(true);
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.age += dt;
      if (p.type !== "ring") {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.pow(0.22, dt);
        p.vy *= Math.pow(0.22, dt);
      }
      if (p.age >= p.life) {
        state.particles.splice(i, 1);
      }
    }

    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const floater = state.floaters[i];
      floater.age += dt;
      floater.y -= 34 * dt;
      if (floater.age >= floater.life) {
        state.floaters.splice(i, 1);
      }
    }

    state.shake = Math.max(0, state.shake - dt * 1.9);
    state.flash = Math.max(0, state.flash - dt * 1.8);
  }

  function addParticle(x, y, color, speed, life) {
    const angle = randRange(0, TAU);
    state.particles.push({
      type: "spark",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randRange(1.6, 4.6),
      color,
      age: 0,
      life,
    });
  }

  function burst(x, y, color, count, life) {
    for (let i = 0; i < count; i += 1) {
      addParticle(x, y, color, randRange(48, 210), life * randRange(0.62, 1.2));
    }
  }

  function addFloater(x, y, text, color) {
    state.floaters.push({
      x,
      y,
      text,
      color,
      age: 0,
      life: 1.1,
    });
  }

  function endRun() {
    if (state.mode === "over") return;
    state.mode = "over";
    resetPointer();
    ui.upgradeOverlay.classList.add("hidden");
    ui.pauseOverlay.classList.add("hidden");
    renderResult();
    ui.gameOverOverlay.classList.remove("hidden");
  }

  function renderResult() {
    ui.resultTitle.textContent =
      state.time >= 90 && state.bossSpawned ? copy("resultNightHolds") : copy("resultOverrun");
    ui.resultStats.innerHTML = `
      <span>${formatTime(state.time)}</span>
      <span>${copy("levelShort", { level: state.level })}</span>
      <span>${copy("kills", { value: state.kills })}</span>
      <span>${copy("gold", { value: state.gold })}</span>
    `;
  }

  function togglePause(force) {
    if (state.mode === "upgrade" || state.mode === "over") return;
    const pause = typeof force === "boolean" ? force : state.mode !== "paused";
    state.mode = pause ? "paused" : "running";
    if (pause) resetPointer();
    ui.pauseOverlay.classList.toggle("hidden", !pause);
    updatePauseButtonLabel();
  }

  function restart() {
    state = createState();
    keys.clear();
    resetPointer();
    ui.gameOverOverlay.classList.add("hidden");
    ui.pauseOverlay.classList.add("hidden");
    ui.upgradeOverlay.classList.add("hidden");
    updatePauseButtonLabel();
    updateHud(true);
    lastFrame = performance.now();
  }

  function resetPointer() {
    pointer.id = null;
    pointer.active = false;
    pointer.mode = "target";
    pointer.stickX = 0;
    pointer.stickY = 0;
    ui.touchControls.classList.remove("active");
    ui.joystickKnob.style.transform = "translate(-50%, -50%)";
  }

  function isTouchLikePointer(event) {
    return (
      event.pointerType === "touch" ||
      event.pointerType === "pen" ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  function beginPointer(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (state.mode !== "running") return;

    pointer.id = event.pointerId;
    pointer.active = true;
    pointer.mode = isTouchLikePointer(event) ? "stick" : "target";
    pointer.x = event.clientX;
    pointer.y = event.clientY;

    if (pointer.mode === "stick") {
      pointer.startX = clamp(event.clientX, 74, viewWidth - 74);
      pointer.startY = clamp(event.clientY, 74, viewHeight - 74);
      ui.joystickBase.style.left = `${pointer.startX}px`;
      ui.joystickBase.style.top = `${pointer.startY}px`;
      ui.touchControls.classList.add("active");
      updatePointer(event);
    } else {
      pointer.startX = event.clientX;
      pointer.startY = event.clientY;
    }

    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Some embedded browsers can reject capture if the pointer already ended.
      }
    }
    event.preventDefault();
  }

  function updatePointer(event) {
    if (!pointer.active || pointer.id !== event.pointerId) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;

    if (pointer.mode === "stick") {
      const rawX = event.clientX - pointer.startX;
      const rawY = event.clientY - pointer.startY;
      const length = Math.hypot(rawX, rawY);
      const deadZone = 8;
      const scale = length > stickRadius ? stickRadius / length : 1;
      const knobX = length < deadZone ? 0 : rawX * scale;
      const knobY = length < deadZone ? 0 : rawY * scale;
      pointer.stickX = knobX / stickRadius;
      pointer.stickY = knobY / stickRadius;
      ui.joystickKnob.style.transform = `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)`;
    }

    event.preventDefault();
  }

  function endPointer(event) {
    if (event && pointer.id !== event.pointerId) return;
    if (canvas.releasePointerCapture && event && canvas.hasPointerCapture(event.pointerId)) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Capture may already be gone after a system gesture or tab interruption.
      }
    }
    resetPointer();
  }

  function update(dt) {
    if (state.mode !== "running") {
      updateParticles(dt * 0.22);
      return;
    }

    state.time += dt;
    updatePlayer(dt);
    updateWeapons(dt);
    spawnWave(dt);
    updateProjectiles(dt);
    updateOrbitals(dt);
    updateEnemies(dt);
    updateGems(dt);
    updateParticles(dt);
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    const shakeX = state.shake ? randRange(-7, 7) * state.shake : 0;
    const shakeY = state.shake ? randRange(-7, 7) * state.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawGems();
    drawPickups();
    drawProjectiles();
    drawOrbitals();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawFloaters();
    ctx.restore();

    drawVignette();
    if (state.flash > 0) {
      ctx.save();
      ctx.globalAlpha = state.flash * 0.18;
      ctx.fillStyle = "#f4f2e8";
      ctx.fillRect(0, 0, viewWidth, viewHeight);
      ctx.restore();
    }
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, "#111715");
    gradient.addColorStop(0.5, "#0c0e10");
    gradient.addColorStop(1, "#11100d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    for (const star of backgroundStars) {
      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#f4f2e8";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const tile = 96;
    const startX = Math.floor((state.camera.x - viewWidth / 2) / tile) - 1;
    const endX = Math.ceil((state.camera.x + viewWidth / 2) / tile) + 1;
    const startY = Math.floor((state.camera.y - viewHeight / 2) / tile) - 1;
    const endY = Math.ceil((state.camera.y + viewHeight / 2) / tile) + 1;

    for (let gy = startY; gy <= endY; gy += 1) {
      for (let gx = startX; gx <= endX; gx += 1) {
        const x = gx * tile;
        const y = gy * tile;
        const screen = worldToScreen(x, y);
        const h = hash(gx * 27.19 + gy * 71.41);

        ctx.strokeStyle = "rgba(244, 242, 232, 0.045)";
        ctx.lineWidth = 1;
        ctx.strokeRect(screen.x, screen.y, tile, tile);

        if (h > 0.78) {
          drawRune(screen.x + tile * hash(h * 22), screen.y + tile * hash(h * 47), h);
        } else if (h > 0.52) {
          drawGrass(screen.x + tile * hash(h * 64), screen.y + tile * hash(h * 86), h);
        } else if (h < 0.08) {
          drawStone(screen.x + tile * 0.5, screen.y + tile * 0.52, h);
        }
      }
    }
  }

  function drawRune(x, y, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(seed * TAU);
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = seed > 0.9 ? "#43e0b7" : "#f3c45b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13 + seed * 8, 0, TAU);
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawGrass(x, y, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = seed > 0.64 ? "#43e0b7" : "#a5b766";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const angle = -0.8 + i * 0.48 + seed * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 8, -10 - i * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStone(x, y, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(seed * TAU);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#b7b3a6";
    roundRect(-15, -8, 30, 16, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    const player = state.player;
    const screen = worldToScreen(player.x, player.y);
    const bob = Math.sin(player.bob) * 3;
    const hurt = player.hurtCooldown > 0;

    ctx.save();
    ctx.translate(screen.x, screen.y + bob);
    ctx.scale(player.facing, 1);

    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 22, 24, 9, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = hurt ? "#fff2d7" : "#1d2025";
    ctx.strokeStyle = "#f3c45b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -3, player.radius, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#43e0b7";
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.quadraticCurveTo(0, -32, 14, -6);
    ctx.quadraticCurveTo(4, -12, 0, -9);
    ctx.quadraticCurveTo(-4, -12, -14, -6);
    ctx.fill();

    ctx.fillStyle = "#f4f2e8";
    ctx.beginPath();
    ctx.arc(-5, -4, 2.4, 0, TAU);
    ctx.arc(7, -4, 2.4, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#88c7ff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(12, 3);
    ctx.lineTo(25, 14);
    ctx.lineTo(32, 4);
    ctx.stroke();

    ctx.restore();
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      const screen = worldToScreen(enemy.x, enemy.y);
      if (screen.x < -90 || screen.x > viewWidth + 90 || screen.y < -90 || screen.y > viewHeight + 90) {
        continue;
      }

      ctx.save();
      ctx.translate(screen.x, screen.y);
      const pulse = 1 + Math.sin(state.time * 5 + enemy.x * 0.01) * 0.04;
      ctx.scale(pulse, pulse);

      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(0, enemy.radius * 0.78, enemy.radius * 0.9, enemy.radius * 0.35, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (enemy.type === "bat") drawBat(enemy);
      else if (enemy.type === "brute") drawBrute(enemy);
      else if (enemy.type === "wraith") drawWraith(enemy);
      else if (enemy.type === "boss") drawBoss(enemy);
      else drawShade(enemy);

      if (enemy.elite) {
        ctx.strokeStyle = "rgba(243, 196, 91, 0.82)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 5 + Math.sin(state.time * 5) * 2, 0, TAU);
        ctx.stroke();
      }

      if (enemy.maxHp > 80 || enemy.elite) {
        drawEnemyBar(enemy);
      }
      ctx.restore();
    }
  }

  function drawBat(enemy) {
    ctx.fillStyle = enemy.hitFlash > 0 ? "#fff" : enemy.color;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-enemy.radius, 0);
    ctx.quadraticCurveTo(-enemy.radius * 1.5, -enemy.radius * 0.65, -enemy.radius * 2, 2);
    ctx.quadraticCurveTo(-enemy.radius * 1.12, 4, -enemy.radius * 0.45, 8);
    ctx.quadraticCurveTo(0, -enemy.radius * 0.95, enemy.radius * 0.45, 8);
    ctx.quadraticCurveTo(enemy.radius * 1.12, 4, enemy.radius * 2, 2);
    ctx.quadraticCurveTo(enemy.radius * 1.5, -enemy.radius * 0.65, enemy.radius, 0);
    ctx.quadraticCurveTo(0, enemy.radius * 0.78, -enemy.radius, 0);
    ctx.fill();
    ctx.stroke();
    drawEyes(enemy.accent, 4, -1);
  }

  function drawShade(enemy) {
    ctx.fillStyle = enemy.hitFlash > 0 ? "#fff" : enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, Math.PI, TAU);
    ctx.lineTo(enemy.radius * 0.82, enemy.radius * 0.75);
    ctx.quadraticCurveTo(enemy.radius * 0.35, enemy.radius * 0.52, 0, enemy.radius * 0.92);
    ctx.quadraticCurveTo(-enemy.radius * 0.35, enemy.radius * 0.52, -enemy.radius * 0.82, enemy.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    drawEyes(enemy.accent, 5, -2);
  }

  function drawBrute(enemy) {
    ctx.fillStyle = enemy.hitFlash > 0 ? "#fff" : enemy.color;
    roundRect(-enemy.radius * 0.82, -enemy.radius * 0.72, enemy.radius * 1.64, enemy.radius * 1.55, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.38)";
    ctx.stroke();
    ctx.fillStyle = "#1d2025";
    ctx.fillRect(-enemy.radius * 0.38, -enemy.radius * 1.02, enemy.radius * 0.76, enemy.radius * 0.34);
    drawEyes(enemy.accent, 7, -5);
  }

  function drawWraith(enemy) {
    ctx.globalAlpha = enemy.hitFlash > 0 ? 1 : 0.82;
    ctx.fillStyle = enemy.hitFlash > 0 ? "#fff" : enemy.color;
    ctx.beginPath();
    ctx.moveTo(0, -enemy.radius * 1.08);
    ctx.bezierCurveTo(enemy.radius * 1.1, -enemy.radius * 0.54, enemy.radius * 0.62, enemy.radius * 0.92, 0, enemy.radius * 1.18);
    ctx.bezierCurveTo(-enemy.radius * 0.62, enemy.radius * 0.92, -enemy.radius * 1.1, -enemy.radius * 0.54, 0, -enemy.radius * 1.08);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawEyes(enemy.accent, 5, -2);
  }

  function drawBoss(enemy) {
    const spikes = 12;
    ctx.fillStyle = enemy.hitFlash > 0 ? "#fff" : enemy.color;
    ctx.beginPath();
    for (let i = 0; i < spikes; i += 1) {
      const angle = (i / spikes) * TAU + state.time * 0.28;
      const radius = i % 2 ? enemy.radius * 0.84 : enemy.radius * 1.12;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffe1bd";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#1d2025";
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * 0.58, 0, TAU);
    ctx.fill();
    drawEyes(enemy.accent, 12, -4);
  }

  function drawEyes(color, gap, y) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-gap, y, 2.3, 0, TAU);
    ctx.arc(gap, y, 2.3, 0, TAU);
    ctx.fill();
  }

  function drawEnemyBar(enemy) {
    const width = Math.max(32, enemy.radius * 1.7);
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    roundRect(-width / 2, -enemy.radius - 13, width, 5, 3);
    ctx.fill();
    ctx.fillStyle = enemy.type === "boss" ? "#ff6b5f" : "#f3c45b";
    roundRect(-width / 2, -enemy.radius - 13, width * ratio, 5, 3);
    ctx.fill();
  }

  function drawProjectiles() {
    for (const projectile of state.projectiles) {
      const screen = worldToScreen(projectile.x, projectile.y);
      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(projectile.spin);
      ctx.shadowColor = "#88c7ff";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#d5ecff";
      ctx.beginPath();
      ctx.ellipse(0, 0, projectile.radius * 1.5, projectile.radius * 0.72, 0, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#88c7ff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawOrbitals() {
    const count = state.stats.orbitals;
    if (count <= 0) return;

    const orbitRadius = (66 + count * 8) * state.stats.area;
    const bladeRadius = 15 * state.stats.area;
    const spin = state.time * (1.9 + count * 0.08);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#f4f2e8";
    ctx.lineWidth = 1;
    const center = worldToScreen(state.player.x, state.player.y);
    ctx.beginPath();
    ctx.arc(center.x, center.y, orbitRadius, 0, TAU);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < count; i += 1) {
      const angle = spin + (TAU / count) * i;
      const x = state.player.x + Math.cos(angle) * orbitRadius;
      const y = state.player.y + Math.sin(angle) * orbitRadius;
      const screen = worldToScreen(x, y);
      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.shadowColor = "#f4f2e8";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#f4f2e8";
      ctx.beginPath();
      ctx.moveTo(0, -bladeRadius);
      ctx.quadraticCurveTo(bladeRadius * 0.92, 0, 0, bladeRadius);
      ctx.quadraticCurveTo(bladeRadius * 0.28, 0, 0, -bladeRadius);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawGems() {
    for (const gem of state.gems) {
      const screen = worldToScreen(gem.x, gem.y);
      if (screen.x < -20 || screen.x > viewWidth + 20 || screen.y < -20 || screen.y > viewHeight + 20) continue;
      const pulse = 1 + Math.sin(gem.age * 7) * 0.08;
      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#43e0b7";
      ctx.shadowBlur = 13;
      ctx.fillStyle = gem.value > 20 ? "#f3c45b" : "#43e0b7";
      ctx.beginPath();
      ctx.moveTo(0, -gem.radius);
      ctx.lineTo(gem.radius, 0);
      ctx.lineTo(0, gem.radius);
      ctx.lineTo(-gem.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const pickup of state.pickups) {
      const screen = worldToScreen(pickup.x, pickup.y);
      ctx.save();
      ctx.translate(screen.x, screen.y + Math.sin(pickup.age * 5) * 3);
      ctx.shadowColor = "#ff5f86";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ff5f86";
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.bezierCurveTo(-18, -2, -10, -17, 0, -8);
      ctx.bezierCurveTo(10, -17, 18, -2, 0, 9);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      const screen = worldToScreen(p.x, p.y);
      const t = clamp(p.age / p.life, 0, 1);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      if (p.type === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, p.maxRadius * (0.72 + t * 0.28), 0, TAU);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, p.radius * (1 - t * 0.35), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 15px Inter, system-ui, sans-serif";
    for (const floater of state.floaters) {
      const screen = worldToScreen(floater.x, floater.y);
      const t = clamp(floater.age / floater.life, 0, 1);
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillText(floater.text, screen.x + 1, screen.y + 2);
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, screen.x, screen.y);
    }
    ctx.restore();
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(
      viewWidth / 2,
      viewHeight / 2,
      Math.min(viewWidth, viewHeight) * 0.18,
      viewWidth / 2,
      viewHeight / 2,
      Math.max(viewWidth, viewHeight) * 0.72,
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function updateHud(force = false) {
    if (!force && state._hudTick && performance.now() - state._hudTick < 80) return;
    state._hudTick = performance.now();

    const healthRatio = clamp(state.player.health / state.player.maxHealth, 0, 1);
    const xpRatio = clamp(state.xp / state.xpToNext, 0, 1);
    ui.levelText.textContent = copy("levelShort", { level: state.level });
    ui.xpText.textContent = `${Math.floor(state.xp)} / ${state.xpToNext}`;
    ui.xpFill.style.width = `${xpRatio * 100}%`;
    ui.healthText.textContent = `${Math.ceil(state.player.health)} / ${state.player.maxHealth}`;
    ui.healthFill.style.width = `${healthRatio * 100}%`;
    ui.weaponText.textContent = copy("damageUnit", { value: Math.round(state.stats.damage) });
    ui.timeText.textContent = formatTime(state.time);
    ui.killText.textContent = copy("kills", { value: state.kills });
    ui.goldText.textContent = copy("gold", { value: state.gold });
    renderAbilityBar();
  }

  function renderAbilityBar() {
    const items = [
      { name: abilityCopy("wand"), value: `${state.stats.fireRate.toFixed(1)}x`, color: "#88c7ff" },
      { name: abilityCopy("sickle"), value: `${state.stats.orbitals}`, color: "#f4f2e8" },
      { name: abilityCopy("ward"), value: `${Math.round(state.stats.auraRadius)}`, color: "#f3c45b" },
      { name: abilityCopy("magnet"), value: `${Math.round(state.stats.magnet)}`, color: "#43e0b7" },
      { name: abilityCopy("pierce"), value: `${state.stats.pierce}`, color: "#d7a7ff" },
    ];

    const html = items
      .map(
        (item) => `
        <span class="ability-pill">
          <span class="ability-icon" style="background:${item.color}"></span>
          <span>${item.name} ${item.value}</span>
        </span>
      `,
      )
      .join("");

    if (ui.abilityBar.dataset.html !== html) {
      ui.abilityBar.dataset.html = html;
      ui.abilityBar.innerHTML = html;
    }
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    update(dt);
    render();
    updateHud();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
      event.preventDefault();
    }

    const key = event.key.toLowerCase();
    keys.add(key);

    if (key === "p" || event.key === "Escape") {
      togglePause();
    }

    if (state.mode === "upgrade" && ["1", "2", "3"].includes(event.key)) {
      const choice = state.upgradeChoices[Number(event.key) - 1];
      if (choice) chooseUpgrade(choice);
    }

    if (state.mode === "over" && key === "r") {
      restart();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  canvas.addEventListener("pointerdown", beginPointer);
  canvas.addEventListener("pointermove", updatePointer);
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  ui.pauseButton.addEventListener("click", () => togglePause());
  ui.languageButton.addEventListener("click", toggleLanguage);
  ui.resumeButton.addEventListener("click", () => togglePause(false));
  ui.restartButton.addEventListener("click", restart);

  resize();
  setLanguage(language);
  updateHud(true);
  requestAnimationFrame(loop);
})();
