import random
from collections import Counter

# Weights
symbols = {
    'skull': 45,
    'gold_small': 25,
    'gold_bag': 15,
    'chest': 8,
    'choker': 2,
    'thief': 5
}

total_weight = sum(symbols.values())
probs = {k: v/total_weight for k, v in symbols.items()}

print('--- ANÁLISIS DE PROBABILIDADES (TIRADA ÚNICA) ---')
print(f'Peso Total: {total_weight}')

print('\n[Probabilidad de 3 Coincidencias (Jackpot/Premio Mayor)]')
print(f"{'Símbolo':<15} {'Probabilidad':<12} {'1 en X':<10} {'Premio'}")
print("-" * 50)

p3_total = 0
for sym, p in probs.items():
    p3 = p ** 3
    p3_total += p3
    prize = "???"
    if sym == 'choker': prize = "ITEM REAL"
    elif sym == 'chest': prize = "7000 Oro"
    elif sym == 'gold_bag': prize = "3000 Oro"
    elif sym == 'gold_small': prize = "1000 Oro"
    elif sym == 'thief': prize = "+5 Turnos"
    elif sym == 'skull': prize = "0 (Perder)"
    
    print(f"{sym:<15} {p3:.6%}    {1/p3:>8.1f}   {prize}")

print(f"\nProbabilidad Total de sacar 3 iguales: {p3_total:.2%}")

print('\n[Probabilidad de 2 Coincidencias (Par)]')
# P(exactly 2) = 3 * p^2 * (1-p)
# Note: In code, Skulls pair pays 0. Thief pair pays turns. Others pay 100.
p2_paying_gold = 0
p2_thief = 0
p2_skull = 0

for sym, p in probs.items():
    p2 = 3 * (p**2) * (1-p)
    if sym == 'thief':
        p2_thief += p2
    elif sym == 'skull':
        p2_skull += p2
    else:
        p2_paying_gold += p2

print(f"Par de Ladrones (+2 Turnos): {p2_thief:.2%} (1 en {1/p2_thief:.1f})")
print(f"Par de Calaveras (0 Oro):    {p2_skull:.2%} (1 en {1/p2_skull:.1f})")
print(f"Par Pagador (100 Oro):       {p2_paying_gold:.2%} (1 en {1/p2_paying_gold:.1f})")

print('\n--- SIMULACIÓN DE SESIÓN (5 Créditos Iniciales, Pozo 100) ---')

symbol_list = []
for k, v in symbols.items():
    symbol_list.extend([k] * v)

def spin_reel():
    return random.choice(symbol_list)

def simulate_session(initial_credits=5, initial_gold=100):
    credits = initial_credits
    gold = initial_gold
    
    while credits > 0:
        credits -= 1
        
        r1 = spin_reel()
        r2 = spin_reel()
        r3 = spin_reel()
        
        # Check 3 match
        if r1 == r2 == r3:
            s = r1
            if s == 'choker':
                pass # Item real
            elif s == 'chest':
                gold += 7000
            elif s == 'gold_bag':
                gold += 3000
            elif s == 'gold_small':
                gold += 1000
            elif s == 'thief':
                credits += 5
            
        # Check 2 match
        elif r1 == r2 or r2 == r3 or r1 == r3:
            pair = r1 if r1 == r2 else (r2 if r2 == r3 else r1)
            
            if pair == 'thief':
                credits += 2
            elif pair != 'skull':
                gold += 100
                
    return gold

SIMULATIONS = 100000
results = []
for _ in range(SIMULATIONS):
    results.append(simulate_session())

avg_gold = sum(results)/len(results)
max_gold = max(results)
print(f"Simulaciones: {SIMULATIONS}")
print(f"Oro Promedio Final: {avg_gold:.0f}")
print(f"Oro Máximo: {max_gold}")

counts = Counter(results)

# Analyze ranges
ranges = [
    (100, 100, "100 (Sin ganancia)"),
    (101, 500, "101 - 500"),
    (501, 1000, "501 - 1,000"),
    (1001, 3000, "1,001 - 3,000"),
    (3001, 7000, "3,001 - 7,000"),
    (7001, 15000, "7,001 - 15,000"),
    (15001, 999999, "15,000+")
]

print("\n[Distribución de Oro Final]")
for r_min, r_max, label in ranges:
    count = sum(c for g, c in counts.items() if r_min <= g <= r_max)
    perc = count / SIMULATIONS
    print(f"{label:<20}: {perc:.2%}")
