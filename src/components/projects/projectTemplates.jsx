// Project type templates — each entry defines phases with their checklist items.
// Each phase has a name and an array of requirement strings (fully editable after creation).

export const PROJECT_TYPE_CATALOG = [
  {
    category: 'Fire Alarm',
    icon: '🔥',
    types: [
      { value: 'fire_alarm_new_construction', label: 'New Construction (Ground-Up)', description: 'Full building from dirt — multi-story concrete/steel frame' },
      { value: 'fire_alarm_tenant_improvement', label: 'Tenant Improvement', description: 'TI work in existing shell or occupied building' },
      { value: 'fire_alarm_service_inspection', label: 'Service & Inspection', description: 'Annual inspection, testing, and service calls' },
      { value: 'fire_alarm_special_hazard', label: 'Special Hazard / Suppression', description: 'Clean agent, CO2, foam, or kitchen suppression systems' },
    ]
  },
  {
    category: 'Low Voltage',
    icon: '📡',
    types: [
      { value: 'low_voltage_structured_cabling', label: 'Structured Cabling', description: 'Cat6/fiber backbone, IDF/MDF, patch panels' },
      { value: 'low_voltage_access_control', label: 'Access Control', description: 'Card readers, electric strikes, door hardware' },
      { value: 'low_voltage_cctv', label: 'CCTV / Video Surveillance', description: 'IP cameras, NVR/DVR, monitoring systems' },
      { value: 'low_voltage_av', label: 'Audio / Visual', description: 'Conference rooms, digital signage, sound systems' },
      { value: 'low_voltage_nurse_call', label: 'Nurse Call', description: 'Healthcare nurse call and emergency systems' },
    ]
  },
  {
    category: 'ISP / Telecom',
    icon: '🌐',
    types: [
      { value: 'isp_fiber_backbone', label: 'Fiber Backbone', description: 'Aerial/underground fiber runs, splice, termination' },
      { value: 'isp_wireless', label: 'Wireless Infrastructure', description: 'WAPs, antennas, outdoor wireless links' },
      { value: 'isp_underground', label: 'Underground Conduit', description: 'Boring, trenching, conduit, pull boxes' },
    ]
  },
  {
    category: 'General Construction',
    icon: '🏗️',
    types: [
      { value: 'residential', label: 'Residential', description: 'Single family, multifamily, renovation' },
      { value: 'commercial', label: 'Commercial', description: 'Office, retail, hospitality' },
      { value: 'industrial', label: 'Industrial', description: 'Warehouse, manufacturing, data center' },
      { value: 'infrastructure', label: 'Infrastructure', description: 'Roads, utilities, civil' },
      { value: 'renovation', label: 'Renovation / TI', description: 'General renovation or tenant improvement' },
    ]
  },
];

// ─── PHASE TEMPLATES ──────────────────────────────────────────────────────────

export const PHASE_TEMPLATES = {

  // ─── FIRE ALARM: NEW CONSTRUCTION ─────────────────────────────────────────
  fire_alarm_new_construction: [
    {
      phase: 'Bidding & Estimating',
      items: [
        'Download architectural and MEP sets (structural, electrical, mechanical)',
        'Perform quantity takeoff by floor: smoke detectors (count per room/corridor)',
        'Count heat detectors (kitchens, mechanical rooms, elevator shafts)',
        'Count duct detectors (AHUs over 2000 CFM)',
        'Count pull stations (egress paths, max travel distance 200ft)',
        'Count horn/strobes (sleeping vs. non-sleeping areas)',
        'Count speaker/strobes (voice evac buildings)',
        'Count monitor modules (sprinkler flow/tamper, elevator status)',
        'Count control modules (fan shutdown, door holders)',
        'Count annunciators (main entry + fire command center)',
        'Size FACP with expansion cabinets',
        'Count remote power supplies (NAC extenders)',
        'Calculate SLC loop wire: 18/2 shielded (linear feet per floor)',
        'Calculate NAC wire: 14/2 or 12/2 (based on voltage drop)',
        'Calculate speaker wire: 18/2 (for voice evac)',
        'Calculate risers: pairs per floor',
        'Get manufacturer list pricing (Honeywell/Siemens/Edwards/Simplex)',
        'Apply distributor discount (typically 30-50% off list)',
        'Add markup for client (typically 15-25%)',
        'Estimate labor hours per device (0.5-2 hrs depending on ceiling height)',
        'Estimate hours per 1000ft wire pull (2-4 hours per run)',
        'Estimate programming hours (1-2 hours per 100 devices)',
        'Estimate engineering hours (shop drawings + as-builts)',
        'Obtain 3 subcontractor bids (if using alarm sub)',
        'Verify subcontractor license and insurance',
        'Check manufacturer certifications for subs',
      ]
    },
    {
      phase: 'Material Procurement & Inventory',
      items: [
        'Create bill of materials organized by floor/wing',
        'Separate BOM: device type, rough-in materials (boxes/conduit/strut), trim materials',
        'Order long lead items first: FACP (4-8 weeks)',
        'Order annunciators (same lead time as panel)',
        'Order special finishes (brass/stainless covers) early',
        'Set up inventory tracking system',
        'Establish receiving inspection process for damaged goods',
        'Set up staging area in trailer or secured room',
        'Implement check-out system for technicians',
        'Set up return process for unused material',
        'Confirm primary distributor (stocking)',
        'Identify backup supplier for shortages',
        'Arrange drop-ship to job site where possible',
      ]
    },
    {
      phase: 'Pre-Construction & Coordination',
      items: [
        'Attend BIM coordination meetings',
        'Clash detection with ductwork, pipe, steel',
        'Adjust device locations as needed from coordination',
        'Get signed-off coordination drawings',
        'Submit shop drawings to engineer: riser diagram',
        'Submit floor plans with device addresses',
        'Submit panel elevation and conduit entry drawings',
        'Submit voltage drop calculations',
        'Submit battery capacity calculations',
        'Submit cut sheets for all equipment',
        'Get approved submittals stamped and returned',
        'Apply for fire alarm permit: submit stamped drawings',
        'Pay permit fees',
        'Schedule rough-in inspection with AHJ',
      ]
    },
    {
      phase: 'Concrete & Deck Phase',
      items: [
        'Coordinate box location drawings with electrician',
        'Verify box type (4SQ, 1900, round) and depth (1.5" drywall / 2.125" masonry)',
        'Confirm mounting heights (48" to center typical)',
        'Install boxes on deck before pour (stake to rebar or fasten to deck)',
        'Use zip ties or tie wire to prevent box movement during pour',
        'Install conduit stubs up from boxes',
        'Cap conduits to prevent concrete entry',
        'Mark box locations on deck edge for recovery',
        'Post-pour: locate all boxes',
        'Chip out concrete as needed to find buried boxes',
        'Verify boxes are at correct elevation post-pour',
        'Rod out conduits for concrete debris',
      ]
    },
    {
      phase: 'Rough-In Phase (Above Ceiling)',
      items: [
        'Install support systems: J-hooks or bridle rings for cable tray',
        'Install trapeze supports for larger conduit',
        'Install beam clamps where structural attachment needed',
        'Pull homeruns to riser rooms; label both ends immediately',
        'Leave service loops at devices (18-24")',
        'Leave slack in riser room (10-15ft)',
        'Bundle and tie cables every 8-10ft',
        'Install conduit in exposed areas (parking garages)',
        'Install conduit in plenum areas requiring metal conduit',
        'Install risers between floors',
        'Install conduit in mechanical rooms (subject to damage)',
        'Firestop all penetrations with intumescent putty pads',
        'Install fire caulking at penetrations',
        'Install firestop pillows for larger openings',
        'Document all penetrations with photos',
        'Install SLC loops (verify T-tap policy with manufacturer)',
        'Verify Class A vs Class B wiring per design',
        'Test continuity before drywall',
      ]
    },
    {
      phase: 'Rough-In Inspection',
      items: [
        'Schedule rough-in inspection with AHJ (separate from electrical)',
        'Verify all boxes accessible for inspection',
        'Verify all conduit complete',
        'Verify firestopping visible',
        'Verify wire properly supported',
        'Correct any red tags immediately',
        'Obtain rough-in approval before covering',
      ]
    },
    {
      phase: 'Drywall & Ceiling Phase',
      items: [
        'Coordinate with drywallers: provide mud rings for boxes (1/2" or 5/8" rings)',
        'Ensure boxes are not buried behind board',
        'Mark device locations for cutouts',
        'After drywall: locate all boxes (stud finder if needed)',
        'Cut out drywall at boxes',
        'Install mud rings',
        'Pull wires out of boxes',
        'Coordinate ceiling grid: tile types (lay-in vs. hard lid)',
        'Provide support wires for ceiling-mounted devices',
        'Locate devices relative to grid lines',
      ]
    },
    {
      phase: 'Trim-Out Phase',
      items: [
        'Install device bases: smoke detector bases (twist lock)',
        'Install pull station backplates',
        'Install horn/strobe mounting plates',
        'Wire devices: trim wires to appropriate length, strip and terminate per manufacturer',
        'Use wire nuts or termination blocks; document device addresses on as-built',
        'Install smoke detectors (snap into bases)',
        'Install heat detectors',
        'Install pull stations',
        'Install horns/strobes',
        'Install speakers',
        'Mount FACP backbox to wall at proper height',
        'Pull cables into FACP enclosure',
        'Install batteries in panel',
        'Mount circuit boards',
        'Dress wires with tie wraps and label all field wiring',
      ]
    },
    {
      phase: 'Programming Phase',
      items: [
        'Power up panel: verify primary AC power',
        'Check battery charging voltage',
        'Clear any ground faults before proceeding',
        'Run auto-program (if supported) — let panel discover devices',
        'Verify all devices found vs. installed count',
        'Manual programming: assign custom labels per device (location)',
        'Group devices into zones',
        'Set device types (smoke/heat/pull/duct)',
        'Configure general alarm cause/effect: all devices activate',
        'Configure floor above/below: voice evac zones',
        'Configure elevator recall: lobby detectors trigger recall',
        'Configure HVAC shutdown: duct detectors trigger fans off',
        'Configure door holders: release on alarm',
        'Configure stair pressurization: fans on',
        'Set up central station: phone lines or cellular communicator',
        'Program monitoring account number',
        'Test signal transmission to central station',
        'Confirm receipt with monitoring company',
      ]
    },
    {
      phase: 'Integration Phase',
      items: [
        'Elevator interface: connect to elevator controller',
        'Test elevator primary recall (lobby)',
        'Test elevator alternate recall (alternate floor)',
        'Test shunt trip (machinery room)',
        'HVAC interface: connect to AHU controllers',
        'Test fan shutdown on duct detector alarm',
        'Test stair pressurization fan startup on alarm',
        'Door hardware: connect to magnetic door holders',
        'Test door holder release on alarm',
        'Building automation: provide dry contacts or BACnet interface',
        'Test alarm reporting to BAS',
      ]
    },
    {
      phase: 'Testing & Commissioning',
      items: [
        'Device-by-device test: smoke detectors (aerosol or magnet)',
        'Test heat detectors (heat gun or test mode)',
        'Test duct detectors (test port with magnet)',
        'Test pull stations (physical pull)',
        'Test monitor modules: activate connected device, verify indication',
        'Test control modules: verify controlled equipment operates',
        'Notification testing: measure candela output (visual)',
        'Measure dB levels (audible) — verify 15dB above ambient',
        'Verify synchronized flashing of all strobes',
        'System test: alarm activation from any device',
        'Test trouble conditions (open, ground fault)',
        'Test supervisory conditions (sprinkler valve closed)',
        'Battery backup test (4-24 hours depending on code)',
        'Document all test results: device serial numbers and addresses',
        'Document test dates and results',
        'Mark failed devices for replacement',
      ]
    },
    {
      phase: 'AHJ Final Inspection',
      items: [
        'Schedule with Fire Marshal (often 2-4 weeks out)',
        'Provide approved drawings to inspector',
        'Provide test records',
        'Provide battery calculations',
        'Provide voltage drop calculations',
        'Demonstrate walk test of entire building with AHJ',
        'Demonstrate cause and effect sequences',
        'Demonstrate elevator recall',
        'Demonstrate HVAC shutdown',
        'Demonstrate central station communication',
        'Correct any deficiencies immediately',
        'Obtain certificate of occupancy',
      ]
    },
    {
      phase: 'Closeout & Handover',
      items: [
        'Final as-built documentation: CAD files with device addresses',
        'Produce PDF as-built set for building records',
        'Produce riser diagram with all devices labeled',
        'Produce panel programming report',
        'Compile operations manuals: manufacturer documentation',
        'Write custom operating instructions',
        'Include emergency contact numbers in O&M package',
        'Building engineer training (2-4 hours)',
        'Security staff training (1-2 hours)',
        'Collect training sign-off sheets',
        'Register all equipment for warranty',
        'Provide warranty start date documentation',
        'Schedule 11-month warranty walk',
        'Submit final pay application',
        'Include all change orders in final billing',
        'Collect lien waivers from subs and suppliers',
        'Issue final invoice',
      ]
    },
  ],

  // ─── DEFAULT (generic) for types without a specific template ──────────────
  _default: [
    {
      phase: 'Bidding & Estimating',
      items: [
        'Review project documents and scope',
        'Perform quantity takeoff',
        'Obtain material pricing',
        'Estimate labor hours',
        'Prepare and submit bid',
      ]
    },
    {
      phase: 'Pre-Construction',
      items: [
        'Submit shop drawings',
        'Obtain permits',
        'Procure materials',
        'Schedule subcontractors',
      ]
    },
    {
      phase: 'Construction',
      items: [
        'Mobilize to site',
        'Complete rough-in work',
        'Complete trim-out',
        'Coordinate inspections',
      ]
    },
    {
      phase: 'Testing & Commissioning',
      items: [
        'Perform system testing',
        'Correct deficiencies',
        'Obtain inspection sign-off',
      ]
    },
    {
      phase: 'Closeout',
      items: [
        'Submit as-built drawings',
        'Provide O&M manuals',
        'Conduct owner training',
        'Submit final billing',
      ]
    },
  ],
};

export function getPhaseTemplate(projectType) {
  return PHASE_TEMPLATES[projectType] || PHASE_TEMPLATES._default;
}