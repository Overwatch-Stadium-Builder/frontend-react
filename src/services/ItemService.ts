import DatabaseService from './DatabaseService';
import { Item, ItemCategory } from '@/types';

class ItemService {
  private db = DatabaseService.getInstance();

  async getAllItems(): Promise<Item[]> {
    try {
      const items = await this.db.query<Item>('SELECT i.*, h.name as heroName FROM Items i LEFT JOIN Heroes h ON i.hero_id = h.id ORDER BY i.category, i.name');
      return items.map(item => ({
        ...item,
        heroId: item.heroId === null ? null : item.heroId
      }));
    } catch (error) {
      console.error('Error fetching all items:', error);
      return [];
    }
  }

  async getItemsByCategory(category: ItemCategory): Promise<Item[]> {
    try {
      const items = await this.db.query<Item>('SELECT i.*, h.name as heroName FROM Items i LEFT JOIN Heroes h ON i.hero_id = h.id WHERE i.category = ? ORDER BY i.name', [category]);
      return items.map(item => ({
        ...item,
        heroId: item.heroId === null ? null : item.heroId
      }));
    } catch (error) {
      console.error(`Error fetching items by category ${category}:`, error);
      return [];
    }
  }

  async getItemsByHero(heroId: number | null): Promise<Item[]> {
    try {
      if (heroId === null) {
        // Get general items (not specific to any hero)
        const items = await this.db.query<Item>('SELECT * FROM Items WHERE hero_id IS NULL ORDER BY category, name');
        return items.map(item => ({
          ...item,
          heroId: null,
          heroName: null
        }));
      } else {
        // Get items for specific hero OR general items
        const items = await this.db.query<Item>(
          'SELECT i.*, h.name as heroName FROM Items i LEFT JOIN Heroes h ON i.hero_id = h.id WHERE i.hero_id = ? OR i.hero_id IS NULL ORDER BY i.category, i.name', 
          [heroId]
        );
        return items.map(item => ({
          ...item,
          heroId: item.heroId === null ? null : item.heroId
        }));
      }
    } catch (error) {
      console.error(`Error fetching items by hero ${heroId}:`, error);
      return [];
    }
  }

  async getItemById(id: number): Promise<Item | null> {
    try {
      const items = await this.db.query<Item>('SELECT i.*, h.name as heroName FROM Items i LEFT JOIN Heroes h ON i.hero_id = h.id WHERE i.id = ?', [id]);
      if (items.length === 0) return null;
      
      return {
        ...items[0],
        heroId: items[0].heroId === null ? null : items[0].heroId
      };
    } catch (error) {
      console.error(`Error fetching item with id ${id}:`, error);
      return null;
    }
  }

  async addItem(item: Omit<Item, 'id'>): Promise<number> {
    const result = await this.db.execute(
      'INSERT INTO Items (name, category, description, cost, rarity, hero_id) VALUES (?, ?, ?, ?, ?, ?)',
      [item.name, item.category, item.description, item.cost, item.rarity, item.heroId || null]
    );
    return result.insertId;
  }

  async updateItem(item: Item): Promise<boolean> {
    const result = await this.db.execute(
      'UPDATE Items SET name = ?, category = ?, description = ?, cost = ?, rarity = ?, hero_id = ? WHERE id = ?',
      [item.name, item.category, item.description, item.cost, item.rarity, item.heroId || null, item.id]
    );
    return result.affectedRows > 0;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await this.db.execute('DELETE FROM Items WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default ItemService;
