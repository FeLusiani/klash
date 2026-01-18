import React, { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import * as yaml from 'js-yaml';
import { db, type Character } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import './Home.css';

export const Home: React.FC = () => {
    const characters: Character[] | undefined = useLiveQuery(() => db.characters.toArray());
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!characters || characters.length === 0) {
            alert('No characters to export');
            return;
        }

        // Remove id and createdAt fields for cleaner export
        const exportData = characters.map(({ id, createdAt, ...rest }) => rest);

        const yamlContent = yaml.dump(exportData);
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `klash-characters-${new Date().toISOString().split('T')[0]}.yaml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedCharacters = yaml.load(text) as Partial<Character>[];

            if (!Array.isArray(importedCharacters)) {
                alert('Invalid YAML format: expected an array of characters');
                return;
            }

            // Get existing character names
            const existingNames = new Set(characters?.map(c => c.name) || []);

            // Process each imported character
            for (const char of importedCharacters) {
                if (!char.name || !char.abilities) {
                    console.warn('Skipping invalid character:', char);
                    continue;
                }

                // Handle name conflicts
                let finalName = char.name;
                let counter = 1;
                while (existingNames.has(finalName)) {
                    // Check if name already has a number suffix
                    const match = finalName.match(/^(.+?)\s*\((\d+)\)$/);
                    if (match) {
                        // Increment existing number
                        const baseName = match[1];
                        counter = parseInt(match[2]) + 1;
                        finalName = `${baseName} (${counter})`;
                    } else {
                        // Add new number suffix
                        finalName = `${char.name} (${counter})`;
                    }
                    counter++;
                }

                // Add to existing names set
                existingNames.add(finalName);

                // Create character with resolved name
                await db.characters.add({
                    name: finalName,
                    abilities: char.abilities,
                    maxHp: char.maxHp ?? char.hp ?? 0,
                    currentHp: char.currentHp ?? char.hp ?? 0,
                    currentWounds: char.currentWounds ?? 0,
                    inventory: char.inventory ?? [],
                    createdAt: Date.now()
                });
            }

            alert(`Successfully imported ${importedCharacters.length} character(s)`);
        } catch (error) {
            console.error('Error importing characters:', error);
            alert('Error importing characters. Please check the file format.');
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Layout>
            <div className="home-container">
                <header className="home-header">
                    <h1>Your Characters</h1>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/create')}
                        aria-label="Create New Character"
                    >
                        + New Character
                    </button>
                </header>

                <section className="character-list">
                    {characters?.length === 0 ? (
                        <div className="empty-state">
                            <p>No characters created yet.</p>
                            <p>Press the button to create a new character.</p>
                        </div>
                    ) : (
                        <>
                            <div className="character-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={handleExport}
                                    aria-label="Export Characters"
                                >
                                    Export
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleUploadClick}
                                    aria-label="Upload Characters"
                                >
                                    Upload
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".yaml,.yml"
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <div className="grid">
                                {characters?.map((char: Character) => (
                                    <Link key={char.id} to={`/characters/${char.id}`} className="character-card">
                                        <h2>{char.name}</h2>
                                        <div className="stats-preview">
                                            <div className="stats-main">
                                                <div className="hp-preview">
                                                    HP: {char.currentHp ?? char.hp ?? 0}/{char.maxHp ?? char.hp ?? 0}
                                                </div>
                                                <div className="wounds-preview">
                                                    W: {char.currentWounds ?? 0}/{(char.abilities.STR.max.match(/d(\d+)/)?.[1] || 6)}
                                                </div>
                                            </div>
                                            <div className="stats-abilities">
                                                {Object.entries(char.abilities).map(([code, ability]) => (
                                                    <span key={code} className="stat-badge">
                                                        {code}: {ability.max}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </Layout>
    );
};
