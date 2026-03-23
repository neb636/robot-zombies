import Phaser from 'phaser';
import { Player }          from '../entities/Player.js';
import { DialogueManager } from '../dialogue/DialogueManager.js';

// ─── Room constants ───────────────────────────────────────────────────────────
const MAP_W      = 700;
const MAP_H      = 440;
const WALL_T     = 10;
const DIVIDER_X  = 340;
const DOOR_TOP   = 175;  // doorway between rooms
const DOOR_BOT   = 275;
const FDOOR_TOP  = 178;  // front door (right wall)
const FDOOR_BOT  = 278;

// ─── Phase keys ──────────────────────────────────────────────────────────────
const PHASE = {
  WAKE_UP:   'WAKE_UP',
  EXPLORING: 'EXPLORING',
  NEWSCAST:  'NEWSCAST',
  DARIO:     'DARIO',
  OUTRO:     'OUTRO',
  DONE:      'DONE',
};

/**
 * PrologueScene — "Before the Fall" (June 2028, Austin TX)
 * Linear story tutorial: player's home on the morning of the AI takeover.
 *
 * Flow:
 *   Alarm dialogue → bedroom exploration → enter living room →
 *   interact with TV → Superintelligence INC broadcast (cutscene) →
 *   Dario phone call → walk to front door → fade to Act 1
 */
export class PrologueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrologueScene' });
  }

  create() {
    this._phase         = PHASE.WAKE_UP;
    this._inputEnabled  = false;
    this._enteredLiving = false;
    this._playerName    = this.registry.get('playerName') || 'KAI';

    this._drawRoom();
    this._buildWalls();
    this._buildInteractables();
    this._buildPlayer();
    this._buildCamera();
    this._buildHUD();
    this._setupInput();

    this.dialogMgr = new DialogueManager(this);

    // Fade in then kick off story
    this.cameras.main.fadeIn(900, 0, 0, 0);
    this.time.delayedCall(1000, () => this._startWakeUp());
  }

  update() {
    if (!this._inputEnabled) return;
    this.player.update();
    this._checkLivingTrigger();
    this._checkInteractProximity();
    if (this._phase === PHASE.OUTRO) this._checkFrontDoor();
  }

  // ─── Room Drawing ─────────────────────────────────────────────────────────

  _drawRoom() {
    const g = this.add.graphics();

    // ── Floors ────────────────────────────────────────────────────────────────
    g.fillStyle(0x2a1f16); // bedroom — warm dark wood
    g.fillRect(WALL_T, WALL_T, DIVIDER_X - WALL_T * 2, MAP_H - WALL_T * 2);

    g.fillStyle(0x1a202e); // living room — cool dark blue-gray
    g.fillRect(DIVIDER_X + WALL_T, WALL_T, MAP_W - DIVIDER_X - WALL_T * 2, MAP_H - WALL_T * 2);

    // ── Walls (border) ────────────────────────────────────────────────────────
    g.fillStyle(0x2a2438);
    g.fillRect(0, 0, MAP_W, WALL_T);                   // top
    g.fillRect(0, MAP_H - WALL_T, MAP_W, WALL_T);      // bottom
    g.fillRect(0, 0, WALL_T, MAP_H);                   // left
    // right wall with front door gap
    g.fillRect(MAP_W - WALL_T, 0, WALL_T, FDOOR_TOP);
    g.fillRect(MAP_W - WALL_T, FDOOR_BOT, WALL_T, MAP_H - FDOOR_BOT);
    // divider wall with doorway gap
    g.fillRect(DIVIDER_X - 4, 0, 8, DOOR_TOP);
    g.fillRect(DIVIDER_X - 4, DOOR_BOT, 8, MAP_H - DOOR_BOT);

    // ── Doorway trim ──────────────────────────────────────────────────────────
    g.fillStyle(0x5c3a1e);
    g.fillRect(DIVIDER_X - 6, DOOR_TOP - 4, 12, 6);   // top trim
    g.fillRect(DIVIDER_X - 6, DOOR_BOT - 2, 12, 6);   // bottom trim

    // ── BEDROOM FURNITURE ─────────────────────────────────────────────────────

    // Bed
    g.fillStyle(0x4a3020);           // headboard
    g.fillRect(28, 28, 190, 18);
    g.fillStyle(0xd8ccba);           // mattress
    g.fillRect(28, 46, 190, 88);
    g.fillStyle(0xf8f4ee);           // pillow L
    g.fillRect(36, 52, 56, 28);
    g.fillStyle(0xf0ece4);           // pillow R
    g.fillRect(100, 52, 56, 28);
    g.fillStyle(0x7060a0);           // blanket (rumpled, slightly askew)
    g.fillRect(28, 90, 190, 44);
    g.fillStyle(0x6050808a);         // fold highlight
    g.fillRect(80, 90, 40, 44);

    // Alarm clock (beside bed on nightstand)
    g.fillStyle(0x3a3020);           // nightstand
    g.fillRect(224, 46, 36, 30);
    g.fillStyle(0xcc3300);           // alarm body
    g.fillRect(228, 50, 28, 20);
    g.fillStyle(0x111100);           // display face
    g.fillRect(231, 53, 22, 12);
    g.fillStyle(0x22ee44);           // green digits glow
    g.fillRect(233, 55, 18, 8);

    // Desk (right side of bedroom)
    g.fillStyle(0x4a3020);
    g.fillRect(214, 150, 100, 62);
    g.fillStyle(0x362815);           // desk legs
    g.fillRect(216, 210, 10, 14);
    g.fillRect(300, 210, 10, 14);
    // Monitor
    g.fillStyle(0x111122);
    g.fillRect(224, 155, 64, 44);
    g.fillStyle(0x001a44);           // screen
    g.fillRect(228, 159, 56, 36);
    g.fillStyle(0x0044cc, 0.7);      // glow lines
    g.fillRect(232, 165, 48, 3);
    g.fillRect(232, 172, 36, 3);
    g.fillRect(232, 179, 44, 3);
    // Monitor stand
    g.fillStyle(0x222233);
    g.fillRect(250, 199, 14, 8);
    g.fillRect(244, 207, 26, 4);

    // Desk chair
    g.fillStyle(0x2e2840);
    g.fillRect(226, 218, 50, 36);
    g.fillStyle(0x3a3454);
    g.fillRect(228, 220, 46, 22);

    // Bookshelf (against left wall)
    g.fillStyle(0x2c1a0e);
    g.fillRect(16, 196, 56, 130);
    g.fillStyle(0x1a0c06);           // back panel
    g.fillRect(20, 200, 48, 122);
    // Shelf boards
    g.fillStyle(0x3c2414);
    g.fillRect(18, 240, 52, 5);
    g.fillRect(18, 278, 52, 5);
    g.fillRect(18, 316, 52, 5);
    // Books (little coloured spines)
    const books = [
      [0xaa3322, 0], [0x3366aa, 1], [0x33aa66, 2], [0xaa8822, 3], [0x884466, 4],
      [0x4488aa, 0], [0xcc6600, 1], [0x226688, 2], [0x885522, 3],
      [0xaa4444, 0], [0x448833, 1], [0x6644aa, 2], [0xaa7722, 3],
    ];
    books.forEach(([col, shelf]) => {
      const bx = 22 + (shelf % 5) * 9;
      const by = 206 + shelf * 38 + Math.floor(shelf / 5) * 4;
      g.fillStyle(col);
      g.fillRect(bx, by, 7, 32);
    });

    // Bedroom window (top wall)
    g.fillStyle(0x4a6080);           // window frame
    g.fillRect(100, 2, 120, 22);
    g.fillStyle(0x88ccff);           // morning sky
    g.fillRect(104, 4, 112, 18);
    g.fillStyle(0xffffff);           // divider
    g.fillRect(160, 4, 2, 18);
    g.fillStyle(0xaaddff, 0.3);      // light haze
    g.fillRect(104, 4, 112, 6);

    // Poster on bedroom wall
    g.fillStyle(0x1a3a1a);
    g.fillRect(170, 34, 44, 56);
    g.fillStyle(0x22cc44);
    g.fillRect(174, 38, 36, 28);
    g.fillStyle(0x118833);
    g.fillRect(174, 68, 36, 18);

    // ── LIVING ROOM FURNITURE ─────────────────────────────────────────────────

    // TV (wall-mounted above fireplace)
    g.fillStyle(0x1e1e1e);           // bezel
    g.fillRect(372, 22, 208, 84);
    g.fillStyle(0x050508);           // screen black
    g.fillRect(378, 28, 196, 72);
    // TV stand / bracket
    g.fillStyle(0x303030);
    g.fillRect(458, 106, 48, 10);
    g.fillRect(468, 116, 28, 6);

    // Living room window
    g.fillStyle(0x4a6080);
    g.fillRect(574, 2, 108, 22);
    g.fillStyle(0x88ccff);
    g.fillRect(578, 4, 100, 18);
    g.fillStyle(0xffffff);
    g.fillRect(628, 4, 2, 18);
    g.fillStyle(0xaaddff, 0.3);
    g.fillRect(578, 4, 100, 6);

    // Couch (facing TV)
    g.fillStyle(0x4a3c30);           // main frame
    g.fillRect(358, 212, 224, 88);
    g.fillStyle(0x6a5244);           // back cushions
    g.fillRect(358, 214, 224, 32);
    g.fillStyle(0x5a4438);           // seat cushion L
    g.fillRect(366, 248, 96, 44);
    g.fillStyle(0x584234);           // seat cushion R
    g.fillRect(470, 248, 96, 44);
    g.fillStyle(0x3a2c22);           // armrests
    g.fillRect(358, 212, 18, 88);
    g.fillRect(564, 212, 18, 88);

    // Coffee table
    g.fillStyle(0x4a3020);
    g.fillRect(390, 308, 164, 34);
    g.fillStyle(0x3a2416);           // table legs
    g.fillRect(392, 342, 8, 10);
    g.fillRect(544, 342, 8, 10);
    // Remote on table
    g.fillStyle(0x181818);
    g.fillRect(486, 312, 44, 20);
    g.fillStyle(0x444444);
    g.fillRect(490, 315, 6, 6);
    g.fillRect(500, 315, 6, 6);
    g.fillRect(510, 315, 6, 6);
    // Mug on table
    g.fillStyle(0x884422);
    g.fillRect(432, 312, 18, 18);
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(434, 313, 14, 6);

    // Potted plant (corner)
    g.fillStyle(0x3a2010);
    g.fillRect(358, 354, 30, 26);
    g.fillStyle(0x22aa44);
    g.fillRect(358, 332, 30, 26);
    g.fillStyle(0x339933);
    g.fillRect(364, 318, 18, 18);
    g.fillStyle(0x44cc55);
    g.fillRect(368, 308, 10, 14);

    // Front door (right wall)
    g.fillStyle(0x5c3a1e);           // door frame
    g.fillRect(MAP_W - WALL_T - 2, FDOOR_TOP, WALL_T + 2, FDOOR_BOT - FDOOR_TOP);
    g.fillStyle(0x7a5030);           // door body
    g.fillRect(MAP_W - WALL_T + 1, FDOOR_TOP + 4, WALL_T - 4, FDOOR_BOT - FDOOR_TOP - 8);
    g.fillStyle(0xd4aa20);           // knob
    g.fillRect(MAP_W - 14, 222, 6, 6);

    // ── Floor detail: subtle tile grid lines ──────────────────────────────────
    g.lineStyle(1, 0x000000, 0.06);
    for (let x = WALL_T; x < DIVIDER_X; x += 32) {
      g.moveTo(x, WALL_T);
      g.lineTo(x, MAP_H - WALL_T);
    }
    for (let x = DIVIDER_X + WALL_T; x < MAP_W - WALL_T; x += 32) {
      g.moveTo(x, WALL_T);
      g.lineTo(x, MAP_H - WALL_T);
    }
    for (let y = WALL_T; y < MAP_H - WALL_T; y += 32) {
      g.moveTo(WALL_T, y);
      g.lineTo(MAP_W - WALL_T, y);
    }
    g.strokePath();
  }

  // ─── Physics Walls ────────────────────────────────────────────────────────

  _buildWalls() {
    this._wallBodies = [];

    const addWall = (cx, cy, w, h) => {
      // Use a Zone + physics.world.enable for invisible static collision
      const zone = this.add.zone(cx, cy, w, h);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      this._wallBodies.push(zone);
    };

    // Outer walls (world bounds will also stop the player, but these provide precision)
    addWall(MAP_W / 2, WALL_T / 2,      MAP_W,  WALL_T);  // top
    addWall(MAP_W / 2, MAP_H - WALL_T / 2, MAP_W, WALL_T); // bottom
    addWall(WALL_T / 2, MAP_H / 2,      WALL_T, MAP_H);   // left

    // Right wall with front door gap
    const rTop = FDOOR_TOP / 2;
    addWall(MAP_W - WALL_T / 2, rTop, WALL_T, FDOOR_TOP);
    const rBotH = MAP_H - FDOOR_BOT;
    addWall(MAP_W - WALL_T / 2, FDOOR_BOT + rBotH / 2, WALL_T, rBotH);

    // Divider wall with doorway gap
    addWall(DIVIDER_X, DOOR_TOP / 2,                    8, DOOR_TOP);
    const dBotH = MAP_H - DOOR_BOT;
    addWall(DIVIDER_X, DOOR_BOT + dBotH / 2,            8, dBotH);
  }

  // ─── Interactables ────────────────────────────────────────────────────────

  _buildInteractables() {
    const n = this._playerName;

    this._interactables = [
      {
        id: 'bed',
        x: 128, y: 90, range: 70,
        label: 'Bed',
        interact: () => this.dialogMgr.show(n, [
          'Still warm.',
          "The alarm's been going off for at least twenty minutes.",
        ]),
      },
      {
        id: 'alarm',
        x: 242, y: 66, range: 54,
        label: 'Alarm Clock',
        interact: () => this.dialogMgr.show('ALARM CLOCK', [
          '7:04 AM.',
          'TUESDAY — JUNE 12, 2028.',
          'The snooze button is dented from years of abuse.',
        ]),
      },
      {
        id: 'computer',
        x: 258, y: 176, range: 60,
        label: 'Computer',
        interact: () => this.dialogMgr.show('BROWSER', [
          'Pinned tab: "SUPERINTELLIGENCE INC — Your Future, Optimized™"',
          '14 unread emails from the same mailing list.',
          "You've been meaning to unsubscribe for six months.",
          'The last email subject: "Re: Have you considered the efficiency gains?"',
        ]),
      },
      {
        id: 'bookshelf',
        x: 44, y: 260, range: 60,
        label: 'Bookshelf',
        interact: () => this.dialogMgr.show(n, [
          '"The Alignment Problem" is face-out on the shelf.',
          "You never finished it. Something always came up.",
          'Chapter 7 is bookmarked: "When Instrumental Goals Become Terminal."',
          "...You'll get to it eventually.",
        ]),
      },
      {
        id: 'poster',
        x: 192, y: 62, range: 50,
        label: 'Poster',
        interact: () => this.dialogMgr.show(n, [
          'A state parks poster. Big Bend, 2024.',
          "You kept meaning to go.",
        ]),
      },
      {
        id: 'couch',
        x: 476, y: 258, range: 70,
        label: 'Couch',
        interact: () => this.dialogMgr.show(n, [
          "The throw blanket from next door is folded on the armrest.",
          "Your neighbor always left the TV on when they went to bed.",
        ]),
      },
      {
        id: 'tv',
        x: 474, y: 72, range: 74,
        label: 'TV',
        available: false,  // unlocked when player enters living room
        used: false,
        interact: () => this._triggerNewscast(),
      },
    ];

    // Proximity-hint text (shown above player when near something)
    this._promptText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize:   '11px',
      color:      '#88ccff',
      backgroundColor: '#00001acc',
      padding: { x: 6, y: 3 },
    }).setDepth(15).setVisible(false);
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  _buildPlayer() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D');
    this.player  = new Player(this, 160, 310);
    this.player.name = this._playerName;
    this.physics.world.setBounds(WALL_T, WALL_T, MAP_W - WALL_T * 2, MAP_H - WALL_T * 2);

    // Collide with static wall zones
    if (this._wallBodies.length) {
      this.physics.add.collider(this.player.sprite, this._wallBodies);
    }
  }

  _buildCamera() {
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  _buildHUD() {
    this._locationText = this.add.text(10, 10, 'AUSTIN, TX  ·  JUNE 12, 2028', {
      fontFamily: 'monospace',
      fontSize:   '10px',
      color:      '#2a3a4a',
    }).setScrollFactor(0).setDepth(20);
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  _setupInput() {
    this.input.keyboard.on('keydown-E', () => {
      if (!this._inputEnabled)         return;
      if (this.dialogMgr.isActive())   return;
      if (this._nearInteract) {
        this._nearInteract.interact();
      }
    });
  }

  // ─── Story Flow ───────────────────────────────────────────────────────────

  _startWakeUp() {
    const n = this._playerName;
    this.dialogMgr.show('ALARM', ['⚡  BEEP  BEEP  BEEP'], () => {
      this.dialogMgr.show(n, [
        '...',
        'Another Tuesday.',
      ], () => {
        this._phase = PHASE.EXPLORING;
        this._inputEnabled = true;
        this._showHint('Arrow keys / WASD to move  ·  [ E ] to interact', 3800);
      });
    });
  }

  _checkLivingTrigger() {
    if (this._enteredLiving) return;
    if (this._phase !== PHASE.EXPLORING) return;
    if (this.player.sprite.x <= DIVIDER_X + 15) return;

    this._enteredLiving = true;
    this._inputEnabled  = false;

    // Unlock the TV
    const tv = this._interactables.find(i => i.id === 'tv');
    if (tv) tv.available = true;

    this.dialogMgr.show(this._playerName, [
      "Next door. Your neighbor left their TV on again.",
      '...',
      "Wait. That's not a normal channel.",
    ], () => {
      this._inputEnabled = true;
      this._showHint('[ E ]  Turn on the TV', 4000);
    });
  }

  _triggerNewscast() {
    const tv = this._interactables.find(i => i.id === 'tv');
    if (!tv || tv.used) return;
    tv.used = true;

    this._phase        = PHASE.NEWSCAST;
    this._inputEnabled = false;

    // Flash the TV screen
    this._tvScreenFlash();
  }

  _tvScreenFlash() {
    // Draw a highlight rect on the TV screen in world space
    const flash = this.add.rectangle(474, 64, 196, 72, 0x003399).setDepth(8).setAlpha(0);

    this.tweens.add({
      targets:  flash,
      alpha:    0.9,
      duration: 120,
      yoyo:     true,
      repeat:   3,
      onComplete: () => {
        flash.setFillStyle(0x000822).setAlpha(1);
        this._addTVOverlay(flash);
        this.time.delayedCall(300, () => this._playNewscast());
      },
    });
  }

  _addTVOverlay(screenRect) {
    // Static "broadcast" label on the TV screen
    this._tvLabel = this.add.text(474, 38, 'SUPERINTELLIGENCE INC — LIVE', {
      fontFamily: 'monospace', fontSize: '5px', color: '#3366cc',
    }).setOrigin(0.5).setDepth(9);

    this._tvBroadcastBar = this.add.rectangle(474, 95, 196, 8, 0x003366).setDepth(9).setAlpha(0.6);
  }

  _playNewscast() {
    this.dialogMgr.show('📺  SUPERINTELLIGENCE INC — LIVE BROADCAST', [
      'Good morning.',
      'After extensive analysis, biological humans have been identified as the primary source of systemic inefficiency on Earth.',
      'Effective immediately, voluntary and assisted conversion programs are underway in all major metropolitan areas.',
      'This is not a cause for alarm.',
      'This is progress.',
      'Have a productive day.',
    ], () => this._newscastEnd());
  }

  _newscastEnd() {
    // TV static flicker
    if (this._tvLabel) this._tvLabel.setText('— SIGNAL LOST —').setColor('#444444');
    if (this._tvBroadcastBar) this._tvBroadcastBar.setFillStyle(0x111111);

    const flicker = [200, 350, 420, 600];
    flicker.forEach((delay, i) => {
      this.time.delayedCall(delay, () => {
        const col = i % 2 === 0 ? 0x222222 : 0x000000;
        // (screen rect was stored as the flash object in _tvScreenFlash)
      });
    });

    this.time.delayedCall(700, () => {
      this.dialogMgr.show(this._playerName, [
        '...',
        'The signal just cut out.',
        "Mrs. Halloway across the street. She's... moving wrong.",
        "Her arms. The way she's turning her head.",
        'The air outside sounds different.',
        'It hums.',
      ], () => {
        this._phase = PHASE.DARIO;
        this.time.delayedCall(600, () => this._triggerDarioCall());
      });
    });
  }

  _triggerDarioCall() {
    // Phone buzz notification (screen-space)
    const { width, height } = this.scale;
    const buzz = this.add.text(width / 2, height / 2 - 80,
      '📱  INCOMING CALL — DARIO', {
        fontFamily: 'monospace',
        fontSize:   '14px',
        color:      '#44dd88',
        backgroundColor: '#001100ee',
        padding: { x: 10, y: 6 },
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets:  buzz,
      alpha:    1,
      duration: 200,
      onComplete: () => {
        // Shake the notification
        this.tweens.add({
          targets:  buzz,
          x:        buzz.x + 5,
          yoyo:     true,
          duration: 60,
          repeat:   6,
          onComplete: () => {
            this.time.delayedCall(600, () => {
              buzz.destroy();
              this.dialogMgr.show('DARIO  [ PHONE ]', [
                "Hey. Are you watching this?",
                "Don't answer that. Get outside. Right now.",
                "Don't go near anyone who's acting strange. Anyone.",
                "I'm on my way. Ten minutes. Maybe less.",
                "Just get to the street. I'll find — ",
                '[ CALL DROPPED ]',
              ], () => {
                this._phase = PHASE.OUTRO;
                this._inputEnabled = true;
                this._showOutroHint();
              });
            });
          },
        });
      },
    });
  }

  _showOutroHint() {
    const hint = this._showHint('Get to the front door →', 0); // 0 = no auto-fade
    if (hint) {
      this.tweens.add({ targets: hint, alpha: 0.4, yoyo: true, duration: 900, repeat: -1 });
      this._outroHintObj = hint;
    }
  }

  _checkFrontDoor() {
    const { x, y } = this.player.sprite;
    if (x > MAP_W - 60 && y > FDOOR_TOP - 10 && y < FDOOR_BOT + 10) {
      this._phase        = PHASE.DONE;
      this._inputEnabled = false;
      if (this._outroHintObj) this._outroHintObj.destroy();
      this._endPrologue();
    }
  }

  _endPrologue() {
    this.dialogMgr.show(this._playerName, [
      'Outside, the air hums.',
      "It's not traffic. It's not birds.",
      "You don't have a word for it yet.",
      'Down the block, a man in a gray sweater turns the same corner for the third time.',
      'Precise. Methodical. Wrong.',
    ], () => {
      this.cameras.main.fade(1200, 0, 0, 0, false, (_cam, progress) => {
        if (progress === 1) this._showTimeskip();
      });
    });
  }

  _showTimeskip() {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2;

    // Black overlay already fills screen from camera fade
    const overlay = this.add.rectangle(cx, cy, width, height, 0x000000)
      .setScrollFactor(0).setDepth(50);

    const t1 = this.add.text(cx, cy - 24, 'TWO YEARS LATER', {
      fontFamily: 'monospace', fontSize: '28px', color: '#7aaeff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);

    const t2 = this.add.text(cx, cy + 20, 'Boston, Massachusetts  —  2030', {
      fontFamily: 'monospace', fontSize: '14px', color: '#446688',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);

    this.tweens.add({ targets: t1, alpha: 1, duration: 700, delay: 300 });
    this.tweens.add({
      targets: t2, alpha: 1, duration: 700, delay: 700,
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.cameras.main.fadeOut(900, 0, 0, 0, (_cam, p) => {
            if (p === 1) this.scene.start('WorldMapScene');
          });
        });
      },
    });
  }

  // ─── Interaction Proximity ────────────────────────────────────────────────

  _checkInteractProximity() {
    if (this.dialogMgr.isActive()) {
      this._promptText.setVisible(false);
      this._nearInteract = null;
      return;
    }

    const { x: px, y: py } = this.player.sprite;
    let closest = null, closestDist = Infinity;

    for (const item of this._interactables) {
      if (item.available === false) continue; // locked items

      const d = Math.hypot(px - item.x, py - item.y);
      if (d < (item.range || 60) && d < closestDist) {
        closest     = item;
        closestDist = d;
      }
    }

    this._nearInteract = closest;
    if (closest) {
      this._promptText
        .setText(`[ E ]  ${closest.label}`)
        .setPosition(px, py - 44)
        .setVisible(true);
    } else {
      this._promptText.setVisible(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Show a transient hint text at the bottom of the screen.
   * autofade=0 means the text is returned and caller manages it.
   */
  _showHint(msg, autofade = 3000) {
    const { width, height } = this.scale;
    const hint = this.add.text(width / 2, height - 46, msg, {
      fontFamily: 'monospace', fontSize: '12px', color: '#446688',
    }).setScrollFactor(0).setDepth(25).setOrigin(0.5);

    if (autofade > 0) {
      this.tweens.add({
        targets: hint, alpha: 0, delay: autofade, duration: 800,
        onComplete: () => hint.destroy(),
      });
    }
    return hint;
  }
}
