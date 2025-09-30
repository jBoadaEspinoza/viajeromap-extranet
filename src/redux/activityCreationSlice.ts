import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ItineraryItem {
  id: string;
  type: 'activity' | 'transfer';
  title: string;
  description?: string;
  location?: string;
  duration?: {
    hours: number;
    minutes: number;
  };
  vehicleType?: string; // For transfers
  activityType?: string; // For activities
}

interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  items: ItineraryItem[];
}

interface ActivityCreationState {
  activityId: string | null;
  selectedCategory: {
    id: number;
    name: string;
  } | null;
  currentStep: number;
  totalSteps: number;
  itinerary: ItineraryDay[];
}

// Clave para localStorage
const STORAGE_KEY = 'activityCreationState';

// Función para cargar estado desde localStorage
const loadStateFromStorage = (): Partial<ActivityCreationState> => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return {};
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return {};
  }
};

// Función para guardar estado en localStorage
const saveStateToStorage = (state: ActivityCreationState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
};

const initialState: ActivityCreationState = {
  activityId: null,
  selectedCategory: null,
  currentStep: 1,
  totalSteps: 10,
  itinerary: [],
  ...loadStateFromStorage() // Cargar estado guardado
};

const activityCreationSlice = createSlice({
  name: 'activityCreation',
  initialState,
  reducers: {
    setActivityId: (state, action: PayloadAction<string>) => {
      state.activityId = action.payload;
      saveStateToStorage(state); // Guardar al cambiar
    },
    setSelectedCategory: (state, action: PayloadAction<{ id: number; name: string }>) => {
      state.selectedCategory = action.payload;
      saveStateToStorage(state); // Guardar al cambiar
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
      saveStateToStorage(state); // Guardar al cambiar
    },
    resetActivityCreation: (state) => {
      state.activityId = null;
      state.selectedCategory = null;
      state.currentStep = 1;
      saveStateToStorage(state); // Guardar al cambiar
    },
    clearActivityCreation: (state) => {
      state.activityId = null;
      state.selectedCategory = null;
      state.currentStep = 1;
      saveStateToStorage(state); // Guardar al cambiar
    },
    addItineraryDay: (state, action: PayloadAction<ItineraryDay>) => {
      state.itinerary.push(action.payload);
      saveStateToStorage(state);
    },
    updateItineraryDay: (state, action: PayloadAction<{ id: string; updates: Partial<ItineraryDay> }>) => {
      const index = state.itinerary.findIndex(day => day.id === action.payload.id);
      if (index !== -1) {
        state.itinerary[index] = { ...state.itinerary[index], ...action.payload.updates };
        saveStateToStorage(state);
      }
    },
    removeItineraryDay: (state, action: PayloadAction<string>) => {
      state.itinerary = state.itinerary.filter(day => day.id !== action.payload);
      // Reorder day numbers
      state.itinerary.forEach((day, index) => {
        day.dayNumber = index + 1;
      });
      saveStateToStorage(state);
    },
    reorderItineraryDays: (state, action: PayloadAction<ItineraryDay[]>) => {
      state.itinerary = action.payload;
      saveStateToStorage(state);
    },
    addItineraryItem: (state, action: PayloadAction<{ dayId: string; item: ItineraryItem }>) => {
      const day = state.itinerary.find(d => d.id === action.payload.dayId);
      if (day) {
        day.items.push(action.payload.item);
        saveStateToStorage(state);
      }
    },
    updateItineraryItem: (state, action: PayloadAction<{ dayId: string; itemId: string; updates: Partial<ItineraryItem> }>) => {
      const day = state.itinerary.find(d => d.id === action.payload.dayId);
      if (day) {
        const item = day.items.find(i => i.id === action.payload.itemId);
        if (item) {
          Object.assign(item, action.payload.updates);
          saveStateToStorage(state);
        }
      }
    },
    removeItineraryItem: (state, action: PayloadAction<{ dayId: string; itemId: string }>) => {
      const day = state.itinerary.find(d => d.id === action.payload.dayId);
      if (day) {
        day.items = day.items.filter(i => i.id !== action.payload.itemId);
        saveStateToStorage(state);
      }
    }
  }
});

export const {
  setActivityId,
  setSelectedCategory,
  setCurrentStep,
  resetActivityCreation,
  clearActivityCreation,
  addItineraryDay,
  updateItineraryDay,
  removeItineraryDay,
  reorderItineraryDays,
  addItineraryItem,
  updateItineraryItem,
  removeItineraryItem
} = activityCreationSlice.actions;

export default activityCreationSlice.reducer; 