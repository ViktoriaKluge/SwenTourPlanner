package at.fhtw.tourplanner.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class AuthRequest {
  @NotBlank @Size(min = 2)
  public String username;
  @NotBlank
  public String password;
}
