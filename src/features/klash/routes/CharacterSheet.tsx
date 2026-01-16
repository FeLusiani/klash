import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type AbilityValue } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import { parseAndRoll, type RollResult } from '../../../lib/dice';
// import { useIsMobile } from '../../../hooks/useIsMobile';
// import { RealisticDiceRoller } from '../components/RealisticDiceRoller';
import { GAME_CONFIG, type Die } from '../../../config/game';
import './CharacterSheet.css';

import d4Icon from '../../../assets/noun-d4.svg';
import d6Icon from '../../../assets/noun-d6.svg';
import d8Icon from '../../../assets/noun-d8.svg';
import d10Icon from '../../../assets/noun-d10.svg';
import d12Icon from '../../../assets/noun-d12.svg';
import d20Icon from '../../../assets/noun-d20.svg';

const diceIcons: Record<string, string> = {
    'd4': d4Icon,
    'd6': d6Icon,
    'd8': d8Icon,
    'd10': d10Icon,
    'd12': d12Icon,
    'd20': d20Icon,
};

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const character = useLiveQuery(() =>
        id ? db.characters.get(Number(id)) : undefined
        , [id]);

    const [lastRoll, setLastRoll] = useState<{ label: string; result: RollResult } | null>(null);
    const [lastDiceRolled, setLastDiceRolled] = useState<string | null>(null);
    // realisticRoll state removed
    // isRolling removed
    // const [showDiceOverlay, setShowDiceOverlay] = useState(false);
    // const [pendingRoll, setPendingRoll] = useState<{ code: string; die: string } | null>(null);
    // const isMobile = useIsMobile();

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

    const updateAbility = async (code: string, direction: 'up' | 'down') => {
        if (!character?.id || !character.abilities) return;

        const ability = character.abilities[code] as unknown as AbilityValue;
        if (!ability) return;

        const currentDie = ability.current as Die;
        const maxDie = ability.max as Die;
        const currentIndex = GAME_CONFIG.dice.indexOf(currentDie);
        const maxIndex = GAME_CONFIG.dice.indexOf(maxDie);

        let newIndex = currentIndex;
        if (direction === 'up') {
            newIndex = Math.min(currentIndex + 1, maxIndex);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }

        if (newIndex === currentIndex) return;

        const newDie = GAME_CONFIG.dice[newIndex];

        try {
            const updatedAbilities = {
                ...character.abilities,
                [code]: { ...ability, current: newDie }
            };
            await db.characters.update(character.id, { abilities: updatedAbilities });
        } catch (error) {
            console.error(`Failed to update ability ${code}:`, error);
        }
    };

    const handleRoll = (code: string, die: string) => {
        const result = parseAndRoll(die);
        setLastRoll({ label: code, result });
        const baseDie = die.match(/d\d+/)?.[0] || null;
        setLastDiceRolled(baseDie);
    };

    /* 
    const handleRealisticRollComplete = (total: number, _results: any) => {
        if (!pendingRoll) return;
        const parsed = parseAndRoll(pendingRoll.die);
        const rawRoll = total - parsed.modifier;

        setLastRoll({
            label: pendingRoll.code,
            result: {
                ...parsed,
                roll: rawRoll,
                total: total,
                display: `Rolled ${rawRoll} on d${parsed.sides}`
            }
        });

        setShowDiceOverlay(false);
        setPendingRoll(null);
    };
    */

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
                    <div className="header-top-row">
                        <Link to="/" className="back-link">← Back</Link>
                        <Link to={`/characters/${id}/edit`} className="edit-link">Edit</Link>
                    </div>

                    {lastRoll && (
                        <div className="roll-result">
                            <button
                                className="roll-close-btn"
                                onClick={() => {
                                    setLastRoll(null);
                                    setLastDiceRolled(null);
                                }}
                                aria-label="Close result"
                            >
                                ✕
                            </button>
                            <div className="roll-result-container">
                                {lastDiceRolled && diceIcons[lastDiceRolled] && (
                                    <div className="roll-icon-side">
                                        <img
                                            src={diceIcons[lastDiceRolled]}
                                            alt={lastDiceRolled}
                                            className="dice-icon-result"
                                        />
                                    </div>
                                )}
                                <div className="roll-info-side">
                                    <span className="roll-label">{lastRoll.label} Check</span>
                                    <span className="roll-total">{lastRoll.result.total}</span>
                                    <span className="roll-details">{lastRoll.result.display}</span>
                                </div>
                            </div>
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
                    {Object.entries(character.abilities).map(([code, ability]) => (
                        <div key={code} className="ability-control-container">
                            <button
                                className="ability-card clickable"
                                onClick={() => handleRoll(code, ability.current)}
                                aria-label={`Roll ${code} (${ability.current})`}
                            >
                                <span className="ability-code">{code}</span>
                                <div className="ability-values">
                                    <span className="ability-value">{ability.current}</span>
                                    {ability.current !== ability.max && (
                                        <span className="ability-max">/ {ability.max}</span>
                                    )}
                                </div>
                            </button>
                            <div className="ability-btns">
                                <button
                                    className="ability-mini-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateAbility(code, 'down');
                                    }}
                                    disabled={GAME_CONFIG.dice.indexOf(ability.current as Die) === 0}
                                    aria-label={`Decrease ${code}`}
                                >
                                    -
                                </button>
                                <button
                                    className="ability-mini-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateAbility(code, 'up');
                                    }}
                                    disabled={GAME_CONFIG.dice.indexOf(ability.current as Die) >= GAME_CONFIG.dice.indexOf(ability.max as Die)}
                                    aria-label={`Increase ${code}`}
                                >
                                    +
                                </button>
                            </div>
                        </div>
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

            {/* 
            {showDiceOverlay && pendingRoll && (
                <RealisticDiceRoller
                    dieType={pendingRoll.die}
                    onRollComplete={handleRealisticRollComplete}
                    onClose={() => setShowDiceOverlay(false)}
                />
            )}
            */}
        </Layout>
    );
};
