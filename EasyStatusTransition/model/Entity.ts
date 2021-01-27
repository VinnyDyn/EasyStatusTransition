export class Entity {
    constructor(logicalName: string, entitySetName: string, isStateModelAware: boolean, enforceStateTransitions: boolean) {
        this.LogicalName = logicalName;
        this.EntitySetName = entitySetName;
        this.IsStateModelAware = isStateModelAware;
        this.EnforceStateTransitions = enforceStateTransitions;
    }

    public LogicalName: string;
    public EntitySetName: string;
    public IsStateModelAware: boolean;
    public EnforceStateTransitions: boolean;
}