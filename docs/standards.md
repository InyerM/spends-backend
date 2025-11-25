# Project Standards

## Package Management
- **ALWAYS** use `pnpm` for installing dependencies.
- Do not use `npm` or `yarn`.

## Language
- **English Only**: All code, comments, console logs, and documentation must be in English.
- No Spanish or any other language in the codebase.

## Code Quality
- **Linting**: ESLint with strict TypeScript rules.
- **Formatting**: Prettier for consistent code style.
- **No Explicit Any**: Avoid `any` types. Use specific types or `unknown` if necessary.
- **Comments**: Keep comments minimal. Only add comments when strictly necessary to explain complex logic or non-obvious decisions.

## File Structure
- **TypeScript Only**: No `.js` files in `src/` or `scripts/`.
- **Path Aliases**: Use absolute imports where configured.

## Commit Messages
- Use conventional commits format.
- Write messages in English.
