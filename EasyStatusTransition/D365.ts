import { EasyStatusTransition } from ".";
import { Entity } from "./model/Entity";
import { Option } from "./model/Option";
import { AllowedTransition } from "./model/AllowedTransition";

export class D365 {
    
	public static RetrieveRecordStatusCode(index : EasyStatusTransition) {

		const caller = index;
		var _entityId: string = (<any>caller._context).page.entityId;
		var req = new XMLHttpRequest();
		req.open("GET", (<any>caller._context).page.getClientUrl() + "/api/data/v9.1/" + caller._entity.EntitySetName + "(" + _entityId + ")?$select=statuscode", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 200) {
					var result = JSON.parse(this.response);
					caller._currentStatusCode = result["statuscode"] as number;
				}
			}
		};
		req.send();
	}
	public static RetrieveEntityDefinitions(index : EasyStatusTransition) {
		const caller = index;
		var _entityTypeName: string = (<any>caller._context).page.entityTypeName;
		let req = new XMLHttpRequest();
		req.open("GET", (<any>caller._context).page.getClientUrl() + "/api/data/v9.0/EntityDefinitions?$select=LogicalName,EntitySetName,IsStateModelAware,EnforceStateTransitions&$filter=LogicalName eq '" + _entityTypeName + "'", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 200) {
					var result = JSON.parse(this.response);
					if (result !== undefined && result.value.length > 0) {

						caller._entity = new Entity(
							result.value[0].LogicalName,
							result.value[0].EntitySetName,
							result.value[0].IsStateModelAware,
							result.value[0].EnforceStateTransitions)
					}
				}
			}
		};
		req.send();
	}
	public static RetrieveStatusMetadata(index : EasyStatusTransition) {
		const caller = index;
		var _entityTypeName: string = (<any>caller._context).page.entityTypeName;
		let languageCode = caller._context.userSettings.languageId;
		let req = new XMLHttpRequest();
		req.open("GET", (<any>caller._context).page.getClientUrl() + "/api/data/v9.1/EntityDefinitions(LogicalName='" + _entityTypeName + "')/Attributes/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName&$expand=OptionSet", false);
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.onreadystatechange = function () {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 200) {
					var result = JSON.parse(this.response);
					if (result !== undefined && result.value.length > 0) {

						//Attribute
						caller._statusCode!.Label = result.value[0].OptionSet.DisplayName.LocalizedLabels.find((f: any) => f.LanguageCode == languageCode).Label;

						//Options
						var options = result.value[0].OptionSet.Options;
						for (let index = 0; index < options.length; index++) {
							const option_ = options[index];

							var option = new Option();
							option.Label = option_.Label.LocalizedLabels.find((f: any) => f.LanguageCode == languageCode).Label;
							option.Value = option_.Value;
							option.State = option_.State;
							option.Color = option_.Color;

							if (option_.TransitionData) {
								var parse = new DOMParser();
								var xml = parse.parseFromString(option_.TransitionData, "text/xml");
								var childNodes = xml.documentElement.childNodes;

								childNodes.forEach(node_ => {
									var allowedTransition = new AllowedTransition();
									allowedTransition.ToStatusId = (<any>node_).getAttribute("tostatusid");
									option.AllowedTransitions.push(allowedTransition);
								});
							};

							caller._statusCode!.Options.push(option);
						}
					}
				}
			}
		};
		req.send();
	}
	public static SetStateRequest(index : EasyStatusTransition, transitions: AllowedTransition[]) {

		const caller = index;
		var _entityId: string = (<any>caller._context).page.entityId;
		(<any>window.parent).Xrm.Page.ui.clearFormNotification("pcf_allowedtransitionstatus_error");
		let i = 1;
		transitions.reverse().forEach(allowedTransition_ => {

			if (!caller._sequenceError) {

				let updateRequest: any;
				updateRequest = {};
				updateRequest.statecode = allowedTransition_.ToStateId;
				updateRequest.statuscode = allowedTransition_.ToStatusId;

				let req = new XMLHttpRequest();
				req.open("PATCH", (<any>caller._context).page.getClientUrl() + "/api/data/v9.1/" + caller._entity.EntitySetName + "(" + _entityId + ")", false);
				req.setRequestHeader("OData-MaxVersion", "4.0");
				req.setRequestHeader("OData-Version", "4.0");
				req.setRequestHeader("Accept", "application/json");
				req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				req.onreadystatechange = function () {
					if (this.readyState === 4) {
						req.onreadystatechange = null;
						if (this.status === 204) {
							if (i == transitions.length) {
								(<any>window.parent).Xrm.Page.data.refresh();
								caller.updateView(caller._context);
							}
							i++;
						}
						else {
							caller._sequenceError = true;
							(<any>window.parent).Xrm.Page.ui.setFormNotification(this.responseText, "ERROR", "pcf_allowedtransitionstatus_error");
							(<any>window.parent).Xrm.Page.data.refresh();
							caller.updateView(caller._context);
							return;
						}

					}
				};
				req.send(JSON.stringify(updateRequest));
			}
		});
	}
}