export type Section = 'home' | 'about' | 'faq' | 'login' | 'addTour';

export type Session = {
  loggedIn: boolean;
  username: string;
  sections: Section[];
};
