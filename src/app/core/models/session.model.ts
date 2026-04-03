export type Section = 'home' | 'about' | 'login' | 'addTour';

export type Session = {
  loggedIn: boolean;
  username: string;
  sections: Section[];
};
