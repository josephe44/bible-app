# [BACKLOG] Support Multiple Active Plans

*Note: This feature has been moved to the backlog for future implementation.*

Currently, the app allows only a single active plan. If a user selects a new plan, the old one is overwritten or deactivated. We will update the architecture to support up to 2 simultaneous active plans.

## Open Questions for Future Implementation

> [!IMPORTANT]
> Since the app currently assumes a single active plan (e.g. `const plan = usePlan()`), how should we handle the UI when there are 2 plans running simultaneously? 
> 
> 1. **Home Screen (Today's Word)**: Should we display *both* daily verses stacked on top of each other, or should we have a swipeable carousel/tabs to switch between the two active plans?
> 2. **Plan Screen**: Should we list both plans vertically (showing two progress rings and day lists), or add tabs to switch between them?
> 3. **Tomorrow's Plan**: We need to add a banner on the Plan page: "You are currently running Faith and Love, and Love is going to start tomorrow". How should we represent the "Tomorrow" plan in the UI before it starts? Just a banner, or should it show its empty outline too?

## Proposed Changes

### Database Layer (`src/db/queries.ts`)

- **`createPlan`**: Check how many active plans exist. If there are fewer than 2, keep the existing one active and add the new one. If there are 2, require the user to replace one.
- **`getActivePlan` -> `getActivePlans`**: Change the query from `LIMIT 1` to return all plans where `is_active = 1` (up to 2).

### State Management (`src/context/AppContext.tsx`)

- **`AppState`**: Change `plan: Plan | null` to `plans: Plan[]`.
- **`usePlan` / `useApp`**: Expose the array of active plans. Update `markRead` and `saveJournal` to accept a `planId` so the app knows which plan is being updated.

### User Interface (`src/app/(main)/...`)

- **`settings.tsx` or Plan Picker**: When the user selects a new plan, check if they already have one active. If so, show a prompt/modal asking: "Start today or start tomorrow?". Set the `start_date` of the new plan accordingly.
- **`plan.tsx`**: Update the UI to render the array of plans. Add the banner logic: `if (new Date(plan.startDate) > today) { return <Banner text="..." /> }`.
- **`home.tsx`**: Update the "Today's Word" UI to render the tasks for both active plans, depending on the answer to Open Question #1.

## Verification Plan

### Automated/Manual Testing
- Pick a plan (e.g., Love). Complete Day 1.
- Pick a second plan (e.g., Faith). Select "Start tomorrow".
- Verify the Plan page shows the banner about the plan starting tomorrow.
- Verify Home page shows today's verse for Love, and nothing for Faith yet.
- Verify that trying to add a 3rd plan is prevented or replaces an existing one.
