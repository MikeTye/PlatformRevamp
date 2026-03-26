import countriesJson from '../data/countries.json';

export type CountryStateOption = {
  name: string;
  states: string[];
};

export const COUNTRIES = countriesJson as CountryStateOption[];

export const COUNTRY_OPTIONS = COUNTRIES.map((country) => ({
  value: country.name,
  label: country.name,
}));

export const getStatesForCountry = (countryName: string): string[] => {
  return COUNTRIES.find((country) => country.name === countryName)?.states ?? [];
};