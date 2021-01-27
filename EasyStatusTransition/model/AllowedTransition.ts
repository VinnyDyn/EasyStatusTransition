import { Guid } from "guid-typescript";

export class AllowedTransition {
    constructor() {
        this.Id = Guid.create().toString();
    }

    public ParentId : string;
    public Id: string;
    public ToStateId : number;
    public ToStatusId: number;
}