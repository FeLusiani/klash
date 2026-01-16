import { db } from './db';
import { DATA_VERSION } from '../config/game';

const VERSION_KEY = 'klash_data_version';

/**
 * Checks if the stored data version matches the current app version.
 * If not, it wipes the database and updates the stored version.
 * @returns {Promise<boolean>} true if data was reset
 */
export const checkAndResetData = async (): Promise<boolean> => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const currentVersion = DATA_VERSION.toString();

    if (storedVersion !== currentVersion) {
        console.log(`Data version mismatch (Stored: ${storedVersion}, App: ${currentVersion}). Wiping data...`);

        // Clear all tables
        await db.characters.clear();

        // Update stored version
        localStorage.setItem(VERSION_KEY, currentVersion);

        return true;
    }

    return false;
};
