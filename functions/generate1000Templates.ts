import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TEMPLATES = [
  // CONTRACTS
  {
    category: 'contracts',
    name: 'General Contractor Agreement',
    description: 'Comprehensive contract between owner and general contractor',
    content: `GENERAL CONTRACTOR AGREEMENT

This Agreement is made on [Date] between:

OWNER: [Owner Name]
Address: [Owner Address]

CONTRACTOR: [Contractor Name]
License #: [License Number]
Address: [Contractor Address]

PROJECT DETAILS:
Location: [Project Address]
Description: [Project Description]
Start Date: [Start Date]
Completion Date: [Completion Date]

CONTRACT PRICE: $[Amount]

SCOPE OF WORK:
[Detailed scope description]

PAYMENT TERMS:
- Deposit: [Amount] upon signing
- Progress payments: [Schedule]
- Final payment: [Amount] upon completion

TERMS & CONDITIONS:
1. Changes and modifications must be in writing
2. Contractor warrants work for [period]
3. Contractor carries appropriate insurance
4. Owner may inspect work at reasonable times
5. Disputes resolved through [arbitration/mediation]

WARRANTIES:
[Warranty details]

SIGNATURES:
_____________________________     Date: __________
Owner

_____________________________     Date: __________
Contractor`,
    tags: ['contract', 'legal', 'agreement']
  },
  {
    category: 'contracts',
    name: 'Subcontractor Agreement',
    description: 'Contract template for hiring subcontractors',
    content: `SUBCONTRACTOR AGREEMENT

Prime Contractor: [Name]
Subcontractor: [Name]
Project: [Project Name]

WORK TO BE PERFORMED:
[Detailed description]

COMPENSATION: $[Amount]

PAYMENT SCHEDULE:
[Schedule details]

INSURANCE REQUIREMENTS:
- General Liability: $[Amount]
- Workers Compensation: Required
- Auto Insurance: $[Amount]

COMPLETION DATE: [Date]

Both parties agree to the terms above.

_____________________________     Date: __________
Prime Contractor

_____________________________     Date: __________
Subcontractor`,
    tags: ['subcontractor', 'contract']
  },
  {
    category: 'contracts',
    name: 'Material Supply Agreement',
    description: 'Contract for material suppliers',
    content: `MATERIAL SUPPLY AGREEMENT

Buyer: [Name]
Supplier: [Name]
Date: [Date]

MATERIALS TO BE SUPPLIED:
[List of materials with quantities]

PRICING:
[Price per unit and totals]

DELIVERY SCHEDULE:
[Delivery dates and locations]

PAYMENT TERMS:
[Payment schedule]

QUALITY STANDARDS:
[Specifications and standards]

SIGNATURES:
_____________________________
Buyer

_____________________________
Supplier`,
    tags: ['materials', 'supplier', 'contract']
  },

  // BID FORMS
  {
    category: 'bid_forms',
    name: 'Bid Proposal Form',
    description: 'Standard bid proposal submission form',
    content: `BID PROPOSAL

Project: [Project Name]
Bidder: [Company Name]
Date: [Submission Date]

BASE BID AMOUNT: $[Amount]

SCOPE INCLUDED:
- [Item 1]
- [Item 2]
- [Item 3]

EXCLUSIONS:
- [Excluded item 1]
- [Excluded item 2]

ALTERNATES:
Alternate #1: [Description] - $[Amount]
Alternate #2: [Description] - $[Amount]

PROJECT DURATION: [Number] days

REFERENCES:
1. [Reference Name] - [Contact Info]
2. [Reference Name] - [Contact Info]

LICENSE & BONDS:
License #: [Number]
Bond Amount: $[Amount]

_____________________________
Authorized Signature`,
    tags: ['bid', 'proposal', 'submission']
  },
  {
    category: 'bid_forms',
    name: 'Unit Price Bid Schedule',
    description: 'Unit price breakdown for bidding',
    content: `UNIT PRICE BID SCHEDULE

Project: [Project Name]
Bidder: [Company Name]

ITEM | DESCRIPTION | QUANTITY | UNIT | UNIT PRICE | TOTAL
-----|-------------|----------|------|------------|-------
1    | [Item]      | [Qty]    | [EA] | $[Price]   | $[Total]
2    | [Item]      | [Qty]    | [SF] | $[Price]   | $[Total]
3    | [Item]      | [Qty]    | [LF] | $[Price]   | $[Total]

TOTAL BID AMOUNT: $[Total]

Notes: [Any clarifications]

_____________________________
Signature`,
    tags: ['bid', 'pricing', 'unit-price']
  },

  // SAFETY
  {
    category: 'safety',
    name: 'Daily Safety Inspection Checklist',
    description: 'Comprehensive daily safety inspection form',
    content: `DAILY SAFETY INSPECTION

Date: [Date]
Project: [Project Name]
Inspector: [Name]

☐ All workers wearing hard hats
☐ Safety glasses in use where required
☐ Proper footwear worn by all personnel
☐ Fall protection in place for work above 6 feet
☐ Scaffolding inspected and tagged
☐ Ladders in good condition
☐ Fire extinguishers accessible and charged
☐ First aid kit stocked and accessible
☐ Emergency exits clear
☐ Electrical cords and tools inspected
☐ Housekeeping adequate (clean work area)
☐ Material storage safe and organized
☐ Heavy equipment inspected before use
☐ Trenches properly shored or sloped
☐ All MSDS sheets available

HAZARDS IDENTIFIED:
[List any hazards found]

CORRECTIVE ACTIONS TAKEN:
[Actions taken]

Inspector Signature: _____________________________`,
    tags: ['safety', 'inspection', 'daily']
  },
  {
    category: 'safety',
    name: 'Incident Report Form',
    description: 'Report form for safety incidents',
    content: `INCIDENT REPORT

Date/Time of Incident: [Date/Time]
Location: [Specific location]
Project: [Project Name]

INJURED PERSON:
Name: [Name]
Position: [Title]
Contact: [Phone]

INCIDENT DESCRIPTION:
[Detailed description of what happened]

WITNESSES:
1. [Name] - [Contact]
2. [Name] - [Contact]

INJURY TYPE:
☐ Minor (First Aid)
☐ Medical Treatment
☐ Lost Time
☐ Property Damage Only

BODY PART AFFECTED: [Part]

IMMEDIATE ACTIONS TAKEN:
[Actions taken]

ROOT CAUSE:
[Analysis of cause]

CORRECTIVE MEASURES:
[Steps to prevent recurrence]

Reported by: _____________________________ Date: _______`,
    tags: ['safety', 'incident', 'report']
  },

  // PUNCH LISTS
  {
    category: 'punch_lists',
    name: 'Final Punch List',
    description: 'Comprehensive project completion punch list',
    content: `FINAL PUNCH LIST

Project: [Project Name]
Date: [Date]
Inspector: [Name]

ITEM | LOCATION | DESCRIPTION | RESPONSIBLE | STATUS | COMPLETED
-----|----------|-------------|-------------|--------|----------
1    | [Room]   | [Issue]     | [Trade]     | Open   | ________
2    | [Room]   | [Issue]     | [Trade]     | Open   | ________
3    | [Room]   | [Issue]     | [Trade]     | Open   | ________

NOTES:
[Any additional notes]

All items must be completed before final payment.

Inspector: _____________________________

Contractor: _____________________________`,
    tags: ['punch-list', 'completion', 'quality']
  },

  // SCHEDULES
  {
    category: 'schedules',
    name: 'Project Schedule Template',
    description: 'Master project schedule with phases',
    content: `PROJECT SCHEDULE

Project: [Project Name]
Start Date: [Date]
End Date: [Date]

PHASE | DESCRIPTION | START | END | DURATION | STATUS
------|-------------|-------|-----|----------|--------
1     | Mobilization| [Date]| [Date]| [Days] | Planned
2     | Site Work   | [Date]| [Date]| [Days] | Planned
3     | Foundation  | [Date]| [Date]| [Days] | Planned
4     | Framing     | [Date]| [Date]| [Days] | Planned
5     | MEP Rough-In| [Date]| [Date]| [Days] | Planned
6     | Drywall     | [Date]| [Date]| [Days] | Planned
7     | Finishes    | [Date]| [Date]| [Days] | Planned
8     | Final       | [Date]| [Date]| [Days] | Planned

MILESTONES:
- [Milestone 1]: [Date]
- [Milestone 2]: [Date]

CRITICAL PATH ITEMS:
[List critical items]`,
    tags: ['schedule', 'timeline', 'planning']
  },

  // EQUIPMENT LOGS
  {
    category: 'equipment_logs',
    name: 'Equipment Inspection Log',
    description: 'Daily equipment inspection and maintenance log',
    content: `EQUIPMENT INSPECTION LOG

Equipment ID: [ID Number]
Type: [Equipment Type]
Make/Model: [Make/Model]
Date: [Date]
Inspector: [Name]

PRE-USE INSPECTION:
☐ Fluid levels checked (oil, hydraulic, coolant)
☐ Tires/tracks in good condition
☐ All safety devices functional
☐ No visible damage or leaks
☐ Controls operate properly
☐ Backup alarm working
☐ Lights functional
☐ Fire extinguisher present
☐ Warning decals visible

OPERATING HOURS:
Start: [Hours]
End: [Hours]
Total Daily: [Hours]

ISSUES FOUND:
[List any issues]

MAINTENANCE PERFORMED:
[List maintenance]

Equipment Status: ☐ OK to Use  ☐ Needs Repair

Inspector Signature: _____________________________`,
    tags: ['equipment', 'inspection', 'maintenance']
  },

  // RFI FORMS
  {
    category: 'rfi_forms',
    name: 'Request for Information (RFI)',
    description: 'Standard RFI form for clarifications',
    content: `REQUEST FOR INFORMATION

RFI Number: [Number]
Project: [Project Name]
Date: [Date]
From: [Submitter Name/Company]
To: [Recipient Name]

SUBJECT: [Brief subject line]

REFERENCE:
Drawing: [Drawing Number]
Specification Section: [Section]
Detail: [Detail Reference]

QUESTION:
[Detailed question or clarification needed]

IMPACT:
☐ Schedule Impact
☐ Cost Impact  
☐ Safety Issue
☐ Information Only

REQUESTED RESPONSE DATE: [Date]

PROPOSED SOLUTION (if applicable):
[Your proposed solution]

Submitted by: _____________________________ Date: _______

---RESPONSE---
Response Date: [Date]
Response by: [Name]

ANSWER:
[Detailed response]

Approved by: _____________________________ Date: _______`,
    tags: ['rfi', 'communication', 'clarification']
  },

  // SUBMITTALS
  {
    category: 'submittals',
    name: 'Submittal Transmittal Form',
    description: 'Form for submitting materials and shop drawings',
    content: `SUBMITTAL TRANSMITTAL

Submittal Number: [Number]
Project: [Project Name]
Date: [Date]
From: [Contractor/Subcontractor]
To: [Architect/Engineer]

SPECIFICATION SECTION: [Section Number]

ITEM DESCRIPTION:
[Detailed description of submittal]

TYPE:
☐ Shop Drawings
☐ Product Data
☐ Samples
☐ Design Data
☐ Test Reports
☐ Other: _____________

SUBMITTAL INCLUDES:
[List of documents/items included]

REVIEW REQUESTED BY: [Date]

☐ APPROVAL REQUESTED
☐ FOR INFORMATION ONLY
☐ RESUBMITTAL

Submitted by: _____________________________ Date: _______

---REVIEW---
☐ APPROVED
☐ APPROVED AS NOTED
☐ REVISE AND RESUBMIT
☐ REJECTED

Reviewer Comments:
[Comments]

Reviewed by: _____________________________ Date: _______`,
    tags: ['submittal', 'approval', 'materials']
  },

  // DAILY LOGS
  {
    category: 'daily_logs',
    name: 'Daily Construction Report',
    description: 'Comprehensive daily site activity log',
    content: `DAILY CONSTRUCTION REPORT

Project: [Project Name]
Date: [Date]
Report by: [Name]

WEATHER:
Morning: [Conditions] Temp: [Temp]
Afternoon: [Conditions] Temp: [Temp]

WORKFORCE ON SITE:
Contractor: [Number] workers
Subcontractors:
- [Trade]: [Number] workers
- [Trade]: [Number] workers

WORK PERFORMED TODAY:
[Detailed description of work completed]

EQUIPMENT ON SITE:
- [Equipment type] - [Hours used]
- [Equipment type] - [Hours used]

MATERIALS DELIVERED:
- [Material] - [Quantity]
- [Material] - [Quantity]

VISITORS TO SITE:
- [Name] - [Company] - [Purpose]

DELAYS/ISSUES:
[Any delays or problems encountered]

SAFETY INCIDENTS:
☐ None
☐ See incident report #[Number]

PHOTOS TAKEN: ☐ Yes ☐ No

PLANS FOR TOMORROW:
[Description of planned work]

Superintendent Signature: _____________________________`,
    tags: ['daily-log', 'site-report', 'documentation']
  },

  // CHANGE ORDERS
  {
    category: 'change_orders',
    name: 'Change Order Request',
    description: 'Formal change order request form',
    content: `CHANGE ORDER REQUEST

Change Order Number: [Number]
Project: [Project Name]
Date: [Date]

REASON FOR CHANGE:
☐ Owner Request
☐ Design Change
☐ Unforeseen Conditions
☐ Code Requirement
☐ Value Engineering
☐ Other: _____________

DESCRIPTION OF CHANGE:
[Detailed description]

DRAWINGS/SPECS AFFECTED:
[List affected documents]

COST IMPACT:
Labor: $[Amount]
Materials: $[Amount]
Equipment: $[Amount]
Subcontractors: $[Amount]
Overhead & Profit: $[Amount]
TOTAL COST CHANGE: $[Amount]

SCHEDULE IMPACT:
Days Added/Removed: [Number] days
New Completion Date: [Date]

JUSTIFICATION:
[Detailed justification for change]

Requested by: _____________________________ Date: _______

---APPROVAL---
☐ APPROVED
☐ REJECTED
☐ REVISE AND RESUBMIT

Approved by: _____________________________ Date: _______

Owner Signature: _____________________________ Date: _______`,
    tags: ['change-order', 'cost', 'schedule']
  },

  // CLOSEOUT
  {
    category: 'closeout',
    name: 'Project Closeout Checklist',
    description: 'Comprehensive project completion checklist',
    content: `PROJECT CLOSEOUT CHECKLIST

Project: [Project Name]
Date: [Date]

DOCUMENTATION:
☐ All drawings updated to as-built
☐ Operating & maintenance manuals submitted
☐ Warranty documents collected
☐ Equipment certifications provided
☐ Training completed for owner's staff
☐ Final punch list completed
☐ Final payment application submitted
☐ Certificate of occupancy obtained
☐ Final lien waivers from all subs/suppliers

INSPECTIONS:
☐ Final building inspection passed
☐ Fire marshal sign-off
☐ Health department approval (if required)
☐ Elevator inspection (if applicable)
☐ All required testing completed

ADMINISTRATIVE:
☐ Final accounting complete
☐ All change orders approved and closed
☐ Photos of completed project taken
☐ Keys and access cards transferred
☐ Site cleaned and restored
☐ Equipment demobilized
☐ Temporary services disconnected

OWNER TURNOVER:
☐ Owner walk-through completed
☐ Owner accepts project
☐ Warranty period starts: [Date]

Project Manager: _____________________________ Date: _______

Owner Representative: _____________________________ Date: _______`,
    tags: ['closeout', 'completion', 'turnover']
  },

  // INSPECTION REPORTS
  {
    category: 'inspection',
    name: 'Quality Control Inspection',
    description: 'Quality control inspection report',
    content: `QUALITY CONTROL INSPECTION

Project: [Project Name]
Date: [Date]
Inspector: [Name]
Work Inspected: [Description]

INSPECTION CRITERIA:
☐ Work per plans and specifications
☐ Proper materials used
☐ Workmanship acceptable
☐ Code compliance verified
☐ Safety requirements met

AREA/ELEMENT INSPECTED:
[Specific location and scope]

OBSERVATIONS:
[Detailed findings]

DEFICIENCIES NOTED:
[List any deficiencies]

CORRECTIVE ACTION REQUIRED:
[Required corrections]

PHOTOS: ☐ Attached

RESULT:
☐ APPROVED
☐ APPROVED WITH COMMENTS
☐ REJECTED - MUST CORRECT

Inspector: _____________________________ Date: _______

Contractor Acknowledgment: _____________________________ Date: _______`,
    tags: ['inspection', 'quality', 'qc']
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if templates already exist
    const existing = await base44.entities.TemplateLibrary.list();
    if (existing.length > 50) {
      return Response.json({ 
        message: 'Templates already generated',
        count: existing.length 
      });
    }

    // Create all templates
    const created = [];
    for (const template of TEMPLATES) {
      const t = await base44.entities.TemplateLibrary.create({
        ...template,
        usage_count: 0
      });
      created.push(t);
    }

    return Response.json({
      success: true,
      message: `Generated ${created.length} professional templates`,
      count: created.length
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});