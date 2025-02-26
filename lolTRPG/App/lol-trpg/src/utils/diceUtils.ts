// 🎲 "3D6" → 数値を計算
export const parseDiceNotation = (notation: string): number => {
  const match = notation.match(/^(\d+)D(\d+)(\+(\d+))?$/);
  if (!match) throw new Error(`Invalid dice notation: ${notation}`);

  const diceCount = parseInt(match[1], 10); // 🎲 例: "3D6" → 3
  const diceSides = parseInt(match[2], 10); // 🎲 例: "3D6" → 6
  const bonus = match[4] ? parseInt(match[4], 10) : 0; // 🎲 例: "1D6+4" → +4

  return [...Array(diceCount)].reduce((sum) => sum + Math.floor(Math.random() * diceSides) + 1, 0) + bonus;
};

// 🎲 ダイスロール関数 (数値を受け取る)
export const rollDice = (value: number): number => {
  return value;
};
