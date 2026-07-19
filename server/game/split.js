// Deterministic seeded shuffle so a given round's split is reproducible for debugging.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/**
 * Splits managerIds ~50/50 into 'human' and 'ai' groups, seeded by roundId
 * so the split is deterministic and reproducible given the same inputs.
 */
export function splitManagers(managerIds, roundId) {
  const rand = mulberry32(seedFromString(roundId));
  const shuffled = [...managerIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const half = Math.ceil(shuffled.length / 2);
  const groupHuman = shuffled.slice(0, half);
  const groupAi = shuffled.slice(half);
  return { groupHuman, groupAi };
}
