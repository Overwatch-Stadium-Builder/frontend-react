export interface Round {
  id?: number;
  buildId?: number;
  roundNumber: number;
  explanation: string;
  items: Item[];
  powers: Power[];
}

export interface Item {
  id: number;
  name: string;
  category: string;
  description: string;
  cost: number;
  rarity: string;
  heroId?: number | null;
  heroName?: string;
  imageUrl?: string;
}

// Add the missing ItemCategory type
export type ItemCategory = 'Weapon' | 'Ability' | 'Survival';

export type ItemRarity = 'common' | 'rare' | 'epic';

export interface Power {
  id: number;
  name: string;
  description: string;
  heroId?: number | null;
  heroName?: string;
  imageUrl?: string;
}

export interface Build {
  id?: number;
  userId: number;
  heroId: number;
  buildId?: number;
  heroName?: string;
  heroRole?: string;
  title: string;
  createdAt?: string;
  userName?: string;
  isVerified?: boolean;
  rounds: Round[];
}

export interface Hero {
  id: number;
  name: string;
  role: Role;
  imageUrl: string;
  description?: string;
  abilities?: string[];
}

export type Role = 'Tank' | 'DPS' | 'Support';

export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}
