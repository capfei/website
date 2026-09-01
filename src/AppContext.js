import React, { createContext, useContext, useReducer } from 'react';

// 1. Set up the initial state (what used to be in your Redux store)
const initialState = {
  user: null,
  theme: 'light'
};

// 2. The reducer handles actions exactly like Redux did
function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
}

// 3. Create the Context object
const AppContext = createContext();

// 4. Create the Provider component to wrap your app
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// 5. Create a custom hook so other files can grab the state easily
export const useAppContext = () => useContext(AppContext);