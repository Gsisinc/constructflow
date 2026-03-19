import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, format } = await req.json();

    // Get template
    const templates = await base44.entities.TemplateLibrary.filter({ id: templateId });
    if (templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templates[0];

    // Update usage count
    await base44.entities.TemplateLibrary.update(templateId, {
      usage_count: (template.usage_count || 0) + 1
    });

    if (format === 'word') {
      // Generate Word document HTML
      const wordHtml = generateWordHtml(template);
      
      return new Response(wordHtml, {
        headers: {
          'Content-Type': 'application/msword',
          'Content-Disposition': `attachment; filename="${sanitizeFilename(template.name)}.doc"`
        }
      });
    } else if (format === 'excel') {
      // Generate Excel HTML
      const excelHtml = generateExcelHtml(template);
      
      return new Response(excelHtml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="${sanitizeFilename(template.name)}.xls"`
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Template generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateWordHtml(template) {
  return `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${template.name}</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      color: #1a365d;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
      margin-top: 20px;
      margin-bottom: 10px;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
    }
    h3 {
      font-size: 13pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin: 10px 0;
      text-align: justify;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      border-radius: 5px;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8fafc;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .field {
      background-color: #e0f2fe;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: bold;
      color: #0369a1;
    }
    .signature-block {
      margin-top: 40px;
      padding: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 5px;
      background-color: #f8fafc;
    }
    .signature-line {
      border-bottom: 2px solid #334155;
      margin: 30px 0 5px 0;
      width: 300px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #1e40af;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 10px;
      background-color: white;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #cbd5e1;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class='header'>
    <h1 style="color: white; border: none;">${template.name}</h1>
    <p style="margin: 5px 0; font-size: 10pt;">${template.description}</p>
  </div>

  ${formatContent(template.content)}

  <div class='footer'>
    <p>Generated from GSIS Manager Template Library | ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`;
}

function generateExcelHtml(template) {
  return `
<!DOCTYPE html>
<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta charset="utf-8">
  <title>${template.name}</title>
  <style>
    table {
      border-collapse: collapse;
      width: 100%;
      font-family: 'Calibri', Arial, sans-serif;
    }
    th {
      background-color: #1e40af;
      color: white;
      font-weight: bold;
      padding: 12px;
      border: 1px solid #1e3a8a;
      text-align: left;
    }
    td {
      padding: 10px;
      border: 1px solid #cbd5e1;
    }
    .header-cell {
      background-color: #3b82f6;
      color: white;
      font-weight: bold;
      font-size: 14pt;
    }
    .section-header {
      background-color: #dbeafe;
      font-weight: bold;
      color: #1e40af;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
  </style>
</head>
<body>
  <table>
    <tr>
      <th colspan="4" class="header-cell">${template.name}</th>
    </tr>
    <tr>
      <td colspan="4" style="background-color: #e0f2fe; padding: 10px;">${template.description}</td>
    </tr>
    <tr><td colspan="4">&nbsp;</td></tr>
    ${formatExcelContent(template.content)}
    <tr><td colspan="4">&nbsp;</td></tr>
    <tr>
      <td colspan="4" style="text-align: center; font-size: 9pt; color: #64748b;">
        Generated from GSIS Manager | ${new Date().toLocaleDateString()}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatContent(content) {
  if (!content) return '<p>No content available</p>';
  
  // Split into sections and format
  const lines = content.split('\n');
  let formatted = '';
  let inSection = false;
  
  for (let line of lines) {
    line = line.trim();
    
    if (!line) {
      if (inSection) {
        formatted += '</div>';
        inSection = false;
      }
      formatted += '<p>&nbsp;</p>';
      continue;
    }
    
    // Headers
    if (line.match(/^\d+\./)) {
      if (inSection) formatted += '</div>';
      formatted += `<div class='section'><h2>${line}</h2>`;
      inSection = true;
    } else if (line.startsWith('---')) {
      if (inSection) formatted += '</div>';
      formatted += '<hr style="border: 1px solid #cbd5e1; margin: 20px 0;">';
      inSection = false;
    } else if (line.startsWith('- ')) {
      formatted += `<p style="margin-left: 20px;">• ${line.substring(2)}</p>`;
    } else if (line.match(/\[.*?\]/g)) {
      // Replace [Field Name] with styled spans
      const formatted_line = line.replace(/\[(.*?)\]/g, "<span class='field'>[$1]</span>");
      formatted += `<p>${formatted_line}</p>`;
    } else {
      formatted += `<p>${line}</p>`;
    }
  }
  
  if (inSection) formatted += '</div>';
  
  // Add signature block if contains signature
  if (content.includes('Signature') || content.includes('Date:')) {
    formatted += `
      <div class='signature-block'>
        <p><strong>Signatures and Approvals</strong></p>
        <div class='signature-line'></div>
        <p>Contractor Name and Signature</p>
        <p>Date: __________________</p>
        <br>
        <div class='signature-line'></div>
        <p>Owner/Client Name and Signature</p>
        <p>Date: __________________</p>
      </div>`;
  }
  
  return formatted;
}

function formatExcelContent(content) {
  if (!content) return '<tr><td colspan="4">No content available</td></tr>';
  
  const lines = content.split('\n').filter(l => l.trim());
  let rows = '';
  
  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      rows += `<tr><td colspan="4" class="section-header">${line}</td></tr>`;
    } else if (line.startsWith('---')) {
      rows += '<tr><td colspan="4" style="background-color: #cbd5e1;">&nbsp;</td></tr>';
    } else if (line.includes(':')) {
      const [label, value] = line.split(':');
      rows += `<tr><td style="font-weight: bold; background-color: #f1f5f9;">${label.trim()}</td><td colspan="3">${value?.trim() || ''}</td></tr>`;
    } else if (line.startsWith('- ')) {
      rows += `<tr><td>&nbsp;</td><td colspan="3">${line.substring(2)}</td></tr>`;
    } else {
      rows += `<tr><td colspan="4">${line}</td></tr>`;
    }
  }
  
  return rows;
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
}