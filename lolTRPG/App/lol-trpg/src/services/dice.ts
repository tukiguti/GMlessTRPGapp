// services/dice.ts

interface DiceRoll {
    rolls: number[];
    total: number;
}

export class DiceService {
    /**
     * ダイス表記をパースする (例: "2d6+3")
     */
    private static parseDiceNotation(notation: string): { 
        count: number; 
        sides: number; 
        modifier: number; 
    } {
        const regex = /(\d+)d(\d+)(?:([+-]\d+))?/;
        const match = notation.match(regex);
        
        if (!match) {
            throw new Error(`Invalid dice notation: ${notation}`);
        }

        return {
            count: parseInt(match[1]),
            sides: parseInt(match[2]),
            modifier: match[3] ? parseInt(match[3]) : 0
        };
    }

    /**
     * 単一のダイスをロールする
     */
    private static rollDie(sides: number): number {
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * ダイス表記に基づいてロールを実行する
     */
    public static roll(notation: string, forceOnes: number = 0): DiceRoll {
        const { count, sides, modifier } = this.parseDiceNotation(notation);
        const rolls: number[] = [];

        for (let i = 0; i < count; i++) {
            if (i < forceOnes) {
                rolls.push(1);
            } else {
                rolls.push(this.rollDie(sides));
            }
        }

        return {
            rolls,
            total: rolls.reduce((sum, roll) => sum + roll, 0) + modifier
        };
    }

    /**
     * 完全成功のロールを実行する
     */
    public static perfectRoll(notation: string): DiceRoll {
        const { count, sides, modifier } = this.parseDiceNotation(notation);
        const rolls = Array(count).fill(sides);

        return {
            rolls,
            total: rolls.reduce((sum, roll) => sum + roll, 0) + modifier
        };
    }
}