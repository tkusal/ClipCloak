export type SupportedLanguage = 'en' | 'pt';

export function getSystemLanguage(): SupportedLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale.toLowerCase().startsWith('pt')) {
      return 'pt';
    }
  } catch (e) {
    // fallback
  }
  
  // Check env vars as fallback
  const envLang = process.env.LANG || process.env.LANGUAGE || '';
  if (envLang.toLowerCase().startsWith('pt')) {
    return 'pt';
  }

  return 'en';
}

type Translations = {
  [key: string]: {
    en: string;
    pt: string;
  };
};

export class I18n {
  private lang: SupportedLanguage;

  constructor(lang?: SupportedLanguage) {
    this.lang = lang || getSystemLanguage();
  }

  public get(key: string, translations: Translations, ...args: string[]): string {
    const entry = translations[key];
    if (!entry) return key;

    let text = entry[this.lang] || entry['en'];
    
    // Replace {0}, {1}, etc.
    args.forEach((arg, index) => {
      text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
    });

    return text;
  }

  public setLanguage(lang: SupportedLanguage) {
    this.lang = lang;
  }
}

export const i18n = new I18n();
