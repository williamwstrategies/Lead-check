import { BUSINESS_CATEGORIES } from '../../shared/leadcheck';

export const businessCategories = BUSINESS_CATEGORIES;

export const businessSubcategoryExamples: Record<string, string[]> = {
  'Home Services': ['Roofing', 'Landscaping', 'Plumbing', 'HVAC'],
  'Professional Services': ['Accounting', 'Legal Services', 'Consulting'],
  'Real Estate': ['Real Estate Agent', 'Property Management', 'Brokerage'],
  'Financial Services': ['Mortgage Broker', 'Financial Advisor', 'Bookkeeping'],
  Automotive: ['Auto Repair', 'Detailing', 'Tires'],
  'Health & Wellness': ['Chiropractic', 'Massage Therapy', 'Dental'],
  Retail: ['Boutique', 'Specialty Store', 'Ecommerce'],
  Hospitality: ['Restaurant', 'Cafe', 'Event Venue'],
  Other: ['Local Business', 'Service Business'],
};
