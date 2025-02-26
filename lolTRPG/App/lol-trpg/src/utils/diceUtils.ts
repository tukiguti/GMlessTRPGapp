export const rollDice = (diceFormula: string): number => {
  // `3D6+2` のような形式をパース
  const match = diceFormula.match(/(\d+)D(\d+)([+-]?\d+)?/);
  if (!match) return 0; // 無効なフォーマットなら 0 を返す

  const num = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0; // 修正値がない場合は 0

  let total = 0;
  for (let i = 0; i < num; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }

  return total + modifier;
};
