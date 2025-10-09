import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WarehouseStore {
  selectedWarehouseId: string | null;
  setSelectedWarehouseId: (id: string | null) => void;
}

export const useWarehouseStore = create<WarehouseStore>()(
  persist(
    (set) => ({
      selectedWarehouseId: null,
      setSelectedWarehouseId: (id) => set({ selectedWarehouseId: id }),
    }),
    {
      name: 'warehouse-storage',
    }
  )
);
