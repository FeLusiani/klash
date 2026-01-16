import React, { useEffect, useRef, useState } from 'react';
import DiceBox from '@3d-dice/dice-box';
import './RealisticDiceRoller.css';

interface RealisticDiceRollerProps {
    onRollComplete: (total: number, result: any) => void;
    dieType: string; // e.g., 'd20', 'd6'
    onClose: () => void;
}

export const RealisticDiceRoller: React.FC<RealisticDiceRollerProps> = ({
    onRollComplete,
    dieType,
    onClose
}) => {
    const diceBoxRef = useRef<DiceBox | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [status, setStatus] = useState('Shake your phone!');
    const [lastAcceleration, setLastAcceleration] = useState<{ x: number; y: number; z: number } | null>(null);
    const rollingRef = useRef(false);

    useEffect(() => {
        // Initialize DiceBox
        const box = new DiceBox({
            container: "#dice-box-canvas",
            assetPath: '/assets/',
            origin: 'https://unpkg.com/@3d-dice/dice-box@1.1.4/dist',
            theme: 'default',
            scale: 20,
            gravity: 3,
            mass: 2,
        });

        box.init().then(() => {
            setIsLoaded(true);
            diceBoxRef.current = box;
        });

        return () => {
            // Cleanup if necessary
        };
    }, []);

    const rollDice = async () => {
        if (rollingRef.current || !diceBoxRef.current) return;
        rollingRef.current = true;
        setStatus('Rolling...');

        try {
            // Ensure notation has a count (e.g., "1d20")
            const notation = dieType.startsWith('d') ? `1${dieType}` : dieType;
            const results = await diceBoxRef.current.roll(notation);
            // DiceBox returns an array of results
            const total = results.reduce((acc: number, val: any) => acc + val.value, 0);

            setTimeout(() => {
                onRollComplete(total, results);
            }, 1000); // Wait a bit to see the result
        } catch (e) {
            console.error(e);
            setStatus('Error rolling dice');
            rollingRef.current = false;
        }
    };

    // Shake detection
    useEffect(() => {
        const handleMotion = (event: DeviceMotionEvent) => {
            if (rollingRef.current || !isLoaded) return;

            const { accelerationIncludingGravity } = event;
            if (!accelerationIncludingGravity) return;

            const { x, y, z } = accelerationIncludingGravity;
            if (x === null || y === null || z === null) return;

            const currentAcc = { x, y, z };

            if (lastAcceleration) {
                const deltaX = Math.abs(lastAcceleration.x - currentAcc.x);
                const deltaY = Math.abs(lastAcceleration.y - currentAcc.y);
                const deltaZ = Math.abs(lastAcceleration.z - currentAcc.z);

                const shakeThreshold = 15; // Tuning needed
                if (deltaX + deltaY + deltaZ > shakeThreshold) {
                    rollDice();
                }
            }

            setLastAcceleration(currentAcc);
        };

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            if (window.DeviceMotionEvent) {
                window.removeEventListener('devicemotion', handleMotion);
            }
        };
    }, [isLoaded, lastAcceleration]);

    return (
        <div className="dice-overlay">
            <div id="dice-box-canvas" className="dice-container"></div>
            <div className="dice-ui">
                <div className="dice-status">{status}</div>
                <button className="close-btn" onClick={onClose}>Cancel</button>
                {/* Fallback for testing/desktop */}
                <button className="fallback-roll-btn" onClick={rollDice} disabled={rollingRef.current || !isLoaded}>
                    {isLoaded ? 'Tap to Roll' : 'Loading...'}
                </button>
            </div>
        </div>
    );
};
