export type Category = 'all' |'hike' | 'run' | 'bike';
export type Section = 'home' | 'about' | 'login' | 'addTour';

export type Tour = {
  id: string;
  username: string;
  title: string;
  category: Category;
  description: string;
  startPoint: Location;
  endPoint: Location;
  poi: Location[];
  image: string;
  route: Route;
  logs: TourLog[];
};

export type Location = {
  name: string;
  latitude: number;
  longitude: number;
}

export type Session = {
  loggedIn: boolean;
  username:string;
  sections: Section[];
}

export type Route = {
  distance: number;
  durationMin: number;
}

export type TourLog = {
  id: string;
  date: Date;
  comment: string;
  difficulty: number;
  rating: number;
}