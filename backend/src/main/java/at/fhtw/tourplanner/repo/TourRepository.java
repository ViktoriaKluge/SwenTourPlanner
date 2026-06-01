package at.fhtw.tourplanner.repo;

import at.fhtw.tourplanner.model.TourEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TourRepository extends JpaRepository<TourEntity, String> {
  List<TourEntity> findByUserUsernameOrderByTitleAsc(String username);

  Optional<TourEntity> findByIdAndUserUsername(String id, String username);
}
