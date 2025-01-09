# Story S14: Improve History UI

## User Requirement

- Display at most 50 history items in project card
- Allow history items to wrap to multiple lines

## Design

1. Modify StatusTimeline component to:

   - Slice history array to last 50 items
   - Add flex-wrap: wrap to container
   - Adjust spacing and sizing for wrapped layout

2. Update styling to:
   - Reduce height of status bars when wrapped
   - Add margin between wrapped rows
   - Maintain hover tooltip functionality

## Tasks

[X] Create design document
[X] Implement history limit
[X] Add wrapping support
[X] Adjust styling
[X] Test changes
