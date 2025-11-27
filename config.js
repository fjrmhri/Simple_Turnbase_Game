export const CONFIG = {
  manaRegenHero: 3,
  manaRegenBoss: 4,
  difficulties: {
    easy: { label: "Easy", heroHp: 1.1, heroAtk: 1.05, bossHp: 0.9, bossAtk: 0.85, mp: 1.1 },
    normal: { label: "Normal", heroHp: 1, heroAtk: 1, bossHp: 1, bossAtk: 1, mp: 1 },
    hard: { label: "Hard", heroHp: 0.95, heroAtk: 0.95, bossHp: 1.2, bossAtk: 1.15, mp: 0.95 }
  },
  modifiers: [
    { id: "glass", label: "Glass Cannon", heroHp: 0.85, heroAtk: 1.2 },
    { id: "mana", label: "Mana Drought", mp: 0.75 },
    { id: "nohealer", label: "No Healer", disableHero: "healer" }
  ],
  heroes: [
    {
      id: "tank",
      name: "Aegis",
      maxHp: 520,
      maxMp: 80,
      atk: 46,
      def: 22,
      mag: 16,
      spd: 14,
      portrait: "gif/tank_idle.gif",
      skills: [
        { id: "strike", name: "Shield Slam", type: "physical", power: 1, cost: 5, target: "boss", description: "Solid blow with shield." },
        { id: "guard", name: "Bulwark", type: "guard", power: 0.35, cost: 10, target: "team", duration: 1, description: "Reduce team damage this turn." },
        { id: "break", name: "Armor Break", type: "debuff", debuff: { defDown: 0.2, duration: 2 }, power: 0.8, cost: 12, target: "boss", cooldown: 2, description: "Lower boss defense." },
        { id: "fortify", name: "Fortify", type: "buff", buff: { guard: 0.5, duration: 1 }, power: 0, cost: 8, target: "self", cooldown: 2, description: "Guard self strongly." }
      ]
    },
    {
      id: "rogue",
      name: "Shade",
      maxHp: 400,
      maxMp: 90,
      atk: 58,
      def: 14,
      mag: 20,
      spd: 24,
      portrait: "gif/rogue_idle.gif",
      skills: [
        { id: "stab", name: "Quick Stab", type: "physical", power: 0.9, cost: 6, target: "boss" },
        { id: "flurry", name: "Flurry", type: "physical", power: 1.2, cost: 14, target: "boss", cooldown: 2 },
        { id: "ignite", name: "Fire Bomb", type: "dot", power: 0.6, cost: 16, target: "boss", dot: { amount: 25, duration: 2 }, cooldown: 2, description: "Applies burning." }
      ]
    },
    {
      id: "mage",
      name: "Lyra",
      maxHp: 360,
      maxMp: 120,
      atk: 28,
      def: 12,
      mag: 70,
      spd: 18,
      portrait: "gif/mage_idle.gif",
      skills: [
        { id: "bolt", name: "Arcane Bolt", type: "magic", power: 1.05, cost: 10, target: "boss" },
        { id: "nova", name: "Star Nova", type: "magic", power: 0.85, cost: 16, target: "boss", cooldown: 2 },
        { id: "aegis", name: "Veil", type: "buff", buff: { dmgDown: 0.2, duration: 2 }, power: 0, cost: 12, target: "team" }
      ]
    },
    {
      id: "healer",
      name: "Seren",
      maxHp: 380,
      maxMp: 140,
      atk: 22,
      def: 14,
      mag: 55,
      spd: 16,
      portrait: "gif/healer_idle.gif",
      skills: [
        { id: "heal", name: "Radiant Heal", type: "heal", power: 1, cost: 12, target: "ally" },
        { id: "groupheal", name: "Soothing Light", type: "heal", power: 0.7, cost: 18, target: "team", cooldown: 2 },
        { id: "bless", name: "Blessing", type: "buff", buff: { atkUp: 0.2, duration: 2 }, power: 0, cost: 12, target: "team" }
      ]
    }
  ],
  boss: {
    id: "boss",
    name: "Elder Dragon",
    maxHp: 2400,
    maxMp: 200,
    atk: 62,
    def: 20,
    mag: 50,
    spd: 20,
    portrait: "gif/dragon.gif",
    phases: [
      {
        threshold: 0.7,
        weights: { claw: 4, flame: 2, tail: 1 },
        telegraph: { move: "flame", text: "The dragon inhales deeply, flames swirling in its throat..." }
      },
      {
        threshold: 0.4,
        weights: { claw: 2, flame: 3, roar: 2 },
        telegraph: { move: "roar", text: "Wings spread wide, a storm of embers gathers." }
      },
      { threshold: 0, weights: { flame: 2, roar: 3, crush: 2 } }
    ],
    skills: {
      claw: { id: "claw", name: "Rending Claw", type: "physical", power: 1.05, cost: 10, target: "random" },
      tail: { id: "tail", name: "Tail Swipe", type: "physical", power: 0.95, cost: 12, target: "team" },
      flame: { id: "flame", name: "Searing Flame", type: "magic", power: 1.15, cost: 16, target: "team", dot: { amount: 18, duration: 2 } },
      roar: { id: "roar", name: "Tyrant Roar", type: "debuff", power: 0.8, cost: 18, target: "team", debuff: { defDown: 0.15, duration: 2 } },
      crush: { id: "crush", name: "Crushing Dive", type: "physical", power: 1.35, cost: 20, target: "weakest" }
    }
  },
  story: {
    characters: {
      tank: { name: "Aegis", portrait: "gif/tank_idle.gif" },
      rogue: { name: "Shade", portrait: "gif/rogue_idle.gif" },
      mage: { name: "Lyra", portrait: "gif/mage_idle.gif" },
      healer: { name: "Seren", portrait: "gif/healer_idle.gif" },
      scout: { name: "Scout", portrait: "gif/soldier_idle.gif" }
    },
    scenes: [
      {
        id: "intro",
        lines: [
          { speaker: "Scout", charId: "scout", text: "The dragon nests ahead. Command wants it stopped." },
          { speaker: "Aegis", charId: "tank", text: "Then we hold the line and push forward." },
          { speaker: "Lyra", charId: "mage", text: "Mana focusing... I sense multiple phases." },
          { speaker: "Shade", charId: "rogue", text: "Let's keep it busy while I find a weak spot." },
          { speaker: "Seren", charId: "healer", text: "Stay close, I'll keep you standing." }
        ]
      },
      {
        id: "victory",
        lines: [
          { speaker: "Lyra", charId: "mage", text: "The dragon falls. The skies clear at last." },
          { speaker: "Seren", charId: "healer", text: "Well fought, everyone." }
        ]
      },
      {
        id: "defeat",
        lines: [
          { speaker: "Aegis", charId: "tank", text: "We need to regroup... the beast was too strong." },
          { speaker: "Shade", charId: "rogue", text: "Next time, I'll aim deeper." }
        ]
      }
    ]
  }
};
