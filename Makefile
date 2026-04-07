.PHONY: up down build

# Build contract locally and start all services
up: build
	docker-compose up -d

# Just start services (use existing .so)
start:
	docker-compose up -d

down:
	docker-compose down

# Build contract and copy .so for Docker
build:
	anchor build
	cp target/deploy/revshare.so docker/revshare.so
	docker-compose build solana-validator
