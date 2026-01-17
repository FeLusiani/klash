import Dexie, { type Table } from 'dexie';

export interface AbilityValue {
    current: string;
    max: string;
}

export interface Character {
    id?: number;
    name: string;
    abilities: Record<string, AbilityValue>;
    maxHp: number;
    currentHp: number;
    currentWounds: number;
    hp?: number; // @deprecated
    inventory?: string[];
    createdAt: number;
}

export class AppDatabase extends Dexie {
    characters!: Table<Character>;

    constructor() {
        super('KlashOfflinePWA');

        // Define schema
        this.version(1).stores({
            characters: '++id, name, createdAt'
        });
    }
}

export const db = new AppDatabase();
