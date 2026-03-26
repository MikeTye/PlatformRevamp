export type ProjectStageOption = {
  value: string;
  label: string;
  description: string;
};

export const PROJECT_STAGE_OPTIONS: ProjectStageOption[] = [
  {
    value: 'Exploration',
    label: 'Exploration',
    description:
      'A potential carbon project is being explored, but no specific project, assets, or boundaries have been formally defined.',
  },
  {
    value: 'Concept',
    label: 'Concept',
    description:
      'A specific carbon project is defined in principle, with identified assets, boundaries, and an intended carbon pathway.',
  },
  {
    value: 'Design',
    label: 'Design',
    description:
      'The carbon project is materially designed, with core assumptions, documentation, and monitoring approach drafted.',
  },
  {
    value: 'Listed',
    label: 'Listed',
    description:
      'The project has been formally submitted to a standard or registry and is listed for validation review.',
  },
  {
    value: 'Validation',
    label: 'Validation',
    description:
      'The project is undergoing third-party validation against the selected standard and methodology.',
  },
  {
    value: 'Registered',
    label: 'Registered',
    description:
      'The project is approved and registered, eligible to generate credits once monitoring conditions are met.',
  },
  {
    value: 'Issued',
    label: 'Issued',
    description:
      'Verified emission reductions or removals have been issued as credits in a registry.',
  },
];