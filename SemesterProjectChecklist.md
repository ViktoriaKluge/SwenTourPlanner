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
| Images stored externally | Not met | No image stored at all, because map is calculated via api |
| Logging framework | Met | Spring Boot SLF4J/Logback logging in backend services and `application.yml`. |
| JUnit unit tests | Met | 63 JUnit tests across 9 test classes (stats/search, auth, cross-account isolation, import safety, routing logic, mapping, JWT, weather); see `UnitTests.md`. |
| Configuration separate from code | Met | `application.yml` uses environment variables for DB and API keys. |
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
| Wireframes/UML/protocol PDF | Partially met | `PROTOKOLL.md` covers architecture, design patterns, technical decisions, wireframes (screenshots), a use-case diagram, and a sequence diagram (both Mermaid). |
| Time tracking | Missing |  |

