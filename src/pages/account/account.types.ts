export type CompanyOption = {
  id: string;
  name: string;
};

export type AffiliationItem = {
  id?: string;
  companyId: string | null;
  companyName: string;
  role: string;
  permission: 'creator' | 'viewer';
};

export type AccountPayload = {
  user: {
    id: string;
    email: string;
  };
  profile: {
    fullName: string;
    headline: string;
    jobTitle: string;
    bio: string;
    phoneNumber: string;
    contactEmail: string;
    country: string;
    city: string;
    timezone: string;
    roleType: string;
    expertiseTags: string[];
    serviceOfferings: string[];
    sectors: string[];
    standards: string[];
    languages: string[];
    personalWebsite: string;
    linkedinUrl: string;
    portfolioUrl: string;
    isPublic: boolean;
    showPhone: boolean;
    showContactEmail: boolean;
  };
  affiliations: AffiliationItem[];
};

export type SaveAccountPayload = {
  profile: AccountPayload['profile'];
  affiliations: Array<{
    id?: string;
    companyId: string | null;
    role: string;
    permission: 'creator' | 'viewer';
  }>;
};

export type AccountTabKey = 'profile' | 'companies' | 'projects' | 'opportunities';