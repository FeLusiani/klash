import React from 'react';
import { GAME_CONFIG, type Die } from '../../../config/game';
import './DiceSelector.css';

interface DiceSelectorProps {
    value: string;
    onChange: (value: Die) => void;
    label: string;
    options?: Die[];
}

export const DiceSelector: React.FC<DiceSelectorProps> = ({ value, onChange, label, options }) => {
    const diceOptions = options || GAME_CONFIG.creationDice;
    return (
        <div className="dice-selector">
            <label className="dice-label">{label}</label>
            <div className="dice-options">
                {diceOptions.map((die) => (
                    <button
                        key={die}
                        type="button"
                        className={`dice-btn ${value === die ? 'selected' : ''}`}
                        onClick={() => onChange(die)}
                    >
                        {die}
                    </button>
                ))}
            </div>
        </div>
    );
};
