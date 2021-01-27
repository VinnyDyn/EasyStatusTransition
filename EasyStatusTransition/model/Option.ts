import { AllowedTransition } from "./AllowedTransition";

export class Option {
        constructor() {
            this.AllowedTransitions = new Array<AllowedTransition>();
        }

    public Label: string;
    public State: number | null;
    public Value: number;
    public Color: string;
    public AllowedTransitions: AllowedTransition[];
}