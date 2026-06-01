package at.fhtw.tourplanner.model;

import javax.persistence.*;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "tour_logs")
public class TourLogEntity {
  @Id
  private String id;
  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  private TourEntity tour;
  private LocalDateTime date;
  @NotBlank
  @Column(length = 2000)
  private String comment;
  @Min(1) @Max(5)
  private int difficulty;
  private double totalDistance;
  private int totalTime;
  @Min(1) @Max(5)
  private int rating;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public TourEntity getTour() { return tour; }
  public void setTour(TourEntity tour) { this.tour = tour; }
  public LocalDateTime getDate() { return date; }
  public void setDate(LocalDateTime date) { this.date = date; }
  public String getComment() { return comment; }
  public void setComment(String comment) { this.comment = comment; }
  public int getDifficulty() { return difficulty; }
  public void setDifficulty(int difficulty) { this.difficulty = difficulty; }
  public double getTotalDistance() { return totalDistance; }
  public void setTotalDistance(double totalDistance) { this.totalDistance = totalDistance; }
  public int getTotalTime() { return totalTime; }
  public void setTotalTime(int totalTime) { this.totalTime = totalTime; }
  public int getRating() { return rating; }
  public void setRating(int rating) { this.rating = rating; }
}
