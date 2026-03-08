import { base44 } from '@/api/base44Client';

// Project entity - mapped from Company for construction context
export const Project = base44.entities.Company || {};
