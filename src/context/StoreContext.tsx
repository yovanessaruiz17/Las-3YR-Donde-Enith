import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings, Announcement, Category, Brand, Banner } from '../types';
import { storeService } from '../services/storeService';
import { INITIAL_SETTINGS, INITIAL_BANNERS } from '../data/initialData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  announcements: Announcement[];
  categories: Category[];
  brands: Brand[];
  banners: Banner[];
  loading: boolean;
  refreshStoreData: () => Promise<void>;
  refreshStore: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshStoreData = async () => {
    try {
      const [st, ann, cats, brs, bans] = await Promise.all([
        storeService.getStoreSettings(),
        storeService.getAnnouncements(),
        storeService.getCategories(),
        storeService.getBrands(),
        storeService.getBanners(),
      ]);
      setSettings(st || INITIAL_SETTINGS);
      setAnnouncements(ann || []);
      setCategories(cats || []);
      setBrands(brs || []);
      setBanners(bans && bans.length > 0 ? bans : INITIAL_BANNERS);
    } catch (e) {
      console.warn('Error refreshing store data:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await storeService.updateStoreSettings(updated);
      return true;
    } catch (e) {
      console.warn('Error updating settings:', e);
      return false;
    }
  };

  useEffect(() => {
    refreshStoreData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        announcements,
        categories,
        brands,
        banners,
        loading,
        refreshStoreData,
        refreshStore: refreshStoreData,
        showToast,
      }}
    >
      {children}
      {/* Global Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 flex items-center gap-2.5 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-[#163E2B] text-white'
                : toast.type === 'error'
                ? 'bg-rose-700 text-white'
                : 'bg-stone-800 text-white'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore debe usarse dentro de StoreProvider');
  }
  return context;
};
