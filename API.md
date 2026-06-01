# API Endpoints

Backend base path: `/api`

All tour endpoints except export expect the active username in the `X-User` request header. The Angular proxy in `proxy.conf.json` forwards `/api` calls to the Spring Boot backend.

| Method | Endpoint | Controller | Frontend link | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `AuthController.register` | `AuthService.register` | Creates a user account and returns the username. |
| `POST` | `/api/auth/login` | `AuthController.login` | `AuthService.login` | Validates credentials and returns the username. |
| `GET` | `/api/tours` | `TourController.list` | `TourService.load` | Lists all tours for the authenticated user. |
| `GET` | `/api/tours/search?q={query}` | `TourController.search` | `TourService.load` | Runs full-text search over tour data, logs, and computed attributes. |
| `POST` | `/api/tours` | `TourController.create` | `TourService.add` | Creates a tour and enriches route information where possible. |
| `PUT` | `/api/tours/{id}` | `TourController.update` | `TourService.update` | Updates an existing tour for the active user. |
| `DELETE` | `/api/tours/{id}` | `TourController.delete` | `TourService.delete` | Deletes a tour and its logs. |
| `POST` | `/api/tours/{tourId}/logs` | `TourController.addLog` | `TourService.addLog` | Adds an accomplished-tour log to a tour. |
| `PUT` | `/api/tours/{tourId}/logs/{logId}` | `TourController.updateLog` | `TourService.updateLog` | Updates a tour log. |
| `DELETE` | `/api/tours/{tourId}/logs/{logId}` | `TourController.deleteLog` | `TourService.deleteLog` | Deletes a tour log. |
| `GET` | `/api/tours/export?username={username}` | `TourController.exportTours` | `TourService.exportUrl` | Exports the user's tours as JSON. |
| `POST` | `/api/tours/import` | `TourController.importTours` | `TourService.importTours` | Imports a JSON list of tours for the active user. |
| `GET` | `/api/weather/current?lat={lat}&lon={lon}` | `WeatherController.current` | `TourService.loadWeather` fallback | Loads current weather for one coordinate. |
| `POST` | `/api/weather/tour-summary` | `WeatherController.tourSummary` | `TourService.loadWeather` | Loads weather summary for a whole tour. |

## Internal Links

The Angular MVVM chain is:

`Component/View` -> `TourViewModelService` -> `TourService` -> REST endpoint -> Spring `Controller` -> `Service` -> `Repository`.

Key files:

- `src/app/features/tours/view-model/tour-view-model.service.ts`
- `src/app/features/tours/data-access/tour.service.ts`
- `src/app/features/auth/services/auth.service.ts`
- `backend/src/main/java/at/fhtw/tourplanner/controller`
- `backend/src/main/java/at/fhtw/tourplanner/service`
- `backend/src/main/java/at/fhtw/tourplanner/repo`
