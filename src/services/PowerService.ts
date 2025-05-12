import DatabaseService from './DatabaseService';
import { Power } from '@/types';

class PowerService {
  private db = DatabaseService.getInstance();

  async getAllPowers(): Promise<Power[]> {
    try {
      const powers = await this.db.query<Power>('SELECT p.*, h.name as heroName FROM Powers p LEFT JOIN Heroes h ON p.hero_id = h.id ORDER BY p.name');
      return powers.map(power => ({
        ...power,
        heroId: power.heroId === null ? null : power.heroId
      }));
    } catch (error) {
      console.error('Error fetching powers:', error);
      return [];
    }
  }

  async getPowersByHero(heroId: number | null): Promise<Power[]> {
    try {
      if (heroId === null) {
        // Get general powers (not specific to any hero)
        const powers = await this.db.query<Power>('SELECT * FROM Powers WHERE hero_id IS NULL ORDER BY name');
        return powers.map(power => ({
          ...power,
          heroId: null,
          heroName: null
        }));
      } else {
        // Get powers for specific hero OR general powers
        const powers = await this.db.query<Power>(
          'SELECT p.*, h.name as heroName FROM Powers p LEFT JOIN Heroes h ON p.hero_id = h.id WHERE p.hero_id = ? OR p.hero_id IS NULL ORDER BY p.name', 
          [heroId]
        );
        return powers.map(power => ({
          ...power,
          heroId: power.heroId === null ? null : power.heroId
        }));
      }
    } catch (error) {
      console.error(`Error fetching powers by hero ${heroId}:`, error);
      return [];
    }
  }

  async getPowerById(id: number): Promise<Power | null> {
    try {
      const powers = await this.db.query<Power>('SELECT p.*, h.name as heroName FROM Powers p LEFT JOIN Heroes h ON p.hero_id = h.id WHERE p.id = ?', [id]);
      if (powers.length === 0) return null;
      
      return {
        ...powers[0],
        heroId: powers[0].heroId === null ? null : powers[0].heroId
      };
    } catch (error) {
      console.error(`Error fetching power with id ${id}:`, error);
      return null;
    }
  }

  async addPower(power: Omit<Power, 'id'>): Promise<number> {
    try {
      const result = await this.db.execute(
        'INSERT INTO Powers (name, description, hero_id) VALUES (?, ?, ?)',
        [power.name, power.description, power.heroId || null]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error adding power:', error);
      throw error;
    }
  }

  async updatePower(power: Power): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'UPDATE Powers SET name = ?, description = ?, hero_id = ? WHERE id = ?',
        [power.name, power.description, power.heroId || null, power.id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating power with id ${power.id}:`, error);
      return false;
    }
  }

  async deletePower(id: number): Promise<boolean> {
    try {
      const result = await this.db.execute('DELETE FROM Powers WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting power with id ${id}:`, error);
      return false;
    }
  }
}

export default PowerService;
