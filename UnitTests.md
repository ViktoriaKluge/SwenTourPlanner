# Unit Tests

The backend contains JUnit 5 tests in `backend/src/test/java/at/fhtw/tourplanner/service/TourStatsAndSearchTest.java`.

These tests focus on business logic that is critical for the semester requirements: automatically computed tour attributes and full-text search, including computed values. This logic is tested without a web server or database so failures are easy to diagnose.

## Test Catalogue

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
| `searchMatchesCategory` | Full-text search checks the category. |
| `searchMatchesTransportType` | Full-text search checks the transport type. |
| `searchMatchesLogComment` | Full-text search checks tour-log comments. |
| `searchMatchesPopularity` | Full-text search includes computed popularity. |
| `searchMatchesComputedFriendlyValue` | Search includes friendly child-friendliness. |
| `searchMatchesComputedModerateValue` | Search includes moderate child-friendliness. |
| `searchMatchesComputedDemandingValue` | Search includes demanding child-friendliness. |
| `searchIgnoresCase` | Search is case-insensitive. |
| `searchAcceptsEmptyQuery` | Empty search returns a match. |
| `searchAcceptsNullQuery` | Null search returns a match. |
| `searchRejectsUnknownText` | Unknown text does not match. |
| `searchMatchesRatingValue` | Search includes log rating values. |
| `searchMatchesTotalDistanceValue` | Search includes log total-distance values. |
| `searchMatchesTotalTimeValue` | Search includes log total-time values. |

## Why These Tests Matter

The PDF requires at least 20 unit tests with JUnit/NUnit, full-text search across tour and tour-log data, automatically computed popularity and child-friendliness, and search over computed values. The current suite covers 23 JUnit tests and directly targets these business rules.

Run them with:

```powershell
mvn -f backend/pom.xml test
```
