package at.fhtw.tourplanner.dto;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

public class TourLogDto {
  public String id;
  public String date;
  @NotBlank(message = "Kommentar darf nicht leer sein")
  public String comment;
  @Min(value = 1, message = "Schwierigkeit muss zwischen 1 und 5 liegen")
  @Max(value = 5, message = "Schwierigkeit muss zwischen 1 und 5 liegen")
  public int difficulty;
  @DecimalMin(value = "0.1", message = "Distanz muss mindestens 0,1 km betragen")
  @DecimalMax(value = "500.0", message = "Distanz darf maximal 500 km betragen")
  public double totalDistance;
  @Min(value = 1, message = "Zeit muss mindestens 1 Minute betragen")
  @Max(value = 1440, message = "Zeit darf maximal 1440 Minuten (24 h) betragen")
  public int totalTime;
  @Min(value = 1, message = "Bewertung muss zwischen 1 und 5 liegen")
  @Max(value = 5, message = "Bewertung muss zwischen 1 und 5 liegen")
  public int rating;
}
