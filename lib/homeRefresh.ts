import type { ScoredCountry } from "./types";

export type HomeRefreshStatus = "refreshing" | "live" | "baseline-error";

export interface HomeRefreshState {
  status: HomeRefreshStatus;
  countries: ScoredCountry[];
  lastUpdated: string | null;
  usingLive: boolean;
  error: string | null;
}

export type HomeRefreshAction =
  | { type: "refresh" }
  | {
      type: "success";
      countries: ScoredCountry[];
      lastUpdated: string;
      usingLive: boolean;
    }
  | { type: "error"; message: string };

export function createHomeRefreshState(countries: ScoredCountry[]): HomeRefreshState {
  return {
    status: "refreshing",
    countries,
    lastUpdated: null,
    usingLive: false,
    error: null,
  };
}

export function homeRefreshReducer(
  state: HomeRefreshState,
  action: HomeRefreshAction,
): HomeRefreshState {
  if (action.type === "refresh") {
    return { ...state, status: "refreshing", error: null };
  }
  if (action.type === "success") {
    return {
      status: "live",
      countries: action.countries,
      lastUpdated: action.lastUpdated,
      usingLive: action.usingLive,
      error: null,
    };
  }
  return {
    ...state,
    status: "baseline-error",
    usingLive: false,
    error: action.message,
  };
}
