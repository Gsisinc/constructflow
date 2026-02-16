/**
 * Construction Symbols Library
 * Comprehensive set of construction symbols for the designer tool
 * Includes electrical, fire alarm, low voltage, HVAC, plumbing, structural, etc.
 */

export const SYMBOL_CATEGORIES = {
  ELECTRICAL: 'electrical',
  FIRE_ALARM: 'fire_alarm',
  LOW_VOLTAGE: 'low_voltage',
  HVAC: 'hvac',
  PLUMBING: 'plumbing',
  STRUCTURAL: 'structural',
  DOORS_WINDOWS: 'doors_windows',
  FIXTURES: 'fixtures',
  SECURITY: 'security',
  ACCESSIBILITY: 'accessibility'
};

/**
 * Construction symbols organized by category
 * Each symbol has SVG path data for rendering
 */
export const CONSTRUCTION_SYMBOLS = {
  // ========== ELECTRICAL SYMBOLS ==========
  [SYMBOL_CATEGORIES.ELECTRICAL]: [
    {
      id: 'outlet_duplex',
      name: 'Duplex Outlet',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="15" cy="15" r="3" fill="black"/>
        <circle cx="15" cy="25" r="3" fill="black"/>
        <circle cx="25" cy="15" r="3" fill="black"/>
        <circle cx="25" cy="25" r="3" fill="black"/>
      </svg>`,
      description: 'Standard duplex electrical outlet'
    },
    {
      id: 'outlet_gfci',
      name: 'GFCI Outlet',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="15" cy="15" r="3" fill="black"/>
        <circle cx="15" cy="25" r="3" fill="black"/>
        <circle cx="25" cy="15" r="3" fill="black"/>
        <circle cx="25" cy="25" r="3" fill="black"/>
        <text x="20" y="35" font-size="8" text-anchor="middle" font-weight="bold">GFI</text>
      </svg>`,
      description: 'Ground Fault Circuit Interrupter outlet'
    },
    {
      id: 'outlet_240v',
      name: '240V Outlet',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="black"/>
        <circle cx="28" cy="12" r="3" fill="black"/>
        <circle cx="20" cy="28" r="3" fill="black"/>
        <line x1="20" y1="20" x2="20" y2="28" stroke="black" stroke-width="1"/>
      </svg>`,
      description: '240V three-prong outlet'
    },
    {
      id: 'switch_single',
      name: 'Single Pole Switch',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="20" cy="20" r="2" fill="black"/>
        <line x1="20" y1="12" x2="20" y2="28" stroke="black" stroke-width="1"/>
      </svg>`,
      description: 'Single pole light switch'
    },
    {
      id: 'switch_3way',
      name: '3-Way Switch',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="15" cy="20" r="2" fill="black"/>
        <circle cx="25" cy="20" r="2" fill="black"/>
        <line x1="15" y1="20" x2="25" y2="20" stroke="black" stroke-width="1"/>
      </svg>`,
      description: '3-way light switch'
    },
    {
      id: 'switch_dimmer',
      name: 'Dimmer Switch',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="20" cy="20" r="3" fill="black"/>
        <path d="M 20 14 A 6 6 0 0 1 26 20" stroke="black" stroke-width="1" fill="none"/>
      </svg>`,
      description: 'Dimmer switch'
    },
    {
      id: 'light_ceiling',
      name: 'Ceiling Light',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="8" fill="none" stroke="black" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="black"/>
        <line x1="20" y1="12" x2="20" y2="5" stroke="black" stroke-width="1.5"/>
      </svg>`,
      description: 'Ceiling mounted light fixture'
    },
    {
      id: 'light_wall',
      name: 'Wall Light',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="12" width="20" height="16" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <circle cx="20" cy="20" r="3" fill="black"/>
      </svg>`,
      description: 'Wall mounted light fixture'
    },
    {
      id: 'breaker_panel',
      name: 'Breaker Panel',
      category: SYMBOL_CATEGORIES.ELECTRICAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" stroke-width="2" rx="2"/>
        <line x1="12" y1="12" x2="12" y2="33" stroke="black" stroke-width="1"/>
        <line x1="20" y1="12" x2="20" y2="33" stroke="black" stroke-width="1"/>
        <line x1="28" y1="12" x2="28" y2="33" stroke="black" stroke-width="1"/>
        <circle cx="12" cy="16" r="1.5" fill="black"/>
        <circle cx="12" cy="22" r="1.5" fill="black"/>
        <circle cx="20" cy="16" r="1.5" fill="black"/>
        <circle cx="20" cy="22" r="1.5" fill="black"/>
        <circle cx="28" cy="16" r="1.5" fill="black"/>
        <circle cx="28" cy="22" r="1.5" fill="black"/>
      </svg>`,
      description: 'Electrical breaker panel'
    }
  ],

  // ========== FIRE ALARM SYMBOLS ==========
  [SYMBOL_CATEGORIES.FIRE_ALARM]: [
    {
      id: 'fire_alarm_horn',
      name: 'Fire Alarm Horn',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="12" fill="none" stroke="red" stroke-width="2"/>
        <path d="M 10 20 L 8 18 L 8 22 Z" fill="red"/>
        <text x="20" y="24" font-size="10" text-anchor="middle" font-weight="bold" fill="red">FA</text>
      </svg>`,
      description: 'Fire alarm horn/speaker'
    },
    {
      id: 'fire_alarm_strobe',
      name: 'Fire Alarm Strobe',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="12" fill="none" stroke="red" stroke-width="2"/>
        <circle cx="20" cy="20" r="8" fill="none" stroke="red" stroke-width="1" stroke-dasharray="2,2"/>
        <circle cx="20" cy="20" r="4" fill="red"/>
      </svg>`,
      description: 'Fire alarm strobe light'
    },
    {
      id: 'fire_alarm_horn_strobe',
      name: 'Horn/Strobe Combo',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="red" stroke-width="2" rx="2"/>
        <circle cx="20" cy="15" r="4" fill="red"/>
        <path d="M 14 25 L 12 23 L 12 27 Z" fill="red"/>
        <path d="M 26 25 L 28 23 L 28 27 Z" fill="red"/>
      </svg>`,
      description: 'Combined horn and strobe'
    },
    {
      id: 'fire_alarm_panel',
      name: 'Fire Alarm Panel',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="red" stroke-width="2" rx="2"/>
        <circle cx="12" cy="12" r="2" fill="red"/>
        <circle cx="28" cy="12" r="2" fill="red"/>
        <line x1="8" y1="20" x2="32" y2="20" stroke="red" stroke-width="1"/>
        <circle cx="12" cy="28" r="2" fill="red"/>
        <circle cx="28" cy="28" r="2" fill="red"/>
        <text x="20" y="25" font-size="8" text-anchor="middle" font-weight="bold" fill="red">FAP</text>
      </svg>`,
      description: 'Fire alarm control panel'
    },
    {
      id: 'fire_alarm_detector',
      name: 'Smoke Detector',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="10" fill="none" stroke="red" stroke-width="2"/>
        <circle cx="20" cy="20" r="6" fill="none" stroke="red" stroke-width="1"/>
        <circle cx="20" cy="20" r="2" fill="red"/>
      </svg>`,
      description: 'Smoke detector'
    },
    {
      id: 'fire_alarm_heat_detector',
      name: 'Heat Detector',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="10" fill="none" stroke="red" stroke-width="2"/>
        <path d="M 15 20 Q 20 15 25 20" stroke="red" stroke-width="1.5" fill="none"/>
        <path d="M 15 20 Q 20 25 25 20" stroke="red" stroke-width="1.5" fill="none"/>
      </svg>`,
      description: 'Heat detector'
    },
    {
      id: 'fire_alarm_pull_station',
      name: 'Pull Station',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="red" stroke-width="2" rx="2"/>
        <rect x="12" y="12" width="16" height="16" fill="none" stroke="red" stroke-width="1" rx="1"/>
        <text x="20" y="25" font-size="9" text-anchor="middle" font-weight="bold" fill="red">PULL</text>
      </svg>`,
      description: 'Manual fire alarm pull station'
    },
    {
      id: 'fire_alarm_bell',
      name: 'Fire Alarm Bell',
      category: SYMBOL_CATEGORIES.FIRE_ALARM,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M 12 20 Q 12 12 20 12 Q 28 12 28 20" fill="none" stroke="red" stroke-width="2"/>
        <circle cx="20" cy="25" r="3" fill="red"/>
        <line x1="8" y1="18" x2="5" y2="15" stroke="red" stroke-width="1.5"/>
        <line x1="32" y1="18" x2="35" y2="15" stroke="red" stroke-width="1.5"/>
      </svg>`,
      description: 'Fire alarm bell'
    }
  ],

  // ========== LOW VOLTAGE SYMBOLS ==========
  [SYMBOL_CATEGORIES.LOW_VOLTAGE]: [
    {
      id: 'camera_security',
      name: 'Security Camera',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="24" height="16" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <circle cx="20" cy="18" r="6" fill="none" stroke="blue" stroke-width="1.5"/>
        <circle cx="20" cy="18" r="3" fill="blue"/>
        <line x1="32" y1="18" x2="35" y2="18" stroke="blue" stroke-width="1.5"/>
      </svg>`,
      description: 'Security camera'
    },
    {
      id: 'access_control',
      name: 'Access Control Reader',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <rect x="13" y="13" width="14" height="10" fill="none" stroke="blue" stroke-width="1"/>
        <circle cx="20" cy="28" r="2" fill="blue"/>
      </svg>`,
      description: 'Access control card reader'
    },
    {
      id: 'intercom_speaker',
      name: 'Intercom Speaker',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="10" fill="none" stroke="blue" stroke-width="2"/>
        <path d="M 15 20 L 12 17 L 12 23 Z" fill="blue"/>
        <path d="M 25 20 L 28 17 L 28 23 Z" fill="blue"/>
      </svg>`,
      description: 'Intercom speaker'
    },
    {
      id: 'data_outlet',
      name: 'Data/Network Outlet',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <line x1="14" y1="14" x2="14" y2="26" stroke="blue" stroke-width="1"/>
        <line x1="20" y1="14" x2="20" y2="26" stroke="blue" stroke-width="1"/>
        <line x1="26" y1="14" x2="26" y2="26" stroke="blue" stroke-width="1"/>
      </svg>`,
      description: 'Data/network outlet'
    },
    {
      id: 'telephone_outlet',
      name: 'Telephone Outlet',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <circle cx="15" cy="18" r="2" fill="blue"/>
        <circle cx="25" cy="18" r="2" fill="blue"/>
        <circle cx="15" cy="26" r="2" fill="blue"/>
        <circle cx="25" cy="26" r="2" fill="blue"/>
      </svg>`,
      description: 'Telephone outlet'
    },
    {
      id: 'tv_outlet',
      name: 'TV/Coax Outlet',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <circle cx="20" cy="20" r="4" fill="none" stroke="blue" stroke-width="1.5"/>
        <line x1="20" y1="16" x2="20" y2="24" stroke="blue" stroke-width="1"/>
        <line x1="16" y1="20" x2="24" y2="20" stroke="blue" stroke-width="1"/>
      </svg>`,
      description: 'TV/Coax outlet'
    },
    {
      id: 'speaker_outlet',
      name: 'Speaker Outlet',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <circle cx="16" cy="20" r="2" fill="blue"/>
        <circle cx="24" cy="20" r="2" fill="blue"/>
      </svg>`,
      description: 'Speaker outlet'
    },
    {
      id: 'motion_sensor',
      name: 'Motion Sensor',
      category: SYMBOL_CATEGORIES.LOW_VOLTAGE,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="10" fill="none" stroke="blue" stroke-width="2"/>
        <path d="M 20 12 L 16 18 L 24 18 Z" fill="blue"/>
        <path d="M 12 20 L 18 16 L 18 24 Z" fill="blue"/>
        <path d="M 28 20 L 22 16 L 22 24 Z" fill="blue"/>
      </svg>`,
      description: 'Motion sensor'
    }
  ],

  // ========== HVAC SYMBOLS ==========
  [SYMBOL_CATEGORIES.HVAC]: [
    {
      id: 'hvac_unit',
      name: 'HVAC Unit',
      category: SYMBOL_CATEGORIES.HVAC,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="green" stroke-width="2" rx="2"/>
        <line x1="10" y1="15" x2="30" y2="15" stroke="green" stroke-width="1"/>
        <line x1="10" y1="25" x2="30" y2="25" stroke="green" stroke-width="1"/>
        <circle cx="15" cy="20" r="2" fill="green"/>
        <circle cx="25" cy="20" r="2" fill="green"/>
      </svg>`,
      description: 'HVAC unit'
    },
    {
      id: 'thermostat',
      name: 'Thermostat',
      category: SYMBOL_CATEGORIES.HVAC,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="10" fill="none" stroke="green" stroke-width="2"/>
        <circle cx="20" cy="20" r="6" fill="none" stroke="green" stroke-width="1"/>
        <line x1="20" y1="14" x2="20" y2="26" stroke="green" stroke-width="1.5"/>
      </svg>`,
      description: 'Thermostat'
    },
    {
      id: 'ductwork',
      name: 'Ductwork',
      category: SYMBOL_CATEGORIES.HVAC,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="15" width="30" height="10" fill="none" stroke="green" stroke-width="2" rx="2"/>
        <line x1="10" y1="15" x2="10" y2="25" stroke="green" stroke-width="1"/>
        <line x1="20" y1="15" x2="20" y2="25" stroke="green" stroke-width="1"/>
        <line x1="30" y1="15" x2="30" y2="25" stroke="green" stroke-width="1"/>
      </svg>`,
      description: 'Ductwork'
    },
    {
      id: 'damper',
      name: 'Damper',
      category: SYMBOL_CATEGORIES.HVAC,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="15" width="24" height="10" fill="none" stroke="green" stroke-width="2" rx="2"/>
        <line x1="15" y1="12" x2="25" y2="28" stroke="green" stroke-width="2"/>
      </svg>`,
      description: 'Damper'
    },
    {
      id: 'register_supply',
      name: 'Supply Register',
      category: SYMBOL_CATEGORIES.HVAC,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="green" stroke-width="2" rx="2"/>
        <line x1="14" y1="14" x2="26" y2="14" stroke="green" stroke-width="1"/>
        <line x1="14" y1="18" x2="26" y2="18" stroke="green" stroke-width="1"/>
        <line x1="14" y1="22" x2="26" y2="22" stroke="green" stroke-width="1"/>
        <line x1="14" y1="26" x2="26" y2="26" stroke="green" stroke-width="1"/>
      </svg>`,
      description: 'Supply register'
    },
    {
      id: 'register_return',
      name: 'Return Register',
      category: SYMBOL_CATEGORIES.HVAC,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="green" stroke-width="2" rx="2"/>
        <rect x="13" y="13" width="14" height="14" fill="none" stroke="green" stroke-width="1" rx="1"/>
        <circle cx="20" cy="20" r="2" fill="green"/>
      </svg>`,
      description: 'Return register'
    }
  ],

  // ========== PLUMBING SYMBOLS ==========
  [SYMBOL_CATEGORIES.PLUMBING]: [
    {
      id: 'toilet',
      name: 'Toilet',
      category: SYMBOL_CATEGORIES.PLUMBING,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="15" rx="8" ry="5" fill="none" stroke="purple" stroke-width="2"/>
        <path d="M 12 15 Q 12 25 16 28 L 24 28 Q 28 25 28 15" fill="none" stroke="purple" stroke-width="2"/>
        <line x1="20" y1="10" x2="20" y2="5" stroke="purple" stroke-width="1.5"/>
      </svg>`,
      description: 'Toilet'
    },
    {
      id: 'sink',
      name: 'Sink',
      category: SYMBOL_CATEGORIES.PLUMBING,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="12" width="20" height="12" fill="none" stroke="purple" stroke-width="2" rx="2"/>
        <circle cx="15" cy="18" r="2" fill="purple"/>
        <circle cx="25" cy="18" r="2" fill="purple"/>
        <line x1="20" y1="24" x2="20" y2="30" stroke="purple" stroke-width="1.5"/>
      </svg>`,
      description: 'Sink'
    },
    {
      id: 'bathtub',
      name: 'Bathtub',
      category: SYMBOL_CATEGORIES.PLUMBING,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="24" height="18" fill="none" stroke="purple" stroke-width="2" rx="3"/>
        <line x1="20" y1="28" x2="20" y2="35" stroke="purple" stroke-width="1.5"/>
        <circle cx="15" cy="16" r="1.5" fill="purple"/>
        <circle cx="25" cy="16" r="1.5" fill="purple"/>
      </svg>`,
      description: 'Bathtub'
    },
    {
      id: 'shower',
      name: 'Shower',
      category: SYMBOL_CATEGORIES.PLUMBING,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="12" width="20" height="20" fill="none" stroke="purple" stroke-width="2" rx="2"/>
        <circle cx="20" cy="18" r="3" fill="none" stroke="purple" stroke-width="1"/>
        <line x1="20" y1="22" x2="20" y2="28" stroke="purple" stroke-width="1.5"/>
        <circle cx="16" cy="26" r="1" fill="purple"/>
        <circle cx="20" cy="26" r="1" fill="purple"/>
        <circle cx="24" cy="26" r="1" fill="purple"/>
      </svg>`,
      description: 'Shower'
    },
    {
      id: 'water_heater',
      name: 'Water Heater',
      category: SYMBOL_CATEGORIES.PLUMBING,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="8" width="16" height="24" fill="none" stroke="purple" stroke-width="2" rx="2"/>
        <line x1="16" y1="12" x2="24" y2="12" stroke="purple" stroke-width="1"/>
        <line x1="16" y1="18" x2="24" y2="18" stroke="purple" stroke-width="1"/>
        <line x1="16" y1="24" x2="24" y2="24" stroke="purple" stroke-width="1"/>
        <line x1="20" y1="32" x2="20" y2="35" stroke="purple" stroke-width="1.5"/>
      </svg>`,
      description: 'Water heater'
    }
  ],

  // ========== STRUCTURAL SYMBOLS ==========
  [SYMBOL_CATEGORIES.STRUCTURAL]: [
    {
      id: 'column',
      name: 'Column',
      category: SYMBOL_CATEGORIES.STRUCTURAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="5" width="16" height="30" fill="none" stroke="black" stroke-width="2"/>
        <line x1="12" y1="5" x2="28" y2="5" stroke="black" stroke-width="1"/>
        <line x1="12" y1="35" x2="28" y2="35" stroke="black" stroke-width="1"/>
      </svg>`,
      description: 'Structural column'
    },
    {
      id: 'beam',
      name: 'Beam',
      category: SYMBOL_CATEGORIES.STRUCTURAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="15" width="30" height="10" fill="none" stroke="black" stroke-width="2"/>
        <line x1="5" y1="15" x2="35" y2="15" stroke="black" stroke-width="1"/>
        <line x1="5" y1="25" x2="35" y2="25" stroke="black" stroke-width="1"/>
      </svg>`,
      description: 'Structural beam'
    },
    {
      id: 'wall_concrete',
      name: 'Concrete Wall',
      category: SYMBOL_CATEGORIES.STRUCTURAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" stroke-width="3"/>
        <circle cx="12" cy="12" r="1.5" fill="black"/>
        <circle cx="20" cy="12" r="1.5" fill="black"/>
        <circle cx="28" cy="12" r="1.5" fill="black"/>
        <circle cx="12" cy="20" r="1.5" fill="black"/>
        <circle cx="20" cy="20" r="1.5" fill="black"/>
        <circle cx="28" cy="20" r="1.5" fill="black"/>
        <circle cx="12" cy="28" r="1.5" fill="black"/>
        <circle cx="20" cy="28" r="1.5" fill="black"/>
        <circle cx="28" cy="28" r="1.5" fill="black"/>
      </svg>`,
      description: 'Concrete wall'
    },
    {
      id: 'wall_brick',
      name: 'Brick Wall',
      category: SYMBOL_CATEGORIES.STRUCTURAL,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" stroke-width="2"/>
        <line x1="5" y1="12" x2="35" y2="12" stroke="black" stroke-width="0.5"/>
        <line x1="5" y1="19" x2="35" y2="19" stroke="black" stroke-width="0.5"/>
        <line x1="5" y1="26" x2="35" y2="26" stroke="black" stroke-width="0.5"/>
        <line x1="5" y1="33" x2="35" y2="33" stroke="black" stroke-width="0.5"/>
        <line x1="12" y1="5" x2="12" y2="35" stroke="black" stroke-width="0.5"/>
        <line x1="19" y1="5" x2="19" y2="35" stroke="black" stroke-width="0.5"/>
        <line x1="26" y1="5" x2="26" y2="35" stroke="black" stroke-width="0.5"/>
      </svg>`,
      description: 'Brick wall'
    }
  ],

  // ========== DOORS & WINDOWS ==========
  [SYMBOL_CATEGORIES.DOORS_WINDOWS]: [
    {
      id: 'door_swing',
      name: 'Swing Door',
      category: SYMBOL_CATEGORIES.DOORS_WINDOWS,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="10" width="30" height="20" fill="none" stroke="black" stroke-width="2"/>
        <line x1="5" y1="20" x2="35" y2="20" stroke="black" stroke-width="1"/>
        <path d="M 5 20 Q 20 5 35 20" fill="none" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
        <circle cx="33" cy="20" r="1.5" fill="black"/>
      </svg>`,
      description: 'Swing door'
    },
    {
      id: 'door_sliding',
      name: 'Sliding Door',
      category: SYMBOL_CATEGORIES.DOORS_WINDOWS,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="10" width="30" height="20" fill="none" stroke="black" stroke-width="2"/>
        <line x1="20" y1="10" x2="20" y2="30" stroke="black" stroke-width="1.5"/>
        <line x1="5" y1="20" x2="35" y2="20" stroke="black" stroke-width="1"/>
      </svg>`,
      description: 'Sliding door'
    },
    {
      id: 'window',
      name: 'Window',
      category: SYMBOL_CATEGORIES.DOORS_WINDOWS,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="24" height="20" fill="none" stroke="black" stroke-width="2"/>
        <line x1="20" y1="10" x2="20" y2="30" stroke="black" stroke-width="1"/>
        <line x1="8" y1="20" x2="32" y2="20" stroke="black" stroke-width="1"/>
      </svg>`,
      description: 'Window'
    }
  ],

  // ========== FIXTURES ==========
  [SYMBOL_CATEGORIES.FIXTURES]: [
    {
      id: 'fixture_generic',
      name: 'Generic Fixture',
      category: SYMBOL_CATEGORIES.FIXTURES,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="10" fill="none" stroke="black" stroke-width="2"/>
        <circle cx="20" cy="20" r="6" fill="none" stroke="black" stroke-width="1"/>
        <circle cx="20" cy="20" r="2" fill="black"/>
      </svg>`,
      description: 'Generic fixture'
    }
  ],

  // ========== SECURITY SYMBOLS ==========
  [SYMBOL_CATEGORIES.SECURITY]: [
    {
      id: 'door_lock',
      name: 'Door Lock',
      category: SYMBOL_CATEGORIES.SECURITY,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="15" width="20" height="15" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <rect x="14" y="10" width="12" height="8" fill="none" stroke="blue" stroke-width="1.5" rx="1"/>
        <circle cx="20" cy="22" r="2" fill="blue"/>
      </svg>`,
      description: 'Door lock'
    },
    {
      id: 'panic_bar',
      name: 'Panic Bar',
      category: SYMBOL_CATEGORIES.SECURITY,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="24" height="20" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <rect x="12" y="16" width="16" height="8" fill="none" stroke="blue" stroke-width="1.5" rx="1"/>
        <line x1="20" y1="18" x2="20" y2="22" stroke="blue" stroke-width="1"/>
      </svg>`,
      description: 'Panic bar'
    }
  ],

  // ========== ACCESSIBILITY SYMBOLS ==========
  [SYMBOL_CATEGORIES.ACCESSIBILITY]: [
    {
      id: 'accessible_parking',
      name: 'Accessible Parking',
      category: SYMBOL_CATEGORIES.ACCESSIBILITY,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="30" height="30" fill="none" stroke="blue" stroke-width="2" rx="2"/>
        <path d="M 15 15 L 15 28 M 15 18 L 22 18 L 22 28 M 22 18 Q 25 18 25 21 L 25 28" stroke="blue" stroke-width="2" fill="none"/>
      </svg>`,
      description: 'Accessible parking space'
    },
    {
      id: 'accessible_ramp',
      name: 'Accessible Ramp',
      category: SYMBOL_CATEGORIES.ACCESSIBILITY,
      width: 40,
      height: 40,
      svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="30" x2="30" y2="10" stroke="blue" stroke-width="3"/>
        <line x1="10" y1="32" x2="30" y2="32" stroke="blue" stroke-width="2"/>
        <line x1="12" y1="28" x2="12" y2="32" stroke="blue" stroke-width="1"/>
        <line x1="20" y1="20" x2="20" y2="32" stroke="blue" stroke-width="1"/>
        <line x1="28" y1="12" x2="28" y2="32" stroke="blue" stroke-width="1"/>
      </svg>`,
      description: 'Accessible ramp'
    }
  ]
};

/**
 * Get all symbols for a category
 * @param {string} category - The category
 * @returns {Array<Object>} Symbols in the category
 */
export function getSymbolsByCategory(category) {
  return CONSTRUCTION_SYMBOLS[category] || [];
}

/**
 * Get symbol by ID
 * @param {string} id - The symbol ID
 * @returns {Object|null} The symbol or null
 */
export function getSymbolById(id) {
  for (const category in CONSTRUCTION_SYMBOLS) {
    const symbol = CONSTRUCTION_SYMBOLS[category].find(s => s.id === id);
    if (symbol) return symbol;
  }
  return null;
}

/**
 * Get all categories
 * @returns {Array<string>} All category keys
 */
export function getAllCategories() {
  return Object.values(SYMBOL_CATEGORIES);
}

/**
 * Get category display name
 * @param {string} category - The category key
 * @returns {string} Display name
 */
export function getCategoryDisplayName(category) {
  const names = {
    [SYMBOL_CATEGORIES.ELECTRICAL]: 'Electrical',
    [SYMBOL_CATEGORIES.FIRE_ALARM]: 'Fire Alarm',
    [SYMBOL_CATEGORIES.LOW_VOLTAGE]: 'Low Voltage',
    [SYMBOL_CATEGORIES.HVAC]: 'HVAC',
    [SYMBOL_CATEGORIES.PLUMBING]: 'Plumbing',
    [SYMBOL_CATEGORIES.STRUCTURAL]: 'Structural',
    [SYMBOL_CATEGORIES.DOORS_WINDOWS]: 'Doors & Windows',
    [SYMBOL_CATEGORIES.FIXTURES]: 'Fixtures',
    [SYMBOL_CATEGORIES.SECURITY]: 'Security',
    [SYMBOL_CATEGORIES.ACCESSIBILITY]: 'Accessibility'
  };
  return names[category] || category;
}

export default {
  SYMBOL_CATEGORIES,
  CONSTRUCTION_SYMBOLS,
  getSymbolsByCategory,
  getSymbolById,
  getAllCategories,
  getCategoryDisplayName
};
