import { Order } from '@/types';

export const SAMPLE_ORDERS: Order[] = [
    {
        id: 'WO-1001',
        originalIndex: 0,
        values: {
            'Product': 'A-100 Aluminum Frame',
            'Color': 'Silver',
            'Size': 'Large',
            'Machine': 'CNC-01',
            'Material': 'Aluminum'
        }
    },
    {
        id: 'WO-1002',
        originalIndex: 1,
        values: {
            'Product': 'A-100 Aluminum Frame',
            'Color': 'Black',
            'Size': 'Large',
            'Machine': 'CNC-01',
            'Material': 'Aluminum'
        }
    },
    {
        id: 'WO-1003',
        originalIndex: 2,
        values: {
            'Product': 'B-200 Steel Bracket',
            'Color': 'Black',
            'Size': 'Medium',
            'Machine': 'CNC-02',
            'Material': 'Steel'
        }
    },
    {
        id: 'WO-1004',
        originalIndex: 3,
        values: {
            'Product': 'B-200 Steel Bracket',
            'Color': 'Red',
            'Size': 'Medium',
            'Machine': 'CNC-02',
            'Material': 'Steel'
        }
    },
    {
        id: 'WO-1005',
        originalIndex: 4,
        values: {
            'Product': 'C-300 Plastic Case',
            'Color': 'Red',
            'Size': 'Small',
            'Machine': 'INJ-01',
            'Material': 'Plastic'
        }
    },
    {
        id: 'WO-1006',
        originalIndex: 5,
        values: {
            'Product': 'C-300 Plastic Case',
            'Color': 'White',
            'Size': 'Small',
            'Machine': 'INJ-01',
            'Material': 'Plastic'
        }
    },
    {
        id: 'WO-1007',
        originalIndex: 6,
        values: {
            'Product': 'A-100 Aluminum Frame',
            'Color': 'Silver',
            'Size': 'Medium',
            'Machine': 'CNC-01',
            'Material': 'Aluminum'
        }
    }
];

export const SAMPLE_COLUMNS = ['Order ID', 'Product', 'Color', 'Size', 'Machine', 'Material'];
