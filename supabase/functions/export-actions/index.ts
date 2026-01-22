import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple XLS generation using Microsoft SpreadsheetML (Excel 2003 XML)
// Note: although the file extension is .xls, the content is XML. This is supported by Excel.
function createExcelXML(data: Record<string, unknown>[], sheetName: string): string {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const safeSheetName = sanitizeSheetName(sheetName);
  const expandedRowCount = data.length + 1;
  const expandedColumnCount = Math.max(headers.length, 1);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(safeSheetName)}">
  <Table ss:ExpandedColumnCount="${expandedColumnCount}" ss:ExpandedRowCount="${expandedRowCount}" x:FullColumns="1" x:FullRows="1">`;

  // Add header row
  xml += '<Row ss:StyleID="Header">';
  for (const header of headers) {
    xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
  }
  xml += '</Row>';

  // Add data rows
  for (const row of data) {
    xml += '<Row>';
    for (const header of headers) {
      const value = row[header];
      const type = typeof value === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>`;
    }
    xml += '</Row>';
  }

  xml += '</Table></Worksheet></Workbook>';
  return xml;
}

function sanitizeSheetName(name: string): string {
  // Excel worksheet name rules: max 31 chars; cannot contain: : \/ ? * [ ]
  const cleaned = (name || '')
    .replace(/[\[\]\*\\\/\?\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const truncated = cleaned.slice(0, 31);
  return truncated || 'Folha1';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Simple ZIP implementation
class SimpleZip {
  private files: { name: string; content: Uint8Array }[] = [];

  addFile(name: string, content: string | Uint8Array) {
    const data = typeof content === 'string' 
      ? new TextEncoder().encode(content) 
      : content;
    this.files.push({ name, content: data });
  }

  async generate(): Promise<Uint8Array> {
    const parts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const file of this.files) {
      const nameBytes = new TextEncoder().encode(file.name);
      const crc = this.crc32(file.content);
      
      // Local file header
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      
      localView.setUint32(0, 0x04034b50, true); // Local file header signature
      localView.setUint16(4, 20, true); // Version needed
      localView.setUint16(6, 0, true); // General purpose bit flag
      localView.setUint16(8, 0, true); // Compression method (store)
      localView.setUint16(10, 0, true); // File time
      localView.setUint16(12, 0, true); // File date
      localView.setUint32(14, crc, true); // CRC-32
      localView.setUint32(18, file.content.length, true); // Compressed size
      localView.setUint32(22, file.content.length, true); // Uncompressed size
      localView.setUint16(26, nameBytes.length, true); // File name length
      localView.setUint16(28, 0, true); // Extra field length
      localHeader.set(nameBytes, 30);

      parts.push(localHeader);
      parts.push(file.content);

      // Central directory header
      const cdHeader = new Uint8Array(46 + nameBytes.length);
      const cdView = new DataView(cdHeader.buffer);
      
      cdView.setUint32(0, 0x02014b50, true); // Central directory signature
      cdView.setUint16(4, 20, true); // Version made by
      cdView.setUint16(6, 20, true); // Version needed
      cdView.setUint16(8, 0, true); // General purpose bit flag
      cdView.setUint16(10, 0, true); // Compression method
      cdView.setUint16(12, 0, true); // File time
      cdView.setUint16(14, 0, true); // File date
      cdView.setUint32(16, crc, true); // CRC-32
      cdView.setUint32(20, file.content.length, true); // Compressed size
      cdView.setUint32(24, file.content.length, true); // Uncompressed size
      cdView.setUint16(28, nameBytes.length, true); // File name length
      cdView.setUint16(30, 0, true); // Extra field length
      cdView.setUint16(32, 0, true); // File comment length
      cdView.setUint16(34, 0, true); // Disk number start
      cdView.setUint16(36, 0, true); // Internal file attributes
      cdView.setUint32(38, 0, true); // External file attributes
      cdView.setUint32(42, offset, true); // Relative offset of local header
      cdHeader.set(nameBytes, 46);
      
      centralDirectory.push(cdHeader);
      offset += localHeader.length + file.content.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of centralDirectory) {
      parts.push(cd);
      cdSize += cd.length;
    }

    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    
    eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk with central directory
    eocdView.setUint16(8, this.files.length, true); // Entries on this disk
    eocdView.setUint16(10, this.files.length, true); // Total entries
    eocdView.setUint32(12, cdSize, true); // Size of central directory
    eocdView.setUint32(16, cdOffset, true); // Offset of central directory
    eocdView.setUint16(20, 0, true); // Comment length
    
    parts.push(eocd);

    // Combine all parts
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
      result.set(part, pos);
      pos += part.length;
    }

    return result;
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const table = this.getCrc32Table();
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  private getCrc32Table(): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    return table;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get authorization header from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado - autenticação necessária' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create client with user's token (respects RLS)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado - token inválido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check user has appropriate role (admin, sec, or gestao)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado - role não encontrado' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const allowedRoles = ['admin', 'sec', 'gestao'];
    if (!allowedRoles.includes(roleData.role)) {
      console.log(`User ${user.id} with role ${roleData.role} denied export access`);
      return new Response(
        JSON.stringify({ error: 'Proibido - requer role admin, sec ou gestao' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Export authorized for user ${user.id} with role ${roleData.role}`);

    // Parse request body
    const { statuses } = await req.json();
    
    console.log('Exporting actions with statuses:', statuses);

    // Fetch actions with related data - now respects RLS
    let query = supabase
      .from('actions')
      .select(`
        id,
        description,
        responsible_name,
        status,
        criticality,
        progress,
        start_date,
        deadline,
        pelouro:pelouros(id, name),
        decision:decisions(
          text,
          agenda_point:agenda_points(
            title,
            meeting:meetings(type, date)
          )
        )
      `)
      .order('deadline', { ascending: true });

    // Apply status filter if provided
    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
      throw error;
    }

    console.log(`Found ${actions?.length || 0} actions`);

    if (!actions || actions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma ação encontrada com os filtros selecionados' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format date helper
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Transform action to row data - handle Supabase's array relations
    const actionToRow = (action: Record<string, unknown>) => {
      const pelouro = Array.isArray(action.pelouro) ? action.pelouro[0] : action.pelouro;
      const decision = Array.isArray(action.decision) ? action.decision[0] : action.decision;
      const agendaPoint = decision?.agenda_point 
        ? (Array.isArray(decision.agenda_point) ? decision.agenda_point[0] : decision.agenda_point) 
        : null;
      const meeting = agendaPoint?.meeting 
        ? (Array.isArray(agendaPoint.meeting) ? agendaPoint.meeting[0] : agendaPoint.meeting) 
        : null;

      return {
        'Descrição': String(action.description || ''),
        'Responsável': String(action.responsible_name || 'Sem responsável'),
        'Departamento': String(pelouro?.name || 'Sem departamento'),
        'Estado': String(action.status || ''),
        'Criticidade': String(action.criticality || ''),
        'Progresso (%)': Number(action.progress || 0),
        'Data Início': formatDate(String(action.start_date || '')),
        'Prazo': formatDate(String(action.deadline || '')),
        'Decisão': String(decision?.text?.substring(0, 100) || '').replace(/[\n\r]/g, ' '),
        'Ponto de Agenda': String(agendaPoint?.title || ''),
        'Reunião': meeting 
          ? `${meeting.type} - ${formatDate(String(meeting.date || ''))}`
          : '',
      };
    };

    // Create ZIP file
    const zip = new SimpleZip();

    // Create main XLS with all actions
    const allData = actions.map(actionToRow);
    const allXml = createExcelXML(allData, 'Todas as Ações');
    zip.addFile('Todas_Acoes.xls', allXml);

    console.log('Created main XLS file');

    // Group actions by department
    const actionsByDepartment = new Map<string, Record<string, unknown>[]>();
    
    for (const action of actions) {
      const pelouro = Array.isArray(action.pelouro) ? action.pelouro[0] : action.pelouro;
      const deptName = pelouro?.name || 'Sem_Departamento';
      if (!actionsByDepartment.has(deptName)) {
        actionsByDepartment.set(deptName, []);
      }
      actionsByDepartment.get(deptName)!.push(action);
    }

    console.log(`Found ${actionsByDepartment.size} departments`);

    // Create XLS for each department
    for (const [deptName, deptActions] of actionsByDepartment) {
      const deptData = deptActions.map(actionToRow);
      const deptXml = createExcelXML(deptData, 'Ações');
      
      // Sanitize filename
      const safeFileName = deptName
        .replace(/[^a-zA-Z0-9áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s_-]/g, '_')
        .replace(/\s+/g, '_');
      zip.addFile(`${safeFileName}.xls`, deptXml);
      
      console.log(`Created XLS for department: ${deptName}`);
    }

    // Generate ZIP
    const zipContent = await zip.generate();
    
    console.log('ZIP file generated successfully');

    return new Response(zipContent.buffer as ArrayBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="acoes_followup_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error exporting actions:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao exportar ações' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
