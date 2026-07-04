package at.fhtw.tourplanner.model;

import javax.persistence.Column;
import javax.persistence.Embeddable;

@Embeddable
public class RouteEmbeddable {
  private double distance;
  private int durationMin;
  @Column(columnDefinition = "TEXT")
  private String geometryJson;

  public double getDistance() { return distance; }
  public void setDistance(double distance) { this.distance = distance; }
  public int getDurationMin() { return durationMin; }
  public void setDurationMin(int durationMin) { this.durationMin = durationMin; }
  public String getGeometryJson() { return geometryJson; }
  public void setGeometryJson(String geometryJson) { this.geometryJson = geometryJson; }
}
