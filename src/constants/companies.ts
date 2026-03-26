export const COMPANY_ROLE_OPTIONS = [
  {
    id: 'Project Developer',
    label: 'Project Developer',
    description: 'Develops and manages carbon projects',
  },
  {
    id: 'Service Provider',
    label: 'Service Provider',
    description: 'Provides services to carbon projects',
  },
] as const;

export const SERVICE_CATEGORY_OPTIONS = [
  'Climate tech',
  'MRV',
  'Validation support',
  'Methodology design',
  'Registry support',
  'Legal',
  'Project development',
  'Financing',
  'Brokerage / offtake',
  'Community engagement',
] as const;

export const REGION_OPTIONS = [
  'Southeast Asia',
  'South Asia',
  'East Asia',
  'Sub-Saharan Africa',
  'North Africa & Middle East',
  'Latin America',
  'Europe',
  'North America',
  'Oceania',
  'Global',
] as const;

export const COMPANY_TABS = [
  { value: 'all', label: 'All companies' },
  { value: 'mine', label: 'My companies' },
  { value: 'saved', label: 'Saved' },
] as const;

export const COMPANY_BUSINESS_FUNCTIONS = [
  'Project Developer',
  'Service Provider',
  'Consultant',
  'Investor',
  'Broker',
  'Registry',
  'Technology Provider',
  'Verifier',
  'Buyer',
  'Other',
] as const;

export const COMPANY_SORT_FIELDS = [
  { value: 'legalName', label: 'Name' },
  { value: 'country', label: 'Country' },
  { value: 'createdAt', label: 'Newest' },
] as const;

export type CompanyTab = (typeof COMPANY_TABS)[number]['value'];
export type CompanyBusinessFunction = (typeof COMPANY_BUSINESS_FUNCTIONS)[number];
export type CompanySortField = (typeof COMPANY_SORT_FIELDS)[number]['value'];

export const COMPANY_USER_ACCESS_OPTIONS = [
  { id: 'creator', label: 'Creator' },
  { id: 'viewer', label: 'Viewer' },
] as const;

export type CompanyUserAccessRole =
  (typeof COMPANY_USER_ACCESS_OPTIONS)[number]['id'];