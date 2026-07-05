package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.UserEntity;
import at.fhtw.tourplanner.repo.UserRepository;
import at.fhtw.tourplanner.util.BadRequestException;
import at.fhtw.tourplanner.util.InvalidCredentialsException;
import at.fhtw.tourplanner.util.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private static final Logger log = LoggerFactory.getLogger(AuthService.class);
  private final UserRepository users;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository users) {
    this.users = users;
  }

  public UserEntity register(String username, String password) {
    if (users.existsByUsername(username)) {
      log.warn("Registration failed, username {} already exists", username);
      throw new BadRequestException("Username bereits vergeben");
    }
    UserEntity user = new UserEntity();
    user.setUsername(username);
    user.setPasswordHash(encoder.encode(password));
    log.info("Registering user {}", username);
    return users.save(user);
  }

  public UserEntity login(String username, String password) {
    UserEntity user = find(username);
    if (!encoder.matches(password, user.getPasswordHash())) {
      log.warn("Failed login attempt for user {} (wrong password)", username);
      throw new InvalidCredentialsException("Ungueltige Anmeldedaten");
    }
    log.info("User {} logged in", username);
    return user;
  }

  public UserEntity find(String username) {
    return users.findByUsername(username).orElseThrow(() -> {
      log.warn("User {} not found", username);
      return new NotFoundException("Benutzer nicht gefunden");
    });
  }
}
