export type Die = 'd4' | 'd4-1' | 'd4-2' | 'd6' | 'd8' | 'd10' | 'd12' | 'd12+1' | 'd12+2' | 'd12+3' | 'd20';

export interface Ability {
    code: string;
    name: string;
}

export const GAME_CONFIG = {
    abilities: [
        { code: 'STR', name: 'Strength' },
        { code: 'DEX', name: 'Dexterity' },
        { code: 'WIL', name: 'Willpower' }
    ] as Ability[],
    // Full range of possible dice values in the game
    dice: ['d4-2', 'd4-1', 'd4', 'd6', 'd8', 'd10', 'd12', 'd12+1', 'd12+2', 'd12+3', 'd20'] as Die[],
    // Dice available at character creation
    creationDice: ['d4', 'd6', 'd8', 'd10'] as Die[]
};

// Increment this to wipe data on client update
export const DATA_VERSION = 2;
