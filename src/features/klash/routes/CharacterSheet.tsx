import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import './CharacterSheet.css';

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const character = useLiveQuery(() =>
        id ? db.characters.get(Number(id)) : undefined
        , [id]);

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
                    <h1>{character.name}</h1>
                </header>

                <section className="abilities-grid">
                    {Object.entries(character.abilities).map(([code, value]) => (
                        <div key={code} className="ability-card">
                            <span className="ability-code">{code}</span>
                            <span className="ability-value">{String(value)}</span>
                        </div>
                    ))}
                </section>
            </div>
        </Layout>
    );
};
