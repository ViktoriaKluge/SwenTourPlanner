package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.TourEntity;
import at.fhtw.tourplanner.model.TourLogEntity;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class FullTextSearchService {
  private final TourStatsService stats;

  public FullTextSearchService(TourStatsService stats) {
    this.stats = stats;
  }

  public boolean matches(TourEntity tour, String query) {
    if (query == null || query.trim().isEmpty()) return true;
    String q = query.toLowerCase(Locale.ROOT);
    StringBuilder haystack = new StringBuilder()
        .append(tour.getTitle()).append(' ')
        .append(tour.getDescription()).append(' ')
        .append(tour.getCategory()).append(' ')
        .append(tour.isAccessible() ? "barrierefrei wheelchair accessible" : "").append(' ')
        .append(tour.getTransportType()).append(' ')
        .append(stats.popularity(tour)).append(' ')
        .append(stats.childFriendliness(tour).getLabel());
    for (TourLogEntity log : tour.getLogs()) {
      haystack.append(' ').append(log.getComment())
          .append(' ').append(log.getDifficulty())
          .append(' ').append(log.getRating())
          .append(' ').append(log.getTotalDistance())
          .append(' ').append(log.getTotalTime());
    }
    return haystack.toString().toLowerCase(Locale.ROOT).contains(q);
  }
}
