import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import { Layout } from '../../../components/Layout/Layout';
import './CharacterSheet.css';

export const CharacterSheet: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const character = useLiveQuery(() =>
        id ? db.characters.get(Number(id)) : undefined
        , [id]);

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
                    <h1>{character.name}</h1>
                    <div className="hp-badge">
                        HP: {character.hp ?? '?'}
                    </div>
                </header>

                <section className="abilities-grid">
                    {Object.entries(character.abilities).map(([code, value]) => (
                        <div key={code} className="ability-card">
                            <span className="ability-code">{code}</span>
                            <span className="ability-value">{String(value)}</span>
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
        </Layout>
    );
};
