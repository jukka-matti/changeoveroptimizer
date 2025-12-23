import { describe, it, expect } from 'vitest';
import { parseFile, detectOrderIdColumn, detectAttributeColumns } from './parser';

describe('Parser Service', () => {
  it('should detect likely Order ID columns', () => {
    const columns = ['Item', 'Order_ID', 'Date', 'Qty'];
    expect(detectOrderIdColumn(columns)).toBe('Order_ID');
    
    const columns2 = ['Job Number', 'Product', 'Status'];
    expect(detectOrderIdColumn(columns2)).toBe('Job Number');

    const columns3 = ['PO#', 'Customer', 'Deadline'];
    expect(detectOrderIdColumn(columns3)).toBe('PO#');

    const columns4 = ['WorkOrder_Ref', 'Line', 'Shift'];
    expect(detectOrderIdColumn(columns4)).toBe('WorkOrder_Ref');
  });

  it('should detect likely attribute columns', () => {
    const columns = ['Order ID', 'Color', 'Material', 'Quantity', 'Notes'];
    const attributes = detectAttributeColumns(columns, 'Order ID');
    expect(attributes).toContain('Color');
    expect(attributes).toContain('Material');
    expect(attributes).not.toContain('Order ID');
    expect(attributes).not.toContain('Quantity');
  });

  // Basic validation of parseFile interface (without full SheetJS execution)
  it('should reject unsupported formats', async () => {
    const result = await parseFile(new ArrayBuffer(0), 'test.txt');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
    }
  });

  describe('Heuristics', () => {
    it('should ignore case when detecting Order ID', () => {
      expect(detectOrderIdColumn(['orderid', 'status'])).toBe('orderid');
      expect(detectOrderIdColumn(['ORDER_NO', 'status'])).toBe('ORDER_NO');
    });

    it('should exclude common non-attribute columns', () => {
      const columns = ['ID', 'DATE', 'QTY', 'PRICE', 'NOTES', 'COLOR'];
      const attributes = detectAttributeColumns(columns, 'ID');
      expect(attributes).toEqual(['COLOR']);
    });
  });
});

