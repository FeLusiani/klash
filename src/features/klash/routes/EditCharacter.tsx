import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../lib/db';
import { GAME_CONFIG } from '../../../config/game';
import { Layout } from '../../../components/Layout/Layout';
import { DiceSelector } from '../components/DiceSelector';
import {
    clampAbilityValuesToMax,
    createDefaultAbilityDice,
    extractAbilityMaxDice
} from '../lib/characterHelpers';
import './CharacterForm.css';

export const EditCharacter: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [hp, setHp] = useState(4);
    const [abilities, setAbilities] = useState(createDefaultAbilityDice);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!id) return;
            try {
                const char = await db.characters.get(Number(id));
                if (char) {
                    setName(char.name);
                    setHp(char.maxHp);
                    setAbilities(extractAbilityMaxDice(char.abilities));
                } else {
                    setError('Character not found');
                }
            } catch (err) {
                console.error('Failed to fetch character:', err);
                setError('Failed to load character');
            } finally {
                setLoading(false);
            }
        };
        fetchCharacter();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !id) return;

        try {
            const charId = Number(id);
            const character = await db.characters.get(charId);
            if (!character) {
                setError('Character not found');
                return;
            }

            // Check for duplicate name (excluding itself)
            const duplicate = await db.characters
                .where('name')
                .equalsIgnoreCase(name.trim())
                .filter(c => c.id !== charId)
                .count();

            if (duplicate > 0) {
                setError('A character with this name already exists');
                return;
            }

            await db.characters.update(charId, {
                name: name.trim(),
                maxHp: hp,
                currentHp: Math.min(character.currentHp, hp),
                abilities: clampAbilityValuesToMax(character.abilities, abilities)
            });

            navigate(`/characters/${id}`);
        } catch (err) {
            console.error('Failed to update character:', err);
            setError('Failed to save changes');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="character-form-container">
                    <p>Loading...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="character-form-container">
                <h1>Edit Character</h1>
                <form className="character-form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}

                    <div className="character-form-group">
                        <label htmlFor="name">Character Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="character-form-group">
                        <label htmlFor="hp">Max Hit Points</label>
                        <input
                            id="hp"
                            type="number"
                            min="1"
                            max="20"
                            value={hp}
                            onChange={(e) => setHp(parseInt(e.target.value) || 4)}
                            required
                        />
                    </div>

                    <div className="abilities-section">
                        <h2>Ability Max Values</h2>
                        {GAME_CONFIG.abilities.map((ability) => (
                            <DiceSelector
                                key={ability.code}
                                label={`${ability.name} (${ability.code})`}
                                value={abilities[ability.code]}
                                onChange={(val) => setAbilities(prev => ({ ...prev, [ability.code]: val }))}
                                options={GAME_CONFIG.editingDice}
                            />
                        ))}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="form-btn secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="form-btn primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};
