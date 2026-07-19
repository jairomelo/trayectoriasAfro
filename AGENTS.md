# Agents

## 1. Architecture & Context

* **Project Structure:** This is a containerized monorepo.
  * **Root:** Global scripting, Docker Compose, and `.env` management.
  * **Backend (`/mstdb_manager`):** Django + Django Rest Framework.
  * **Frontend (`/mstdb_theme`):** SvelteKit.
* **Submodule Isolation:** Do not place backend logic in `mstdb_theme` or UI/component logic in `mstdb_manager`. Shared configuration values belong only in root-level `.env` files. If a utility or type is genuinely shared between submodules, place it in a root-level `/shared` directory and document the exception explicitly. Infrastructure coupling (e.g., the Dockerfile building the SvelteKit output into Django's staticfiles) is intentional and expected.
* **Legacy Awareness:** Before proposing refactors, check `git log` or existing patterns to avoid reverting intentional architectural decisions.

Ambiguous: "Do not leak environment-specific **application** code across submodule boundaries.". The term 'environment-specific application code' is ambiguous. It could mean code that varies by deployment environment (dev/prod), or it could mean code that is specific to one submodule's application domain. A model could allow cross-boundary leakage of domain logic as long as it isn't environment-specific, or could over-restrict and flag intentional shared utilities. Suggestion: Replace with: 'Do not place backend business logic in `mstdb_theme` or UI/component logic in `mstdb_manager`. Shared configuration values belong only in root-level `.env` files.'

## 2. Documentation & Comments

* **Be Ruthlessly Concise:** Prioritize "why" over "what." If the code is readable, do not add a comment.
* **Target Audience:** Write for an **intermediate developer**. Assume syntax fluency; focus on architectural "intent."
* **No Redundancy:** If a function or variable is self-explanatory, skip the documentation.

## 3. Docker & Infrastructure

* **Modern Compose:** **Never** include the `version` key in `compose.yml`. It is deprecated.
* **Image Optimization:** Use multi-stage builds and `slim`/`alpine` variants by default.

## 4. Workflow & Knowledge

* **File Operations:** Do not create `.md` files or update `README.md` unless explicitly requested.
* **Skills Over Docs:** Propose "Rules" or "Patterns" as **Copilot Skills** instead of embedding them as code comments.

## 5. Styles

* **No styles outside css or scss** Do not write component-scoped styles.
* **Fix styles outside css or scss** Move component-scoped styles to `custom.css` or `custom.scss` files

## 6. Accessibility

* Treat accessibility as a release requirement for all UI changes in `mstdb_theme`.
* Minimum target: **WCAG 2.1 Level AA**.
* For any UI/component/form update, ensure:
  * full keyboard operability,
  * visible focus states,
  * semantic HTML and correct ARIA usage,
  * sufficient color contrast,
  * accessible form labels/errors,
  * alt text for meaningful images.
* Validate with automated checks (if available in project tooling) and fix violations before finalizing.
* When uncertain, follow project guidance in `mstdb_theme/compliance`.
