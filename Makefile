# Makefile
#
# Usage: make <target>
#
# --- COMMANDS ---
# local-setup       → (Local) Install tools with Mise and sync npm dependencies (strict)
# local-update-lock → (Local) Sync package-lock.json after manual package.json edits
# dev               → Build and start dev server in foreground
# dev-bg            → Build and start dev server in background
# dev-down          → Stop development environment
# dev-logs          → Follow logs from the Astro container
# dev-shell         → Open interactive shell inside the container
# dev-rebuild       → Force clean rebuild of the dev image
# dev-reset-deps    → SURGICAL: Delete only node_modules volume and rebuild
# clean          	→ NUCLEAR: Stop everything and remove ALL volumes/images
# test           	→ (TBD) Run Playwright tests
# build-prod     	→ (TBD) Build production container

# Project Configuration
PROJECT_NAME = ramper-web
COMPOSE_DEV = docker compose -p $(PROJECT_NAME) -f docker-compose.yml

.PHONY: local-setup local-update-lock dev dev-bg dev-down dev-logs dev-shell dev-rebuild dev-reset-deps clean test build-prod

# --- LOCAL ENVIRONMENT ---

local-setup:
	@echo "🔍 Checking for Mise..."
	@command -v mise >/dev/null 2>&1 || { \
		echo "Error: 'mise' is not installed."; \
		echo "You can install it with 'brew install mise'."; \
		exit 1; \
	}
	@echo "Installing/Updating tools via Mise..."
	mise install
	@echo "Syncing npm dependencies..."
	mise x -- npm install
	@echo "Local environment is ready!"

local-update-lock:
	@echo "Updating package-lock.json (metadata only)..."
	mise x -- npm install --package-lock-only
	@echo "package-lock.json is now in sync with package.json"

# --- DEVELOPMENT ---

dev:
	$(COMPOSE_DEV) up --build

dev-bg:
	$(COMPOSE_DEV) up --build -d

dev-down:
	$(COMPOSE_DEV) down

dev-logs:
	$(COMPOSE_DEV) logs -f astro-dev

dev-shell:
	$(COMPOSE_DEV) exec astro-dev sh

dev-rebuild:
	$(COMPOSE_DEV) build --no-cache
	$(COMPOSE_DEV) up -d

# Surgical dependency reset
dev-reset-deps:
	$(COMPOSE_DEV) down
	docker volume rm $(PROJECT_NAME)_node_modules || true
	$(COMPOSE_DEV) up --build -d

# --- UTILS ---

clean:
	$(COMPOSE_DEV) down -v --rmi local

# --- FUTURE PHASES ---

test: dev-bg
	$(COMPOSE_DEV) --profile test up playwright-dev --abort-on-container-exit --exit-code-from playwright-dev; $(COMPOSE_DEV) --profile test rm -f playwright-dev

build-prod:
	@echo "Production build phase not implemented yet."
