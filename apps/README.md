# Applications

This directory owns Combric-maintained applications and application boundaries.

- `docs` is the private static documentation workspace. It includes Foundations,
  layout and component documentation, and the controlled `/playground/` route.
- `playground` is a compatibility pointer documenting that the Playground is
  integrated into `docs`; it is intentionally not a separate package.

Only a real application with its own `package.json` becomes a pnpm workspace.
