import type { StoreApi, SetState, GetState } from "zustand";
import { create, useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { createContext, useContext } from "react";
import type { RouterInputs } from "~/utils/api";

export interface CustomAppContext {
  search: string;
  setSearch: (search: string) => void;
  caseId: string | undefined;
  setCaseId: (c: string | undefined) => void;
}

// Define a type for the log function's configuration
type ConfigFn<T extends object> = (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) => T;

// Define the log function with the correct types
const logger =
  <T extends object>(config: ConfigFn<T>) =>
  (set: SetState<T>, get: GetState<T>, api: StoreApi<T>) =>
    config(
      (...args) => {
        console.groupCollapsed(`Zustand - ${Object.keys(args[0] || {})[0] || "Unknown state change"}`);
        console.log("==> Applying new state", args);
        set(...args);
        console.log("==> New State", get());
        console.groupEnd();
      },
      get,
      api,
    );

export const defaultQuery = {
  search: "",
} satisfies NonNullable<RouterInputs["krollRouter"]["getAllCases"]>;
export const createFormStore = () =>
  create<CustomAppContext>()(
    devtools(
      logger((set) => ({
        search: defaultQuery.search,
        setSearch: (search: string) => set({ search }),
        caseId: undefined,
        setCaseId: (caseId: string | undefined) => set({ caseId }),
      })),
    ),
  );

export const appStore = createFormStore();

export const AppContext = createContext<ReturnType<typeof createFormStore> | null>(appStore);

export function useApp<T>(selector: (state: CustomAppContext) => T) {
  return useStore(useContext(AppContext)!, selector);
}
