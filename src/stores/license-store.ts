import { create } from "zustand";

export type Tier = "free" | "pro";

export interface LicenseInfo {
  key: string;
  email: string;
  activatedAt: string;
  expiresAt: string | null;
}

export type Feature =
  | "unlimited-orders"
  | "unlimited-attributes"
  | "pdf-export"
  | "templates"
  | "summary-stats";

interface LicenseState {
  tier: Tier;
  license: LicenseInfo | null;
  isValidating: boolean;
  
  setLicense: (license: LicenseInfo) => void;
  clearLicense: () => void;
  setValidating: (isValidating: boolean) => void;
  
  // Logic
  checkFeature: (feature: Feature) => boolean;
  canAddAttribute: (currentCount: number) => boolean;
  canOptimizeOrders: (orderCount: number) => boolean;
}

export const FREE_ORDER_LIMIT = 50;
export const FREE_ATTRIBUTE_LIMIT = 3;

export const useLicenseStore = create<LicenseState>((set, get) => ({
  tier: "free",
  license: null,
  isValidating: false,
  
  setLicense: (license) => set({
    tier: "pro",
    license,
  }),
  
  clearLicense: () => set({
    tier: "free",
    license: null,
  }),
  
  setValidating: (isValidating) => set({ isValidating }),
  
  checkFeature: (feature) => {
    if (get().tier === "pro") return true;
    // Free tier features
    const freeFeatures: Feature[] = ["summary-stats"];
    return freeFeatures.includes(feature);
  },
  
  canAddAttribute: (currentCount) => {
    if (get().tier === "pro") return true;
    return currentCount < FREE_ATTRIBUTE_LIMIT;
  },
  
  canOptimizeOrders: (orderCount) => {
    if (get().tier === "pro") return true;
    return orderCount <= FREE_ORDER_LIMIT;
  },
}));

