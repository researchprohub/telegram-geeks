export interface BackendStatus { running: boolean; started: boolean; }

export interface WindowApi {
  backendStatus(): Promise<BackendStatus>;
  tokenGet(): Promise<string | null>;
  tokenSet(value: string): Promise<boolean>;
  tokenClear(): Promise<boolean>;
}

declare global {
  interface Window { api?: WindowApi; }
}

export interface ModuleRecord {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  operations: string[];
  tier: string;
  status: string;
}

export interface ModuleListResponse {
  total: number;
  active: number;
  categories: string[];
  module_categories: Record<string, string>;
  modules: ModuleRecord[];
}

export interface OperationParams {
  defaults: Record<string, unknown>;
  remap: Record<string, string>;
}

export interface ModuleParamsResponse {
  module_id: string;
  operations: Record<string, OperationParams>;
}