"use client";

import React, { createContext, useContext } from 'react';
import { WorkspaceConfig, WorkspaceContextType } from './types';
import { useWorkspace, useWorkspaceState } from './use-workspace';

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

interface WorkspaceProviderProps {
  config: WorkspaceConfig;
  children: React.ReactNode;
}

export function WorkspaceProvider({ config, children }: WorkspaceProviderProps) {
  const workspace = useWorkspace(config);
  const { currentAction, setCurrentAction, actions } = useWorkspaceState();

  const contextValue: WorkspaceContextType = {
    config,
    workspace,
    actions,
    state: {
      currentAction,
      setCurrentAction,
    },
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
}

// Hook for accessing workspace data only
export function useWorkspaceData() {
  const { workspace } = useWorkspaceContext();
  return workspace;
}

// Hook for accessing workspace actions only
export function useWorkspaceActions() {
  const { actions } = useWorkspaceContext();
  return actions;
}

// Hook for accessing workspace config only
export function useWorkspaceConfig() {
  const { config } = useWorkspaceContext();
  return config;
}
