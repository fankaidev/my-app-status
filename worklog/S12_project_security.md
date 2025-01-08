## Story: Enhance Project Security

### User Requirement
- Projects should only be accessible by their owners
- System user should still have access to all projects

### System Design
1. Add owner_id check to findProjectByName function
2. Update related tests to verify ownership checks

### Tasks
[X] Add owner_id parameter to findProjectByName function
[X] Update tests to verify ownership checks

### Progress
- Story created on 2024-03-27
- Added owner_id parameter to findProjectByName function
- Updated updateProjectStatusByName to handle owner_id properly
- Added tests to verify ownership checks for both regular and system users