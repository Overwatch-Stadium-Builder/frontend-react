import DatabaseService from './DatabaseService';
import { Build, Round, Item, Power } from '@/types';
import ItemService from './ItemService';
import PowerService from './PowerService';

class BuildService {
  private db = DatabaseService.getInstance();
  private itemService = new ItemService();
  private powerService = new PowerService();

  async getAllBuilds(): Promise<Build[]> {
    try {
      const builds = await this.db.query<any>(
        `SELECT b.*, u.username as userName, h.name as heroName 
        FROM Builds b
        JOIN Users u ON b.user_id = u.id
        JOIN Heroes h ON b.hero_id = h.id
        ORDER BY b.created_at DESC`
      );

      return await Promise.all(builds.map(async build => {
        const rounds = await this.getRoundsForBuild(build.id);
        return {
          id: build.id,
          userId: build.user_id,
          heroId: build.hero_id,
          heroName: build.heroName,
          heroRole: build.hero_role,
          title: build.title,
          createdAt: build.created_at,
          userName: build.userName,
          isVerified: build.is_verified === 1,
          rounds
        };
      }));
    } catch (error) {
      console.error("Error in getAllBuilds:", error);
      throw error;
    }
  }

  async getUnverifiedBuilds(): Promise<Build[]> {
    try {
      const builds = await this.db.query<any>(
        `SELECT b.*, u.username as userName, h.name as heroName 
        FROM Builds b
        JOIN Users u ON b.user_id = u.id
        JOIN Heroes h ON b.hero_id = h.id
        WHERE b.is_verified = 0
        ORDER BY b.created_at DESC`
      );

      return await Promise.all(builds.map(async build => {
        const rounds = await this.getRoundsForBuild(build.id);
        return {
          id: build.id,
          userId: build.user_id,
          heroId: build.hero_id,
          heroName: build.heroName,
          heroRole: build.hero_role,
          title: build.title,
          createdAt: build.created_at,
          userName: build.userName,
          isVerified: false,
          rounds
        };
      }));
    } catch (error) {
      console.error("Error in getUnverifiedBuilds:", error);
      throw error;
    }
  }

  async getBuildById(id: number): Promise<Build | null> {
    try {
      const builds = await this.db.query<any>(
        `SELECT b.*, u.username as userName, h.name as heroName 
        FROM Builds b
        JOIN Users u ON b.user_id = u.id
        JOIN Heroes h ON b.hero_id = h.id
        WHERE b.id = ?`,
        [id]
      );

      if (builds.length === 0) return null;

      const build = builds[0];
      const rounds = await this.getRoundsForBuild(build.id);

      return {
        id: build.id,
        userId: build.user_id,
        heroId: build.hero_id,
        heroName: build.heroName,
        heroRole: build.hero_role,
        title: build.title,
        createdAt: build.created_at,
        userName: build.userName,
        isVerified: build.is_verified === 1,
        rounds
      };
    } catch (error) {
      console.error("Error in getBuildById:", error);
      throw error;
    }
  }

  async getUserBuilds(userId: number): Promise<Build[]> {
    try {
      const builds = await this.db.query<any>(
        `SELECT b.*, u.username as userName, h.name as heroName 
        FROM Builds b
        JOIN Users u ON b.user_id = u.id
        JOIN Heroes h ON b.hero_id = h.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC`,
        [userId]
      );

      return await Promise.all(builds.map(async build => {
        const rounds = await this.getRoundsForBuild(build.id);
        return {
          id: build.id,
          userId: build.user_id,
          heroId: build.hero_id,
          heroName: build.heroName,
          heroRole: build.hero_role,
          title: build.title,
          createdAt: build.created_at,
          userName: build.userName,
          isVerified: build.is_verified === 1,
          rounds
        };
      }));
    } catch (error) {
      console.error("Error in getUserBuilds:", error);
      throw error;
    }
  }

  async getUserSavedBuilds(userId: number): Promise<Build[]> {
    try {
      // Direct API call instead of using the database service
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch saved builds: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return await Promise.all(data.map(async (build: any) => {
        // Format the data to match our Build type
        const rounds = build.rounds || [];
        return {
          id: build.id,
          userId: build.user_id,
          heroId: build.hero_id,
          heroName: build.hero_name,
          heroRole: build.hero_role,
          title: build.title,
          createdAt: build.created_at,
          userName: build.username,
          isVerified: build.is_verified === 1,
          rounds: rounds.map((r: any) => ({
            id: r.id,
            buildId: r.build_id,
            roundNumber: r.round_number,
            explanation: r.explanation,
            items: r.items || [],
            powers: r.powers || []
          }))
        };
      }));
    } catch (error) {
      console.error("Error in getUserSavedBuilds:", error);
      throw error;
    }
  }

  async createBuild(build: Omit<Build, 'id'>): Promise<number> {
    try {
      const result = await this.db.execute(
        `INSERT INTO builds (user_id, hero_id, title, is_verified) 
        VALUES (?, ?, ?, ?)`,
        [build.userId, build.heroId, build.title, build.isVerified ? 1 : 0]
      );
      
      const buildId = result.insertId;
      
      // Add rounds - Note: only add rounds that have explanations
      for (const round of build.rounds.filter(r => r.explanation.trim() !== '')) {
        await this.createRound(buildId, round);
      }
      
      return buildId;
    } catch (error) {
      console.error("Error in createBuild:", error);
      throw error;
    }
  }

  async deleteBuild(buildId: number): Promise<boolean> {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`https://owapi.luciousdev.nl/api/builds/${buildId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error in deleteBuild:", error);
      return false;
    }
  }

  async verifyBuild(id: number): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'UPDATE Builds SET is_verified = 1 WHERE id = ?',
        [1, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in verifyBuild:", error);
      throw error;
    }
  }

  async unverifyBuild(id: number): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'UPDATE Builds SET is_verified = 0 WHERE id = ?',
        [0, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in unverifyBuild:", error);
      throw error;
    }
  }

  async saveBuild(userId: number, buildId: number): Promise<boolean> {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds/${buildId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error in saveBuild:", error);
      return false;
    }
  }

  async unsaveBuild(userId: number, buildId: number): Promise<boolean> {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds/${buildId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error in unsaveBuild:", error);
      return false;
    }
  }

  async isBuildSaved(userId: number, buildId: number): Promise<boolean> {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      const response = await fetch(`https://owapi.luciousdev.nl/api/users/${userId}/saved-builds/${buildId}/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.isSaved;
    } catch (error) {
      console.error("Error in isBuildSaved:", error);
      return false;
    }
  }

  private async getRoundsForBuild(buildId: number): Promise<Round[]> {
    try {
      const rounds = await this.db.query<any>(
        'SELECT * FROM Rounds WHERE build_id = ? ORDER BY round_number',
        [buildId]
      );

      // Create an array of 7 rounds (1-7)
      const allRounds: Round[] = Array.from({ length: 7 }, (_, i) => ({
        id: 0,
        buildId,
        roundNumber: i + 1,
        explanation: "",
        items: [],
        powers: []
      }));

      // Fill in rounds that exist in the database
      for (const dbRound of rounds) {
        const items = await this.getItemsForRound(dbRound.id);
        const powers = await this.getPowersForRound(dbRound.id);

        // Update the round in the allRounds array (array is 0-indexed, round numbers start at 1)
        const index = dbRound.round_number - 1;
        allRounds[index] = {
          id: dbRound.id,
          buildId: dbRound.build_id,
          roundNumber: dbRound.round_number,
          explanation: dbRound.explanation,
          items,
          powers
        };
      }

      return allRounds;
    } catch (error) {
      console.error("Error in getRoundsForBuild:", error);
      throw error;
    }
  }

  private async createRound(buildId: number, round: Round): Promise<number> {
    try {
      const result = await this.db.execute(
        'INSERT INTO Rounds (build_id, round_number, explanation) VALUES (?, ?, ?)',
        [buildId, round.roundNumber, round.explanation]
      );
      
      const roundId = result.insertId;
      
      // Add items and powers
      for (const item of round.items) {
        await this.db.execute(
          'INSERT INTO RoundItems (round_id, item_id) VALUES (?, ?)',
          [roundId, item.id]
        );
      }
      
      for (const power of round.powers) {
        await this.db.execute(
          'INSERT INTO RoundPowers (round_id, power_id) VALUES (?, ?)',
          [roundId, power.id]
        );
      }
      
      return roundId;
    } catch (error) {
      console.error("Error in createRound:", error);
      throw error;
    }
  }

  private async getItemsForRound(roundId: number): Promise<Item[]> {
    try {
      const itemIds = await this.db.query<{item_id: number}>(
        'SELECT item_id FROM RoundItems WHERE round_id = ?',
        [roundId]
      );
      
      const items: Item[] = [];
      for (const {item_id} of itemIds) {
        const item = await this.itemService.getItemById(item_id);
        if (item) items.push(item);
      }
      
      return items;
    } catch (error) {
      console.error("Error in getItemsForRound:", error);
      throw error;
    }
  }

  private async getPowersForRound(roundId: number): Promise<Power[]> {
    try {
      const powerIds = await this.db.query<{power_id: number}>(
        'SELECT power_id FROM RoundPowers WHERE round_id = ?',
        [roundId]
      );
      
      const powers: Power[] = [];
      for (const {power_id} of powerIds) {
        const power = await this.powerService.getPowerById(power_id);
        if (power) powers.push(power);
      }
      
      return powers;
    } catch (error) {
      console.error("Error in getPowersForRound:", error);
      throw error;
    }
  }
}

export default BuildService;
