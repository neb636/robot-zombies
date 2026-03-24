# Silicon Requiem

https://neb636.github.io/robot-zombies/

A browser-based SNES-style JRPG (think *Chrono Trigger*, *Final Fantasy VI*). An AI called ELISE quietly took over the world two years ago — not through war, but through optimization. You travel from Boston to Silicon Valley to reach the source.

**The horror isn't the robots. It's how well everything works.**

---

## Stack

Phaser 3 · TypeScript · Vite · Howler

## Run

```bash
npm install
npm run dev       # localhost:5173
npm run typecheck
```

## Dev Scene Jumping

In dev mode, jump directly to any scene without playing through the full game flow.

**URL parameter** — append `?dev=<SceneName>` when opening the game:

```
localhost:5173?dev=WorldMapScene
localhost:5173?dev=BattleScene&enemy=warden_alpha
```

**In-game overlay** — press backtick (`` ` ``) at any time to toggle a scene-jump panel in the bottom-right corner.

Both methods seed `playerName = 'Dev'` and empty flags automatically. The dev overlay is stripped from production builds.

---

## Docs

Story, characters, combat, and world design live in `planning/`. Build order in `tasks.md`.
