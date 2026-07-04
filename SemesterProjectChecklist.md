# Semester Project Checklist

Checked against `semester-project.pdf`.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Angular web UI | Met | `src/app`, standalone Angular components, Leaflet map components. |
| Angular MVVM pattern | Met | Views in `features/**`, `TourViewModelService` in `features/tours/view-model`, data access in `features/tours/data-access`. |
| Java/Spring Boot backend | Met | `backend/pom.xml`, `TourPlannerApplication.java`. |
| Client-server communication over HTTP/JSON | Met | Angular `HttpClient` services call `/api/**`; Spring controllers expose REST JSON endpoints. |
| Layer-based backend architecture | Met | `controller`, `service`, `repo`, `model`, `dto` packages. |
| Design patterns | Met | Repository pattern, DTO/Mapper pattern, service layer, MVVM in frontend. |
| Reusable UI component | Met | Reusable components include `TourCardComponent`, `TourMapComponent`, log/form components. |
| PostgreSQL via O/R mapper | Met | Spring Data JPA/Hibernate repositories and PostgreSQL dependency. |
| Images stored externally | Partly met | `README.md` documents external image-path approach and `TOUR_IMAGE_DIR`; verify final runtime image upload/storage flow before submission. |
| Logging framework | Met | Spring Boot SLF4J/Logback logging in backend services and `application.yml`. |
| JUnit unit tests | Met | 23 JUnit tests in `TourStatsAndSearchTest.java`; see `UnitTests.md`. |
| Configuration separate from code | Met | `application.yml` uses environment variables for DB, API keys, and image directory. |
| Self-register and login | Met | `/api/auth/register`, `/api/auth/login`, Angular auth service/login view. |
| Tour CRUD | Met | `/api/tours` endpoints and Angular tour form/list/detail views. |
| Tour fields | Met | Model/DTO include title, description, start/end, transport type, distance, time, route info/map data. |
| OpenRouteService integration | Met | `OpenRouteServiceClient` enriches route information. |
| Leaflet map display | Met | `TourMapComponent` and `LocationPickerComponent`. |
| Tour-log CRUD | Met | `/api/tours/{tourId}/logs/**` endpoints and log form/list components. |
| User-owned tours/logs only | Met | Backend filters by username and requires `X-User` for tour operations. |
| Validated user input | Met | Angular reactive validators and backend `@Valid` DTO handling. |
| Full-text search | Met | `FullTextSearchService` and `/api/tours/search`. |
| Computed popularity | Met | `TourStatsService.popularity`. |
| Computed child-friendliness | Met | `TourStatsService.childFriendliness`. |
| Search includes computed values | Met | Covered by service logic and JUnit tests. |
| Import/export | Met | `/api/tours/import` and `/api/tours/export`. |
| Unique feature | Met | Weather summary integration through `/api/weather/**`. |
| Wireframes/UML/protocol PDF | Not in scope | Required by hand-in PDF; create or verify external protocol document before final submission. |
| Time tracking | Not in scope | Required by hand-in PDF; maintain in protocol. |

---

## Noch genauer anschauen

### Unit Tests
- Aktuelle Tests (`TourStatsAndSearchTest.java`) decken nur Stats und Suche ab – prüfen ob weitere Bereiche gefordert sind (z.B. Controller, Mapper, Auth)
- Testen ob alle Tests noch grün sind nach den letzten Änderungen (`TourService.addLog` fix)
- Testabdeckung realistisch einschätzen: reicht das für die Anforderung?

### Architektur / Weg (Begründung für den Lektor)
- Doppeltes Routing (OSRM im Frontend + ORS im Backend) erklären/begründen – z.B. als Fallback-Design dokumentieren
- Warum `.env` manuell in `TourPlannerApplication` geladen wird (kein dotenv-Library-Support für Spring Boot 2.7)
- Frontend ruft Nominatim und OSRM direkt aus dem Browser auf – bewusste Entscheidung oder Optimierungspotential?
- Welche Design-Patterns wurden verwendet?
- Haben wir ein Logging Framework und wie funktioniert es? Was loggt es?

### Was ist gefordert (Double Check)
- Besonders: Wireframes, UML-Diagramme, Protokoll, Zeitaufzeichnung – sind diese Dokumente vollständig?
- Geforderte Designmuster nochmals prüfen: Repository, MVVM, DTO/Mapper – gibt es noch weitere die erwartet werden?

### Optimierungsoptionen
- Was genau macht unser unique feature? 
- Wie genau areiten frontend und backend zusammen?
- Type Safty
- alles mit einem Befehl starten? docker-compose
- im Log sichtbar falls ors und osrm beide ausfallen?


### Offene Fragen
- **Exportieren:** mit Logs?
- **FAQ.** mit userguide und zB Berechnungen
- **LOG:** was genau wollen wir (nicht) loggen?
- **BruteFroce:** failed attempts tracken?
- **PSW:** sicheres passwort?
- **Token:** jwt?