# EasyStatusTransition

The original idea was just display the next options that would be available after changing the available statuses.
However, I chose to allow users to define the number of levels to be displayed. In addition allow that multiple changes to be made in right sequence.

![alt text](https://github.com/VinnyDyn/EasyStatusTransition/blob/master/Images/pcf_easystatustransition.gif)

### Enable To
- Date and Time, unfortunately the status code does not allow the use of controls, for now ... :). Try use the ModifiedOn

![alt text](https://github.com/VinnyDyn/EasyStatusTransition/blob/master/Images/pcf_configuration.png)

### Features
- If the entity dosen't has the option EnforceStateTransitions enable, nothing happend
- Interprets the relationship between the statuses
- Status color respected
- Can define the depth level and if lower levels will be selectable
- Execute the updates in right sequence
- If a error ocurr during the update sequence the page will be refreshed
- Don't execute roolback

![alt text](https://github.com/VinnyDyn/EasyStatusTransition/blob/master/Images/pcf_details.png)

### Roadmap
- Implement something similar to 'ExecuteTransactionRequest' to enable automatic rollback

### Developers
After clone the repository, execute the command "npm install" to restore all packages.
