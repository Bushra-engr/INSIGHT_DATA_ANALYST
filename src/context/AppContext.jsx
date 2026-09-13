import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CONFIG } from '../services/config';
import { DEMO_DATASET } from '../services/demoData';
import { ApiService } from '../services/apiService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
  });

  // Active View State
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem(CONFIG.ACTIVE_VIEW_KEY) || 'dashboard';
  });

  // Auth User State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG.USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && !parsed.email.includes('guest') && !parsed.email.includes('analyst.io')) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  // Dataset History (strictly user-isolated; demo only when logged out or new user)
  const [history, setHistory] = useState(() => {
    try {
      const savedUser = localStorage.getItem(CONFIG.USER_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && (parsedUser.id || parsedUser.email)) {
          const userKey = `${CONFIG.HISTORY_KEY}_${parsedUser.id || parsedUser.email}`;
          const saved = localStorage.getItem(userKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      }
      return [DEMO_DATASET];
    } catch {
      return [DEMO_DATASET];
    }
  });

  // Active Dataset (demo only when logged out)
  const [currentAnalysis, setCurrentAnalysis] = useState(() => {
    try {
      const savedUser = localStorage.getItem(CONFIG.USER_KEY);
      if (!savedUser) return DEMO_DATASET;

      const cached = localStorage.getItem(CONFIG.ACTIVE_DATASET_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.profile && Array.isArray(parsed.profile.columns) && parsed.profile.columns.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEMO_DATASET;
  });

  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });

  // Auth Action Loading State (signing in, registering, fast logout, guest mode)
  const [authActionLoading, setAuthActionLoading] = useState({
    active: false,
    label: ''
  });

  // Upload Progress
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    status: ''
  });

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = 'toast_' + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Sync Theme to HTML class
  useEffect(() => {
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync Active View
  useEffect(() => {
    localStorage.setItem(CONFIG.ACTIVE_VIEW_KEY, activeView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeView]);

  // Sync Dataset to Cache & Active ID
  useEffect(() => {
    if (currentAnalysis) {
      localStorage.setItem(CONFIG.ACTIVE_DATASET_KEY, currentAnalysis.id);
      try {
        localStorage.setItem(CONFIG.ACTIVE_DATASET_CACHE_KEY, JSON.stringify({
          id: currentAnalysis.id,
          filename: currentAnalysis.filename,
          file_size: currentAnalysis.file_size,
          uploaded_at: currentAnalysis.uploaded_at,
          profile: currentAnalysis.profile,
          records: (currentAnalysis.records || []).slice(0, 150)
        }));
      } catch (err) {
        console.warn('Quota reached while caching active dataset:', err);
      }
    }
  }, [currentAnalysis]);

  // Sync History Safely to localStorage (both global and per-user)
  useEffect(() => {
    try {
      if (!Array.isArray(history) || history.length === 0) return;
      const slimHistory = history.slice(0, 15).map(ds => ({
        id: ds.id,
        backend_id: ds.backend_id || ds.id,
        dataset_id: ds.dataset_id || ds.id,
        filename: ds.filename,
        file_size: ds.file_size,
        uploaded_at: ds.uploaded_at,
        profile: ds.profile,
        records: (ds.records || []).slice(0, 25)
      }));

      if (user && (user.id || user.email)) {
        const userKey = `${CONFIG.HISTORY_KEY}_${user.id || user.email}`;
        localStorage.setItem(userKey, JSON.stringify(slimHistory));
      }
    } catch (err) {
      console.warn('History storage quota trimmed:', err);
    }
  }, [history, user]);

  // Fetch user history from backend or user-scoped cache (strictly isolated per user)
  const fetchUserHistory = async (currentUser) => {
    const activeUser = currentUser || user;
    if (!activeUser || (!activeUser.id && !activeUser.email)) {
      setHistory([DEMO_DATASET]);
      return;
    }

    // 1. Try server datasets for this specific authenticated user
    let serverDatasets = [];
    try {
      serverDatasets = await ApiService.getUserDatasets();
    } catch (e) {
      console.warn('Could not sync user datasets from server:', e);
    }

    // 2. Read ONLY user-scoped local datasets
    let localDatasets = [];
    try {
      const userKey = `${CONFIG.HISTORY_KEY}_${activeUser.id || activeUser.email}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localDatasets = parsed;
        }
      }
    } catch {}

    // Merge datasets strictly belonging to activeUser
    setHistory(prev => {
      const combined = [];
      const seenIds = new Set();
      const seenNames = new Set();

      // Priority 1: Server datasets
      if (Array.isArray(serverDatasets)) {
        for (const ds of serverDatasets) {
          if (ds && ds.id && ds.id !== DEMO_DATASET.id) {
            seenIds.add(String(ds.id));
            if (ds.filename) seenNames.add(ds.filename.toLowerCase().trim());
            combined.push(ds);
          }
        }
      }

      // Priority 2: Local user-scoped datasets
      if (Array.isArray(localDatasets)) {
        for (const ds of localDatasets) {
          if (ds && ds.id && ds.id !== DEMO_DATASET.id) {
            const name = (ds.filename || '').toLowerCase().trim();
            if (!seenIds.has(String(ds.id)) && (!name || !seenNames.has(name))) {
              seenIds.add(String(ds.id));
              if (name) seenNames.add(name);
              combined.push(ds);
            }
          }
        }
      }

      return [...combined, DEMO_DATASET];
    });
  };

  // Initial fetch on mount: only fetch if user is logged in, else set demo
  useEffect(() => {
    if (user) {
      fetchUserHistory(user);
    } else {
      setHistory([DEMO_DATASET]);
    }
  }, []);

  // Sync history whenever user state changes
  useEffect(() => {
    if (user) {
      fetchUserHistory(user);
    } else {
      setHistory([DEMO_DATASET]);
    }
  }, [user]);

  // Sync history whenever user navigates to history view
  useEffect(() => {
    if (activeView === 'history') {
      if (user) {
        fetchUserHistory(user);
      } else {
        setHistory([DEMO_DATASET]);
      }
    }
  }, [activeView, user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const switchView = (viewName) => {
    setActiveView(viewName);
  };

  const loadDataset = async (dataset) => {
    setCurrentAnalysis(dataset);
    setActiveView('dashboard');
    showToast(`Loaded "${dataset.filename}"`, 'success');

    // If dataset has a backend_id and profile columns or records are empty, fetch full analysis
    const bId = dataset.backend_id || dataset.dataset_id;
    if (bId && (!dataset.profile?.columns || dataset.profile.columns.length === 0 || !dataset.records || dataset.records.length === 0)) {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/analysis/${bId}/full`, {
          headers: ApiService.getAuthHeaders()
        });
        if (res.ok) {
          const fullData = await res.json();
          if (fullData && fullData.profile) {
            const enriched = {
              ...dataset,
              profile: fullData.profile,
              records: fullData.records || fullData.profile.sample_rows || dataset.records || []
            };
            setCurrentAnalysis(enriched);
            setHistory(prev => prev.map(h => h.id === dataset.id ? enriched : h));
          }
        }
      } catch (e) {
        console.warn('Could not enrich dataset profile:', e);
      }
    }
  };

  const loadDemoDataset = () => {
    loadDataset(DEMO_DATASET);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      showToast('Please upload a .csv or .xlsx file.', 'error');
      return;
    }

    setUploadProgress({ isUploading: true, progress: 10, status: 'Initializing ingestion...' });
    try {
      const dataset = await ApiService.uploadDataset(file, (pct, status) => {
        setUploadProgress({ isUploading: true, progress: pct, status });
      });

      setHistory(prev => [dataset, ...prev.filter(h => h.id !== dataset.id)]);
      loadDataset(dataset);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast(`Successfully analyzed "${file.name}"!`, 'success');
      // Sync fresh list if authenticated
      if (user) {
        fetchUserHistory(user);
      }
    } catch (err) {
      console.error(err);
      showToast(`Ingestion failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setUploadProgress({ isUploading: false, progress: 0, status: '' });
    }
  };

  const deleteHistoryItem = (id) => {
    ApiService.deleteUserDataset(id);
    setHistory(prev => prev.filter(h => h.id !== id));
    if (user && (user.id || user.email)) {
      const userKey = `${CONFIG.HISTORY_KEY}_${user.id || user.email}`;
      try {
        const remaining = history.filter(h => h.id !== id);
        localStorage.setItem(userKey, JSON.stringify(remaining));
      } catch {}
    }
    showToast('Dataset removed from history.', 'info');
  };

  const loginUser = async (email, password) => {
    setAuthActionLoading({ active: true, label: 'Signing in to workspace...' });
    try {
      const res = await ApiService.login(email, password);
      if (res && res.user) {
        setHistory([DEMO_DATASET]);
        setUser(res.user);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(res.user));
        if (res.access_token) localStorage.setItem(CONFIG.TOKEN_KEY, res.access_token);
        await fetchUserHistory(res.user);
        showToast('Welcome back!', 'success');
        setAuthModal({ isOpen: false, mode: 'login' });
        return res.user;
      }
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    } finally {
      setAuthActionLoading({ active: false, label: '' });
    }
  };

  const registerUser = async (name, email, password) => {
    setAuthActionLoading({ active: true, label: 'Creating your account...' });
    try {
      const res = await ApiService.register(name, email, password);
      if (res && res.user) {
        setHistory([DEMO_DATASET]);
        setUser(res.user);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(res.user));
        if (res.access_token) localStorage.setItem(CONFIG.TOKEN_KEY, res.access_token);
        await fetchUserHistory(res.user);
        showToast('Account created successfully!', 'success');
        setAuthModal({ isOpen: false, mode: 'login' });
        return res.user;
      }
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    } finally {
      setAuthActionLoading({ active: false, label: '' });
    }
  };

  const logoutUser = async () => {
    setAuthActionLoading({ active: true, label: 'Signing out & switching to Guest Mode...' });
    setUser(null);
    setHistory([DEMO_DATASET]);
    setCurrentAnalysis(DEMO_DATASET);
    try {
      localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify([DEMO_DATASET]));
      localStorage.setItem(CONFIG.ACTIVE_DATASET_KEY, DEMO_DATASET.id);
      localStorage.setItem(CONFIG.ACTIVE_DATASET_CACHE_KEY, JSON.stringify(DEMO_DATASET));
      localStorage.removeItem(CONFIG.USER_KEY);
      localStorage.removeItem(CONFIG.TOKEN_KEY);
    } catch (e) {
      console.warn('Storage cleanup on logout:', e);
    }
    await new Promise(r => setTimeout(r, 220));
    setAuthActionLoading({ active: false, label: '' });
    showToast('Signed out. Switched to Guest Mode.', 'info');
  };

  const switchToGuestMode = async () => {
    setAuthActionLoading({ active: true, label: 'Switching to Guest Analyst Mode...' });
    setUser(null);
    setHistory([DEMO_DATASET]);
    setCurrentAnalysis(DEMO_DATASET);
    setActiveView('dashboard');
    try {
      localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify([DEMO_DATASET]));
      localStorage.setItem(CONFIG.ACTIVE_DATASET_KEY, DEMO_DATASET.id);
      localStorage.setItem(CONFIG.ACTIVE_DATASET_CACHE_KEY, JSON.stringify(DEMO_DATASET));
      localStorage.removeItem(CONFIG.USER_KEY);
      localStorage.removeItem(CONFIG.TOKEN_KEY);
    } catch (e) {
      console.warn('Storage cleanup on guest switch:', e);
    }
    await new Promise(r => setTimeout(r, 200));
    setAuthActionLoading({ active: false, label: '' });
    showToast('Switched to Guest Analyst Mode.', 'info');
  };

  const continueAsGuest = async () => {
    setAuthActionLoading({ active: true, label: 'Entering Guest Analyst Mode...' });
    setAuthModal({ isOpen: false, mode: 'login' });
    setUser(null);
    setHistory([DEMO_DATASET]);
    if (!currentAnalysis || currentAnalysis.id !== DEMO_DATASET.id) {
      setCurrentAnalysis(DEMO_DATASET);
    }
    setActiveView('dashboard');
    await new Promise(r => setTimeout(r, 200));
    setAuthActionLoading({ active: false, label: '' });
    showToast('Entered workspace as Guest Analyst.', 'info');
  };

  const refreshHistory = async () => {
    if (user) {
      await fetchUserHistory(user);
    } else {
      setHistory([DEMO_DATASET]);
      showToast('Guest history refreshed to Demo Dataset.', 'info');
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeView,
        switchView,
        currentAnalysis,
        loadDataset,
        loadDemoDataset,
        history,
        fetchUserHistory,
        refreshHistory,
        deleteHistoryItem,
        handleFileUpload,
        uploadProgress,
        user,
        authModal,
        setAuthModal,
        authActionLoading,
        loginUser,
        registerUser,
        logoutUser,
        switchToGuestMode,
        continueAsGuest,
        toasts,
        showToast,
        exportToPDF
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
