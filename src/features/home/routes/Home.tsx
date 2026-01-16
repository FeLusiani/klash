import React from 'react';
import { Layout } from '../../../components/Layout/Layout';

export const Home: React.FC = () => {
    return (
        <Layout>
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
                <h1>Offline-First PWA</h1>
                <p style={{
                    fontSize: 'var(--size-step-1)',
                    color: 'var(--color-text-muted)',
                    maxWidth: '600px',
                    margin: 'var(--space-md) auto'
                }}>
                    This is a progressive web app built with React, Vite, and Dexie.js for offline storage.
                </p>
                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <button style={{
                        backgroundColor: 'var(--color-brand)',
                        color: 'white',
                        border: 'none',
                        padding: 'var(--space-md) var(--space-xl)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--size-step-0)',
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        Get Started
                    </button>
                </div>
            </div>
        </Layout>
    );
};
