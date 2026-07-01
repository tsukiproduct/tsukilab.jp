/* ================================================================
   蒼炎決戦 / SOUEN KESSEN - game.js
   スマホブラウザ向け2D格闘ゲーム MVP（仕様書v1.0準拠）

   構成クラス（仕様書20節）:
     Game / Fighter / InputManager / BattleSystem
     UIManager / AssetManager / CPUController

   外部ライブラリ不使用 / Canvas API描画 / 防御的実装
   キーボード操作（PCデバッグ用）:
     A,D or ←→ = 移動 / W,Space = ジャンプ
     J = 上段 / K = 中段 / L = 下段
     U = 弱必殺 / I = 中必殺 / O = 超必殺 / G = ガード(必殺技防御時)
   ================================================================ */
"use strict";

/* ================================================================
   定数定義（調整はここを変更する）
   ================================================================ */
const CONFIG = {
  // 画面（仕様書4節）
  WIDTH: 1280,
  HEIGHT: 720,
  GROUND_Y: 600,           // 地面のY座標（キャラの足元）
  STAGE_LEFT: 90,          // ステージ左端
  STAGE_RIGHT: 1190,       // ステージ右端

  // ラウンド（仕様書4節）
  MAX_HP: 1000,
  ROUND_TIME: 60,          // 秒
  ROUNDS_TO_WIN: 2,        // 2本先取

  // 距離判定（仕様書5.1節）
  DIST_NEAR: 180,
  DIST_FAR: 420,

  // 通常攻撃ダメージ（仕様書8節）
  DMG: { high: 90, middle: 100, low: 80 },
  DMG_NEAR_BONUS: 20,
  DMG_FAR_PENALTY: -20,
  GUARD_DMG_RATE: 0.3,     // ガード時30%削り

  // スロー攻防（仕様書7節）
  ATTACK_WINDUP: 0.2,      // 攻撃予兆（秒・実時間）
  SLOW_DURATION: 1.2,      // スロー時間（秒・実時間）
  SLOW_SCALE: 0.25,        // スロー倍率
  DEFENSE_WINDOW: 1.0,     // 防御入力受付（秒・実時間）
  JUST_WINDOW: 0.25,       // ジャスト判定（秒・実時間）

  // 追い討ち（仕様書9節）
  FOLLOWUP_MAX: 2,
  FOLLOWUP_DMG_RATE: 0.8,
  FOLLOWUP_WINDOW: 1.5,    // 追い討ち入力受付（秒）

  // 反撃（仕様書10節）
  COUNTER_WINDOW: 0.8,     // 反撃受付時間（秒）
  COUNTER_DMG: 120,

  // ゲージ（仕様書11節）
  GAUGE_MAX: 10,
  GAUGE: {
    attackHit: 1,      // 攻撃ヒット
    attackGuarded: 1,  // 攻撃をガードさせる
    guard: 1,          // ガード成功
    block: 2,          // ブロック成功
    dodge: 2,          // 回避成功
    damaged: 1         // 被弾
  },

  // 演出
  RESULT_TIME: 0.75,       // 結果表示時間（秒）
  ROUND_START_TIME: 2.2,
  ROUND_END_TIME: 2.4,

  // 物理
  GRAVITY: 0.7,
  FPS_TARGET: 60
};

/* 必殺技定義（仕様書12・13・23節） */
const SPECIAL_MOVES = {
  weak: {
    name: "弱必殺技", cost: 3, damage: 180, guardDamage: 70,
    dodgeCommand: ["up", "down"], inputLimit: 1.2
  },
  medium: {
    name: "中必殺技", cost: 6, damage: 280, guardDamage: 120,
    dodgeCommand: ["down", "middle", "up"], inputLimit: 1.5
  },
  super: {
    name: "超必殺技", cost: 10, damage: 450, guardDamage: 200,
    dodgeCommand: ["up", "middle", "down", "up"], inputLimit: 2.0
  }
};

/* 攻撃属性 ⇔ 入力ボタンの対応（仕様書7節） */
const ATTACK_LABEL = { high: "上", middle: "中", low: "下" };
const BTN_TO_ATTACK = { high: "high", middle: "middle", low: "low" };
const CMD_LABEL = { up: "上", middle: "中", down: "下" };
// 回避コマンドのボタンID ⇔ 表記の対応
const CMD_TO_BTN = { up: "high", middle: "middle", down: "low" };

/* キャラクターデータ（仕様書14節）
   MVPでは先頭2人のみ選択可。残り6人はデータ定義のみ。 */
const CHARACTERS = [
  { id: "ryuga",   name: "リュウガ",  type: "standard", playable: true,
    hp: 1000, speed: 4.0, jumpPower: 13, attackPower: 1.0, defense: 1.0, gaugeRate: 1.0,
    color: "#3fa7ff", color2: "#0b3d66", image: "assets/characters/ryuga.png" },
  { id: "suiren",  name: "スイレン",  type: "speed",    playable: true,
    hp: 900,  speed: 5.4, jumpPower: 14, attackPower: 0.85, defense: 0.95, gaugeRate: 1.1,
    color: "#ff5f8a", color2: "#5e1030", image: "assets/characters/suiren.png" },
  { id: "gouzan",  name: "ゴウザン",  type: "power",    playable: false,
    hp: 1150, speed: 2.8, jumpPower: 11, attackPower: 1.3, defense: 1.15, gaugeRate: 0.9,
    color: "#c0642a", color2: "#4a2410", image: "assets/characters/gouzan.png" },
  { id: "kagerou", name: "カゲロウ",  type: "grappler", playable: false,
    hp: 1050, speed: 3.6, jumpPower: 12, attackPower: 1.15, defense: 1.0, gaugeRate: 1.0,
    color: "#7a4bd6", color2: "#2b1650", image: "assets/characters/kagerou.png" },
  { id: "aoi",     name: "アオイ",    type: "zoner",    playable: false,
    hp: 900,  speed: 3.8, jumpPower: 12, attackPower: 1.0, defense: 0.9, gaugeRate: 1.05,
    color: "#37d6c0", color2: "#0d4a42", image: "assets/characters/aoi.png" },
  { id: "zero",    name: "ゼロ",      type: "tricky",   playable: false,
    hp: 950,  speed: 4.4, jumpPower: 13, attackPower: 0.95, defense: 0.95, gaugeRate: 1.15,
    color: "#9aa4b5", color2: "#2c313c", image: "assets/characters/zero.png" },
  { id: "rei",     name: "レイ",      type: "counter",  playable: false,
    hp: 1000, speed: 3.7, jumpPower: 12, attackPower: 1.0, defense: 1.1, gaugeRate: 1.0,
    color: "#e8d44f", color2: "#5c5210", image: "assets/characters/rei.png" },
  { id: "izanagi", name: "イザナギ",  type: "boss",     playable: false,
    hp: 1200, speed: 4.2, jumpPower: 13, attackPower: 1.2, defense: 1.1, gaugeRate: 0.7,
    color: "#e04444", color2: "#4d0d0d", image: "assets/characters/izanagi.png" }
];

/* CPU難易度（仕様書15節） */
const CPU_DIFFICULTY = {
  EASY:   { correctRate: 0.35, justRate: 0.05 },
  NORMAL: { correctRate: 0.55, justRate: 0.15 },
  HARD:   { correctRate: 0.75, justRate: 0.30 }
};

/* ゲーム状態（仕様書21節） */
const GameState = {
  TITLE: "title",
  MENU: "menu",
  CHARACTER_SELECT: "character_select",
  ROUND_START: "round_start",
  NEUTRAL: "neutral",
  ATTACK_START: "attack_start",
  SLOW_DEFENSE: "slow_defense",
  RESULT: "result",
  FOLLOW_UP: "follow_up",
  COUNTER: "counter",
  SPECIAL: "special",
  ROUND_END: "round_end",
  GAME_OVER: "game_over"
};

/* ================================================================
   AssetManager: 画像の読み込み管理
   画像が無くても矩形で動作する（仕様書26節）
   ================================================================ */
class AssetManager {
  constructor() {
    this.images = {};   // key -> HTMLImageElement（読込成功のみ登録）
  }
  /** 画像を非同期で読み込む。失敗しても止まらない。 */
  load(key, src) {
    try {
      const img = new Image();
      img.onload = () => { this.images[key] = img; };
      img.onerror = () => { /* 未用意なら矩形描画にフォールバック */ };
      img.src = src;
    } catch (e) {
      console.error("AssetManager.load error:", e);
    }
  }
  get(key) { return this.images[key] || null; }
}

/* ================================================================
   InputManager: タッチ・マウス・キーボード入力
   ================================================================ */
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.buttons = [];        // UIManagerが毎フレーム設定する当たり判定
    this.held = {};           // ボタンID -> 押下中フラグ（移動用）
    this.presses = [];        // 単発押下キュー {id, time}
    this.pointers = {};       // pointerId -> 現在触れているボタンID
    this.history = [];        // コマンド入力履歴（デバッグ用）
    this._bind();
  }

  _bind() {
    const c = this.canvas;
    const opts = { passive: false };
    c.addEventListener("touchstart", e => this._touch(e, "start"), opts);
    c.addEventListener("touchmove",  e => this._touch(e, "move"),  opts);
    c.addEventListener("touchend",   e => this._touch(e, "end"),   opts);
    c.addEventListener("touchcancel",e => this._touch(e, "end"),   opts);
    c.addEventListener("mousedown",  e => this._mouse(e, "start"));
    window.addEventListener("mouseup", e => this._mouse(e, "end"));
    window.addEventListener("keydown", e => this._key(e, true));
    window.addEventListener("keyup",   e => this._key(e, false));
    // ダブルタップズーム等の抑止
    document.addEventListener("gesturestart", e => e.preventDefault());
  }

  /** 画面座標 → キャンバス内部座標（1280x720）に変換 */
  _toCanvas(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { x: -999, y: -999 };
    return {
      x: (clientX - r.left) * (CONFIG.WIDTH / r.width),
      y: (clientY - r.top) * (CONFIG.HEIGHT / r.height)
    };
  }

  _hitButton(x, y) {
    for (const b of this.buttons) {
      if (b.disabled) continue;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
    }
    return null;
  }

  _touch(e, phase) {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      const p = this._toCanvas(t.clientX, t.clientY);
      if (phase === "start") {
        const b = this._hitButton(p.x, p.y);
        this._press(t.identifier, b);
      } else if (phase === "move") {
        // 移動ボタンのスライド操作対応
        const b = this._hitButton(p.x, p.y);
        const cur = this.pointers[t.identifier];
        if (b && b.id !== cur && (b.id === "left" || b.id === "right")) {
          if (cur) this.held[cur] = false;
          this.pointers[t.identifier] = b.id;
          this.held[b.id] = true;
        }
      } else {
        this._release(t.identifier);
      }
    }
  }

  _mouse(e, phase) {
    if (phase === "start") {
      const p = this._toCanvas(e.clientX, e.clientY);
      this._press("mouse", this._hitButton(p.x, p.y));
    } else {
      this._release("mouse");
    }
  }

  _press(pointerId, btn) {
    if (!btn) return;
    this.pointers[pointerId] = btn.id;
    this.held[btn.id] = true;
    this.presses.push({ id: btn.id, time: performance.now() / 1000 });
    this.history.push(btn.id);
    if (this.history.length > 30) this.history.shift();
    btn.flash = 0.15; // 押下フィードバック
  }

  _release(pointerId) {
    const id = this.pointers[pointerId];
    if (id) this.held[id] = false;
    delete this.pointers[pointerId];
  }

  _key(e, down) {
    const map = {
      "a": "left", "arrowleft": "left",
      "d": "right", "arrowright": "right",
      "w": "jump", " ": "jump", "arrowup": "jump",
      "j": "high", "k": "middle", "l": "low",
      "u": "sp_weak", "i": "sp_medium", "o": "sp_super",
      "g": "guard", "enter": "tap"
    };
    const id = map[e.key.toLowerCase()];
    if (!id) return;
    e.preventDefault();
    if (down && !this.held["kb_" + id]) {
      this.held["kb_" + id] = true;
      this.held[id] = true;
      this.presses.push({ id, time: performance.now() / 1000 });
    } else if (!down) {
      this.held["kb_" + id] = false;
      this.held[id] = false;
    }
  }

  /** 単発押下をすべて取り出す（毎フレーム消費） */
  consumePresses() {
    const p = this.presses;
    this.presses = [];
    return p;
  }
  isHeld(id) { return !!this.held[id]; }
  clear() { this.presses = []; }
}

/* ================================================================
   Fighter: キャラクター状態管理
   ================================================================ */
class Fighter {
  constructor(charData, isPlayer) {
    this.data = charData;
    this.isPlayer = isPlayer;
    this.reset(isPlayer ? 340 : 940, isPlayer ? 1 : -1);
    this.roundWins = 0;
    this.gauge = 0;
  }

  /** ラウンド開始位置に戻す */
  reset(x, facing) {
    this.x = x;
    this.y = CONFIG.GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;          // 1=右向き, -1=左向き
    this.hp = this.data.hp;
    this.maxHp = this.data.hp;
    this.grounded = true;
    this.state = "idle";           // idle/walk/jump/attack/hit/guard/block/dodge/special/ko/win
    this.stateTimer = 0;
    this.attackType = null;        // 現在の攻撃属性
    this.hitFlash = 0;             // 被弾時の白フラッシュ
    this.w = 84;                   // 当たり見た目幅
    this.h = 170;                  // 見た目高さ
  }

  setState(s, t = 0) {
    this.state = s;
    this.stateTimer = t;
  }

  /** 通常時の物理更新（dtはスロー倍率適用済み） */
  update(dt, canMove) {
    // 状態タイマー
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0 && ["hit", "guard", "block", "dodge"].includes(this.state)) {
        this.setState("idle");
      }
    }
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // 移動
    if (canMove) {
      this.x += this.vx * dt * 60;
      this.x = Math.max(CONFIG.STAGE_LEFT, Math.min(CONFIG.STAGE_RIGHT, this.x));
    }

    // ジャンプ・重力
    if (!this.grounded) {
      this.vy += CONFIG.GRAVITY * dt * 60;
      this.y += this.vy * dt * 60;
      if (this.y >= CONFIG.GROUND_Y) {
        this.y = CONFIG.GROUND_Y;
        this.vy = 0;
        this.grounded = true;
        if (this.state === "jump") this.setState("idle");
      }
    }
  }

  jump() {
    if (this.grounded) {
      this.grounded = false;
      this.vy = -this.data.jumpPower;
      this.setState("jump");
    }
  }

  addGauge(n) {
    this.gauge = Math.max(0, Math.min(CONFIG.GAUGE_MAX, this.gauge + n * this.data.gaugeRate));
  }

  takeDamage(dmg) {
    const d = Math.max(1, Math.round(dmg / this.data.defense));
    this.hp = Math.max(0, this.hp - d);
    this.hitFlash = 0.25;
    return d;
  }
}

/* ================================================================
   BattleSystem: 攻防判定・ダメージ・必殺技処理（仕様書22・23節）
   ================================================================ */
class BattleSystem {
  constructor(game) {
    this.game = game;
    this.resetPhase();
  }

  resetPhase() {
    this.attacker = null;
    this.defender = null;
    this.attackType = null;      // high/middle/low
    this.distanceZone = "mid";   // near/mid/far
    this.isFollowUp = false;
    this.followUpCount = 0;
    this.phaseTimer = 0;         // 実時間で進むフェーズタイマー
    this.defenseInput = null;    // 防御側の入力 {type, time}
    this.result = null;          // hit/guard/block/dodge/counter/sp_hit/sp_guard/sp_dodge
    this.resultDamage = 0;
    this.counterButton = null;   // 反撃で押すべきボタン（null=どれでも可）
    this.special = null;         // 使用中の必殺技データ
    this.specialKey = null;
    this.dodgeProgress = 0;      // 回避コマンド入力進行度
    this.dodgeFailed = false;
    this.cpuPlan = null;         // CPUの防御・反撃プラン
  }

  /** 2キャラ間の距離ゾーンを判定（仕様書5.1節） */
  getDistanceZone(a, b) {
    const d = Math.abs(a.x - b.x);
    if (d < CONFIG.DIST_NEAR) return "near";
    if (d < CONFIG.DIST_FAR) return "mid";
    return "far";
  }

  /** 通常攻撃の開始 */
  startAttack(attacker, defender, type, isFollowUp = false) {
    this.attacker = attacker;
    this.defender = defender;
    this.attackType = type;
    this.isFollowUp = isFollowUp;
    if (!isFollowUp) this.followUpCount = 0;
    this.distanceZone = this.getDistanceZone(attacker, defender);
    this.defenseInput = null;
    this.phaseTimer = 0;
    this.result = null;
    attacker.setState("attack");
    attacker.attackType = type;
    this.game.setState(GameState.ATTACK_START);
    // 防御側がCPUなら防御プランを決めておく
    if (!defender.isPlayer) this.cpuPlan = this.game.cpu.planDefense(type);
  }

  /** 必殺技の開始（仕様書12節） */
  startSpecial(attacker, defender, key) {
    const sp = SPECIAL_MOVES[key];
    if (!sp || attacker.gauge < sp.cost) return false;
    attacker.gauge -= sp.cost;
    this.attacker = attacker;
    this.defender = defender;
    this.special = sp;
    this.specialKey = key;
    this.phaseTimer = 0;
    this.dodgeProgress = 0;
    this.dodgeFailed = false;
    this.defenseInput = null;
    this.result = null;
    attacker.setState("special");
    this.game.setState(GameState.SPECIAL);
    this.game.ui.flashMessage(sp.name + "！", attacker.data.color);
    if (!defender.isPlayer) this.cpuPlan = this.game.cpu.planSpecialDefense(key);
    return true;
  }

  /** 通常攻撃の防御判定（仕様書22節のロジックそのまま） */
  resolveDefense(attackType, inputType, inputTime) {
    if (!inputType) return "hit";
    if (inputType !== attackType) return "hit";
    if (inputTime <= CONFIG.JUST_WINDOW) return "block";
    if (inputTime <= CONFIG.DEFENSE_WINDOW) return "guard";
    return "hit";
  }

  /** 通常攻撃ダメージ計算（仕様書8節） */
  calcDamage() {
    let dmg = CONFIG.DMG[this.attackType] || 100;
    if (this.distanceZone === "near") dmg += CONFIG.DMG_NEAR_BONUS;
    if (this.distanceZone === "far") dmg += CONFIG.DMG_FAR_PENALTY;
    dmg *= this.attacker.data.attackPower;
    if (this.isFollowUp) dmg *= CONFIG.FOLLOWUP_DMG_RATE; // 追い討ちは80%
    return dmg;
  }

  /** 防御結果を確定して結果状態へ（仕様書8節・22節） */
  applyResult(result) {
    const g = this.game;
    const atk = this.attacker, def = this.defender;
    this.result = result;
    this.resultDamage = 0;

    switch (result) {
      case "hit": {
        const d = def.takeDamage(this.calcDamage());
        this.resultDamage = d;
        atk.addGauge(CONFIG.GAUGE.attackHit);
        def.addGauge(CONFIG.GAUGE.damaged);
        def.setState("hit", 0.6);
        g.effects.spawn("hit", def.x, def.y - 110);
        g.shake = 10;
        break;
      }
      case "guard": {
        const d = def.takeDamage(this.calcDamage() * CONFIG.GUARD_DMG_RATE);
        this.resultDamage = d;
        atk.addGauge(CONFIG.GAUGE.attackGuarded);
        def.addGauge(CONFIG.GAUGE.guard);
        def.setState("guard", 0.6);
        g.effects.spawn("guard", def.x, def.y - 100);
        g.shake = 4;
        break;
      }
      case "block": {
        def.addGauge(CONFIG.GAUGE.block);
        def.setState("block", 0.6);
        g.effects.spawn("block", def.x, def.y - 100);
        this.counterButton = BTN_TO_ATTACK_BTN(this.attackType);
        break;
      }
      case "dodge": {
        def.addGauge(CONFIG.GAUGE.dodge);
        def.setState("dodge", 0.6);
        g.effects.spawn("dodge", def.x, def.y - 100);
        this.counterButton = null; // 必殺技回避後の反撃はどのボタンでも可
        break;
      }
      case "sp_hit": {
        const d = def.takeDamage(this.special.damage * atk.data.attackPower);
        this.resultDamage = d;
        atk.addGauge(CONFIG.GAUGE.attackHit);
        def.addGauge(CONFIG.GAUGE.damaged);
        def.setState("hit", 0.8);
        g.effects.spawn("special", def.x, def.y - 110);
        g.shake = 18;
        break;
      }
      case "sp_guard": {
        const d = def.takeDamage(this.special.guardDamage); // 削りは固定値（仕様書12節）
        this.resultDamage = d;
        atk.addGauge(CONFIG.GAUGE.attackGuarded);
        def.addGauge(CONFIG.GAUGE.guard);
        def.setState("guard", 0.8);
        g.effects.spawn("guard", def.x, def.y - 100);
        g.shake = 8;
        break;
      }
    }
    g.timeScale = 1;
    g.setState(GameState.RESULT);
    this.phaseTimer = 0;
  }

  /** 結果表示後の分岐（仕様書8・9・10節） */
  afterResult() {
    const g = this.game;

    // KOチェック
    if (this.defender && this.defender.hp <= 0) { g.endRound(); return; }
    if (this.attacker && this.attacker.hp <= 0) { g.endRound(); return; }

    switch (this.result) {
      case "hit":
      case "sp_hit":
        g.setState(GameState.NEUTRAL); // 攻撃側有利（そのまま中立へ）
        break;

      case "guard":
      case "sp_guard":
        // 追い討ちモード（最大2回、2回連続ガードで中立へ）
        if (this.result === "guard" && this.followUpCount < CONFIG.FOLLOWUP_MAX) {
          this.followUpCount++;
          this.phaseTimer = 0;
          g.setState(GameState.FOLLOW_UP);
          if (!this.attacker.isPlayer) this.cpuPlan = this.game.cpu.planFollowUp();
        } else {
          g.setState(GameState.NEUTRAL);
        }
        break;

      case "block":
      case "dodge":
        // 反撃モード（攻守交代のチャンス）
        this.phaseTimer = 0;
        g.setState(GameState.COUNTER);
        if (!this.defender.isPlayer) this.cpuPlan = this.game.cpu.planCounter();
        break;

      case "counter_hit": {
        g.setState(GameState.NEUTRAL); // 反撃成功後は攻守交代して中立へ
        break;
      }
      case "counter_miss":
        g.setState(GameState.NEUTRAL);
        break;

      case "sp_dodge":
        this.phaseTimer = 0;
        g.setState(GameState.COUNTER);
        if (!this.defender.isPlayer) this.cpuPlan = this.game.cpu.planCounter();
        break;

      default:
        g.setState(GameState.NEUTRAL);
    }
  }

  /** 反撃の実行（仕様書10節） */
  executeCounter() {
    const g = this.game;
    const striker = this.defender;   // 反撃するのは防御側
    const target = this.attacker;
    const d = target.takeDamage(CONFIG.COUNTER_DMG * striker.data.attackPower);
    this.resultDamage = d;
    striker.setState("attack", 0.5);
    striker.attackType = "middle";
    target.setState("hit", 0.6);
    g.effects.spawn("hit", target.x, target.y - 110);
    g.shake = 12;
    this.result = "counter_hit";
    g.setState(GameState.RESULT);
    this.phaseTimer = 0;
  }
}

/** 攻撃属性 → 対応する防御/反撃ボタンID */
function BTN_TO_ATTACK_BTN(attackType) {
  return attackType; // high/middle/low はボタンIDと同一
}

/* ================================================================
   エフェクト管理（軽量パーティクル）
   ================================================================ */
class EffectManager {
  constructor() { this.list = []; }
  spawn(type, x, y) {
    this.list.push({ type, x, y, t: 0, life: type === "special" ? 0.7 : 0.45 });
  }
  update(dt) {
    for (const e of this.list) e.t += dt;
    this.list = this.list.filter(e => e.t < e.life);
  }
  draw(ctx, assets) {
    for (const e of this.list) {
      const p = e.t / e.life;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      const imgKey = { hit: "fx_slash", guard: "fx_guard", block: "fx_block", dodge: "fx_dodge", special: "fx_special" }[e.type];
      const img = assets.get(imgKey);
      if (img) {
        const s = 80 + p * 120;
        ctx.drawImage(img, e.x - s / 2, e.y - s / 2, s, s);
      } else {
        // 画像未用意時のフォールバック描画
        if (e.type === "hit" || e.type === "special") {
          const r = 20 + p * (e.type === "special" ? 160 : 90);
          ctx.strokeStyle = e.type === "special" ? "#ffef8a" : "#ffd54d";
          ctx.lineWidth = 6 * (1 - p);
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i + p * 2;
            ctx.beginPath();
            ctx.moveTo(e.x + Math.cos(a) * r * 0.4, e.y + Math.sin(a) * r * 0.4);
            ctx.lineTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r);
            ctx.stroke();
          }
        } else if (e.type === "guard") {
          ctx.strokeStyle = "#5fb2ff";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(e.x, e.y, 40 + p * 30, -1.2, 1.2);
          ctx.stroke();
        } else if (e.type === "block") {
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth = 7 * (1 - p);
          ctx.beginPath();
          ctx.arc(e.x, e.y, 30 + p * 70, 0, Math.PI * 2);
          ctx.stroke();
        } else if (e.type === "dodge") {
          ctx.strokeStyle = "#9df0ff";
          ctx.lineWidth = 4;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(e.x - 50 + i * 20, e.y - 30 - p * 40);
            ctx.lineTo(e.x - 20 + i * 20, e.y + 30 - p * 40);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  }
}

/* ================================================================
   CPUController: CPU思考（仕様書15節）
   ================================================================ */
class CPUController {
  constructor(game, difficulty = "NORMAL") {
    this.game = game;
    this.diff = CPU_DIFFICULTY[difficulty] || CPU_DIFFICULTY.NORMAL;
    this.decisionTimer = 0;
    this.moveDir = 0;
  }

  /** 中立時の行動決定（仕様書15節: 距離別ランダム重み） */
  updateNeutral(dt, cpu, player) {
    this.decisionTimer -= dt;
    // 移動継続
    cpu.vx = this.moveDir * cpu.data.speed;

    if (this.decisionTimer > 0) return null;
    this.decisionTimer = 0.4 + Math.random() * 0.6;

    const zone = this.game.battle.getDistanceZone(cpu, player);
    const r = Math.random();

    // ゲージによる必殺技判断
    if (cpu.gauge >= 10 && Math.random() < 0.35) return { type: "special", key: "super" };
    if (cpu.gauge >= 6 && Math.random() < 0.18) return { type: "special", key: "medium" };
    if (cpu.gauge >= 3 && Math.random() < 0.12) return { type: "special", key: "weak" };

    const dir = player.x > cpu.x ? 1 : -1;
    if (zone === "far") {
      // 遠距離: 接近 / 遠距離攻撃
      if (r < 0.65) { this.moveDir = dir; }
      else { this.moveDir = 0; return { type: "attack", atk: this.randAttack() }; }
    } else if (zone === "mid") {
      // 中距離: 攻撃 / 後退 / ジャンプ
      if (r < 0.4) { this.moveDir = 0; return { type: "attack", atk: this.randAttack() }; }
      else if (r < 0.6) { this.moveDir = -dir; }
      else if (r < 0.75) { cpu.jump(); this.moveDir = dir * 0.5; }
      else { this.moveDir = dir; }
    } else {
      // 近距離: 攻撃 / ガード待ち（=待機）
      if (r < 0.6) { this.moveDir = 0; return { type: "attack", atk: this.randAttack() }; }
      else if (r < 0.8) { this.moveDir = -dir; }
      else { this.moveDir = 0; }
    }
    return null;
  }

  randAttack() {
    const t = ["high", "middle", "low"];
    return t[Math.floor(Math.random() * 3)];
  }

  /** 防御プラン: 正解率・ジャスト率で入力を事前決定 */
  planDefense(attackType) {
    const correct = Math.random() < this.diff.correctRate;
    if (!correct) {
      // 不正解: 間違ったボタン or 未入力
      if (Math.random() < 0.5) return { input: null, time: 999 };
      const wrong = ["high", "middle", "low"].filter(t => t !== attackType);
      return { input: wrong[Math.floor(Math.random() * 2)], time: 0.3 + Math.random() * 0.6 };
    }
    const just = Math.random() < this.diff.justRate;
    if (just) return { input: attackType, time: 0.05 + Math.random() * (CONFIG.JUST_WINDOW - 0.06) };
    return { input: attackType, time: CONFIG.JUST_WINDOW + 0.05 + Math.random() * (CONFIG.DEFENSE_WINDOW - CONFIG.JUST_WINDOW - 0.1) };
  }

  /** 必殺技防御プラン: 回避挑戦 or ガード */
  planSpecialDefense(key) {
    const tryDodge = Math.random() < this.diff.correctRate * 0.7;
    const sp = SPECIAL_MOVES[key];
    if (tryDodge && Math.random() < this.diff.correctRate) {
      return { action: "dodge", time: sp.inputLimit * (0.4 + Math.random() * 0.4) };
    }
    if (Math.random() < 0.85) {
      return { action: "guard", time: sp.inputLimit * (0.3 + Math.random() * 0.4) };
    }
    return { action: "none", time: 999 }; // 稀に棒立ち被弾
  }

  /** 追い討ちプラン */
  planFollowUp() {
    return { attack: Math.random() < 0.85, atk: this.randAttack(), time: 0.3 + Math.random() * 0.7 };
  }

  /** 反撃プラン */
  planCounter() {
    return { success: Math.random() < this.diff.correctRate, time: 0.15 + Math.random() * 0.5 };
  }
}

/* ================================================================
   UIManager: HUD・ボタン・メッセージ描画（仕様書16・17節）
   ================================================================ */
class UIManager {
  constructor(game) {
    this.game = game;
    this.message = null;   // {text, color, t}
    // 操作ボタン定義（タップターゲット≥64px、仕様書24節）
    const B = 118, GAP = 14, Y = 574;
    this.btnDefs = {
      left:  { id: "left",  label: "◀", x: 28,  y: Y, w: B, h: B, hold: true },
      right: { id: "right", label: "▶", x: 28 + B + GAP, y: Y, w: B, h: B, hold: true },
      jump:  { id: "jump",  label: "JUMP", x: 28 + (B + GAP) * 2, y: Y, w: B, h: B },
      high:  { id: "high",   label: "上", x: 1252 - (B + GAP) * 3 + GAP, y: Y, w: B, h: B, color: "#ff8a5f" },
      middle:{ id: "middle", label: "中", x: 1252 - (B + GAP) * 2 + GAP, y: Y, w: B, h: B, color: "#ffd75f" },
      low:   { id: "low",    label: "下", x: 1252 - (B + GAP) + GAP, y: Y, w: B, h: B, color: "#5fd7ff" },
      sp_weak:   { id: "sp_weak",   label: "必殺弱", x: 486, y: 606, w: 96, h: 86, color: "#7fe0a0" },
      sp_medium: { id: "sp_medium", label: "必殺中", x: 592, y: 606, w: 96, h: 86, color: "#e0c07f" },
      sp_super:  { id: "sp_super",  label: "超必殺", x: 698, y: 606, w: 96, h: 86, color: "#ff6f9f" },
      guard: { id: "guard", label: "ガード", x: 60, y: 480, w: 220, h: 130, color: "#7faaff" },
      tap:   { id: "tap", label: "", x: 0, y: 0, w: CONFIG.WIDTH, h: CONFIG.HEIGHT } // タイトル等の全画面タップ
    };
  }

  flashMessage(text, color = "#fff") {
    this.message = { text, color, t: 1.4 };
  }

  update(dt) {
    if (this.message) {
      this.message.t -= dt;
      if (this.message.t <= 0) this.message = null;
    }
    for (const k in this.btnDefs) {
      const b = this.btnDefs[k];
      if (b.flash > 0) b.flash -= dt;
    }
  }

  /** 現在のゲーム状態で有効なボタン群をInputManagerへ登録 */
  activeButtons() {
    const g = this.game;
    const s = g.state;
    const D = this.btnDefs;
    const p = g.player;

    if (s === GameState.TITLE || s === GameState.MENU || s === GameState.GAME_OVER || s === GameState.ROUND_END) {
      return [D.tap];
    }
    if (s === GameState.CHARACTER_SELECT) {
      return g.charSelectButtons || [];
    }
    if (s === GameState.NEUTRAL) {
      const arr = [D.left, D.right, D.jump, D.high, D.middle, D.low];
      if (p && p.gauge >= 3) arr.push(D.sp_weak);
      if (p && p.gauge >= 6) arr.push(D.sp_medium);
      if (p && p.gauge >= 10) arr.push(D.sp_super);
      return arr;
    }
    if (s === GameState.SLOW_DEFENSE) {
      // 防御側がプレイヤーの時のみ上中下
      if (g.battle.defender && g.battle.defender.isPlayer) return [D.high, D.middle, D.low];
      return [];
    }
    if (s === GameState.FOLLOW_UP) {
      if (g.battle.attacker && g.battle.attacker.isPlayer) return [D.high, D.middle, D.low];
      return [];
    }
    if (s === GameState.COUNTER) {
      if (g.battle.defender && g.battle.defender.isPlayer) return [D.high, D.middle, D.low];
      return [];
    }
    if (s === GameState.SPECIAL) {
      if (g.battle.defender && g.battle.defender.isPlayer) return [D.high, D.middle, D.low, D.guard];
      return [];
    }
    return [];
  }

  /* ---------- 描画 ---------- */

  drawButton(ctx, b, highlight = false) {
    ctx.save();
    const r = 18;
    ctx.globalAlpha = 0.85;
    // ボタン背景
    ctx.fillStyle = b.flash > 0 ? "#ffffff" : (highlight ? "rgba(120,200,255,0.35)" : "rgba(10,18,34,0.72)");
    roundRect(ctx, b.x, b.y, b.w, b.h, r);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = b.color || "#6f8fb5";
    roundRect(ctx, b.x, b.y, b.w, b.h, r);
    ctx.stroke();
    // ラベル
    ctx.fillStyle = b.flash > 0 ? "#0a1222" : "#eaf4ff";
    ctx.font = (b.label.length > 2 ? "bold 26px" : "bold 44px") + " sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2);
    ctx.restore();
  }

  drawHUD(ctx) {
    const g = this.game;
    const p = g.player, c = g.cpuFighter;
    if (!p || !c) return;

    // ---- HPバー ----
    const barW = 470, barH = 30, topY = 24;
    this.drawHpBar(ctx, 40, topY, barW, barH, p, false);
    this.drawHpBar(ctx, CONFIG.WIDTH - 40 - barW, topY, barW, barH, c, true);

    // ---- タイマー ----
    ctx.save();
    ctx.fillStyle = "rgba(5,10,20,0.8)";
    roundRect(ctx, CONFIG.WIDTH / 2 - 55, 14, 110, 62, 10);
    ctx.fill();
    ctx.strokeStyle = "#4a6a95";
    ctx.lineWidth = 2;
    roundRect(ctx, CONFIG.WIDTH / 2 - 55, 14, 110, 62, 10);
    ctx.stroke();
    ctx.fillStyle = g.roundTimer <= 10 ? "#ff5a5a" : "#eaf4ff";
    ctx.font = "bold 44px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.max(0, Math.ceil(g.roundTimer))), CONFIG.WIDTH / 2, 46);
    ctx.restore();

    // ---- ラウンド取得表示 ----
    this.drawRoundPips(ctx, 40 + barW - 60, topY + barH + 10, p.roundWins, false);
    this.drawRoundPips(ctx, CONFIG.WIDTH - 40 - barW + 10, topY + barH + 10, c.roundWins, true);

    // ---- ゲージ（10段階オーブ） ----
    this.drawGauge(ctx, 40, topY + barH + 12, p);
    this.drawGauge(ctx, CONFIG.WIDTH - 40 - 10 * 26, topY + barH + 12, c);

    // ---- キャラ名 ----
    ctx.save();
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#9fc3ea";
    ctx.textAlign = "left";
    ctx.fillText(p.data.name, 42, topY + barH + 62);
    ctx.textAlign = "right";
    ctx.fillText(c.data.name + " (CPU)", CONFIG.WIDTH - 42, topY + barH + 62);
    ctx.restore();
  }

  drawHpBar(ctx, x, y, w, h, f, flip) {
    ctx.save();
    ctx.fillStyle = "rgba(5,10,20,0.8)";
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 8);
    ctx.fill();
    const rate = Math.max(0, f.hp / f.maxHp);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    const c1 = rate > 0.35 ? "#37e08a" : "#ff9d3d";
    const c2 = rate > 0.35 ? "#1f9e5c" : "#e05537";
    grad.addColorStop(0, flip ? c2 : c1);
    grad.addColorStop(1, flip ? c1 : c2);
    ctx.fillStyle = grad;
    const fw = w * rate;
    if (flip) ctx.fillRect(x + w - fw, y, fw, h);
    else ctx.fillRect(x, y, fw, h);
    ctx.strokeStyle = "#7f9fc5";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  drawRoundPips(ctx, x, y, wins, flip) {
    ctx.save();
    for (let i = 0; i < CONFIG.ROUNDS_TO_WIN; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 26 + 10, y + 8, 8, 0, Math.PI * 2);
      ctx.fillStyle = i < wins ? "#ffd54d" : "rgba(255,255,255,0.15)";
      ctx.fill();
      ctx.strokeStyle = "#8fa8c9";
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGauge(ctx, x, y, f) {
    ctx.save();
    const full = Math.floor(f.gauge);
    for (let i = 0; i < CONFIG.GAUGE_MAX; i++) {
      const gx = x + i * 26 + 11;
      ctx.beginPath();
      ctx.arc(gx, y + 10, 9, 0, Math.PI * 2);
      if (i < full) {
        // 段階で色変化: 1-2灰青 3-5緑 6-9金 10虹風
        let col = "#5fa0d0";
        if (full >= 10) col = "#ff6fd8";
        else if (i >= 5) col = "#ffd54d";
        else if (i >= 2) col = "#7fe0a0";
        ctx.fillStyle = col;
        ctx.fill();
        ctx.shadowColor = col;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#44608a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** 中央の大メッセージ */
  drawMessage(ctx) {
    if (!this.message) return;
    const m = this.message;
    const a = Math.min(1, m.t / 0.3);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = "bold 58px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.strokeText(m.text, CONFIG.WIDTH / 2, 240);
    ctx.fillStyle = m.color;
    ctx.fillText(m.text, CONFIG.WIDTH / 2, 240);
    ctx.restore();
  }
}

/* 角丸矩形ヘルパー */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ================================================================
   Game: メインループ・シーン管理（仕様書20節）
   ================================================================ */
class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.assets = new AssetManager();
    this.input = new InputManager(this.canvas);
    this.ui = new UIManager(this);
    this.battle = new BattleSystem(this);
    this.effects = new EffectManager();
    this.cpu = new CPUController(this, "NORMAL");

    this.state = GameState.TITLE;
    this.stateTimer = 0;
    this.timeScale = 1;        // スロー攻防でここが0.25になる
    this.shake = 0;            // 画面揺れ
    this.player = null;
    this.cpuFighter = null;
    this.roundNum = 1;
    this.roundTimer = CONFIG.ROUND_TIME;
    this.selectedCharIndex = 0;
    this.titlePulse = 0;

    this._loadAssets();
    this._fitCanvas();
    window.addEventListener("resize", () => this._fitCanvas());
    window.addEventListener("orientationchange", () => setTimeout(() => this._fitCanvas(), 300));

    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }

  /** アスペクト比16:9を維持して表示サイズを調整（内部解像度は固定） */
  _fitCanvas() {
    try {
      const vw = window.innerWidth, vh = window.innerHeight;
      const scale = Math.min(vw / CONFIG.WIDTH, vh / CONFIG.HEIGHT);
      this.canvas.style.width = Math.floor(CONFIG.WIDTH * scale) + "px";
      this.canvas.style.height = Math.floor(CONFIG.HEIGHT * scale) + "px";
    } catch (e) { console.error(e); }
  }

  /** 画像アセット読み込み（未用意でも動作する） */
  _loadAssets() {
    for (const c of CHARACTERS) this.assets.load("char_" + c.id, c.image);
    this.assets.load("bg_stage", "assets/backgrounds/stage_ancient_city.png");
    this.assets.load("title_logo", "assets/ui/title_logo.png");
    this.assets.load("fx_slash", "assets/effects/slash.png");
    this.assets.load("fx_guard", "assets/effects/guard.png");
    this.assets.load("fx_block", "assets/effects/block.png");
    this.assets.load("fx_dodge", "assets/effects/dodge.png");
    this.assets.load("fx_special", "assets/effects/special_flash.png");
  }

  setState(s) {
    this.state = s;
    this.stateTimer = 0;
    this.input.clear(); // 状態遷移時に押しっぱなし誤爆を防ぐ
  }

  /* ---------------- メインループ ---------------- */
  loop(now) {
    try {
      let dtReal = (now - this.lastTime) / 1000;
      this.lastTime = now;
      dtReal = Math.min(dtReal, 0.1); // タブ復帰時の暴走防止
      this.update(dtReal);
      this.render();
    } catch (e) {
      console.error("Game loop error:", e); // エラーでも停止させない
    }
    requestAnimationFrame(t => this.loop(t));
  }

  /* ---------------- 更新 ---------------- */
  update(dtReal) {
    const dt = dtReal * this.timeScale; // ワールド用スロー適用時間
    this.stateTimer += dtReal;
    this.titlePulse += dtReal;
    this.ui.update(dtReal);
    this.effects.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dtReal * 40);

    // 入力当たり判定を状態に応じて更新
    this.input.buttons = this.ui.activeButtons();
    const presses = this.input.consumePresses();

    switch (this.state) {
      case GameState.TITLE:        this.updateTitle(presses); break;
      case GameState.CHARACTER_SELECT: this.updateCharSelect(presses); break;
      case GameState.ROUND_START:  this.updateRoundStart(dt); break;
      case GameState.NEUTRAL:      this.updateNeutral(dt, dtReal, presses); break;
      case GameState.ATTACK_START: this.updateAttackStart(dt, dtReal); break;
      case GameState.SLOW_DEFENSE: this.updateSlowDefense(dt, dtReal, presses); break;
      case GameState.RESULT:       this.updateResult(dt, dtReal); break;
      case GameState.FOLLOW_UP:    this.updateFollowUp(dt, dtReal, presses); break;
      case GameState.COUNTER:      this.updateCounter(dt, dtReal, presses); break;
      case GameState.SPECIAL:      this.updateSpecial(dt, dtReal, presses); break;
      case GameState.ROUND_END:    this.updateRoundEnd(presses); break;
      case GameState.GAME_OVER:    this.updateGameOver(presses); break;
    }
  }

  /* ---- タイトル ---- */
  updateTitle(presses) {
    if (presses.some(p => p.id === "tap")) {
      this.buildCharSelect();
      this.setState(GameState.CHARACTER_SELECT);
    }
  }

  /* ---- キャラクター選択 ---- */
  buildCharSelect() {
    // 8人分のカード（選択可は2人）をボタンとして生成
    this.charSelectButtons = [];
    const cols = 4, cw = 250, ch = 220, gap = 24;
    const startX = (CONFIG.WIDTH - (cols * cw + (cols - 1) * gap)) / 2;
    const startY = 170;
    CHARACTERS.forEach((c, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      this.charSelectButtons.push({
        id: "char_" + i, label: c.name,
        x: startX + col * (cw + gap), y: startY + row * (ch + gap),
        w: cw, h: ch, charIndex: i, disabled: !c.playable
      });
    });
    this.charSelectButtons.push({
      id: "confirm", label: "決定 / FIGHT!",
      x: CONFIG.WIDTH / 2 - 180, y: 640, w: 360, h: 66
    });
  }

  updateCharSelect(presses) {
    for (const p of presses) {
      if (p.id.startsWith("char_")) {
        const idx = parseInt(p.id.split("_")[1], 10);
        if (CHARACTERS[idx] && CHARACTERS[idx].playable) this.selectedCharIndex = idx;
      }
      if (p.id === "confirm") this.startMatch();
    }
  }

  /** 試合開始（プレイヤー選択キャラ vs もう一方の使用可能キャラ） */
  startMatch() {
    const pChar = CHARACTERS[this.selectedCharIndex];
    const others = CHARACTERS.filter(c => c.playable && c.id !== pChar.id);
    const cChar = others.length ? others[Math.floor(Math.random() * others.length)] : CHARACTERS[0];
    this.player = new Fighter(pChar, true);
    this.cpuFighter = new Fighter(cChar, false);
    this.roundNum = 1;
    this.startRound();
  }

  startRound() {
    this.player.reset(340, 1);
    this.cpuFighter.reset(940, -1);
    this.player.gauge = 0;
    this.cpuFighter.gauge = 0;
    this.roundTimer = CONFIG.ROUND_TIME;
    this.timeScale = 1;
    this.battle.resetPhase();
    this.setState(GameState.ROUND_START);
  }

  updateRoundStart(dt) {
    if (this.stateTimer >= CONFIG.ROUND_START_TIME) {
      this.setState(GameState.NEUTRAL);
    }
  }

  /* ---- 中立フェーズ: 移動・ジャンプ・攻撃選択 ---- */
  updateNeutral(dt, dtReal, presses) {
    const p = this.player, c = this.cpuFighter;
    this.roundTimer -= dt;
    if (this.roundTimer <= 0) { this.endRound(true); return; }

    // 向き自動更新
    p.facing = c.x >= p.x ? 1 : -1;
    c.facing = p.x >= c.x ? 1 : -1;

    // プレイヤー移動
    p.vx = 0;
    if (this.input.isHeld("left")) p.vx = -p.data.speed;
    if (this.input.isHeld("right")) p.vx = p.data.speed;
    if (p.vx !== 0 && p.grounded && p.state === "idle") p.setState("walk");
    if (p.vx === 0 && p.state === "walk") p.setState("idle");

    // プレイヤー入力（単発）
    for (const pr of presses) {
      if (pr.id === "jump") p.jump();
      else if (["high", "middle", "low"].includes(pr.id) && p.grounded) {
        this.battle.startAttack(p, c, pr.id);
        return;
      }
      else if (pr.id === "sp_weak" && p.grounded)   { if (this.battle.startSpecial(p, c, "weak")) return; }
      else if (pr.id === "sp_medium" && p.grounded) { if (this.battle.startSpecial(p, c, "medium")) return; }
      else if (pr.id === "sp_super" && p.grounded)  { if (this.battle.startSpecial(p, c, "super")) return; }
    }

    // CPU行動
    const act = this.cpu.updateNeutral(dt, c, p);
    if (act && c.grounded) {
      if (act.type === "attack") { this.battle.startAttack(c, p, act.atk); return; }
      if (act.type === "special") { if (this.battle.startSpecial(c, p, act.key)) return; }
    }

    p.update(dt, true);
    c.update(dt, true);
  }

  /* ---- 攻撃予兆 0.2秒 ---- */
  updateAttackStart(dt, dtReal) {
    this.battle.phaseTimer += dtReal;
    this.player.update(dt, false);
    this.cpuFighter.update(dt, false);
    if (this.battle.phaseTimer >= CONFIG.ATTACK_WINDUP) {
      // スロー攻防開始
      this.timeScale = CONFIG.SLOW_SCALE;
      this.battle.phaseTimer = 0;
      this.setState(GameState.SLOW_DEFENSE);
      if (this.battle.defender.isPlayer) {
        this.ui.flashMessage("防御を選べ！", "#8fd0ff");
      }
    }
  }

  /* ---- スロー攻防（仕様書7節） ---- */
  updateSlowDefense(dt, dtReal, presses) {
    const b = this.battle;
    b.phaseTimer += dtReal; // 判定窓は実時間で計測
    this.player.update(dt, false);
    this.cpuFighter.update(dt, false);

    // 防御側の入力取得
    if (!b.defenseInput) {
      if (b.defender.isPlayer) {
        for (const pr of presses) {
          if (["high", "middle", "low"].includes(pr.id)) {
            b.defenseInput = { type: pr.id, time: b.phaseTimer };
            break;
          }
        }
      } else if (b.cpuPlan && b.phaseTimer >= b.cpuPlan.time) {
        b.defenseInput = { type: b.cpuPlan.input, time: b.cpuPlan.time };
      }
    }

    // 判定確定条件: 入力あり かつ 受付時間内 → 即判定 / 受付終了 → 判定
    if (b.defenseInput && b.defenseInput.type) {
      const r = b.resolveDefense(b.attackType, b.defenseInput.type, b.defenseInput.time);
      b.applyResult(r);
      return;
    }
    if (b.phaseTimer >= CONFIG.DEFENSE_WINDOW) {
      b.applyResult("hit"); // 時間切れ = 被弾
      return;
    }
    // スロー時間終了の保険（受付1.0s < スロー1.2sなので通常ここには来ない）
    if (b.phaseTimer >= CONFIG.SLOW_DURATION) b.applyResult("hit");
  }

  /* ---- 結果表示 ---- */
  updateResult(dt, dtReal) {
    this.battle.phaseTimer += dtReal;
    this.player.update(dt, false);
    this.cpuFighter.update(dt, false);
    if (this.battle.phaseTimer >= CONFIG.RESULT_TIME) {
      this.battle.afterResult();
    }
  }

  /* ---- 追い討ちモード（仕様書9節） ---- */
  updateFollowUp(dt, dtReal, presses) {
    const b = this.battle;
    b.phaseTimer += dtReal;
    this.player.update(dt, false);
    this.cpuFighter.update(dt, false);

    if (b.attacker.isPlayer) {
      for (const pr of presses) {
        if (["high", "middle", "low"].includes(pr.id)) {
          b.startAttack(b.attacker, b.defender, pr.id, true);
          return;
        }
      }
    } else if (b.cpuPlan && b.phaseTimer >= b.cpuPlan.time) {
      if (b.cpuPlan.attack) {
        b.startAttack(b.attacker, b.defender, b.cpuPlan.atk, true);
        return;
      }
      this.setState(GameState.NEUTRAL);
      return;
    }

    if (b.phaseTimer >= CONFIG.FOLLOWUP_WINDOW) {
      this.setState(GameState.NEUTRAL); // 追い討ちせず中立へ
    }
  }

  /* ---- 反撃モード（仕様書10節） ---- */
  updateCounter(dt, dtReal, presses) {
    const b = this.battle;
    b.phaseTimer += dtReal;
    this.player.update(dt, false);
    this.cpuFighter.update(dt, false);

    if (b.defender.isPlayer) {
      for (const pr of presses) {
        if (["high", "middle", "low"].includes(pr.id)) {
          // ブロックした方向と同じボタンのみ反撃成立（仕様書10節・重要仕様）
          if (b.counterButton === null || pr.id === b.counterButton) {
            b.executeCounter();
          } else {
            b.result = "counter_miss";
            this.ui.flashMessage("反撃失敗…", "#8899aa");
            this.setState(GameState.RESULT);
            b.phaseTimer = 0;
          }
          return;
        }
      }
    } else if (b.cpuPlan && b.phaseTimer >= b.cpuPlan.time) {
      if (b.cpuPlan.success) { b.executeCounter(); return; }
      b.cpuPlan = null; // 失敗プラン: 何もしない → 時間切れへ
    }

    if (b.phaseTimer >= CONFIG.COUNTER_WINDOW) {
      this.setState(GameState.NEUTRAL); // 反撃失敗 → 中立
    }
  }

  /* ---- 必殺技フェーズ（仕様書12・13節） ---- */
  updateSpecial(dt, dtReal, presses) {
    const b = this.battle;
    b.phaseTimer += dtReal;
    this.player.update(dt, false);
    this.cpuFighter.update(dt, false);

    // 発動演出0.5秒はスロー化して見せる
    if (b.phaseTimer < 0.5) { this.timeScale = 0.4; return; }
    this.timeScale = CONFIG.SLOW_SCALE;

    const t = b.phaseTimer - 0.5; // コマンド受付経過時間
    const cmd = b.special.dodgeCommand;

    if (b.defender.isPlayer) {
      for (const pr of presses) {
        if (pr.id === "guard") {
          b.applyResult("sp_guard");
          return;
        }
        if (["high", "middle", "low"].includes(pr.id)) {
          const expected = CMD_TO_BTN[cmd[b.dodgeProgress]];
          if (pr.id === expected) {
            b.dodgeProgress++;
            if (b.dodgeProgress >= cmd.length) {
              b.applyResult("dodge"); // 回避成功 → 反撃モードへ
              return;
            }
          } else {
            // 入力ミス = 被弾（仕様書13節）
            b.applyResult("sp_hit");
            return;
          }
        }
      }
    } else if (b.cpuPlan) {
      if (t >= b.cpuPlan.time) {
        if (b.cpuPlan.action === "dodge") { b.applyResult("dodge"); return; }
        if (b.cpuPlan.action === "guard") { b.applyResult("sp_guard"); return; }
        b.cpuPlan = null;
      }
    }

    // 時間切れ = 被弾（ガード扱いではない、仕様書13節）
    if (t >= b.special.inputLimit) {
      b.applyResult("sp_hit");
    }
  }

  /* ---- ラウンド終了 ---- */
  endRound(timeUp = false) {
    const p = this.player, c = this.cpuFighter;
    this.timeScale = 1;
    let winner = null;
    if (timeUp) {
      if (p.hp > c.hp) winner = p;
      else if (c.hp > p.hp) winner = c;
      // 同HPは引き分け再試合
    } else {
      winner = p.hp <= 0 ? c : p;
    }
    this.roundWinner = winner;
    if (winner) winner.roundWins++;
    if (winner) winner.setState("win");
    const loser = winner === p ? c : p;
    if (winner && loser.hp <= 0) loser.setState("ko");
    this.setState(GameState.ROUND_END);
  }

  updateRoundEnd(presses) {
    if (this.stateTimer < CONFIG.ROUND_END_TIME) return;
    const p = this.player, c = this.cpuFighter;
    if (p.roundWins >= CONFIG.ROUNDS_TO_WIN || c.roundWins >= CONFIG.ROUNDS_TO_WIN) {
      this.setState(GameState.GAME_OVER);
    } else {
      this.roundNum++;
      this.startRound();
    }
  }

  updateGameOver(presses) {
    if (this.stateTimer > 0.8 && presses.some(pr => pr.id === "tap")) {
      this.setState(GameState.TITLE);
    }
  }

  /* ================= 描画 ================= */
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // 画面揺れ
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawBackground(ctx);

    if (this.state === GameState.TITLE) { this.drawTitle(ctx); ctx.restore(); return; }
    if (this.state === GameState.CHARACTER_SELECT) { this.drawCharSelect(ctx); ctx.restore(); return; }

    if (this.player && this.cpuFighter) {
      // スロー中の暗転演出
      const inSlow = [GameState.SLOW_DEFENSE, GameState.SPECIAL].includes(this.state);
      if (inSlow) {
        ctx.fillStyle = "rgba(2,6,20,0.55)";
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      }

      this.drawFighter(ctx, this.player);
      this.drawFighter(ctx, this.cpuFighter);
      this.effects.draw(ctx, this.assets);
      this.ui.drawHUD(ctx);
      this.drawPhaseUI(ctx);
      this.drawButtons(ctx);
      this.ui.drawMessage(ctx);
      this.drawOverlays(ctx);
    }
    ctx.restore();
  }

  drawBackground(ctx) {
    const bg = this.assets.get("bg_stage");
    if (bg) {
      ctx.drawImage(bg, 0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      return;
    }
    // フォールバック: 蒼を基調とした古代都市風グラデーション
    const g = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
    g.addColorStop(0, "#060a1c");
    g.addColorStop(0.55, "#0e1e42");
    g.addColorStop(0.75, "#173257");
    g.addColorStop(1, "#0a1226");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    // 月
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#cfe3ff";
    ctx.shadowColor = "#8fb8ff";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(1020, 130, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 遠景シルエット
    ctx.fillStyle = "#091530";
    for (let i = 0; i < 9; i++) {
      const x = i * 150 - 20, w = 90 + (i % 3) * 40, h = 140 + ((i * 53) % 160);
      ctx.fillRect(x, CONFIG.GROUND_Y - h, w, h);
    }
    // 地面
    ctx.fillStyle = "#111c33";
    ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.WIDTH, CONFIG.HEIGHT - CONFIG.GROUND_Y);
    ctx.strokeStyle = "#2f4a75";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.GROUND_Y);
    ctx.lineTo(CONFIG.WIDTH, CONFIG.GROUND_Y);
    ctx.stroke();
  }

  /** キャラ描画: 画像があれば画像、無ければ仮キャラ（矩形+装飾） */
  drawFighter(ctx, f) {
    ctx.save();
    const img = this.assets.get("char_" + f.data.id);
    const x = f.x, y = f.y;

    // 被弾フラッシュ
    const flash = f.hitFlash > 0;

    // 影
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, CONFIG.GROUND_Y + 8, 55, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (img) {
      // 画像差し替え時: 足元基準・向きで反転
      ctx.translate(x, y);
      ctx.scale(f.facing, 1);
      if (flash) ctx.globalAlpha = 0.6;
      ctx.drawImage(img, -f.w / 2 - 20, -f.h - 10, f.w + 40, f.h + 10);
      ctx.restore();
      this.drawFighterFx(ctx, f);
      return;
    }

    // ---- 仮キャラ描画 ----
    ctx.translate(x, y);
    ctx.scale(f.facing, 1);

    const bodyCol = flash ? "#ffffff" : f.data.color;
    const darkCol = flash ? "#dddddd" : f.data.color2;
    let lean = 0;
    if (f.state === "attack" || f.state === "special") lean = 14;
    if (f.state === "hit") lean = -12;
    if (f.state === "walk") lean = 4;
    if (f.state === "ko") lean = -40;

    ctx.rotate(lean * Math.PI / 180 * 0.4);

    // 脚
    ctx.fillStyle = darkCol;
    roundRect(ctx, -30, -70, 24, 70, 8); ctx.fill();
    roundRect(ctx, 8, -70, 24, 70, 8); ctx.fill();
    // 胴体
    ctx.fillStyle = bodyCol;
    roundRect(ctx, -34, -145, 68, 82, 14); ctx.fill();
    // 帯
    ctx.fillStyle = darkCol;
    ctx.fillRect(-34, -84, 68, 12);
    // 頭
    ctx.fillStyle = flash ? "#fff" : "#ffe0c4";
    ctx.beginPath();
    ctx.arc(6, -168, 24, 0, Math.PI * 2);
    ctx.fill();
    // 髪
    ctx.fillStyle = darkCol;
    ctx.beginPath();
    ctx.arc(2, -176, 24, Math.PI * 0.9, Math.PI * 2.05);
    ctx.fill();
    // 目
    ctx.fillStyle = "#111";
    ctx.fillRect(14, -172, 6, 6);

    // 腕（攻撃時は攻撃属性の高さに突き出す）
    ctx.fillStyle = bodyCol;
    ctx.strokeStyle = darkCol;
    if (f.state === "attack" || f.state === "special") {
      const armY = f.attackType === "high" ? -150 : f.attackType === "low" ? -50 : -110;
      roundRect(ctx, 20, armY - 10, 78, 22, 10); ctx.fill();
      // 攻撃の軌跡
      ctx.strokeStyle = f.state === "special" ? "#ffef8a" : "#bfe6ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(60, armY, 46, -0.8, 0.8);
      ctx.stroke();
    } else if (f.state === "guard" || f.state === "block") {
      roundRect(ctx, 24, -130, 20, 56, 8); ctx.fill();
      ctx.strokeStyle = f.state === "block" ? "#ffd700" : "#5fb2ff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(52, -105, 42, -1.3, 1.3);
      ctx.stroke();
    } else {
      roundRect(ctx, 22, -138, 20, 60, 8); ctx.fill();
    }
    ctx.restore();
    this.drawFighterFx(ctx, f);
  }

  /** キャラ付随の共通演出（回避残像など） */
  drawFighterFx(ctx, f) {
    if (f.state === "dodge") {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#9df0ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(f.x - 50 - f.facing * 30, f.y - f.h, 100, f.h);
      ctx.restore();
    }
  }

  /** フェーズごとの中央指示UI（仕様書16節） */
  drawPhaseUI(ctx) {
    const b = this.battle;
    const s = this.state;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (s === GameState.ROUND_START) {
      const t = this.stateTimer;
      ctx.font = "bold 84px sans-serif";
      ctx.fillStyle = "#eaf4ff";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 10;
      if (t < 1.3) {
        ctx.strokeText("ROUND " + this.roundNum, CONFIG.WIDTH / 2, 300);
        ctx.fillText("ROUND " + this.roundNum, CONFIG.WIDTH / 2, 300);
      } else {
        ctx.fillStyle = "#ff5a5a";
        ctx.strokeText("FIGHT!", CONFIG.WIDTH / 2, 300);
        ctx.fillText("FIGHT!", CONFIG.WIDTH / 2, 300);
      }
    }

    if (s === GameState.SLOW_DEFENSE && b.defender && b.defender.isPlayer) {
      // 防御指示 + 残り時間バー
      ctx.font = "bold 54px sans-serif";
      ctx.fillStyle = "#8fd0ff";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 8;
      ctx.strokeText("防御を選べ！", CONFIG.WIDTH / 2, 170);
      ctx.fillText("防御を選べ！", CONFIG.WIDTH / 2, 170);
      // 攻撃属性の高さヒント（攻撃側の腕位置で判別可能だが視覚補助として攻撃者側に光点）
      this.drawTimeBar(ctx, b.phaseTimer, CONFIG.DEFENSE_WINDOW, CONFIG.JUST_WINDOW);
    }

    if (s === GameState.FOLLOW_UP && b.attacker && b.attacker.isPlayer) {
      ctx.font = "bold 46px sans-serif";
      ctx.fillStyle = "#ffb05f";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 8;
      const txt = "追い討ちチャンス！（" + b.followUpCount + "/" + CONFIG.FOLLOWUP_MAX + "）";
      ctx.strokeText(txt, CONFIG.WIDTH / 2, 170);
      ctx.fillText(txt, CONFIG.WIDTH / 2, 170);
    }

    if (s === GameState.COUNTER && b.defender && b.defender.isPlayer) {
      ctx.font = "bold 50px sans-serif";
      ctx.fillStyle = "#ffd54d";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 8;
      const need = b.counterButton ? "「" + ATTACK_LABEL[b.counterButton] + "」で" : "";
      ctx.strokeText("反撃！" + need + "攻撃！", CONFIG.WIDTH / 2, 170);
      ctx.fillText("反撃！" + need + "攻撃！", CONFIG.WIDTH / 2, 170);
      this.drawTimeBar(ctx, b.phaseTimer, CONFIG.COUNTER_WINDOW, 0);
    }

    if (s === GameState.SPECIAL && b.defender && b.defender.isPlayer && b.phaseTimer >= 0.5) {
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#ff8fb0";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 8;
      ctx.strokeText("回避コマンド入力！（またはガード）", CONFIG.WIDTH / 2, 150);
      ctx.fillText("回避コマンド入力！（またはガード）", CONFIG.WIDTH / 2, 150);
      // コマンド表示: 入力済みは点灯
      const cmd = b.special.dodgeCommand;
      const cw = 86, gap = 26;
      const total = cmd.length * cw + (cmd.length - 1) * gap;
      let cx = CONFIG.WIDTH / 2 - total / 2;
      for (let i = 0; i < cmd.length; i++) {
        const done = i < b.dodgeProgress;
        ctx.fillStyle = done ? "#7fe0a0" : "rgba(10,18,34,0.85)";
        roundRect(ctx, cx, 190, cw, cw, 16);
        ctx.fill();
        ctx.strokeStyle = done ? "#b8ffd4" : "#6f8fb5";
        ctx.lineWidth = 3;
        roundRect(ctx, cx, 190, cw, cw, 16);
        ctx.stroke();
        ctx.fillStyle = done ? "#0a1a10" : "#eaf4ff";
        ctx.font = "bold 42px sans-serif";
        ctx.fillText(CMD_LABEL[cmd[i]], cx + cw / 2, 190 + cw / 2 + 2);
        // 矢印
        if (i < cmd.length - 1) {
          ctx.fillStyle = "#8fa8c9";
          ctx.font = "bold 30px sans-serif";
          ctx.fillText("→", cx + cw + gap / 2, 190 + cw / 2);
        }
        cx += cw + gap;
      }
      this.drawTimeBar(ctx, b.phaseTimer - 0.5, b.special.inputLimit, 0, 310);
    }

    if (s === GameState.RESULT) {
      const label = {
        hit: "HIT!", guard: "GUARD", block: "BLOCK!!", dodge: "DODGE!!",
        sp_hit: "DIRECT HIT!!", sp_guard: "GUARD（削り）",
        counter_hit: "COUNTER!!", counter_miss: ""
      }[b.result] || "";
      const col = {
        hit: "#ff6a5f", guard: "#5fb2ff", block: "#ffd700", dodge: "#9df0ff",
        sp_hit: "#ff3d6a", sp_guard: "#5fb2ff", counter_hit: "#ffd54d"
      }[b.result] || "#fff";
      if (label) {
        const sc = 1 + Math.max(0, 0.3 - b.phaseTimer) * 3;
        ctx.font = "bold " + Math.round(72 * sc) + "px sans-serif";
        ctx.fillStyle = col;
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.lineWidth = 10;
        ctx.strokeText(label, CONFIG.WIDTH / 2, 280);
        ctx.fillText(label, CONFIG.WIDTH / 2, 280);
        if (b.resultDamage > 0) {
          ctx.font = "bold 40px monospace";
          ctx.fillStyle = "#fff";
          ctx.strokeText("-" + b.resultDamage, CONFIG.WIDTH / 2, 345);
          ctx.fillText("-" + b.resultDamage, CONFIG.WIDTH / 2, 345);
        }
      }
    }

    if (s === GameState.ROUND_END) {
      ctx.font = "bold 90px sans-serif";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 12;
      const w = this.roundWinner;
      const txt = w ? (w.isPlayer ? "YOU WIN" : "YOU LOSE") : "DRAW";
      const isKo = w && (this.player.hp <= 0 || this.cpuFighter.hp <= 0);
      if (this.stateTimer < 1.1 && isKo) {
        ctx.fillStyle = "#ff3d3d";
        ctx.strokeText("K.O.", CONFIG.WIDTH / 2, 300);
        ctx.fillText("K.O.", CONFIG.WIDTH / 2, 300);
      } else {
        ctx.fillStyle = w && w.isPlayer ? "#7fe0a0" : "#ff8a8a";
        ctx.strokeText(txt, CONFIG.WIDTH / 2, 300);
        ctx.fillText(txt, CONFIG.WIDTH / 2, 300);
      }
    }

    if (s === GameState.GAME_OVER) {
      const p = this.player;
      const won = p.roundWins >= CONFIG.ROUNDS_TO_WIN;
      ctx.font = "bold 96px sans-serif";
      ctx.fillStyle = won ? "#ffd54d" : "#8899bb";
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineWidth = 12;
      const txt = won ? "VICTORY!" : "DEFEAT…";
      ctx.strokeText(txt, CONFIG.WIDTH / 2, 280);
      ctx.fillText(txt, CONFIG.WIDTH / 2, 280);
      if (this.stateTimer > 0.8) {
        ctx.font = "bold 30px sans-serif";
        ctx.fillStyle = "#cfe3ff";
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.titlePulse * 4);
        ctx.fillText("タップでタイトルへ", CONFIG.WIDTH / 2, 400);
      }
    }
    ctx.restore();
  }

  /** 入力残り時間バー（ジャスト帯付き） */
  drawTimeBar(ctx, elapsed, total, justWindow, y = 220) {
    const w = 420, h = 16;
    const x = CONFIG.WIDTH / 2 - w / 2;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 8);
    ctx.fill();
    // ジャスト帯（緑）
    if (justWindow > 0) {
      ctx.fillStyle = "rgba(127,224,160,0.5)";
      ctx.fillRect(x, y, w * (justWindow / total), h);
    }
    // 残量
    const rate = Math.max(0, 1 - elapsed / total);
    ctx.fillStyle = rate > 0.3 ? "#8fd0ff" : "#ff7a5f";
    ctx.fillRect(x, y, w * rate, h);
    ctx.strokeStyle = "#7f9fc5";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  /** 操作ボタン描画 */
  drawButtons(ctx) {
    const btns = this.input.buttons;
    const p = this.player;
    for (const b of btns) {
      if (b.id === "tap" || b.id.startsWith("char_") || b.id === "confirm") continue;
      let hl = false;
      // 反撃時に押すべきボタンを点滅ハイライト
      if (this.state === GameState.COUNTER && this.battle.counterButton === b.id) {
        hl = Math.sin(this.titlePulse * 12) > 0;
      }
      this.ui.drawButton(ctx, b, hl);
      // ゲージ必要量表示
      if (b.id.startsWith("sp_") && p) {
        const cost = { sp_weak: 3, sp_medium: 6, sp_super: 10 }[b.id];
        ctx.save();
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#0a1222";
        ctx.textAlign = "center";
        ctx.fillStyle = "#cfe3ff";
        ctx.fillText("G" + cost, b.x + b.w / 2, b.y - 8);
        ctx.restore();
      }
    }
  }

  drawOverlays(ctx) {
    // 追い討ち中の攻撃側がCPUなら注意表示
    const b = this.battle;
    if (this.state === GameState.FOLLOW_UP && b.attacker && !b.attacker.isPlayer) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "bold 40px sans-serif";
      ctx.fillStyle = "#ff8a8a";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 7;
      ctx.strokeText("相手の追い討ちに備えろ！", CONFIG.WIDTH / 2, 170);
      ctx.fillText("相手の追い討ちに備えろ！", CONFIG.WIDTH / 2, 170);
      ctx.restore();
    }
  }

  /* ---- タイトル画面 ---- */
  drawTitle(ctx) {
    ctx.save();
    // 蒼い炎の演出
    for (let i = 0; i < 14; i++) {
      const fx = 120 + i * 80 + Math.sin(this.titlePulse * 2 + i) * 14;
      const fh = 60 + Math.sin(this.titlePulse * 3 + i * 1.7) * 30;
      const g = ctx.createLinearGradient(0, CONFIG.HEIGHT, 0, CONFIG.HEIGHT - 200);
      g.addColorStop(0, "rgba(40,120,255,0.25)");
      g.addColorStop(1, "rgba(40,120,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(fx, CONFIG.HEIGHT - 40, 30, fh + 60, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const logo = this.assets.get("title_logo");
    if (logo) {
      ctx.drawImage(logo, CONFIG.WIDTH / 2 - 350, 150, 700, 260);
    } else {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 120px serif";
      ctx.shadowColor = "#3f8fff";
      ctx.shadowBlur = 36;
      ctx.fillStyle = "#dcecff";
      ctx.fillText("蒼炎決戦", CONFIG.WIDTH / 2, 250);
      ctx.shadowBlur = 0;
      ctx.font = "26px sans-serif";
      ctx.fillStyle = "#7fa8d8";
      ctx.fillText("— SOUEN KESSEN —", CONFIG.WIDTH / 2, 340);
    }
    ctx.textAlign = "center";
    ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = "#eaf4ff";
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(this.titlePulse * 4);
    ctx.fillText("画面をタップしてスタート", CONFIG.WIDTH / 2, 500);
    ctx.globalAlpha = 1;
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#5a7ba6";
    ctx.fillText("1P vs CPU ／ 横画面推奨 ／ v1.0 MVP", CONFIG.WIDTH / 2, 680);
    ctx.restore();
  }

  /* ---- キャラクター選択画面 ---- */
  drawCharSelect(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 46px sans-serif";
    ctx.fillStyle = "#eaf4ff";
    ctx.fillText("キャラクター選択", CONFIG.WIDTH / 2, 100);

    for (const b of (this.charSelectButtons || [])) {
      if (b.id === "confirm") {
        ctx.fillStyle = "#1f4d8a";
        roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
        ctx.strokeStyle = "#8fd0ff";
        ctx.lineWidth = 3;
        roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.stroke();
        ctx.fillStyle = "#eaf4ff";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2);
        continue;
      }
      const c = CHARACTERS[b.charIndex];
      const selected = b.charIndex === this.selectedCharIndex;
      // カード
      ctx.fillStyle = c.playable ? "rgba(12,22,44,0.9)" : "rgba(8,10,16,0.9)";
      roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill();
      ctx.strokeStyle = selected ? "#ffd54d" : (c.playable ? c.color : "#333c4d");
      ctx.lineWidth = selected ? 5 : 2.5;
      roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.stroke();
      // ポートレート（画像 or 仮矩形）
      const img = this.assets.get("char_" + c.id);
      if (img) {
        ctx.drawImage(img, b.x + b.w / 2 - 55, b.y + 20, 110, 120);
      } else {
        ctx.fillStyle = c.playable ? c.color : "#2a2f3a";
        roundRect(ctx, b.x + b.w / 2 - 40, b.y + 30, 80, 100, 10); ctx.fill();
        ctx.fillStyle = c.playable ? "#ffe0c4" : "#454b58";
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + 42, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = c.playable ? "#eaf4ff" : "#5a6478";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(c.name, b.x + b.w / 2, b.y + 168);
      ctx.font = "15px sans-serif";
      ctx.fillStyle = c.playable ? "#8fa8c9" : "#454e60";
      ctx.fillText(c.playable ? this.typeLabel(c.type) : "COMING SOON", b.x + b.w / 2, b.y + 196);
    }
    ctx.restore();
  }

  typeLabel(t) {
    return {
      standard: "スタンダード", speed: "スピード型", power: "パワー型", grappler: "投げ型",
      zoner: "遠距離型", tricky: "トリッキー型", counter: "カウンター型", boss: "ボス型"
    }[t] || t;
  }
}

/* ================================================================
   起動
   ================================================================ */
window.addEventListener("load", () => {
  try {
    new Game();
  } catch (e) {
    console.error("Game init failed:", e);
    document.body.innerHTML = "<p style='color:#fff;font-family:sans-serif;padding:20px'>起動エラーが発生しました。リロードしてください。</p>";
  }
});
