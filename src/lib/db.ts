import Dexie, { type Table } from 'dexie';

export interface Character {
    id?: number;
    name: string;
    abilities: Record<string, string>; // e.g. { STR: 'd4', DEX: 'd6' }
    maxHp: number;
    currentHp: number;
    hp?: number; // @deprecated
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
