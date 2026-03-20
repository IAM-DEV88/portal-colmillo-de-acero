export const SYMBOLS = [
  { id: 'skull', icon: '💀', weight: 50, name: 'MALDICIÓN' }, 
  { id: 'gold_small', icon: '⚜️', weight: 28, name: 'MONEDA' }, 
  { id: 'gold_bag', icon: '💰', weight: 16, name: 'BOLSA' }, 
  { id: 'chest', icon: '📦', weight: 2.5, name: 'COFRE' }, 
  { id: 'choker', icon: '📿', weight: 0.5, name: 'GARGANTILLA' }, 
  { id: 'thief', icon: '🗡️', weight: 3, name: 'PÍCARO' } 
];

export function getRandomSymbol() {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  
  for (const symbol of SYMBOLS) {
    if (rand < symbol.weight) return symbol;
    rand -= symbol.weight;
  }
  return SYMBOLS[0];
}

export function getOutcome() {
  const rand = Math.random();
  
  // 1% Chance of TOTAL LOSS (3 Skulls)
  if (rand < 0.01) {
    const skull = SYMBOLS.find(s => s.id === 'skull');
    return [skull, skull, skull];
  }
  
  // 4% Chance of WIN (3 matching)
  if (rand < 0.05) {
    let sym = getRandomSymbol();
    while (sym.id === 'skull') {
      sym = getRandomSymbol();
    }
    return [sym, sym, sym];
  } 
  
  // 35% Chance of NEAR MISS (2 matching)
  if (rand < 0.40) {
    const sym = getRandomSymbol();
    const other = getRandomSymbol();
    return [sym, sym, other];
  } 
  
  // Random
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

export function calculatePrize(outcome, currentGoldPool) {
  const [s1, s2, s3] = outcome;
  
  if (s1.id === 'skull' && s2.id === 'skull' && s3.id === 'skull') {
    return { type: 'loss', amount: Math.floor(currentGoldPool / 2), name: 'MALDICIÓN' };
  }
  
  if (s1.id === s2.id && s2.id === s3.id) {
    const symbolId = s1.id;
    if (symbolId === 'choker') return { type: 'item', id: 'choker', name: 'GARGANTILLA LEGENDARIA' };
    if (symbolId === 'chest') return { type: 'gold', amount: 7000, name: 'GRAN COFRE' };
    if (symbolId === 'gold_bag') return { type: 'gold', amount: 2900, name: 'BOLSA DE ORO' };
    if (symbolId === 'gold_small') return { type: 'gold', amount: 600, name: 'MONEDAS' };
    if (symbolId === 'thief') return { type: 'turns', amount: 5, name: 'BOTÍN DE TURNOS' };
  }
  
  return { type: 'none' };
}
