declare module '@3d-dice/dice-box' {
    export default class DiceBox {
        constructor(options: any);
        init(): Promise<void>;
        roll(dice: string | string[]): Promise<any[]>;
        // Add other methods as needed
    }
}
