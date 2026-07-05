package at.fhtw.tourplanner.controller;

import at.fhtw.tourplanner.security.JwtUtil;
import at.fhtw.tourplanner.service.AuthService;
import at.fhtw.tourplanner.dto.AuthRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {
  private final AuthService auth;
  private final JwtUtil jwtUtil;

  public AuthController(AuthService auth, JwtUtil jwtUtil) {
    this.auth = auth;
    this.jwtUtil = jwtUtil;
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, String>> register(@Valid @RequestBody AuthRequest request) {
    auth.register(request.username, request.password);
    return ResponseEntity.ok(tokenResponse(request.username));
  }

  @PostMapping("/login")
  public ResponseEntity<Map<String, String>> login(@Valid @RequestBody AuthRequest request) {
    auth.login(request.username, request.password);
    return ResponseEntity.ok(tokenResponse(request.username));
  }

  private Map<String, String> tokenResponse(String username) {
    Map<String, String> body = new LinkedHashMap<>();
    body.put("token", jwtUtil.issue(username));
    body.put("username", username);
    return body;
  }
}
