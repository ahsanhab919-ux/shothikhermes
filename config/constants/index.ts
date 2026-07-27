export type TLanguage = {
  name: string;
  code: string;
  flag: string;
  [key: string]: unknown;
};

export const LANGUAGES: Record<string, TLanguage> = {
  en: {
    name: "English",
    code: "en",
    flag: "/images/flags/usa.svg",
  },
  bn: {
    name: "Bangla",
    code: "bn",
    flag: "/images/flags/bn.svg",
  },
};

export type TSocial = {
  name: string;
  href: string;
  icon: string;
  [key: string]: unknown;
};

export const SOCIALS = [
  {
    name: "x",
    href: "https://x.com/dainikeidin",
    icon: "x",
    color: "#000000", // X (Twitter) black
  },
  {
    name: "facebook",
    href: "https://facebook.com/dainikeidin",
    icon: "facebook",
    color: "#1877F2", // Facebook blue
  },
  {
    name: "instagram",
    href: "https://instagram.com/dainikeidin",
    icon: "instagram",
    color: "#E1306C", // Instagram pink
  },
  {
    name: "linkedin",
    href: "https://linkedin.com/in/dainikeidin",
    icon: "linkedin",
    color: "#0A66C2", // LinkedIn blue
  },
];
