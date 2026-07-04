package at.fhtw.tourplanner.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class JwtUtil {
  private static final String SECRET = "tour-planner-secret-key-swen-2026";

  public String issue(String username) {
    return JWT.create()
        .withSubject(username)
        .withExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS))
        .sign(Algorithm.HMAC256(SECRET));
  }

  public String validate(String token) throws JWTVerificationException {
    return JWT.require(Algorithm.HMAC256(SECRET))
        .build()
        .verify(token)
        .getSubject();
  }
}
