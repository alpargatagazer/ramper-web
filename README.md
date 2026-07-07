# Ramper Web

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=alpargatagazer_ramper-web&metric=alert_status)](https://sonarcloud.io/dashboard?id=alpargatagazer_ramper-web)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=alpargatagazer_ramper-web&metric=bugs)](https://sonarcloud.io/dashboard?id=alpargatagazer_ramper-web)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=alpargatagazer_ramper-web&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=alpargatagazer_ramper-web)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=alpargatagazer_ramper-web&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=alpargatagazer_ramper-web)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=alpargatagazer_ramper-web&metric=security_rating)](https://sonarcloud.io/dashboard?id=alpargatagazer_ramper-web)

The official website for **Ramper**, a Spanish slowcore / post-rock project.

*Built entirely independently by the band.*

## Tech Stack
- **Framework**: [Astro](https://astro.build) (Static by default, with dynamic API routing for newsletter subscriptions)
- **Design**: [Figma](https://www.figma.com) (For the UI design)
- **CMS**: [Keystatic](https://keystatic.com/) (Local and cloud mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first CSS via Vite plugin)
- **Infrastructure**: Docker & Docker Compose
- **Quality Assurance**: Playwright (E2E Testing) & Lighthouse (Performance & Accessibility Audits)
- **Static Analysis**: [SonarQube Cloud](https://sonarcloud.io) (Code quality, bugs, duplication)
- **Security**: Trivy vulnerability scanning on final Docker images.
- **Versioning**: Automated SemVer with GitHub Releases and synchronized `package.json`.
- **Dependency Management**: [Renovate](https://github.com/apps/renovate) (Automated dependency updates)
- **CI/CD**: GitHub Actions (Containerized build, test, and publish to GHCR)
- **Visual Effects**: Custom SVG Film Grain & Dynamic Typography (Reactive Tracking)
- **Assets**: Optimized high-resolution image delivery with direct download support.

## Development Environment

The entire local development environment is containerized. You do not need Node.js mounted locally, just Docker and `make`.

### Quick Start

1. Clone the repository.
2. Copy the `.env.example` file to create your local `.env` (this defines environment variables used in local deployment).
   ```bash
   cp .env.example .env
   ```
3. Start the development environment:
   ```bash
   make dev-up
   ```

Once running:
- The website is mapped to `http://localhost:4321`
- The Keystatic Admin panel is at `http://localhost:4321/keystatic`
- Form submissions are handled via **Web3Forms**.
- The local filesystem is bind-mounted, so edits in VS Code instantly trigger a browser hot-reload.

### Automated Testing (Local)

The project includes an automated test suite matching the GitHub Actions pipeline.

- **E2E Tests**: Run the Playwright suite inside a dedicated container:
  ```bash
  make test
  ```
- **Lighthouse Audit**: Run a strict Lighthouse test against a production-like build (thresholds at 85-95%):
  ```bash
  make audit
  ```

### Helpful `make` Commands

- `make dev-logs` — Tail the logs from the running Astro container
- `make dev-shell` — Open an interactive terminal (`sh`) inside the container
- `make dev-down` — Stop the development containers gracefully
- `make dev-reset-deps` — Stop containers, remove the cached `node_modules` volume, and rebuild

## Project Structure

- `src/` — Astro source code (pages, components, layouts)
  - `src/content/` — Where Keystatic saves your CMS data locally in `.mdoc` (Markdoc) format.
- `docker/` — Dockerfiles and Compose configurations for `dev` and `prod` stages
- `tests/` — Playwright E2E smoke tests
- `scripts/` — Node.js utility scripts (like the Lighthouse auditor)
- `.github/workflows/` — CI/CD Pipeline definition
  - `.github/actions/` — Shared composite actions for DRY CI execution

## Newsletter Automation (Listmonk)

The site integrates with **Listmonk** to manage newsletter subscriptions:
- **Signup Form**: Users can subscribe using the form in the UI. Subscriptions are proxied through the server endpoint `/api/newsletter/subscribe` which routes requests internally to the Listmonk API using the `LISTMONK_URL`.
- **Automated Campaigns**: The script `scripts/send-newsletter.mjs` parses new posts in `src/content/posts`, compares the latest post slug against the tracking file, and dispatches an email campaign to Listmonk.
  - The script uses the Listmonk v6 API (cookie-based session login) to authenticate.
  - This script is automatically run in the background when the production Docker container starts.
  - State is tracked in `.last-newsletter.json` which is mapped to a persistent volume in production to prevent duplicate campaign dispatches.
- **Docker Stack**: Listmonk (and its PostgreSQL database) are now fully integrated into both the `dev` and `prod` Docker Compose stacks. The initial superadmin user is automatically created upon first launch via environment variables.

### Local Testing of Newsletter Script
To test the newsletter script locally against the development Listmonk container:
1. Ensure the development environment is running (`make dev-up`).
2. Make sure `LISTMONK_USERNAME` and `LISTMONK_PASSWORD` are set in your `.env` file.
3. Run the dedicated Makefile target:
   ```bash
   make test-newsletter
   ```
   *(This securely injects the required environment variables from your `.env` and runs the test script).*
3. To test a dry-run without connecting to Listmonk:
   ```bash
   npm run newsletter:test:dry
   ```

## CI/CD Pipeline

The project uses GitHub Actions for a robust Smart Pipeline:
1. Validates the build.
2. Runs **four parallel validation jobs**:
   - **Playwright** E2E tests (Chromium in CI for speed; run all three browsers—Chromium, Firefox, WebKit—locally via `make test`)
   - **Lighthouse** audits with strict performance/accessibility thresholds
   - **SonarQube Cloud** static analysis for bugs, smells and duplication
   - **Trivy** security scan for CVEs in the production Docker image
3. Automatically pushes the signed Docker image to **GHCR** upon success.
4. **Renovate** bot monitors dependencies (npm, Docker, GitHub Actions) and opens grouped PRs.

## Deployment
The project is container-ready, thoroughly tested, and pushes its artifacts to GHCR. Real-world continuous deployment to a VPS will be added in a future phase.

All the deployment is managed by [Ramper Web Deploy](/Users/alpargatagazer/workspace/repos/ramper-web-deploy).

### Required Secrets for CI/CD
To run the full pipeline, including security scans and automated releases, the following GitHub Secrets are required:
- `GH_PAT`: Personal Access Token with `Contents: Read & Write` permissions (used to bypass branch protection for automated versioning).
- `PUBLIC_FORM_EMAIL`: Email address for the contact form.
- `PUBLIC_WEB3FORMS_ACCESS_KEY`: Access key for Web3Forms (required for the contact form).
- `SONAR_TOKEN`: Authentication token for SonarQube Cloud.

The following variables are also required: `PUBLIC_SONGKICK_ARTIST_ID`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_INSTAGRAM_URL`, `PUBLIC_X_URL`, `PUBLIC_BLUESKY_URL`, `PUBLIC_MERCH_URL`, `SITE_URL`.
