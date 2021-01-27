import { Guid } from "guid-typescript";
import { D365 } from "./D365";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Entity } from "./model/Entity";
import { Attribute } from "./model/Atribute";
import { Option } from "./model/Option";
import { AllowedTransition } from "./model/AllowedTransition";

export class EasyStatusTransition implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	public _context: ComponentFramework.Context<IInputs>;
	public _container: HTMLDivElement;
	public _root: HTMLUListElement;
	public _entity: Entity;
	public _statusCode: Attribute | null;
	public _allAllowedTransitions: AllowedTransition[];
	public _currentStatusCode: number;
	private _depth: number;
	private _allowSelectLowerLevels: number;
	public _sequenceError: boolean;

	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		this._sequenceError = false;
		this._context = context;
		this._container = container;
		this._depth = this._context.parameters.Depth.raw ? this._context.parameters.Depth.raw! : 1;
		this._allowSelectLowerLevels = this._context.parameters.AllowSelectLowerLevels.raw ? Number(this._context.parameters.AllowSelectLowerLevels.raw!) : 0;
		this._statusCode = new Attribute();
		this._allAllowedTransitions = new Array<AllowedTransition>();
		if ((<any>this._context).page.entityId && (<any>this._context).page.entityId != Guid.EMPTY) {
			D365.RetrieveEntityDefinitions(this);
			if (this._entity.IsStateModelAware && this._entity.EnforceStateTransitions)
				D365.RetrieveStatusMetadata(this);
		}
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		this._context = context;
		this.ClearContainer();
		if ((<any>this._context).page.entityId && (<any>this._context).page.entityId != Guid.EMPTY) {
			if (this._entity.IsStateModelAware && this._entity.EnforceStateTransitions) {
				this.RenderBaseList();
				this.RenderAllowedStatus();
			}
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		this._statusCode = null;
	}

	// Interactive methods --------------------------------------------------------------------------------------------------------------
	private StatusClick(div: HTMLDivElement) {

		this._sequenceError = false;
		var tempTransitionOrder: AllowedTransition[] = new Array<AllowedTransition>();

		var clickedTransition = this._allAllowedTransitions.find(f => f.Id == div.id);

		if (clickedTransition) {
			tempTransitionOrder.push(clickedTransition);
			var parentId = clickedTransition.ParentId;
			while (parentId != Guid.EMPTY) {
				clickedTransition = this._allAllowedTransitions.find(f => f.Id == parentId);
				if (clickedTransition) {
					var tempTransition = new AllowedTransition();
					tempTransition.Id = clickedTransition.Id;
					tempTransition.ParentId = clickedTransition.ParentId;
					tempTransition.ToStateId = clickedTransition.ToStateId;
					tempTransition.ToStatusId = clickedTransition.ToStatusId;
					parentId = clickedTransition.ParentId;
					tempTransitionOrder.push(tempTransition);
				}
			}
		}

		D365.SetStateRequest(this, tempTransitionOrder);
	}
	public Recursive(parentId: string, parentElement: HTMLUListElement, allowedTransitions: AllowedTransition[], currentDepth: number) {
		if (allowedTransitions) {
			if (currentDepth > this._depth)
				return;
			else {
				allowedTransitions.forEach(allowedTransition_ => {

					// Ignore the same status
					if (allowedTransition_.ToStatusId == this._currentStatusCode)
						return;

					// Retrive the option informations
					var option_ = this._statusCode?.Options.find(f => f.Value == allowedTransition_.ToStatusId);

					// Set ParentId, necessary to update multiple status respecting the right sequence
					allowedTransition_.ParentId = parentId;
					allowedTransition_.ToStateId = option_!.State!;
					this._allAllowedTransitions.push(allowedTransition_);

					// Draw object
					var ul = this.RenderStatusCodeOption(
						parentElement,
						allowedTransition_,
						option_!,
						currentDepth == 0 || this._allowSelectLowerLevels == 1,
						currentDepth == this._depth);

					// If the last depth
					if (currentDepth != this._depth) {
						this.Recursive(allowedTransition_.Id, ul!, option_?.AllowedTransitions!, currentDepth + 1);
					}
				});
			}
		}
	}

	// Render methods -------------------------------------------------------------------------------------------------------------------
	private RenderBaseList() {
		D365.RetrieveRecordStatusCode(this);
		var optionBase = this._statusCode!.Options.find(f => f.Value == this._currentStatusCode);

		let list: HTMLUListElement = document.createElement("ul");
		list.setAttribute("class", "tree");

		let item = document.createElement("li");
		list.append(item);

		let div: HTMLDivElement = document.createElement("div");
		div.innerText = optionBase!.Label;
		div.style.borderColor = optionBase!.Color;
		div.style.color = optionBase!.Color;
		div.style.cursor = "not-allowed";
		item.append(div);

		this._root = document.createElement("ul");
		item.append(this._root);

		this._container.append(list);
	}
	private RenderAllowedStatus() {
		var optionBase = this._statusCode!.Options.find(f => f.Value == this._currentStatusCode);
		if (optionBase)
			this.Recursive(Guid.EMPTY, this._root, optionBase.AllowedTransitions, 0);
	}
	public RenderStatusCodeOption(parentElement: HTMLElement,
		allowedTransition: AllowedTransition,
		option: Option,
		clickable: boolean,
		lastDepth: boolean): HTMLUListElement | undefined {

		var li: HTMLLIElement = document.createElement("li")
		{
			var div = document.createElement("div");
			div.innerText = option.Label;
			div.id = allowedTransition.Id.toString();
			div.setAttribute("sourcestatusid", allowedTransition.ParentId);
			div.setAttribute("tostateid", option.State!.toString());
			div.setAttribute("tostatusid", allowedTransition.ToStatusId.toString());
			if (clickable) {
				div.addEventListener("click", this.StatusClick.bind(this, div));
				div.style.borderColor = option.Color;
				div.style.color = option.Color;
			}
			else {
				div.style.backgroundColor = "#E1DFDD";
				div.style.color = "#1F2126";
				div.style.cursor = "not-allowed";
			}

			li.append(div);
			parentElement.append(li);

			if (!lastDepth) {
				var ul: HTMLUListElement = document.createElement("ul");
				li.append(ul);
				return ul;
			}
			else
				return undefined;
		}
	}

	private ClearContainer() {
		while (this._container.firstChild) {
			this._container.removeChild(this._container.firstChild);
		}
	}
}