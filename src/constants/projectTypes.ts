export type ProjectTypeOption = {
  id: string;
  label: string;
  description: string;
};

export const PROJECT_TYPE_OPTIONS: ProjectTypeOption[] = [
  {
    id: 'arr',
    label: 'ARR',
    description:
      'Afforestation, Reforestation, and Revegetation - Planting new trees and restoring degraded forests to sequester atmospheric carbon.',
  },
  {
    id: 'redd',
    label: 'REDD+',
    description:
      'Reducing Emissions from Deforestation and forest Degradation - Preserving existing forests in developing countries to prevent deforestation emissions.',
  },
  {
    id: 'regenerative-ag',
    label: 'Regenerative Agriculture',
    description:
      'Farming practices that increase soil carbon through cover crops, rotations, and reduced tillage.',
  },
  {
    id: 'ifm',
    label: 'IFM',
    description:
      'Improved Forest Management - Enhancing carbon storage in existing forests through better management practices.',
  },
  {
    id: 'blue-carbon',
    label: 'Blue Carbon',
    description:
      'Capturing and storing carbon in coastal ecosystems like mangroves and wetlands.',
  },
  {
    id: 'biochar',
    label: 'Biochar',
    description:
      'Heating organic biomass to create stable carbon-rich material lasting hundreds of years.',
  },
  {
    id: 'dac',
    label: 'DAC',
    description:
      'Direct Air Capture - Using technology to capture CO₂ directly from the atmosphere for storage or reuse.',
  },
  {
    id: 'erw',
    label: 'ERW',
    description:
      'Enhanced Rock Weathering - Spreading ground rocks on farmland to absorb atmospheric carbon through natural weathering.',
  },
  {
    id: 'beccs',
    label: 'BECCS',
    description:
      'Bioenergy with Carbon Capture and Storage - Capturing carbon from bioenergy production and storing it in geological formations.',
  },
  {
    id: 'renewable-energy',
    label: 'Renewable Energy',
    description:
      'Generating energy from wind, water, and sun to avoid fossil fuel emissions.',
  },
  {
    id: 'waste-management',
    label: 'Waste Management',
    description:
      'Reducing emissions through landfill gas capture and organic waste digestion.',
  },
  {
    id: 'household-devices',
    label: 'Household Devices',
    description:
      'Providing efficient cookstoves and water filters to reduce fossil fuel use.',
  },
  {
    id: 'awd',
    label: 'AWD',
    description:
      'Alternate Wetting and Drying - Periodically drying rice paddies to reduce methane emissions.',
  },
];