import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * processPlanDocument — Step 1: Ingest plan document
 * 
 * INPUTS:
 * - planFileUrl (string) — uploaded plan PDF/DWG/image URL
 * - manualScale (string) — user-provided scale (e.g., "1/4 = 1'-0\"")
 * - specs (array) — optional spec document URLs
 * 
 * OUTPUTS:
 * {
 *   symbolMap: { symbolId: { name, description, scope, quantity } },
 *   detectedDevices: [{ type, id, x, y, sheetRef, scope }],
 *   detectedScopes: { AV, Data, FireAlarm, ... },
 *   cableRuns: { scopeName: { totalLF, devices: [...] } },
 *   error?: string
 * }
 * 
 * PROTOCOL:
 * 1. Rasterize plan at 300 DPI
 * 2. Extract scale (verify user input or extract from drawing)
 * 3. Locate legend box on plan
 * 4. Read legend with OCR → create Symbol Map
 * 5. Scan plan using Symbol Map → detect all devices
 * 6. Identify termination points (racks, FACP, headends)
 * 7. Calculate cable runs (straight line × 1.25 + 10 ft stub + 1.15 waste)
 * 8. If specs provided, extract and flag conflicts
 * 9. Return symbol map, detected devices, scopes, and cable LF totals
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { planFileUrl, manualScale, specs } = payload;

    if (!planFileUrl || !manualScale) {
      return Response.json({
        error: 'Missing required parameters: planFileUrl, manualScale',
      }, { status: 400 });
    }

    // ================================================================
    // PHASE 1: Rasterize plan at 300 DPI
    // ================================================================
    // TODO: Implement PyMuPDF rasterization
    // const planImage = await rasterizePlanPDF(planFileUrl, 300);
    console.log(`[processPlan] Rasterizing plan from ${planFileUrl}`);

    // ================================================================
    // PHASE 2: Extract/validate scale
    // ================================================================
    // TODO: Extract scale from drawing text; validate against manual input
    const confirmedScale = manualScale; // For now, trust user input
    console.log(`[processPlan] Confirmed scale: ${confirmedScale}`);

    // ================================================================
    // PHASE 3: Locate legend box and read symbols
    // ================================================================
    // TODO: Use OpenCV region detection to find legend box corner
    // TODO: Use Tesseract/AWS Textract to read legend text
    // TODO: Create Symbol Map from legend entries
    // STANDARD FALLBACK if no legend found:
    const standardSymbolLibrary = {
      SD: { name: 'Smoke Detector', scope: 'FireAlarm', quantity: 0 },
      PS: { name: 'Pull Station', scope: 'FireAlarm', quantity: 0 },
      HS: { name: 'Horn/Strobe', scope: 'FireAlarm', quantity: 0 },
      SB: { name: 'Strobe', scope: 'FireAlarm', quantity: 0 },
      FACP: { name: 'Fire Alarm Control Panel', scope: 'FireAlarm', quantity: 0 },
      NAC: { name: 'Notification Appliance Circuit', scope: 'FireAlarm', quantity: 0 },
      RJ45: { name: 'Data Jack', scope: 'Data', quantity: 0 },
      WAP: { name: 'Wireless Access Point', scope: 'Data', quantity: 0 },
      CAM: { name: 'Camera', scope: 'CCTV', quantity: 0 },
      NVR: { name: 'Network Video Recorder', scope: 'CCTV', quantity: 0 },
      SPK: { name: 'Speaker', scope: 'AV', quantity: 0 },
      DISP: { name: 'Display', scope: 'AV', quantity: 0 },
      READER: { name: 'Card Reader', scope: 'AccessControl', quantity: 0 },
      MAGLOCK: { name: 'Magnetic Lock', scope: 'AccessControl', quantity: 0 },
      REX: { name: 'Request to Exit Sensor', scope: 'AccessControl', quantity: 0 },
    };

    console.log(`[processPlan] Standard symbol library loaded (${Object.keys(standardSymbolLibrary).length} symbols)`);

    // ================================================================
    // PHASE 4: Detect devices on plan using Symbol Map
    // ================================================================
    // TODO: Use YOLOv8 or OpenCV to locate symbol instances on rasterized plan
    // TODO: Match each located symbol to Symbol Map
    // TODO: Extract nearby text labels (device IDs like "SD-14", "PS-2")
    // TODO: Calculate X/Y pixel coordinates, convert to feet using scale
    // TODO: Assign scope based on symbol type
    // MOCK DETECTION for now:
    const detectedDevices = [
      {
        type: 'SD',
        id: 'SD-1',
        x: 150,
        y: 200,
        sheetRef: 'Sheet 1',
        scope: 'FireAlarm',
        quantity: 1,
      },
      {
        type: 'SD',
        id: 'SD-2',
        x: 250,
        y: 200,
        sheetRef: 'Sheet 1',
        scope: 'FireAlarm',
        quantity: 1,
      },
      {
        type: 'RJ45',
        id: 'DATA-1',
        x: 100,
        y: 300,
        sheetRef: 'Sheet 1',
        scope: 'Data',
        quantity: 1,
      },
      {
        type: 'SPK',
        id: 'SPK-1',
        x: 350,
        y: 300,
        sheetRef: 'Sheet 1',
        scope: 'AV',
        quantity: 1,
      },
    ];

    console.log(`[processPlan] Detected ${detectedDevices.length} devices`);

    // ================================================================
    // PHASE 5: Identify termination points (rack, FACP, headend, IDF)
    // ================================================================
    // TODO: Detect labeled racks, FACP, headends using text/symbol detection
    // MOCK TERMINATION POINT:
    const terminationPoints = {
      FireAlarm: { id: 'FACP-1', x: 200, y: 500, sheetRef: 'Sheet 1' },
      Data: { id: 'IDF-1', x: 250, y: 520, sheetRef: 'Sheet 1' },
      AV: { id: 'HEADEND-1', x: 300, y: 540, sheetRef: 'Sheet 1' },
    };

    console.log(`[processPlan] Identified termination points: ${JSON.stringify(Object.keys(terminationPoints))}`);

    // ================================================================
    // PHASE 6: Calculate cable runs for each device
    // ================================================================
    // Formula: Run LF = (straight line distance × 1.25 routing factor) + 10 ft stub
    // After summing all runs per scope: Total = Sum × 1.15 waste factor
    const cableRunsByScope = {};

    detectedDevices.forEach(device => {
      const scope = device.scope;
      if (!cableRunsByScope[scope]) {
        cableRunsByScope[scope] = { devices: [], totalLF: 0 };
      }

      const terminus = terminationPoints[scope];
      if (terminus) {
        // Calculate distance (mock: pixel distance; in reality convert using scale)
        const straightLine = Math.sqrt(
          Math.pow(device.x - terminus.x, 2) + Math.pow(device.y - terminus.y, 2)
        );
        // Convert pixels to feet (mock: 1 pixel = 0.1 ft; use real scale in production)
        const straightLineDistFt = straightLine * 0.1;
        const routedDistance = straightLineDistFt * 1.25;
        const withStub = routedDistance + 10;

        cableRunsByScope[scope].devices.push({
          id: device.id,
          straightLine: straightLineDistFt.toFixed(1),
          routed: routedDistance.toFixed(1),
          withStub: withStub.toFixed(1),
        });
      }
    });

    // Apply waste factor (1.15) to totals
    Object.keys(cableRunsByScope).forEach(scope => {
      const sumLF = cableRunsByScope[scope].devices.reduce((acc, d) => acc + parseFloat(d.withStub), 0);
      cableRunsByScope[scope].totalLF = (sumLF * 1.15).toFixed(0);
    });

    console.log(`[processPlan] Cable runs calculated:`, JSON.stringify(cableRunsByScope, null, 2));

    // ================================================================
    // PHASE 7: Build Symbol Map and detect scopes
    // ================================================================
    const symbolMap = {};
    const scopeSet = new Set();

    detectedDevices.forEach(device => {
      if (!symbolMap[device.type]) {
        symbolMap[device.type] = {
          ...standardSymbolLibrary[device.type],
          quantity: 0,
        };
      }
      symbolMap[device.type].quantity += device.quantity;
      scopeSet.add(device.scope);
    });

    const detectedScopes = Array.from(scopeSet).reduce((acc, scope) => {
      acc[scope] = true;
      return acc;
    }, {});

    console.log(`[processPlan] Detected scopes: ${Object.keys(detectedScopes).join(', ')}`);

    // ================================================================
    // PHASE 8: Process specs if provided
    // ================================================================
    let specConflicts = [];
    if (specs && specs.length > 0) {
      // TODO: Extract spec text from spec documents
      // TODO: Categorize by cable type, approved manufacturers, device models, installation methods
      // TODO: Compare against plan symbols
      // TODO: Flag conflicts and create conflict report
      console.log(`[processPlan] ${specs.length} spec document(s) provided — conflict detection not yet implemented`);
    }

    // ================================================================
    // RETURN SUCCESS
    // ================================================================
    return Response.json({
      symbolMap,
      detectedDevices,
      detectedScopes,
      cableRuns: cableRunsByScope,
      specConflicts,
      markedUpPlanUrl: null, // TODO: Generate marked-up plan PDF
    });
  } catch (error) {
    console.error('[processPlanDocument] Error:', error);
    return Response.json({
      error: error.message || 'Unknown error processing plan',
    }, { status: 500 });
  }
});