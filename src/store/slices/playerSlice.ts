import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ManaPool } from '../../interfaces/gameState.js'; 

export interface PlayerState {
  id: string | null;
  name: string | null;
  manaPool: ManaPool; 
  // Potentially other local player specific details
}

const initialState: PlayerState = {
  id: null, 
  name: null, 
  manaPool: {}, 
};

interface SetPlayerInfoPayload {
  id: string;
  name: string;
}

interface UpdateManaPoolPayload {
  playerId: string;
  manaPool: ManaPool;
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayerInfo: (state, action: PayloadAction<SetPlayerInfoPayload>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
    },
    // Potentially a reducer to clear player info on disconnect/logout
    clearPlayerInfo: (state) => {
      state.id = null;
      state.name = null;
      state.manaPool = {}; 
    },
    updateManaPool: (state, action: PayloadAction<UpdateManaPoolPayload>) => {
      // Only update if the mana pool belongs to the local player
      if (state.id && action.payload.playerId === state.id) {
        state.manaPool = action.payload.manaPool;
      }
    },
  },
});

export const { setPlayerInfo, clearPlayerInfo, updateManaPool } = playerSlice.actions;
export default playerSlice.reducer;
