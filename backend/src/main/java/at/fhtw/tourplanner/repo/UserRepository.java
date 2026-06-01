package at.fhtw.tourplanner.repo;

import at.fhtw.tourplanner.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
  Optional<UserEntity> findByUsername(String username);
  boolean existsByUsername(String username);
}
