package at.fhtw.tourplanner.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

public class LocationDto {
  @NotBlank
  public String name;
  @Min(-90) @Max(90)
  public double latitude;
  @Min(-180) @Max(180)
  public double longitude;
}
