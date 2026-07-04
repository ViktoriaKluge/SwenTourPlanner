package at.fhtw.tourplanner.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

public class LocationDto {
  @NotBlank(message = "Ortsname darf nicht leer sein")
  public String name;
  @Min(value = -90, message = "Breitengrad muss zwischen -90 und 90 liegen")
  @Max(value = 90,  message = "Breitengrad muss zwischen -90 und 90 liegen")
  public double latitude;
  @Min(value = -180, message = "Laengengrad muss zwischen -180 und 180 liegen")
  @Max(value = 180,  message = "Laengengrad muss zwischen -180 und 180 liegen")
  public double longitude;
}
