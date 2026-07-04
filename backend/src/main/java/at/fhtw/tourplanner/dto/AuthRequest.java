package at.fhtw.tourplanner.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AuthRequest {
  @NotBlank(message = "Benutzername darf nicht leer sein")
  @Size(min = 2, message = "Benutzername muss mindestens 2 Zeichen lang sein")
  public String username;
  @NotBlank(message = "Passwort darf nicht leer sein")
  @Size(min = 8, max = 72, message = "Passwort muss zwischen 8 und 72 Zeichen lang sein")
  public String password;
}
