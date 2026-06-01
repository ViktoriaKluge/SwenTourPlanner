package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.TourEntity;
import at.fhtw.tourplanner.model.TourLogEntity;
import at.fhtw.tourplanner.util.ChildFriendliness;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TourStatsService {
  public int popularity(TourEntity tour) {
    return tour.getLogs() == null ? 0 : tour.getLogs().size();
  }

  public ChildFriendliness childFriendliness(TourEntity tour) {
    List<TourLogEntity> logs = tour.getLogs();
    if (logs == null || logs.isEmpty()) return ChildFriendliness.UNKNOWN;
    double avgDifficulty = logs.stream().mapToInt(TourLogEntity::getDifficulty).average().orElse(5);
    double avgDistance = logs.stream().mapToDouble(TourLogEntity::getTotalDistance).average().orElse(tour.getRoute().getDistance());
    double avgTime = logs.stream().mapToInt(TourLogEntity::getTotalTime).average().orElse(tour.getRoute().getDurationMin());

    if (avgDifficulty <= 2.0 && avgDistance <= 8.0 && avgTime <= 180.0) return ChildFriendliness.FRIENDLY;
    if (avgDifficulty <= 3.5 && avgDistance <= 16.0 && avgTime <= 300.0) return ChildFriendliness.MODERATE;
    return ChildFriendliness.DEMANDING;
  }
}
