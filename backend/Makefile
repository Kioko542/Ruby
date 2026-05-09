.PHONY: run build tidy services-up services-down services-logs

run:
	go run ./cmd/server/main.go

build:
	go build -o bin/server ./cmd/server/main.go

tidy:
	go mod tidy

services-up:
	docker compose -f ../docker-compose.yml up -d

services-down:
	docker compose -f ../docker-compose.yml down

services-logs:
	docker compose -f ../docker-compose.yml logs -f postgres