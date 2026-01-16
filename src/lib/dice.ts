/**
 * Parses a dice string and rolls it.
 * Supports formats: 'd4', 'd6+1', 'd4-1', 'd20'.
 */

export interface RollResult {
    total: number;
    roll: number;
    sides: number;
    modifier: number;
    display: string; // e.g. "4 (d6)" or "5 (d4+1)"
}

export const parseAndRoll = (dieStr: string): RollResult => {
    // Regex to parse "d{sides}{+/-}{modifier}"
    // Matches: d6, d6+1, d6-1
    const match = dieStr.toLowerCase().match(/^d(\d+)(?:([+-])(\d+))?$/);

    if (!match) {
        // Fallback for invalid input
        return { total: 0, roll: 0, sides: 0, modifier: 0, display: 'Error' };
    }

    const sides = parseInt(match[1], 10);
    const operator = match[2]; // '+' or '-' or undefined
    const modVal = match[3] ? parseInt(match[3], 10) : 0;

    const modifier = operator === '-' ? -modVal : modVal;

    const roll = Math.floor(Math.random() * sides) + 1;
    const total = roll + modifier;

    const displayModifier = modifier !== 0 ? `${operator}${modVal}` : '';
    return {
        total,
        roll,
        sides,
        modifier,
        display: `Rolled ${roll} on d${sides}${displayModifier}`
    };
};
