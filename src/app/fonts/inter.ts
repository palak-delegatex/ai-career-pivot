// Each loader exports the same Inter family; aliases only avoid JS name clashes.
// Keep all subset stylesheets while preloading only the unchanged Latin asset.
import { Inter as interCyrillicExt } from "./inter-cyrillic-ext";
import { Inter as interCyrillic } from "./inter-cyrillic";
import { Inter as interGreekExt } from "./inter-greek-ext";
import { Inter as interGreek } from "./inter-greek";
import { Inter as interVietnamese } from "./inter-vietnamese";
import { Inter as interLatinExt } from "./inter-latin-ext";
import { Inter as interLatin } from "./inter-latin";

export const interFontVariables = [
  interCyrillicExt.variable,
  interCyrillic.variable,
  interGreekExt.variable,
  interGreek.variable,
  interVietnamese.variable,
  interLatinExt.variable,
  interLatin.variable,
].join(" ");
