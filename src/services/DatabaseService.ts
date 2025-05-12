class DatabaseService {
  private static instance: DatabaseService;
  // Use configurable API URL.
  private apiUrl: string = 'https://owapi.luciousdev.nl/api';

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private getAuthHeader(): HeadersInit {
    const token = sessionStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Clear auth data if unauthorized
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('isAdmin');
        
        // Redirect to login page
        window.location.href = '/login';
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }
    return response.json();
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    console.log('Query:', sql, params);
    
    // Extract the main entity we're querying from the SQL string
    const entityMatch = sql.match(/FROM\s+(\w+)/i);
    const entity = entityMatch ? entityMatch[1].toLowerCase() : '';
    
    // Extract conditions
    const conditions: Record<string, any> = {};
    if (params.length > 0) {
      // Simple parsing of WHERE conditions
      const whereMatch = sql.match(/WHERE\s+([\w\.]+)\s*=\s*\?/i);
      if (whereMatch) {
        const field = whereMatch[1].split('.').pop();
        if (field) {
          conditions[field] = params[0];
        }
      }
    }
    
    // Construct API endpoint based on the entity
    let endpoint = '';
    let queryParams = new URLSearchParams();
    
    switch (entity) {
      case 'heroes':
        endpoint = '/heroes';
        if (conditions.id) endpoint += `/${conditions.id}`;
        break;
      
      case 'items':
        endpoint = '/items';
        if (conditions.id) endpoint += `/${conditions.id}`;
        if (conditions.category) queryParams.set('category', conditions.category);
        break;
      
      case 'powers':
        endpoint = '/powers';
        if (conditions.id) endpoint += `/${conditions.id}`;
        break;
      
      case 'builds':
      case 'b':
        endpoint = '/builds';
        if (conditions.id || conditions['b.id']) endpoint += `/${conditions.id || conditions['b.id']}`;
        if (sql.includes('is_verified = 0')) queryParams.set('unverified', 'true');
        if (sql.includes('is_verified = 1')) queryParams.set('verified', 'true');
        if (conditions.user_id) queryParams.set('user_id', conditions.user_id);
        break;
      
      case 'rounds':
        endpoint = `/builds/${params[0]}/rounds`;
        break;
      
      case 'rounditems':
        endpoint = `/rounds/${params[0]}/items`;
        break;
      
      case 'roundpowers':
        endpoint = `/rounds/${params[0]}/powers`;
        break;
      
      case 'savedbuilds':
        if (sql.includes('SELECT 1') && params.length > 1) {
          endpoint = `/users/${params[0]}/saved-builds/${params[1]}/check`;
        } else {
          endpoint = `/users/${params[0]}/saved-builds`;
        }
        break;
      
      case 'users':
        endpoint = '/users';
        if (conditions.id) endpoint += `/${conditions.id}`;
        if (conditions.username) {
          queryParams.set('username', conditions.username);
        }
        break;
        
      default:
        throw new Error(`Unsupported entity: ${entity}`);
    }
    
    // Add query params if any
    const queryString = queryParams.toString();
    const url = `${this.apiUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getAuthHeader()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error(`Error in query:`, error);
      throw error;
    }
  }

  public async execute(sql: string, params: any[] = []): Promise<any> {
    console.log('Execute:', sql, params);
    
    // Determine the action (INSERT, UPDATE, DELETE) and entity
    const actionMatch = sql.match(/^(INSERT INTO|UPDATE|DELETE FROM)\s+(\w+)/i);
    
    if (!actionMatch) {
      throw new Error(`Unsupported SQL operation: ${sql}`);
    }
    
    const action = actionMatch[1].toUpperCase();
    const entity = actionMatch[2].toLowerCase();
    
    let method = 'POST';
    let endpoint = '';
    let data: any = {};
    
    switch (action) {
      case 'INSERT INTO':
        method = 'POST';
        
        switch (entity) {
          case 'builds':
            endpoint = '/builds';
            // Extract params based on the SQL fields order
            data = {
              user_id: params[0],
              hero_id: params[1],
              title: params[2],
              is_verified: params[3] === 1
            };
            break;
          
          case 'rounds':
            endpoint = `/builds/${params[0]}/rounds`;
            data = {
              round_number: params[1],
              explanation: params[2]
            };
            break;
          
          case 'rounditems':
            endpoint = `/rounds/${params[0]}/items`;
            data = { item_id: params[1] };
            break;
          
          case 'roundpowers':
            endpoint = `/rounds/${params[0]}/powers`;
            data = { power_id: params[1] };
            break;
          
          case 'savedbuilds':
            endpoint = `/users/${params[0]}/saved-builds/${params[1]}`;
            method = 'POST';
            data = {}; // No data needed for this endpoint
            break;

          case 'users':
            endpoint = '/register';
            data = {
              username: params[0], 
              password: params[1]
            };
            break;
          
          case 'items':
            endpoint = '/items';
            data = {
              name: params[0],
              category: params[1],
              description: params[2],
              rarity: params[4],
              cost: params[3],
              heroId: params[5]
            };
            break;
          
          case 'powers':
            endpoint = '/powers';
            data = {
              name: params[0],
              description: params[1],
              heroId: params[2]
            };
            break;
            
          default:
            throw new Error(`Unsupported entity for INSERT: ${entity}`);
        }
        break;
      
      case 'UPDATE':
        method = 'PUT';
        
        switch (entity) {
          case 'builds':
            if (sql.includes('is_verified')) {
              // Special case for verifying builds
              endpoint = `/builds/${params[1]}/` + (params[0] === 1 ? 'verify' : 'unverify');
              method = 'POST'; // Using POST for these special actions
            } else {
              endpoint = `/builds/${params[params.length - 1]}`;
              data = {
                hero_id: params[0],
                title: params[1],
                is_verified: params[2] === 1
              };
            }
            break;
          
          case 'items':
            endpoint = `/items/${params[params.length - 1]}`;
            data = {
              name: params[0],
              category: params[1],
              description: params[2],
              rarity: params[4],
              cost: params[3],
              heroId: params[5]
            };
            break;
          
          case 'powers':
            endpoint = `/powers/${params[params.length - 1]}`;
            data = {
              name: params[0],
              description: params[1],
              heroId: params[2]
            };
            break;
            
          default:
            throw new Error(`Unsupported entity for UPDATE: ${entity}`);
        }
        break;
      
      case 'DELETE FROM':
        method = 'DELETE';
        
        switch (entity) {
          case 'items':
            endpoint = `/items/${params[0]}`;
            break;
          
          case 'powers':
            endpoint = `/powers/${params[0]}`;
            break;
          
          case 'savedbuilds':
            endpoint = `/users/${params[0]}/saved-builds/${params[1]}`;
            break;
            
          default:
            throw new Error(`Unsupported entity for DELETE: ${entity}`);
        }
        break;
    }
    
    try {
      const url = `${this.apiUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        }
      };
      
      if (method !== 'DELETE' && Object.keys(data).length > 0) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      const result = await this.handleResponse(response);
      
      // Return a standard result format similar to mysql2
      return {
        insertId: result.id || 0,
        affectedRows: 1
      };
    } catch (error) {
      console.error(`Error in execute:`, error);
      throw error;
    }
  }

  public async verifyToken(): Promise<boolean> {
    const token = sessionStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const response = await fetch(`${this.apiUrl}/me`, {
        headers: this.getAuthHeader()
      });
      
      if (!response.ok) {
        // Token is invalid - clear auth data
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('isAdmin');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }
}

export default DatabaseService;
