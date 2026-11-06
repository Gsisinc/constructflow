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
        "title": "Know your workspace",
        "body": "Use the documented MYGSIS sidebar: Dashboard, Schedule, Ops Dashboard, Resource Board and Chats. Sales & Estimating contains Bids, Leads, Contractor Directory, Estimates and Rate Card. Projects and Documents follow. Billing/WIP and Suppliers/Purchase Orders serve office teams. Technician and client portals have separate menus. This is an October 21 documented map, not a new live verification.",
        "task": "Choose which workspace your role uses in the practice field."
      },
      {
        "title": "Start in Bids",
        "body": "Open Bids → the relevant opportunity → Overview. Read the bid manual, drawings, specifications and addenda. Write the division/domain, assumptions and missing information before pricing. Never guess missing quantities.",
        "task": "Practice: note one missing scope item."
      },
      {
        "title": "Trace drawings to the BOQ",
        "body": "Inside the bid, use Drawings, Drawing Analysis and BOQ. Check every AI quantity against sheets and specifications. Drawing Analysis documents an Export CSV action. A dedicated Takeoff tab is draft-only; do not rely on it as a live feature.",
        "task": "Practice: record a drawing sheet reference."
      },
      {
        "title": "Estimate and supplier quotes",
        "body": "Open Estimate and Procurement inside the bid. Procurement supports quote upload and Insert Procurement Prices with confirmation in the documented map. RFQ copy/download is a draft workflow, not an email send. Review price sources before any live confirmation.",
        "task": "Practice: choose a quote reference to attach to a material line."
      },
      {
        "title": "From award to Projects",
        "body": "The documented award flow creates a linked project with estimate budget/materials. Use Projects to check scope, approved value, milestones and Materials/Logistics. Do not award a real bid in this demonstration.",
        "task": "Practice: list what must be checked before kickoff."
      },
      {
        "title": "Prepare the field handoff",
        "body": "Use the job packet: scope for this visit, drawings, site contact, confirmed parts delivery and safety notes. If delivery is not confirmed, the packet must say DO NOT ROLL. Log only actual site facts and photos.",
        "task": "Practice: write the correct parts-gate decision."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Find your Training",
        "body": "Training Management and Technician Training are documented pages; the expanded company catalog, multi-division/domain assignment and this internal player are planned/demo enhancements. Open My Training here: MYGSIS and Safety are required for every person. Manufacturer courses open outside this player.",
        "task": "Practice: open My Training after the walkthrough; do not enroll."
      },
      {
        "title": "Evidence, verification and billing",
        "body": "Certificates are uploaded for manager verification after real completion; the upload here is only a filename preview. Billing uses signed scope, approved change orders and proof of milestone progress. No course completion, invoice or mail is created by this demo.",
        "task": "Practice: name one proof document you would provide."
      },
      {
        "title": "Close the loop",
        "body": "Save approved job documents in the correct project folder, link supporting evidence and escalate missing/conflicting information. End this internal practice with a quiz. No live feature availability is claimed beyond the cited dated map.",
        "task": "Practice: write the next owner and one unresolved item."
      }
    ],
    "quiz": [
      {
        "question": "Which bid area contains material quantities?",
        "choices": [
          "BOQ, supported by Drawings and Drawing Analysis.",
          "A verified dedicated Takeoff tab.",
          "The bank portal."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "Parts delivery has no proof. What should the packet say?",
        "choices": [
          "DO NOT ROLL; escalate.",
          "Send the crew anyway.",
          "Mark delivery confirmed."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "MYGSIS-Live-vs-Draft-Map_2026-10-21.md; MYGSIS-Training-Tab-Spec_2026-11-05.md; field-operations-all-divisions; Kemar email rule, Nov 6, 2026.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-DESIGNER": {
    "course_id": "CRS-ADMIN-DESIGNER",
    "title": "System Designer • Design to submittal",
    "steps": [
      {
        "title": "Confirm scope and authority",
        "body": "Read the drawings, spec and AHJ requirements. Identify Fire, Low Voltage, GSIS Aerial or Software and the domain. Separate design responsibility from install scope; list missing site information and required qualified signatures.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Build the design basis",
        "body": "Record building/site constraints, system sequence, manufacturer equipment and sources. Treat undocumented values as MISSING; draft an RFI instead of assuming a real measurement.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Prepare layout and schedules",
        "body": "Use the bid Designer/Drawings context documented in MYGSIS. FireCode is an example within the shared Software-building framework; exact current FireCode screen actions are a planned/demo workflow here and must be verified before use. Trace device locations and schedules to source sheets.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Calculate and check",
        "body": "For fire alarm, prepare battery and voltage-drop calculations and check circuit loads against listed manufacturer data and applicable NFPA 72 requirements. This overview is not an engineered design or a substitute for qualified review.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Perform visual coordination",
        "body": "Review every sheet for readable symbols, tags, riser consistency, conflicts and alignment with the equipment list. Flag unverified layout or missing data; a calculation pass alone is not visual approval.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Assemble review package",
        "body": "Compile plans, riser, sequence, data sheets and required calculations. Route to the qualified design/signature reviewer. No unqualified stamp or approval is implied.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "AHJ review and revisions",
        "body": "Prepare the AHJ submittal for authorized review and approval; do not submit here. Track comments and revision dates, reconcile resubmittals and distribute only the approved construction set.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Handoff and closeout",
        "body": "Give PM and Ops the approved documents and dependencies. Capture field revisions for as-builts and retain calculations, test reports and owner training evidence.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "A required equipment value has no source. What next?",
        "choices": [
          "Mark MISSING and resolve it before design approval.",
          "Invent a typical value.",
          "Hide the blank."
        ],
        "answer": 0
      },
      {
        "question": "Who can authorize/sign the design?",
        "choices": [
          "The appropriately qualified authorized reviewer.",
          "Anyone who took this demo.",
          "The mockup automatically."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-new-bid-workflow; schedule-of-values-and-billing, FA design-build and closeout; MYGSIS dated map. FireCode detailed UI is planned/demo.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-ESTIMATOR": {
    "course_id": "CRS-ADMIN-ESTIMATOR",
    "title": "Estimator • Scope to reviewed estimate",
    "steps": [
      {
        "title": "Read the whole bid",
        "body": "Read manual, drawings, specifications and addenda. Start assumptions/missing lists and a compliance matrix. Trace device counts and materials to [DWG] and [SPEC] references.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Clear scope responsibility",
        "body": "PM and Ops resolve conduit, trenching, sitework and adjacent trades before pricing. Check by-others language and referenced sections. Exclude other-trade scope unless assigned to GSIS. Draft RFIs for unclear items.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Build the takeoff",
        "body": "Count devices, implied materials, point-to-point cable, waste and spares from sources. Compare Sales and Procurement independent takeoffs until reconciled; do not use unverified AI counts as final quantities.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Load phase labor",
        "body": "Use PM/Ops phases and requirements. Ops prices hours per requirement with GSIS labor units and the Rate Card, including prevailing wage when required. Tag sources and do not invent labor rates.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Review quote validity and tiers",
        "body": "Use the newer approved new-bid workflow: 30% negotiated/design-build, 25% competitive, 20% floor tier. That workflow calls these material markup tiers. The older Rate Card separately describes project margins and older material markup rules: do not confuse markup with margin; flag the conflict for review. Record 3–5% standard escalation cushion, up to 10% for volatile items like copper, and quote validity per that workflow.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Build complete cost backup",
        "body": "Include freight, labor, lifts/equipment, small tools, subcontractors, design, permits, general conditions, wage fringe, warranty reserve, bonds, allowances, contingency, overhead and margin. Missing prices stay MISSING.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Review and handoff",
        "body": "Give Sales priced materials and backup; run risk analysis and Accounting review. Chief final review then Kemar approval precede any submission. After award the approved amount is the control budget.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "What clears before any labor/material price?",
        "choices": [
          "PM/Ops scope-responsibility gate.",
          "Automatic submission.",
          "Skipping other trades."
        ],
        "answer": 0
      },
      {
        "question": "Can markup and margin be treated as identical?",
        "choices": [
          "No; use the documented rule and escalate conflicting guidance.",
          "Yes, always.",
          "Only for copper."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-new-bid-workflow (approved Oct 24); 01-Rate-Card.md conflict noted, not silently resolved; Sales.md; Kemar email rule.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-SALES": {
    "course_id": "CRS-ADMIN-SALES",
    "title": "Sales • Proposal, SOV and risk",
    "steps": [
      {
        "title": "Intake and classify",
        "body": "Confirm division/domain and a GO opportunity. Read the full bid package, assumptions, missing items and compliance matrix. Do not promise scope or pricing before team review.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Collect the team handoffs",
        "body": "Collect PM phases, Ops labor and reconciled Procurement takeoff/quotes. Every number needs [DWG], [SPEC], [RATE CARD], [QUOTE] or [KEMAR] support.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Draft the proposal",
        "body": "Use the right field/software proposal template. Define scope, inclusions, exclusions and deliverables. Keep internal cost and markup backup out of customer-facing documents.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Build the SOV",
        "body": "Build internal cost backup first. Tie milestone values to real events and the backup. Percentages must total 100 and values equal contract price; no invented front-load limit.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Run risk review",
        "body": "Price risks as contingency or clarify/exclude them. Verify terms, retention, dependencies and scope gaps. Deviating customer terms require Kemar review, not silent acceptance.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Route approval",
        "body": "Accounting checks margin, contingency and phase SOV. Chief final review then Kemar OK are required. This mockup sends no proposal, invoice, RFQ or email.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Handoff award",
        "body": "After signing, pass approved estimate, SOV, scope and risks to PM/Accounting as the control budget. Log the approved record in DualTrack using the documented process.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "What belongs in a customer proposal?",
        "choices": [
          "Scope and milestone SOV, not internal cost backup.",
          "Internal supplier margin sheet.",
          "Unapproved terms."
        ],
        "answer": 0
      },
      {
        "question": "Before submission, whose approval is required?",
        "choices": [
          "Kemar after team/Chief review.",
          "No approval.",
          "The mockup."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "Sales.md; gsis-new-bid-workflow; schedule-of-values-and-billing; Kemar email rule.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-OPS": {
    "course_id": "CRS-ADMIN-OPS",
    "title": "Ops Manager • Dispatch to daily log",
    "steps": [
      {
        "title": "Read the approved job",
        "body": "Check signed scope, approved milestones, PM phases and requirements. Confirm what belongs to GSIS before calculating field labor.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Price and plan labor",
        "body": "Use labor units × Rate Card per requirement/phase; include prevailing wage where required. Do not invent hours, dates or staffing commitments.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Build tomorrow’s dispatch packet",
        "body": "Include address, site contact, scope for the visit, drawings, parts list, delivery proof, safety notes, lifts/access and dependencies.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Enforce the parts gate",
        "body": "If delivery is not confirmed, label DO NOT ROLL and escalate. Do not imply a truck can roll merely because a PO exists.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Write factual closeout notes",
        "body": "Record arrival, who was met, work-order scope, findings, work done and next needs from actual notes/photos. Facts only, calm and no blame.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Handle turnaways",
        "body": "If work cannot be done, record facts, time on site and who confirmed. Draft closure/payment request for review; do not send it from training.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Publish the daily handoff internally",
        "body": "Prepare the DualTrack daily log with real photos and open items, report to Chief and give PM/Accounting the evidence needed for follow-up. Demo practice does not create a live log.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "Is a PO enough to clear delivery?",
        "choices": [
          "No; delivery confirmation with proof is required.",
          "Yes.",
          "Only for fire alarm."
        ],
        "answer": 0
      },
      {
        "question": "Closeout notes should contain:",
        "choices": [
          "Actual notes/photos and facts.",
          "Guessed arrival times.",
          "Blame."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "Ops-Manager.md; field-operations-all-divisions; gsis-new-bid-workflow; Kemar email rule.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-ACCOUNTING": {
    "course_id": "CRS-ADMIN-ACCOUNTING",
    "title": "Accounting • Evidence to invoice and AR",
    "steps": [
      {
        "title": "Gather approved inputs",
        "body": "Read the signed proposal, approved change orders, contract terms, SOV and milestone/closeout proof. Never infer completion from a schedule alone.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Reconcile the SOV",
        "body": "Milestone percentages total 100; values equal the approved contract. Check internal cost backup and approved changes. Track retention separately.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Draft progress billing",
        "body": "Bill only actual achieved progress with proof. Milestone 1 at signing follows the approved contract and applicable law; flag residential/public-works compliance. Do not independently change contract terms.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Check invoice math and terms",
        "body": "Invoice totals must reconcile to contract plus approved changes, prior billing and retention. Show the standard 2% prompt-pay discount and date five days from invoice date only per approved terms. No invented date in this demo.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Prepare collections follow-up",
        "body": "Draft reminders at 15 and 30 days past due based on verified dates. Kemar approves/sends every invoice and reminder. No email is sent from this course.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Log expenses",
        "body": "Record uploaded receipts by real job and category. Reconcile evidence; do not log in to a bank, move money or store bank account numbers.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Prepare monthly summary",
        "body": "Summarize invoiced, collected, outstanding by customer and expenses by job. Give PM cost-to-complete feedback and Chief the reviewed AR list.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "What supports a progress invoice?",
        "choices": [
          "Proof of achieved milestone progress and approved contract.",
          "Only the planned date.",
          "A training score."
        ],
        "answer": 0
      },
      {
        "question": "Can Accounting move money in this workflow?",
        "choices": [
          "No.",
          "Yes, without approval.",
          "The player does it."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "Accounting.md; accounting-and-billing-all-divisions; schedule-of-values-and-billing; Kemar email rule.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-PM": {
    "course_id": "CRS-ADMIN-PM",
    "title": "Project Manager • Signed job to closeout",
    "steps": [
      {
        "title": "Open the signed job",
        "body": "Create/check the DualTrack job from signed proposal and approved estimate: job number, division/domain, customer, site, value, scope and exclusions. This is a practice checklist, not a live write.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Build phased milestones",
        "body": "Match the division: FA design/approval/rough-in/trim/programming/pre-test/AHJ/closeout; LV testing/training; DR flight/report visits; SW discovery/build/test/launch/training.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Coordinate logistics and labor",
        "body": "Work with Ops on phase requirements, dependencies, access and parts confirmation. A missing delivery blocks dispatch. Never commit a customer schedule without approval.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Track submittals and RFIs",
        "body": "Draft required submittals and RFIs; track responses with actual dates and responsible owners. Escalate missing authority or scope information.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Control changes",
        "body": "Out-of-scope work becomes a change-order draft before work starts. Kemar approval is required. Keep the approved control budget and SOV reconciled.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Prepare Friday status",
        "body": "Report schedule, open RFIs, change orders and risks every Friday. Save the status and route it to Chief; this course schedules or sends nothing.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Close out and hand off",
        "body": "Collect as-builts, test reports, photos, warranty and training sign-off. Hand approved evidence to Accounting for final invoice; do not mark incomplete milestones complete.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "Out-of-scope work requires:",
        "choices": [
          "A reviewed change-order draft before work starts.",
          "No documentation.",
          "An invented allowance."
        ],
        "answer": 0
      },
      {
        "question": "Friday status includes:",
        "choices": [
          "Schedule, RFIs, change orders and risks.",
          "Only a completion claim.",
          "Bank credentials."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "Project-Manager.md; project-management-all-divisions; schedule-of-values-and-billing; Kemar email rule.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-ADMIN-PROCUREMENT": {
    "course_id": "CRS-ADMIN-PROCUREMENT",
    "title": "Procurement • Independent takeoff to delivery",
    "steps": [
      {
        "title": "Read source documents independently",
        "body": "Use the drawings/specs, including implied materials. Build an independent takeoff before comparing with Sales. Quantities must have source references.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Reconcile discrepancies",
        "body": "Compare independent takeoff against Sales device/material lists. Resolve every discrepancy together and record the agreed list before pricing.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Source vendor pricing",
        "body": "Use identified parts, quantities and documented supplier quotes. Record freight, availability, quote date/validity and lead times; gaps stay MISSING. RFQs here are drafts only.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Review escalation and tier",
        "body": "Record the approved workflow’s escalation cushion (3–5% standard; up to 10% volatile copper) and 30/25/20% markup tier as applicable. Distinguish margin and note conflicts with older Rate Card guidance for review.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "File every partner/vendor email",
        "body": "Company-wide rule: identify the partner/vendor → open or create its own folder → apply vendor/partner, division/domain, job/bid and topic tags → move the thread and attachments into that folder → sort by job/topic and date → verify it is findable and nothing is left loose in the inbox. Folder names and tags below are a proposed demonstration, not an existing mailbox. Outlook authentication is still required for live filing. No messages have been filed by this mockup.",
        "task": "Practice choosing a vendor folder and a topic tag below."
      },
      {
        "title": "Return the priced material handoff",
        "body": "Give Sales the reconciled priced BOM, quote references and open risks. In documented MYGSIS, Procurement within the bid supports quote upload and confirmed price insertion; do not execute live updates here.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Prepare PO drafts",
        "body": "Prepare vendor-specific PO drafts linked to the real project and approved materials. No order or payment occurs in this mockup; release requires actual authorization.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Track delivery evidence",
        "body": "Track actual delivery and attach proof for Ops. A sent PO is not delivery confirmation. Escalate delays and preserve vendor correspondence in its own tagged folder.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "When should takeoffs be reconciled?",
        "choices": [
          "Before final pricing and handoff.",
          "After ordering everything.",
          "Never."
        ],
        "answer": 0
      },
      {
        "question": "Does a prepared PO authorize purchase here?",
        "choices": [
          "No; this is a draft-only practice.",
          "Yes.",
          "Only if the score is high."
        ],
        "answer": 0
      },
      {
        "question": "Where does a supplier email belong?",
        "choices": [
          "In that supplier’s own folder, tagged and sorted.",
          "Loose in the inbox.",
          "In any unrelated job folder."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "Procurement.md; gsis-new-bid-workflow; MYGSIS dated map; Kemar email rule.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-SAFETY-CALOSHA": {
    "course_id": "CRS-SAFETY-CALOSHA",
    "title": "Safety • Cal/OSHA orientation",
    "steps": [
      {
        "title": "Identify hazards",
        "body": "Review site safety requirements and the applicable Cal/OSHA program with a competent supervisor. This orientation awards no external safety credential.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Confirm controls",
        "body": "Identify PPE, access and work controls before field activity.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Escalate unsafe work",
        "body": "Stop unsafe work and contact the responsible supervisor; never improvise compliance.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Document the briefing",
        "body": "Record actual safety briefing evidence after attendance.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Track evidence",
        "body": "A verified certificate needs its issuer and actual expiry, never a made-up renewal.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Review before dispatch",
        "body": "Confirm the current safety requirements for each job.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "Can this internal orientation award an external credential?",
        "choices": [
          "No; actual external evidence and verification are required.",
          "Yes automatically.",
          "A click is sufficient."
        ],
        "answer": 0
      },
      {
        "question": "What if source information is missing?",
        "choices": [
          "Mark MISSING and escalate.",
          "Invent it.",
          "Ignore it."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-SAFETY-JHA": {
    "course_id": "CRS-SAFETY-JHA",
    "title": "Safety • Job-hazard analysis",
    "steps": [
      {
        "title": "Read the visit scope",
        "body": "Use the real dispatch scope and site conditions.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Break work into tasks",
        "body": "Identify the planned sequence with the supervisor.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Identify hazards",
        "body": "Review work at height, electrical exposure, access and other actual hazards.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Select controls",
        "body": "Use supervisor-approved controls and PPE; this is not a substitute for qualified training.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Brief the crew",
        "body": "Confirm understanding before work starts.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Update on change",
        "body": "Stop and revise the JHA if conditions change.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "Can this internal orientation award an external credential?",
        "choices": [
          "No; actual external evidence and verification are required.",
          "Yes automatically.",
          "A click is sufficient."
        ],
        "answer": 0
      },
      {
        "question": "What if source information is missing?",
        "choices": [
          "Mark MISSING and escalate.",
          "Invent it.",
          "Ignore it."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-SAFETY-FIRSTAID": {
    "course_id": "CRS-SAFETY-FIRSTAID",
    "title": "Safety • First-aid readiness",
    "steps": [
      {
        "title": "Know the emergency plan",
        "body": "Confirm site emergency contacts, location and response plan.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Locate resources",
        "body": "Identify first-aid kits and trained responders.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Recognize your limits",
        "body": "Seek emergency help; only trained personnel provide care within their training.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Protect the scene",
        "body": "Do not enter unsafe conditions.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Document facts",
        "body": "Follow supervisor incident-reporting instructions.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Verify qualifications",
        "body": "Upload actual external certification after training. This orientation does not confer first-aid certification.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "Can this internal orientation award an external credential?",
        "choices": [
          "No; actual external evidence and verification are required.",
          "Yes automatically.",
          "A click is sufficient."
        ],
        "answer": 0
      },
      {
        "question": "What if source information is missing?",
        "choices": [
          "Mark MISSING and escalate.",
          "Invent it.",
          "Ignore it."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-FA-NICET-ORIENTATION": {
    "course_id": "CRS-FA-NICET-ORIENTATION",
    "title": "NICET • Optional Fire Alarm credential planning",
    "steps": [
      {
        "title": "Identify the goal",
        "body": "Select a relevant Fire Alarm credential objective; no certification is implied.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Verify requirements",
        "body": "Confirm current official eligibility and exam requirements directly before applying. No application URL is invented here.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Collect evidence",
        "body": "Identify actual experience and required verifications.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Plan study",
        "body": "Use available manufacturer education without assuming eligibility/contact-hour acceptance.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Seek approval",
        "body": "Any fee or registration requires actual authorization.",
        "task": "Review the scenario, enter your decision, then continue."
      },
      {
        "title": "Track only verified results",
        "body": "Record credential evidence and real expiration after verification; none exists in this mockup.",
        "task": "Review the scenario, enter your decision, then continue."
      }
    ],
    "quiz": [
      {
        "question": "Can this internal orientation award an external credential?",
        "choices": [
          "No; actual external evidence and verification are required.",
          "Yes automatically.",
          "A click is sufficient."
        ],
        "answer": 0
      },
      {
        "question": "What if source information is missing?",
        "choices": [
          "Mark MISSING and escalate.",
          "Invent it.",
          "Ignore it."
        ],
        "answer": 0
      },
      {
        "question": "What happens after this practice walkthrough?",
        "choices": [
          "Tracker remains not started; evidence and verification are separate.",
          "Everyone is marked complete automatically.",
          "Manufacturer enrollment is purchased."
        ],
        "answer": 0
      }
    ],
    "source": "GSIS internal orientation/demo; field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing. Detailed external credential/regulated training must be independently verified.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-SOFTWARE-FRAMEWORK": {
    "course_id": "CRS-SOFTWARE-FRAMEWORK",
    "title": "Software • One framework for every GSIS app",
    "steps": [
      {
        "title": "Intake one approved outcome",
        "body": "Write acceptance criteria, affected pages/entities, roles and what success looks like. Use this same process for FireCode Architect, DualTrack, MYGSIS, GSIS Aerial / Aerial Command Center, ITM and future apps.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Map the workflow and protect records",
        "body": "List what changes, what stays, what could break and existing records affected. Never delete fields/entities/records or change roles/visibility without direct authorization. Product examples use the same framework, not separate silos.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Plan and source the change",
        "body": "Write a small plan with sources, assumptions, missing inputs and test cases. Choose the approved toolchain. Base44 projects use the authorized builder/editor; repository work uses the approved source-control workflow. No sign-in or code deployment is performed here.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Build in a controlled preview",
        "body": "Make the smallest approved change and keep a dated change log. Use sample/fake data, preserve existing records and avoid exposing private details. A FireCode calculation feature and an ITM inspection form follow this same build discipline.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Test every acceptance criterion",
        "body": "Test with the designated GSIS Test User, not a real person. Check success, empty, failure and permission states; record pass/fail and evidence. Aerial deliverable QA and MYGSIS assignment validation are examples of applying the same test gate.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Verify mobile and regression behavior",
        "body": "Review the phone-sized view and desktop. Retest nearby features, data integrity, navigation and accessibility. For FireCode, inspect drawings/PDFs visually as well as numerical results; for DualTrack, reconcile totals and saved records.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Review risk and request release approval",
        "body": "Submit change log, test evidence, unresolved defects and risk to Chief/Kemar. Publishing requires the appropriate explicit approval and shared-save coordination. This walkthrough never publishes Base44 or any app.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Publish only when authorized; verify live",
        "body": "After real release authorization, use the approved release process, verify the live result with sample evidence and keep a rollback plan. Do not claim a preview is production. There is no release action in this course.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Close out, monitor and reuse",
        "body": "Record what changed, what was tested, what is broken, decisions needed and the next owner. Route approved bugs through intake. Reuse this lifecycle for every current and future GSIS product rather than creating product silos.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "How many software-building frameworks are needed here?",
        "choices": [
          "One shared framework applied to every GSIS app.",
          "One isolated framework per product.",
          "No test framework."
        ],
        "answer": 0
      },
      {
        "question": "What is required before a real production release?",
        "choices": [
          "Recorded testing, reviewed risk and explicit release authorization.",
          "Only a preview screenshot.",
          "A training score."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "developer-dualtrack-feature-work; GSIS role-sheet mobile/test guardrails; Kemar taxonomy correction Nov 6, 2026. This internal practice does not change or publish any application.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-FIRE-ITM": {
    "course_id": "CRS-FIRE-ITM",
    "title": "Fire • Itm workflow",
    "steps": [
      {
        "title": "Confirm contract and system",
        "body": "Read the approved inspection/testing/maintenance contract, system records and site requirements. Identify actual scope, frequencies and required qualified personnel; do not invent a code interval.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Prepare the visit",
        "body": "Build the visit plan and dispatch packet; coordinate access, impairment notifications and required safety controls with the responsible qualified lead.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Check parts and readiness",
        "body": "Verify equipment, approved procedures and actual delivery evidence. Missing critical requirements must be escalated before dispatch.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Perform documented work only",
        "body": "Follow approved procedures and listed manufacturer requirements. This internal walkthrough is not authorization to inspect or a substitute for required training.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Record results and deficiencies",
        "body": "Record actual observations/test evidence. Separate deficiency repair quotes from the contracted inspection; do not fabricate test passes.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Closeout and billing handoff",
        "body": "Deliver the reviewed inspection report through approved channels; hand proof to PM/Accounting. Repairs need separate approval before work.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What if required source information or authorization is missing?",
        "choices": [
          "Mark MISSING and escalate before affected work.",
          "Guess a typical value.",
          "Bypass the gate."
        ],
        "answer": 0
      },
      {
        "question": "What supports closeout?",
        "choices": [
          "Actual reviewed work/test evidence.",
          "A demo click.",
          "An unverified promise."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing FA ITM/service/closeout; existing manufacturer training paths. High-level internal SOP only.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-FIRE-SERVICE": {
    "course_id": "CRS-FIRE-SERVICE",
    "title": "Fire • Service workflow",
    "steps": [
      {
        "title": "Intake the service request",
        "body": "Record actual symptoms, system, location and customer-authorized scope. Missing facts stay MISSING.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Review records and safety",
        "body": "Read available drawings, service history and manufacturer instructions. Coordinate impairment/safety requirements with the qualified lead.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Prepare dispatch",
        "body": "Confirm access, diagnostic equipment, needed parts and delivery proof; DO NOT ROLL when required delivery is not confirmed.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Diagnose without guessing",
        "body": "Use the approved diagnostic workflow and source-backed findings. Do not bypass life-safety requirements or claim unknown faults are fixed.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Control repairs and changes",
        "body": "Draft out-of-scope repair/change work for approval before proceeding. Record installed parts and actual work only.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Test and closeout",
        "body": "Document qualified testing, restoration, findings, photos and open items; hand evidence to PM/Accounting for the approved service invoice.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What if required source information or authorization is missing?",
        "choices": [
          "Mark MISSING and escalate before affected work.",
          "Guess a typical value.",
          "Bypass the gate."
        ],
        "answer": 0
      },
      {
        "question": "What supports closeout?",
        "choices": [
          "Actual reviewed work/test evidence.",
          "A demo click.",
          "An unverified promise."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing FA ITM/service/closeout; existing manufacturer training paths. High-level internal SOP only.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-FIRE-PROGRAMMING": {
    "course_id": "CRS-FIRE-PROGRAMMING",
    "title": "Fire • Programming workflow",
    "steps": [
      {
        "title": "Confirm authority and scope",
        "body": "Read the approved sequence, system model, software access and authorized programming scope. Partner-gated tools remain gated.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Review approved documents",
        "body": "Reconcile device/point lists, drawings, interface requirements and manufacturer instructions. Missing software or license access is a stop/escalate item.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Protect the baseline",
        "body": "Use the approved backup and change-control process before any live system work. This lesson performs no panel connection or software write.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Configure against approved sequence",
        "body": "Use manufacturer-supported tools only with actual authorization. Trace every intended change to the approved sequence and point list.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Test and reconcile",
        "body": "Qualified personnel verify every affected function/interface and document results. Do not infer a test pass from a successful file save.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "Handoff records",
        "body": "Retain reviewed program backup, test evidence and open issues in the job closeout package. No system completion is invented.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What if required source information or authorization is missing?",
        "choices": [
          "Mark MISSING and escalate before affected work.",
          "Guess a typical value.",
          "Bypass the gate."
        ],
        "answer": 0
      },
      {
        "question": "What supports closeout?",
        "choices": [
          "Actual reviewed work/test evidence.",
          "A demo click.",
          "An unverified promise."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "field-operations-all-divisions; project-management-all-divisions; schedule-of-values-and-billing FA ITM/service/closeout; existing manufacturer training paths. High-level internal SOP only.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-PROGRESS": {
    "course_id": "CRS-AERIAL-SOP-PROGRESS",
    "title": "GSIS Aerial • Construction Progress Reports SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm visit cadence, contract length, boundary and fixed photo/video viewpoints. Preserve the same plan between visits for comparable progress records.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Capture the agreed fixed-vantage photos and video, then check coverage on site.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Compare to the prior approved visit; write factual change-since-last-visit notes and attach the photo set / agreed video.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver the reviewed progress report on the approved visit cadence; record actual customer acceptance and retention terms.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-ORTHO": {
    "course_id": "CRS-AERIAL-SOP-ORTHO",
    "title": "GSIS Aerial • Orthomosaic Mapping SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm mapped boundary, required georeferencing, accuracy and requested outputs; price/use ground control only when agreed.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Collect the approved mapping image coverage with the qualified pilot; verify overlap/coverage against the mission plan without inventing flight settings.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Process and inspect the georeferenced orthomosaic; check coverage/artifacts and the agreed coordinate/accuracy basis. GeoTIFF/KML and requested DSM/DTM/contours are documented outputs.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver only the contracted map formats and stated accuracy; preserve source data and reviewed QA evidence.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-3D": {
    "course_id": "CRS-AERIAL-SOP-3D",
    "title": "GSIS Aerial • 3D Models SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm model/mesh/point-cloud scope, viewing requirements and approximate-versus-survey accuracy.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Capture imagery suitable for the approved 3D plan and check coverage of required surfaces on site.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Process and inspect the mesh/point cloud for gaps, artifacts and agreed accuracy. OBJ/FBX/PLY and LAS/LAZ are documented examples, not a promise every tool exports every format.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver the contracted model formats/viewer with reviewed limitations and acceptance evidence.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-STOCKPILE": {
    "course_id": "CRS-AERIAL-SOP-STOCKPILE",
    "title": "GSIS Aerial • Stockpile Volumes SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm piles, boundary, baseline and whether relative approximate quantities meet the customer need.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Capture the approved coverage of each identified pile with safe access and clear pile identification.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Review base surfaces and pile boundaries, calculate approximate volumes and check QA. Do not certify legal/survey quantities without a qualified licensed surveyor.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver a reviewed PDF + CSV volume report with assumptions and actual measurement limitations.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-INSPECTIONS": {
    "course_id": "CRS-AERIAL-SOP-INSPECTIONS",
    "title": "GSIS Aerial • Roof / Site / Infrastructure Inspections SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm roof/site/infrastructure scope and requested visual observations. The documented Matrice 4E has no thermal; thermal or lidar requests are equipment gaps.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Capture the agreed RGB photos/video safely; do not promise inaccessible, concealed or thermal findings.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Review observations, annotate factual findings and preserve image references. Do not turn visual observations into unsupported engineering conclusions.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver the reviewed annotated PDF and contracted imagery with limitations and unresolved access/equipment gaps.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-ASBUILT": {
    "course_id": "CRS-AERIAL-SOP-ASBUILT",
    "title": "GSIS Aerial • As-Built Documentation SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm the existing-condition/closeout area, agreed documentation outputs and accuracy; this is documented in GSIS service descriptions, not a new trade.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Capture approved existing-condition imagery and available matching control/source references; no hidden-condition claim is implied.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Coordinate the captured model/point cloud with the agreed as-built documentation purpose. Verify coverage and limitations; Matterport capability is still unconfirmed in source material.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver only agreed documented formats for coordination/closeout, with the non-survey disclaimer and no unsupported BIM/Matterport capability promise.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-AERIAL-SOP-REALESTATE": {
    "course_id": "CRS-AERIAL-SOP-REALESTATE",
    "title": "GSIS Aerial • Real Estate Media SOP",
    "steps": [
      {
        "title": "1. Scope and deliverables",
        "body": "Confirm property boundaries, client permission/privacy limits and contracted media. Aerials, HDR, video, 3D tours and floor plans appear in GSIS service descriptions; confirm actual equipment/capability before promising each.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "2. Airspace, authority and access",
        "body": "Confirm the site/boundary from a source, qualified Part 107 pilot and current requirements; check controlled airspace/LAANC, restrictions and hazards with the responsible pilot. Site permission, access, badging and safety must be resolved. Do not invent authorizations or certificate numbers.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "3. Mission and equipment readiness",
        "body": "Confirm approved mission plan, weather, equipment, launch area and JHA. The Matrice 4E has no thermal; equipment/accuracy gaps require a decision before flight. Flights needing authorization/waiver require Kemar review.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "4. Capture and on-site data check",
        "body": "Capture only authorized property/media within the agreed flight and access plan. Do not assume interior/3D-tour equipment is available.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "5. Process and quality-check",
        "body": "Review image/video quality, privacy, completeness and requested edits. Flag unverified Matterport or floor-plan capability rather than fabricate delivery.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "6. Report limitations",
        "body": "State: “Deliverables are for visual documentation and approximate measurement; they are not a land survey.” California survey-boundary/legal-elevation/certified-volume work requires an appropriately licensed survey professional. Never invent accuracy, acreage or flight time.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "7. Deliver reviewed outputs",
        "body": "Deliver approved media and agreed sharing/retention terms; record acceptance without inventing property results or marketing claims.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      },
      {
        "title": "8. Archive and job handoff",
        "body": "Keep actual flight/maintenance logs, source imagery, QA, deliverables, customer acceptance and stated retention period in the job folder. Give PM/Accounting the evidence for the applicable visit or one-time billing milestone; this demo sends nothing.",
        "task": "Practice only: record your decision and the supporting evidence; do not execute live actions."
      }
    ],
    "quiz": [
      {
        "question": "What is common to every GSIS Aerial service SOP?",
        "choices": [
          "Scope → airspace/access → plan/readiness → capture → QA → limitations → delivery → archive.",
          "Fly first; ask later.",
          "Skip data checks."
        ],
        "answer": 0
      },
      {
        "question": "Can approximate visual deliverables be called a certified land survey?",
        "choices": [
          "No; survey work requires an appropriately licensed professional.",
          "Yes, if the model looks good.",
          "A demo quiz certifies it."
        ],
        "answer": 0
      },
      {
        "question": "Does finishing this demo change recorded training progress?",
        "choices": [
          "No. Official progress stays 0% / not started.",
          "Yes, it automatically completes everything.",
          "It enrolls everyone."
        ],
        "answer": 0
      }
    ],
    "source": "gsis-estimate-drone-services; Drone/README.md; Drone/Drone-Service-Descriptions_REDO_2026-10-27.md; Drone/Drone-Marketing-Copy_REDO_2026-10-27.md; Drone/Deliverables-Format-Sources_2026-10-23.md. As-builts and real estate are documented service categories; unverified capabilities are flagged.",
    "author": "GSIS-authored internal demo"
  },
  "CRS-LV-SOP-CCTV": {
    "course_id": "CRS-LV-SOP-CCTV",
    "title": "CCTV — Video surveillance workflow",
    "steps": [
      {
        "title": "CCTV — Video surveillance workflow",
        "body": "# CCTV — Video surveillance workflow\n\nProject spec section: 28 23 00. Engine: `js/placementRules.js` (`RULES.cctv`). Tests: `js/placementRules.test.js`."
      },
      {
        "title": "Read room names off the plan and classify each room (byType).",
        "body": "Read room names off the plan and classify each room (byType)."
      },
      {
        "title": "Look up PPF/purpose per type; no type match means no camera (defaultNone).",
        "body": "Look up PPF/purpose per type; no type match means no camera (defaultNone)."
      },
      {
        "title": "Place: entries face the door from inside; corridors at the polygon diameter ends plus one every 90 ft; open areas at the corner overview with the best aim.",
        "body": "Place: entries face the door from inside; corridors at the polygon diameter ends plus one every 90 ft; open areas at the corner overview with the best aim."
      },
      {
        "title": "Clip the cone to the room/envelope visibility and the PPF-limited range.",
        "body": "Clip the cone to the room/envelope visibility and the PPF-limited range."
      },
      {
        "title": "Home-run Cat 6A to the nearest TR; ≤295 ft or propose an IDF.",
        "body": "Home-run Cat 6A to the nearest TR; ≤295 ft or propose an IDF."
      },
      {
        "title": "Size storage: bitrate × retention × 1.2.",
        "body": "Size storage: bitrate × retention × 1.2."
      },
      {
        "title": "Rules table",
        "body": "| Rule | Value | Status | Source |\n|---|---|---|---|\n| cctv.sensor_px_h | 2688 | ASSUMED | ASSUMED: typical 4 MP sensor 2688x1520 (spec says \"Fixed 4 MP\"; model TBD) |\n| cctv.hfov_min_deg | 28 | ASSUMED | ASSUMED varifocal tele limit (model TBD) |\n| cctv.hfov_max_deg | 105 | ASSUMED | ASSUMED varifocal wide limit (model TBD) |\n| cctv.mount_ft | 10 | ASSUMED | ASSUMED mounting height 10 ft AFF (verify against A2.0/A2.1 RCP ceiling heights) |\n| cctv.corridor_seg_ft | 90 | ASSUMED | Standards Manual cheat sheet §1.3 / CCTV-08 \"corridors: camera at both ends\"; ≤45 ft per camera ASSUMED |\n| cctv.entry | ppf=80, place=face_door_ext, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"Building entries/vestibules\" (PPF 80) + Manual CCTV-13 Identify |\n| cctv.lobby | ppf=40, place=corner_overview, perSf=1250 | SOURCED (part) | Project spec 28 23 00 §1.4 area table row \"Public lobbies/waiting\" (PPF 40) / count per 1,250 sf ASSUMED |\n| cctv.reception | ppf=80, place=corner_overview, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"Public service counters\" (PPF 80) |\n| cctv.treasurer | ppf=80, place=corner_overview, perSf=1250 | SOURCED (part) | Project spec 28 23 00 §1.4 area table row \"Public service counters / cash handling\" / counter location not shown on A1.1; camera aims at room centre — INPUT NEEDED |\n| cctv.corridor | ppf=20, place=corridor_ends | SOURCED | Project spec 28 23 00 §1.4 area table row \"Corridors\" (PPF 20) + Manual CCTV-08 both ends |\n| cctv.stair | ppf=40, place=face_door_from_outside, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"Corridors/stairs\" (PPF 40 at stair doors) |\n| cctv.landing | ppf=40, place=corner_overview, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"...elevator landings\" (PPF 40) |\n| cctv.server | ppf=80, place=face_door_in, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"IT/records/high-value\" + Manual CCTV-13 |\n| cctv.it | ppf=80, place=face_door_in, n=1, only=['030' | SOURCED | Project spec 28 23 00 §1.4 area table row \"IT/records/high-value\" (030 IT WORKSPACE listed) |\n| cctv.records | ppf=80, place=face_door_in, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"IT/records/high-value\" |\n| cctv.mail | ppf=80, place=face_door_in, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"IT/records/high-value\" (136 MAIL ROOM) |\n| cctv.garage | ppf=40, place=corner_overview, perSf=1250 | SOURCED | Project spec 28 23 00 §1.4 area table row \"Garage/loading\" (PPF 40) |\n| cctv.cafeteria | ppf=20, place=center_360, n=1 | SOURCED | Project spec 28 23 00 §1.4 area table row \"Cafeteria/break\" (138, not 139 KITCHEN) |\n| cctv.restroom | n=0 | ASSUMED | Manual cheat sheet §1.3: no cameras in restrooms (privacy) — ASSUMED rule, consistent with spec table (restrooms not listed) |\n| cctv.defaultNone | {} | SOURCED | Project spec 28 23 00 §1.4 area table: room type not listed in the area table -> no camera |"
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Reference/LV-Workflows/LV-Workflow-CCTV-Video.md",
    "author": "GSIS source document; verbatim practice conversion"
  },
  "CRS-LV-SOP-ACCESS": {
    "course_id": "CRS-LV-SOP-ACCESS",
    "title": "AC — Access control workflow",
    "steps": [
      {
        "title": "AC — Access control workflow",
        "body": "# AC — Access control workflow\n\nProject spec section: 28 13 00. Engine: `js/placementRules.js` (`RULES.ac`). Tests: `js/placementRules.test.js`."
      },
      {
        "title": "Find controlled doors with doorRules AC-R1..R10 (exterior, IT/MDF, secure suites).",
        "body": "Find controlled doors with doorRules AC-R1..R10 (exterior, IT/MDF, secure suites)."
      },
      {
        "title": "Assign a device set per door: reader, lock, REX, DPS, intercom (where the rule says).",
        "body": "Assign a device set per door: reader, lock, REX, DPS, intercom (where the rule says)."
      },
      {
        "title": "Run each door end to end: TR panel → reader/lock/REX/DPS/intercom, tagged with the door no.",
        "body": "Run each door end to end: TR panel → reader/lock/REX/DPS/intercom, tagged with the door no."
      },
      {
        "title": "PSU sizing: (locks × lock_a + readers × reader_a) × 1.3; battery for 4 h × 1.25.",
        "body": "PSU sizing: (locks × lock_a + readers × reader_a) × 1.3; battery for 4 h × 1.25."
      },
      {
        "title": "If a door needed by a rule isn't on the plan, mark it INPUT NEEDED and don't invent it.",
        "body": "If a door needed by a rule isn't on the plan, mark it INPUT NEEDED and don't invent it."
      },
      {
        "title": "Rules table",
        "body": "| Rule | Value | Status | Source |\n|---|---|---|---|\n| ac.reader_aff_in | 42 | SOURCED | Manual §2.3 (ADA 15–48 in; GSIS 42 in) + spec 28 13 00 §1.3.E |\n| ac.psu_margin | 1.3 | SOURCED | Manual §2.3 lock PSU +30% margin |\n| ac.battery_h | 4 | SOURCED | Spec 28 13 00 §1.6.E 4-hour standby |\n| ac.lock_a | 0.5 | ASSUMED | ASSUMED 0.5 A @24 VDC per electrified lock/ELR — replace with 08 71 00 hardware cut sheets |\n| ac.reader_a | 0.15 | ASSUMED | ASSUMED 0.15 A per OSDP reader (model TBD) |\n| ac.panels | {'0': ['031', '042B'], '1': ['042B'], '2 | SOURCED | Spec 28 13 00 §1.2.B controllers in 031, 042B, 250 [VERIFY] |\n| AC-R1 | 100 reader+elr+autoop+dps+rex+intercom | SOURCED | Project spec 28 13 00 §1.4 door table row \"Main entry pair\"; video intercom ASSUMED (not in spec) |\n| AC-R2 | 142,146 reader+elr+autoop+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"South/East entry\" (146 ENTRY VESTIBULE treated as 145 ENTRY outer door — VERIFY) |\n| AC-R3 | 144 dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Exit vestibule\" (monitored, no reader) |\n| AC-R4 | 031 keypad+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Server room\" (card + PIN) |\n| AC-R5 | 026,030 reader+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"IT\"; DPS/REX per Manual §2.3 default |\n| AC-R6 | 148,159 reader+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Treasurer\" |\n| AC-R7 | 050,165,209,224 reader+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Records\" |\n| AC-R8 | 136 reader+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Mail\" |\n| AC-R9 |  reader+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Public/staff separation\" |\n| AC-R10 | 042B,042A,012,022A reader+lock+dps+rex | SOURCED | Project spec 28 13 00 §1.4 door table row \"Telecom/electrical\" |\n| ac.innerTypes | ['office', 'support', 'restroom'] | ASSUMED | ASSUMED: doors from a secure room into its own inner offices/storage are not controlled (suite interior) |\n| ac.stairNote | {} | ASSUMED | Stair re-entry / FA release: spec §1.6.D [VERIFY existing FA]; Manual: NOT FOUND -> no stair doors controlled |\n| ac.doorNumbering | {} | ASSUMED | ASSUMED: A8.0 Door Schedule not in provided set; door no. = room it swings into + suffix |"
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Reference/LV-Workflows/LV-Workflow-AC-Access.md",
    "author": "GSIS source document; verbatim practice conversion"
  },
  "CRS-LV-SOP-AV": {
    "course_id": "CRS-LV-SOP-AV",
    "title": "AV — Audio-visual workflow",
    "steps": [
      {
        "title": "AV — Audio-visual workflow",
        "body": "# AV — Audio-visual workflow\n\nProject spec section: (none in set). Engine: `js/placementRules.js` (`RULES.av`). Tests: `js/placementRules.test.js`."
      },
      {
        "title": "NO AV spec in the bid set, so the whole program is ASSUMED.",
        "body": "NO AV spec in the bid set, so the whole program is ASSUMED."
      },
      {
        "title": "Display size from DISCAS: farthest viewer ≤ 6 × image height (AV-03..07).",
        "body": "Display size from DISCAS: farthest viewer ≤ 6 × image height (AV-03..07)."
      },
      {
        "title": "Video bar ≤300 sf, otherwise codec + DSP + ceiling mic; speakers for 90° coverage at 9 ft ceiling.",
        "body": "Video bar ≤300 sf, otherwise codec + DSP + ceiling mic; speakers for 90° coverage at 9 ft ceiling."
      },
      {
        "title": "Amplifier = taps × 1.5 (AV-17).",
        "body": "Amplifier = taps × 1.5 (AV-17)."
      },
      {
        "title": "Rules table",
        "body": "| Rule | Value | Status | Source |\n|---|---|---|---|\n| av.eh | 0.03 | SOURCED | Manual AV-03..07 DISCAS/BDM: FV ≤ 6 × IH (3% element height) |\n| av.sizes_in | [55, 65, 75, 85, 98] | ASSUMED | ASSUMED commercial display sizes (model TBD) |\n| av.ceiling_ft | 9 | ASSUMED | ASSUMED 9 ft ceiling — verify on A2.0/A2.1 RCP |\n| av.ear_ft | 4 | SOURCED | Manual AV-13 (seated ear height 4 ft) |\n| av.spk_cov_deg | 90 | ASSUMED | ASSUMED 90° conical ceiling speaker (model TBD) |\n| av.mic_cov_sf | 900 | ASSUMED | Manual AV-21..24 ceiling mic array ≈30x30 ft pickup (ASSUMED value) |\n| av.videobar_max_sf | 300 | ASSUMED | ASSUMED: rooms ≤ 300 sf use all-in-one video bar |\n| av.amp_factor | 1.5 | SOURCED | Manual AV-17 amp = taps × 1.5 |\n| av.tap_w | 2 | ASSUMED | ASSUMED 2 W tap per 70 V speaker |\n| av.als_sf_per_seat | 15 | ASSUMED | ASSUMED occupant load 15 sf/seat (CBC Table 1004.5 unconcentrated) for ALS count |\n| av.program | {} | ASSUMED | No AV spec section in the project set -> entire AV program is ASSUMED and needs Kemar/Owner confirmation |"
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Reference/LV-Workflows/LV-Workflow-AV-Audio-visual.md",
    "author": "GSIS source document; verbatim practice conversion"
  },
  "CRS-LV-SOP-NET": {
    "course_id": "CRS-LV-SOP-NET",
    "title": "NW — Networking / Wi-Fi workflow",
    "steps": [
      {
        "title": "NW — Networking / Wi-Fi workflow",
        "body": "# NW — Networking / Wi-Fi workflow\n\nProject spec section: 27 21 00. Engine: `js/placementRules.js` (`RULES.wifi`). Tests: `js/placementRules.test.js`."
      },
      {
        "title": "AP count per room from the §1.4 coverage table (open office sf, conference dedicated, cafeteria minimum).",
        "body": "AP count per room from the §1.4 coverage table (open office sf, conference dedicated, cafeteria minimum)."
      },
      {
        "title": "Spacing 40–60 ft honeycomb (NW-18/19); skip noAP room types.",
        "body": "Spacing 40–60 ft honeycomb (NW-18/19); skip noAP room types."
      },
      {
        "title": "PoE budget: AP 30 W, camera 15.4 W (ASSUMED) → switch PoE class.",
        "body": "PoE budget: AP 30 W, camera 15.4 W (ASSUMED) → switch PoE class."
      },
      {
        "title": "Rules table",
        "body": "| Rule | Value | Status | Source |\n|---|---|---|---|\n| wifi.cell_ft | 50 | SOURCED | Manual NW-18 (AP spacing 40–60 ft) + NW-19 honeycomb |\n| wifi.open_office_sf | 2000 | SOURCED | Project spec 27 21 00 §1.4 coverage table row \"Open office\" 1 WAP per ~2,000 sf |\n| wifi.conf_dedicated_sf | 300 | SOURCED | Project spec 27 21 00 §1.4 coverage table row \"Conference\" dedicated WAP in 130 and rooms > 300 sf |\n| wifi.cafeteria_min | 1 | SOURCED | Project spec 27 21 00 §1.4 coverage table row \"Cafeteria\" 1 WAP minimum |"
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Reference/LV-Workflows/LV-Workflow-NW-Networking.md",
    "author": "GSIS source document; verbatim practice conversion"
  },
  "CRS-LV-SOP-CABLING": {
    "course_id": "CRS-LV-SOP-CABLING",
    "title": "SC — Structured cabling workflow",
    "steps": [
      {
        "title": "SC — Structured cabling workflow",
        "body": "# SC — Structured cabling workflow\n\nProject spec section: 27 10 00 / 27 21 00. Engine: `js/placementRules.js` (`RULES.data`). Tests: `js/placementRules.test.js`."
      },
      {
        "title": "Classify rooms; open areas get 1 two-port outlet per 100 sf work area (SC-05/06).",
        "body": "Classify rooms; open areas get 1 two-port outlet per 100 sf work area (SC-05/06)."
      },
      {
        "title": "Device ports: AP 2 × Cat 6A, camera/AC/AV 1 each.",
        "body": "Device ports: AP 2 × Cat 6A, camera/AC/AV 1 each."
      },
      {
        "title": "Route to the nearest TR; link ≤295 ft (SC-01) or propose an IDF.",
        "body": "Route to the nearest TR; link ≤295 ft (SC-01) or propose an IDF."
      },
      {
        "title": "Patch panels = ceil(ports × 1.1 / 24); switches per 48 ports.",
        "body": "Patch panels = ceil(ports × 1.1 / 24); switches per 48 ports."
      },
      {
        "title": "Rules table",
        "body": "| Rule | Value | Status | Source |\n|---|---|---|---|\n| data.port_per_outlet | 2 | SOURCED | Manual SC-05 (≥2 ports per work area) |\n| data.work_area_sf | 100 | SOURCED | Manual SC-06 (~100 sf per work area) |\n| data.max_link_ft | 295 | SOURCED | Manual SC-01 (TIA 568: 90 m permanent link) |\n| data.office | outlets=2 | ASSUMED | SC-05 min 1 work area; 2nd outlet on opposite wall ASSUMED (GSIS default) |\n| data.open_office | perWA=1 | SOURCED | SC-05 + SC-06: 1 two-port outlet per 100 sf work area; locations pending furniture plan |\n| data.it | perWA=1 | SOURCED | SC-05 + SC-06 |\n| data.reception | perWA=1 | SOURCED | SC-05 + SC-06 |\n| data.treasurer | perWA=1 | SOURCED | SC-05 + SC-06 |\n| data.conference | outlets=2 | ASSUMED | ASSUMED: 1 display wall + 1 table/floor box (AV coordination) |\n| data.workroom | outlets=2 | ASSUMED | ASSUMED: copier + workstation |\n| data.lobby | outlets=1 | ASSUMED | ASSUMED: reception/signage outlet |\n| data.cafeteria | outlets=1 | ASSUMED | ASSUMED |\n| data.kitchen | outlets=1 | ASSUMED | ASSUMED |\n| data.mail | outlets=1 | ASSUMED | ASSUMED |\n| data.records | outlets=1 | ASSUMED | ASSUMED |\n| data.devicePorts | {'camera': 1, 'ap': 2, 'acpanel': 1, 'displa | SOURCED | AP 2 x Cat 6A: spec 27 21 00 §3.1.A (TSB-162-A); others 1 per device Manual §8.3 (ASSUMED defaults) |"
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Reference/LV-Workflows/LV-Workflow-SC-Structured.md",
    "author": "GSIS source document; verbatim practice conversion"
  },
  "CRS-MON-DACT-GUIDE": {
    "course_id": "CRS-MON-DACT-GUIDE",
    "title": "GSIS Monitoring/DACT programming & central-station handoff",
    "steps": [
      {
        "title": "GSIS Technician Programming Training Guide",
        "body": "# GSIS Technician Programming Training Guide\nGolden State Integrated Systems (GSIS), Kemar McKenzie, Owner. California C-10 / C-7 contractor.\nVersion 1.0, 2026-10-23. Fire alarm comes first, then low voltage.\n\n> **How to use this guide.** Build the whole program on paper or in a spreadsheet before you open any manufacturer software. At the panel, you only enter data and check it. Each system's own file in `systems/` shows where the build goes in that system's software or menus, with manual page references. Sources are listed in `Sources.md`. Blank templates are in `templates/`.\n\n> **Rules we follow.** We use only legal, public documents. We never use pirated software, cracked keys, or shared dealer logins. If a manufacturer requires a partner login or factory training, we get it or we hire an authorized partner. We always back up the existing panel program before changing anything.\n\n> **Code basis.** California currently adopts NFPA 72, 2022 edition, through the CFC and CBC. NFPA offers free read-only access at https://www.nfpa.org/codes-and-standards/nfpa-72-standard-development/72. Section numbers below are from NFPA 72-2022. Check each one against your own copy before you cite it on a submittal.\n\n---"
      },
      {
        "title": "1.1 Why we program off-panel",
        "body": "- The time you spend at the panel is mostly typing and testing, not design work, so there is less downtime and less impairment time (NFPA 72 Ch. 10, impairments).\n- A second tech can check the build before it goes into the panel.\n- The build matches the documentation NFPA 72 requires: Ch. 7 minimum documentation, the record of completion (7.8.2), and the site-specific software record (7.5.7 / 23.2.2).\n- The same build carries over between makes. Only the data-entry step changes."
      },
      {
        "title": "1.2 Inputs you must have",
        "body": "1. **Job sheet** (`templates/Job-Sheet-and-SOO.md`), including the panel model, firmware, software version, and who holds software access.\n2. **Sequence of operations (SOO)** from the stamped drawings or spec. If there is none, write one and get it approved by the engineer of record or the AHJ.\n3. **Device list and drawings**, with every device located and given an address.\n4. **Existing program backup** for add-ons. Without it you cannot do incremental programming safely.\n5. **Monitoring data** from the central station: account number, receiver numbers or IPs, format, and the code list."
      },
      {
        "title": "1.3 The build (eight deliverables)",
        "body": "| # | Deliverable | Template | What \"done\" means | NFPA 72-2022 |\n|---|---|---|---|---|\n| 1 | Device-to-point map: address, type, label, zone, location | `01_Device-Point-Map.csv` | Every drawing device has exactly one unique address. Labels fit the panel's character limit. | 7.2, 7.5 |\n| 2 | Zones and groups | `02_Zones-Groups.csv` | No zone mixes types (alarm with supervisory, or latching with nonlatching) | 10.18 (annunciation zones) |\n| 3 | Cause-and-effect matrix | `03_Cause-Effect-Matrix.csv` | Every SOO line has a row, and every output has at least one driver | 23.8, Ch. 21 |\n| 4 | NAC, relay, and control outputs | `04_Outputs-NAC-Relay.csv` | Load calculation done, sync protocol matches the appliances, silenceable/latching marked | Ch. 18, 21 |\n| 5 | Supervision and trouble | `05_Supervision-Trouble.csv` | Every pathway and power source is supervised and reported | 12.6, 10.6 |\n| 6 | Monitoring/DACT: account and event codes | `06_Monitoring-DACT.csv` | Central station has confirmed the codes and there are two paths | Ch. 26 (26.6) |\n| 7 | Timers: verification, silence inhibit, PAS, AC-fail delay | `07_Timers.csv` | Each value is inside the manual's UL-permitted range and approved by the AHJ | 23.8.5.4 (verification), 23.8.1.3 (PAS) |\n| 8 | Verification and test plan | `08_Test-Plan.csv` | One line for every device and every C&E row, with the expected result | Ch. 14 (14.4.2 reacceptance), Table 14.4.3.2 |"
      },
      {
        "title": "1.4 Logic rules that apply to every make",
        "body": "- **Inputs → groups → outputs.** Every make maps inputs to outputs through some group object: correlation groups (Edwards iO), rules/cause-effect (EST3/EST4), control-by-event/CBE (Notifier, Fire-Lite, Gamewell), output groups (Silent Knight/Farenhyt), custom control (Simplex), or I/O mapping (Potter). Write your C&E matrix with neutral column names, then translate it for the make you're on.\n- **Count and delay.** \"2 detectors to release\" or \"cross-zone\" means a count greater than 1. Write it in the C&E as `Count_Required`.\n- **Verification** applies only to smoke detectors, never to pull stations, waterflow, or heat detectors (23.8.5.4).\n- **PAS** needs approval from the AHJ and staff trained to respond. Acknowledge within 15 s, investigate within up to 180 s (23.8.1.3).\n- **Waterflow** sounds the general alarm. Do not let it be silenced unless the AHJ allows it, and many panels have a \"waterflow silenceable\" option for this. Check it.\n- **Supervisory signals** (tamper, low air, duct detector where specified as supervisory) never turn on evacuation NACs.\n- **Duct detectors** shut down HVAC (21.7) and report as alarm or supervisory, depending on the spec and the CMC.\n- **Elevator recall**: primary floor, alternate floor, and machine room/hoistway/shunt trip handled separately (21.3, 21.4). Write each one as its own output.\n- **Silence and reset**: mark every output as silenceable or not, and latching or not.\n- **CO**: CO signals use a separate signal (temporal-4). Do not drive fire evacuation outputs with CO supervisory signals."
      },
      {
        "title": "1.5 Entering the build (any make)",
        "body": "1. Back up the panel: upload the database or print the configuration report. Name the file `JOB_PANEL_YYYY-MM-DD_PRE.ext`.\n2. Enter your build in the software (preferred) or at the keypad.\n3. Download it to the panel. Print or export the configuration report and **diff it line by line against your build**.\n4. Walk-test every changed or new device. Then do functional tests of every C&E row and check that the central station received each signal.\n5. After a software change, do reacceptance testing per NFPA 72 14.4.2: test all functions the change affects, plus a sample of devices it doesn't. Check the exact sample size in your copy.\n6. Save `..._POST` and file it with the record of completion (7.8.2). Put the software version and firmware on the record (23.2.2).\n\n---"
      },
      {
        "title": "Part 2 — Worked example: small Edwards iO64R add-on",
        "body": "**Scenario (training example; the addresses are made up).** An existing iO64R serves a one-story office. The add-on is a new 2-room training wing, a new fire sprinkler riser, and a new rooftop AHU. The panel has one loop and existing devices at 1-001 to 1-018. The manual is the iO64/iO1000 Technical Reference Manual, P/N 3102350-EN Rev 009 (page numbers are the manual's printed numbers)."
      },
      {
        "title": "2.1 Sequence of operations",
        "body": "1. Smoke detector in the new wing: alarm verification **on**. Then general alarm on all NACs, recall elevator (none on site), report to the central station as Fire Alarm.\n2. Manual pull at the wing exit: general alarm with no verification, report as Fire Alarm.\n3. New riser waterflow (via monitor module): general alarm, NACs **not silenceable**, report as Waterflow.\n4. New riser control-valve tamper: supervisory only, no NACs, report as Supervisory.\n5. AHU duct smoke detector: supervisory per the spec. Shut down the AHU through a relay module and report as Supervisory.\n6. New NAC extender circuit in the wing: follows the general alarm, silenceable unless waterflow caused the alarm.\n7. Any trouble in the wing: trouble at the panel and report as Trouble."
      },
      {
        "title": "2.2 Device-to-point map (excerpt of `01_Device-Point-Map.csv`)",
        "body": "| Loop-Addr | Device | Device type to program | Label (2×20) | Zone | Corr. groups | Location |\n|---|---|---|---|---|---|---|\n| 1-019 | Addressable photo smoke (model per iO compatibility list) | Smoke alarm verified | TRAIN RM 101 / SMOKE | 3 | 001 | Rm 101 ceiling |\n| 1-020 | Addressable photo smoke | Smoke alarm verified | TRAIN RM 102 / SMOKE | 3 | 001 | Rm 102 ceiling |\n| 1-021 | Addressable pull station | Pull station | WING EXIT / PULL | 3 | 001 | East exit door |\n| 1-022 | Monitor module | Waterflow | RISER 2 / WATERFLOW | 4 | 001, 002 | Riser room |\n| 1-023 | Monitor module | Supervisory latching (tamper) | RISER 2 / TAMPER OS&Y | 5 | — | Riser room |\n| 1-024 | Duct smoke detector + interface | Supervisory latching (duct) | AHU-3 / DUCT SMOKE | 6 | 003 | Roof AHU-3 return |\n| 1-025 | Relay module | Relay (output) | AHU-3 / SHUTDOWN RLY | — | 003 (output) | AHU-3 controller |\n| 1-026 | Supervised output module | NAC riser (output) | WING / NAC-EXT | — | 001 (output) | Wing corridor |"
      },
      {
        "title": "2.3 Zones",
        "body": "| Zone | Type | Label | Members |\n|---|---|---|---|\n| 3 | Alarm | TRAINING WING | 1-019, 1-020, 1-021 |\n| 4 | Waterflow | RISER 2 FLOW | 1-022 |\n| 5 | Supervisory | RISER 2 TAMPER | 1-023 |\n| 6 | Supervisory | AHU-3 DUCT | 1-024 |\nRule (manual p. 95, Table 26): do not mix device types and zone types."
      },
      {
        "title": "2.4 Correlation groups (iO's cause-and-effect object)",
        "body": "| Group | Inputs | Outputs | Count | Delay | Note |\n|---|---|---|---|---|---|\n| 001 (general alarm, a fast group) | Zone 3, 1-022, existing alarm zones | Panel NAC1–NAC4, 1-026 | 1 | 0 | Auto programming puts alarm devices and panel NACs here (p. 40). Groups 001–025 are the fast groups (p. 93). |\n| 002 (waterflow) | 1-022 | 1-026 | 1 | 0 | iO sets silenceability **per output device type**, for example *Continuous (nonsilenceable)* or *Relay (nonsilenceable)* (device-type worksheet, p. 226). If the spec wants only waterflow to be non-silenceable, confirm the method with Edwards tech support before you build it. |\n| 003 (AHU shutdown) | 1-024 | 1-025 | 1 | 0 | Supervisory input drives the relay only, with no NAC |"
      },
      {
        "title": "2.5 Cause-and-effect matrix (excerpt)",
        "body": "| Input | NAC1-4 | 1-026 NAC-EXT | 1-025 AHU RLY | Panel alarm relay | Panel supv relay | Dialer | Silenceable |\n|---|---|---|---|---|---|---|---|\n| 1-019/020 smoke (verified) | X | X | | X | | Fire alarm (CID 111) | Y |\n| 1-021 pull | X | X | | X | | Fire alarm (CID 115) | Y |\n| 1-022 waterflow | X | X | | X | | Waterflow (CID 113) | **N** |\n| 1-023 tamper | | | | | X | Supervisory (CID 203/200) | n/a |\n| 1-024 duct | | | X | | X | Supervisory (CID 200) | n/a |\n| Any trouble | | | | | | Trouble (CID 3xx) | n/a |"
      },
      {
        "title": "2.6 Timers",
        "body": "| Timer | Value | Where in iO manual |\n|---|---|---|\n| Alarm verification | Smoke only. Do not combine with cross-zone, and keep the activation count ≤ 2 for cross-zoning (p. 88). | Device type \"verified\" (p. 53 device types; UL table p. 37) |\n| Reset inhibit (iO's inhibit timer; blocks silence/reset until it expires) | Off or 1 min per spec | Panel Operation programming (option descriptions p. 126; operation p. 164) |\n| AC fail delay | Range 0–15 h. **UL-permitted 1–3 h**, default 3 h (p. 37) | Panel Operation programming (p. 126) |\n| PAS | Not used unless the AHJ approves | n/a |"
      },
      {
        "title": "2.7 Monitoring/DACT",
        "body": "Account number, receivers, and Contact ID codes come from the central station. Enter them under Central monitoring station device programming (p. 110) and set per-device Event notification (Table 26, p. 95). Factory defaults include trouble CID 321 to 327 for NACs and test CID 600 (defaults, pp. 44–45). Override these if the central station asks you to."
      },
      {
        "title": "2.8 Entering it on the iO64R",
        "body": "1. Take a backup with iO-CU (MyEddie download, partner access) or print the System Configuration and Device Details reports (Ch. 4, pp. 179–185).\n2. Install the devices and set addresses 1-019 to 1-026.\n3. Use **incremental programming** (p. 77) or *Adding and removing devices* (p. 79). **Do not run auto programming** on an existing system, because it rebuilds the defaults and wipes custom groups (pp. 71–76).\n4. Device programming (p. 94): type, label, zone, event notification. Zone programming (p. 104). Correlation group programming (p. 87).\n5. Print the Correlation Group Configuration and Zone reports (p. 183–184) and diff them against 2.4 and 2.3.\n6. Run the walk test (pp. 176, 195). **Pitfalls:** walk test runs only the mainboard NACs, not addressable NAC devices such as 1-026, and alarm verification is bypassed during walk test (p. 177). Test 1-026 and verification functionally, then functional C&E tests, then SA-DACT testing (p. 194) with the central station on the line."
      },
      {
        "title": "2.9 Test plan (excerpt)",
        "body": "| Step | Device | Method | Expected | CS signal |\n|---|---|---|---|---|\n| 1 | 1-019 | Canned smoke | Verify cycle, then alarm, NACs on, alarm relay | Fire alarm, zone 3 |\n| 2 | 1-021 | Pull | Immediate alarm (no verify) | Fire alarm |\n| 3 | 1-022 | Flow test via inspector's test | Alarm; Silence does not silence NAC-EXT | Waterflow |\n| 4 | 1-023 | Close OS&Y 2 turns | Supervisory, no NACs | Supervisory |\n| 5 | 1-024 | Duct detector test | Supervisory, AHU-3 stops | Supervisory |\n| 6 | Open loop / NAC-EXT | Lift a wire | Trouble at the panel | Trouble |\n| 7 | Reacceptance | Test a sample of unaffected existing devices per 14.4.2 | Unchanged behavior | as programmed |\n\n**If GSIS has no iO-CU access:** either use the front panel (fully supported, Ch. 2) or hire the local Edwards partner (Quality Sound, Stockton) to back up and download the program while GSIS does the field work. See `../../Vendors/Edwards/Edwards-Master-List_2026-10-23.md`.\n\n---"
      },
      {
        "title": "Part 3 — Access-model summary",
        "body": "| System | Docs | Programming software | Access model |\n|---|---|---|---|\n| Edwards iO64/iO1000/iO64R | Public (distributor-hosted PDFs). Official copies on MyEddie. | iO-CU (MyEddie) | **Dealer/partner login** for the software. Front-panel programming open. Online factory cert (80% pass). |\n| Edwards EST3/EST3X | Public (distributor-hosted) | 3-SDU | **Dealer login + factory training + USB key + PIN** |\n| Edwards EST4 | Public (distributor-hosted TRM, User Guide) | 4-CU | **Dealer login + factory training**. Panel issues a Remote Write access code. License details not published. |\n| Notifier | Free (Honeywell eDAM) | VeriFire Tools | **Free download. Offline editing open.** Upload/download needs a **CLSS license (paid) + factory training**. Sold through engineered distributors. |\n| Fire-Lite | Free | FS-Tools | **Free download / open**. Front panel open. |\n| Silent Knight | Free | SKSS (5670) | **Free download / open**. Check that your SKSS version supports your panel. |\n| Honeywell (Farenhyt IFP, Pro-Watch/WIN-PAK) | Free (some links broken) | SKSS/FS-Tools; Pro-Watch | Fire: **open**. Pro-Watch/WIN-PAK: **dealer + license**. |\n| Gamewell-FCI | Distributor-hosted | CAMWorks (S3), E3 tools | **Factory training required** (S3 is factory-certified-installer only) |\n| Simplex | JCI docs portal (indexes public; some docs restricted) | ES Panel Programmer | **Factory/JCI only.** Software restricted to Simplex/JCI and authorized partners. Licensed. |\n| Potter | Free | Fire Panel Programmer | **Free download / open** |\n| Genetec | Free (TechDoc Hub) | Security Center / Synergis | **Free docs. Software licensed through partners (CPP).** Certification recommended. |\n| Verkada | Free (help.verkada.com) | Verkada Command (cloud) | **Open docs.** Needs a Command org plus device licenses. Partner program for resale. |\n| Leviton | Free | n/a (cabling) | **Open**. Warranty needs a certified installer (NIN). |\n| CommScope | Free | n/a (cabling) | **Open**. SYSTIMAX warranty needs PartnerPRO certification. |\n| Hikvision | Free | iVMS-4200, Hik-Connect | **Free download.** **NDAA §889 PROHIBITED for federal work** |\n| Dahua | Free (some official links block automated access) | SmartPSS Lite, DSS | **Free download.** **NDAA §889 PROHIBITED for federal work** |\n\n> **NDAA Section 889 flag.** FAR 52.204-25 (https://www.acquisition.gov/far/52.204-25) prohibits federal agencies and federal contractors from providing or using video surveillance equipment and services from Hikvision and Dahua (and Hytera, Huawei, ZTE). Do not quote or install Hikvision or Dahua on federal, federally funded, or critical-infrastructure work. Examples are ports (including the Port of Stockton), utilities, water/wastewater, and DoD/DHS sites. Ask the owner about federal funding on every bid, and record the answer on the job sheet.\n\n---"
      },
      {
        "title": "Part 4 — Low voltage: applying the same method",
        "body": "The same \"build first, enter second\" method applies. These are the build deliverables:\n| Fire alarm deliverable | LV equivalent |\n|---|---|\n| Device-to-point map | **Camera/door/port schedule**: ID, model, IP/VLAN, MAC, location, switch port, PoE budget, NVR channel or controller port |\n| Zones/groups | **Areas, sites, camera groups, door groups** |\n| Cause & effect | **Event-to-action rules**: door forced → camera bookmark + alert; motion → record; fire alarm relay → unlock egress doors (NFPA 72 21.8 / CBC 1010) |\n| Supervision | Camera offline, NVR disk/RAID health, controller tamper, PSU fail |\n| Monitoring | Alert recipients, VMS/central-station integration |\n| Timers | Door unlock (strike) time, door-held-open time, pre-/post-record, retention days |\n| Test plan | Per-camera view/recording/retention check, per-door credential/REX/DPI/forced/held test, cable certification report |\n\nLV templates: reuse `01_Device-Point-Map.csv` (put IP, VLAN, and switch port in the Notes column) or copy `templates/09_LV-Device-Schedule.csv`.\n\n---"
      },
      {
        "title": "Part 5 — Per-system sections",
        "body": "- Fire: [Edwards iO](systems/Edwards-iO.md) · [Edwards EST3/EST3X](systems/Edwards-EST3.md) · [Edwards EST4](systems/Edwards-EST4.md) · [Notifier](systems/Notifier.md) · [Fire-Lite](systems/Fire-Lite.md) · [Silent Knight](systems/Silent-Knight.md) · [Gamewell-FCI](systems/Gamewell-FCI.md) · [Simplex](systems/Simplex.md) · [Honeywell (Farenhyt/Pro-Watch)](systems/Honeywell.md) · [Potter](systems/Potter.md)\n- LV: [Genetec](systems/Genetec.md) · [Verkada](systems/Verkada.md) · [Hikvision](systems/Hikvision.md) · [Dahua](systems/Dahua.md) · [Leviton](systems/Leviton.md) · [CommScope](systems/CommScope.md)"
      },
      {
        "title": "Part 6 — Gaps (no public documentation found)",
        "body": "- Edwards **iO-CU help**, **3-SDU Help (P/N 180653)**, and **4-CU help** are not public. They are in-app or on MyEddie only.\n- Edwards iO-CU license or key requirement is not published. The EST4 4-CU license model is not published.\n- Simplex **ES Panel Programmer's Manual (574-849)** and the 4007ES Programmer's Manual (579-1167) are only on third-party mirror sites, not official public pages. We do not cite them as authoritative.\n- Gamewell-FCI **CAMWorks** help is only on third-party mirror sites. S3 programming needs factory certification.\n- Notifier VeriFire Tools help is in-app only.\n- Dahua official manual PDFs (dahuasecurity.com / material.dahuasecurity.com) returned **HTTP 403** to automated checks on 2026-10-23. They may open in a browser.\n- Honeywell Pro-Watch 5.0 Installation Guide PDF link returned **404**. The WIN-PAK product page is listed instead.\n- Verkada has no offline programming file. The build is entered directly in the cloud.\n- Stockton Fire's local programming/acceptance rules are not published (carried over from the Edwards master list)."
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Training/Programming-Guide/GSIS-Programming-Guide.md",
    "author": "GSIS source document; verbatim practice conversion"
  },
  "CRS-AER-GSIS-SOP": {
    "course_id": "CRS-AER-GSIS-SOP",
    "title": "GSIS Aerial flight ops + job closeout SOP",
    "steps": [
      {
        "title": "GSIS Drone Services Package: README",
        "body": "# GSIS Drone Services Package: README\nBuilt 2026-10-20 by Grok Bot (knowledgeWork) for Kemar McKenzie. Division: DR Drone Services. DRAFT. Nothing was sent to anyone."
      },
      {
        "title": "Files",
        "body": "| File | What it is |\n|---|---|\n| `GSIS-Drone-Services-Package.pdf` | THE deliverable, 25 pages: Part 1 Client info packet (pp. 1-3), Part 2 Service pages (pp. 4-9), Part 3 Department needs checklist (pp. 10-12, INTERNAL ONLY), Part 4 Cut sheets (p. 13 index, pp. 14-25 DJI manufacturer documents) |\n| `source/GSIS-Drone-Services-Package.html` | Editable source: cover, client packet, cut-sheet index page, and styles |\n| `source/build.py` | Editable source: service-page content and needs-list rows (edit the lists, then rebuild) |\n| `source/merge.sh` | Rebuild: runs build.py, renders with Chrome, stamps footers/page numbers, appends cut sheets |\n| `source/package_built.html` | Generated HTML (don't edit; rebuilt by merge.sh) |\n| `assets/gsis-logo.png` | GSIS logo, 730x705 high-res copy of /workspace/mygsis/src/assets/logo.png (same art as 04-Templates/gsis-logo.png) |\n| `assets/DJI_Matrice-4-Series_Specs_enterprise.dji.com_2026-10-20.pdf` | Official DJI spec page, printed from https://enterprise.dji.com/matrice-4-series/specs (DJI does not publish a spec-sheet PDF; cookie banner and site footer hidden, content unchanged) |\n| `assets/DJI_Matrice-4-Series_In-the-Box.pdf` | Official DJI PDF, https://dl.djicdn.com/downloads/DJI_Matrice_4_Series/20260331/DJI_Matrice_4_Series_In_the_Box.pdf |\n\n**Before emailing prospects:** send only pages 1-9 (`qpdf GSIS-Drone-Services-Package.pdf --pages . 1-9 -- client.pdf`). Part 3 is internal. Fill the [FILL]s first."
      },
      {
        "title": "Where each fact came from",
        "body": "| Fact | Source |\n|---|---|\n| Company name, owner Kemar McKenzie President/CEO, C-7 + C-10, License #1150625 | 00-Standing-Orders.md; 02-Vocabulary.md [KEMAR 2026-10-14] |\n| Four divisions (FA, LV, DR, SW) | 00-Standing-Orders.md; voice call c18881d8 (Kemar) |\n| Address 601 Brannan Island Road, Isleton, CA 95641; gsistech.com; 209-200-1073 | 04-Templates/Proposal-Field.md header. NOTE: Master Supplier List says \"street address not on file\", so Kemar should confirm the street address |\n| Five service lines | Task brief; staged skill gsis_skills_staged/gsis-estimate-drone-services.md |\n| Deliverables menu (photo set/video, orthomosaic, 3D mesh/point cloud, DSM/DTM/contours, stockpile volumes, progress report, sharing link) | Staged Estimate - Drone Services skill, Step 2 |\n| Process (intake, airspace/LAANC check, site access, mission planning, setup + safety brief, processing/QA, report, delivery) | Estimate - Drone Services skill (both versions); 05-Labor-Units.md Drone rows |\n| Report contents (site, date, weather, changes since last visit, captions, open items) | Kemar-Files/01M4XZZCCK2Z5VCRX7C356XQVW (AI Agents Plan, SkyReport) |\n| Billing milestones (10% setup + 90% per visit; 15/35/35/15 one-time) | schedule-of-values-and-billing skill, DR patterns |\n| Weather reschedules no change; not-a-land-survey wording; GCPs only if requested; thermal/lidar excluded | Staged Estimate skill Steps 5 and 7 |\n| DJI Matrice 4E, no thermal | Estimate - Drone Services skill [KEMAR 2026-10-14] |\n| Pix4D, DroneDeploy, DJI Enterprise, Skydio, Autel, Advexure, Drone Nerds as candidate suppliers; DJI public-sector flag | 03-Suppliers/GSIS_ALL_Master-Supplier-List_2026-10-14.md |\n| Part 107 recurrent every 24 months; B4UFLY | Staged Estimate skill |\n| FAA registration, Remote ID, 107.9 accident report; Part 108 not final; FCC Covered List | faa.gov Part 107 page; web search 2026-10-20 (flyusi.org, fcc.gov FAQ). These are requirements, not GSIS facts |\n| Northern California construction as first market; prospect segments | gsis-prospect-database-outreach skill; Prospects/NorCal-Drone-Prospects_*.csv; NorCal-Prospects_2026-10-15.md; voice call 1018019c |\n| Drone loaded rate $250/hr (INTERNAL ONLY, PROVISIONAL) | 01-Rate-Card.md. Kept OUT of all customer-facing pages |\n| Drone labor units (2.0 planning, 0.75 setup, 1.0 photo set, 1.0 per 20 ac mapping, 2.0 processing QA, 2.0 3D QA, 1.5 report, 1.0 per pile group) | 05-Labor-Units.md: starting defaults, NOT Kemar-confirmed. Internal only, not in the PDF |\n| Drive \"Drone Flights\" folder planned; SkyReport bot planned | AI Agents Plan (Kemar-Files) |\n| MYGSIS drone template null; 32 drone prospects imported with filter | 06-bots/developer/Batch13-Plan.md; SAVE-LOCK.md 2026-10-17 |\n\nChecked with no drone content: /workspace/uploads (does not exist), Jobs/ (only TEST-FA-001), Kemar-Files docs other than the two above. Google Drive was not searched (it was out of scope)."
      },
      {
        "title": "Open [FILL] gaps (Kemar)",
        "body": "1. FAA Part 107 certificate number, holder, and recurrent date (no source; Supplier List marks it MISSING)\n2. Drone insurance (aviation liability, hull) and GL carrier/limits/COI\n3. All customer prices: per visit, one-time setup, mapping, 3D, stockpile, inspection (Rate Card Drone section is all [FILL])\n4. Flight/processing/report hours by site size; travel rate and minimum trip charge\n5. Turnaround times for every service\n6. Deliverable file formats (these depend on which processing software is picked: Pix4D vs DroneDeploy vs other)\n7. GSIS email address ({{GSIS_EMAIL}})\n8. Data retention period and sharing/hosting platform\n9. Matrice 4E FAA registration number, Remote ID, serial; batteries/accessories list\n10. Who flies (remote pilot in command), visual observer, processing staff\n11. Software cut sheets: pending product selection (Pix4D / DroneDeploy listed only as candidates); other equipment list [FILL]\n12. Confirm the street address (template vs Supplier List conflict)\n13. Missing forms: progress report template, client intake form, pre-flight checklist / JHA, flight and maintenance logs, LAANC/waiver log, delivery acceptance form, ops manual, privacy policy\n14. Marketing proof: sample deliverables from practice flights, case studies, references (none exist; none were invented)"
      },
      {
        "title": "Compliance to confirm",
        "body": "- Any flight needing LAANC or a waiver needs Kemar's approval (skill).\n- Survey-grade claims need a licensed CA land surveyor.\n- DJI and public-sector clients: check agency restrictions before bidding (Supplier List flag).\n- The Drone rate is provisional until the first real job.\n\nConfidence: Medium. Structure and process are well sourced, but credentials, insurance, prices, turnaround and formats are all open [FILL]s."
      },
      {
        "title": "Update 2026-10-23 (deliverables + DRAFT pricing)",
        "body": "- Backups: `GSIS-Drone-Services-Package_v-before-deliverables.pdf`, `source/*_v-before-deliverables.*`.\n- pp 1-9: \"What you receive\" blocks with vendor-verified formats (`Deliverables-Format-Sources_2026-10-23.md`); turnaround `[FILL] business days`; retention `[FILL] days`.\n- DRAFT prices on pp 3-9 with red removable marker (`<span class=\"draft\">`, defined by `DP` in build.py and inline in the HTML). Rationale: `DRAFT-Pricing_2026-10-23.md`.\n- Client-only export: `GSIS-Drone-Services-Package_CLIENT-pp1-9.pdf`. pp 10-25 text unchanged.\n- merge.sh falls back to `overlay_merge.py` (pypdf in /tmp/venv) when qpdf is missing.\n- PNG renders: `renders/page-01..09.png`."
      }
    ],
    "quiz": [
      {
        "question": "Does finishing this practice change official training progress?",
        "choices": [
          "No. Official progress stays unchanged.",
          "Yes."
        ],
        "answer": 0
      }
    ],
    "source": "/workspace/GSIS/Drone/README.md",
    "author": "GSIS source document; verbatim practice conversion"
  }
};

// Display/assignment mapping corrections only; SOURCE_PATHS stays unchanged.
const ACCESS_MOTO = new Set(['CRS-MOTO-032', 'CRS-MOTO-033', 'CRS-MOTO-034', 'CRS-MOTO-035', 'CRS-MOTO-036', 'CRS-MOTO-037', 'CRS-MOTO-045', 'CRS-MOTO-047']);
const PATHS = SOURCE_PATHS.filter(p => !p.path_id.includes('CSLB')).map(p => ({
  ...p,
  course_ids: [...new Set([
    ...p.course_ids.filter(id => p.path_id !== 'PATH-MOTO-AVIGILON' || !ACCESS_MOTO.has(id)),
    ...(p.path_id === 'PATH-ACCESS' ? [...ACCESS_MOTO] : []),
    ...LV_SOP_COURSES.filter(c => c.path_id === p.path_id).map(c => c.course_id),
  ])],
}));
const CATALOG = [...SEED_COURSES, ...LV_SOP_COURSES];
const COURSE_BY_ID = Object.fromEntries(CATALOG.map(c => [c.course_id, c]));
const LOGIN_EMAIL = 'kemar@gsistech.com';
const emailKey = email => String(email || '').trim().toLowerCase();
const isDone = a => a.status === 'completed' || a.status === 'passed';
const isInternal = c => !!PRACTICE[c.course_id] || c.kind === 'interactive' || c.brand === 'GSIS Internal' || c.cost === 'internal';
const isGated = c => c.cost === 'paid' || c.cost === 'partner';
const safeURL = value => /^https?:\/\//i.test(value || '') ? value : null;
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
.gsis-training h1{font-size:29px;line-height:1.2;font-weight:800;margin:0 0 8px;letter-spacing:-.6px}
.gsis-training h2{font-size:19px;font-weight:750;margin:0 0 12px}.gsis-training h3{font-size:16px;font-weight:700;margin:0 0 8px}
.gsis-training p{margin:6px 0 12px}.gsis-training .t-wrap{max-width:1240px;margin:auto}
.gsis-training .t-hero{background:var(--tn);color:white;border-bottom:4px solid var(--tg);border-radius:14px;padding:22px;margin-bottom:18px}
.gsis-training .t-hero p{color:#d1dbe7;margin-bottom:0}.gsis-training .t-eyebrow{font-size:11px;letter-spacing:2px;font-weight:750;color:#e6ce79;text-transform:uppercase;margin-bottom:9px}
.gsis-training .t-card{background:white;border:1px solid #dce4ee;border-radius:12px;padding:16px;box-shadow:0 2px 6px #0b1f3a05}
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
        <DialogHeader><DialogTitle>{practiceId ? COURSE_BY_ID[practiceId]?.title : 'Internal practice'}</DialogTitle><DialogDescription>Local-only internal practice. Nothing here changes official training progress.</DialogDescription></DialogHeader>
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
  const steps = course?.steps || [];
  const quiz = course?.quiz || [];
  const hasQuiz = quiz.length > 0;
  const onQuiz = stepIndex === steps.length && hasQuiz;
  const step = steps[stepIndex];
  const score = quiz.filter((q, i) => answers[i] === q.answer).length;
  const allAnswered = quiz.every((_, i) => Number.isInteger(answers[i]));
  return <section className="t-stack" aria-label="Internal practice player">
    <p className="t-notice">Local practice only. Official progress stays unchanged. Internal orientation is not a manufacturer certification or authority to perform regulated work.</p>
    <p className="t-muted" aria-live="polite">{onQuiz ? 'Practice quiz' : `Step ${stepIndex + 1} of ${steps.length}`}</p>
    {step && <article className="t-card">
      <h2>{step.title}</h2><div className="t-pre">{step.body}</div>
      {step.task && <div className="t-notice"><strong>Practice task</strong><p>{step.task}</p><label>Practice notes (not saved)<textarea value={notes[stepIndex] || ''} onChange={e => setNotes({ ...notes, [stepIndex]: e.target.value })} /></label></div>}
    </article>}
    {onQuiz && <section className="t-card">
      <h2>Practice quiz</h2>
      {quiz.map((q, i) => <fieldset key={i} className="t-quiz"><legend>{i + 1}. {q.question}</legend>{q.choices.map((choice, j) => <label className="t-check" key={j}><input type="radio" name={`practice-${course.course_id}-${i}`} checked={answers[i] === j} onChange={() => { setAnswers({ ...answers, [i]: j }); setChecked(false); }} /><span>{choice}</span></label>)}</fieldset>)}
      <button className="t-primary" disabled={!allAnswered} onClick={() => setChecked(true)}>Check practice answers</button>
      {checked && <p className="t-notice" role="status">Practice score: {score} / {quiz.length}. {score === quiz.length ? 'Practice finished.' : 'Review the source steps and try again.'} Official training progress is unchanged.</p>}
    </section>}
    {!hasQuiz && stepIndex === steps.length - 1 && <p className="t-notice">End of documented practice. No quiz was supplied. Official progress is unchanged.</p>}
    <div className="t-actions"><button disabled={stepIndex === 0} onClick={() => setStepIndex(i => Math.max(0, i - 1))}>Back</button><button className="t-primary" disabled={stepIndex >= steps.length - (hasQuiz ? 0 : 1)} onClick={() => setStepIndex(i => i + 1)}>{hasQuiz && stepIndex === steps.length - 1 ? 'Next: practice quiz' : 'Next'}</button></div>
    {course?.source && <p className="t-source">Documented source: {course.source}</p>}
  </section>;
}
