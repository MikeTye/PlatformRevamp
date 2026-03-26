
import {
  PROJECT_STAGE_OPTIONS,
  type ProjectStageOption,
} from './projectStages';
import {
  PROJECT_TYPE_OPTIONS,
  type ProjectTypeOption,
} from './projectTypes';
import countriesJson from '../data/countries.json';

export type OpportunityType =
  | 'Financing'
  | 'Technical Advisor'
  | 'Buyers'
  | 'MRV Provider'
  | 'Insurance';

export type SortField =
  | 'name'
  | 'developer'
  | 'stage'
  | 'type'
  | 'country'
  | 'updated';

export type SortDirection = 'asc' | 'desc';

export type CountryRecord = {
  name: string;
  states: string[];
};

export const PROJECT_LIST_STAGE_VALUES = PROJECT_STAGE_OPTIONS.map(
  (option: ProjectStageOption) => option.value
);

export const PROJECT_LIST_TYPE_OPTIONS: ProjectTypeOption[] = PROJECT_TYPE_OPTIONS;

export const PROJECT_LIST_COUNTRY_OPTIONS = (countriesJson as CountryRecord[]).map(
  (country) => country.name
);

export const PROJECT_OPPORTUNITY_OPTIONS: OpportunityType[] = [
  'Financing',
  'Technical Advisor',
  'Buyers',
  'MRV Provider',
  'Insurance',
];

export const PROJECTS_LIST_CARD_HEIGHT = 220;
export const PROJECTS_LIST_CARDS_PER_PAGE = 6;