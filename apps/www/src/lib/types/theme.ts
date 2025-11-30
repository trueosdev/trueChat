export interface ColorTheme {
  name: string;
  light: {
    primary: string;      // HSL format: "hue saturation lightness"
    secondary: string;
    background: string;
    foreground: string;
  };
  dark: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
  };
}

export const colorThemes: ColorTheme[] = [
  {
    name: "Black & White",
    light: {
      primary: "0 0% 9%",
      secondary: "0 0% 100%",
      background: "0 0% 100%",
      foreground: "0 0% 9%",
    },
    dark: {
      primary: "0 0% 100%",
      secondary: "0 0% 9%",
      background: "0 0% 9%",
      foreground: "0 0% 100%",
    },
  },
  {
    name: "Blue & White",
    light: {
      primary: "217 91% 60%",
      secondary: "0 0% 100%",
      background: "0 0% 100%",
      foreground: "217 91% 20%",
    },
    dark: {
      primary: "217 91% 60%",
      secondary: "217 91% 15%",
      background: "217 91% 10%",
      foreground: "217 91% 90%",
    },
  },
  {
    name: "Purple & White",
    light: {
      primary: "262 83% 58%",
      secondary: "0 0% 100%",
      background: "0 0% 100%",
      foreground: "262 83% 20%",
    },
    dark: {
      primary: "262 83% 65%",
      secondary: "262 83% 15%",
      background: "262 83% 10%",
      foreground: "262 83% 90%",
    },
  },
  {
    name: "Green & Black",
    light: {
      primary: "142 76% 36%",
      secondary: "0 0% 9%",
      background: "0 0% 100%",
      foreground: "142 76% 15%",
    },
    dark: {
      primary: "142 76% 50%",
      secondary: "142 76% 10%",
      background: "0 0% 9%",
      foreground: "142 76% 85%",
    },
  },
  {
    name: "Red & White",
    light: {
      primary: "0 84% 60%",
      secondary: "0 0% 100%",
      background: "0 0% 100%",
      foreground: "0 84% 20%",
    },
    dark: {
      primary: "0 84% 60%",
      secondary: "0 84% 15%",
      background: "0 84% 10%",
      foreground: "0 84% 90%",
    },
  },
  {
    name: "Orange & Black",
    light: {
      primary: "25 95% 53%",
      secondary: "0 0% 9%",
      background: "0 0% 100%",
      foreground: "25 95% 20%",
    },
    dark: {
      primary: "25 95% 60%",
      secondary: "25 95% 10%",
      background: "0 0% 9%",
      foreground: "25 95% 85%",
    },
  },
];

