export interface IdProofConfig {
  id: string;
  name: string;
  placeholder: string;
  formatDescription: string;
  sampleFormat: string;
  rawMaxLength: number;
  inputMaxLength: number;
  badge: string;
  formatInput: (val: string) => string;
  validate: (val: string) => { isValid: boolean; error?: string; rawValue: string };
}

export const ID_CONFIGS: Record<string, IdProofConfig> = {
  'Aadhaar Card': {
    id: 'Aadhaar Card',
    name: 'Aadhaar Card (UIDAI)',
    placeholder: 'XXXX XXXX XXXX (e.g. 5432 8912 6743)',
    formatDescription: '12-digit number (cannot start with 0 or 1)',
    sampleFormat: '5432 8912 6743',
    rawMaxLength: 12,
    inputMaxLength: 14, // 12 digits + 2 spaces
    badge: '12 Digits (UIDAI)',
    formatInput: (val: string) => {
      // Keep only digits and slice to 12
      const digits = val.replace(/\D/g, '').slice(0, 12);
      // Group by 4 digits
      const parts = digits.match(/.{1,4}/g);
      return parts ? parts.join(' ') : digits;
    },
    validate: (val: string) => {
      const raw = val.replace(/\s+/g, '').replace(/\D/g, '');
      if (!raw) {
        return { isValid: false, error: 'Aadhaar number is required.', rawValue: raw };
      }
      if (raw.length !== 12) {
        return {
          isValid: false,
          error: `Aadhaar must be exactly 12 digits (currently ${raw.length}/12).`,
          rawValue: raw,
        };
      }
      if (/^[01]/.test(raw)) {
        return {
          isValid: false,
          error: 'Invalid Aadhaar: UIDAI numbers cannot start with 0 or 1.',
          rawValue: raw,
        };
      }
      return { isValid: true, rawValue: raw };
    },
  },

  'PAN Card': {
    id: 'PAN Card',
    name: 'PAN Card (Income Tax Dept)',
    placeholder: 'ABCDE1234F (5 letters + 4 digits + 1 letter)',
    formatDescription: '10-character alphanumeric (5 letters, 4 digits, 1 letter)',
    sampleFormat: 'ABCDE1234F',
    rawMaxLength: 10,
    inputMaxLength: 10,
    badge: '10 Characters (Alphanumeric)',
    formatInput: (val: string) => {
      return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    },
    validate: (val: string) => {
      const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!raw) {
        return { isValid: false, error: 'PAN number is required.', rawValue: raw };
      }
      if (raw.length !== 10) {
        return {
          isValid: false,
          error: `PAN must be exactly 10 characters (currently ${raw.length}/10).`,
          rawValue: raw,
        };
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(raw)) {
        return {
          isValid: false,
          error: 'Invalid PAN format. Must be 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).',
          rawValue: raw,
        };
      }
      return { isValid: true, rawValue: raw };
    },
  },

  'Passport': {
    id: 'Passport',
    name: 'Passport (Indian / International)',
    placeholder: 'Z1234567 (1 letter + 7 digits or 8-9 chars)',
    formatDescription: '8-character Indian passport (1 letter + 7 digits) or international alphanumeric',
    sampleFormat: 'Z1234567',
    rawMaxLength: 9,
    inputMaxLength: 9,
    badge: '8-9 Alphanumeric',
    formatInput: (val: string) => {
      return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
    },
    validate: (val: string) => {
      const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!raw) {
        return { isValid: false, error: 'Passport number is required.', rawValue: raw };
      }
      if (raw.length < 8 || raw.length > 9) {
        return {
          isValid: false,
          error: `Passport number must be 8 to 9 characters (currently ${raw.length}).`,
          rawValue: raw,
        };
      }
      // Indian standard: 1 letter + 7 digits or standard 8-9 alphanumeric
      const indianPassportRegex = /^[A-Z]{1}[0-9]{7}$/;
      const intlPassportRegex = /^[A-Z0-9]{8,9}$/;
      if (!indianPassportRegex.test(raw) && !intlPassportRegex.test(raw)) {
        return {
          isValid: false,
          error: 'Invalid Passport format. Expected e.g. Z1234567 or alphanumeric document ID.',
          rawValue: raw,
        };
      }
      return { isValid: true, rawValue: raw };
    },
  },

  'Voter ID Card': {
    id: 'Voter ID Card',
    name: 'Voter ID (Election Commission / EPIC)',
    placeholder: 'ABC1234567 (3 letters + 7 digits)',
    formatDescription: '10-character EPIC ID (3 uppercase letters + 7 digits)',
    sampleFormat: 'ABC1234567',
    rawMaxLength: 10,
    inputMaxLength: 10,
    badge: '10 Characters (EPIC)',
    formatInput: (val: string) => {
      return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    },
    validate: (val: string) => {
      const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!raw) {
        return { isValid: false, error: 'Voter ID is required.', rawValue: raw };
      }
      if (raw.length !== 10) {
        return {
          isValid: false,
          error: `Voter ID must be exactly 10 characters (currently ${raw.length}/10).`,
          rawValue: raw,
        };
      }
      const voterRegex = /^[A-Z]{3}[0-9]{7}$/;
      if (!voterRegex.test(raw)) {
        return {
          isValid: false,
          error: 'Invalid Voter ID format. Expected 3 letters + 7 digits (e.g. ABC1234567).',
          rawValue: raw,
        };
      }
      return { isValid: true, rawValue: raw };
    },
  },

  'Driving License': {
    id: 'Driving License',
    name: 'Indian Driving License (DL)',
    placeholder: 'RJ14 20180001234 (State code + RTO + Year + Number)',
    formatDescription: '15-16 character Indian DL (e.g. RJ14 20180001234)',
    sampleFormat: 'RJ14 20180001234',
    rawMaxLength: 16,
    inputMaxLength: 17, // with space
    badge: '15-16 Characters',
    formatInput: (val: string) => {
      const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
      if (cleaned.length > 4) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      }
      return cleaned;
    },
    validate: (val: string) => {
      const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!raw) {
        return { isValid: false, error: 'Driving License number is required.', rawValue: raw };
      }
      if (raw.length < 15 || raw.length > 16) {
        return {
          isValid: false,
          error: `Driving License must be 15 or 16 alphanumeric characters (currently ${raw.length}).`,
          rawValue: raw,
        };
      }
      // Must start with 2 state letters (e.g. DL, MH, RJ, KA, GJ, TN, UP, etc.)
      const dlStateRegex = /^[A-Z]{2}[0-9]{2}/;
      if (!dlStateRegex.test(raw)) {
        return {
          isValid: false,
          error: 'Invalid DL format: Must start with 2-letter state code + 2-digit RTO (e.g. RJ14, DL04, MH02).',
          rawValue: raw,
        };
      }
      return { isValid: true, rawValue: raw };
    },
  },
};

export const getIdConfig = (type: string): IdProofConfig => {
  // Normalize alias
  if (type === 'Voter ID' || type === 'Voter ID Card') {
    return ID_CONFIGS['Voter ID Card'];
  }
  return ID_CONFIGS[type] || ID_CONFIGS['Aadhaar Card'];
};

export const formatIdNumber = (type: string, value: string): string => {
  const config = getIdConfig(type);
  return config.formatInput(value);
};

export const validateIdNumber = (
  type: string,
  value: string
): { isValid: boolean; error?: string; rawValue: string } => {
  const config = getIdConfig(type);
  return config.validate(value);
};
