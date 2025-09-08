SHELL := /bin/bash

.PHONY: up db dev

up:
	docker compose up -d

db:
	cd apps/api && pnpm prisma:dev && pnpm prisma:seed

dev:
	PNPM_HOME=$$PNPM_HOME pnpm dev:all

