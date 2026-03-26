import ParkRounded from '@mui/icons-material/ParkRounded';
import BuildRounded from '@mui/icons-material/BuildRounded';
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import ExploreRounded from '@mui/icons-material/ExploreRounded';

export type OnboardingUserRoleId =
    | 'develop'
    | 'services'
    | 'buy'
    | 'invest'
    | 'research'
    | 'exploring';

export type OnboardingUserRoleOption = {
    id: OnboardingUserRoleId;
    label: string;
    icon: typeof ParkRounded;
    description: string;
};

export const ONBOARDING_USER_ROLE_OPTIONS: OnboardingUserRoleOption[] = [
    {
        id: 'develop',
        label: 'Develop carbon projects',
        icon: ParkRounded,
        description: 'Create and manage carbon offset projects',
    },
    {
        id: 'services',
        label: 'Provide services to carbon projects',
        icon: BuildRounded,
        description: 'Offer MRV, legal, technical, or other services',
    },
    {
        id: 'buy',
        label: 'Buy carbon credits',
        icon: ShoppingCartRounded,
        description: 'Purchase credits for offsetting or compliance',
    },
    {
        id: 'invest',
        label: 'Invest or fund projects',
        icon: TrendingUpRounded,
        description: 'Provide financing or investment capital',
    },
    {
        id: 'research',
        label: 'Research, NGO, or policy work',
        icon: MenuBookRounded,
        description: 'Academic, non-profit, or government activities',
    },
    {
        id: 'exploring',
        label: 'Just exploring',
        icon: ExploreRounded,
        description: 'Learning about the carbon market',
    },
];