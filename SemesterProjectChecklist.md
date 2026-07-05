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
| Images stored externally | Not met | No image field exists on the tour model anymore (removed entirely); the checklist lists an image as a required tour attribute — decide whether to re-add it or justify the omission in the protocol. |
| Logging framework | Met | Spring Boot SLF4J/Logback logging in backend services and `application.yml`. |
| JUnit unit tests | Met | 63 JUnit tests across 9 test classes (stats/search, auth, cross-account isolation, import safety, routing logic, mapping, JWT, weather); see `UnitTests.md`. |
| Configuration separate from code | Met | `application.yml` uses environment variables for DB, API keys, and image directory. |
| Self-register and login | Met | `/api/auth/register`, `/api/auth/login` issue a JWT; Angular auth service/login view. |
| Tour CRUD | Met | `/api/tours` endpoints and Angular tour form/list/detail views. |
| Tour fields | Met | Model/DTO include title, description, start/end point, transport type, distance, duration, and route geometry for the map. |
| OpenRouteService integration | Met | `OpenRouteServiceClient` enriches route information. |
| Leaflet map display | Met | `TourMapComponent` and `LocationPickerComponent`. |
| Tour-log CRUD | Met | `/api/tours/{tourId}/logs/**` endpoints and log form/list components. |
| User-owned tours/logs only | Met | All tour/log endpoints resolve the username from the JWT (`Principal`) instead of client input; repository queries are scoped by username. |
| Validated user input | Met | Angular reactive validators and backend `@Valid` DTO handling. |
| Full-text search | Met | `FullTextSearchService` and `/api/tours/search`. |
| Computed popularity | Met | `TourStatsService.popularity`. |
| Computed child-friendliness | Met | `TourStatsService.childFriendliness`. |
| Search includes computed values | Met | Covered by service logic and JUnit tests. |
| Import/export | Met | `/api/tours/import` and `/api/tours/export`. |
| Unique feature | Met | Weather summary integration through `/api/weather/**`. |
| Wireframes/UML/protocol PDF | Missing | Required by the hand-in PDF and tied to a must-have (design pattern has to be mentioned in the protocol); doesn't exist yet. |
| Time tracking | Missing | Required by the hand-in PDF; no time log exists yet. |

---

### Architektur / Dokumentation (Begründung)
- Doppeltes Routing (OSRM im Frontend + ORS im Backend) erklären/begründen – z.B. als Fallback-Design dokumentieren
- Warum `.env` manuell in `TourPlannerApplication` geladen wird (kein dotenv-Library-Support für Spring Boot 2.7)
- Frontend ruft Nominatim und OSRM direkt aus dem Browser auf – bewusste Entscheidung 
- Welche Design-Patterns / Konzepte wurden verwendet?
- Haben wir ein Logging Framework und wie funktioniert es? Was loggt es?
- Was genau macht unser unique feature? 
- Wie genau areiten frontend und backend zusammen?
- JWT-Security-Konzept begründen: warum JWT statt Session/Cookie, warum die Ownership serverseitig aus dem Token abgeleitet wird statt vom Client übergeben, bewusst kein Refresh-Token/Blacklisting
- Layer-spezifische Exceptions (`BadRequestException`/`InvalidCredentialsException`/`NotFoundException`) als eigenes Design-Pattern-Element erwähnen
- Warum Popularity/Child-Friendliness nicht in der DB gespeichert, sondern bei jedem Request neu berechnet werden
- Unit-Test-Strategie begründen: welche Bereiche zuerst getestet wurden (Security/Isolation vor Kernlogik) und was bewusst ausgeklammert blieb (Exception-Handler-Tests brauchen Spring-Context statt reiner Unit-Tests; ein alter Cascade-Bug bräuchte einen JPA-Integrationstest)
- Lauf-Geschwindigkeits-Korrektur: ORS hat kein eigenes "Laufen"-Profil, die Dauer wird nachträglich mit 8 km/h neu berechnet
- Wheelchair-Routing: die Vorschau (OSRM, kein Rollstuhl-Profil) kann von der gespeicherten Route (ORS, echtes Profil) abweichen
- Bild-Attribut: Entscheidung dokumentieren, warum kein Bild-Upload existiert (oder Feature nachziehen, falls Zeit bleibt)

### Maybe add
- **FAQ.** mit userguide und zB Berechnungen