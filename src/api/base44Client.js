import { rawBase44 } from './rawBase44Client';

// NOTE:
// Keep frontend client unwrapped for Base44 Builder compatibility.
// Policy enforcement is applied at feature-level guards, not global SDK proxy level.
export const base44 = rawBase44;
