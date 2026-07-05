package at.fhtw.tourplanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

@SpringBootApplication
public class TourPlannerApplication {
  public static void main(String[] args) {
    loadDotEnv();
    SpringApplication.run(TourPlannerApplication.class, args);
  }

  private static void loadDotEnv() {
    for (String path : new String[]{".env", "backend/.env"}) {
      File f = new File(path);
      if (!f.exists()) continue;
      try (BufferedReader r = new BufferedReader(new FileReader(f))) {
        String line;
        while ((line = r.readLine()) != null) {
          line = line.trim();
          if (line.isEmpty() || line.startsWith("#")) continue;
          int idx = line.indexOf('=');
          if (idx < 1) continue;
          String key = line.substring(0, idx).trim();
          String value = line.substring(idx + 1).trim();
          if (System.getenv(key) == null && System.getProperty(key) == null) {
            System.setProperty(key, value);
          }
        }
      } catch (Exception ignored) {}
      break;
    }
  }
}
