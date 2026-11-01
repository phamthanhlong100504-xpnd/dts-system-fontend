export type ProfileTheme = "LIGHT" | "DARK" | "SYSTEM";

export interface ProfileUser {
  id?: string;
  username?: string;
  fullName: string;
  email: string;
  roleLabel: string;
}

export interface ProfileFormValues {
  fullName: string;
  email: string;
}

export interface ProfileLearningInfo {
  licenseClass: string;
}

export interface ProfileSettings {
  theme: ProfileTheme;
}