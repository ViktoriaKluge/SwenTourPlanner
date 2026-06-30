package at.fhtw.tourplanner.util;

public enum ChildFriendliness {
  FRIENDLY("kinderfreundlich"),
  MODERATE("moderat"),
  DEMANDING("anspruchsvoll"),
  UNKNOWN("unbekannt");

  private final String label;

  ChildFriendliness(String label) {
    this.label = label;
  }

  public String getLabel() {
    return label;
  }
}
