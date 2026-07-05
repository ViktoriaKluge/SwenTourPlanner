# SWEN Tour Planner

Two-tier Tour Planner implementation for the semester project:

- Angular frontend with MVVM-style feature/state/services split
- Spring Boot backend with controller, service/business, and repository/data-access layers
- PostgreSQL persistence via Spring Data JPA/Hibernate
- REST/JSON communication between frontend and backend
- JWT-based authentication with per-user data isolation
- OpenRouteService integration for route distance/time enrichment
- OpenWeather integration for current/tour weather and clothing advice
- Leaflet map display in the frontend
- Import/export of tour data as JSON
- 63 JUnit unit tests covering search, computed attributes, auth, routing, and weather

## Prerequisites

- Node.js and npm
- JDK 17 or newer (project compiles with `java.version=1.8` target, but is built/run with a modern JDK; JDK 21 LTS was used for this setup)
- Maven (no `mvnw` wrapper in this repo, so a global `mvn` install is required)
- Docker Desktop, for PostgreSQL (optional, only needed to run against Postgres instead of H2)

### First-time setup (Windows)

If `java` and `mvn` are not yet available in a terminal, set them up once:

1. **JDK**: install a JDK (e.g. [Eclipse Temurin 21](https://adoptium.net/)) or reuse one already on disk (IDEs like IntelliJ often keep JDKs under `%USERPROFILE%\.jdks\`).
2. **Maven**: download the binary zip from the [official Maven download page](https://maven.apache.org/download.cgi), extract it somewhere permanent, e.g. `C:\Users\<you>\tools\apache-maven-<version>`.
3. **Set environment variables** (User scope), then add both `bin` folders to `PATH`:

   ```powershell
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Users\<you>\.jdks\temurin-21.0.8", "User")
   [Environment]::SetEnvironmentVariable("MAVEN_HOME", "C:\Users\<you>\tools\apache-maven-3.9.16", "User")

   $oldPath = [Environment]::GetEnvironmentVariable("PATH", "User")
   $newPath = "$oldPath;$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin"
   [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
   ```

   Restart the terminal/VSCode afterwards so the new `PATH` is picked up. Verify with `java -version` and `mvn -version`.
4. **Docker Desktop**: install from [docker.com](https://www.docker.com/products/docker-desktop/) and make sure it's running (`docker info`) before using `docker-compose`.

### Download dependencies

Once the tools above are on `PATH`, fetch all project dependencies:

```powershell
npm ci                                    # frontend (Angular, Bootstrap, Leaflet, ...)
mvn -f backend/pom.xml dependency:resolve # backend (Spring Boot, java-jwt, PostgreSQL/H2 drivers, ...)
docker pull postgres:16                   # DB image used by docker-compose.yml
```

## Configuration

Backend configuration is kept outside source code through environment variables. Defaults are provided for local development for the DB.

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
- JWT authentication: `backend/src/main/java/at/fhtw/tourplanner/security`

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

- `PROTOKOLL.md`: architecture, design decisions, wireframes, and diagrams for the hand-in
- `API.md`: REST endpoints and frontend/backend links
- `UnitTests.md`: JUnit unit test catalogue and rationale
