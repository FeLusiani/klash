import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { db, type InventoryItem } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import { parseAndRoll, type RollResult } from '../../../lib/dice';
import { GAME_CONFIG } from '../../../config/game';
import {
    createInventoryItem,
    dieIndex,
    dieSides,
    magicDiceCount as getMagicDiceCount,
    MAX_INVENTORY_ITEMS,
    nextItemQuality,
    normalizeInventoryItem
} from '../lib/characterHelpers';
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

const ROLL_ANIMATION_MS = 1000;
const ROLL_PARTICLE_COUNT = 36;

type RollState =
    | {
        status: 'rolling';
        label: string;
        die: string;
        baseDie: string | null;
    }
    | {
        status: 'complete';
        label: string;
        die: string;
        baseDie: string | null;
        result: RollResult;
    };

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const character = useLiveQuery(() =>
        id ? db.characters.get(Number(id)) : undefined
        , [id]);

    const allCharacters = useLiveQuery(() => db.characters.toArray());

    const { prevId, nextId, currentIndex, totalCount } = useMemo(() => {
        if (!allCharacters || !id) return { prevId: null, nextId: null, currentIndex: -1, totalCount: 0 };
        const index = allCharacters.findIndex(c => c.id === Number(id));
        if (index === -1) return { prevId: null, nextId: null, currentIndex: -1, totalCount: allCharacters?.length || 0 };

        const prev = allCharacters[index - 1]?.id || null;
        const next = allCharacters[index + 1]?.id || null;
        return { prevId: prev, nextId: next, currentIndex: index, totalCount: allCharacters.length };
    }, [allCharacters, id]);

    const [rollState, setRollState] = useState<RollState | null>(null);
    const rollTimeoutRef = useRef<number | null>(null);
    const pendingScrollYRef = useRef<number | null>(null);
    const pendingScrollTargetIdRef = useRef<number | null>(null);
    const [rollAnimationKey, setRollAnimationKey] = useState(0);
    const [direction, setDirection] = useState<number>(1); // 1 for next, -1 for prev

    useEffect(() => {
        return () => {
            if (rollTimeoutRef.current !== null) {
                window.clearTimeout(rollTimeoutRef.current);
            }
        };
    }, []);

    // Swipeable handlers for touch navigation
    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (nextId) navigateTo(nextId, 1);
        },
        onSwipedRight: () => {
            if (prevId) navigateTo(prevId, -1);
        },
        trackMouse: false, // Only track touch, not mouse drag
        preventScrollOnSwipe: true,
        delta: 50, // Minimum swipe distance (pixels)
    });

    // Handle migration/display logic
    const maxHp = character?.maxHp ?? character?.hp ?? 0;
    const currentHp = character?.currentHp ?? character?.hp ?? 0;

    // Calculate max wounds from STR die
    const strDie = character?.abilities?.STR?.max || 'd6';
    const maxWounds = dieSides(strDie);
    const currentWounds = character?.currentWounds ?? 0;

    // Calculate Magic Dice based on WIL scale in GAME_CONFIG
    const wilDie = character?.abilities?.WIL?.current || 'd4';
    const magicDiceCount = getMagicDiceCount(wilDie);

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

        const ability = character.abilities[code];
        if (!ability) return;

        const currentDie = ability.current;
        const maxDie = ability.max;
        const currentIndex = dieIndex(currentDie);
        const maxIndex = dieIndex(maxDie);

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
        const baseDie = die.match(/d\d+/)?.[0] || null;
        if (rollTimeoutRef.current !== null) {
            window.clearTimeout(rollTimeoutRef.current);
        }

        setRollState({ status: 'rolling', label: code, die, baseDie });
        rollTimeoutRef.current = window.setTimeout(() => {
            setRollAnimationKey((key) => key + 1);
            setRollState({
                status: 'complete',
                label: code,
                die,
                baseDie,
                result: parseAndRoll(die)
            });
            rollTimeoutRef.current = null;
        }, ROLL_ANIMATION_MS);
    };

    const closeRollResult = () => {
        if (rollTimeoutRef.current !== null) {
            window.clearTimeout(rollTimeoutRef.current);
            rollTimeoutRef.current = null;
        }
        setRollState(null);
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

    const navigateTo = (charId: number | null, dir: number = 1) => {
        if (charId) {
            pendingScrollYRef.current = window.scrollY;
            pendingScrollTargetIdRef.current = charId;
            setDirection(dir);
            navigate(`/characters/${charId}`);
        }
    };

    const restorePendingScroll = (characterId: number | undefined) => {
        if (pendingScrollYRef.current === null || pendingScrollTargetIdRef.current !== characterId) {
            return;
        }

        const scrollY = pendingScrollYRef.current;
        pendingScrollYRef.current = null;
        pendingScrollTargetIdRef.current = null;

        window.scrollTo({ top: scrollY, behavior: 'auto' });
        window.requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: 'auto' });
        });
    };

    // Framer Motion variants for directional transitions
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0
        })
    };

    return (
        <Layout>
            <div className="sheet-viewport">
                {prevId && (
                    <button
                        className="nav-arrow nav-prev"
                        onClick={() => navigateTo(prevId, -1)}
                        aria-label="Previous character"
                    >
                        ‹
                    </button>
                )}
                {nextId && (
                    <button
                        className="nav-arrow nav-next"
                        onClick={() => navigateTo(nextId, 1)}
                        aria-label="Next character"
                    >
                        ›
                    </button>
                )}
                <div className="pagination-dots">
                    {Array.from({ length: totalCount }).map((_, i) => (
                        <div
                            key={i}
                            className={`pagination-dot ${i === currentIndex ? 'active' : ''}`}
                            onClick={() => {
                                const dir = i > currentIndex ? 1 : -1;
                                navigateTo(allCharacters?.[i].id || null, dir);
                            }}
                        />
                    ))}
                </div>
                {rollState && (
                    <div className={`roll-result ${rollState.status === 'rolling' ? 'rolling' : ''}`}>
                        <button
                            className="roll-close-btn"
                            onClick={closeRollResult}
                            aria-label="Close result"
                        >
                            ✕
                        </button>
                        <div className="roll-result-container">
                            {rollState.baseDie && diceIcons[rollState.baseDie] && (
                                <div className="roll-icon-side">
                                    <img
                                        src={diceIcons[rollState.baseDie]}
                                        alt={rollState.baseDie}
                                        className="dice-icon-result"
                                    />
                                </div>
                            )}
                            <div className="roll-info-side" aria-live="polite">
                                <span className="roll-label">{rollState.label} Check</span>
                                {rollState.status === 'rolling' ? (
                                    <>
                                        <span className="roll-total roll-total-loading" aria-label="Rolling">
                                            <span className="roll-loader-dot"></span>
                                            <span className="roll-loader-dot"></span>
                                            <span className="roll-loader-dot"></span>
                                        </span>
                                        <span className="roll-details">Rolling {rollState.die}...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="roll-total roll-total-complete">
                                            <span className="roll-number">{rollState.result.total}</span>
                                            <span key={rollAnimationKey} className="roll-particles" aria-hidden="true">
                                                {Array.from({ length: ROLL_PARTICLE_COUNT }).map((_, index) => (
                                                    <span
                                                        key={index}
                                                        className="roll-particle"
                                                        style={{
                                                            '--particle-angle': `${index * 10}deg`,
                                                            '--particle-distance': `${3.2 + (index % 5) * 0.55}rem`
                                                        } as React.CSSProperties}
                                                    />
                                                ))}
                                            </span>
                                        </span>
                                        <span className="roll-details">{rollState.result.display}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <motion.div
                        key={id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'tween', duration: 0.15, ease: 'easeInOut' }}
                        className="sheet-container"
                        onAnimationComplete={() => restorePendingScroll(character.id)}
                        {...swipeHandlers}
                    >
                        <header className="sheet-header">
                            <div className="header-top-row">
                                <Link to="/" className="back-link">← Back</Link>
                                <Link to={`/characters/${id}/edit`} className="edit-link">Edit</Link>
                            </div>

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
                                            disabled={dieIndex(ability.current) === 0}
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
                                            disabled={dieIndex(ability.current) >= dieIndex(ability.max)}
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
                                        if (currentInventory.length >= MAX_INVENTORY_ITEMS) return;
                                        await db.characters.update(character.id, {
                                            inventory: [...currentInventory, createInventoryItem()]
                                        });
                                    }}
                                    disabled={(character.inventory || []).length >= MAX_INVENTORY_ITEMS}
                                    title={`Add item (max ${MAX_INVENTORY_ITEMS})`}
                                >
                                    +
                                </button>
                            </div>
                            <div className="inventory-list">
                                {(character.inventory || []).map((itemOrString, index) => {
                                    const item: InventoryItem = normalizeInventoryItem(itemOrString);

                                    return (
                                        <div key={index} className="inventory-item">
                                            <div className="inventory-controls">
                                                <button
                                                    className="inventory-delete-btn"
                                                    onClick={async () => {
                                                        if (!character?.id) return;
                                                        if (window.confirm('Delete this item?')) {
                                                            const newInventory = (character.inventory || []).filter((_, i) => i !== index);
                                                            await db.characters.update(character.id, {
                                                                inventory: newInventory
                                                            });
                                                        }
                                                    }}
                                                    aria-label="Delete item"
                                                >
                                                    ✕
                                                </button>
                                                <button
                                                    className="inventory-quality-tile"
                                                    onClick={async () => {
                                                        if (!character?.id) return;
                                                        const newInventory = [...(character.inventory || [])];
                                                        newInventory[index] = {
                                                            ...item,
                                                            quality: nextItemQuality(item.quality)
                                                        };
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
                                            </div>
                                            <textarea
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
                                                rows={1}
                                            />
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
        </Layout>
    );
};
