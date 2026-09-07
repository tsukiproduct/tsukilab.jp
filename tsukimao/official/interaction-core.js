/* Shared, deterministic interaction rules. No network or DOM dependencies. */
const PlayCore = (() => {
  function shuffled(items, random = Math.random) {
    const pool = [...items];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }
  function createDrawMachine(items, random = Math.random) {
    if (!items.length) throw new Error('No films');
    let state = 'idle', bag = [], selected = null, last = null;
    const discovered = new Set();
    const allowed = {spinning:'dropping',dropping:'ready',ready:'opening',opening:'screening'};
    return {
      get state() { return state; },
      get selected() { return selected; },
      get discovered() { return discovered.size; },
      start() {
        if (state !== 'idle') return null;
        if (!bag.length) {
          bag = shuffled(items, random);
          if (bag.length > 1 && bag[bag.length - 1].id === last) [bag[0],bag[bag.length - 1]] = [bag[bag.length - 1],bag[0]];
        }
        selected = bag.pop(); last = selected.id; state = 'spinning'; return selected;
      },
      advance(next) {
        if (allowed[state] !== next) return false;
        state = next;
        if (next === 'screening') discovered.add(selected.id);
        return true;
      },
      reset() {
        if (state !== 'screening') return false;
        state = 'idle'; selected = null; return true;
      }
    };
  }
  function spring(position, velocity, elapsed) {
    const dt = Math.max(0,Math.min(elapsed, 0.032));
    velocity += (-260 * position - 21 * velocity) * dt;
    position += velocity * dt;
    if (Math.abs(position) < 0.04 && Math.abs(velocity) < 0.08) return [0,0];
    return [position,velocity];
  }
  const angleDelta = (a,b) => ((a-b+540)%360)-180;
  return Object.freeze({createDrawMachine,spring,angleDelta});
})();
