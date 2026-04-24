# Makefile for Ramper Web
# Professional orchestration for local, test, and production environments.
#
# --- COMMANDS ---
# local-setup       → (Host) Install tools (Mise) and dependencies (npm)
# local-update-lock → (Host) Sync package-lock.json after manual package.json edits
# dev-up            → Build and start dev server in background
# dev-down          → Stop development environment
# dev-logs          → Follow logs from the Astro container
# dev-shell         → Open interactive shell inside the Astro container
# dev-rebuild       → Force clean rebuild of the dev image
# dev-reset-deps    → SURGICAL: Delete node_modules volume and rebuild
# build-prod        → Create final production image locally
# prod-up           → Start the production environment (VPS simulation)
# prod-down         → Stop the production environment
# prod-logs         → Follow logs from the Caddy container
# prod-shell        → Open interactive shell inside the Caddy container
# test              → Run Playwright Smoke Tests (interactive mode)
# audit             → Run local Lighthouse CI audit on production build
# scan              → Run local Trivy security scan on production build
# clean             → NUCLEAR: Stop everything and remove ALL volumes/images
#
# Usage: make <target>

# --- Project Configuration ---
PROJECT_NAME = ramper-web

# Audit configuration for local simulation
AUDIT_PORT = 8084
AUDIT_URL = http://127.0.0.1:$(AUDIT_PORT)

# Load and export versions as environment variables for all commands
include .env.versions
export

# Compose Commands (Explicitly loading versions file for interpolation)
COMPOSE_DEV  = docker compose --env-file .env.versions -p $(PROJECT_NAME)-dev -f docker/docker-compose.dev.yml
COMPOSE_PROD = docker compose --env-file .env.versions -p $(PROJECT_NAME)-prod -f docker/docker-compose.prod.yml

# --- Phony Targets ---
.PHONY: local-setup local-update-lock \
        dev-up dev-down dev-logs dev-shell dev-rebuild dev-reset-deps \
        build-prod prod-up prod-down prod-logs prod-shell test audit scan clean

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

dev-up:
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

# --- Production & Build ---

build-prod:
	@echo "Building production image..."
	docker build \
		--build-arg NODE_VERSION=${NODE_IMAGE_VERSION} \
		--build-arg CADDY_VERSION=${CADDY_IMAGE_VERSION} \
		-t $(PROJECT_NAME)-prod:local \
		-f docker/Dockerfile.prod .

prod-up: build-prod
	DOCKER_IMAGE=$(PROJECT_NAME)-prod:local $(COMPOSE_PROD) up -d

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f astro

prod-shell:
	$(COMPOSE_PROD) exec astro sh

# --- Testing & Quality ---

test: dev-up
	-@$(COMPOSE_DEV) --profile test up playwright --abort-on-container-exit --exit-code-from playwright; \
	EXIT_CODE=$$?; \
	echo "Cleaning up test environment..."; \
	$(COMPOSE_DEV) --profile test rm -f playwright; \
	exit $$EXIT_CODE

audit: build-prod
	@echo "Starting production container for audit on $(AUDIT_URL)..."
	docker run -d --name ramper-audit -p $(AUDIT_PORT):80 $(PROJECT_NAME)-prod:local
	@echo "Waiting for server to be ready..."
	@until curl -s $(AUDIT_URL) > /dev/null; do sleep 1; done
	@echo "Running strict Lighthouse audit with local thresholds..."
	-@LIGHTHOUSE_TARGET=$(AUDIT_URL) node scripts/lighthouse-check.mjs; \
	EXIT_CODE=$$?; \
	echo "Cleaning up audit container..."; \
	docker stop ramper-audit && docker rm ramper-audit; \
	exit $$EXIT_CODE

scan: build-prod
	@echo "Running Trivy vulnerability scanner on production image..."
	docker run --rm --name ramper-scan -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy:latest image \
		--severity CRITICAL,HIGH \
		--ignore-unfixed \
		--exit-code 1 \
		$(PROJECT_NAME)-prod:local

# --- Utilities ---

clean:
	$(COMPOSE_DEV) down -v --rmi local
	$(COMPOSE_PROD) down -v --rmi local || true
