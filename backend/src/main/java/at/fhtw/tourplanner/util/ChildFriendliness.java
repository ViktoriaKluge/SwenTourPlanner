package at.fhtw.tourplanner.util;

public enum ChildFriendliness {
  FRIENDLY("child-friendly"),
  MODERATE("moderate"),
  DEMANDING("demanding"),
  UNKNOWN("unknown");

  private final String label;

  ChildFriendliness(String label) {
    this.label = label;
  }

  public String getLabel() {
    return label;
  }
}
