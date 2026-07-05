package at.fhtw.tourplanner.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilTest {

  private final JwtUtil jwtUtil = new JwtUtil();

  @Test void issueThenValidate_returnsSameUsername() {
    String token = jwtUtil.issue("alice");

    assertEquals("alice", jwtUtil.validate(token));
  }

  @Test void validate_tokenSignedWithWrongSecret_throwsVerificationException() {
    String foreignToken = JWT.create().withSubject("alice").sign(Algorithm.HMAC256("some-other-secret"));

    assertThrows(JWTVerificationException.class, () -> jwtUtil.validate(foreignToken));
  }

  @Test void validate_malformedToken_throwsVerificationException() {
    assertThrows(JWTVerificationException.class, () -> jwtUtil.validate("not-a-valid-token"));
  }

  @Test void validate_tamperedPayload_throwsVerificationException() {
    String token = jwtUtil.issue("alice");
    String[] parts = token.split("\\.");
    String tampered = parts[0] + "." + parts[1] + "x" + "." + parts[2];

    assertThrows(JWTVerificationException.class, () -> jwtUtil.validate(tampered));
  }
}
