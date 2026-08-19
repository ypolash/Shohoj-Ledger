import { GET } from './app/api/crm/sales-orders/[id]/route.ts';
import { NextRequest } from 'next/server';

// Mock getCompanyId
jest.mock('@/lib/company/companyFilter', () => ({
  getCompanyId: async () => 'some-company-id'
}));
