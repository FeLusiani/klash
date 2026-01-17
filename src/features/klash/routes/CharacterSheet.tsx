import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db, type AbilityValue, type InventoryItem } from '../../../lib/db';
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

    const allCharacters = useLiveQuery(() => db.characters.toArray());

    const { prevId, nextId } = useMemo(() => {
        if (!allCharacters || !id) return { prevId: null, nextId: null };
        const currentIndex = allCharacters.findIndex(c => c.id === Number(id));
        if (currentIndex === -1) return { prevId: null, nextId: null };

        const prev = allCharacters[currentIndex - 1]?.id || null;
        const next = allCharacters[currentIndex + 1]?.id || null;
        return { prevId: prev, nextId: next };
    }, [allCharacters, id]);

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

    // Calculate max wounds from STR die
    const strDie = character?.abilities?.STR?.max || 'd6';
    const maxWoundsMatch = strDie.match(/d(\d+)/);
    const maxWounds = maxWoundsMatch ? parseInt(maxWoundsMatch[1], 10) : 6;
    const currentWounds = character?.currentWounds ?? 0;

    // Calculate Magic Dice based on WIL scale in GAME_CONFIG
    const wilDie = character?.abilities?.WIL?.current || 'd4';
    const d4Index = GAME_CONFIG.dice.indexOf('d4');
    const currentWilIndex = GAME_CONFIG.dice.indexOf(wilDie as Die);
    const magicDiceCount = Math.max(0, currentWilIndex - d4Index);

    const updateHp = async (newHp: number) => {
        if (!character?.id) return;
        try {
            if (newHp < 0 || newHp > maxHp) return;
            await db.characters.update(character.id, { currentHp: newHp });
        } catch (error) {
            console.error('Failed to update HP:', error);
        }
    };

    const updateWounds = async (newWounds: number) => {
        if (!character?.id) return;
        try {
            if (newWounds < 0 || newWounds > maxWounds) return;
            await db.characters.update(character.id, { currentWounds: newWounds });
        } catch (error) {
            console.error('Failed to update Wounds:', error);
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

    const navigateTo = (charId: number | null) => {
        if (charId) {
            navigate(`/characters/${charId}`);
        }
    };

    return (
        <Layout>
            <div className="sheet-viewport">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={id}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.5}
                        onDragEnd={(_e, info) => {
                            const threshold = 100;
                            if (info.offset.x < -threshold && nextId) {
                                navigateTo(nextId);
                            } else if (info.offset.x > threshold && prevId) {
                                navigateTo(prevId);
                            }
                        }}
                        className="sheet-container"
                    >
                        {prevId && (
                            <button
                                className="nav-arrow nav-prev"
                                onClick={() => navigateTo(prevId)}
                                aria-label="Previous character"
                            >
                                ‹
                            </button>
                        )}
                        {nextId && (
                            <button
                                className="nav-arrow nav-next"
                                onClick={() => navigateTo(nextId)}
                                aria-label="Next character"
                            >
                                ›
                            </button>
                        )}
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



                            <div className="stats-row">
                                <div className="hp-control">
                                    <div className="hp-display">
                                        <span className="stat-label">HP</span>
                                        <span className="stat-value">{currentHp}</span>
                                        <span className="stat-max">/ {maxHp}</span>
                                    </div>
                                    <div className="stat-btns">
                                        <button
                                            className="stat-btn"
                                            onClick={() => updateHp(currentHp - 1)}
                                            disabled={currentHp <= 0}
                                        >
                                            -
                                        </button>
                                        <button
                                            className="stat-btn"
                                            onClick={() => updateHp(currentHp + 1)}
                                            disabled={currentHp >= maxHp}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="wounds-control">
                                    <div className="wounds-display">
                                        <span className="stat-label">Wounds</span>
                                        <span className="stat-value">{currentWounds}</span>
                                        <span className="stat-max">/ {maxWounds}</span>
                                    </div>
                                    <div className="stat-btns">
                                        <button
                                            className="stat-btn"
                                            onClick={() => updateWounds(currentWounds - 1)}
                                            disabled={currentWounds <= 0}
                                        >
                                            -
                                        </button>
                                        <button
                                            className="stat-btn"
                                            onClick={() => updateWounds(currentWounds + 1)}
                                            disabled={currentWounds >= maxWounds}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
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
                                            <span className="ability-max">/{ability.max}</span>
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

                        <section className="magic-dice-section">
                            <h2>
                                Magic Dice for casting: <span className="magic-dice-value">{magicDiceCount}</span>
                            </h2>
                        </section>


                        <section className="inventory-section">
                            <div className="inventory-header">
                                <h2>Inventory</h2>
                                <button
                                    className="inventory-add-btn"
                                    onClick={async () => {
                                        if (!character?.id) return;
                                        const currentInventory = character.inventory || [];
                                        if (currentInventory.length >= 10) return;
                                        await db.characters.update(character.id, {
                                            inventory: [...currentInventory, { name: '', quality: 3 }]
                                        });
                                    }}
                                    disabled={(character.inventory || []).length >= 10}
                                    title="Add item (max 10)"
                                >
                                    +
                                </button>
                            </div>
                            <div className="inventory-list">
                                {(character.inventory || []).map((itemOrString, index) => {
                                    const item: InventoryItem = typeof itemOrString === 'string'
                                        ? { name: itemOrString, quality: 3 }
                                        : itemOrString;

                                    return (
                                        <div key={index} className="inventory-item">
                                            <button
                                                className="inventory-quality-tile"
                                                onClick={async () => {
                                                    if (!character?.id) return;
                                                    const newInventory = [...(character.inventory || [])];
                                                    const currentQuality = item.quality;
                                                    const newQuality = currentQuality === 0 ? 3 : currentQuality - 1;
                                                    newInventory[index] = { ...item, quality: newQuality };
                                                    await db.characters.update(character.id, {
                                                        inventory: newInventory
                                                    });
                                                }}
                                                title={`Quality: ${item.quality}/3`}
                                            >
                                                <div className="quality-dots">
                                                    {[...Array(3)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`quality-dot ${i < item.quality ? 'filled' : 'empty'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </button>
                                            <input
                                                type="text"
                                                className="inventory-input"
                                                value={item.name}
                                                onChange={async (e) => {
                                                    if (!character?.id) return;
                                                    const newInventory = [...(character.inventory || [])];
                                                    newInventory[index] = { ...item, name: e.target.value };
                                                    await db.characters.update(character.id, {
                                                        inventory: newInventory
                                                    });
                                                }}
                                                placeholder="New item..."
                                            />
                                            <button
                                                className="inventory-delete-btn"
                                                onClick={async () => {
                                                    if (!character?.id) return;
                                                    const newInventory = (character.inventory || []).filter((_, i) => i !== index);
                                                    await db.characters.update(character.id, {
                                                        inventory: newInventory
                                                    });
                                                }}
                                                aria-label="Delete item"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                                {(character.inventory || []).length === 0 && (
                                    <p className="empty-message">No items in inventory</p>
                                )}
                            </div>
                        </section>

                        <footer className="sheet-actions">
                            <button
                                className="btn-danger"
                                onClick={handleDelete}
                            >
                                Delete Character
                            </button>
                        </footer>
                    </motion.div>
                </AnimatePresence>
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
