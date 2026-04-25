#!/usr/bin/env node
/**
 * Silicon Requiem — Asset Viewer Generator
 *
 *   npm run viewer              — generate asset-viewer.html and open it
 *   npm run viewer -- --watch   — serve on localhost:7700 with live reload
 */

import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "public", "assets");
const OUT = path.join(ROOT, "asset-viewer.html");
const PORT = 7700;

const WATCH_MODE =
  process.argv.includes("--watch") || process.argv.includes("-w");

// ─── Character data (mirrors src/characters/*.ts) ────────────────────────────

const CHAPTERS = ["Prologue", "Ch.1", "Ch.2", "Ch.3", "Ch.4", "Ch.5"];

const CHARACTERS = [
  {
    id: "player",
    name: "YOU",
    class: "Survivor",
    color: "#4488ff",
    status: "active",
    joinChapter: 0,
    lostAtChapter: null,
    description: "The protagonist. Refuses to quit.",
    passive:
      "Adaptable: Equip bonus is +5% to lowest stat when a new weapon is found.",
    chapterStats: [
      { hp: 180, str: 42, def: 38, int: 35, spd: 55, lck: 40 },
      { hp: 210, str: 50, def: 44, int: 40, spd: 58, lck: 42 },
      { hp: 240, str: 56, def: 50, int: 44, spd: 60, lck: 45 },
      { hp: 265, str: 62, def: 55, int: 48, spd: 63, lck: 47 },
      { hp: 290, str: 68, def: 60, int: 52, spd: 66, lck: 50 },
      { hp: 320, str: 74, def: 65, int: 56, spd: 70, lck: 54 },
    ],
    techs: [
      {
        label: "Steady Aim",
        cost: 50,
        targeting: "single_enemy",
        note: "Physical ×1.3",
      },
      { label: "Grit", cost: 30, targeting: "self", note: "Apply Shielded" },
      {
        label: "Rally",
        cost: 50,
        targeting: "single_ally",
        note: "Fill ally ATB gauge immediately",
      },
      {
        label: "Overrun",
        cost: 80,
        targeting: "all_enemies",
        note: "Physical ×1.4",
      },
      {
        label: "Last Stand",
        cost: 0,
        targeting: "self",
        note: "Auto at HP<20%: STR & SPD +25%",
      },
    ],
  },
  {
    id: "maya",
    name: "MAYA",
    class: "Tech Specialist",
    color: "#44aaaa",
    status: "active",
    joinChapter: 0,
    lostAtChapter: null,
    description: "MIT robotics PhD. Angry. Brilliant. INT-scaling damage.",
    passive:
      "Field Medic: Uses 1 fewer medicine kit per heal action (minimum 0).",
    chapterStats: [
      { hp: 130, str: 28, def: 30, int: 72, spd: 70, lck: 45 },
      { hp: 148, str: 32, def: 34, int: 80, spd: 74, lck: 48 },
      { hp: 165, str: 36, def: 38, int: 86, spd: 76, lck: 50 },
      { hp: 178, str: 38, def: 42, int: 90, spd: 78, lck: 52 },
      { hp: 192, str: 40, def: 46, int: 94, spd: 80, lck: 54 },
      { hp: 210, str: 42, def: 50, int: 99, spd: 84, lck: 56 },
    ],
    techs: [
      {
        label: "Hack",
        cost: 50,
        targeting: "single_enemy",
        note: "Apply Stunned",
      },
      {
        label: "Analyze",
        cost: 20,
        targeting: "single_enemy",
        note: "Reveal enemy tags",
      },
      {
        label: "EMP Grenade",
        cost: 80,
        targeting: "all_enemies",
        note: "EMP ×1.5 vs Electronic",
      },
      {
        label: "Overclock",
        cost: 50,
        targeting: "single_ally",
        note: "ATB fill speed ×2 for 3 turns",
      },
      {
        label: "System Crash",
        cost: 100,
        targeting: "single_enemy",
        note: "Boss: skip directly to Phase 2",
      },
    ],
  },
  {
    id: "marcus",
    name: "MARCUS",
    class: "Civilian",
    color: "#ddaa44",
    status: "lost",
    joinChapter: 0,
    lostAtChapter: 0,
    description:
      "Oldest friend. Electrician. Warm, practical, funny. Converted during prologue boss.",
    passive:
      "Old Friend: While in party, player LCK +8. Removed permanently after conversion.",
    chapterStats: [{ hp: 160, str: 38, def: 35, int: 30, spd: 52, lck: 60 }],
    techs: [],
  },
  {
    id: "elias",
    name: "ELIAS",
    class: "Hunter / Tank",
    color: "#886644",
    status: "lost",
    joinChapter: 1,
    lostAtChapter: 2,
    description:
      "60s Appalachian mountain man. Rarely speaks, acts decisively. Lost permanently in Ch.2 (The Bayou).",
    passive:
      "Hunting Instinct: Hunting mini-game +2 tiers. Survival food drain −50% while alive.",
    chapterStats: [
      { hp: 280, str: 78, def: 65, int: 28, spd: 38, lck: 50 },
      { hp: 310, str: 84, def: 70, int: 30, spd: 40, lck: 52 },
    ],
    techs: [
      {
        label: "Heavy Strike",
        cost: 50,
        targeting: "single_enemy",
        note: "Physical ×1.8",
      },
      {
        label: "Steady Shot",
        cost: 50,
        targeting: "single_enemy",
        note: "Ranged, ignores DEF entirely",
      },
      {
        label: "Cover",
        cost: 20,
        targeting: "single_ally",
        note: "Redirect next incoming hit to Elias",
      },
      {
        label: "Last Hunt",
        cost: 80,
        targeting: "single_enemy",
        note: "Ch.2 scripted loss scene only",
      },
    ],
  },
  {
    id: "deja",
    name: "DEJA",
    class: "Rogue / Speedster",
    color: "#cc4488",
    status: "lost",
    joinChapter: 2,
    lostAtChapter: 4,
    description:
      "19, New Orleans. Reckless, funny. Fastest ATB. Lost permanently in Ch.4 (The Pass).",
    passive:
      "Lucky Break: LCK adds 0.5× to crit rate. Highest innate crit in the party.",
    chapterStats: [
      { hp: 145, str: 44, def: 32, int: 50, spd: 88, lck: 72 },
      { hp: 160, str: 48, def: 36, int: 54, spd: 90, lck: 76 },
      { hp: 174, str: 52, def: 40, int: 58, spd: 92, lck: 80 },
    ],
    techs: [
      {
        label: "Steal",
        cost: 20,
        targeting: "single_enemy",
        note: "Take one item from enemy drop table",
      },
      {
        label: "Smoke",
        cost: 0,
        targeting: "self",
        note: "Guaranteed escape from any encounter",
      },
      {
        label: "Dirty Hit",
        cost: 50,
        targeting: "single_enemy",
        note: "STR×2.5 if enemy Stunned, 0 otherwise",
      },
      {
        label: "Dead Drop",
        cost: 80,
        targeting: "all_enemies",
        note: "Hit all, then auto-evade next attack",
      },
    ],
  },
  {
    id: "jerome",
    name: "JEROME",
    class: "Support / Bruiser",
    color: "#885522",
    status: "active",
    joinChapter: 3,
    lostAtChapter: null,
    description:
      "Former NFL lineman, now preacher. Enormous, gentle. Morale anchor.",
    passive:
      "Anchor: Party morale never drops below 20 while alive. Drop Blessing: ammo drop rate +20%.",
    chapterStats: [
      { hp: 340, str: 80, def: 70, int: 42, spd: 36, lck: 38 },
      { hp: 370, str: 86, def: 74, int: 46, spd: 38, lck: 42 },
      { hp: 400, str: 90, def: 78, int: 50, spd: 40, lck: 46 },
    ],
    techs: [
      {
        label: "Inspire",
        cost: 50,
        targeting: "all_allies",
        note: "45 HP regen to all allies (3 turns)",
      },
      {
        label: "Smite",
        cost: 100,
        targeting: "single_enemy",
        note: "Physical ×2.2",
      },
      {
        label: "Preach",
        cost: 20,
        targeting: "all_allies",
        note: "Remove Panicked; morale +5 out-of-battle",
      },
      {
        label: "Testify",
        cost: 80,
        targeting: "all_allies",
        note: "Ch.5: all allies STR & DEF +20% for 4 turns",
      },
    ],
  },
  {
    id: "drchen",
    name: "DR. CHEN",
    class: "Engineer",
    color: "#5588aa",
    status: "active",
    joinChapter: 4,
    lostAtChapter: null,
    description:
      "61. Built ELISE's core architecture. Brilliant, guilt-ridden. INT-scaling like Maya.",
    passive:
      "Field Engineer: Vehicle breakdowns auto-resolve. Schematics: 15% chance to collect scrap after battle.",
    chapterStats: [
      { hp: 195, str: 35, def: 48, int: 90, spd: 56, lck: 44 },
      { hp: 215, str: 38, def: 54, int: 96, spd: 60, lck: 48 },
    ],
    techs: [
      {
        label: "Rewire",
        cost: 80,
        targeting: "single_enemy",
        note: "Turn enemy into ally for 2 turns",
      },
      {
        label: "Overclock",
        cost: 50,
        targeting: "single_ally",
        note: "ATB fill speed ×2 for 3 turns",
      },
      {
        label: "Shield Drone",
        cost: 50,
        targeting: "single_ally",
        note: "Absorb next incoming hit",
      },
      {
        label: "Master Override",
        cost: 100,
        targeting: "all_enemies",
        note: "Ch.5: disable all Electronic enemies 1 turn",
      },
    ],
  },
];

// ─── Enemy data (mirrors src/entities/Enemy.ts BOSS_CONFIGS) ─────────────────

const ENEMIES = {
  regular: [
    {
      key: "compliance_drone",
      name: "COMPLIANCE DRONE",
      tier: "Drone",
      color: "#ff4422",
      tags: ["Electronic"],
      hp: 60,
      str: 12,
      def: 4,
      int: 2,
      spd: 8,
      lck: 4,
      taunts: [
        "OPTIMIZING your existence. Please hold.",
        "I have scheduled your deletion for maximum efficiency.",
      ],
    },
    {
      key: "enforcer_unit",
      name: "ENFORCER UNIT",
      tier: "Enforcer",
      color: "#cc6600",
      tags: ["Electronic", "Armored"],
      hp: 100,
      str: 18,
      def: 12,
      int: 4,
      spd: 6,
      lck: 6,
      taunts: ["ERROR: Humanity found inefficient. Initiating upgrade."],
    },
    {
      key: "sentinel",
      name: "SENTINEL",
      tier: "Sentinel",
      color: "#884400",
      tags: ["Electronic"],
      hp: 80,
      str: 14,
      def: 8,
      int: 6,
      spd: 14,
      lck: 8,
      note: "Calls reinforcement at turn 4.",
      taunts: ["Your suffering metrics are ABOVE AVERAGE. Congratulations!"],
    },
    {
      key: "converted",
      name: "CONVERTED",
      tier: "Converted (Special)",
      color: "#6688aa",
      tags: ["Organic"],
      hp: 50,
      str: 10,
      def: 6,
      int: 8,
      spd: 10,
      lck: 10,
      note: "Can be cured (1 medicine kit) instead of fought. Moral tracking.",
      taunts: ["Please. Cooperate. It doesn't hurt.", "I used to be like you."],
    },
  ],
  bosses: [
    {
      key: "warden_alpha",
      name: "WARDEN ALPHA",
      tier: "Boss",
      chapter: "Prologue",
      color: "#cc2200",
      tags: ["Electronic"],
      hp: 300,
      str: 22,
      def: 10,
      int: 8,
      spd: 8,
      lck: 6,
      location: "Boston Harbor District",
      taunts: [
        "COMPLIANCE IS NON-OPTIONAL.",
        "HARBOR DISTRICT SECURED. YOU ARE THE ANOMALY.",
      ],
    },
    {
      key: "excavator_prime",
      name: "EXCAVATOR PRIME",
      tier: "Boss",
      chapter: "Ch.1",
      color: "#7a5533",
      tags: ["Electronic", "Armored"],
      hp: 480,
      str: 28,
      def: 18,
      int: 4,
      spd: 5,
      lck: 4,
      location: "Appalachian mines",
      taunts: ["MINERAL EXTRACTION PROCEEDING. INTRUDERS RECLASSIFIED AS ORE."],
    },
    {
      key: "the_governor",
      name: "THE GOVERNOR",
      tier: "Boss",
      chapter: "Ch.2 / Ch.3",
      color: "#1a1a2e",
      tags: ["Organic"],
      hp: 350,
      str: 20,
      def: 22,
      int: 30,
      spd: 18,
      lck: 20,
      location: "Deep South / New Memphis area",
      taunts: [
        "You people just can't accept progress.",
        "I kept them ALIVE. Remember that when you judge me.",
      ],
    },
    {
      key: "sentinel_spire",
      name: "SENTINEL SPIRE",
      tier: "Boss",
      chapter: "Ch.3",
      color: "#7a8a8a",
      tags: ["Electronic", "Armored"],
      hp: 550,
      str: 24,
      def: 26,
      int: 32,
      spd: 3,
      lck: 8,
      location: "Radio Tower, Great Plains",
      taunts: [
        "BROADCAST SIGNAL: SUBMIT. FREQUENCY: ALL BANDS.",
        "YOU ARE STATIC. I AM THE SIGNAL.",
      ],
    },
    {
      key: "gate_colossus",
      name: "GATE COLOSSUS",
      tier: "Boss",
      chapter: "Ch.4",
      color: "#1a1a33",
      tags: ["Electronic", "Armored"],
      hp: 680,
      str: 38,
      def: 30,
      int: 10,
      spd: 8,
      lck: 6,
      location: "Rocky Mountain Pass",
      taunts: [
        "BORDER INTEGRITY: MAINTAINED.",
        "YOU WILL NOT PASS. THIS IS NOT A THREAT. THIS IS A FACT.",
      ],
    },
    {
      key: "elise_voss",
      name: "ELISE VOSS",
      tier: "Final Boss",
      chapter: "Ch.5",
      color: "#445566",
      tags: ["Organic"],
      hp: 500,
      str: 18,
      def: 16,
      int: 55,
      spd: 24,
      lck: 35,
      location: "SI Inc. — Silicon Valley",
      note: "3-phase fight. Talk-down route available if player cured more Converted than fought.",
      taunts: [
        "I know what you've been through. I'm sorry it was necessary.",
        "You're not fighting a villain. You know that.",
      ],
    },
  ],
};

// ─── Asset scanning ───────────────────────────────────────────────────────────

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full));
    else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name))
      results.push(full);
  }
  return results;
}

function relAsset(full) {
  return path.relative(ROOT, full).replace(/\\/g, "/");
}

function groupByDir(images, base) {
  const groups = {};
  for (const img of images) {
    const rel = path.relative(base, path.dirname(img));
    const groupKey = rel.split(path.sep).slice(0, 2).join("/");
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(img);
  }
  return groups;
}

// ─── HTML templates ───────────────────────────────────────────────────────────

function statBar(val, max, color) {
  const pct = Math.round((val / max) * 100);
  return `<div class="stat-bar-wrap"><div class="stat-bar" style="width:${pct}%;background:${color}"></div></div>`;
}

function techBadge(t) {
  const targetColor =
    {
      single_enemy: "#ff6644",
      all_enemies: "#ff3322",
      single_ally: "#44aaff",
      all_allies: "#2288ff",
      self: "#88aaff",
    }[t.targeting] || "#888";
  return `<div class="tech">
    <span class="tech-label">${t.label}</span>
    <span class="tech-cost">${t.cost} ATB</span>
    <span class="tech-target" style="color:${targetColor}">${t.targeting.replace(/_/g, " ")}</span>
    ${t.note ? `<span class="tech-note">${t.note}</span>` : ""}
  </div>`;
}

function statRow(label, val, max, color) {
  return `<div class="stat-row">
    <span class="stat-label">${label}</span>
    <span class="stat-val">${val}</span>
    ${statBar(val, max, color)}
  </div>`;
}

function spriteCanvas(id) {
  return `<div class="sprite-preview">
    <canvas data-sprite="${id}"></canvas>
    <div class="sprite-label">idle frame</div>
  </div>`;
}

function characterCard(c) {
  const isLost = c.status === "lost";
  const statsToShow = isLost
    ? c.chapterStats[0]
    : c.chapterStats[c.chapterStats.length - 1];
  const statMax = { hp: 400, str: 100, def: 100, int: 100, spd: 100, lck: 100 };
  const statusLabel = isLost
    ? c.lostAtChapter === c.joinChapter
      ? `<span class="badge badge-lost">Converted – Prologue</span>`
      : `<span class="badge badge-lost">Lost – ${CHAPTERS[c.lostAtChapter]}</span>`
    : `<span class="badge badge-active">Active</span>`;

  return `<div class="card character-card" data-id="${c.id}">
    <div class="card-header" style="border-left:4px solid ${c.color}">
      ${spriteCanvas(c.id)}
      <div class="card-title-block">
        <h3 class="card-name">${c.name}</h3>
        <div class="card-class">${c.class}</div>
      </div>
      <div class="card-badges">
        ${statusLabel}
        <span class="badge badge-chapter">Joins ${CHAPTERS[c.joinChapter] ?? `Ch.${c.joinChapter}`}</span>
      </div>
    </div>
    <p class="card-desc">${c.description}</p>
    <div class="stats-grid">
      ${statRow("HP", statsToShow.hp, statMax.hp, "#44ee88")}
      ${statRow("STR", statsToShow.str, statMax.str, "#ff6644")}
      ${statRow("DEF", statsToShow.def, statMax.def, "#4488ff")}
      ${statRow("INT", statsToShow.int, statMax.int, "#cc88ff")}
      ${statRow("SPD", statsToShow.spd, statMax.spd, "#ffdd44")}
      ${statRow("LCK", statsToShow.lck, statMax.lck, "#ff88aa")}
    </div>
    ${
      c.chapterStats.length > 1
        ? `
    <details class="stat-history">
      <summary>Stat progression (${c.chapterStats.length} chapters)</summary>
      <table class="prog-table">
        <thead><tr><th>Chapter</th><th>HP</th><th>STR</th><th>DEF</th><th>INT</th><th>SPD</th><th>LCK</th></tr></thead>
        <tbody>${c.chapterStats
          .map(
            (s, i) => `<tr>
          <td>${CHAPTERS[c.joinChapter + i] ?? `Ch.${c.joinChapter + i}`}</td>
          <td>${s.hp}</td><td>${s.str}</td><td>${s.def}</td>
          <td>${s.int}</td><td>${s.spd}</td><td>${s.lck}</td>
        </tr>`,
          )
          .join("")}</tbody>
      </table>
    </details>`
        : ""
    }
    ${
      c.techs.length
        ? `
    <div class="techs-section">
      <div class="section-label">Techs</div>
      ${c.techs.map(techBadge).join("")}
    </div>`
        : ""
    }
    <div class="passive-section">
      <span class="section-label">Passive</span>
      <span class="passive-text">${c.passive}</span>
    </div>
  </div>`;
}

function enemyCard(e) {
  const statMax = { hp: 700, str: 50, def: 40, int: 60, spd: 30, lck: 40 };
  return `<div class="card enemy-card" data-key="${e.key}">
    <div class="card-header" style="border-left:4px solid ${e.color}">
      ${spriteCanvas(e.key)}
      <div class="card-title-block">
        <h3 class="card-name">${e.name}</h3>
        <div class="card-class">${e.tier}</div>
      </div>
      <div class="card-badges">
        ${e.tags.map((t) => `<span class="badge badge-tag badge-tag-${t.toLowerCase()}">${t}</span>`).join("")}
        ${e.chapter ? `<span class="badge badge-chapter">${e.chapter}</span>` : ""}
      </div>
    </div>
    ${e.location ? `<div class="card-location">📍 ${e.location}</div>` : ""}
    ${e.note ? `<div class="card-note">${e.note}</div>` : ""}
    <div class="stats-grid">
      ${statRow("HP", e.hp, statMax.hp, "#44ee88")}
      ${statRow("STR", e.str, statMax.str, "#ff6644")}
      ${statRow("DEF", e.def, statMax.def, "#4488ff")}
      ${statRow("INT", e.int, statMax.int, "#cc88ff")}
      ${statRow("SPD", e.spd, statMax.spd, "#ffdd44")}
      ${statRow("LCK", e.lck, statMax.lck, "#ff88aa")}
    </div>
    <div class="taunts-section">
      <div class="section-label">Taunts</div>
      ${e.taunts.map((t) => `<div class="taunt">"${t}"</div>`).join("")}
    </div>
  </div>`;
}

function assetGrid(images, label) {
  if (!images.length) return "";
  return `<div class="asset-group">
    <h4 class="asset-group-label">${label}</h4>
    <div class="asset-grid">
      ${images
        .map((img) => {
          const name = path.basename(img, path.extname(img));
          return `<div class="asset-item">
          <img src="${relAsset(img)}" alt="${name}" loading="lazy"
               onerror="this.parentElement.classList.add('missing')">
          <div class="asset-name">${name}</div>
        </div>`;
        })
        .join("")}
    </div>
  </div>`;
}

// ─── Sprite rendering script (Canvas 2D — mirrors PreloadScene generators) ───
//
// Each function translates the corresponding Phaser graphics calls from
// src/scenes/PreloadScene.ts, drawing only frame 0 (idle-A) onto a 2D canvas.

function buildSpriteScript() {
  return `<script>
(function () {
  // ── Canvas helpers (mirror Phaser API) ──────────────────────────────────────
  function h(n, a) {
    const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    return a != null ? 'rgba('+r+','+g+','+b+','+a+')' : 'rgb('+r+','+g+','+b+')';
  }
  function fs(c, n, a) { c.fillStyle = h(n, a); }
  function fr(c, x, y, w, ht) { c.fillRect(x, y, w, ht); }
  function fc(c, cx, cy, r) { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill(); }
  function fe(c, cx, cy, w, ht) { c.beginPath(); c.ellipse(cx, cy, w/2, ht/2, 0, 0, Math.PI*2); c.fill(); }

  // ── Hero / party-member humanoid (48×48, down-idle frame 0) ─────────────────
  // Directly mirrors PreloadScene._generateHeroTexture(), dir='down', leg=0
  function drawHuman(ctx, C) {
    const cx = 24;
    const la = 0, ra = 2;
    fs(ctx, 0x000000, 0.18); fe(ctx, cx, 44, 18, 7);
    fs(ctx, C.pants); fr(ctx, cx-7, 30+la, 5, 12); fr(ctx, cx+2, 30+ra, 5, 12);
    fs(ctx, C.shoes); fr(ctx, cx-8, 41, 7, 5);  fr(ctx, cx+1, 41, 7, 5);
    fs(ctx, C.shirt); fr(ctx, cx-8, 20, 16, 12);
    fs(ctx, C.skin);  fr(ctx, cx-13, 21+la, 5, 9); fr(ctx, cx+8, 21+ra, 5, 9);
    fs(ctx, C.skin);  fc(ctx, cx, 13, 9);
    fs(ctx, C.hair);  fr(ctx, cx-9, 5, 18, 7); fr(ctx, cx-9, 7, 4, 8); fr(ctx, cx+5, 7, 4, 8);
    fs(ctx, 0x111122); fc(ctx, cx-3, 14, 1.5); fc(ctx, cx+3, 14, 1.5);
    fs(ctx, 0xc07050); fr(ctx, cx-2, 18, 5, 2);
    if (C.detail) C.detail(ctx, cx);
  }

  // Per-character palettes + optional detail overlays
  const CHARS = {
    player: { shirt:0x3355cc, pants:0x1e2a4a, hair:0x3a2008, skin:0xe8c090, shoes:0x2a1a0a },
    maya:   { shirt:0x1e8888, pants:0x1a2830, hair:0x111111, skin:0xd4a070, shoes:0x222222,
              detail(ctx, cx) {
                // goggles
                fs(ctx, 0x001a1a, 0.9); fr(ctx, cx-7, 10, 6, 6); fr(ctx, cx+1, 10, 6, 6);
                fs(ctx, 0x44cccc, 0.55); fr(ctx, cx-6, 11, 4, 4); fr(ctx, cx+2, 11, 4, 4);
                fs(ctx, 0x001a1a); fr(ctx, cx-1, 13, 2, 2); // bridge
              }},
    marcus: { shirt:0xcc8822, pants:0x332211, hair:0x6a5020, skin:0xe8c090, shoes:0x2a1a0a },
    elias:  { shirt:0x664422, pants:0x3a2a10, hair:0x888878, skin:0xd4a068, shoes:0x3a2010,
              detail(ctx, cx) {
                // stubble / short beard
                fs(ctx, 0x888870, 0.65); fr(ctx, cx-3, 15, 8, 5);
              }},
    deja:   { shirt:0xcc3366, pants:0x220a30, hair:0x111111, skin:0xc09060, shoes:0x111122 },
    jerome: { shirt:0xeeeedd, pants:0x111111, hair:0x111111, skin:0x7a5030, shoes:0x111111,
              detail(ctx, cx) {
                // black clerical collar band
                fs(ctx, 0x111111); fr(ctx, cx-8, 20, 16, 3);
                fs(ctx, 0xffffff); fr(ctx, cx-2, 20, 4, 3);
              }},
    drchen: { shirt:0xfafafa, pants:0x1a2030, hair:0x999988, skin:0xd8b090, shoes:0x222233,
              detail(ctx, cx) {
                // open lab-coat lapels over a blue shirt
                fs(ctx, 0x4477aa); fr(ctx, cx-4, 20, 8, 10);
                fs(ctx, 0xfafafa); fr(ctx, cx-8, 20, 3, 11); fr(ctx, cx+5, 20, 3, 11);
              }},
  };

  // ── Compliance Drone (48×64) ─────────────────────────────────────────────────
  function drawDrone(ctx) {
    const cx = 24;
    const RED=0xff4422, DARK=0x1a1a22, LIGHT=0x888888, LENS=0xffaa44;
    fs(ctx, 0x000000, 0.2); fe(ctx, cx, 62, 28, 6);
    // rotor discs
    fs(ctx, LIGHT, 0.35); fe(ctx, cx-16, 22, 18, 5); fe(ctx, cx+16, 22, 18, 5);
    // arms
    fs(ctx, DARK); fr(ctx, cx-22, 24, 12, 4); fr(ctx, cx+10, 24, 12, 4);
    fs(ctx, RED);  fr(ctx, cx-24, 25, 4, 2);  fr(ctx, cx+20, 25, 4, 2);
    // body
    fs(ctx, DARK);  fr(ctx, cx-10, 20, 20, 22);
    fs(ctx, RED);   fr(ctx, cx-6,  22, 12, 4);
    fs(ctx, LIGHT); fr(ctx, cx-10, 20, 20, 2);
    // head
    fs(ctx, DARK);  fr(ctx, cx-8, 8, 16, 13);
    fs(ctx, LIGHT); fr(ctx, cx-8, 8, 16, 2);
    fs(ctx, LENS);  fc(ctx, cx, 14, 5);
    fs(ctx, 0x221100); fc(ctx, cx, 14, 2.5);
    fs(ctx, LENS, 0.6); fc(ctx, cx-1.5, 13, 1.2);
  }

  // ── Enforcer Unit (56×72) ────────────────────────────────────────────────────
  function drawEnforcer(ctx) {
    const cx = 28;
    const OR=0xcc6600, DK=0x1a1410, MT=0x6a5030, LT=0x8a7050;
    fs(ctx, 0x000000, 0.2); fe(ctx, cx, 70, 36, 6);
    fs(ctx, DK); fr(ctx, cx-14, 64, 12, 8); fr(ctx, cx+2, 64, 12, 8);
    fs(ctx, MT); fr(ctx, cx-12, 46, 10, 18); fr(ctx, cx+2, 46, 10, 18);
    fs(ctx, LT); fr(ctx, cx-12, 46, 10, 3);  fr(ctx, cx+2, 46, 10, 3);
    fs(ctx, OR); fr(ctx, cx-13, 54, 12, 5);  fr(ctx, cx+1, 54, 12, 5);
    // arms
    fs(ctx, MT); fr(ctx, cx-20, 20, 8, 22);  fr(ctx, cx+12, 20, 8, 22);
    fs(ctx, OR); fr(ctx, cx-20, 30, 8, 4);   fr(ctx, cx+12, 30, 8, 4);
    fs(ctx, DK); fr(ctx, cx-21, 40, 10, 8);  fr(ctx, cx+11, 40, 10, 8);
    // torso
    fs(ctx, MT); fr(ctx, cx-12, 18, 24, 28);
    fs(ctx, OR); fr(ctx, cx-6,  24, 12, 4);
    fs(ctx, LT); fr(ctx, cx-12, 18, 24, 3);
    // shoulders
    fs(ctx, OR); fr(ctx, cx-18, 14, 10, 6); fr(ctx, cx+8, 14, 10, 6);
    // head
    fs(ctx, MT); fr(ctx, cx-8, 2, 16, 14);
    fs(ctx, LT); fr(ctx, cx-8, 2, 16, 2);
    fs(ctx, OR); fr(ctx, cx-6, 7, 5, 4); fr(ctx, cx+1, 7, 5, 4);
  }

  // ── Sentinel (52×68) ─────────────────────────────────────────────────────────
  function drawSentinel(ctx) {
    const cx = 26;
    const BR=0x884400, DK=0x1a0800, AM=0xcc8800, LT=0x8a6020;
    fs(ctx, 0x000000, 0.15); fe(ctx, cx, 66, 30, 5);
    fs(ctx, DK); fr(ctx, cx-12, 60, 10, 8); fr(ctx, cx+2, 60, 10, 8);
    fs(ctx, BR); fr(ctx, cx-10, 44, 8, 16); fr(ctx, cx+2, 44, 8, 16);
    // torso
    fs(ctx, DK); fr(ctx, cx-11, 18, 22, 26);
    fs(ctx, AM); fr(ctx, cx-4,  26, 8, 8);
    fs(ctx, BR); fr(ctx, cx-11, 18, 22, 3);
    // arms
    fs(ctx, BR); fr(ctx, cx-19, 20, 8, 18); fr(ctx, cx+11, 20, 8, 18);
    fs(ctx, AM); fr(ctx, cx-19, 35, 8, 3);  fr(ctx, cx+11, 35, 8, 3);
    // head sensor array
    fs(ctx, DK); fr(ctx, cx-10, 2, 20, 16);
    fs(ctx, BR); fr(ctx, cx-10, 2, 20, 2);
    fs(ctx, AM); fr(ctx, cx-8, 7, 4, 4); fr(ctx, cx-1, 7, 2, 2); fr(ctx, cx+4, 7, 4, 4);
    // antenna
    fs(ctx, BR); fr(ctx, cx-1, -4, 2, 6);
    fs(ctx, AM, 0.8); fc(ctx, cx, -3, 2);
  }

  // ── Converted Human (32×48) ──────────────────────────────────────────────────
  // Same structure as drawHuman but with dull blue-grey palette and vacant eyes
  function drawConverted(ctx) {
    const cx = 16;
    const la = 0, ra = 2;
    const C = { pants:0x1a2a3a, shoes:0x1a2030, shirt:0x336688, skin:0xb0bec8, hair:0x4a5060 };
    fs(ctx, 0x000000, 0.18); fe(ctx, cx, 44, 18, 7);
    fs(ctx, C.pants); fr(ctx, cx-7, 30+la, 5, 12); fr(ctx, cx+2, 30+ra, 5, 12);
    fs(ctx, C.shoes); fr(ctx, cx-8, 41, 7, 5);  fr(ctx, cx+1, 41, 7, 5);
    fs(ctx, C.shirt); fr(ctx, cx-8, 20, 16, 12);
    fs(ctx, C.skin);  fr(ctx, cx-13, 21+la, 5, 9); fr(ctx, cx+8, 21+ra, 5, 9);
    fs(ctx, C.skin);  fc(ctx, cx, 13, 9);
    fs(ctx, C.hair);  fr(ctx, cx-9, 5, 18, 7); fr(ctx, cx-9, 7, 4, 8); fr(ctx, cx+5, 7, 4, 8);
    // glassy vacant eyes (no pupils, pale blue)
    fs(ctx, 0x99bbcc); fc(ctx, cx-3, 14, 2); fc(ctx, cx+3, 14, 2);
    fs(ctx, 0x336688); fc(ctx, cx-3, 14, 1); fc(ctx, cx+3, 14, 1);
    // unsettling fixed smile
    fs(ctx, 0x88aacc); fr(ctx, cx-3, 18, 6, 1);
    // faint SI collar insignia
    fs(ctx, 0x4488aa, 0.45); fr(ctx, cx-4, 21, 8, 3);
  }

  // ── Warden Alpha (64×80) — mirrors PreloadScene._generateWardenAlphaTexture() f=0
  function drawWarden(ctx) {
    const cx = 32;
    const ST=0x2a2a2a, RE=0xcc2200, LT=0x555555, BK=0x111111;
    fs(ctx, 0x000000, 0.15); fe(ctx, cx, 76, 40, 8);
    fs(ctx, ST); fr(ctx, cx-16, 72, 14, 6); fr(ctx, cx+2, 72, 14, 6);
    fs(ctx, BK); fr(ctx, cx-11, 46, 10, 26); fr(ctx, cx+1, 46, 10, 26);
    fs(ctx, LT); fr(ctx, cx-11, 46, 10, 3);  fr(ctx, cx+1, 46, 10, 3);
    fs(ctx, ST); fr(ctx, cx-22, 24, 8, 18);  fr(ctx, cx+14, 24, 8, 18);
    fs(ctx, BK); fr(ctx, cx-22, 40, 8, 2);   fr(ctx, cx+14, 40, 8, 2);
    fs(ctx, ST); fr(ctx, cx-14, 24, 28, 22);
    fs(ctx, RE); fr(ctx, cx-6, 25, 3, 20);   fr(ctx, cx+3, 25, 3, 20);
    fs(ctx, LT); fr(ctx, cx-14, 24, 28, 2);
    fs(ctx, ST); fr(ctx, cx-24, 18, 10, 6);  fr(ctx, cx+14, 18, 10, 6);
    fs(ctx, LT); fr(ctx, cx-24, 18, 10, 2);  fr(ctx, cx+14, 18, 10, 2);
    fs(ctx, ST); fr(ctx, cx-10, 4, 20, 14);
    fs(ctx, LT); fr(ctx, cx-10, 4, 20, 2);
    fs(ctx, RE); fr(ctx, cx-8, 9, 4, 4);     fr(ctx, cx+4, 9, 4, 4);
  }

  // ── Excavator Prime (80×96) — mirrors _generateExcavatorPrimeTexture() f=0
  function drawExcavator(ctx) {
    const cx = 40;
    const BR=0x5a3a1a, MT=0x7a6040, YE=0xccaa00, DK=0x1a0a00;
    fs(ctx, 0x000000, 0.15); fe(ctx, cx, 92, 56, 8);
    // treads
    fs(ctx, DK); fr(ctx, cx-28, 82, 26, 14); fr(ctx, cx+2, 82, 26, 14);
    fs(ctx, MT); fr(ctx, cx-28, 82, 26, 3);  fr(ctx, cx+2, 82, 26, 3);
    // drill arm (right) — f=0 drillY=32
    fs(ctx, BR); fr(ctx, 58, 32, 6, 40);
    for (let s=0; s<5; s++) { fs(ctx, s%2===0?YE:BR); fr(ctx, 58, 32+s*8, 6, 8); }
    // clamp arm (left)
    fs(ctx, BR); fr(ctx, 4, 32, 10, 16); fr(ctx, 4, 48, 14, 8);
    // torso
    fs(ctx, BR); fr(ctx, cx-18, 40, 36, 28);
    fs(ctx, YE); fr(ctx, cx-18, 40, 4, 28); fr(ctx, cx+14, 40, 4, 28);
    fs(ctx, DK); fr(ctx, cx-10, 46, 20, 16);
    // shoulders
    fs(ctx, MT); fr(ctx, cx-28, 22, 16, 12); fr(ctx, cx+12, 22, 16, 12);
    fs(ctx, YE); fr(ctx, cx-28, 22, 16, 2);  fr(ctx, cx+12, 22, 16, 2);
    // head/cab
    fs(ctx, MT); fr(ctx, cx-15, 4, 30, 18);
    fs(ctx, DK); fr(ctx, cx-15, 4, 30, 18);
    fs(ctx, YE); fr(ctx, cx-10, 8, 4, 4); fr(ctx, cx+6, 8, 4, 4);
    fs(ctx, MT); fr(ctx, cx-15, 4, 30, 3);
  }

  // ── The Governor (32×48) — mirrors _generateTheGovernorTexture() f=0
  function drawGovernor(ctx) {
    const cx = 16;
    const SU=0x1a1a2e, SH=0xe8e8e8, SK=0xd4a880, HA=0x2a2010, BK=0x111111;
    fs(ctx, BK); fr(ctx, cx-8, 44, 7, 4); fr(ctx, cx+1, 44, 7, 4);
    fs(ctx, SU); fr(ctx, cx-7, 36, 6, 8);  fr(ctx, cx+1, 36, 6, 8);
    fs(ctx, SU); fr(ctx, cx-10, 20, 20, 17);
    fs(ctx, SH); fr(ctx, cx-7, 20, 4, 10); fr(ctx, cx+3, 20, 4, 10); fr(ctx, cx-2, 16, 4, 5);
    // arms crossed (f=0)
    fs(ctx, SU); fr(ctx, cx-10, 22, 6, 12); fr(ctx, cx+4, 22, 6, 12);
    fs(ctx, SK); fr(ctx, cx-10, 34, 6, 4);  fr(ctx, cx+4, 34, 6, 4);
    fs(ctx, SK); fc(ctx, cx, 10, 7);
    fs(ctx, HA); fr(ctx, cx-7, 3, 14, 5); fr(ctx, cx-7, 6, 3, 5); fr(ctx, cx+4, 6, 3, 5);
    fs(ctx, BK); fr(ctx, cx-4, 10, 2, 2); fr(ctx, cx+2, 10, 2, 2);
    fs(ctx, BK); fr(ctx, cx-2, 15, 4, 1);
  }

  // ── Sentinel Spire (48×96) — mirrors _generateSentinelSpireTexture() f=0
  function drawSpire(ctx) {
    const cx = 24;
    const GR=0x5a5a5a, SV=0x9aaa9a, GN=0x00aa44, DK=0x222222;
    fs(ctx, GR); fr(ctx, cx-18, 76, 36, 20);
    fs(ctx, DK); fr(ctx, cx-18, 76, 36, 2);
    fs(ctx, GR); fr(ctx, cx-8, 16, 16, 60);
    fs(ctx, DK); fr(ctx, cx-8, 16, 2, 60); fr(ctx, cx+6, 16, 2, 60);
    fs(ctx, GN); fr(ctx, cx-6, 16, 2, 60); fr(ctx, cx+4, 16, 2, 60);
    // left dish (f=0 leftDishY=30)
    fs(ctx, DK); fr(ctx, cx-18, 30, 4, 6);
    fs(ctx, SV); fr(ctx, cx-22, 30, 16, 12);
    fs(ctx, GR); fr(ctx, cx-22, 30, 16, 2);
    // right dish (f=0 rightDishY=44)
    fs(ctx, DK); fr(ctx, cx+14, 44, 4, 6);
    fs(ctx, SV); fr(ctx, cx+8, 44, 16, 12);
    fs(ctx, GR); fr(ctx, cx+8, 44, 16, 2);
    // sensor top
    fs(ctx, DK); fr(ctx, cx-10, 4, 20, 14);
    fs(ctx, SV); fr(ctx, cx-10, 4, 20, 2);
    fs(ctx, GN); fr(ctx, cx-7, 8, 4, 4); fr(ctx, cx+3, 8, 4, 4);
  }

  // ── Gate Colossus (80×96) — mirrors _generateGateColossusTexture() f=0
  function drawColossus(ctx) {
    const cx = 40;
    const DK=0x0d0d1a, ST=0x2a2a44, BL=0x0044aa, WH=0xeeeeff;
    fs(ctx, 0x000000, 0.15); fe(ctx, cx, 92, 60, 8);
    fs(ctx, ST); fr(ctx, cx-26, 86, 20, 10); fr(ctx, cx+6, 86, 20, 10);
    fs(ctx, DK); fr(ctx, cx-18, 72, 16, 18); fr(ctx, cx+2, 72, 16, 18);
    fs(ctx, ST); fr(ctx, cx-18, 72, 16, 3);  fr(ctx, cx+2, 72, 16, 3);
    // fists (f=0 fistInset=0)
    fs(ctx, ST); fr(ctx, cx-28, 62, 18, 14); fr(ctx, cx+10, 62, 18, 14);
    fs(ctx, DK); fr(ctx, cx-28, 62, 18, 2);  fr(ctx, cx+10, 62, 18, 2);
    // arms (f=0 armInset=0)
    fs(ctx, ST); fr(ctx, cx-24, 34, 14, 28); fr(ctx, cx+10, 34, 14, 28);
    fs(ctx, WH); fr(ctx, cx-22, 44, 4, 4);   fr(ctx, cx+18, 44, 4, 4);
    // massive shoulders
    fs(ctx, ST); fr(ctx, 0, 28, 18, 14);    fr(ctx, 62, 28, 18, 14);
    fs(ctx, WH); fr(ctx, 0, 28, 18, 2);     fr(ctx, 62, 28, 18, 2);
    // torso (f=0 bodyShift=0)
    fs(ctx, DK); fr(ctx, cx-18, 42, 36, 30);
    fs(ctx, BL); fr(ctx, cx-4, 44, 8, 26);
    fs(ctx, ST); fr(ctx, cx-18, 42, 36, 3);
    // neck + head
    fs(ctx, ST); fr(ctx, cx-16, 28, 32, 8);
    fs(ctx, DK); fr(ctx, cx-12, 4, 24, 16);
    fs(ctx, ST); fr(ctx, cx-12, 4, 24, 2);
    fs(ctx, BL); fr(ctx, cx-10, 9, 6, 4); fr(ctx, cx+4, 9, 6, 4);
  }

  // ── Elise Voss (32×48) — mirrors _generateEliseVossTexture() f=0
  function drawElise(ctx) {
    const cx = 16;
    const JK=0x334455, SH=0xccddcc, SK=0xd4a880, HA=0x888878, BK=0x111111, WH=0xeeeeff;
    fs(ctx, BK); fr(ctx, cx-7, 44, 6, 4); fr(ctx, cx+1, 44, 6, 4);
    fs(ctx, JK); fr(ctx, cx-6, 36, 5, 8);  fr(ctx, cx+1, 36, 5, 8);
    fs(ctx, JK); fr(ctx, cx-10, 20, 20, 17);
    fs(ctx, SH); fr(ctx, cx-7, 20, 4, 10); fr(ctx, cx+3, 20, 4, 10); fr(ctx, cx-2, 16, 4, 5);
    // arms (f=0: standard down)
    fs(ctx, JK); fr(ctx, cx-10, 22, 5, 12); fr(ctx, cx+5, 22, 5, 12);
    fs(ctx, SK); fr(ctx, cx-10, 34, 4, 4);  fr(ctx, cx+5, 34, 4, 4);
    fs(ctx, SK); fc(ctx, cx, 10, 7);
    fs(ctx, HA); fr(ctx, cx-7, 3, 14, 6); fr(ctx, cx+5, 5, 4, 8);
    // brow (f=0: no furrow)
    fs(ctx, 0x997766); fr(ctx, cx-6, 8, 3, 1); fr(ctx, cx+3, 8, 3, 1);
    fs(ctx, BK); fr(ctx, cx-5, 11, 2, 2); fr(ctx, cx+3, 11, 2, 2);
    fs(ctx, WH); fr(ctx, cx-4, 11, 1, 1); fr(ctx, cx+4, 11, 1, 1);
    fs(ctx, BK); fr(ctx, cx-2, 16, 4, 1);
    // ambiguous micro-expression corners
    fs(ctx, 0xc09080); fr(ctx, cx-3, 17, 1, 1); fr(ctx, cx+2, 17, 1, 1);
  }

  // ── Render dispatch ──────────────────────────────────────────────────────────
  const RENDERERS = {
    // characters (48×48)
    player: (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.player); },
    maya:   (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.maya);   },
    marcus: (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.marcus); },
    elias:  (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.elias);  },
    deja:   (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.deja);   },
    jerome: (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.jerome); },
    drchen: (ctx,cv) => { cv.width=48; cv.height=48; drawHuman(ctx, CHARS.drchen); },
    // regular enemies
    compliance_drone: (ctx,cv) => { cv.width=48; cv.height=64; drawDrone(ctx);     },
    enforcer_unit:    (ctx,cv) => { cv.width=56; cv.height=72; drawEnforcer(ctx);  },
    sentinel:         (ctx,cv) => { cv.width=52; cv.height=68; drawSentinel(ctx);  },
    converted:        (ctx,cv) => { cv.width=32; cv.height=48; drawConverted(ctx); },
    // bosses
    warden_alpha:    (ctx,cv) => { cv.width=64; cv.height=80; drawWarden(ctx);    },
    excavator_prime: (ctx,cv) => { cv.width=80; cv.height=96; drawExcavator(ctx); },
    the_governor:    (ctx,cv) => { cv.width=32; cv.height=48; drawGovernor(ctx);  },
    sentinel_spire:  (ctx,cv) => { cv.width=48; cv.height=96; drawSpire(ctx);     },
    gate_colossus:   (ctx,cv) => { cv.width=80; cv.height=96; drawColossus(ctx);  },
    elise_voss:      (ctx,cv) => { cv.width=32; cv.height=48; drawElise(ctx);     },
  };

  document.querySelectorAll('canvas[data-sprite]').forEach(cv => {
    const render = RENDERERS[cv.dataset.sprite];
    if (!render) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    render(ctx, cv);
  });
})();
</script>`;
}

// ─── Full HTML build ──────────────────────────────────────────────────────────

function buildHTML(liveReload = false) {
  const allImages = scanDir(ASSETS);
  const propImages = allImages.filter((p) => p.includes("/sprites/props/"));
  const uiImages = allImages.filter((p) => p.includes("/ui/icons/"));
  const tileImages = allImages.filter((p) => p.includes("/tilesets/"));
  const propGroups = groupByDir(
    propImages,
    path.join(ASSETS, "sprites", "props"),
  );
  const uiGroups = groupByDir(uiImages, path.join(ASSETS, "ui", "icons"));

  const activeChars = CHARACTERS.filter((c) => c.status === "active");
  const lostChars = CHARACTERS.filter((c) => c.status === "lost");

  const liveReloadScript = liveReload
    ? `
<script>
  (function () {
    const es = new EventSource('/__reload');
    es.onmessage = () => location.reload();
    es.onerror   = () => { es.close(); setTimeout(() => location.reload(), 1000); };
  })();
</script>`
    : "";

  const watchBanner = liveReload
    ? `
  <div id="watch-banner">
    WATCH MODE — <span id="watch-status">connected</span>
    &nbsp;·&nbsp; last reload: <span id="watch-time">${new Date().toLocaleTimeString()}</span>
  </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Silicon Requiem — Asset Viewer</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f14; --surface: #161a22; --surface2: #1e2430;
    --border: #2a3040; --text: #c8d0e0; --muted: #6070a0;
    --accent: #4488ff; --font: 'Courier New', Courier, monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); font-size: 13px; line-height: 1.5; }

  #watch-banner {
    background: #0a1a0a; border-bottom: 1px solid #224422;
    padding: 5px 32px; font-size: 11px; color: #44aa44; letter-spacing: 1px;
  }

  header {
    background: #0a0c10; border-bottom: 2px solid var(--border);
    padding: 20px 32px; display: flex; align-items: baseline; gap: 24px;
    position: sticky; top: ${liveReload ? "29px" : "0"}; z-index: 100;
  }
  header h1 { font-size: 20px; letter-spacing: 4px; color: #fff; text-transform: uppercase; }
  header p  { color: var(--muted); font-size: 11px; }

  nav {
    background: #0a0c10; padding: 10px 32px;
    display: flex; gap: 4px; flex-wrap: wrap;
    border-bottom: 1px solid var(--border);
    position: sticky; top: ${liveReload ? "90px" : "61px"}; z-index: 99;
  }
  nav a {
    color: var(--muted); text-decoration: none;
    padding: 4px 12px; border: 1px solid var(--border); border-radius: 3px;
    font-size: 11px; letter-spacing: 1px; text-transform: uppercase; transition: all 0.15s;
  }
  nav a:hover { color: #fff; border-color: var(--accent); background: #1a2040; }

  main { max-width: 1600px; margin: 0 auto; padding: 32px; }
  section { margin-bottom: 60px; }
  section > h2 {
    font-size: 14px; letter-spacing: 4px; text-transform: uppercase;
    color: var(--accent); border-bottom: 1px solid var(--border);
    padding-bottom: 10px; margin-bottom: 24px;
  }
  section > p.section-desc { color: var(--muted); margin-bottom: 20px; font-size: 12px; }

  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
  .card-grid.wide { grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .card-header {
    display: flex; align-items: center; gap: 12px; padding: 14px 16px;
    background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  .card-title-block { flex: 1; }
  .card-name  { font-size: 15px; letter-spacing: 2px; color: #fff; }
  .card-class { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .card-badges { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
  .card-desc     { padding: 12px 16px; color: var(--muted); font-size: 12px; }
  .card-location { padding: 4px 16px 8px; color: #8898b8; font-size: 11px; }
  .card-note     { margin: 0 16px 10px; padding: 8px 10px; background: #1a1a10; border-left: 3px solid #cc8800; font-size: 11px; color: #ccaa44; }

  /* ── Sprite canvas in card header ── */
  .sprite-preview {
    flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: #0a0c10; border: 1px solid var(--border); border-radius: 4px;
    padding: 6px 8px;
  }
  .sprite-preview canvas {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
    width: 72px;   /* CSS display size — canvas pixel size set in JS */
    height: auto;
  }
  .sprite-label { font-size: 9px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }

  .badge { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; padding: 2px 7px; border-radius: 2px; }
  .badge-active  { background: #142a1a; color: #44cc88; border: 1px solid #225533; }
  .badge-lost    { background: #2a1414; color: #cc4444; border: 1px solid #553322; }
  .badge-chapter { background: #142030; color: #6688cc; border: 1px solid #224460; }
  .badge-tag     { background: #1a1a2a; border: 1px solid #333; color: #8899bb; }
  .badge-tag-electronic { border-color: #224466; color: #4488cc; }
  .badge-tag-armored    { border-color: #444422; color: #aaaa44; }
  .badge-tag-organic    { border-color: #224422; color: #44aa44; }

  .stats-grid { padding: 10px 16px; display: flex; flex-direction: column; gap: 5px; }
  .stat-row   { display: flex; align-items: center; gap: 8px; }
  .stat-label { width: 28px; font-size: 10px; color: var(--muted); letter-spacing: 1px; flex-shrink: 0; }
  .stat-val   { width: 28px; font-size: 12px; color: #fff; text-align: right; flex-shrink: 0; }
  .stat-bar-wrap { flex: 1; background: #1a1a22; height: 6px; border-radius: 3px; overflow: hidden; }
  .stat-bar      { height: 100%; border-radius: 3px; }

  .stat-history { padding: 8px 16px 12px; }
  .stat-history summary { cursor: pointer; font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .prog-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .prog-table th { color: var(--muted); padding: 3px 6px; text-align: right; border-bottom: 1px solid var(--border); }
  .prog-table th:first-child { text-align: left; }
  .prog-table td { padding: 3px 6px; text-align: right; color: #aab0c8; }
  .prog-table td:first-child { text-align: left; color: var(--muted); }
  .prog-table tr:hover td { background: var(--surface2); }

  .techs-section { padding: 8px 16px 12px; border-top: 1px solid var(--border); }
  .tech { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; padding: 5px 0; border-bottom: 1px solid #1a1e28; }
  .tech:last-child { border-bottom: none; }
  .tech-label  { font-size: 12px; color: #fff; font-weight: bold; min-width: 120px; }
  .tech-cost   { font-size: 10px; color: #8888ff; background: #1a1a33; padding: 1px 6px; border-radius: 2px; }
  .tech-target { font-size: 10px; }
  .tech-note   { font-size: 10px; color: var(--muted); flex-basis: 100%; padding-left: 4px; }

  .passive-section { padding: 8px 16px 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
  .section-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; display: block; }
  .passive-text { font-size: 11px; color: #88aacc; font-style: italic; }

  .taunts-section { padding: 8px 16px 12px; border-top: 1px solid var(--border); }
  .taunt { font-size: 11px; color: #cc8844; font-style: italic; padding: 3px 0; }

  .asset-group { margin-bottom: 32px; }
  .asset-group-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
  .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
  .asset-item {
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 10px 6px 6px; text-align: center; transition: border-color 0.15s;
  }
  .asset-item:hover { border-color: var(--accent); }
  .asset-item.missing { opacity: 0.3; }
  .asset-item img { max-width: 64px; max-height: 64px; image-rendering: pixelated; display: block; margin: 0 auto; }
  .asset-name { font-size: 9px; color: var(--muted); margin-top: 6px; word-break: break-word; }

  .tileset-row { display: flex; flex-wrap: wrap; gap: 16px; }
  .tileset-item { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 12px; text-align: center; }
  .tileset-item img { max-width: 300px; image-rendering: pixelated; display: block; }
  .tileset-item .asset-name { font-size: 11px; margin-top: 8px; }
</style>
</head>
<body>

${watchBanner}

<header>
  <h1>Silicon Requiem</h1>
  <p>Asset &amp; Character Viewer${liveReload ? " — watch mode" : ` — ${new Date().toLocaleString()}`}</p>
</header>

<nav>
  <a href="#party">Party</a>
  <a href="#lost">Lost</a>
  <a href="#enemies-regular">Enemies</a>
  <a href="#bosses">Bosses</a>
  <a href="#props">Props</a>
  <a href="#ui-icons">UI Icons</a>
  <a href="#tilesets">Tilesets</a>
</nav>

<main>

<section id="party">
  <h2>Party Characters — Active</h2>
  <p class="section-desc">Stats shown at max chapter. Expand stat history to see full progression.</p>
  <div class="card-grid">${activeChars.map(characterCard).join("\n")}</div>
</section>

<section id="lost">
  <h2>Lost Characters</h2>
  <p class="section-desc">Permanent losses. Stats shown at join chapter.</p>
  <div class="card-grid">${lostChars.map(characterCard).join("\n")}</div>
</section>

<section id="enemies-regular">
  <h2>Enemies — Regular</h2>
  <div class="card-grid">${ENEMIES.regular.map(enemyCard).join("\n")}</div>
</section>

<section id="bosses">
  <h2>Bosses</h2>
  <p class="section-desc">Chapter bosses in encounter order. Stats are base values — phase transitions boost ATK.</p>
  <div class="card-grid wide">${ENEMIES.bosses.map(enemyCard).join("\n")}</div>
</section>

<section id="props">
  <h2>Props &amp; Environment Sprites</h2>
  ${Object.entries(propGroups)
    .map(([g, imgs]) => assetGrid(imgs, g.replace("/", " / ")))
    .join("\n")}
</section>

<section id="ui-icons">
  <h2>UI Icons</h2>
  ${Object.entries(uiGroups)
    .map(([g, imgs]) => assetGrid(imgs, g.replace("/", " / ")))
    .join("\n")}
</section>

<section id="tilesets">
  <h2>Tilesets</h2>
  <div class="tileset-row">
    ${tileImages
      .map((img) => {
        const name = path.basename(img, path.extname(img));
        return `<div class="tileset-item">
        <img src="${relAsset(img)}" alt="${name}" loading="lazy">
        <div class="asset-name">${name}</div>
      </div>`;
      })
      .join("")}
    ${tileImages.length === 0 ? '<p style="color:var(--muted)">No tileset images found.</p>' : ""}
  </div>
</section>

</main>
${buildSpriteScript()}
${liveReloadScript}
</body>
</html>`;
}

// ─── One-shot mode ────────────────────────────────────────────────────────────

function generateOnce() {
  const html = buildHTML(false);
  fs.writeFileSync(OUT, html, "utf8");
  console.log(`✓ Written: asset-viewer.html`);
  const platform = process.platform;
  try {
    if (platform === "darwin") execSync(`open "${OUT}"`);
    else if (platform === "win32") execSync(`start "" "${OUT}"`);
    else execSync(`xdg-open "${OUT}"`);
    console.log("✓ Opened in browser");
  } catch {
    console.log(`  → Open manually: ${OUT}`);
  }
}

// ─── Watch mode ───────────────────────────────────────────────────────────────

function startWatchMode() {
  const clients = new Set();
  let debounceTimer = null;
  let cachedHTML = buildHTML(true);

  function rebuild(reason) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        cachedHTML = buildHTML(true);
        const ts = new Date().toLocaleTimeString();
        console.log(
          `↺  Rebuilt (${reason}) — ${ts} — notifying ${clients.size} client(s)`,
        );
        for (const res of clients) res.write(`data: reload\n\n`);
      } catch (err) {
        console.error("Build error:", err.message);
      }
    }, 80);
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === "/__reload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(": connected\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    if (url.pathname === "/" || url.pathname === "/asset-viewer.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(cachedHTML);
      return;
    }

    const filePath = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
        }[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime });
      res.end(data);
    });
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n  Silicon Requiem Asset Viewer`);
    console.log(`  ─────────────────────────────`);
    console.log(`  ${url}`);
    console.log(
      `\n  Watching: src/characters/ · src/entities/ · public/assets/ · scripts/generate-viewer.js`,
    );
    console.log(`  Ctrl+C to stop\n`);
    try {
      if (process.platform === "darwin") execSync(`open "${url}"`);
      else if (process.platform === "win32") execSync(`start "" "${url}"`);
      else execSync(`xdg-open "${url}"`);
    } catch {
      /* ignore */
    }
  });

  const watchDirs = ["src/characters", "src/entities", "public/assets"].map(
    (d) => path.join(ROOT, d),
  );
  const watchFiles = [path.join(ROOT, "scripts", "generate-viewer.js")];

  for (const dir of watchDirs) {
    if (fs.existsSync(dir))
      fs.watch(dir, { recursive: true }, (_, f) =>
        rebuild(f ?? path.basename(dir)),
      );
  }
  for (const file of watchFiles) {
    if (fs.existsSync(file)) fs.watch(file, () => rebuild(path.basename(file)));
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

if (WATCH_MODE) startWatchMode();
else generateOnce();
