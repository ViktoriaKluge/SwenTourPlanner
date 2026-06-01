package at.fhtw.tourplanner.model;

import javax.persistence.Embeddable;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

@Embeddable
public class LocationEmbeddable {
  @NotBlank
  private String name;
  @Min(-90) @Max(90)
  private double latitude;
  @Min(-180) @Max(180)
  private double longitude;

  public LocationEmbeddable() {}

  public LocationEmbeddable(String name, double latitude, double longitude) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public double getLatitude() { return latitude; }
  public void setLatitude(double latitude) { this.latitude = latitude; }
  public double getLongitude() { return longitude; }
  public void setLongitude(double longitude) { this.longitude = longitude; }
}
