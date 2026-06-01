package at.fhtw.tourplanner.controller;

import at.fhtw.tourplanner.service.AuthService;
import at.fhtw.tourplanner.dto.AuthRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, String>> register(@Valid @RequestBody AuthRequest request) {
    auth.register(request.username, request.password);
    return ResponseEntity.ok(Collections.singletonMap("username", request.username));
  }

  @PostMapping("/login")
  public ResponseEntity<Map<String, String>> login(@Valid @RequestBody AuthRequest request) {
    auth.login(request.username, request.password);
    return ResponseEntity.ok(Collections.singletonMap("username", request.username));
  }
}
