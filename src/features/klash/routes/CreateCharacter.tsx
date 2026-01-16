import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../lib/db';
import { GAME_CONFIG, type Die } from '../../../config/game';
import { Layout } from '../../../components/Layout/Layout';
import { DiceSelector } from '../components/DiceSelector';
import './CreateCharacter.css';

export const CreateCharacter: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const errorRef = React.useRef<HTMLDivElement>(null);
    const [hp, setHp] = useState(4);

    // Focus error message when it appears
    React.useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.focus();
        }
    }, [error]);

    const [abilities, setAbilities] = useState<Record<string, Die>>({
        STR: 'd6',
        DEX: 'd6',
        WIL: 'd6'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            // Check for duplicate name (case-insensitive)
            const count = await db.characters
                .where('name')
                .equalsIgnoreCase(name.trim())
                .count();

            if (count > 0) {
                setError('A character with this name is already present');
                return;
            }

            const formattedAbilities = Object.entries(abilities).reduce((acc, [code, value]) => ({
                ...acc,
                [code]: { current: value, max: value }
            }), {});

            const id = await db.characters.add({
                name: name.trim(),
                abilities: formattedAbilities as any, // Dexie will handle the object
                maxHp: hp,
                currentHp: hp,
                createdAt: Date.now()
            });
            navigate(`/characters/${id}`);
        } catch (error) {
            console.error('Failed to create character:', error);
            setError('Failed to save character. Please try again.');
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (error) setError(null);
    };

    return (
        <Layout>
            <div className="create-container">
                <h1>New Character</h1>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div
                            className="error-message"
                            ref={errorRef}
                            tabIndex={-1}
                            role="alert"
                        >
                            {error}
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="name">Character Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g. Grimold the Bold"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="hp">Hit Points (1-8)</label>
                        <input
                            id="hp"
                            type="number"
                            min="1"
                            max="8"
                            value={hp}
                            onChange={(e) => setHp(parseInt(e.target.value) || 4)}
                            required
                        />
                    </div>

                    <div className="abilities-section">
                        <h2>Abilities</h2>
                        {GAME_CONFIG.abilities.map((ability) => (
                            <DiceSelector
                                key={ability.code}
                                label={`${ability.name} (${ability.code})`}
                                value={abilities[ability.code]}
                                onChange={(val) => setAbilities(prev => ({ ...prev, [ability.code]: val }))}
                            />
                        ))}
                    </div>

                    <div className="actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Create Character
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
