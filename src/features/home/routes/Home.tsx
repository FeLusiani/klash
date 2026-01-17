import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { db, type Character } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import './Home.css';

export const Home: React.FC = () => {
    const characters: Character[] | undefined = useLiveQuery(() => db.characters.toArray());
    const navigate = useNavigate();

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
                            <p>Press the button to create your first Klash character!</p>
                        </div>
                    ) : (
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
                    )}
                </section>
            </div>
        </Layout>
    );
};
