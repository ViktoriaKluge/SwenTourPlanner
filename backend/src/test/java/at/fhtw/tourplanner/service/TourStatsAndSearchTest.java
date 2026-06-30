package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.*;
import at.fhtw.tourplanner.util.ChildFriendliness;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class TourStatsAndSearchTest {
  private final TourStatsService stats = new TourStatsService();
  private final FullTextSearchService search = new FullTextSearchService(stats);

  @Test void popularityIsZeroWithoutLogs() {
    assertEquals(0, stats.popularity(tour("Lake", "Blue water")));
  }

  @Test void popularityCountsLogs() {
    TourEntity tour = tour("Lake", "Blue water");
    tour.getLogs().add(log(1, 5, 3, "nice"));
    tour.getLogs().add(log(2, 10, 4, "ok"));
    assertEquals(2, stats.popularity(tour));
  }

  @Test void childFriendlinessUnknownWithoutLogs() {
    assertEquals(ChildFriendliness.UNKNOWN, stats.childFriendliness(tour("Empty", "")));
  }

  @Test void childFriendlinessFriendlyForEasyShortTour() {
    TourEntity tour = tour("Short", "");
    tour.getLogs().add(log(1, 4, 60, "easy"));
    assertEquals(ChildFriendliness.FRIENDLY, stats.childFriendliness(tour));
  }

  @Test void childFriendlinessModerateForMediumTour() {
    TourEntity tour = tour("Medium", "");
    tour.getLogs().add(log(3, 12, 220, "medium"));
    assertEquals(ChildFriendliness.MODERATE, stats.childFriendliness(tour));
  }

  @Test void childFriendlinessDemandingForHardTour() {
    TourEntity tour = tour("Hard", "");
    tour.getLogs().add(log(5, 20, 420, "hard"));
    assertEquals(ChildFriendliness.DEMANDING, stats.childFriendliness(tour));
  }

  @Test void childFriendlinessUsesAverages() {
    TourEntity tour = tour("Average", "");
    tour.getLogs().add(log(1, 4, 60, "easy"));
    tour.getLogs().add(log(5, 30, 600, "hard"));
    assertEquals(ChildFriendliness.DEMANDING, stats.childFriendliness(tour));
  }

  @Test void searchMatchesTitle() {
    assertTrue(search.matches(tour("Vienna Loop", ""), "vienna"));
  }

  @Test void searchMatchesDescription() {
    assertTrue(search.matches(tour("Tour", "Danube island"), "danube"));
  }

  @Test void searchMatchesTransportType() {
    assertTrue(search.matches(tour("Tour", ""), "walking"));
  }

  @Test void searchMatchesLogComment() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(2, 5, 70, "sunny finish"));
    assertTrue(search.matches(tour, "sunny"));
  }

  @Test void searchMatchesPopularity() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(2, 5, 70, "a"));
    assertTrue(search.matches(tour, "1"));
  }

  @Test void searchMatchesComputedFriendlyValue() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(1, 4, 70, "a"));
    assertTrue(search.matches(tour, "child-friendly"));
  }

  @Test void searchMatchesComputedModerateValue() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(3, 12, 220, "a"));
    assertTrue(search.matches(tour, "moderate"));
  }

  @Test void searchMatchesComputedDemandingValue() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(5, 22, 500, "a"));
    assertTrue(search.matches(tour, "demanding"));
  }

  @Test void searchIgnoresCase() {
    assertTrue(search.matches(tour("Kahlenberg", ""), "KAHLEN"));
  }

  @Test void searchAcceptsEmptyQuery() {
    assertTrue(search.matches(tour("Any", ""), ""));
  }

  @Test void searchAcceptsNullQuery() {
    assertTrue(search.matches(tour("Any", ""), null));
  }

  @Test void searchRejectsUnknownText() {
    assertFalse(search.matches(tour("Known", "Text"), "missing"));
  }

  @Test void searchMatchesRatingValue() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(2, 5, 70, "a", 4));
    assertTrue(search.matches(tour, "4"));
  }

  @Test void searchMatchesTotalDistanceValue() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(2, 13.5, 70, "a"));
    assertTrue(search.matches(tour, "13.5"));
  }

  @Test void searchMatchesTotalTimeValue() {
    TourEntity tour = tour("Tour", "");
    tour.getLogs().add(log(2, 5, 95, "a"));
    assertTrue(search.matches(tour, "95"));
  }

  private TourEntity tour(String title, String description) {
    UserEntity user = new UserEntity();
    user.setUsername("alice");
    TourEntity tour = new TourEntity();
    tour.setId("t1");
    tour.setUser(user);
    tour.setTitle(title);
    tour.setDescription(description);
    tour.setTransportType(TransportType.walking);
    RouteEmbeddable route = new RouteEmbeddable();
    route.setDistance(10);
    route.setDurationMin(120);
    tour.setRoute(route);
    tour.setLogs(new ArrayList<>());
    return tour;
  }

  private TourLogEntity log(int difficulty, double distance, int time, String comment) {
    return log(difficulty, distance, time, comment, 5);
  }

  private TourLogEntity log(int difficulty, double distance, int time, String comment, int rating) {
    TourLogEntity log = new TourLogEntity();
    log.setId(comment + difficulty);
    log.setDifficulty(difficulty);
    log.setTotalDistance(distance);
    log.setTotalTime(time);
    log.setComment(comment);
    log.setRating(rating);
    return log;
  }
}
