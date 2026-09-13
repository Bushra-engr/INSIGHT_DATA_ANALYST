/**
 * API Service for Backend Communication and Client-Side Fallback Engine
 */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CONFIG } from './config';
import { profileDataset } from './dataProfiler';

export const ApiService = {
  getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async checkHealth() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Upload & Parse File (CSV or Excel)
   * Tries backend /upload first, falls back seamlessly to client-side profiling
   */
  async uploadDataset(file, onProgress = () => {}) {
    onProgress(15, 'Reading file bytes...');

    // Attempt backend upload if online
    try {
      const formData = new FormData();
      formData.append('file', file);

      onProgress(35, 'Uploading dataset to pipeline...');
      const uploadUrl = `${CONFIG.API_BASE_URL}/data/upload`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onProgress(75, 'Server ingestion confirmed. Building profile...');
        
        if (data && data.profile) {
          onProgress(100, 'Ingestion complete!');
          return {
            id: String(data.id || data.dataset_id || ('ds_' + Date.now())),
            backend_id: data.dataset_id || data.id,
            filename: file.name,
            file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            uploaded_at: new Date().toISOString(),
            profile: data.profile,
            records: data.records || data.profile.sample_rows || []
          };
        }

        // If dataset_id returned, fetch analysis profile
        if (data && data.dataset_id) {
          try {
            const profileRes = await fetch(`${CONFIG.API_BASE_URL}/analysis/${data.dataset_id}/full`, {
              headers: this.getAuthHeaders()
            });
            if (profileRes.ok) {
              const fullData = await profileRes.json();
              if (fullData && fullData.profile) {
                onProgress(100, 'Ingestion complete!');
                return {
                  id: String(data.dataset_id),
                  backend_id: data.dataset_id,
                  filename: file.name,
                  file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                  uploaded_at: new Date().toISOString(),
                  profile: fullData.profile,
                  records: fullData.records || fullData.profile.sample_rows || []
                };
              }
            }
          } catch (e) {
            console.warn('Profile fetch notice:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Backend upload unavailable, using high-speed client profiler:', err);
    }

    // Client-side parser fallback
    onProgress(50, 'Parsing dataset in browser engine...');
    const records = await this.parseFileClientSide(file);

    onProgress(75, 'Computing exploratory statistics & distributions...');
    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const dataset = profileDataset(records, file.name, fileSizeStr);

    onProgress(100, 'Analysis complete!');
    return dataset;
  },

  /**
   * Client-side CSV/XLSX file reader
   */
  parseFileClientSide(file) {
    return new Promise((resolve, reject) => {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
            if (!json || json.length === 0) {
              reject(new Error('Excel sheet contains no rows.'));
            } else {
              resolve(json);
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      } else {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              resolve(results.data);
            } else {
              reject(new Error('CSV file is empty or could not be parsed.'));
            }
          },
          error: reject
        });
      }
    });
  },

  /**
   * User Datasets Management
   */
  async getUserDatasets() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/data/datasets`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) return list;
      }
    } catch (e) {
      console.warn('Backend datasets unavailable:', e);
    }
    return [];
  },

  async deleteUserDataset(datasetId) {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/data/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      console.warn('Backend delete dataset notice:', e);
    }
  },

  /**
   * User Registry Management (Offline/Local Verification & Sync)
   */
  getRegisteredUsers() {
    try {
      const stored = localStorage.getItem(CONFIG.USERS_REGISTRY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Default seed account
    const seed = [
      { id: 1, name: 'User', email: 'user@example.com', password: 'password123' }
    ];
    try {
      localStorage.setItem(CONFIG.USERS_REGISTRY_KEY, JSON.stringify(seed));
    } catch {}
    return seed;
  },

  saveUserToRegistry(user) {
    if (!user || (!user.email && !user.name)) return;
    try {
      const users = this.getRegisteredUsers();
      const normEmail = (user.email || '').toLowerCase().trim();
      const normName = (user.name || '').toLowerCase().trim();
      const existingIdx = users.findIndex(u => 
        (normEmail && u.email && u.email.toLowerCase().trim() === normEmail) ||
        (normName && u.name && u.name.toLowerCase().trim() === normName)
      );

      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...user };
      } else {
        users.push({
          id: user.id || Date.now(),
          name: user.name || user.email.split('@')[0],
          email: user.email || `${normName}@enterprise.com`,
          password: user.password || ''
        });
      }
      localStorage.setItem(CONFIG.USERS_REGISTRY_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Could not update local user registry:', e);
    }
  },

  localAuthLogin(identifier, password) {
    const users = this.getRegisteredUsers();
    const cleanId = identifier.toLowerCase().trim();

    const found = users.find(u => 
      (u.email && u.email.toLowerCase().trim() === cleanId) ||
      (u.name && u.name.toLowerCase().trim() === cleanId)
    );

    if (!found) {
      throw new Error('User does not exist! Please Register First.');
    }

    if (found.password && found.password !== password) {
      throw new Error('Invalid Password! Please check your credentials.');
    }

    return {
      access_token: 'offline_token_' + Date.now(),
      user: {
        id: found.id || 1,
        name: found.name,
        email: found.email
      }
    };
  },

  localAuthRegister(name, email, password) {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    const exists = users.find(u => 
      (u.email && u.email.toLowerCase().trim() === cleanEmail) ||
      (cleanName && u.name && u.name.toLowerCase().trim() === cleanName.toLowerCase())
    );

    if (exists) {
      throw new Error('Username or email already registered! Please sign in.');
    }

    const newUser = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      password: password
    };

    try {
      localStorage.setItem(CONFIG.USERS_REGISTRY_KEY, JSON.stringify([...users, newUser]));
    } catch {}

    return {
      access_token: 'offline_token_' + Date.now(),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    };
  },

  /**
   * User Authentication
   */
  async login(identifier, password) {
    if (!identifier || !identifier.trim()) {
      throw new Error('Please enter your email or username.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const cleanId = identifier.trim();

    // 1. Try Backend Authentication First
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: cleanId,
          password: password
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data) {
        const userObj = data.user || {
          id: 1,
          name: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
          email: cleanId.includes('@') ? cleanId : `${cleanId}@enterprise.com`
        };
        this.saveUserToRegistry({ ...userObj, password });
        return {
          access_token: data.access_token || ('token_' + Date.now()),
          user: userObj
        };
      } else {
        // Backend returned explicit validation or auth error
        let errMsg = data.detail;
        if (Array.isArray(errMsg)) {
          errMsg = errMsg.map(d => d.msg || d.message).join(', ');
        }
        errMsg = errMsg || data.message || 'Authentication failed.';
        throw new Error(errMsg);
      }
    } catch (err) {
      // If error was thrown from backend response, rethrow it
      const isNetworkFail = !err.message || 
        err.message.includes('fetch') || 
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.name === 'TypeError';

      if (!isNetworkFail) {
        throw err;
      }

      // Backend unreachable/offline -> verify against local registry
      return this.localAuthLogin(cleanId, password);
    }
  },

  async register(name, email, password) {
    if (!name || !name.trim()) {
      throw new Error('Please enter your full name.');
    }
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Backend Registration First
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: password
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data) {
        const userObj = data.user || {
          id: Date.now(),
          name: cleanName,
          email: cleanEmail
        };
        this.saveUserToRegistry({ ...userObj, password });
        return {
          access_token: data.access_token || ('token_' + Date.now()),
          user: userObj
        };
      } else {
        let errMsg = data.detail;
        if (Array.isArray(errMsg)) {
          errMsg = errMsg.map(d => d.msg || d.message).join(', ');
        }
        errMsg = errMsg || data.message || 'Registration failed.';
        throw new Error(errMsg);
      }
    } catch (err) {
      const isNetworkFail = !err.message || 
        err.message.includes('fetch') || 
        err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.name === 'TypeError';

      if (!isNetworkFail) {
        throw err;
      }

      // Backend offline -> register in local registry
      return this.localAuthRegister(cleanName, cleanEmail, password);
    }
  }
};
