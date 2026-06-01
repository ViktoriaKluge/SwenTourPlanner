package at.fhtw.tourplanner.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
public class TourLogDto {
  public String id;
  public String date;
  @NotBlank
  public String comment;
  @Min(1) @Max(5)
  public int difficulty;
  public double totalDistance;
  public int totalTime;
  @Min(1) @Max(5)
  public int rating;
}
