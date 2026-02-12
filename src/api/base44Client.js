import { withPolicyEnforcement } from '@/lib/policyMiddleware';
import { rawBase44 } from './rawBase44Client';

export const base44 = withPolicyEnforcement(rawBase44);
