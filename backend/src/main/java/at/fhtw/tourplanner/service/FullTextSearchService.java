package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.TourEntity;
import at.fhtw.tourplanner.model.TourLogEntity;
import at.fhtw.tourplanner.model.TransportType;
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
        .append(tour.isAccessible() ? "barrierefrei wheelchair accessible" : "").append(' ')
        .append(tour.getTransportType()).append(' ')
        .append(transportTypeDE(tour.getTransportType())).append(' ')
        .append(tour.getStartPoint() != null ? tour.getStartPoint().getName() : "").append(' ')
        .append(tour.getEndPoint() != null ? tour.getEndPoint().getName() : "").append(' ')
        .append(tour.getPoi().stream().map(p -> p.getName()).collect(java.util.stream.Collectors.joining(" "))).append(' ')
        .append(tour.getRoute() != null ? tour.getRoute().getDistance() : "").append(' ')
        .append(tour.getRoute() != null ? tour.getRoute().getDurationMin() : "").append(' ')
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

  private String transportTypeDE(TransportType type) {
    if (type == null) return "";
    if (type == TransportType.walking) return "wandern";
    if (type == TransportType.running) return "laufen";
    if (type == TransportType.cycling) return "radfahren";
    return "";
  }
}
