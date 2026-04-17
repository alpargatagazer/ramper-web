# Makefile for Ramper Web
# Professional orchestration for local, test, and production environments.
#
# --- COMMANDS ---
# local-setup       → (Host) Install tools (Mise) and dependencies (npm)
# local-update-lock → (Host) Sync package-lock.json after manual package.json edits
# dev               → Build and start dev server in foreground
# dev-bg            → Build and start dev server in background
# dev-down          → Stop development environment
# dev-logs          → Follow logs from the Astro container
# dev-shell         → Open interactive shell inside the Astro container
# dev-rebuild       → Force clean rebuild of the dev image
# dev-reset-deps    → SURGICAL: Delete node_modules volume and rebuild
# test              → Run Playwright Smoke Tests (interactive mode)
# audit             → Run local Lighthouse CI audit on production build
# build-prod        → Create final production image locally
# prod-up           → Pull and start the production image (VPS simulation)
# clean             → NUCLEAR: Stop everything and remove ALL volumes/images
#
# Usage: make <target>

# --- Project Configuration ---
PROJECT_NAME = ramper-web

# Load and export versions as environment variables for all commands
include .env.versions
export

# Compose Commands (Explicitly loading versions file for interpolation)
COMPOSE_DEV  = docker compose --env-file .env.versions -p $(PROJECT_NAME)-dev -f docker/docker-compose.dev.yml
COMPOSE_PROD = docker compose --env-file .env.versions -p $(PROJECT_NAME)-prod -f docker/docker-compose.prod.yml

# --- Phony Targets ---
.PHONY: local-setup local-update-lock \
        dev dev-bg dev-down dev-logs dev-shell dev-rebuild dev-reset-deps \
        test audit build-prod prod-up clean

# --- Local Environment (Host) ---

local-setup:
	@echo "🔍 Checking for Mise..."
	@command -v mise >/dev/null 2>&1 || { echo "Error: 'mise' is not installed."; exit 1; }
	@echo "Installing tools via Mise..."
	mise install
	@echo "Syncing npm dependencies..."
	mise x -- npm install
	@echo "Local environment is ready!"

local-update-lock:
	@echo "Updating package-lock.json (metadata only)..."
	mise x -- npm install --package-lock-only

# --- Development (Docker) ---

dev:
	$(COMPOSE_DEV) up --build

dev-bg:
	$(COMPOSE_DEV) up --build -d

dev-down:
	$(COMPOSE_DEV) down

dev-logs:
	$(COMPOSE_DEV) logs -f astro

dev-shell:
	$(COMPOSE_DEV) exec astro sh

dev-rebuild:
	$(COMPOSE_DEV) build --no-cache
	$(COMPOSE_DEV) up -d

dev-reset-deps:
	$(COMPOSE_DEV) down
	docker volume rm $(PROJECT_NAME)-dev_node_modules || true
	$(COMPOSE_DEV) up --build -d

# --- Testing & Quality ---

test: dev-bg
	$(COMPOSE_DEV) --profile test up playwright --abort-on-container-exit --exit-code-from playwright
	$(COMPOSE_DEV) --profile test rm -f playwright

audit:
	@echo "Building production image..."
	docker build \
		--build-arg NODE_VERSION=${NODE_IMAGE_VERSION} \
		--build-arg CADDY_VERSION=${CADDY_IMAGE_VERSION} \
		-t $(PROJECT_NAME)-prod:local \
		-f docker/Dockerfile.prod .
	@echo "Starting production container for audit..."
	docker run -d --name ramper-audit -p 8080:80 $(PROJECT_NAME)-prod:local
	@echo "Waiting for server to be ready..."
	@until curl -s http://localhost:8080 > /dev/null; do sleep 1; done
	@echo "Running Lighthouse CI audit..."
	-npx lhci autorun --collect.url=http://localhost:8080/ --collect.url=http://localhost:8080/about
	@echo "Cleaning up audit container..."
	docker stop ramper-audit && docker rm ramper-audit

# --- Production & Build ---

build-prod:
	docker build -t $(PROJECT_NAME)-prod:latest -f docker/Dockerfile.prod .

prod-up:
	$(COMPOSE_PROD) pull
	$(COMPOSE_PROD) up -d

# --- Utilities ---

clean:
	$(COMPOSE_DEV) down -v --rmi local
	$(COMPOSE_PROD) down -v --rmi local || true
