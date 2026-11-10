# Project instructions

- Never start a development server (`npm run dev`, `npm start`, `vite`, or an equivalent command), including on an alternate port, unless the user explicitly requests that launch. The user manages the dev server.
- Do not stop or restart the user's development server. Use an already running server for browser checks; otherwise run checks that do not require starting one.

- When the user asks to push or deploy changes, include all current project changes, including existing uncommitted edits, unless the user explicitly narrows the scope. Review for secrets, run relevant checks, commit and push the changes, and monitor the deployment to completion. Do not exclude existing edits merely because they were made outside the current task.
