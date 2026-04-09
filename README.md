# Ramper Web

The official website for **Ramper**, a Spanish slowcore / post-rock project.

*Built entirely independently by the band.*

## Tech Stack
- **Framework**: [Astro](https://astro.build) (SSR in dev, Static in production)
- **CMS**: [Keystatic](https://keystatic.com/) (Local mode/Git-backed CMS)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first CSS via Vite plugin)
- **Environment**: Docker & Docker Compose

## Development

The entire local development environment is containerized. You do not need Node.js mounted locally, just Docker.

### Quick Start

```bash
# Build and start the development container in the background
make dev-bg
```

Once running:
- The website is mapped to `http://localhost:4321`
- The Keystatic Admin panel is at `http://localhost:4321/keystatic`
- The local filesystem is bind-mounted, so edits in VS Code instantly trigger a browser hot-reload.

### Helpful Commands
We use a `Makefile` to simplify Docker operations:

- `make logs` — Tail the logs from the running Astro container
- `make shell` — Open an interactive terminal (`sh`) inside the container
- `make down` — Stop the container gracefully
- `make clean` — Stop and remove the container AND clear the cached `node_modules` volume (useful if dependencies break)
- `make rebuild` — Force a clean build of the Docker image from scratch

## Project Structure

- `src/pages/`: Astro file-based router.
- `src/layouts/`: Global wrapper structures (nav, footer).
- `src/styles/global.css`: The root of the design system.
- `src/content/`: Where Keystatic saves your CMS data locally in `.mdoc` (Markdoc) format.
- `keystatic.config.ts`: Defines the CMS schema.

## Deployment (TODO in Phase 2)
Currently scoped for local dev. Production deployment (Docker multi-stage + Playwright + Lighthouse + Caddy reverse proxy on Hetzner) will be added shortly.
