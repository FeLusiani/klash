import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import { parseAndRoll, type RollResult } from '../../../lib/dice';
import './CharacterSheet.css';

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const character = useLiveQuery(() =>
        id ? db.characters.get(Number(id)) : undefined
        , [id]);

    const [lastRoll, setLastRoll] = useState<{ label: string; result: RollResult } | null>(null);

    // Handle migration/display logic
    const maxHp = character?.maxHp ?? character?.hp ?? 0;
    const currentHp = character?.currentHp ?? character?.hp ?? 0;

    const updateHp = async (newHp: number) => {
        if (!character?.id) return;
        try {
            if (newHp < 0 || newHp > maxHp) return;
            await db.characters.update(character.id, { currentHp: newHp });
        } catch (error) {
            console.error('Failed to update HP:', error);
        }
    };

    const handleRoll = (code: string, die: string) => {
        const result = parseAndRoll(die);
        setLastRoll({ label: code, result });
    };

    const handleDelete = async () => {
        if (!character?.id) return;
        if (window.confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
            try {
                await db.characters.delete(character.id);
                navigate('/');
            } catch (error) {
                console.error('Failed to delete character:', error);
                alert('Failed to delete character');
            }
        }
    };

    if (!character) {
        return (
            <Layout>
                <div className="sheet-loading">Loading...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="sheet-container">
                <header className="sheet-header">
                    <Link to="/" className="back-link">← Back</Link>

                    {lastRoll && (
                        <div className="roll-result">
                            <span className="roll-label">{lastRoll.label} Check</span>
                            <span className="roll-total">{lastRoll.result.total}</span>
                            <span className="roll-details">{lastRoll.result.display}</span>
                        </div>
                    )}

                    <h1>{character.name}</h1>
                    <div className="hp-control">
                        <button
                            className="hp-btn"
                            onClick={() => updateHp(currentHp - 1)}
                            disabled={currentHp <= 0}
                        >
                            -
                        </button>
                        <div className="hp-display">
                            <span className="hp-label">HP</span>
                            <span className="hp-value">{currentHp}</span>
                            <span className="hp-max">/ {maxHp}</span>
                        </div>
                        <button
                            className="hp-btn"
                            onClick={() => updateHp(currentHp + 1)}
                            disabled={currentHp >= maxHp}
                        >
                            +
                        </button>
                    </div>
                </header>

                <section className="abilities-grid">
                    {Object.entries(character.abilities).map(([code, value]) => (
                        <button
                            key={code}
                            className="ability-card clickable"
                            onClick={() => handleRoll(code, value)}
                            aria-label={`Roll ${code} (${value})`}
                        >
                            <span className="ability-code">{code}</span>
                            <span className="ability-value">{String(value)}</span>
                        </button>
                    ))}
                </section>

                <footer className="sheet-actions">
                    <button
                        className="btn-danger"
                        onClick={handleDelete}
                    >
                        Delete Character
                    </button>
                </footer>
            </div>
        </Layout>
    );
};
