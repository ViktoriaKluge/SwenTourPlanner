# Unit Tests

The backend has JUnit 5 tests in `backend/src/test/java/at/fhtw/tourplanner/**`, consisting of nine test classes. All of them run against plain Java objects or Mockito mocks.

Run them with:

```powershell
mvn -f backend/pom.xml test
```

## Overview

| Test class | Package | Tests | Covers |
| --- | --- | --- | --- |
| `TourStatsAndSearchTest` | `service` | 22 | computed attributes (popularity, child-friendliness) + full-text search |
| `AuthServiceTest` | `service` | 5 | registration and login rules |
| `TourServiceIsolationTest` | `service` | 5 | one user can't access another user's data |
| `TourControllerImportTest` | `controller` | 3 | import can't overwrite another account's tour |
| `TourServiceRouteRefreshTest` | `service` | 6 | when an update needs to re-run routing vs. skip it |
| `TourMapperTest` | `service` | 6 | entity/DTO mapping handles missing data and geometry correctly |
| `OpenRouteServiceClientTest` | `service` | 4 | routing request assembly + running-speed correction |
| `JwtUtilTest` | `security` | 4 | issued tokens validate, tampered/foreign tokens are rejected |
| `WeatherServiceTest` | `service` | 8 | unique feature: fallback behavior + clothing-advice rules |
| **Total** | | **63** | |

## TourStatsAndSearchTest — computed attributes and search

Popularity and child-friendliness are calculated (not stored), the search has to be able to find tours by these values, title and description.

| Test | Critical behavior |
| --- | --- |
| `popularityIsZeroWithoutLogs` | A tour without logs has popularity `0`. |
| `popularityCountsLogs` | Popularity is derived from the number of assigned logs. |
| `childFriendlinessUnknownWithoutLogs` | Child-friendliness is `UNKNOWN` when no log data exists. |
| `childFriendlinessFriendlyForEasyShortTour` | Easy, short tours are classified as child-friendly. |
| `childFriendlinessModerateForMediumTour` | Medium effort tours are classified as moderate. |
| `childFriendlinessDemandingForHardTour` | Hard, long tours are classified as demanding. |
| `childFriendlinessUsesAverages` | Multiple logs are evaluated by average difficulty, distance, and time. |
| `searchMatchesTitle` | Full-text search checks the tour title. |
| `searchMatchesDescription` | Full-text search checks the tour description. |
| `searchMatchesTransportType` | Full-text search checks the transport type. |
| `searchMatchesLogComment` | Full-text search checks tour-log comments. |
| `searchMatchesPopularity` | Full-text search includes computed popularity. |
| `searchMatchesComputedFriendlyValue` | Search includes the friendly child-friendliness label. |
| `searchMatchesComputedModerateValue` | Search includes the moderate child-friendliness label. |
| `searchMatchesComputedDemandingValue` | Search includes the demanding child-friendliness label. |
| `searchIgnoresCase` | Search is case-insensitive. |
| `searchAcceptsEmptyQuery` | Empty search returns a match. |
| `searchAcceptsNullQuery` | Null search returns a match. |
| `searchRejectsUnknownText` | Unknown text does not match. |
| `searchMatchesRatingValue` | Search includes log rating values. |
| `searchMatchesTotalDistanceValue` | Search includes log total-distance values. |
| `searchMatchesTotalTimeValue` | Search includes log total-time values. |

## AuthServiceTest — registration and login

Registration and login are crusial for basic user handling and very important for the core use cases.

| Test | Critical behavior |
| --- | --- |
| `register_duplicateUsername_throwsBadRequest` | Registering an existing username is rejected. |
| `register_newUsername_hashesPasswordAndSaves` | The stored password is BCrypt-hashed, never the plain value. |
| `login_wrongPassword_throwsInvalidCredentials` | A wrong password is rejected. |
| `login_correctPassword_returnsUser` | A correct password logs the user in. |
| `find_unknownUser_throwsNotFound` | Looking up a non-existent user fails clearly. |

## TourServiceIsolationTest — cross-account isolation

Every tour and log belongs to exactly one account and can not be accessed by anyone else.

| Test | Critical behavior |
| --- | --- |
| `get_tourBelongsToOtherUser_throwsNotFound` | Reading another user's tour fails. |
| `update_tourBelongsToOtherUser_throwsNotFound` | Updating another user's tour fails and never calls `save()`. |
| `delete_tourBelongsToOtherUser_throwsNotFound` | Deleting another user's tour fails and never calls `delete()`. |
| `updateLog_logBelongsToOtherUser_throwsNotFound` | Updating another user's log fails and never calls `save()`. |
| `deleteLog_logBelongsToOtherUser_throwsNotFound` | Deleting another user's log fails and never calls `delete()`. |

## TourControllerImportTest — import safety

An imported file can carry tour ids from wherever it came from. We want to make sure an import can never overwrite someone else's tour by id, and that there's a limit on how much you can import at once.

| Test | Critical behavior |
| --- | --- |
| `importTours_withPreExistingId_clearsIdBeforeCreate` | An imported tour's `id` is cleared before creation, so it can never collide with an existing tour. |
| `importTours_moreThan100Tours_throwsBadRequestAndSkipsCreate` | More than 100 tours in one import is rejected before anything is created. |
| `importTours_exactly100Tours_isAllowed` | Exactly 100 tours is still allowed. |

## TourServiceRouteRefreshTest — when routing gets re-triggered

Recomputing the route on every save would be wasteful, but skipping it when something route-relevant actually changed would leave the distance and duration stale. Here we pin down exactly which changes should trigger a new route calculation and which shouldn't.

| Test | Critical behavior |
| --- | --- |
| `update_noRelevantChanges_doesNotCallRouteClient` | An update with no routing-relevant changes skips the routing call. |
| `update_transportTypeChanged_refreshesRoute` | Changing transport type triggers a re-route. |
| `update_accessibleFlagChanged_refreshesRoute` | Toggling accessibility triggers a re-route. |
| `update_startPointMoved_refreshesRoute` | Moving the start point triggers a re-route. |
| `update_poiAdded_refreshesRoute` | Adding a waypoint triggers a re-route. |
| `update_poiMovedSameCount_refreshesRoute` | Moving a waypoint (same count) still triggers a re-route. |

## TourMapperTest — entity/DTO mapping

Mapping between database entities and API DTOs can handle missing fields without crashing, the route geometry needs to come back out exactly as it went in after being stored as JSON text.

| Test | Critical behavior |
| --- | --- |
| `toDto_nullStartAndEndPoint_returnsEmptyLocationDtoInsteadOfNpe` | A tour with no start/end point maps without crashing. |
| `toDto_nullRoute_returnsEmptyRouteDtoInsteadOfNpe` | A tour with no route maps without crashing. |
| `apply_nullStartAndEndPointInDto_producesDefaultLocationInsteadOfNpe` | An incoming DTO with no start/end point maps without crashing. |
| `apply_nullRouteInDto_producesDefaultRouteInsteadOfNpe` | An incoming DTO with no route maps without crashing. |
| `geometryRoundTrip_survivesSerializationAsListOfLists` | Route geometry survives being written to and read back from JSON. |
| `apply_emptyPoiList_survivesRoundTrip` | A waypoint survives being written to and read back from the entity. |

## OpenRouteServiceClientTest — routing request logic

Assembling the coordinate list and correcting the running duration are tested here.

| Test | Critical behavior |
| --- | --- |
| `enrich_noApiKeyConfigured_returnsRouteUnchanged` | With no routing API key configured, the submitted route is kept as-is. |
| `buildCoordinates_ordersStartWaypointsEndAsLonLat` | Coordinates are sent in start → waypoints → end order, as `[lon, lat]`. |
| `buildCoordinates_noWaypoints_onlyStartAndEnd` | With no waypoints, only start and end are sent. |
| `runningDurationMin_usesEightKmhAverageSpeed` | Running duration is calculated from distance at 8 km/h instead of the routing provider's own (walking-paced) estimate. |

## JwtUtilTest — token issuing and validation

The actual authentication mechanism is tested separate from the login.

| Test | Critical behavior |
| --- | --- |
| `issueThenValidate_returnsSameUsername` | A token issued for a user validates back to that same username. |
| `validate_tokenSignedWithWrongSecret_throwsVerificationException` | A token signed with a different secret is rejected. |
| `validate_malformedToken_throwsVerificationException` | A garbage string is rejected. |
| `validate_tamperedPayload_throwsVerificationException` | A token with an altered payload is rejected. |

## WeatherServiceTest — unique feature

The weather feature is our unique feature. Its fallback behavior and its advice logic are tested here.

| Test | Critical behavior |
| --- | --- |
| `currentWeather_noApiKeyConfigured_returnsUnconfiguredDto` | With no weather API key, a clear "not configured" response is returned instead of failing. |
| `tourWeather_noApiKeyConfigured_returnsUnconfiguredDto` | Same, for the tour-wide weather summary. |
| `tourWeather_noCoordinatesAvailable_returnsFailedDtoWithoutNetworkCall` | A tour with no usable coordinates fails gracefully before any network call. |
| `clothingAdvice_veryCold_recommendsWarmClothing` | Low feels-like temperature gives the "dress warm" advice. |
| `clothingAdvice_mild_recommendsLightJacket` | Mid-range feels-like temperature gives the "light jacket" advice. |
| `clothingAdvice_hot_recommendsLightClothing` | High feels-like temperature gives the "dress light" advice. |
| `clothingAdvice_rainInDescription_addsRainWarning` | A rain-related weather description adds a rain-gear note. |
| `clothingAdvice_strongWind_addsWindWarning` | Wind at or above 30 km/h adds a windproof-layer note. |

## Why These Tests Matter

We have 63 tests that look at every layer of the backend. We concentrate at the most important and critical security issues and basic logic where the most errors could happen and where it would be most cruical.
