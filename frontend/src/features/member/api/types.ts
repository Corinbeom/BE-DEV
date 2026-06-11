export type Member = {
  id: number;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  onboardingCompleted: boolean;
  targetRoles: string[];
};

