import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="layout">
            <header className="layout-header">
                <div className="layout-brand">
                    <Link to="/">Klash</Link>
                </div>
                <nav className="layout-nav">
                    <Link to="/todos">Todos</Link>
                </nav>
            </header>
            <main className="layout-main">
                {children}
            </main>
            <footer className="layout-footer">
                <p>&copy; {new Date().getFullYear()} Offline App</p>
            </footer>
        </div>
    );
};
