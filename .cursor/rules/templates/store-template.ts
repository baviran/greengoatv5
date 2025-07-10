import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Logger } from '@/app/lib/utils/logger';

// Define store state interface
interface ExampleState {
  // Data properties
  items: ExampleItem[];
  selectedItem: ExampleItem | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // User context
  userId: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  
  // Actions
  setItems: (items: ExampleItem[]) => void;
  addItem: (item: ExampleItem) => void;
  updateItem: (id: string, updates: Partial<ExampleItem>) => void;
  deleteItem: (id: string) => void;
  selectItem: (item: ExampleItem | null) => void;
  
  // Async actions
  fetchItems: (userId: string) => Promise<void>;
  createItem: (data: Partial<ExampleItem>) => Promise<void>;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Pagination actions
  setCurrentPage: (page: number) => void;
  
  // Utility actions
  reset: () => void;
  initialize: (userId: string) => void;
}

interface ExampleItem {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Initial state
const initialState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
  userId: null,
  currentPage: 1,
  totalPages: 1,
};

// Create store with proper patterns
export const useExampleStore = create<ExampleState>()(
  persist(
    (set, get) => {
      const logger = Logger.getInstance().withContext({
        component: 'example-store'
      });

      return {
        ...initialState,

        // ✅ Data actions with logging
        setItems: (items) => {
          logger.info('Setting items', {
            action: 'set-items',
            itemCount: items.length,
            userId: get().userId
          });
          
          set({ items });
        },

        addItem: (item) => {
          logger.info('Adding item', {
            action: 'add-item',
            itemId: item.id,
            userId: get().userId
          });
          
          set((state) => ({
            items: [...state.items, item],
            error: null
          }));
        },

        updateItem: (id, updates) => {
          logger.info('Updating item', {
            action: 'update-item',
            itemId: id,
            updateFields: Object.keys(updates),
            userId: get().userId
          });
          
          set((state) => ({
            items: state.items.map(item =>
              item.id === id ? { ...item, ...updates } : item
            ),
            selectedItem: state.selectedItem?.id === id 
              ? { ...state.selectedItem, ...updates }
              : state.selectedItem,
            error: null
          }));
        },

        deleteItem: (id) => {
          logger.info('Deleting item', {
            action: 'delete-item',
            itemId: id,
            userId: get().userId
          });
          
          set((state) => ({
            items: state.items.filter(item => item.id !== id),
            selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
            error: null
          }));
        },

        selectItem: (item) => {
          logger.debug('Selecting item', {
            action: 'select-item',
            itemId: item?.id,
            userId: get().userId
          });
          
          set({ selectedItem: item });
        },

        // ✅ Async actions with proper error handling
        fetchItems: async (userId) => {
          const state = get();
          
          logger.info('Fetching items', {
            action: 'fetch-items',
            userId,
            currentItemCount: state.items.length
          });
          
          state.setLoading(true);
          state.clearError();
          
          try {
            // Replace with your actual API call
            const response = await fetch(`/api/items?userId=${userId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch items: ${response.status}`);
            }
            
            const data = await response.json();
            
            logger.info('Items fetched successfully', {
              action: 'fetch-items-success',
              userId,
              itemCount: data.items.length
            });
            
            state.setItems(data.items);
            
          } catch (error) {
            logger.error('Failed to fetch items', error, {
              action: 'fetch-items-error',
              userId
            });
            
            state.setError(error.message || 'Failed to fetch items');
          } finally {
            state.setLoading(false);
          }
        },

        createItem: async (data) => {
          const state = get();
          
          logger.info('Creating item', {
            action: 'create-item',
            userId: state.userId,
            hasTitle: !!data.title
          });
          
          state.setLoading(true);
          state.clearError();
          
          try {
            // Replace with your actual API call
            const response = await fetch('/api/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, userId: state.userId })
            });
            
            if (!response.ok) {
              throw new Error(`Failed to create item: ${response.status}`);
            }
            
            const newItem = await response.json();
            
            logger.info('Item created successfully', {
              action: 'create-item-success',
              itemId: newItem.id,
              userId: state.userId
            });
            
            state.addItem(newItem);
            
          } catch (error) {
            logger.error('Failed to create item', error, {
              action: 'create-item-error',
              userId: state.userId
            });
            
            state.setError(error.message || 'Failed to create item');
          } finally {
            state.setLoading(false);
          }
        },

        // ✅ UI actions
        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        setError: (error) => {
          logger.warn('Error set in store', {
            action: 'set-error',
            error,
            userId: get().userId
          });
          
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // ✅ Pagination actions
        setCurrentPage: (page) => {
          logger.debug('Page changed', {
            action: 'set-page',
            page,
            userId: get().userId
          });
          
          set({ currentPage: page });
        },

        // ✅ Utility actions
        reset: () => {
          logger.info('Resetting store', {
            action: 'reset',
            userId: get().userId
          });
          
          set(initialState);
        },

        initialize: (userId) => {
          logger.info('Initializing store', {
            action: 'initialize',
            userId,
            previousUserId: get().userId
          });
          
          // Reset if different user
          if (get().userId !== userId) {
            set({ ...initialState, userId });
          } else {
            set({ userId });
          }
        }
      };
    },
    {
      name: 'example-store',
      storage: createJSONStorage(() => localStorage),
      // ✅ Persist only necessary data
      partialize: (state) => ({
        items: state.items,
        selectedItem: state.selectedItem,
        currentPage: state.currentPage,
        userId: state.userId
      }),
      // ✅ Handle migration and versioning
      version: 1,
      migrate: (persistedState: any, version: number) => {
        const logger = Logger.getInstance();
        
        logger.info('Migrating store state', {
          component: 'example-store',
          action: 'migrate',
          fromVersion: version,
          toVersion: 1
        });
        
        // Handle migration logic here
        return persistedState;
      }
    }
  )
);

// ✅ Selector hooks for better performance
export const useExampleItems = () => useExampleStore((state) => state.items);
export const useExampleSelectedItem = () => useExampleStore((state) => state.selectedItem);
export const useExampleLoading = () => useExampleStore((state) => state.isLoading);
export const useExampleError = () => useExampleStore((state) => state.error);

// ✅ Action hooks for better organization
export const useExampleActions = () => {
  const store = useExampleStore();
  return {
    fetchItems: store.fetchItems,
    createItem: store.createItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    selectItem: store.selectItem,
    setCurrentPage: store.setCurrentPage,
    clearError: store.clearError,
    reset: store.reset,
    initialize: store.initialize
  };
}; 