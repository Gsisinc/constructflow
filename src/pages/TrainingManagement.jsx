import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Documented catalog snapshot only. Prototype roster/progress deliberately NOT bundled or seeded.
// Source: mygsis-training-seed_2026-11-05.json; interactive content dated 2026-11-06.
const DIVISIONS = [
  "Fire",
  "Low Voltage",
  "GSIS Aerial",
  "Software"
];

const DOMAINS = {
  "Fire": [
    "Design",
    "ITM",
    "Installation",
    "Service",
    "Programming"
  ],
  "Low Voltage": [
    "CCTV",
    "Access",
    "AV",
    "Networking",
    "Structured Cabling",
    "Monitoring"
  ],
  "GSIS Aerial": [
    "Construction Progress Reports",
    "Orthomosaic Mapping",
    "3D Models",
    "Stockpile Volumes",
    "Roof / Site / Infrastructure Inspections",
    "As-Built Documentation",
    "Real Estate Media"
  ],
  "Software": [
    "Shared Software-Building Framework"
  ]
};

const REQUIRED_PATHS = [
  "PATH-MYGSIS-CORE",
  "PATH-SAFETY-CORE"
];

const SOURCE_PATHS = [
  {
    "path_id": "PATH-ADMIN-DESIGNER",
    "division": "Fire",
    "domain": "Design",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-ADMIN-DESIGNER"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-FIRE-ITM",
    "division": "Fire",
    "domain": "ITM",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-FIRE-ITM"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-FA-CORE",
    "division": "Fire",
    "domain": "Installation",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-FA-POTTER-ACADEMY",
      "CRS-FA-MIRCOM-FX400",
      "CRS-FA-MIRCOM-FX401",
      "CRS-FA-MIRCOM-FX3318",
      "CRS-FA-MIRCOM-FX3500",
      "CRS-FA-MYHBU-FIRELITE",
      "CRS-FA-MYHBU-NOTIFIER",
      "CRS-FA-MYHBU-SK",
      "CRS-FA-MYHBU-SYSENSOR",
      "CRS-FA-MYHBU-GAMEWELL"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-FIRE-SERVICE",
    "division": "Fire",
    "domain": "Service",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-FIRE-SERVICE"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-FA-GATED",
    "division": "Fire",
    "domain": "Programming",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-FIRE-PROGRAMMING",
      "CRS-FA-POTTER-AFC",
      "CRS-FA-MIRCOM-FLEXNET",
      "CRS-FA-GAMEWELL-E3S3",
      "CRS-FA-HOCHIKI-FIRENET",
      "CRS-FA-EDWARDS-EST",
      "CRS-FA-SIEMENS"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-CCTV",
    "division": "Low Voltage",
    "domain": "CCTV",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-CCTV-AXIS-ACADEMY",
      "CRS-CCTV-HANWHA-ELEARN",
      "CRS-CCTV-BOSCH",
      "CRS-CCTV-AXIS-PRO",
      "CRS-CCTV-HANWHA-HVCP",
      "CRS-CCTV-BOSCH-CLASS",
      "CRS-CCTV-AVIGILON",
      "CRS-CCTV-GENETEC",
      "CRS-CCTV-MILESTONE",
      "CRS-CCTV-VERKADA"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-MOTO-AVIGILON",
    "division": "Low Voltage",
    "domain": "CCTV",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-MOTO-001",
      "CRS-MOTO-002",
      "CRS-MOTO-003",
      "CRS-MOTO-004",
      "CRS-MOTO-005",
      "CRS-MOTO-006",
      "CRS-MOTO-007",
      "CRS-MOTO-008",
      "CRS-MOTO-009",
      "CRS-MOTO-010",
      "CRS-MOTO-011",
      "CRS-MOTO-012",
      "CRS-MOTO-013",
      "CRS-MOTO-014",
      "CRS-MOTO-015",
      "CRS-MOTO-016",
      "CRS-MOTO-017",
      "CRS-MOTO-018",
      "CRS-MOTO-019",
      "CRS-MOTO-020",
      "CRS-MOTO-021",
      "CRS-MOTO-022",
      "CRS-MOTO-023",
      "CRS-MOTO-024",
      "CRS-MOTO-025",
      "CRS-MOTO-026",
      "CRS-MOTO-027",
      "CRS-MOTO-028",
      "CRS-MOTO-029",
      "CRS-MOTO-030",
      "CRS-MOTO-031",
      "CRS-MOTO-032",
      "CRS-MOTO-033",
      "CRS-MOTO-034",
      "CRS-MOTO-035",
      "CRS-MOTO-036",
      "CRS-MOTO-037",
      "CRS-MOTO-038",
      "CRS-MOTO-039",
      "CRS-MOTO-040",
      "CRS-MOTO-041",
      "CRS-MOTO-042",
      "CRS-MOTO-043",
      "CRS-MOTO-044",
      "CRS-MOTO-045",
      "CRS-MOTO-046",
      "CRS-MOTO-047",
      "CRS-MOTO-048",
      "CRS-MOTO-049",
      "CRS-MOTO-050"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ACCESS",
    "division": "Low Voltage",
    "domain": "Access",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-ACC-HID-ASSOC",
      "CRS-ACC-BOSCH",
      "CRS-ACC-HID-PRO",
      "CRS-ACC-LENELS2",
      "CRS-ACC-BRIVO",
      "CRS-ACC-SWHOUSE"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AV",
    "division": "Low Voltage",
    "domain": "AV",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AV-LEGRAND",
      "CRS-AV-CRESTRON",
      "CRS-AV-EXTRON",
      "CRS-AV-BIAMP",
      "CRS-AV-SHURE",
      "CRS-AV-CRESTRON-DM",
      "CRS-AV-EXTRON-CERT"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-NET",
    "division": "Low Voltage",
    "domain": "Networking",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-NET-UI-ACADEMY",
      "CRS-NET-MERAKI-HUB",
      "CRS-NET-RUCKUS-PREP",
      "CRS-NET-UI-ILT",
      "CRS-NET-MERAKI-ECMS",
      "CRS-NET-RUCKUS-RCWA"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-CABLING",
    "division": "Low Voltage",
    "domain": "Structured Cabling",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-CAB-BELDEN-LEARN",
      "CRS-CAB-COMMSCOPE-ACCT",
      "CRS-CAB-BELDEN-CI",
      "CRS-CAB-COMMSCOPE-SYSTIMAX",
      "CRS-CAB-PANDUIT",
      "CRS-CAB-LEGRAND-ORTRONICS"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-MON",
    "division": "Low Voltage",
    "domain": "Monitoring",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-MON-DACT-GUIDE",
      "CRS-MON-POTTER",
      "CRS-MON-MYHBU-CLSS",
      "CRS-MON-BOSCH"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-PROGRESS",
    "division": "GSIS Aerial",
    "domain": "Construction Progress Reports",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-PROGRESS",
      "CRS-AER-B4UFLY",
      "CRS-AER-GSIS-SOP",
      "CRS-AER-PART107",
      "CRS-AER-PART107-REC"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-ORTHO",
    "division": "GSIS Aerial",
    "domain": "Orthomosaic Mapping",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-ORTHO"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-3D",
    "division": "GSIS Aerial",
    "domain": "3D Models",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-3D"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-STOCKPILE",
    "division": "GSIS Aerial",
    "domain": "Stockpile Volumes",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-STOCKPILE"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-INSPECTIONS",
    "division": "GSIS Aerial",
    "domain": "Roof / Site / Infrastructure Inspections",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-INSPECTIONS"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-ASBUILT",
    "division": "GSIS Aerial",
    "domain": "As-Built Documentation",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-ASBUILT"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-AERIAL-REALESTATE",
    "division": "GSIS Aerial",
    "domain": "Real Estate Media",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-AERIAL-SOP-REALESTATE"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-SOFTWARE-FRAMEWORK",
    "division": "Software",
    "domain": "Shared Software-Building Framework",
    "skill_area": null,
    "layer": "division",
    "course_ids": [
      "CRS-SOFTWARE-FRAMEWORK"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-MYGSIS-CORE",
    "division": null,
    "domain": null,
    "skill_area": "MYGSIS",
    "layer": "required",
    "course_ids": [
      "CRS-MYGSIS-CORE"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-SAFETY-CORE",
    "division": null,
    "domain": null,
    "skill_area": "Safety & Compliance",
    "layer": "required",
    "course_ids": [
      "CRS-SAFETY-CALOSHA",
      "CRS-SAFETY-JHA",
      "CRS-SAFETY-FIRSTAID"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ADMIN-ESTIMATOR",
    "division": null,
    "domain": null,
    "skill_area": "Estimator",
    "layer": "admin",
    "course_ids": [
      "CRS-ADMIN-ESTIMATOR"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ADMIN-SALES",
    "division": null,
    "domain": null,
    "skill_area": "Sales",
    "layer": "admin",
    "course_ids": [
      "CRS-ADMIN-SALES"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ADMIN-OPS",
    "division": null,
    "domain": null,
    "skill_area": "Operations",
    "layer": "admin",
    "course_ids": [
      "CRS-ADMIN-OPS"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ADMIN-ACCOUNTING",
    "division": null,
    "domain": null,
    "skill_area": "Accounting",
    "layer": "admin",
    "course_ids": [
      "CRS-ADMIN-ACCOUNTING"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ADMIN-PM",
    "division": null,
    "domain": null,
    "skill_area": "Project Management",
    "layer": "admin",
    "course_ids": [
      "CRS-ADMIN-PM"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-ADMIN-PROCUREMENT",
    "division": null,
    "domain": null,
    "skill_area": "Procurement",
    "layer": "admin",
    "course_ids": [
      "CRS-ADMIN-PROCUREMENT"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  },
  {
    "path_id": "PATH-FA-NICET",
    "division": null,
    "domain": null,
    "skill_area": "NICET (optional Fire credential)",
    "layer": "credential",
    "course_ids": [
      "CRS-FA-NICET-ORIENTATION"
    ],
    "description": "GSIS-authored interactive SOP and/or documented source catalog references."
  }
];

const SEED_COURSES = [
  {
    "course_id": "CRS-FA-POTTER-ACADEMY",
    "brand": "Potter",
    "title": "Potter Academy FA curriculum (NICET contact hours)",
    "link": "https://www.pottersignal.com/academy",
    "cost": "free",
    "notes": "Company account EXISTS (kemar@gsistech.com); login/reset in progress"
  },
  {
    "course_id": "CRS-FA-POTTER-AFC",
    "brand": "Potter",
    "title": "Potter AFC panel certification",
    "link": "https://www.pottersignal.com/training/certification",
    "cost": "paid",
    "notes": "Cost not published; gate until Kemar approves"
  },
  {
    "course_id": "CRS-FA-MIRCOM-FX400",
    "brand": "Mircom",
    "title": "Mircom Learn FX-400 cert",
    "link": "https://mircom.com/technical-support/mircom-training/",
    "cost": "free",
    "notes": "Learner account reviewed before activation"
  },
  {
    "course_id": "CRS-FA-MIRCOM-FX401",
    "brand": "Mircom",
    "title": "Mircom Learn FX-401 cert",
    "link": "https://mircom.com/technical-support/mircom-training/",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-FA-MIRCOM-FX3318",
    "brand": "Mircom",
    "title": "Mircom Learn FX-3318 cert",
    "link": "https://mircom.com/technical-support/mircom-training/",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-FA-MIRCOM-FX3500",
    "brand": "Mircom",
    "title": "Mircom Learn FX-3500 cert",
    "link": "https://mircom.com/technical-support/mircom-training/",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-FA-MIRCOM-FLEXNET",
    "brand": "Mircom",
    "title": "Mircom FleXNet / FX-4000 technician certification",
    "link": "https://mircom.com/technical-support/mircom-training/",
    "cost": "paid",
    "notes": "Fee-based; skip until approved"
  },
  {
    "course_id": "CRS-FA-MYHBU-FIRELITE",
    "brand": "Fire-Lite (Honeywell)",
    "title": "Fire-Lite product training (MyHBU free online)",
    "link": "https://buildings.honeywell.com/us/en/brands/our-brands/firelite/resources/training",
    "cost": "free",
    "notes": "Shared MyHBU account"
  },
  {
    "course_id": "CRS-FA-MYHBU-NOTIFIER",
    "brand": "Notifier (Honeywell)",
    "title": "Notifier free online product courses (MyHBU)",
    "link": "https://buildings.honeywell.com/us/en/support/training",
    "cost": "free",
    "notes": "Skip factory classroom tuition"
  },
  {
    "course_id": "CRS-FA-MYHBU-SK",
    "brand": "Silent Knight (Honeywell)",
    "title": "Silent Knight free online courses (MyHBU)",
    "link": "https://buildings.honeywell.com/us/en/brands/our-brands/silent-knight",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-FA-MYHBU-SYSENSOR",
    "brand": "System Sensor (Honeywell)",
    "title": "System Sensor MyHBU free courses",
    "link": "https://buildings.honeywell.com/us/en/support/training",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-FA-MYHBU-GAMEWELL",
    "brand": "Gamewell-FCI (Honeywell)",
    "title": "Gamewell-FCI MyHBU free online only",
    "link": "https://buildings.honeywell.com/us/en/brands/our-brands/gamewell-fci/support/training",
    "cost": "free",
    "notes": "E3/S3 Systems University is paid/partner"
  },
  {
    "course_id": "CRS-FA-GAMEWELL-E3S3",
    "brand": "Gamewell-FCI (Honeywell)",
    "title": "E3/S3 Systems University (5-day) + annual recert",
    "link": "https://buildings.honeywell.com/us/en/brands/our-brands/gamewell-fci/support/training",
    "cost": "paid",
    "notes": "ESD + tuition; CLSS tokens for recert"
  },
  {
    "course_id": "CRS-FA-HOCHIKI-FIRENET",
    "brand": "Hochiki America",
    "title": "FireNET / L@titude / Loop Explorer 2 programming cert",
    "link": "https://www.hochikiamerica.com/training",
    "cost": "partner",
    "notes": "Dealer registers techs"
  },
  {
    "course_id": "CRS-FA-EDWARDS-EST",
    "brand": "Edwards / EST",
    "title": "EST3/EST4/iO factory certification (Priority Training)",
    "link": "https://priority.edwardsfiresafety.com/Training/Home",
    "cost": "partner",
    "notes": "Needs partner + MyEddie"
  },
  {
    "course_id": "CRS-FA-SIEMENS",
    "brand": "Siemens Cerberus PRO",
    "title": "Siemens Technology Certified",
    "link": "https://www.siemens.com/en-us/partners/buildings/partner-network/",
    "cost": "partner",
    "notes": "Solution Partner by territory"
  },
  {
    "course_id": "CRS-CCTV-AXIS-ACADEMY",
    "brand": "Axis",
    "title": "Axis Academy free courses (MyAxis)",
    "link": "https://www.axis.com/en-us/learning/academy-united-states",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-CCTV-AXIS-PRO",
    "brand": "Axis",
    "title": "Axis Certified Professional (exam)",
    "link": "https://www.axis.com/en-us/learning/axis-certification-program",
    "cost": "paid",
    "notes": "Pearson VUE exam fee"
  },
  {
    "course_id": "CRS-CCTV-HANWHA-ELEARN",
    "brand": "Hanwha Vision",
    "title": "Hanwha Vision Learning Center free e-learning",
    "link": "https://www.hanwhavision.com/us/learning/hanwha-vision-learning-center",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-CCTV-HANWHA-HVCP",
    "brand": "Hanwha Vision",
    "title": "Hanwha Video Professional Certification (HVCP)",
    "link": "https://www.hanwhavision.com/us/learning/hanwha-vision-learning-center",
    "cost": "paid",
    "notes": "$375–$1,000; STEP discount"
  },
  {
    "course_id": "CRS-CCTV-BOSCH",
    "brand": "Bosch / Keenfinity",
    "title": "Keenfinity/Bosch free online access & intrusion courses",
    "link": "https://www.keenfinity-group.com/us/en/support/learning/training/",
    "cost": "free",
    "notes": "Skip paid classroom"
  },
  {
    "course_id": "CRS-CCTV-BOSCH-CLASS",
    "brand": "Bosch / Keenfinity",
    "title": "Bosch/Keenfinity paid classroom certifications",
    "link": "https://www.keenfinity-group.com/us/en/support/learning/training/",
    "cost": "paid",
    "notes": "Invoice 24–48h after request"
  },
  {
    "course_id": "CRS-CCTV-AVIGILON",
    "brand": "Avigilon / Motorola",
    "title": "Motorola / Avigilon — see PATH-MOTO-AVIGILON",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/dashboard",
    "cost": "price not shown",
    "notes": "Learning Center signed in 2026-11-06 ~10:17 AM PT via VSA SSO vault 3377138; see PATH-MOTO-AVIGILON; cross-reference only, not a separate manufacturer course",
    "reference_path_id": "PATH-MOTO-AVIGILON"
  },
  {
    "course_id": "CRS-CCTV-GENETEC",
    "brand": "Genetec",
    "title": "Security Center technical certs (STC/SC-OTC)",
    "link": "https://www.genetec.com/support/training",
    "cost": "partner",
    "notes": "CPP required for most"
  },
  {
    "course_id": "CRS-CCTV-MILESTONE",
    "brand": "Milestone",
    "title": "Milestone XProtect CIT / Design Engineer",
    "link": "https://learn.milestonesys.com/",
    "cost": "partner",
    "notes": "Reseller Authorized"
  },
  {
    "course_id": "CRS-CCTV-VERKADA",
    "brand": "Verkada",
    "title": "Verkada Certified Engineer (VCE)",
    "link": "https://www.verkada.com/partners/trainings/",
    "cost": "partner",
    "notes": "Partner only; 2-yr validity"
  },
  {
    "course_id": "CRS-ACC-HID-ASSOC",
    "brand": "HID Global",
    "title": "HID Academy Associate path (on-demand)",
    "link": "https://www.hidglobal.com/training",
    "cost": "free",
    "notes": "Request account; free register"
  },
  {
    "course_id": "CRS-ACC-HID-PRO",
    "brand": "HID Global",
    "title": "HID Academy Professional / APP partner certs",
    "link": "https://www.hidglobal.com/training",
    "cost": "partner",
    "notes": "Advantage Partner Program"
  },
  {
    "course_id": "CRS-ACC-LENELS2",
    "brand": "LenelS2 (Honeywell)",
    "title": "OnGuard / NetBox / Elements certs",
    "link": "https://buildings.honeywell.com/us/en/brands/our-brands/lenels2/support/training",
    "cost": "partner",
    "notes": "VAR + paid/subscription"
  },
  {
    "course_id": "CRS-ACC-BRIVO",
    "brand": "Brivo",
    "title": "Brivo certification",
    "link": "https://learn.brivo.com/users/sign_in",
    "cost": "partner",
    "notes": ""
  },
  {
    "course_id": "CRS-ACC-SWHOUSE",
    "brand": "Software House (JCI)",
    "title": "C•CURE 9000 certificates",
    "link": "https://www.swhouse.com/services-and-support/training-and-support-services",
    "cost": "partner",
    "notes": ""
  },
  {
    "course_id": "CRS-ACC-BOSCH",
    "brand": "Bosch / Keenfinity",
    "title": "Bosch access & intrusion free online",
    "link": "https://www.keenfinity-group.com/us/en/support/learning/training/",
    "cost": "free",
    "notes": "Shared with CCTV portal"
  },
  {
    "course_id": "CRS-CAB-BELDEN-LEARN",
    "brand": "Belden",
    "title": "Belden Learn free / installer prep",
    "link": "https://learn.belden.com/learn",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-CAB-BELDEN-CI",
    "brand": "Belden",
    "title": "Belden Certified Installer",
    "link": "https://www.belden.com/knowledge-hub/training/certifications",
    "cost": "partner",
    "notes": "Installer program"
  },
  {
    "course_id": "CRS-CAB-COMMSCOPE-ACCT",
    "brand": "CommScope",
    "title": "MyCommScope account + free training portal content",
    "link": "https://www.commscope.com/training/",
    "cost": "free",
    "notes": "Account first"
  },
  {
    "course_id": "CRS-CAB-COMMSCOPE-SYSTIMAX",
    "brand": "CommScope",
    "title": "SYSTIMAX / NETCONNECT Installer (ND/IP)",
    "link": "https://www.commscope.com/training/",
    "cost": "partner",
    "notes": "PartnerPRO"
  },
  {
    "course_id": "CRS-CAB-PANDUIT",
    "brand": "Panduit",
    "title": "Panduit ONE Enterprise Structured Cabling Deployment",
    "link": "https://www.panduit.com/en/support/university-of-panduit/training-overview/course-catalogs/industrial-network.html",
    "cost": "partner",
    "notes": "Warranty cert needs partner"
  },
  {
    "course_id": "CRS-CAB-LEGRAND-ORTRONICS",
    "brand": "Legrand Ortronics",
    "title": "Ortronics CI / CIP / CIP-Elite",
    "link": "https://www.legrand.us/training/data-communications/program-and-warranties",
    "cost": "partner",
    "notes": "Decide if GSIS sells Legrand"
  },
  {
    "course_id": "CRS-NET-UI-ACADEMY",
    "brand": "Ubiquiti",
    "title": "UniFi Academy free stack courses",
    "link": "https://www.ui.com/training/",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-NET-UI-ILT",
    "brand": "Ubiquiti",
    "title": "UniFi instructor-led paid certifications",
    "link": "https://www.ui.com/training/",
    "cost": "paid",
    "notes": ""
  },
  {
    "course_id": "CRS-NET-MERAKI-HUB",
    "brand": "Cisco / Meraki",
    "title": "Meraki Learning Hub free courses",
    "link": "https://learning.meraki.net/",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-NET-MERAKI-ECMS",
    "brand": "Cisco / Meraki",
    "title": "ECMS / Meraki Solutions Specialist exam",
    "link": "https://learning.meraki.net/",
    "cost": "paid",
    "notes": "$300 exam"
  },
  {
    "course_id": "CRS-NET-RUCKUS-PREP",
    "brand": "RUCKUS (CommScope)",
    "title": "RUCKUS free prep courses (MyCommScope)",
    "link": "https://www.ruckusnetworks.com/resources/training-and-certifications/",
    "cost": "free",
    "notes": "Uncertain brand for GSIS"
  },
  {
    "course_id": "CRS-NET-RUCKUS-RCWA",
    "brand": "RUCKUS (CommScope)",
    "title": "RUCKUS Certified Wi-Fi Associate (RCWA) exam",
    "link": "https://www.ruckusnetworks.com/resources/training-and-certifications/",
    "cost": "paid",
    "notes": "$150 exam"
  },
  {
    "course_id": "CRS-AV-LEGRAND",
    "brand": "Legrand AV",
    "title": "Legrand AV University free product certs",
    "link": "https://www.legrandav.com/tools_and_training/training/training_and_certification",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-AV-CRESTRON",
    "brand": "Crestron",
    "title": "Crestron free online CTA path (CTA-C / CTA-R intro)",
    "link": "https://www.crestron.com/Training-Events/Training",
    "cost": "free",
    "notes": "Dealer status may be asked"
  },
  {
    "course_id": "CRS-AV-CRESTRON-DM",
    "brand": "Crestron",
    "title": "DM NVX Certified Designer/Engineer",
    "link": "https://www.crestron.com/Training-Events/Training",
    "cost": "partner",
    "notes": "Dealer"
  },
  {
    "course_id": "CRS-AV-EXTRON",
    "brand": "Extron",
    "title": "Extron Institute free courses (EAVA path)",
    "link": "https://www.extron.com/training",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-AV-EXTRON-CERT",
    "brand": "Extron",
    "title": "Extron certification programs (fee)",
    "link": "https://www.extron.com/training",
    "cost": "paid",
    "notes": "Ask rep"
  },
  {
    "course_id": "CRS-AV-BIAMP",
    "brand": "Biamp",
    "title": "Biamp Design / Field Engineer Tesira competencies",
    "link": "https://www.biamp.com/training/training-overview",
    "cost": "free",
    "notes": "Account with MFA"
  },
  {
    "course_id": "CRS-AV-SHURE",
    "brand": "Shure",
    "title": "Shure Academy + webinars (AVIXA RUs)",
    "link": "https://www.shure.com/en-US/shure-academy",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-MON-DACT-GUIDE",
    "brand": "GSIS Internal",
    "title": "GSIS Monitoring/DACT programming & central-station handoff",
    "link": "file:///workspace/GSIS/Training/Programming-Guide/GSIS-Programming-Guide.md",
    "cost": "free",
    "notes": "Internal guide Ch. monitoring/DACT"
  },
  {
    "course_id": "CRS-MON-POTTER",
    "brand": "Potter",
    "title": "Potter Academy modules covering communicators / reporting",
    "link": "https://www.pottersignal.com/academy",
    "cost": "free",
    "notes": "Same Potter Academy account"
  },
  {
    "course_id": "CRS-MON-MYHBU-CLSS",
    "brand": "Honeywell CLSS",
    "title": "Honeywell CLSS / communicator online courses (MyHBU)",
    "link": "https://buildings.honeywell.com/us/en/support/training",
    "cost": "free",
    "notes": "Recert tokens are paid"
  },
  {
    "course_id": "CRS-MON-BOSCH",
    "brand": "Bosch / Keenfinity",
    "title": "Bosch intrusion/reporting free online",
    "link": "https://www.keenfinity-group.com/us/en/support/learning/training/",
    "cost": "free",
    "notes": ""
  },
  {
    "course_id": "CRS-AER-PART107",
    "brand": "FAA",
    "title": "FAA Part 107 Remote Pilot Certificate (initial)",
    "link": "https://www.faa.gov/uas/commercial_operators/become_a_drone_pilot",
    "cost": "paid",
    "notes": "Knowledge test fee; cert # MISSING in GSIS supplier list"
  },
  {
    "course_id": "CRS-AER-PART107-REC",
    "brand": "FAA",
    "title": "Part 107 recurrent (every 24 months)",
    "link": "https://www.faa.gov/uas/commercial_operators/become_a_drone_pilot",
    "cost": "paid",
    "notes": ""
  },
  {
    "course_id": "CRS-AER-B4UFLY",
    "brand": "FAA / B4UFLY",
    "title": "Airspace / B4UFLY operational familiarization",
    "link": "https://www.faa.gov/uas/recreational_flyers/b4ufly",
    "cost": "free",
    "notes": "Ops requirement"
  },
  {
    "course_id": "CRS-AER-GSIS-SOP",
    "brand": "GSIS Internal",
    "title": "GSIS Aerial flight ops + job closeout SOP",
    "link": "file:///workspace/GSIS/Drone/README.md",
    "cost": "free",
    "notes": "Internal"
  },
  {
    "course_id": "CRS-MOTO-001",
    "brand": "Motorola / Avigilon",
    "title": "Introduction to the Learning Center",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/me/playlist-detail/playl000000000001680",
    "cost": "price not shown",
    "notes": "10 min",
    "family": "Getting Started",
    "optional": false,
    "required": true,
    "sequence": 1,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-002",
    "brand": "Motorola / Avigilon",
    "title": "Learning Center Overview",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/me/playlist-detail/playl000000000001680",
    "cost": "price not shown",
    "notes": "5 min",
    "family": "Getting Started",
    "optional": false,
    "required": true,
    "sequence": 2,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-003",
    "brand": "Motorola / Avigilon",
    "title": "Localized Content Navigation",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/me/playlist-detail/playl000000000001680",
    "cost": "price not shown",
    "notes": "5 min",
    "family": "Getting Started",
    "optional": false,
    "required": true,
    "sequence": 3,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-004",
    "brand": "Motorola / Avigilon",
    "title": "Group Management in the Learning Center",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/me/playlist-detail/playl000000000001680",
    "cost": "price not shown",
    "notes": "30 min",
    "family": "Getting Started",
    "optional": false,
    "required": true,
    "sequence": 4,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-005",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Video 8 Operator and Administrator (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "Curriculum",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 5,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-006",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Video 8 Certification (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 6,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-007",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video Network Technologies",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 7,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-008",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video Hardware and Installation",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 8,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-009",
    "brand": "Motorola / Avigilon",
    "title": "Foundations",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 9,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-010",
    "brand": "Motorola / Avigilon",
    "title": "Supplementary Videos",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 10,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-011",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video Analytics",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 11,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-012",
    "brand": "Motorola / Avigilon",
    "title": "Control Center Unification",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 12,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-013",
    "brand": "Motorola / Avigilon",
    "title": "Camera Mounting Options",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 13,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-014",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video 8 Administrator I",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 14,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-015",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video 8 Administrator II",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 15,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-016",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video 8 Operator I",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 16,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-017",
    "brand": "Motorola / Avigilon",
    "title": "Unity Video 8 Operator II",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 17,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-018",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Decision Management System Operation and Configuration",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 18,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-019",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Decision Management System Certification (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 19,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-020",
    "brand": "Motorola / Avigilon",
    "title": "L6A Enterprise LPR Camera",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "17 min",
    "family": "Unity Video — owned",
    "optional": false,
    "required": true,
    "sequence": 20,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-021",
    "brand": "Motorola / Avigilon",
    "title": "Pelco Introduction",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 21,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-022",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert General Support",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "Curriculum",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 22,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-023",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Overview",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 23,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-024",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Professional Introduction",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 24,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-025",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Alarm and Event Management",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 25,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-026",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Components and Accessories",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 26,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-027",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert VxToolbox Overview",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 27,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-028",
    "brand": "Motorola / Avigilon",
    "title": "Pelco Camera Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "May have 0 classes; confirm session availability",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 28,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-029",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Professional Certification (Virtual)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "Certification classes may have 0 classes",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 29,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-030",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Enterprise Certification (Virtual)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "Certification classes may have 0 classes",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 30,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-031",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Operator and Administrator Certification (Virtual)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "Certification classes may have 0 classes",
    "family": "Pelco — owned",
    "optional": false,
    "required": true,
    "sequence": 31,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-032",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Access 7 Operator and Administrator (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "Curriculum",
    "family": "Unity Access — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 32,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-033",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Access 7 Installation, Configuration and Operation",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Access — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 33,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-034",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Access 7 Certification (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Unity Access — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 34,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-035",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Access Operation",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 35,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-036",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Access Installation and Configuration",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 36,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-037",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Access Certification Exam",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "30 min; typed as course",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 37,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-038",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Video (Ava/Aware) Configuration and Operation",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "4 h",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 38,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-039",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Video Certification Exam",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "30 min; typed as course",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 39,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-040",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Aware Certification (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 40,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-041",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Control Center Certification (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Alta",
    "cost": "price not shown",
    "notes": "",
    "family": "Alta — visible; expansion pending",
    "optional": false,
    "required": true,
    "sequence": 41,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-042",
    "brand": "Motorola / Avigilon",
    "title": "VS&A Sales Associate Certification",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 42,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-043",
    "brand": "Motorola / Avigilon",
    "title": "IndigoVision Control Center Partner Certification (Online)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 43,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-044",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Video 8 Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 44,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-045",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Unity Access 7 Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 45,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-046",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Video Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 46,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-047",
    "brand": "Motorola / Avigilon",
    "title": "Avigilon Alta Access Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Avigilon",
    "cost": "price not shown",
    "notes": "",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 47,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-048",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Enterprise Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "May have 0 classes",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 48,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-049",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Professional Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "May have 0 classes",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 49,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MOTO-050",
    "brand": "Motorola / Avigilon",
    "title": "Pelco VideoXpert Operator and Administrator Certification (Instructor-Led)",
    "link": "https://learningcenter-vsa.motorolasolutions.com/Saba/Web_spf/NA7P2PRD025/app/catalog/search?selectedTab=LEARNINGEVENT&searchText=Pelco",
    "cost": "price not shown",
    "notes": "May have 0 classes",
    "family": "Optional / later — not required sequence",
    "optional": true,
    "required": false,
    "sequence": 50,
    "source": "Signed-in catalog visit 2026-11-06 ~10:17 AM PT",
    "registration_status": "Not Registered"
  },
  {
    "course_id": "CRS-MYGSIS-CORE",
    "title": "MYGSIS • Everyone’s operating workflow",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-DESIGNER",
    "title": "System Designer • Design to submittal",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-ESTIMATOR",
    "title": "Estimator • Scope to reviewed estimate",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-SALES",
    "title": "Sales • Proposal, SOV and risk",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-OPS",
    "title": "Ops Manager • Dispatch to daily log",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-ACCOUNTING",
    "title": "Accounting • Evidence to invoice and AR",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-PM",
    "title": "Project Manager • Signed job to closeout",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-ADMIN-PROCUREMENT",
    "title": "Procurement • Independent takeoff to delivery",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-SAFETY-CALOSHA",
    "title": "Safety • Cal/OSHA orientation",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-SAFETY-JHA",
    "title": "Safety • Job-hazard analysis",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-SAFETY-FIRSTAID",
    "title": "Safety • First-aid readiness",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-FA-NICET-ORIENTATION",
    "title": "NICET • Optional Fire Alarm credential planning",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "notes": "Interactive internal practice; not an external credential or enrollment.",
    "kind": "interactive"
  },
  {
    "course_id": "CRS-SOFTWARE-FRAMEWORK",
    "title": "Software • One framework for every GSIS app",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-FIRE-ITM",
    "title": "Fire • Itm workflow",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-FIRE-SERVICE",
    "title": "Fire • Service workflow",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-FIRE-PROGRAMMING",
    "title": "Fire • Programming workflow",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-PROGRESS",
    "title": "GSIS Aerial • Construction Progress Reports SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-ORTHO",
    "title": "GSIS Aerial • Orthomosaic Mapping SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-3D",
    "title": "GSIS Aerial • 3D Models SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-STOCKPILE",
    "title": "GSIS Aerial • Stockpile Volumes SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-INSPECTIONS",
    "title": "GSIS Aerial • Roof / Site / Infrastructure Inspections SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-ASBUILT",
    "title": "GSIS Aerial • As-Built Documentation SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  },
  {
    "course_id": "CRS-AERIAL-SOP-REALESTATE",
    "title": "GSIS Aerial • Real Estate Media SOP",
    "brand": "GSIS Internal",
    "link": "",
    "cost": "internal",
    "kind": "interactive",
    "notes": "GSIS-authored internal practice; not enrollment or an external credential."
  }
];

const LV_SOP_COURSES = [
  {
    "course_id": "CRS-LV-SOP-CCTV",
    "title": "CCTV — Video surveillance workflow",
    "brand": "GSIS Internal",
    "cost": "internal",
    "notes": "Documented project-specific workflow. Preserve all ASSUMED, VERIFY and INPUT NEEDED qualifications; not universal design rules.",
    "kind": "interactive",
    "path_id": "PATH-CCTV",
    "link": ""
  },
  {
    "course_id": "CRS-LV-SOP-ACCESS",
    "title": "AC — Access control workflow",
    "brand": "GSIS Internal",
    "cost": "internal",
    "notes": "Documented project-specific workflow. Preserve all ASSUMED, VERIFY and INPUT NEEDED qualifications; not universal design rules.",
    "kind": "interactive",
    "path_id": "PATH-ACCESS",
    "link": ""
  },
  {
    "course_id": "CRS-LV-SOP-AV",
    "title": "AV — Audio-visual workflow",
    "brand": "GSIS Internal",
    "cost": "internal",
    "notes": "Documented project-specific workflow. Preserve all ASSUMED, VERIFY and INPUT NEEDED qualifications; not universal design rules.",
    "kind": "interactive",
    "path_id": "PATH-AV",
    "link": ""
  },
  {
    "course_id": "CRS-LV-SOP-NET",
    "title": "NW — Networking / Wi-Fi workflow",
    "brand": "GSIS Internal",
    "cost": "internal",
    "notes": "Documented project-specific workflow. Preserve all ASSUMED, VERIFY and INPUT NEEDED qualifications; not universal design rules.",
    "kind": "interactive",
    "path_id": "PATH-NET",
    "link": ""
  },
  {
    "course_id": "CRS-LV-SOP-CABLING",
    "title": "SC — Structured cabling workflow",
    "brand": "GSIS Internal",
    "cost": "internal",
    "notes": "Documented project-specific workflow. Preserve all ASSUMED, VERIFY and INPUT NEEDED qualifications; not universal design rules.",
    "kind": "interactive",
    "path_id": "PATH-CABLING",
    "link": ""
  }
];

const PRACTICE = {
  "CRS-MYGSIS-CORE": {
    "course_id": "CRS-MYGSIS-CORE",
    "title": "MYGSIS • Everyone’s operating workflow",
    "steps": [
      {
        "title": "1. Start with your live workspace",
        "body": "Open Dashboard in the left sidebar. Confirm you are in the correct organization/login before opening job information. The office sidebar includes Schedule, Ops Dashboard, Resource Board, Bids, Leads, Contractor Directory, Estimates, Rate Card, Projects, Documents, Training and Billing. Visibility depends on your login. If your sidebar shows Chats, that is team chat; no Chats URL is assumed here.",
        "task": "Identify your division and the job/task you are permitted to review.",
        "open_path": "/Dashboard",
        "open_label": "Dashboard"
      },
      {
        "title": "2. Locate your bid",
        "body": "In the left sidebar under Sales & Estimating, open Bids. Use “Search by title, client, or agency...” to find a bid you can already see and open it. Select Overview and read the scope. Do not change Status or award a real bid during practice.",
        "task": "Identify the bid and one missing scope item in the practice notes.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "3. Read the source documents",
        "body": "Open Bids, open the same visible bid, then select Documents. Under Uploaded Documents, use View on an available document. Read the relevant scope, specifications and addenda. If no documents exist, record MISSING instead of inventing quantities.",
        "task": "Find the current source revision and a scope reference.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "4. Trace a drawing to quantities",
        "body": "Open Bids, open your visible bid and select Drawings. Compare its sheets with Drawing Analysis, then select BOQ. Read Description, Qty, Unit and Category. AI output must be checked against the source sheets; do not run or apply a takeoff merely to pass practice.",
        "task": "Compare one available quantity with its sheet; record unresolved differences.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "5. Review the estimate without sending",
        "body": "Open Bids, open the same record and select Estimate. Read Estimate Details, Labor, Materials & Line Items and Notes. Compare the source quantities and costs. Do not use Send to Client, Send RFQ or change bid Status during practice.",
        "task": "Record a cost-source question for the estimator.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "6. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Prepare the dispatch evidence",
        "body": "Open Projects, open the chosen visible project and select Ops / Field Docs. Click New Ops Doc. In New Ops / Field Doc, choose the appropriate Type, enter Title *, Linked Phase and Notes, and select approved File attachments (stored privately). Notes must identify visit scope, source drawings, site access, safety and delivery proof. If delivery is not confirmed, write DO NOT ROLL and escalate. Click Create only on an authorized training record; otherwise Cancel. Verify any saved title and attachments in Ops / Field Docs.",
        "task": "Prepare a packet from real evidence or explicitly list MISSING items; never claim a delivery or visit occurred.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Keep Outlook filing separate",
        "body": "Open Documents in MYGSIS to locate the related job evidence with Search name… and All Projects. Partner/vendor email filing is an Outlook rule, not a MYGSIS screen: in Outlook, file the thread in that partner/vendor’s own folder and sort/tag it by job, division/domain, topic and date. MYGSIS does not autofile mail. Do not send mail during practice.",
        "task": "Identify the correct job document here and the partner/vendor folder needed in Outlook; no mail is sent by this player.",
        "open_path": "/Documents",
        "open_label": "Documents"
      },
      {
        "title": "9. Reconcile billing evidence",
        "body": "Open Billing in the left sidebar under Billing. Use Search project or client… to find the project. Read Contract, Billed, Retention Held, Outstanding and Status. Compare them with the approved scope and project evidence; do not generate an invoice or payment merely for practice.",
        "task": "Record one evidence discrepancy or confirm the figures you actually checked.",
        "open_path": "/Billing",
        "open_label": "Billing"
      },
      {
        "title": "10. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you find bid quantities?",
        "choices": [
          "Open Bids, an accessible record, then BOQ; verify against Drawings.",
          "Open a Procurement tab inside Bid Detail.",
          "Open a guessed project-id URL."
        ],
        "answer": 0
      },
      {
        "question": "Where are partner/vendor emails filed?",
        "choices": [
          "In that partner/vendor’s own Outlook folder; MYGSIS does not autofile mail.",
          "MYGSIS automatically files every vendor message.",
          "Send the thread to a random folder."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test).",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-DESIGNER": {
    "course_id": "CRS-ADMIN-DESIGNER",
    "title": "System Designer • Design to submittal",
    "steps": [
      {
        "title": "1. Locate your bid",
        "body": "In the left sidebar under Sales & Estimating, open Bids. Use “Search by title, client, or agency...” to find a bid you can already see and open it. Select Overview and read the scope. Do not change Status or award a real bid during practice.",
        "task": "Identify the bid and one missing scope item in the practice notes.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "2. Read the source documents",
        "body": "Open Bids, open the same visible bid, then select Documents. Under Uploaded Documents, use View on an available document. Read the relevant scope, specifications and addenda. If no documents exist, record MISSING instead of inventing quantities.",
        "task": "Find the current source revision and a scope reference.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "3. Open the actual design context",
        "body": "Open Bids, open the visible record and select Designer. Confirm Designer Controls is present. This is MYGSIS drawing markup, not a FireCode workspace. If the tab or controls are absent for your login, stop and report that difference rather than substituting another screen.",
        "task": "Locate Classification and Search symbols without modifying a client layout.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "4. Prepare a permitted practice drawing",
        "body": "In the same bid’s Designer tab, use Classification to choose the applicable discipline. Only on an authorized training record, use Upload blank drawing / blueprint with a non-client training image/PDF you are allowed to upload. Uploading stores a file immediately. If no authorized training record exists, inspect only and record the blocker.",
        "task": "Confirm the training drawing is the intended sheet before placing anything.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "5. Place and check one symbol",
        "body": "In the same bid’s Designer tab, enter a term in Search symbols, select an actual listed symbol and click the drawing to place it. Use Symbol Count Summary to check the count, and Undo to reverse a practice placement. Do this only in the authorized training layout, never a live client design.",
        "task": "Locate the symbol and compare the count before and after Undo.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "6. Caption and retain an authorized layout",
        "body": "In the same bid’s Designer tab, choose Note, enter text in “Type note text, then click on drawing” and place the note on the training drawing. Verify the annotation. Save designer layout writes to that bid: use it only with explicit authorization for the training record. PNG and PDF are available exports, not design approval.",
        "task": "Save only an approved training revision; otherwise leave the client record unchanged.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "7. Separate FireCode and qualified design review",
        "body": "Open Bids, your visible record, then Designer to compare the markup context. FireCode Architect is separate software; it is not inside MYGSIS. FireCode demo training is the separate Fire → Design course. A stamped engineering review and AHJ approval cannot be completed by this markup tab. Do not invent calculation, stamping or approval controls.",
        "task": "Record the external design/review dependencies in your practice notes.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "8. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "9. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Which live bid tab contains MYGSIS drawing markup?",
        "choices": [
          "Designer, with Designer Controls.",
          "A FireCode workspace inside MYGSIS.",
          "Procurement."
        ],
        "answer": 0
      },
      {
        "question": "Does saving a designer layout approve the engineering?",
        "choices": [
          "No; qualified review and required approvals remain separate.",
          "Yes, it stamps the drawing.",
          "Yes, it submits to the AHJ."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). BidDetail.jsx; components/bids/DrawingDesignerTab.jsx; components/projects/DocumentsTab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-ESTIMATOR": {
    "course_id": "CRS-ADMIN-ESTIMATOR",
    "title": "Estimator • Scope to reviewed estimate",
    "steps": [
      {
        "title": "1. Locate your bid",
        "body": "In the left sidebar under Sales & Estimating, open Bids. Use “Search by title, client, or agency...” to find a bid you can already see and open it. Select Overview and read the scope. Do not change Status or award a real bid during practice.",
        "task": "Identify the bid and one missing scope item in the practice notes.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "2. Read the source documents",
        "body": "Open Bids, open the same visible bid, then select Documents. Under Uploaded Documents, use View on an available document. Read the relevant scope, specifications and addenda. If no documents exist, record MISSING instead of inventing quantities.",
        "task": "Find the current source revision and a scope reference.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "3. Trace a drawing to quantities",
        "body": "Open Bids, open your visible bid and select Drawings. Compare its sheets with Drawing Analysis, then select BOQ. Read Description, Qty, Unit and Category. AI output must be checked against the source sheets; do not run or apply a takeoff merely to pass practice.",
        "task": "Compare one available quantity with its sheet; record unresolved differences.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "4. Check the rate source",
        "body": "Open Rate Card under Sales & Estimating. Use Search items… to find an applicable existing item. Read the recorded rate and its context; do not substitute a guessed price or modify the company rate card during practice.",
        "task": "Record the source rate reference and any missing quote or labor input.",
        "open_path": "/RateCard",
        "open_label": "Rate Card"
      },
      {
        "title": "5. Enter a source-backed estimate line",
        "body": "Open Bids, open the authorized training record and select Estimate. If it is empty, use Create Estimate; otherwise use Edit. Under Materials & Line Items use Add Item. Fill Name, Description, Qty, Unit and Unit $ from an approved training source; use Cost Code only if known. Inspect Labor and the summary. If not authorized to edit this record, inspect only.",
        "task": "Reconcile one permitted line to the source quantity and quote; never invent prices.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "6. Save and verify only permitted work",
        "body": "In the same bid’s Estimate tab, review Notes and the totals before Save. Save only the authorized training estimate, then reopen Estimate to verify it. Use Cancel instead on client records without edit authority. Do not use Send to Client or Send RFQ and do not award the bid.",
        "task": "Confirm the saved line and total match the approved input, or record the blocked edit.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "7. Find the estimate from the index",
        "body": "Open Estimates under Sales & Estimating. Filter with Bid or Project and use Open on the matching record. Verify the version you reviewed, rather than creating duplicate estimates.",
        "task": "Locate the reviewed estimate or note that no linked version is available.",
        "open_path": "/Estimates",
        "open_label": "Estimates"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you add a line in Bid Detail?",
        "choices": [
          "Estimate → Edit (or Create Estimate) → Materials & Line Items → Add Item.",
          "A dedicated Procurement tab.",
          "Billing → Award."
        ],
        "answer": 0
      },
      {
        "question": "What if a price has no source?",
        "choices": [
          "Record it as MISSING and resolve it before approval.",
          "Invent a typical price.",
          "Send the bid anyway."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). BidDetail.jsx; EstimateEditor.jsx; Estimates.jsx; RateCard.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-SALES": {
    "course_id": "CRS-ADMIN-SALES",
    "title": "Sales • Proposal, SOV and risk",
    "steps": [
      {
        "title": "1. Find the lead",
        "body": "Open Leads under Sales & Estimating. Enter a known company/contact in Search leads… and use All Stages to review the pipeline. Use an existing visible lead rather than creating a duplicate.",
        "task": "Locate the actual lead and read its current stage.",
        "open_path": "/Leads",
        "open_label": "Leads"
      },
      {
        "title": "2. Prepare the follow-up without sending",
        "body": "In Leads, choose Edit on a permitted lead. Read Company, Contact Name *, Stage, Follow-up Date and Notes. For an authorized training record, enter a source-backed follow-up date and next action in Notes, then Save and reopen Edit to verify. Otherwise Cancel. Do not send email from practice.",
        "task": "Verify the saved next action or record the lack of edit authorization.",
        "open_path": "/Leads",
        "open_label": "Leads"
      },
      {
        "title": "3. Check the contractor context",
        "body": "Open Contractor Directory under Sales & Estimating. Search name or license… to locate the known company. Review its available company/contact details; do not invent contact information or add a duplicate record.",
        "task": "Match the company to the opportunity using existing evidence.",
        "open_path": "/ContractorDirectory",
        "open_label": "Contractor Directory"
      },
      {
        "title": "4. Locate your bid",
        "body": "In the left sidebar under Sales & Estimating, open Bids. Use “Search by title, client, or agency...” to find a bid you can already see and open it. Select Overview and read the scope. Do not change Status or award a real bid during practice.",
        "task": "Identify the bid and one missing scope item in the practice notes.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "5. Read the source documents",
        "body": "Open Bids, open the same visible bid, then select Documents. Under Uploaded Documents, use View on an available document. Read the relevant scope, specifications and addenda. If no documents exist, record MISSING instead of inventing quantities.",
        "task": "Find the current source revision and a scope reference.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "6. Review the proposed price",
        "body": "Open Bids, open the chosen record and select Estimate. Review Estimate Details and Notes against the client scope and exclusions. Do not use Send to Client, Send RFQ or an award/status change during practice.",
        "task": "Write one commercial question to resolve before an authorized proposal release.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "7. Check the billing handoff",
        "body": "Open Projects, open an existing permitted project and select SOV & Pay Apps. Read Schedule of Values, Retention %, Billable Amount and % Complete. This review is not authorization to Generate Pay App or change billing. A bid with no project cannot complete this project step yet; note that dependency.",
        "task": "Match the signed scope to the billing milestones if an accessible project exists.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Keep Outlook filing separate",
        "body": "Open Documents in MYGSIS to locate the related job evidence with Search name… and All Projects. Partner/vendor email filing is an Outlook rule, not a MYGSIS screen: in Outlook, file the thread in that partner/vendor’s own folder and sort/tag it by job, division/domain, topic and date. MYGSIS does not autofile mail. Do not send mail during practice.",
        "task": "Identify the correct job document here and the partner/vendor folder needed in Outlook; no mail is sent by this player.",
        "open_path": "/Documents",
        "open_label": "Documents"
      },
      {
        "title": "9. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where is the lead follow-up date?",
        "choices": [
          "Leads → Edit → Follow-up Date.",
          "A guessed Chats URL.",
          "Bid Detail → Procurement."
        ],
        "answer": 0
      },
      {
        "question": "Can practice send the client proposal?",
        "choices": [
          "No. Do not send mail or award real bids during practice.",
          "Yes, Next sends it.",
          "Yes, the quiz approves the bid."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Leads.jsx; ContractorDirectory.jsx; BidDetail.jsx; ScheduleOfValuesTab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-OPS": {
    "course_id": "CRS-ADMIN-OPS",
    "title": "Ops Manager • Dispatch to daily log",
    "steps": [
      {
        "title": "1. Read the actual ops workload",
        "body": "Open Ops Dashboard in the left sidebar. Review Progress per Project, Targets vs Actual (Phases) and Upcoming Phases — What’s Next. Record the project and phase needing attention; a chart is not proof of completed field work.",
        "task": "Identify the next visible phase to verify.",
        "open_path": "/OpsDashboard",
        "open_label": "Ops Dashboard"
      },
      {
        "title": "2. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Check materials before dispatch",
        "body": "Open Projects, open the chosen record and select Materials. Compare the listed quantities and supplier information with actual delivery evidence. A Materials entry is not proof of delivery. If there is no proof, record DO NOT ROLL and escalate.",
        "task": "Identify the missing delivery evidence or the source that confirms receipt.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Review resource capacity",
        "body": "Open Resource Board in the left sidebar. Its heading is Resource Allocation. Use Today and the week arrows to find the relevant period on the Allocation board. Check visible conflict badges. Do not click Assign to book a real crew merely for practice.",
        "task": "Identify a potential conflict and the affected job without altering assignments.",
        "open_path": "/ResourceBoard",
        "open_label": "Resource Board"
      },
      {
        "title": "5. Check the scheduled visit",
        "body": "Open Schedule in the left sidebar (this opens Calendar). Use All Projects to select the project and review the visible visit dates. Do not Add Event or change a real appointment during practice.",
        "task": "Compare the visit date with parts readiness and crew availability.",
        "open_path": "/Calendar",
        "open_label": "Schedule"
      },
      {
        "title": "6. Prepare the dispatch evidence",
        "body": "Open Projects, open the chosen visible project and select Ops / Field Docs. Click New Ops Doc. In New Ops / Field Doc, choose the appropriate Type, enter Title *, Linked Phase and Notes, and select approved File attachments (stored privately). Notes must identify visit scope, source drawings, site access, safety and delivery proof. If delivery is not confirmed, write DO NOT ROLL and escalate. Click Create only on an authorized training record; otherwise Cancel. Verify any saved title and attachments in Ops / Field Docs.",
        "task": "Prepare a packet from real evidence or explicitly list MISSING items; never claim a delivery or visit occurred.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Review field evidence",
        "body": "Open Projects, open the same visible record and select Field Logs. Read only existing visit evidence; then return to Ops / Field Docs and compare the packet with recorded facts. Do not mark a visit complete or invent a photo, hours or result.",
        "task": "Record a real open item and its responsible owner in the practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "How is Schedule opened by a walkthrough link?",
        "choices": [
          "The Schedule sidebar label opens the Calendar page.",
          "A made-up Schedule page URL.",
          "The Procurement tab."
        ],
        "answer": 0
      },
      {
        "question": "What if delivery lacks proof?",
        "choices": [
          "DO NOT ROLL; escalate before dispatch.",
          "Materials listed means delivered.",
          "Send the crew anyway."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). OpsDashboard.jsx; ResourceAllocationBoard.jsx; Calendar.jsx; OpsDocDialog.jsx; ProjectMaterials.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-ACCOUNTING": {
    "course_id": "CRS-ADMIN-ACCOUNTING",
    "title": "Accounting • Evidence to invoice and AR",
    "steps": [
      {
        "title": "1. Find the billing row",
        "body": "Open Billing under Billing in the left sidebar. Use Search project or client… and the All / Unbilled / Partial / Complete filter to locate the permitted project. Read Contract, Billed, Retention Held, Outstanding and Status.",
        "task": "Record the figures shown for one actual project without changing them.",
        "open_path": "/Billing",
        "open_label": "Billing"
      },
      {
        "title": "2. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Review approved changes and evidence",
        "body": "In Projects, open the chosen record, then Change Orders. Read the existing approvals and compare them with Documents. Practice does not authorize a change order, invoice or collection email. If approval evidence is absent, record MISSING.",
        "task": "Identify which scope changes have evidence and which need approval.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Reconcile the SOV",
        "body": "In the chosen project, open SOV & Pay Apps. Read Schedule of Values, Retention %, Description, Cost Code, Billable Amount, % Complete, Billed to Date and Remaining Balance. Compare the total with the approved contract. Investigate a total-mismatch warning before any billing.",
        "task": "Check one milestone against its signed scope and progress evidence.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Prepare authorized SOV inputs",
        "body": "In SOV & Pay Apps on an authorized training project, use Add line and fill Description, Cost Code, Billable Amount and % Complete from approved evidence. Confirm Retention % from the contract. Save SOV only with explicit training-record edit authority; reopen the tab to verify. Otherwise inspect without changing any inputs.",
        "task": "Record the checked total and any mismatch; never invent a price or completion percentage.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. Review rather than issue a pay application",
        "body": "In the same project’s SOV & Pay Apps, scroll to Pay Applications. Review existing App #, Period, Earned, Retention, Net Due and Status. Generate Pay App writes a billing record: do not use it during practice or imply the player submits or collects payment.",
        "task": "Reconcile an available application or note that no authorized application exists.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Keep Outlook filing separate",
        "body": "Open Documents in MYGSIS to locate the related job evidence with Search name… and All Projects. Partner/vendor email filing is an Outlook rule, not a MYGSIS screen: in Outlook, file the thread in that partner/vendor’s own folder and sort/tag it by job, division/domain, topic and date. MYGSIS does not autofile mail. Do not send mail during practice.",
        "task": "Identify the correct job document here and the partner/vendor folder needed in Outlook; no mail is sent by this player.",
        "open_path": "/Documents",
        "open_label": "Documents"
      },
      {
        "title": "9. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where is the project SOV?",
        "choices": [
          "Projects → an accessible project → SOV & Pay Apps.",
          "A guessed WIP sidebar label.",
          "Bid Detail → Procurement."
        ],
        "answer": 0
      },
      {
        "question": "Does a listed milestone prove it is billable?",
        "choices": [
          "No; check signed scope, approvals and progress evidence.",
          "Yes, any row can be billed.",
          "Yes, finishing practice sends the invoice."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Billing.jsx; ProjectDetail.jsx; ScheduleOfValuesTab.jsx; DocumentsTab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-PM": {
    "course_id": "CRS-ADMIN-PM",
    "title": "Project Manager • Signed job to closeout",
    "steps": [
      {
        "title": "1. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Review the phase handoff",
        "body": "In the chosen project, open Tracker, then Phases. Compare the visible scope/phase status with signed job documents. Do not advance a phase or alter a client milestone just to finish practice.",
        "task": "Identify the next gate and the document it needs.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Draft a real RFI in the correct place",
        "body": "In the chosen project, open RFIs and click New RFI. Read Subject *, Question *, Category, Priority, Status and Directed To. For an authorized training project, enter a source-referenced question and click Create, then verify it appears in RFIs. Otherwise use Cancel. Do not send mail or invent missing site facts.",
        "task": "Complete an authorized training RFI or record the exact unresolved question without saving.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Track the submittal package",
        "body": "In the chosen project, select Submittals and New Submittal. Fill Title *, Submittal #, Spec Section, Type, Status, Required Date and Description from an approved training package. Create only on a permitted training record, then verify the entry; otherwise Cancel. This does not submit to the AHJ or confer approval.",
        "task": "Locate the package reference and its real review dependency.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. Check change and team ownership",
        "body": "In the same project, open Change Orders and review approved changes, then Team & Roles to identify the responsible people. Do not approve a change or modify access during practice.",
        "task": "Match one open item with the person responsible for resolving it.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Reconcile schedule and materials",
        "body": "Open the project’s Calendar tab, then Materials. Compare the visible work dates with actual parts evidence. Use Ops / Field Docs to review the handoff packet; missing delivery proof means DO NOT ROLL and escalation, not a guessed dispatch.",
        "task": "Record one readiness blocker or a verified evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Check closeout and billing evidence",
        "body": "Open the project’s Punch List, Documents and SOV & Pay Apps tabs. Check that unresolved punch items, approved closeout files and supported progress agree before anyone issues billing. Do not Generate Pay App or mark a client job complete for practice.",
        "task": "Record the next closeout action and owner.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "9. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Which control begins a project RFI?",
        "choices": [
          "Projects → accessible record → RFIs → New RFI.",
          "Bids → Procurement → Email.",
          "The practice quiz creates one."
        ],
        "answer": 0
      },
      {
        "question": "What does a submittal training entry mean?",
        "choices": [
          "It is a record only; external submission/approval is separate.",
          "It automatically approves the engineering.",
          "It enrolls the designer."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). ProjectDetail.jsx; RFITab.jsx; SubmittalsTab.jsx; DocumentsTab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-ADMIN-PROCUREMENT": {
    "course_id": "CRS-ADMIN-PROCUREMENT",
    "title": "Procurement • Independent takeoff to delivery",
    "steps": [
      {
        "title": "1. Locate your bid",
        "body": "In the left sidebar under Sales & Estimating, open Bids. Use “Search by title, client, or agency...” to find a bid you can already see and open it. Select Overview and read the scope. Do not change Status or award a real bid during practice.",
        "task": "Identify the bid and one missing scope item in the practice notes.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "2. Read the source documents",
        "body": "Open Bids, open the same visible bid, then select Documents. Under Uploaded Documents, use View on an available document. Read the relevant scope, specifications and addenda. If no documents exist, record MISSING instead of inventing quantities.",
        "task": "Find the current source revision and a scope reference.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "3. Trace a drawing to quantities",
        "body": "Open Bids, open your visible bid and select Drawings. Compare its sheets with Drawing Analysis, then select BOQ. Read Description, Qty, Unit and Category. AI output must be checked against the source sheets; do not run or apply a takeoff merely to pass practice.",
        "task": "Compare one available quantity with its sheet; record unresolved differences.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "4. Review the actual estimate, not an invented tab",
        "body": "Open Bids, open the chosen visible record and select Estimate. Compare Materials & Line Items with the BOQ and source documents. There is no dedicated Procurement tab in the verified Bid Detail source; do not look for Insert Procurement Prices there. Use only the controls actually visible to your login.",
        "task": "Identify the material line and quote information you still need.",
        "open_path": "/Bids",
        "open_label": "Bids"
      },
      {
        "title": "5. Check supplier records only when available",
        "body": "Suppliers is registered in local pages.config but was not on the verified live office sidebar. Open this screen only if it appears for your login; otherwise skip it and report unavailable. On Suppliers use Search suppliers… and inspect an existing supplier’s Edit form for Name *, Category, Contact, Payment Terms and Notes; Cancel without changing client data.",
        "task": "Verify an existing supplier reference; do not invent vendor contacts.",
        "open_path": "/Suppliers",
        "open_label": "Suppliers"
      },
      {
        "title": "6. Inspect a purchase order without placing one",
        "body": "PurchaseOrders is registered locally but was not on the verified live office sidebar. Open it only if it appears for your login; otherwise report unavailable. On Purchase Orders, inspect an existing order with Edit. Review Project *, Vendor *, Line Items, Tax, Shipping and Notes, then Cancel. Do not Create, Update, Void or send an order during practice.",
        "task": "Compare an existing PO with its approved quote; practice is not purchase approval.",
        "open_path": "/PurchaseOrders",
        "open_label": "Purchase Orders"
      },
      {
        "title": "7. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Record materials with source evidence",
        "body": "In the permitted project, select Materials and Add Material. Read Material Name *, Category, Quantity, Unit, Unit Cost ($), Supplier, Description and Notes. Only on an authorized training record, enter source-backed material details and click Add Material, then verify the row. Otherwise Cancel. This records a material, not a delivery or purchase.",
        "task": "Preserve quote/date references in Notes and never mark unproven delivery as confirmed.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "9. Prepare the dispatch evidence",
        "body": "Open Projects, open the chosen visible project and select Ops / Field Docs. Click New Ops Doc. In New Ops / Field Doc, choose the appropriate Type, enter Title *, Linked Phase and Notes, and select approved File attachments (stored privately). Notes must identify visit scope, source drawings, site access, safety and delivery proof. If delivery is not confirmed, write DO NOT ROLL and escalate. Click Create only on an authorized training record; otherwise Cancel. Verify any saved title and attachments in Ops / Field Docs.",
        "task": "Prepare a packet from real evidence or explicitly list MISSING items; never claim a delivery or visit occurred.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "10. Keep Outlook filing separate",
        "body": "Open Documents in MYGSIS to locate the related job evidence with Search name… and All Projects. Partner/vendor email filing is an Outlook rule, not a MYGSIS screen: in Outlook, file the thread in that partner/vendor’s own folder and sort/tag it by job, division/domain, topic and date. MYGSIS does not autofile mail. Do not send mail during practice.",
        "task": "Identify the correct job document here and the partner/vendor folder needed in Outlook; no mail is sent by this player.",
        "open_path": "/Documents",
        "open_label": "Documents"
      },
      {
        "title": "11. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Is Procurement a verified Bid Detail tab?",
        "choices": [
          "No; use BOQ, Estimate and Documents, and only available registered screens.",
          "Yes, always click Procurement.",
          "Yes, it auto-inserts quote prices."
        ],
        "answer": 0
      },
      {
        "question": "When may you open Suppliers or Purchase Orders for these steps?",
        "choices": [
          "Only if those screens appear for your login; they were not in the verified live sidebar.",
          "Everyone must find them in the sidebar.",
          "A guessed detail ID bypasses permissions."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). BidDetail.jsx; pages.config.js; Suppliers.jsx; PurchaseOrders.jsx; ProjectMaterials.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-FIRE-ITM": {
    "course_id": "CRS-FIRE-ITM",
    "title": "Fire • Itm workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible Fire ITM job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved inspection scope, prior inspection reports, device inventory and actual test authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan Fire ITM. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. A dedicated inspection/test execution workflow was not verified in live MYGSIS; the separate ITM app is not a tab of this project. Do not invent inspection checkboxes or a test-pass control. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual inspection findings, device references, deficiencies and reviewer signoff; no invented passes. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the Fire ITM reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the Fire ITM evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing FA ITM/service/closeout; existing manufacturer training paths. High-level internal SOP only.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-FIRE-SERVICE": {
    "course_id": "CRS-FIRE-SERVICE",
    "title": "Fire • Service workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible Fire service job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check reported fault, approved service scope, existing records and authorized impairment/testing plan. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan Fire service. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. MYGSIS does not provide verified live panel diagnostics in these screens. Fault investigation and testing happen with qualified personnel and approved equipment/software outside this player. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check reported fault versus actual findings, work performed and unresolved deficiencies. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the Fire service reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the Fire service evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing FA ITM/service/closeout; existing manufacturer training paths. High-level internal SOP only.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-FIRE-PROGRAMMING": {
    "course_id": "CRS-FIRE-PROGRAMMING",
    "title": "Fire • Programming workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible Fire programming job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check panel model/firmware, approved sequence of operations, device/point list, authorized software access and existing backup. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan Fire programming. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Panel programming, uploads/downloads and reacceptance testing are not live MYGSIS controls. Use only authorized manufacturer software and qualified procedures outside MYGSIS; never invent a Programming tab or program a real system during practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check pre/post backups, configuration comparisons, test evidence and unresolved exceptions. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the Fire programming reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the Fire programming evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing FA ITM/service/closeout; existing manufacturer training paths. High-level internal SOP only.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-MON-DACT-GUIDE": {
    "course_id": "CRS-MON-DACT-GUIDE",
    "title": "GSIS Monitoring/DACT programming & central-station handoff",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible Monitoring / DACT handoff job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved monitoring worksheet, panel model, central-station requirements and authorized access; keep account secrets out of practice notes. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan Monitoring / DACT handoff. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Live central-station provisioning, DACT programming and signal verification are not MYGSIS screens. They require the authorized panel software and central station separately; this player must not send a signal, change an account or invent a receiver value. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check approved event mapping, actual receipt confirmations and open test exceptions; never invent account numbers. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the Monitoring / DACT handoff reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the Monitoring / DACT handoff evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Training/Programming-Guide/GSIS-Programming-Guide.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-LV-SOP-CCTV": {
    "course_id": "CRS-LV-SOP-CCTV",
    "title": "CCTV — Video surveillance workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible CCTV job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved camera schedule, coverage/privacy requirements, network/PoE/storage design and current drawing revision. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan CCTV. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Camera/VMS configuration and live-view/retention testing are not MYGSIS project controls. Use authorized manufacturer tools separately; project-specific placement assumptions are not universal design rules. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check camera IDs, actual view/recording/retention evidence, network references and privacy exceptions. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the CCTV reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the CCTV evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Reference/LV-Workflows/LV-Workflow-CCTV-Video.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-LV-SOP-ACCESS": {
    "course_id": "CRS-LV-SOP-ACCESS",
    "title": "AC — Access control workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible access control job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved door schedule, hardware/egress design, power interfaces and current access requirements. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan access control. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Credential provisioning, unlock commands and controller programming are not verified MYGSIS controls. Use authorized manufacturer software separately; never unlock a real door for practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check door IDs, actual REX/DPI/forced/held test evidence and approved life-safety interface results. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the access control reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the access control evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Reference/LV-Workflows/LV-Workflow-AC-Access.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-LV-SOP-AV": {
    "course_id": "CRS-LV-SOP-AV",
    "title": "AV — Audio-visual workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible audio visual job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved room/equipment list, signal diagram, control requirements and source drawings. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan audio visual. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. AV device/control programming and live commissioning are outside the verified MYGSIS project screens. Use authorized equipment/software separately, not an invented AV commissioning tab. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check room references, signal/audio/video tests, control results and unresolved user requirements. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the audio visual reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the audio visual evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Reference/LV-Workflows/LV-Workflow-AV-Audio-visual.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-LV-SOP-NET": {
    "course_id": "CRS-LV-SOP-NET",
    "title": "NW — Networking / Wi-Fi workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible networking / Wi-Fi job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved topology, AP locations, switch/PoE requirements and network plan; do not put passwords in practice. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan networking / Wi-Fi. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. MYGSIS is not the network controller. Network provisioning, survey measurements and security changes use authorized tools separately; do not invent a Wi-Fi analyzer screen. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual survey/configuration evidence, measured coverage and unresolved security or capacity exceptions. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the networking / Wi-Fi reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the networking / Wi-Fi evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Reference/LV-Workflows/LV-Workflow-NW-Networking.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-LV-SOP-CABLING": {
    "course_id": "CRS-LV-SOP-CABLING",
    "title": "SC — Structured cabling workflow",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible structured cabling job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved drop/cable schedule, telecom-room drawings, labeling scheme and specified certification requirements. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan structured cabling. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Cable certification and instrument measurements are not MYGSIS screens. Use approved field test equipment separately; do not treat drawing estimates or ASSUMED outlet counts as test results. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual cable IDs, source drawings, instrument reports and failed or untested links. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the structured cabling reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the structured cabling evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Reference/LV-Workflows/LV-Workflow-SC-Structured.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-PROGRESS": {
    "course_id": "CRS-AERIAL-SOP-PROGRESS",
    "title": "GSIS Aerial • Construction Progress Reports SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible construction progress reporting job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved repeat-view plan, visit scope, prior report and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan construction progress reporting. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check dated photos, matching viewpoints, captions, actual changes and unresolved site items. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the construction progress reporting reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the construction progress reporting evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-ORTHO": {
    "course_id": "CRS-AERIAL-SOP-ORTHO",
    "title": "GSIS Aerial • Orthomosaic Mapping SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible orthomosaic mapping job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved boundary, accuracy/coordinate requirements, GCP requirements and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan orthomosaic mapping. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check coverage gaps, coordinate/scale checks and measured accuracy; do not claim a land survey. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the orthomosaic mapping reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the orthomosaic mapping evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-3D": {
    "course_id": "CRS-AERIAL-SOP-3D",
    "title": "GSIS Aerial • 3D Models SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible 3D modeling job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved model extent, deliverable format, capture requirements and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan 3D modeling. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual reconstruction completeness, missing surfaces, coordinate/scale checks and review caveats. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the 3D modeling reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the 3D modeling evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-STOCKPILE": {
    "course_id": "CRS-AERIAL-SOP-STOCKPILE",
    "title": "GSIS Aerial • Stockpile Volumes SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible stockpile volumes job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved pile boundaries, base-surface method, accuracy requirements and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan stockpile volumes. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual pile/base definitions, units, calculations and uncertainty; never invent a volume. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the stockpile volumes reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the stockpile volumes evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-INSPECTIONS": {
    "course_id": "CRS-AERIAL-SOP-INSPECTIONS",
    "title": "GSIS Aerial • Roof / Site / Infrastructure Inspections SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible roof / site / infrastructure inspection job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved inspection scope, safe access/capture plan, permitted sensor capability and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan roof / site / infrastructure inspection. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual photo locations, observed defects and inaccessible areas; no unsupported thermal or engineering claim. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the roof / site / infrastructure inspection reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the roof / site / infrastructure inspection evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-ASBUILT": {
    "course_id": "CRS-AERIAL-SOP-ASBUILT",
    "title": "GSIS Aerial • As-Built Documentation SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible as-built documentation job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved capture extent, current drawings, delivery standard and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan as-built documentation. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual site-to-drawing differences, date/location references and unresolved verification items. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the as-built documentation reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the as-built documentation evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AERIAL-SOP-REALESTATE": {
    "course_id": "CRS-AERIAL-SOP-REALESTATE",
    "title": "GSIS Aerial • Real Estate Media SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible real estate media job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved property access, shot list, privacy restrictions and pilot/site authorization. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan real estate media. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual media coverage, requested formats, privacy exclusions and rights to distribute. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the real estate media reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the real estate media evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-AER-GSIS-SOP": {
    "course_id": "CRS-AER-GSIS-SOP",
    "title": "GSIS Aerial flight ops + job closeout SOP",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible aerial flight ops and closeout job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved mission scope, current pilot/aircraft/insurance evidence, site permissions and applicable airspace authorizations. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan aerial flight ops and closeout. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. Flight planning/airspace authorization, aircraft control and photogrammetry processing are not verified live MYGSIS workflows. Use the qualified pilot and authorized external tools separately. MYGSIS does not issue flight approval, generate an orthomosaic/3D mesh or certify survey accuracy. No flight is authorized by practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual flight/capture log, deliverable QA, unresolved issues and acceptance evidence; no invented credentials or pricing. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the aerial flight ops and closeout reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the aerial flight ops and closeout evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: /workspace/GSIS/Drone/README.md. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-SAFETY-CALOSHA": {
    "course_id": "CRS-SAFETY-CALOSHA",
    "title": "Safety • Cal/OSHA orientation",
    "steps": [
      {
        "title": "1. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Locate the approved safety source",
        "body": "In the selected project, open Documents and use Open on an existing safety document. Check approved site safety plan, applicable training/qualifications and actual hazard information. Missing evidence stays MISSING.",
        "task": "Identify the current source for Cal/OSHA job readiness.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Read the actual Safety screen",
        "body": "In the same project, select Safety. Review Total Incidents, Open, Critical and Resolved, and use All Status to filter existing records. Do not create a fictitious incident or treat an empty list as proof that no hazards exist.",
        "task": "Locate the visible status filter and review any relevant existing record.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize what is not a live safety workflow",
        "body": "Keep the selected project’s Safety tab open. Cal/OSHA course certification and a full policy-training workflow are not provided by the MYGSIS incident screen. This practice is not certification or authority for regulated work. Use Documents for supporting evidence, not a fabricated software workflow.",
        "task": "Record the missing workflow or outside qualification needed.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Inspect the incident reporting fields",
        "body": "In the project’s Safety tab, choose Report Incident. Read Incident Type, Severity, Description, Location, Incident Date, Status and Investigation Notes. For this exercise choose Cancel without filing a fake report. For a genuine incident use the authorized site reporting process; practice is not approval to change a client record.",
        "task": "Find the fields needed for accurate reporting, then Cancel.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "What does the project Safety tab manage?",
        "choices": [
          "Safety incident records; it is not a substitute for qualifications or site procedures.",
          "Automatic Cal/OSHA certification.",
          "Emergency dispatch from the quiz."
        ],
        "answer": 0
      },
      {
        "question": "Should a learner file a fictional incident on a client job?",
        "choices": [
          "No; inspect the form and Cancel.",
          "Yes, to pass practice.",
          "Yes, then delete the evidence."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). ProjectDetail.jsx; components/safety/SafetyManager.jsx; DocumentsTab.jsx. Original policy reference: GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-SAFETY-JHA": {
    "course_id": "CRS-SAFETY-JHA",
    "title": "Safety • Job-hazard analysis",
    "steps": [
      {
        "title": "1. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Locate the approved safety source",
        "body": "In the selected project, open Documents and use Open on an existing safety document. Check approved task scope, site conditions, hazards, controls and responsible reviewers. Missing evidence stays MISSING.",
        "task": "Identify the current source for job-hazard analysis.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Read the actual Safety screen",
        "body": "In the same project, select Safety. Review Total Incidents, Open, Critical and Resolved, and use All Status to filter existing records. Do not create a fictitious incident or treat an empty list as proof that no hazards exist.",
        "task": "Locate the visible status filter and review any relevant existing record.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize what is not a live safety workflow",
        "body": "Keep the selected project’s Safety tab open. A dedicated JHA editor/approval flow was not verified in MYGSIS. Prepare and obtain qualified review of the JHA separately, then file the approved document; do not invent a JHA button. Use Documents for supporting evidence, not a fabricated software workflow.",
        "task": "Record the missing workflow or outside qualification needed.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Inspect the incident reporting fields",
        "body": "In the project’s Safety tab, choose Report Incident. Read Incident Type, Severity, Description, Location, Incident Date, Status and Investigation Notes. For this exercise choose Cancel without filing a fake report. For a genuine incident use the authorized site reporting process; practice is not approval to change a client record.",
        "task": "Find the fields needed for accurate reporting, then Cancel.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "What does the project Safety tab manage?",
        "choices": [
          "Safety incident records; it is not a substitute for qualifications or site procedures.",
          "Automatic Cal/OSHA certification.",
          "Emergency dispatch from the quiz."
        ],
        "answer": 0
      },
      {
        "question": "Should a learner file a fictional incident on a client job?",
        "choices": [
          "No; inspect the form and Cancel.",
          "Yes, to pass practice.",
          "Yes, then delete the evidence."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). ProjectDetail.jsx; components/safety/SafetyManager.jsx; DocumentsTab.jsx. Original policy reference: GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-SAFETY-FIRSTAID": {
    "course_id": "CRS-SAFETY-FIRSTAID",
    "title": "Safety • First-aid readiness",
    "steps": [
      {
        "title": "1. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Locate the approved safety source",
        "body": "In the selected project, open Documents and use Open on an existing safety document. Check approved emergency/site plan, first-aid resources and actual responder qualifications. Missing evidence stays MISSING.",
        "task": "Identify the current source for first-aid readiness.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Read the actual Safety screen",
        "body": "In the same project, select Safety. Review Total Incidents, Open, Critical and Resolved, and use All Status to filter existing records. Do not create a fictitious incident or treat an empty list as proof that no hazards exist.",
        "task": "Locate the visible status filter and review any relevant existing record.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize what is not a live safety workflow",
        "body": "Keep the selected project’s Safety tab open. MYGSIS does not provide first-aid certification, emergency dispatch or a verified first-aid readiness checklist. In an emergency follow the site emergency plan; this player is not an emergency service. Use Documents for supporting evidence, not a fabricated software workflow.",
        "task": "Record the missing workflow or outside qualification needed.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Inspect the incident reporting fields",
        "body": "In the project’s Safety tab, choose Report Incident. Read Incident Type, Severity, Description, Location, Incident Date, Status and Investigation Notes. For this exercise choose Cancel without filing a fake report. For a genuine incident use the authorized site reporting process; practice is not approval to change a client record.",
        "task": "Find the fields needed for accurate reporting, then Cancel.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "What does the project Safety tab manage?",
        "choices": [
          "Safety incident records; it is not a substitute for qualifications or site procedures.",
          "Automatic Cal/OSHA certification.",
          "Emergency dispatch from the quiz."
        ],
        "answer": 0
      },
      {
        "question": "Should a learner file a fictional incident on a client job?",
        "choices": [
          "No; inspect the form and Cancel.",
          "Yes, to pass practice.",
          "Yes, then delete the evidence."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). ProjectDetail.jsx; components/safety/SafetyManager.jsx; DocumentsTab.jsx. Original policy reference: GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-FA-NICET-ORIENTATION": {
    "course_id": "CRS-FA-NICET-ORIENTATION",
    "title": "NICET • Optional Fire Alarm credential planning",
    "steps": [
      {
        "title": "1. Locate your project",
        "body": "Open Projects in the left sidebar. Use “Search projects...” and open a record you can already see. Confirm the job before opening its tabs. Use an authorized training record for any practice edits; if none is available, inspect without saving and note the blocker.",
        "task": "Identify the correct project without creating a new job.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the credential requirement",
        "body": "In the chosen project’s Documents tab, use Open on an existing specification or credential requirement. Identify the exact required qualification and role; do not infer that everyone needs the same credential.",
        "task": "Record the source requirement without inventing a certificate number.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Separate planning from official enrollment",
        "body": "Open Training in the sidebar and locate the NICET orientation in Catalog. This internal planning course is not the official NICET application, exam or certification. Those workflows are not in live MYGSIS. Do not enroll, pay or claim a credential during practice.",
        "task": "Identify which official outside requirement still needs confirmation.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      },
      {
        "title": "4. Check recorded evidence, not assumptions",
        "body": "Open the project’s Documents tab and inspect any existing qualification evidence with Open. Check the actual holder, scope and dates in the document; missing evidence remains MISSING. Do not copy private identity information into practice notes.",
        "task": "Record whether evidence is available, not an invented pass.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. File supporting evidence",
        "body": "Open Projects, open the chosen record and select Documents. To file an authorized training document, click Add Document, enter Name *, choose Type and Date, select File (stored privately), and enter Notes identifying its source/revision. Click Add only if authorized to store it; otherwise Cancel. Reopen Documents and use Open on the saved row to verify it.",
        "task": "Complete one permitted evidence filing, or record why saving is blocked. Never upload confidential material as a training sample.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. Review the official training status separately",
        "body": "Open Training. If your login shows My Training, read the assigned official status without changing it. Assignment is not enrollment, and internal practice does not make a person NICET certified. Manufacturer/external courses remain link-outs with no automatic enrollment.",
        "task": "Return to the practice quiz without altering official records.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where is NICET official enrollment completed?",
        "choices": [
          "Outside MYGSIS through the official process; this internal practice does not enroll anyone.",
          "The Next button enrolls the learner.",
          "The project Safety tab awards certification."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). TrainingManagement.jsx; DocumentsTab.jsx; original credential planning reference: GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-SOFTWARE-FRAMEWORK": {
    "course_id": "CRS-SOFTWARE-FRAMEWORK",
    "title": "Software • One framework for every GSIS app",
    "steps": [
      {
        "title": "1. Find the correct job",
        "body": "Open Projects in the MYGSIS sidebar. Use Search projects... to find a visible GSIS software delivery job and open it. Confirm the project before selecting Documents. Use an authorized training record for edits; otherwise inspect only. Never substitute a client job for a training sample.",
        "task": "Identify the job and the document that establishes its scope.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "2. Read the required source package",
        "body": "In the chosen project, select Documents. Use Open on an existing source file and check approved user story, acceptance criteria, data/access constraints and test plan. Record missing inputs instead of inventing them. A policy checklist does not certify a person or approve work.",
        "task": "Record a source revision and one missing or confirmed input.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "3. Prepare the work safely",
        "body": "In the same project, open Ops / Field Docs and review its existing packet; then open Safety to check recorded hazards/incidents. Use the source documents to plan GSIS software delivery. Do not operate equipment, impair a system, fly, change credentials or start testing solely because a walkthrough says Next.",
        "task": "Identify the prerequisite approval or readiness evidence before field work.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "4. Recognize the live software boundary",
        "body": "Open the same project’s Documents tab to collect the supporting files. MYGSIS project screens are not the Base44 software builder or source-control system. Coding, Test User execution, deployment and publishing use the authorized external development tools separately; no verified build/publish control exists in these MYGSIS tabs. Do not invent one or publish from practice. This course walks through MYGSIS job preparation and evidence filing, not an invented integrated tool. If the required external workflow cannot be verified, stop that action and record MISSING.",
        "task": "Name the external tool/qualified person and any undocumented next action.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "5. Review the actual results",
        "body": "In the chosen project, use Documents → Open to inspect an available result file. Check actual acceptance-criterion results, desktop/mobile evidence, failure/permission cases and unresolved bugs; never claim unrun tests passed. Preserve ASSUMED, VERIFY and INPUT NEEDED qualifications. If results do not exist or fail review, record that honestly; do not describe a client result as a passed demo.",
        "task": "Write one evidence-based review finding or a MISSING result.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "6. File permitted evidence and verify it",
        "body": "In the chosen project’s Documents tab, click Add Document. For an authorized training artifact, fill Name *, Type, Date and Notes with the GSIS software delivery reference; select File (stored privately), then Add. Reopen the row with Open and confirm the right file/revision. Otherwise Cancel. Do not upload sensitive credentials or client data for practice.",
        "task": "Complete one authorized filing or explain the blocker in practice notes.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "7. Close the handoff without false completion",
        "body": "In the chosen project, select Ops / Field Docs and Field Logs. Compare only actual recorded work with the GSIS software delivery evidence, and use RFIs to inspect unresolved questions. If a permitted training RFI is needed, use New RFI, fill Subject * and Question *, then Create only with edit authority; otherwise Cancel. Practice never sends mail or marks official completion.",
        "task": "Record the next owner, unresolved issue and evidence reference.",
        "open_path": "/Projects",
        "open_label": "Projects"
      },
      {
        "title": "8. Return to required training",
        "body": "Open Training in the left sidebar. In Catalog, locate MYGSIS and Safety, which are required for everyone across Fire, Low Voltage, GSIS Aerial and Software. If your login shows My Training, compare its assigned courses and official status. Manufacturer courses remain external link-outs; do not enroll. Assignment is not enrollment and practice never changes official progress.",
        "task": "Return to this player and take the practice quiz; do not mark a real assignment complete.",
        "open_path": "/TrainingManagement",
        "open_label": "Training"
      }
    ],
    "quiz": [
      {
        "question": "Where do you file and reopen the job evidence?",
        "choices": [
          "Projects → an accessible project → Documents → Add Document; verify the row with Open.",
          "Inside an invented specialist tab.",
          "The quiz uploads results automatically."
        ],
        "answer": 0
      },
      {
        "question": "What if the specialist workflow is not available in MYGSIS?",
        "choices": [
          "Use the authorized external tool separately and record any undocumented or missing action.",
          "Invent a button name.",
          "Treat a failed client PDF as a passed demo."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live office sidebar verified 2026-11-06 (provided inventory); /workspace/mygsis/src/pages and related components (local source inspection, not a new live-browser test). Original discipline/policy source retained as reference: developer-dualtrack-feature-work; GSIS role-sheet mobile/test guardrails; Kemar taxonomy correction Nov 6, 2026. This internal practice does not change or publish any application.. ProjectDetail.jsx; DocumentsTab.jsx; OpsDocsTab.jsx; SafetyManager.jsx; RFITab.jsx.",
    "author": "GSIS-authored live-software walkthrough"
  },
  "CRS-FIRE-DESIGN": {
    "course_id": "CRS-FIRE-DESIGN",
    "title": "FireCode • Demo walkthrough",
    "steps": [
      {
        "title": "1. Sign in, then open Systems dashboard",
        "body": "Open FireCode at the live link. If you are not already signed in, the page shows Welcome to FireCode Architect and Sign in to continue. The sign-in controls are Continue with Google, Email, Password, Sign in, Forgot password?, and Need an account? Sign up. Sign in with your authorized FireCode account. Do not use Forgot password? or Sign up during practice unless you were given an account. After you are signed in, confirm the heading Systems dashboard and the Welcome back greeting (the live app may add your name). FireCode is separate software, not a MYGSIS tab.",
        "task": "If you see the sign-in page, sign in with your authorized account, then confirm the Systems dashboard heading. If you cannot sign in, stop and report MISSING.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "2. Read the Systems dashboard without opening jobs",
        "body": "On Systems dashboard, the subtext is: Pick a discipline to open its project workspace, or start a new project. Use Projects in the sidebar to browse everything by system type. The sidebar lists SYSTEMS Designer; under SYSTEMS: Dashboard, Projects, and Project setup; under DISCIPLINES: Fire alarm, Access control, Video surveillance, Audio visual, Structured cabling, and Networking & wireless. A red + New project button is at the top right. A Fire alarm discipline card is present and shows 23 device types. Look only. Do not open the Fire alarm card (that opens a live project list), do not open Projects, and do not click + New project.",
        "task": "Confirm the Systems dashboard heading, Welcome back greeting, sidebar groups, and + New project button without clicking them or opening a discipline card.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "3. Isolated demo context is MISSING",
        "body": "As of this signed-in check, there is no Demo mode on the live app. The words demo, practice, sandbox, and sample do not appear on the Systems dashboard, Fire alarm Projects list, Project setup, or New project form. There is no isolated practice context. Project names that include TEST or E2E still sit in the same account as real client jobs. Nothing separates practice from live work.",
        "task": "Treat isolated demo context as MISSING. Do not look for a Demo mode control that is not there, and do not treat a TEST or E2E name as a sandbox.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "4. Do not open Projects or named job cards",
        "body": "Do not open Projects in the sidebar and do not open any named job cards. Opening them is live client work. If that list were opened, it is headed Fire alarm projects, with the subtext: Floor plans and layouts for this discipline. Open a card to work in the designer, or start a new project. Practice must stay off that list.",
        "task": "Stay on Systems dashboard. Do not open Projects and do not open any named job card.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "5. New project labels exist — do not create a project",
        "body": "The live New project screen uses the URL pattern /project/new?discipline=fire_alarm and the heading New project. Those labels are listed so you can recognize the screen, not as an instruction to open it. Do not click + New project during practice, and do not create or save a project. Creating would write into the same live account as real jobs.",
        "task": "Do not open New project and do not create or save a project.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "6. Upload blueprint labels exist — do not upload",
        "body": "On the live New project screen, the upload section is titled Start from a blueprint (auto-fill) and has a red Upload blueprint button. The helper text is: Upload your plan set — single sheet or full multi-sheet PDF (or an image). We read the title block and cover sheet and fill in the project details below. You can edit anything after. Do not click Upload blueprint. Uploading would write into the same live account as real jobs.",
        "task": "Recognize the Upload blueprint label only. Do not click it and do not upload a file.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "7. New project fields exist — do not fill or submit",
        "body": "On the live New project screen, the required-info banner lists Project name, Address, Occupancy group, Adopted code edition, and AHJ / code official contact. The form shows Project Name (required), Address (required), Primary discipline (required), Owner Name, Installer / integrator, AHJ / code official contact (required), Jurisdiction (AHJ), and a Building has smoke control checkbox. Other visible buttons are Use TBD, Preview Code Analysis, and Fill 5 required fields; those were seen only and were not clicked. Do not fill, submit, or save this form.",
        "task": "Do not fill or submit the New project form. Use only controls that are actually visible if you already see this screen, and stop rather than completing it.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      },
      {
        "title": "8. Stop — this is not a passed design",
        "body": "Plans, Floor Plan, Calculations, Simulation, Riser Diagram, Save, and Export PDF were not seen as controls on this check (they may appear inside the designer). Do not invent those labels or assume they are present. Use only controls that are actually visible, and do not treat any result as a passed design. Isolated demo context is MISSING, so practice stops here: do not open named client projects, do not click Upload blueprint, and do not create or save a project. Return to Training in the original MYGSIS tab for the practice quiz; official progress is unchanged.",
        "task": "Stop without creating, uploading, or opening a job. Record that isolated demo context is MISSING and that this practice is not a passed design.",
        "open_path": "https://observant-fire-code-flow.base44.app/",
        "open_label": "FireCode"
      }
    ],
    "quiz": [
      {
        "question": "Is there a Demo mode or isolated practice context on the live FireCode app?",
        "choices": [
          "No. As of this check there is no Demo mode; isolated demo context is MISSING. Do not create, upload, or open named jobs.",
          "Yes, any TEST or E2E project name is a safe sandbox.",
          "Yes, open a named client project to practice."
        ],
        "answer": 0
      },
      {
        "question": "What should you do with New project and Upload blueprint?",
        "choices": [
          "Recognize those live labels only. Do not click Upload blueprint and do not create or save a project, because that writes into the same account as real jobs.",
          "Upload a practice blueprint so the form auto-fills.",
          "Click + New project and save a sample job."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this practice mark official completion?",
        "choices": [
          "No. Practice does not change official progress; assignment is not enrollment.",
          "Yes, the player completes CourseAssignment records.",
          "Yes, manufacturer enrollment is automatic."
        ],
        "answer": 0
      }
    ],
    "source": "Live FireCode Architect signed-in check 2026-11-06 at https://observant-fire-code-flow.base44.app/ (Systems dashboard labels, no Demo mode, Fire alarm projects headings, New project / Upload blueprint labels and form fields). Unsigned-in login page verified 2026-11-06: Welcome to FireCode Architect; Sign in to continue; Continue with Google; Email; Password; Sign in; Forgot password?; Need an account? Sign up. Designer controls Plans, Floor Plan, Calculations, Simulation, Riser Diagram, Save, and Export PDF were not seen and remain unverified.",
    "author": "GSIS-authored live-software walkthrough"
  }
};

// Display/assignment mapping corrections; add the internal FireCode demo to the existing Fire Design path.
const ACCESS_MOTO = new Set(['CRS-MOTO-032', 'CRS-MOTO-033', 'CRS-MOTO-034', 'CRS-MOTO-035', 'CRS-MOTO-036', 'CRS-MOTO-037', 'CRS-MOTO-045', 'CRS-MOTO-047']);
const PATHS = SOURCE_PATHS.filter(p => !p.path_id.includes('CSLB')).map(p => ({
  ...p,
  course_ids: [...new Set([
    ...p.course_ids.filter(id => p.path_id !== 'PATH-MOTO-AVIGILON' || !ACCESS_MOTO.has(id)),
    ...(p.path_id === 'PATH-ACCESS' ? [...ACCESS_MOTO] : []),
    ...LV_SOP_COURSES.filter(c => c.path_id === p.path_id).map(c => c.course_id),
    ...(p.division === 'Fire' && p.domain === 'Design' ? ['CRS-FIRE-DESIGN'] : []),
  ])],
}));
const FIRE_DESIGN_COURSE = {
  course_id: 'CRS-FIRE-DESIGN', title: 'FireCode • Demo walkthrough', brand: 'GSIS Internal',
  link: '', cost: 'internal', kind: 'interactive',
  notes: 'GSIS-authored captioned walkthrough of live FireCode. As of the 2026-11-06 signed-in check there is no Demo mode and no isolated practice context. Look-only: do not open named jobs, do not click Upload blueprint, and do not create or save a project. Not design approval or enrollment.',
};
const CATALOG = [...SEED_COURSES, ...LV_SOP_COURSES, FIRE_DESIGN_COURSE];
const COURSE_BY_ID = Object.fromEntries(CATALOG.map(c => [c.course_id, c]));
const LOGIN_EMAIL = 'kemar@gsistech.com';
const emailKey = email => String(email || '').trim().toLowerCase();
const isDone = a => a.status === 'completed' || a.status === 'passed';
const isInternal = c => !!PRACTICE[c.course_id] || c.kind === 'interactive' || c.brand === 'GSIS Internal' || c.cost === 'internal';
const isGated = c => c.cost === 'paid' || c.cost === 'partner';
const safeURL = value => /^https?:\/\//i.test(value || '') ? value : null;

const WALKTHROUGH_PAGES = new Set(['Dashboard', 'Calendar', 'OpsDashboard', 'ResourceBoard', 'Bids', 'Leads', 'ContractorDirectory', 'Estimates', 'RateCard', 'Projects', 'Documents', 'TrainingManagement', 'Billing', 'Suppliers', 'PurchaseOrders']);
function walkthroughURL(value) {
  if (typeof value !== 'string') return null;
  const raw = value.startsWith('/') && !value.startsWith('//') ? `https://mygsis.com${value}` : value;
  const candidate = safeURL(raw);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || url.search || url.hash) return null;
    if (candidate === 'https://observant-fire-code-flow.base44.app/') return candidate;
    if (!/^https?:\/\/mygsis\.com\/[A-Za-z]+$/.test(candidate) || url.hostname !== 'mygsis.com' || !WALKTHROUGH_PAGES.has(url.pathname.slice(1))) return null;
    return `https://mygsis.com${url.pathname}`;
  } catch { return null; }
}

const pathLabel = p => p.domain || p.skill_area || p.path_id;
const coursesForPaths = paths => [...new Set(paths.flatMap(p => p.course_ids))].map(id => COURSE_BY_ID[id]).filter(Boolean);
const selectionPaths = (divisions, domains, overlays) => PATHS.filter(p =>
  REQUIRED_PATHS.includes(p.path_id) || overlays.includes(p.path_id) ||
  (p.layer === 'division' && (divisions.includes(p.division) || domains.includes(`${p.division}::${p.domain}`)))
);
const toggleValue = (values, value) => values.includes(value) ? values.filter(v => v !== value) : [...values, value];
function resolveCourseId(assignment, storedCourses) {
  if (COURSE_BY_ID[assignment.course_id]) return assignment.course_id;
  const record = storedCourses.find(c => c.id === assignment.course_id);
  if (record?.course_id && COURSE_BY_ID[record.course_id]) return record.course_id;
  return assignment.course_id; // Unmapped legacy assignments remain visible; never guess a match.
}
function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const STYLES = `
.gsis-training{--tn:#0B1F3A;--tg:#C9A227;--ti:#172b46;--tm:#536780;color:var(--ti);background:#f4f6fa;padding:16px;min-height:100vh;min-width:0;max-width:100%;font:14px/1.55 Inter,ui-sans-serif,system-ui,sans-serif;overflow-wrap:anywhere}
.gsis-training *{box-sizing:border-box;min-width:0}
.gsis-training h1{font-size:29px;line-height:1.2;font-weight:800;margin:0 0 8px;letter-spacing:-.6px;color:#fff}.gsis-training .t-card h1,.gsis-training h2,.gsis-training h3,.gsis-training h4,.gsis-training h5,.gsis-training h6,.gsis-training legend{color:var(--tn)}
.gsis-training h2{font-size:19px;font-weight:750;margin:0 0 12px;color:var(--tn)}.gsis-training h3{font-size:16px;font-weight:700;margin:0 0 8px;color:var(--tn)}
.gsis-training p{margin:6px 0 12px}.gsis-training .t-wrap{max-width:1240px;margin:auto}
.gsis-training .t-hero{background:var(--tn);color:white;border-bottom:4px solid var(--tg);border-radius:14px;padding:22px;margin-bottom:18px}.gsis-training .t-hero h1{color:#fff}
.gsis-training .t-hero p{color:#d1dbe7;margin-bottom:0}.gsis-training .t-eyebrow{font-size:11px;letter-spacing:2px;font-weight:750;color:#e6ce79;text-transform:uppercase;margin-bottom:9px}
.gsis-training .t-card{background:white;border:1px solid #dce4ee;border-radius:12px;padding:16px;box-shadow:0 2px 6px #0b1f3a05;color:var(--ti)}
.gsis-training .t-course{display:flex;flex-direction:column;gap:8px;height:100%}.gsis-training .t-course .t-actions{margin-top:auto}
.gsis-training .t-muted{color:var(--tm);font-size:13px}.gsis-training .t-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.gsis-training .t-stack{display:grid;gap:18px}.gsis-training .t-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gsis-training .t-between{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.gsis-training .t-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:18px 0}
.gsis-training button,.gsis-training .t-button{font:inherit;font-weight:650;min-height:44px;border:1px solid #bccbdd;border-radius:9px;padding:10px 13px;background:white;color:var(--tn);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-align:center;max-width:100%;white-space:normal;text-decoration:none}
.gsis-training button:hover,.gsis-training .t-button:hover{border-color:var(--tg)}
.gsis-training button:focus-visible,.gsis-training a:focus-visible,.gsis-training input:focus-visible{outline:3px solid var(--tg);outline-offset:3px}
.gsis-training button[aria-selected=true],.gsis-training button[aria-pressed=true],.gsis-training .t-primary{background:var(--tn);color:white;border-color:var(--tn);box-shadow:inset 0 -3px var(--tg)}
.gsis-training button:disabled{opacity:.55;cursor:not-allowed}.gsis-training .t-actions{display:grid;gap:8px}.gsis-training .t-actions>*{width:100%}
.gsis-training .t-pickers{display:grid;gap:10px;margin:18px 0}.gsis-training .t-chip{flex:1 1 120px}
.gsis-training .t-badge{font-size:11px;font-weight:700;padding:4px 9px;border-radius:30px;background:#edf2f8;color:#34506f;display:inline-block}
.gsis-training .t-gold{background:#fff3cb;color:#705707}.gsis-training .t-notice{border:1px solid #e7d79d;background:#fff9e8;border-radius:9px;padding:12px;margin:10px 0}
.gsis-training .t-error{border-color:#db9b9b;background:#fff0f0;color:#842222}.gsis-training .t-section{margin-top:22px}
.gsis-training .t-check{display:flex;align-items:center;gap:10px;min-height:44px;padding:9px;border:1px solid #dce4ee;border-radius:9px;margin:7px 0;cursor:pointer}
.gsis-training input[type=checkbox],.gsis-training input[type=radio]{accent-color:var(--tn);width:20px;height:20px;flex-shrink:0}
.gsis-training input[type=date],.gsis-training textarea{font:inherit;width:100%;border:1px solid #b7c6d7;padding:10px;min-height:44px;border-radius:8px;background:white;color:var(--ti)}
.gsis-training fieldset{border:1px solid #dce4ee;border-radius:10px;padding:12px;margin:12px 0}.gsis-training legend{font-weight:750;padding:0 5px}
.gsis-training .t-progress{height:8px;border-radius:8px;background:#e6edf5;overflow:hidden;margin-top:9px}.gsis-training .t-progress>span{height:100%;background:var(--tg);display:block}
.gsis-training .t-pre{font:13px/1.7 ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;margin:12px 0}
.gsis-training .t-source{font-size:11px;color:var(--tm)}.gsis-training .t-quiz{border-top:1px solid #dce4ee;margin-top:16px;padding-top:16px}
.gsis-training .t-overlay{border-left:4px solid var(--tg)}.gsis-training .t-small{font-size:12px}
@media(min-width:640px){.gsis-training{padding:24px}.gsis-training .t-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gsis-training .t-tabs{display:flex;flex-wrap:wrap}.gsis-training .t-tabs>button{min-width:130px}.gsis-training .t-chip{flex:0 1 auto}.gsis-training .t-assign{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}
@media(min-width:1100px){.gsis-training .t-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.gsis-training .t-hero{padding:28px}}
`;

export default function TrainingManagement({ view } = {}) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authLoaded, setAuthLoaded] = useState(false);
  const [tab, setTab] = useState(view === 'tech' ? 'my' : 'catalog');
  const [division, setDivision] = useState(DIVISIONS[0]);
  const [domain, setDomain] = useState(DOMAINS[DIVISIONS[0]][0]);
  const [practiceId, setPracticeId] = useState(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();
  const techMode = view === 'tech' || user?.role === 'technician';
  const canAssign = !techMode;
  useEffect(() => { if (techMode) setTab('my'); }, [techMode]);
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        if (!active) return;
        setUser(userData);
        if (userData?.organization_id) {
          const orgs = await base44.entities.Organization.filter({ id: userData.organization_id });
          if (active) setOrg(orgs.find(o => o.id === userData.organization_id) || null);
        }
      } catch (error) { if (active) setAuthError(error?.message || 'Could not load training account.'); }
      finally { if (active) setAuthLoaded(true); }
    };
    loadData();
    return () => { active = false; };
  }, []);

  // All original management requests and query keys retained, including legacy level/course reads.
  const levelsQuery = useQuery({
    queryKey: ['courseLevels', org?.id],
    queryFn: () => org?.id ? base44.entities.CourseLevel.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });
  const coursesQuery = useQuery({
    queryKey: ['trainingCourses', org?.id],
    queryFn: () => org?.id ? base44.entities.TrainingCourse.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });
  const assignmentsQuery = useQuery({
    queryKey: ['assignments', org?.id],
    queryFn: () => org?.id ? base44.entities.CourseAssignment.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });
  const techniciansQuery = useQuery({
    queryKey: ['technicians', org?.id],
    queryFn: () => org?.id ? base44.entities.TechnicianProfile.filter({ organization_id: org.id }) : [],
    enabled: !!org?.id,
  });
  // Original TechnicianTraining requests live here so the wrapper duplicates no content or hooks.
  const personalAssignmentsQuery = useQuery({
    queryKey: ['courseAssignments', user?.email],
    queryFn: () => user?.email ? base44.entities.CourseAssignment.filter({ technician_email: user.email }) : [],
    enabled: techMode && !!user?.email,
  });
  const profileQuery = useQuery({
    queryKey: ['technicianProfile', user?.email],
    queryFn: () => user?.email ? base44.entities.TechnicianProfile.filter({ email: user.email }) : [],
    enabled: techMode && !!user?.email,
  });
  const storedCourses = (coursesQuery.data || []).filter(c => c.organization_id === org?.id);
  const allAssignments = (assignmentsQuery.data || []).filter(a => !!org?.id && a.organization_id === org.id);
  const myAssignments = (personalAssignmentsQuery.data || []).filter(a => !!org?.id && a.organization_id === org.id && emailKey(a.technician_email) === emailKey(user?.email));
  const technicians = [...new Map((techniciansQuery.data || [])
    .filter(t => !!org?.id && t.organization_id === org.id && t.email?.trim())
    .map(t => [emailKey(t.email), t])).values()];
  const ownProfile = (profileQuery.data || []).find(t => !!org?.id && t.organization_id === org.id && emailKey(t.email) === emailKey(user?.email));
  const official = techMode ? myAssignments : allAssignments;
  const dataQuery = techMode ? personalAssignmentsQuery : assignmentsQuery;
  const reads = techMode ? [personalAssignmentsQuery, profileQuery] : [levelsQuery, coursesQuery, assignmentsQuery, techniciansQuery];
  const readError = reads.some(q => q.isError);
  const reading = !!org?.id && reads.some(q => q.isLoading);
  const onPractice = id => { if (!isGated(COURSE_BY_ID[id]) && PRACTICE[id]) setPracticeId(id); };
  async function copyLogin() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(LOGIN_EMAIL);
      setMessage(`Copied login email: ${LOGIN_EMAIL}`);
    } catch (_) { setMessage(`Copy manually: ${LOGIN_EMAIL}`); }
  }
  const renderCourse = course => <CourseCard key={course.course_id} course={course} onPractice={onPractice} onCopyLogin={copyLogin} />;
  const domainPaths = PATHS.filter(p => p.layer === 'division' && p.division === division && p.domain === domain);
  const domainCourses = coursesForPaths(domainPaths);
  const requiredPaths = PATHS.filter(p => REQUIRED_PATHS.includes(p.path_id));
  const tabs = [...(techMode ? [['my', 'My Training']] : []), ['catalog', 'Catalog'], ...(canAssign ? [['assign', 'Assign']] : []), ...(!techMode ? [['technicians', 'Technicians']] : []), ['progress', 'Progress']];
  return <div className="gsis-training">
    <style>{STYLES}</style>
    <main className="t-wrap">
      <header className="t-hero">
        <div className="t-eyebrow">MYGSIS · Learn / Practice / Verify</div>
        <h1>Training</h1>
        <p>Manufacturer training and GSIS workflows, organized by division and domain.</p>
        <p className="t-small">Assignment is not enrollment. Internal practice never changes official training progress.</p>
      </header>
      {!authLoaded && <p role="status">Loading training account…</p>}
      {authError && <div role="alert" className="t-notice t-error">{authError} Reload to retry.</div>}
      {authLoaded && !org && <div role="alert" className="t-notice">Organization unavailable. Catalog browsing is available; assignments and official progress are unavailable.</div>}
      {readError && <div role="alert" className="t-notice t-error">Some official training data could not load. Do not interpret unavailable data as zero progress. Reload to retry.</div>}
      {reading && <p role="status">Loading official training data…</p>}
      {message && <div className="t-notice" role="status">{message}</div>}
      <section className="t-card t-overlay" aria-labelledby="required-training">
        <h2 id="required-training">Required for everyone</h2>
        <p className="t-muted">MYGSIS how-to + Safety are required overlays, not a fifth division. Included with every assignment.</p>
        <div className="t-grid">{coursesForPaths(requiredPaths).map(renderCourse)}</div>
      </section>
      <nav className="t-tabs" aria-label="Training views">{tabs.map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
      {tab === 'catalog' && <section aria-label="Training catalog">
        <div className="t-card">
          <h2>Browse the catalog</h2>
          <div className="t-pickers">
            <div className="t-row" role="group" aria-label="Division">{DIVISIONS.map(d => <button className="t-chip" key={d} aria-pressed={division === d} onClick={() => { setDivision(d); setDomain(DOMAINS[d][0]); }}>{d}</button>)}</div>
            <div className="t-row" role="group" aria-label={`${division} domains`}>{DOMAINS[division].map(d => <button className="t-chip" key={d} aria-pressed={domain === d} onClick={() => setDomain(d)}>{d}</button>)}</div>
          </div>
          <p className="t-muted">{division} / {domain} · {domainCourses.length} documented catalog items</p>
        </div>
        <CourseGroups courses={domainCourses} renderCourse={renderCourse} />
        <details className="t-card t-section">
          <summary className="t-check">Optional administrative skills & NICET orientation</summary>
          <p className="t-muted">Assignable overlays. Not extra divisions or external credentials.</p>
          {PATHS.filter(p => ['admin', 'credential'].includes(p.layer)).map(p => <section key={p.path_id} className="t-section"><h3>{pathLabel(p)}</h3><CourseGroups courses={coursesForPaths([p])} renderCourse={renderCourse} /></section>)}
        </details>
        <p className="t-muted t-section">Bundled documented catalog: {CATALOG.length} courses. Existing organization data retained: {storedCourses.length} TrainingCourse rows / {(levelsQuery.data || []).length} CourseLevel rows.</p>
      </section>}
      {tab === 'assign' && canAssign && <AssignPanel org={org} user={user} technicians={technicians} assignments={allAssignments} storedCourses={storedCourses} readsReady={!!org?.id && !reading && !readError} />}
      {tab === 'technicians' && !techMode && <section className="t-stack" aria-label="Technicians">
        <h2>Technicians</h2>
        {(!org || techniciansQuery.isError || techniciansQuery.isLoading) ? <p>Technician records are unavailable or loading.</p> : technicians.length === 0 ? <div className="t-card">No technicians in this organization yet</div> : <div className="t-grid">{technicians.map(t => <article key={t.id || t.email} className="t-card"><h3>{t.full_name || t.email}</h3><p className="t-muted">{t.email}</p>{assignmentsQuery.isError || assignmentsQuery.isLoading ? <p>Official progress unavailable.</p> : <ProgressBar label="Official training progress" assignments={allAssignments.filter(a => emailKey(a.technician_email) === emailKey(t.email))} />}</article>)}</div>}
      </section>}
      {tab === 'progress' && <section className="t-stack" aria-label="Official progress">
        <h2>{techMode ? 'My official progress' : 'Company official progress'}</h2>
        <p className="t-muted">Completed or passed assignments / all assigned records. Practice is excluded. No prototype progress or roster is imported.</p>
        {!org || dataQuery.isError || dataQuery.isLoading || coursesQuery.isError || coursesQuery.isLoading ? <p>Official progress unavailable or loading.</p> : <>
          <article className="t-card"><ProgressBar label="All official assignments (including overlays and legacy records)" assignments={official} /></article>
          {DIVISIONS.map(d => <section className="t-card" key={d}>
            <h2>{d}</h2>
            <ProgressBar label={`${d} total`} assignments={filterAssignments(official, PATHS.filter(p => p.division === d), storedCourses)} />
            <div className="t-grid t-section">{PATHS.filter(p => p.division === d).map(p => <article key={p.path_id} className="t-card"><ProgressBar label={`${pathLabel(p)} · ${p.path_id}`} assignments={filterAssignments(official, [p], storedCourses)} /></article>)}</div>
          </section>)}
          <section className="t-card"><h2>Required and optional overlays</h2><div className="t-grid">{PATHS.filter(p => p.layer !== 'division').map(p => <article key={p.path_id}><ProgressBar label={pathLabel(p)} assignments={filterAssignments(official, [p], storedCourses)} /></article>)}</div></section>
          {official.some(a => !COURSE_BY_ID[resolveCourseId(a, storedCourses)]) && <p className="t-notice">Legacy / unmapped assignments are included in overall progress, but not attributed to an undocumented division or path.</p>}
        </>}
      </section>}
      {tab === 'my' && techMode && <section className="t-stack" aria-label="My assigned training">
        <h2>My Training{ownProfile?.full_name ? ` · ${ownProfile.full_name}` : ''}</h2>
        {!org || personalAssignmentsQuery.isError || personalAssignmentsQuery.isLoading || coursesQuery.isError || coursesQuery.isLoading ? <p>Assigned training unavailable or loading.</p> : <>
          <div className="t-card"><ProgressBar label="My official training progress" assignments={myAssignments} /></div>
          {!myAssignments.length && <p className="t-card">No courses assigned yet. Browse Catalog or practice the required overlays above.</p>}
          {PATHS.map(p => {
            const assigned = filterAssignments(myAssignments, [p], storedCourses);
            if (!assigned.length) return null;
            return <section className="t-card" key={p.path_id}>
              <h2>{p.division ? `${p.division} / ` : ''}{pathLabel(p)}</h2>
              <ProgressBar label={p.path_id} assignments={assigned} />
              <div className="t-grid t-section">{assigned.map(a => {
                const course = COURSE_BY_ID[resolveCourseId(a, storedCourses)];
                return <div className="t-stack" key={a.id}><CourseCard course={course} onPractice={onPractice} onCopyLogin={copyLogin} /><p className="t-muted">Official status: {a.status || 'assigned'}{a.due_date ? ` · Due ${a.due_date}` : ''}</p></div>;
              })}</div>
            </section>;
          })}
          {myAssignments.filter(a => !COURSE_BY_ID[resolveCourseId(a, storedCourses)]).map(a => <article className="t-card" key={a.id}><h3>{a.course_title || a.course_id}</h3><p>Legacy / unmapped course · {a.status}</p></article>)}
          <p className="t-notice">Official status is read-only here. Practice results do not complete an assignment or confer a credential.</p>
        </>}
      </section>}
      <footer className="t-section t-muted">Documented catalog snapshot · No enrollment, payment, password storage or automated manufacturer completion tracking.</footer>
    </main>
    <Dialog open={!!practiceId} onOpenChange={open => { if (!open) setPracticeId(null); }}>
      <DialogContent className="gsis-training w-[calc(100vw-24px)] max-w-3xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>{practiceId ? COURSE_BY_ID[practiceId]?.title : 'Internal practice'}</DialogTitle><DialogDescription>Captioned live-app walkthrough. The player does not change official progress; actions in the live tab may save real data.</DialogDescription></DialogHeader>
        {practiceId && <PracticePlayer key={practiceId} course={PRACTICE[practiceId]} />}
      </DialogContent>
    </Dialog>
  </div>;
}

function CourseGroups({ courses, renderCourse }) {
  const manufacturer = courses.filter(c => !isInternal(c));
  const internal = courses.filter(isInternal);
  return <div className="t-stack t-section">
    <section aria-label="Manufacturer training"><h2>Manufacturer training</h2><div className="t-grid">{manufacturer.map(renderCourse)}</div>{!manufacturer.length && <p className="t-card t-muted">No manufacturer training documented for this domain. No listings have been invented.</p>}</section>
    <section aria-label="GSIS SOP and workflow"><h2>GSIS SOP / workflow</h2><div className="t-grid">{internal.map(renderCourse)}</div>{!internal.length && <p className="t-card t-notice">MISSING: No documented GSIS SOP / workflow is bundled for this domain.</p>}</section>
  </div>;
}
function CourseCard({ course, onPractice, onCopyLogin }) {
  if (!course) return <article className="t-card">Course content unavailable.</article>;
  const internal = isInternal(course);
  const gate = isGated(course);
  const link = safeURL(course.link);
  return <article className="t-card t-course">
    <div className="t-between"><span className="t-muted">{course.brand}</span><span className={`t-badge ${gate ? 't-gold' : ''}`}>{course.cost}</span></div>
    <h3>{course.title}</h3>
    {course.notes && <p className="t-muted">{course.notes}</p>}
    <p className="t-source">{course.course_id}</p>
    {gate && <p className="t-notice">Needs Kemar approval</p>}
    <div className="t-actions">
      {internal ? <button className="t-primary" disabled={gate || !PRACTICE[course.course_id]} onClick={() => onPractice(course.course_id)}>Start practice</button> : gate || !link ? <button disabled>Open course</button> : <a className="t-button t-primary" href={link} target="_blank" rel="noopener noreferrer">Open course ↗</a>}
      {!internal && <><button onClick={onCopyLogin}>Copy login email</button><p className="t-muted t-small">Opens manufacturer sign-in. Login email: {LOGIN_EMAIL}</p><p className="t-muted t-small">MYGSIS cannot autofill another website. Use your approved sign-in helper.</p></>}
      {internal && !PRACTICE[course.course_id] && <p className="t-muted">MISSING: Interactive source not available.</p>}
      {!internal && !link && <p className="t-muted">MISSING: No documented HTTPS/HTTP course link.</p>}
    </div>
  </article>;
}
function filterAssignments(assignments, paths, storedCourses) {
  const ids = new Set(paths.flatMap(p => p.course_ids));
  return assignments.filter(a => ids.has(resolveCourseId(a, storedCourses)));
}
function ProgressBar({ label, assignments }) {
  const completed = assignments.filter(isDone).length;
  const total = assignments.length;
  const percent = total ? Math.round(100 * completed / total) : 0;
  return <div><div className="t-between"><strong>{label}</strong><span className="t-muted">{completed} / {total} · {percent}%</span></div><div className="t-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>{!total && <p className="t-muted">Not assigned</p>}</div>;
}

function AssignPanel({ org, user, technicians, assignments, storedCourses, readsReady }) {
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedOverlays, setSelectedOverlays] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const queryClient = useQueryClient();
  const createAssignmentMutation = useMutation({
    mutationFn: data => base44.entities.CourseAssignment.create(data),
  });
  const selectedPaths = selectionPaths(selectedDivisions, selectedDomains, selectedOverlays);
  const selectedCourses = coursesForPaths(selectedPaths);
  const selectedPeople = technicians.filter(t => selectedTechs.includes(emailKey(t.email)));
  const existing = new Set(assignments.map(a => `${emailKey(a.technician_email)}::${resolveCourseId(a, storedCourses)}`));
  const previewCount = selectedPeople.reduce((sum, t) => sum + selectedCourses.filter(c => !existing.has(`${emailKey(t.email)}::${c.course_id}`)).length, 0);
  const check = (text, checked, onChange, disabled = false) => <label className="t-check"><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled || busy} /><span>{text}</span></label>;
  async function handleAssign() {
    if (inFlight.current || !readsReady || !org?.id || !selectedPeople.length || !['admin', 'owner'].includes(user?.role)) return;
    inFlight.current = true;
    setBusy(true);
    setResult('Checking existing assignments…');
    let created = 0;
    let skipped = 0;
    try {
      // Refetch immediately before writes, not just cached counts. New rows stamped to this org.
      const fresh = await base44.entities.CourseAssignment.filter({ organization_id: org.id });
      const known = new Set(fresh.filter(a => a.organization_id === org.id).map(a => `${emailKey(a.technician_email)}::${resolveCourseId(a, storedCourses)}`));
      for (const tech of selectedPeople) {
        for (const course of selectedCourses) {
          const key = `${emailKey(tech.email)}::${course.course_id}`;
          if (known.has(key)) { skipped++; continue; }
          await createAssignmentMutation.mutateAsync({
            organization_id: org.id,
            technician_email: tech.email.trim(),
            technician_name: tech.full_name || tech.email,
            course_id: course.course_id,
            course_title: course.title,
            assigned_by: user.email,
            assigned_date: localDate(),
            ...(dueDate ? { due_date: dueDate } : {}),
            status: 'assigned',
          });
          known.add(key);
          created++;
          setResult(`Creating assignments… ${created} saved. Do not close this page.`);
        }
      }
      setResult(`Saved ${created} assignments; skipped ${skipped} existing assignments. No enrollment or gate clearance performed.`);
    } catch (error) {
      setResult(`Stopped after ${created} saved assignments: ${error?.message || 'Save failed'}. Reload/retry the same selection; saved assignments will be skipped. No records were deleted.`);
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['courseAssignments'] }),
      ]);
      inFlight.current = false;
      setBusy(false);
    }
  }
  return <section className="t-card" aria-label="Assign training">
    <h2>Assign divisions & domains</h2>
    <p className="t-muted">Choose any combination in one action. Whole divisions include every domain. Duplicate courses are removed. MYGSIS + Safety stay required.</p>
    {!readsReady && <p className="t-notice">Assignment is disabled until organization, technicians and existing official records load successfully.</p>}
    <div className="t-assign">
      <div>
        <fieldset><legend>Whole divisions</legend>{DIVISIONS.map(d => <React.Fragment key={d}>{check(d, selectedDivisions.includes(d), () => setSelectedDivisions(toggleValue(selectedDivisions, d)))}</React.Fragment>)}</fieldset>
        {DIVISIONS.map(d => <fieldset key={d}><legend>{d} domains</legend>{DOMAINS[d].map(domain => {
          const key = `${d}::${domain}`;
          return <React.Fragment key={key}>{check(domain, selectedDivisions.includes(d) || selectedDomains.includes(key), () => setSelectedDomains(toggleValue(selectedDomains, key)), selectedDivisions.includes(d))}</React.Fragment>;
        })}</fieldset>)}
        <fieldset><legend>Optional overlays</legend>{PATHS.filter(p => ['admin', 'credential'].includes(p.layer)).map(p => <React.Fragment key={p.path_id}>{check(pathLabel(p), selectedOverlays.includes(p.path_id), () => setSelectedOverlays(toggleValue(selectedOverlays, p.path_id)))}</React.Fragment>)}</fieldset>
      </div>
      <div>
        <fieldset><legend>Technicians (real organization records)</legend>{technicians.length ? technicians.map(t => <React.Fragment key={t.id || t.email}>{check(`${t.full_name || t.email} · ${t.email}`, selectedTechs.includes(emailKey(t.email)), () => setSelectedTechs(toggleValue(selectedTechs, emailKey(t.email))))}</React.Fragment>) : <p>No technicians in this organization yet</p>}</fieldset>
        <label className="t-stack">Optional due date<input type="date" value={dueDate} disabled={busy} onChange={e => setDueDate(e.target.value)} /></label>
        <div className="t-notice">Always included: MYGSIS + Safety. Assignment is not enrollment; paid and partner courses remain blocked pending Kemar approval.</div>
        <h3>Assignment preview</h3>
        <p>{selectedPeople.length} technicians · {selectedPaths.length} paths · {selectedCourses.length} unique courses · approximately {previewCount} new assignments</p>
        <details><summary className="t-check">Review selected paths & courses</summary>{selectedPaths.map(p => <div className="t-card" key={p.path_id}><strong>{p.division ? `${p.division} / ` : ''}{pathLabel(p)}</strong><p className="t-source">{p.path_id}</p><ul>{coursesForPaths([p]).map(c => <li key={c.course_id}>{c.title} ({c.cost})</li>)}</ul></div>)}</details>
        <div className="t-actions t-section"><button className="t-primary" disabled={!readsReady || !selectedPeople.length || busy} onClick={handleAssign}>{busy ? 'Saving assignments…' : 'Assign selected training'}</button></div>
        {result && <p className="t-notice" role="status">{result}</p>}
      </div>
    </div>
  </section>;
}

// This player has NO base44 calls, mutations, persistence or official-status callbacks.
function PracticePlayer({ course }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [notes, setNotes] = useState({});
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const steps = course?.steps || [];
  const quiz = course?.quiz || [];
  const hasQuiz = quiz.length > 0;
  const onQuiz = stepIndex === steps.length && hasQuiz;
  const step = steps[stepIndex];
  const openURL = walkthroughURL(step?.open_path);
  const score = quiz.filter((q, i) => answers[i] === q.answer).length;
  const allAnswered = quiz.every((_, i) => Number.isInteger(answers[i]));
  useEffect(() => {
    if (!playing || !step) return;
    const timer = window.setTimeout(() => {
      if (stepIndex < steps.length - 1) setStepIndex(i => i + 1);
      else { setPlaying(false); if (hasQuiz) setStepIndex(steps.length); }
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, steps.length, hasQuiz, step]);
  const goTo = index => { setPlaying(false); setStepIndex(index); };
  return <section className="t-stack" aria-label="Captioned interactive walkthrough">
    <p className="t-notice">These captioned steps walk through live MYGSIS (or the named live app). Complete the action in the opened tab; this player does not change official progress. Assignment is not enrollment. Do not award a real bid, send mail, purchase or enroll in manufacturer courses during practice. Only edit an authorized training record; live-tab actions can save real data. Internal orientation is not certification or authority to perform regulated work.</p>
    <p className="t-muted">Interactive video = these visible captions and live-app prompts, not a recording or generated UI. Play auto-advances every 8 seconds; pause before doing an action in the live tab. Notes remain local and unsaved.</p>
    <div className="t-actions"><button type="button" className="t-primary" aria-pressed={playing} disabled={!step} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play walkthrough'}</button><span role="status">{playing ? 'Playing captions · 8 seconds per step' : 'Paused · follow at your own pace'}</span></div>
    <p className="t-notice" aria-live="polite">{onQuiz ? 'Practice quiz' : `Step ${stepIndex + 1} of ${steps.length}`}</p>
    {step && <article className="t-card" aria-label={`Step ${stepIndex + 1} caption`}>
      <h2>{step.title}</h2><div className="t-pre">{step.body}</div>
      {openURL ? <div className="t-actions t-section"><a className="t-button t-primary" href={openURL} target="_blank" rel="noopener noreferrer" onClick={() => setPlaying(false)}>Open {step.open_label || 'this screen'} in live app ↗</a></div> : <p className="t-notice">No verified live-screen link is available for this step. Do not guess a URL.</p>}
      {step.task && <div className="t-notice"><strong>Live-screen task / caption prompt</strong><p>{step.task}</p><label>Practice notes (not saved)<textarea value={notes[stepIndex] || ''} onFocus={() => setPlaying(false)} onChange={e => setNotes({ ...notes, [stepIndex]: e.target.value })} /></label></div>}
    </article>}
    {onQuiz && <section className="t-card">
      <h2>Practice quiz</h2>
      {quiz.map((q, i) => <fieldset key={i} className="t-quiz"><legend>{i + 1}. {q.question}</legend>{q.choices.map((choice, j) => <label className="t-check" key={j}><input type="radio" name={`practice-${course.course_id}-${i}`} checked={answers[i] === j} onChange={() => { setAnswers({ ...answers, [i]: j }); setChecked(false); }} /><span>{choice}</span></label>)}</fieldset>)}
      <button className="t-primary" disabled={!allAnswered} onClick={() => setChecked(true)}>Check practice answers</button>
      {checked && <p className="t-notice" role="status">Practice score: {score} / {quiz.length}. {score === quiz.length ? 'Practice finished.' : 'Review the source steps and try again.'} Official training progress is unchanged.</p>}
    </section>}
    {!hasQuiz && stepIndex === steps.length - 1 && <p className="t-notice">End of practice. Official progress is unchanged.</p>}
    <div className="t-actions"><button disabled={stepIndex === 0} onClick={() => goTo(Math.max(0, stepIndex - 1))}>Back</button><button className="t-primary" disabled={stepIndex >= steps.length - (hasQuiz ? 0 : 1)} onClick={() => goTo(stepIndex + 1)}>{hasQuiz && stepIndex === steps.length - 1 ? 'Next: practice quiz' : 'Next'}</button></div>
    {course?.source && <p className="t-source">Documented source: {course.source}</p>}
  </section>;
}
