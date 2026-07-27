import React, { createContext, useContext, useReducer, useMemo } from 'react';

const initialState = {
  agentType: 'super', // 'super' or 'presentation'
  formData: {},
  response: null,
  loading: false,
  error: null,
  history: [],
  config: {},
};

function agentReducer(state, action) {
  switch (action.type) {
    case 'SET_AGENT_TYPE':
      return { ...state, agentType: action.payload };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_RESPONSE':
      return { ...state, response: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history] };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'RESET':
      return { ...initialState, agentType: state.agentType };
    default:
      return state;
  }
}

const AgentContext = createContext();

export const AgentContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  const value = useMemo(() => ({
    ...state,
    setAgentType: (type) => dispatch({ type: 'SET_AGENT_TYPE', payload: type }),
    setFormData: (data) => dispatch({ type: 'SET_FORM_DATA', payload: data }),
    setResponse: (resp) => dispatch({ type: 'SET_RESPONSE', payload: resp }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (err) => dispatch({ type: 'SET_ERROR', payload: err }),
    addHistory: (item) => dispatch({ type: 'ADD_HISTORY', payload: item }),
    setConfig: (cfg) => dispatch({ type: 'SET_CONFIG', payload: cfg }),
    reset: () => dispatch({ type: 'RESET' }),
  }), [state]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgentContext = () => {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgentContext must be used within AgentContextProvider');
  return ctx;
}; 