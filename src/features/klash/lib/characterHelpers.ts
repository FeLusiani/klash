import { GAME_CONFIG, type Die } from '../../../config/game';
import type { AbilityValue, InventoryItem } from '../../../lib/db';

export type AbilityDiceMap = Record<string, Die>;

export const DEFAULT_ABILITY_DIE: Die = 'd6';
export const DEFAULT_INVENTORY_QUALITY = 3;
export const MAX_INVENTORY_ITEMS = 10;

export const createDefaultAbilityDice = (): AbilityDiceMap =>
    GAME_CONFIG.abilities.reduce<AbilityDiceMap>((abilities, ability) => {
        abilities[ability.code] = DEFAULT_ABILITY_DIE;
        return abilities;
    }, {});

export const buildAbilityValues = (abilities: AbilityDiceMap): Record<string, AbilityValue> =>
    Object.entries(abilities).reduce<Record<string, AbilityValue>>((values, [code, die]) => {
        values[code] = { current: die, max: die };
        return values;
    }, {});

export const extractAbilityMaxDice = (abilities: Record<string, AbilityValue>): AbilityDiceMap =>
    GAME_CONFIG.abilities.reduce<AbilityDiceMap>((dice, ability) => {
        dice[ability.code] = (abilities[ability.code]?.max as Die | undefined) ?? DEFAULT_ABILITY_DIE;
        return dice;
    }, {});

export const dieIndex = (die: string): number => {
    const index = GAME_CONFIG.dice.indexOf(die as Die);
    return index >= 0 ? index : GAME_CONFIG.dice.indexOf(DEFAULT_ABILITY_DIE);
};

export const clampAbilityValuesToMax = (
    currentAbilities: Record<string, AbilityValue>,
    maxDice: AbilityDiceMap
): Record<string, AbilityValue> => {
    const nextAbilities = { ...currentAbilities };

    Object.entries(maxDice).forEach(([code, maxDie]) => {
        const currentAbility = currentAbilities[code];
        const currentDie = currentAbility?.current ?? maxDie;
        const clampedCurrent = dieIndex(currentDie) > dieIndex(maxDie) ? maxDie : currentDie;

        nextAbilities[code] = {
            current: clampedCurrent,
            max: maxDie
        };
    });

    return nextAbilities;
};

export const dieSides = (die: string, fallback = 6): number => {
    const match = die.match(/d(\d+)/);
    return match ? parseInt(match[1], 10) : fallback;
};

export const magicDiceCount = (wilDie: string): number =>
    Math.max(0, dieIndex(wilDie) - dieIndex('d4'));

export const normalizeInventoryItem = (item: string | InventoryItem): InventoryItem =>
    typeof item === 'string'
        ? { name: item, quality: DEFAULT_INVENTORY_QUALITY }
        : item;

export const createInventoryItem = (): InventoryItem => ({
    name: '',
    quality: DEFAULT_INVENTORY_QUALITY
});

export const nextItemQuality = (quality: number): number =>
    quality <= 0 ? DEFAULT_INVENTORY_QUALITY : quality - 1;
