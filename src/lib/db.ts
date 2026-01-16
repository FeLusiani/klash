import Dexie, { type Table } from 'dexie';

// Define the interface for the persistent data
export interface Todo {
    id?: number;
    title: string;
    completed: boolean;
    createdAt: number;
}

export class AppDatabase extends Dexie {
    todos!: Table<Todo>;

    constructor() {
        super('OfflinePWA');

        // Define schema
        this.version(1).stores({
            todos: '++id, completed, createdAt' // Primary key and indexed props
        });
    }
}

export const db = new AppDatabase();
