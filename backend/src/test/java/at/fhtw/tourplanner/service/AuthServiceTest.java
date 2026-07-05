package at.fhtw.tourplanner.service;

import at.fhtw.tourplanner.model.UserEntity;
import at.fhtw.tourplanner.repo.UserRepository;
import at.fhtw.tourplanner.util.BadRequestException;
import at.fhtw.tourplanner.util.InvalidCredentialsException;
import at.fhtw.tourplanner.util.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock
  private UserRepository users;

  private AuthService freshAuth() {
    return new AuthService(users);
  }

  @Test void register_duplicateUsername_throwsBadRequest() {
    when(users.existsByUsername("alice")).thenReturn(true);

    assertThrows(BadRequestException.class, () -> freshAuth().register("alice", "secret123"));
    verify(users, never()).save(any());
  }

  @Test void register_newUsername_hashesPasswordAndSaves() {
    when(users.existsByUsername("bob")).thenReturn(false);
    when(users.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    UserEntity saved = freshAuth().register("bob", "secret123");

    assertEquals("bob", saved.getUsername());
    assertNotEquals("secret123", saved.getPasswordHash());
    assertTrue(new BCryptPasswordEncoder().matches("secret123", saved.getPasswordHash()));
  }

  @Test void login_wrongPassword_throwsInvalidCredentials() {
    UserEntity user = new UserEntity();
    user.setUsername("alice");
    user.setPasswordHash(new BCryptPasswordEncoder().encode("correct-password"));
    when(users.findByUsername("alice")).thenReturn(Optional.of(user));

    assertThrows(InvalidCredentialsException.class, () -> freshAuth().login("alice", "wrong-password"));
  }

  @Test void login_correctPassword_returnsUser() {
    UserEntity user = new UserEntity();
    user.setUsername("alice");
    user.setPasswordHash(new BCryptPasswordEncoder().encode("correct-password"));
    when(users.findByUsername("alice")).thenReturn(Optional.of(user));

    UserEntity result = freshAuth().login("alice", "correct-password");

    assertSame(user, result);
  }

  @Test void find_unknownUser_throwsNotFound() {
    when(users.findByUsername("ghost")).thenReturn(Optional.empty());

    assertThrows(NotFoundException.class, () -> freshAuth().find("ghost"));
  }
}
