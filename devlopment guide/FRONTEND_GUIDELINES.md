# Frontend Guidelines

Conventions for the `client/` React app in Incident Command. Goal: a codebase that looks like it was built by one disciplined engineer, not stitched together from tutorials.

## Stack

- **React** (functional components + hooks only — no class components)
- **Vite** for build tooling
- **React Router** for client-side routing
- **Socket.io-client** for real-time incident timeline updates
- **Tailwind CSS** for styling (utility-first, no separate CSS-in-JS library)
- **Axios** (or a thin `fetch` wrapper) for API calls, centralized in one client module

## Folder structure

```
client/src/
├── api/                # API client functions (one file per resource: incidents.js, auth.js)
├── components/         # Reusable, presentational components (Button, Badge, Modal)
├── features/           # Feature-based modules (incidents/, statusPage/, auth/)
│   └── incidents/
│       ├── IncidentList.jsx
│       ├── IncidentDetail.jsx
│       ├── Timeline.jsx
│       └── useIncidentSocket.js   # custom hook for real-time updates
├── hooks/               # Shared hooks (useAuth, useDebounce)
├── context/             # React Context providers (AuthContext)
├── layouts/             # Page shells (DashboardLayout, PublicLayout)
├── pages/               # Route-level components, composed from features/
├── utils/               # Formatting, constants, helpers
└── main.jsx
```

**Rule of thumb:** if a component is reused across features, it goes in `components/`. If it's specific to incidents, it lives in `features/incidents/`. Pages in `pages/` should mostly just compose feature components — avoid putting business logic directly in a page file.

## Component conventions

- One component per file, file name matches component name (`IncidentCard.jsx` → `IncidentCard`)
- Keep components small and single-purpose; if a component's JSX exceeds ~150 lines, look for a natural split
- Props are destructured in the function signature, not accessed via `props.x` inside the body
- Co-locate a component's small, single-use hooks in the same folder (e.g., `useIncidentSocket.js` next to `Timeline.jsx`)
- No inline business logic in JSX — compute values above the `return`, keep the JSX readable

```jsx
// Good
function IncidentCard({ incident, onResolve }) {
  const severityColor = getSeverityColor(incident.severity);

  return (
    <div className={`rounded-lg border p-4 ${severityColor}`}>
      <h3 className="font-semibold">{incident.title}</h3>
      <StatusBadge status={incident.status} />
    </div>
  );
}
```

## State management

- **Local state** (`useState`) for anything scoped to one component
- **Context** only for genuinely global state: auth/session and the active socket connection. Don't reach for Context as a default — most state should stay local or be fetched where it's used
- **Server state** (incidents, users) is fetched via the `api/` layer and cached in the component that needs it; avoid duplicating server data across multiple pieces of local state
- No Redux, Zustand, or other state library — the app's state needs don't justify the overhead. Revisit only if the app clearly outgrows Context

## Real-time updates (Socket.io)

- One socket connection per session, established in `AuthContext` or a dedicated `SocketContext`, not re-created per component
- Subscribe to incident-specific rooms (`incident:<id>`) only while that incident's detail view is mounted; unsubscribe on unmount
- Socket event handlers should update local component state directly — don't route real-time events through a global store

## Styling

- Tailwind utility classes directly in JSX; avoid writing custom CSS files unless Tailwind genuinely can't express something
- Extract a class combination into a small component (not a `@apply` CSS class) once it's reused 3+ times
- Stick to Tailwind's default spacing/color scale — don't introduce one-off magic numbers (`mt-[13px]`)
- Define severity/status colors once in `utils/constants.js` (e.g., `SEVERITY_COLORS`) and reference them everywhere, rather than repeating conditional class strings per component

## Accessibility & responsiveness (non-negotiable, not stretch goals)

- Every interactive element must be reachable and operable by keyboard; visible focus states are required, not just default browser outlines removed without replacement
- Use semantic HTML (`<button>`, not `<div onClick>`) for anything interactive
- All pages must be usable down to mobile width (375px) — the status page in particular will be viewed on phones during an actual incident
- Respect `prefers-reduced-motion` for any animation beyond simple opacity/color transitions
- Form inputs have associated `<label>` elements, and error messages are announced (`aria-live` on the timeline feed, since it updates dynamically)

## Data fetching pattern

```js
// api/incidents.js
export async function getIncidents() {
  const res = await apiClient.get("/incidents");
  return res.data;
}
```

```jsx
// features/incidents/IncidentList.jsx
useEffect(() => {
  getIncidents().then(setIncidents).catch(handleError);
}, []);
```

- No fetch calls directly inside components — always go through `api/`
- Handle loading and error states explicitly in every data-fetching component; no silent failures
- Errors surface in the UI in plain language ("Couldn't load incidents — try refreshing"), never a raw stack trace or generic "Something went wrong" with no next step

## Writing UI copy

- Name things by what the user does, not how the system works: "Resolve incident," not "Update status field"
- Buttons state the action in active voice: "Create incident," "Resolve," "Post update"
- Keep the same label through a flow — if the button says "Resolve," the resulting confirmation says "Incident resolved," not "Status updated"
- Empty states tell the user what to do next ("No open incidents — you're all clear" beats a blank screen)
- Error messages say what happened and what to do, in the interface's voice, without apologizing or being vague

## Testing

- Component tests with React Testing Library for anything with logic (conditional rendering, form validation, socket event handling)
- Test user-visible behavior, not implementation details — query by role/text, not by CSS class or internal state
- Every feature's core happy path (create incident, post timeline update, resolve incident) needs at least one test before merging

## What to avoid

- No prop drilling more than 2 levels — use composition or Context instead
- No business logic duplicated between frontend and backend validation — frontend validation is for UX, backend is the source of truth
- No commented-out code left in commits
- No default AI-generated look: avoid the reflexive cream-background-plus-terracotta-accent or generic dark-mode-with-one-neon-accent palette. Pick a palette and type pairing that's intentional for this product (an incident/ops tool — calm, high-legibility, clear severity color coding) and stay consistent with it across every page
