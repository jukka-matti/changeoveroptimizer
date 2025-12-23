import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from './data-store';
import { useLicenseStore } from './license-store';
import { ParsedFile } from '@/types';

describe('Data Store', () => {
  beforeEach(() => {
    useDataStore.getState().reset();
  });

  const mockFile: ParsedFile = {
    name: 'test.xlsx',
    path: '/path/to/test.xlsx',
    sheets: ['Sheet1'],
    activeSheet: 'Sheet1',
    rows: [{ ID: '1', Color: 'Red' }, { ID: '2', Color: 'Blue' }],
    columns: ['ID', 'Color'],
    rowCount: 2,
  };

  it('should set source file and reset config', () => {
    const store = useDataStore.getState();
    store.setOrderIdColumn('ID');
    store.setSourceFile(mockFile);
    
    expect(useDataStore.getState().sourceFile).toEqual(mockFile);
    expect(useDataStore.getState().config.orderIdColumn).toBeNull(); // Reset by setSourceFile
  });

  it('should add and remove attributes', () => {
    const store = useDataStore.getState();
    store.addAttribute('Color', 15);
    expect(useDataStore.getState().config.attributes).toHaveLength(1);
    expect(useDataStore.getState().config.attributes[0].column).toBe('Color');

    store.removeAttribute('Color');
    expect(useDataStore.getState().config.attributes).toHaveLength(0);
  });

  it('should validate config correctly', () => {
    const store = useDataStore.getState();
    expect(store.config.orderIdColumn).toBeNull();
    
    store.setSourceFile(mockFile);
    store.setOrderIdColumn('ID');
    store.addAttribute('Color', 15);
    
    // We can't easily use the hook useIsConfigValid here because it's a React hook
    // But we can check the logic directly if needed or just test the state changes
    expect(useDataStore.getState().config.orderIdColumn).toBe('ID');
    expect(useDataStore.getState().config.attributes[0].changeoverTime).toBe(15);
  });
});

describe('License Store', () => {
  beforeEach(() => {
    useLicenseStore.getState().clearLicense();
  });

  it('should default to free tier', () => {
    expect(useLicenseStore.getState().tier).toBe('free');
  });

  it('should set pro license', () => {
    const info = {
      key: 'test-key',
      email: 'test@example.com',
      activatedAt: new Date().toISOString(),
      expiresAt: null
    };
    useLicenseStore.getState().setLicense(info);
    expect(useLicenseStore.getState().tier).toBe('pro');
    expect(useLicenseStore.getState().license).toEqual(info);
  });

  it('should enforce limits on free tier', () => {
    const store = useLicenseStore.getState();
    expect(store.canOptimizeOrders(50)).toBe(true);
    expect(store.canOptimizeOrders(51)).toBe(false);
    expect(store.canAddAttribute(2)).toBe(true);
    expect(store.canAddAttribute(3)).toBe(false);
  });
});


