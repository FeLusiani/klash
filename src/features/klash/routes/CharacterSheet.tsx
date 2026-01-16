import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type AbilityValue } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import { parseAndRoll, type RollResult } from '../../../lib/dice';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { RealisticDiceRoller } from '../components/RealisticDiceRoller';
import { GAME_CONFIG, type Die } from '../../../config/game';
import './CharacterSheet.css';

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const character = useLiveQuery(() =>
        id ? db.characters.get(Number(id)) : undefined
        , [id]);

    const [lastRoll, setLastRoll] = useState<{ label: string; result: RollResult } | null>(null);
    const [realisticRoll, setRealisticRoll] = useState(false);
    // isRolling removed
    const [showDiceOverlay, setShowDiceOverlay] = useState(false);
    const [pendingRoll, setPendingRoll] = useState<{ code: string; die: string } | null>(null);
    const isMobile = useIsMobile();

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
        if (isMobile && realisticRoll) {
            setPendingRoll({ code, die });
            setShowDiceOverlay(true);
        } else {
            const result = parseAndRoll(die);
            setLastRoll({ label: code, result });
        }
    };

    const handleRealisticRollComplete = (total: number, _results: any) => { // results unused for now but available
        if (!pendingRoll) return;

        // Construct a RollResult. 
        // Note: dice-box result structure might be different, but we mostly care about the total here.
        // We might want to parse the modifiers from the original die string to add them to the physical roll if needed.
        // However, dice-box handles complex rolls if we pass the string "d20+2".
        // Let's assume we pass the full string to dice-box.

        // Wait, parseAndRoll does the math logic. dice-box does physics.
        // If we pass "d20+5" to dice-box, it might roll d20 and adding 5.
        // Let's trust dice-box return or reconstruct it.
        // Actually, for consistency with our `RollResult` type, we might want to use `parseAndRoll`'s parsing logic 
        // but replace the random part of the roll with what dice-box gave us.
        // BUT, dice-box handles multiple dice. 
        // Let's simplify: We use the total from dice-box.

        // Re-parsing to get sides and modifier for display
        // This is a bit hacky, but robust enough for now.
        const parsed = parseAndRoll(pendingRoll.die);

        const rawRoll = total - parsed.modifier;

        setLastRoll({
            label: pendingRoll.code,
            result: {
                ...parsed, // sides, modifier, etc.
                roll: rawRoll,
                total: total,
                display: `Rolled ${rawRoll} on d${parsed.sides}`
            }
        });

        setShowDiceOverlay(false);
        setPendingRoll(null);
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
                    <div className="header-top-row">
                        <Link to="/" className="back-link">← Back</Link>

                        {isMobile && (
                            <div className="realistic-roll-toggle">
                                <span className="toggle-label">Realistic Dice</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={realisticRoll}
                                        onChange={(e) => setRealisticRoll(e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        )}
                    </div>

                    {lastRoll && (
                        <div className="roll-result">
                            <button
                                className="roll-close-btn"
                                onClick={() => setLastRoll(null)}
                                aria-label="Close result"
                            >
                                ✕
                            </button>
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

            {showDiceOverlay && pendingRoll && (
                <RealisticDiceRoller
                    dieType={pendingRoll.die}
                    onRollComplete={handleRealisticRollComplete}
                    onClose={() => setShowDiceOverlay(false)}
                />
            )}
        </Layout>
    );
};
