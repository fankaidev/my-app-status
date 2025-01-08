## Story: Enhance Project Security

### User Requirement
- Projects should only be accessible by their owners
- Remove special handling for system user

### System Design
1. Add owner_id check to findProjectByName function
2. Update related tests to verify ownership checks
3. Remove all special handling for "system" user
   - Remove system user checks from findProjectByName
   - Remove system user checks from updateProjectStatus
   - Remove system user checks from updateProjectStatusByName
   - Update tests to remove system user cases

### Tasks
[X] Add owner_id parameter to findProjectByName function
[X] Update tests to verify ownership checks
[X] Remove system user special handling
    - Remove system user checks from all functions
    - Update tests to remove system user cases
    - Add tests to verify no special access is allowed

### Progress
- Story created on 2024-03-27
- Added owner_id parameter to findProjectByName function
- Updated updateProjectStatusByName to handle owner_id properly
- Added tests to verify ownership checks for both regular and system users
- Added task to remove system user special handling
- Removed system user special handling from all functions and tests