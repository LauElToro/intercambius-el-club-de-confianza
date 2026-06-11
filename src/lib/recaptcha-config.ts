export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? '';

export const isRecaptchaEnabled = RECAPTCHA_SITE_KEY.length > 0;
