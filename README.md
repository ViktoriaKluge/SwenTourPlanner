# SWEN Tour Planner

Two-tier Tour Planner implementation for the semester project:

- Angular frontend with MVVM-style feature/state/services split
- Spring Boot backend with controller, service/business, and repository/data-access layers
- PostgreSQL persistence via Spring Data JPA/Hibernate
- REST/JSON communication between frontend and backend
- OpenRouteService integration for route distance/time enrichment
- Leaflet map display in the frontend
- Import/export of tour data as JSON
- Unit tests for full-text search and computed tour attributes

## Prerequisites

- Node.js and npm
- Java 8
- Maven
- Docker for PostgreSQL (optional)

## Configuration

Backend configuration is kept outside source code through environment variables. Defaults are provided for local development for DB and image directory.

**The API keys must be provided before starting the backend.** Create a file `backend/.env` with the following content:

```
ORS_API_KEY=<your-openrouteservice-key>
OPENWEATHER_API_KEY=<your-openweather-key>
```

The backend loads this file automatically on startup. Alternatively, set the variables via PowerShell:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/tourplanner"
$env:DB_USER="tourplanner"
$env:DB_PASSWORD="tourplanner"
$env:TOUR_IMAGE_DIR="./data/images"
$env:ORS_API_KEY="<your-openrouteservice-key>"
$env:OPENWEATHER_API_KEY="<your-openweather-key>"
```

## Run

Start everything with a single command (database, backend, and frontend):

```powershell
npm run start:all
```

This starts PostgreSQL in the background via Docker, then runs the Spring Boot backend and the Angular frontend in parallel. Output from both processes is shown in the same terminal, prefixed with `[backend]` and `[frontend]`. Stop both with `Ctrl+C`. To also stop the database container afterwards:

```powershell
docker-compose stop
```

Alternatively, start each part individually:

```powershell
docker-compose up -d   # database only
npm run backend        # backend only
npm start              # frontend only
```

Open `http://localhost:4200`.

## Tests

Frontend:

```powershell
npm test
```

Backend:

```powershell
mvn -f backend/pom.xml test
```

## Architecture Notes

The backend follows a layer-based architecture:

- Presentation layer: `backend/src/main/java/at/fhtw/tourplanner/controller`
- Business layer: `backend/src/main/java/at/fhtw/tourplanner/service`
- Data access layer: `backend/src/main/java/at/fhtw/tourplanner/repo`
- Domain model: `backend/src/main/java/at/fhtw/tourplanner/model`
- DTO boundary: `backend/src/main/java/at/fhtw/tourplanner/dto`

The Angular frontend follows an MVVM-oriented feature layout:

- Views/components: `src/app/features/**`
- ViewModels: `src/app/features/*/view-model`
- Data access services: `src/app/features/*/data-access`
- Shared feature models: `src/app/features/*/models`

Design patterns used:

- Repository pattern through Spring Data repositories
- DTO/Mapper pattern for REST serialization boundaries
- Service layer pattern for business logic such as search and computed attributes

Additional project documentation:

- `API.md`: REST endpoints and frontend/backend links
- `UnitTests.md`: JUnit unit test catalogue and rationale
