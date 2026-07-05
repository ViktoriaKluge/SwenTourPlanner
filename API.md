# API Endpoints

Backend base path: `/api`

All endpoints except `/api/auth/**` require a JWT in the `Authorization: Bearer <token>` header, issued by `/api/auth/login`/`/api/auth/register`. The backend reads the username from that token instead of trusting the client. `auth.interceptor.ts` attaches the token on every request, so the frontend doesn't do this manually. The Angular proxy in `proxy.conf.json` forwards `/api` calls to the Spring Boot backend.

| Method | Endpoint | Controller | Frontend link | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `AuthController.register` | `AuthService.register` | Creates a user account, returns a JWT and the username. |
| `POST` | `/api/auth/login` | `AuthController.login` | `AuthService.login` | Validates credentials, returns a JWT and the username. |
| `GET` | `/api/tours` | `TourController.list` | `TourService.load` | Lists all tours for the authenticated user. |
| `GET` | `/api/tours/search?q={query}` | `TourController.search` | `TourService.load` | Runs full-text search over tour data, logs, and computed attributes. |
| `POST` | `/api/tours` | `TourController.create` | `TourService.add` | Creates a tour and enriches route information where possible. |
| `PUT` | `/api/tours/{id}` | `TourController.update` | `TourService.update` | Updates an existing tour for the active user. |
| `DELETE` | `/api/tours/{id}` | `TourController.delete` | `TourService.delete` | Deletes a tour and its logs. |
| `POST` | `/api/tours/{tourId}/logs` | `TourController.addLog` | `TourService.addLog` | Adds an accomplished-tour log to a tour. |
| `PUT` | `/api/tours/{tourId}/logs/{logId}` | `TourController.updateLog` | `TourService.updateLog` | Updates a tour log. |
| `DELETE` | `/api/tours/{tourId}/logs/{logId}` | `TourController.deleteLog` | `TourService.deleteLog` | Deletes a tour log. |
| `GET` | `/api/tours/export` | `TourController.exportTours` | `TourService.exportAll` | Exports all of the user's tours as JSON. |
| `GET` | `/api/tours/{id}/export` | `TourController.exportTour` | `TourService.exportTour` | Exports a single tour as JSON. |
| `POST` | `/api/tours/import` | `TourController.importTours` | `TourService.importTours` | Imports a JSON list of tours for the active user (max. 100 per request). |
| `GET` | `/api/weather/current?lat={lat}&lon={lon}` | `WeatherController.current` | `TourService.loadWeather` fallback | Loads current weather for one coordinate. |
| `POST` | `/api/weather/tour-summary` | `WeatherController.tourSummary` | `TourService.loadWeather` | Loads weather summary for a whole tour. |

## Internal Links

The Angular MVVM chain is:

`Component/View` -> `TourViewModelService` -> `TourService` -> REST endpoint -> Spring `Controller` -> `Service` -> `Repository`.

Key files:

- `src/app/features/tours/view-model/tour-view-model.service.ts`
- `src/app/features/tours/data-access/tour.service.ts`
- `src/app/features/auth/services/auth.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `backend/src/main/java/at/fhtw/tourplanner/controller`
- `backend/src/main/java/at/fhtw/tourplanner/service`
- `backend/src/main/java/at/fhtw/tourplanner/security`
- `backend/src/main/java/at/fhtw/tourplanner/repo`
