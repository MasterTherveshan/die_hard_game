export interface Character {
  id: string;
  name: string;
  portrait: string; // path to image (served from publicDir root)
  flavor: string;   // one-sentence in-character description
  title: string;    // short role title
}

export const HENCHMEN: Character[] = [
  {
    id: 'dolph',
    name: 'Rolph Dungreen',
    portrait: '/dolph.png',
    title: 'Lobby Muscle — Floor 1',
    flavor: "He doesn't think much. He doesn't have to.",
  },
  {
    id: 'hackie',
    name: 'Hackie Chan',
    portrait: '/hackie.png',
    title: 'Security Systems — Floor 2',
    flavor: "You won't see him coming — but you'll hear him bragging about it.",
  },
  {
    id: 'leslie',
    name: 'Leslie Sniper',
    portrait: '/leslie.png',
    title: 'Mid-Tower Marksman — Floor 3',
    flavor: 'One shot. That\'s all he needs.',
  },
  {
    id: 'sly',
    name: 'Sylvestor Alone',
    portrait: '/sly.png',
    title: 'Veteran Merc — Floor 4',
    flavor: "He's survived worse than you. Probably.",
  },
];

export const GRUBER: Character = {
  id: 'chance',
  name: '"Chance" Gruber',
  portrait: '/chance.png',
  title: 'The Mastermind — The Rooftop',
  flavor: 'He always knew the odds. He just never expected you.',
};
