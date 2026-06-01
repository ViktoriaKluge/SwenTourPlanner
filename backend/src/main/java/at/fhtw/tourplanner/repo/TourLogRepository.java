package at.fhtw.tourplanner.repo;

import at.fhtw.tourplanner.model.TourLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TourLogRepository extends JpaRepository<TourLogEntity, String> {
  Optional<TourLogEntity> findByIdAndTourIdAndTourUserUsername(String id, String tourId, String username);
}
