import { describe, it, expect, beforeEach } from 'vitest';
import { useLicenseStore, FREE_ORDER_LIMIT, FREE_ATTRIBUTE_LIMIT, type LicenseInfo } from '@/stores/license-store';
import { useDataStore } from '@/stores/data-store';
import type { ParsedFile } from '@/types';

// Test helper: Create mock parsed file with specific row count
function createMockFile(rowCount: number, columns = ['ID', 'Color', 'Size']): ParsedFile {
  return {
    name: `test-${rowCount}.xlsx`,
    path: `/mock/test-${rowCount}.xlsx`,
    sheets: ['Sheet1'],
    activeSheet: 'Sheet1',
    rows: Array.from({ length: rowCount }, (_, i) => ({
      ID: `ORD-${String(i + 1).padStart(3, '0')}`,
      Color: i % 2 === 0 ? 'Red' : 'Blue',
      Size: i % 3 === 0 ? 'Large' : 'Small',
    })),
    columns,
    rowCount,
  };
}

// Test helper: Set pro license
function setProLicense() {
  const licenseInfo: LicenseInfo = {
    key: 'test-pro-key-12345',
    email: 'test@example.com',
    activatedAt: new Date().toISOString(),
    expiresAt: null,
  };
  useLicenseStore.getState().setLicense(licenseInfo);
}

describe('License Enforcement Integration', () => {
  beforeEach(() => {
    // Reset all stores to clean state
    useDataStore.getState().reset();
    useLicenseStore.getState().clearLicense();
  });

  describe('Free Tier - Order Limits', () => {
    it('should allow optimization with exactly 50 orders', () => {
      const licenseStore = useLicenseStore.getState();

      const canOptimize = licenseStore.canOptimizeOrders(50);

      expect(canOptimize).toBe(true);
      expect(licenseStore.tier).toBe('free');
    });

    it('should block optimization with 51 orders', () => {
      const licenseStore = useLicenseStore.getState();

      const canOptimize = licenseStore.canOptimizeOrders(51);

      expect(canOptimize).toBe(false);
    });

    it('should block optimization with 100 orders', () => {
      const licenseStore = useLicenseStore.getState();

      const canOptimize = licenseStore.canOptimizeOrders(100);

      expect(canOptimize).toBe(false);
    });

    it('should update order count dynamically when file changes', () => {
      const licenseStore = useLicenseStore.getState();

      // First file: 30 orders (within limit)
      useDataStore.getState().setSourceFile(createMockFile(30));
      const firstFile = useDataStore.getState().sourceFile!;
      expect(licenseStore.canOptimizeOrders(firstFile.rowCount)).toBe(true);

      // Second file: 60 orders (exceeds limit)
      useDataStore.getState().setSourceFile(createMockFile(60));
      const secondFile = useDataStore.getState().sourceFile!;
      expect(licenseStore.canOptimizeOrders(secondFile.rowCount)).toBe(false);
    });

    it('should integrate with data store rowCount', () => {
      const licenseStore = useLicenseStore.getState();

      // Load file with 55 orders
      const file = createMockFile(55);
      useDataStore.getState().setSourceFile(file);

      // Verify store state matches file
      const currentState = useDataStore.getState();
      expect(currentState.sourceFile?.rowCount).toBe(55);

      // Verify license check uses correct count
      const canProceed = licenseStore.canOptimizeOrders(currentState.sourceFile!.rowCount);
      expect(canProceed).toBe(false);
    });
  });

  describe('Free Tier - Attribute Limits', () => {
    it('should allow adding exactly 3 attributes', () => {
      const licenseStore = useLicenseStore.getState();

      // Add 3 attributes
      useDataStore.getState().addAttribute('Color', 15);
      useDataStore.getState().addAttribute('Size', 10);
      useDataStore.getState().addAttribute('Material', 20);

      const currentState = useDataStore.getState();
      expect(currentState.config.attributes).toHaveLength(3);

      // Can add 3rd attribute (count before adding = 2)
      expect(licenseStore.canAddAttribute(2)).toBe(true);

      // Cannot add 4th attribute (count after adding 3 = 3)
      expect(licenseStore.canAddAttribute(3)).toBe(false);
    });

    it('should block adding 4th attribute', () => {
      const licenseStore = useLicenseStore.getState();

      // Check if can add when already at limit
      const canAdd = licenseStore.canAddAttribute(3);

      expect(canAdd).toBe(false);
    });

    it('should allow adding after removing one attribute', () => {
      const licenseStore = useLicenseStore.getState();

      // Add 3 attributes (at limit)
      useDataStore.getState().addAttribute('Color', 15);
      useDataStore.getState().addAttribute('Size', 10);
      useDataStore.getState().addAttribute('Material', 20);
      expect(useDataStore.getState().config.attributes).toHaveLength(3);

      // Cannot add 4th
      expect(licenseStore.canAddAttribute(3)).toBe(false);

      // Remove one
      useDataStore.getState().removeAttribute('Size');
      expect(useDataStore.getState().config.attributes).toHaveLength(2);

      // Can now add again
      expect(licenseStore.canAddAttribute(2)).toBe(true);
    });

    it('should integrate with data store attribute array', () => {
      const licenseStore = useLicenseStore.getState();

      // Start empty
      expect(licenseStore.canAddAttribute(useDataStore.getState().config.attributes.length)).toBe(true);

      // Add attributes one by one
      useDataStore.getState().addAttribute('Color', 15);
      expect(licenseStore.canAddAttribute(useDataStore.getState().config.attributes.length)).toBe(true);

      useDataStore.getState().addAttribute('Size', 10);
      expect(licenseStore.canAddAttribute(useDataStore.getState().config.attributes.length)).toBe(true);

      useDataStore.getState().addAttribute('Material', 20);
      expect(licenseStore.canAddAttribute(useDataStore.getState().config.attributes.length)).toBe(false);
    });
  });

  describe('Pro Tier - Unlimited Access', () => {
    it('should allow optimization with 1000+ orders on pro tier', () => {
      setProLicense();

      const licenseStore = useLicenseStore.getState();

      expect(licenseStore.tier).toBe('pro');
      expect(licenseStore.canOptimizeOrders(1000)).toBe(true);
      expect(licenseStore.canOptimizeOrders(10000)).toBe(true);
    });

    it('should allow adding 10+ attributes on pro tier', () => {
      setProLicense();

      const licenseStore = useLicenseStore.getState();

      expect(licenseStore.tier).toBe('pro');
      expect(licenseStore.canAddAttribute(10)).toBe(true);
      expect(licenseStore.canAddAttribute(100)).toBe(true);
    });

    it('should transition from free to pro and lift restrictions', () => {
      // Start on free tier
      expect(useLicenseStore.getState().tier).toBe('free');

      // Add 3 attributes (max for free)
      useDataStore.getState().addAttribute('Color', 15);
      useDataStore.getState().addAttribute('Size', 10);
      useDataStore.getState().addAttribute('Material', 20);

      // Load 50 orders (max for free)
      useDataStore.getState().setSourceFile(createMockFile(50));

      // Verify at limit
      const freeTierStore = useLicenseStore.getState();
      expect(freeTierStore.canAddAttribute(3)).toBe(false);
      expect(freeTierStore.canOptimizeOrders(50)).toBe(true);
      expect(freeTierStore.canOptimizeOrders(51)).toBe(false);

      // Upgrade to pro
      setProLicense();

      // Verify restrictions lifted (get fresh store reference)
      const proTierStore = useLicenseStore.getState();
      expect(proTierStore.tier).toBe('pro');
      expect(proTierStore.canAddAttribute(3)).toBe(true);
      expect(proTierStore.canAddAttribute(10)).toBe(true);
      expect(proTierStore.canOptimizeOrders(51)).toBe(true);
      expect(proTierStore.canOptimizeOrders(1000)).toBe(true);
    });
  });

  describe('Feature Checks', () => {
    it('should block PDF export on free tier', () => {
      const licenseStore = useLicenseStore.getState();

      expect(licenseStore.tier).toBe('free');
      expect(licenseStore.checkFeature('pdf-export')).toBe(false);
    });

    it('should allow summary-stats on free tier', () => {
      const licenseStore = useLicenseStore.getState();

      expect(licenseStore.tier).toBe('free');
      expect(licenseStore.checkFeature('summary-stats')).toBe(true);
    });

    it('should allow all features on pro tier', () => {
      setProLicense();

      const licenseStore = useLicenseStore.getState();

      expect(licenseStore.tier).toBe('pro');
      expect(licenseStore.checkFeature('pdf-export')).toBe(true);
      expect(licenseStore.checkFeature('templates')).toBe(true);
      expect(licenseStore.checkFeature('unlimited-orders')).toBe(true);
      expect(licenseStore.checkFeature('unlimited-attributes')).toBe(true);
      expect(licenseStore.checkFeature('summary-stats')).toBe(true);
    });
  });

  describe('License Limit Constants', () => {
    it('should verify free tier constants match implementation', () => {
      expect(FREE_ORDER_LIMIT).toBe(50);
      expect(FREE_ATTRIBUTE_LIMIT).toBe(3);
    });

    it('should use constants consistently in limit checks', () => {
      const licenseStore = useLicenseStore.getState();

      // Order limit
      expect(licenseStore.canOptimizeOrders(FREE_ORDER_LIMIT)).toBe(true);
      expect(licenseStore.canOptimizeOrders(FREE_ORDER_LIMIT + 1)).toBe(false);

      // Attribute limit
      expect(licenseStore.canAddAttribute(FREE_ATTRIBUTE_LIMIT - 1)).toBe(true);
      expect(licenseStore.canAddAttribute(FREE_ATTRIBUTE_LIMIT)).toBe(false);
    });
  });
});
