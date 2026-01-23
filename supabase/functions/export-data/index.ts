import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple XLS generation using Microsoft SpreadsheetML (Excel 2003 XML)
function createExcelXML(sheets: { name: string; data: Record<string, unknown>[] }[]): string {
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
  <Style ss:ID="Date">
   <NumberFormat ss:Format="yyyy-mm-dd hh:mm:ss"/>
  </Style>
 </Styles>`;

  for (const sheet of sheets) {
    const headers = sheet.data.length > 0 ? Object.keys(sheet.data[0]) : [];
    const safeSheetName = sanitizeSheetName(sheet.name);
    const expandedRowCount = sheet.data.length + 1;
    const expandedColumnCount = Math.max(headers.length, 1);

    xml += `
 <Worksheet ss:Name="${escapeXml(safeSheetName)}">
  <Table ss:ExpandedColumnCount="${expandedColumnCount}" ss:ExpandedRowCount="${expandedRowCount}" x:FullColumns="1" x:FullRows="1">`;

    // Add header row
    xml += '<Row ss:StyleID="Header">';
    for (const header of headers) {
      xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
    }
    xml += '</Row>';

    // Add data rows
    for (const row of sheet.data) {
      xml += '<Row>';
      for (const header of headers) {
        const value = row[header];
        const type = typeof value === 'number' ? 'Number' : 'String';
        xml += `<Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>`;
      }
      xml += '</Row>';
    }

    xml += '</Table></Worksheet>';
  }

  xml += '</Workbook>';
  return xml;
}

function sanitizeSheetName(name: string): string {
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return dateStr;
  }
}

function formatBoolean(val: boolean | null): string {
  if (val === null) return '';
  return val ? 'Sim' : 'Não';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[export-data] Starting export request');

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[export-data] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[export-data] User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[export-data] User verified:', user.id);

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = roleData?.role;
    if (!userRole || !['admin', 'sec', 'gestao'].includes(userRole)) {
      console.error('[export-data] User does not have permission:', userRole);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[export-data] User role:', userRole);

    // Fetch all data for export
    const sheets: { name: string; data: Record<string, unknown>[] }[] = [];

    // 1. Meetings
    console.log('[export-data] Fetching meetings...');
    const { data: meetings } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false });

    if (meetings && meetings.length > 0) {
      sheets.push({
        name: 'Reunioes',
        data: meetings.map(m => ({
          'ID': m.id,
          'Referência': m.reference_id || '',
          'Tipo': m.type,
          'Data': formatDate(m.date),
          'Local': m.location,
          'Estado': m.status,
          'Nº Pontos Agenda': m.agenda_points_count,
          'Criado em': formatDate(m.created_at),
          'Atualizado em': formatDate(m.updated_at),
        }))
      });
    }

    // 2. Agenda Points with related data
    console.log('[export-data] Fetching agenda points...');
    const { data: agendaPoints } = await supabase
      .from('agenda_points')
      .select(`
        *,
        meeting:meetings(date, type, reference_id),
        proposer:administrators(name)
      `)
      .order('created_at', { ascending: false });

    if (agendaPoints && agendaPoints.length > 0) {
      sheets.push({
        name: 'Pontos de Agenda',
        data: agendaPoints.map(ap => ({
          'ID': ap.id,
          'Título': ap.title,
          'Assunto': ap.subject,
          'Descrição': ap.description || '',
          'Enquadramento': ap.background || '',
          'Tipo de Ponto': ap.point_type,
          'Prioridade': ap.priority,
          'Estado': ap.status,
          'Ordem': ap.order,
          'Confidencial': formatBoolean(ap.is_confidential),
          'Reunião ID': ap.meeting_id,
          'Reunião Tipo': (ap.meeting as any)?.type || '',
          'Reunião Data': formatDate((ap.meeting as any)?.date),
          'Reunião Ref': (ap.meeting as any)?.reference_id || '',
          'Proponente': (ap.proposer as any)?.name || '',
          'Criado em': formatDate(ap.created_at),
          'Atualizado em': formatDate(ap.updated_at),
        }))
      });
    }

    // 3. Decisions with related data
    console.log('[export-data] Fetching decisions...');
    const { data: decisions } = await supabase
      .from('decisions')
      .select(`
        *,
        agenda_point:agenda_points(
          title,
          subject,
          meeting:meetings(date, type, reference_id)
        )
      `)
      .order('date', { ascending: false });

    if (decisions && decisions.length > 0) {
      sheets.push({
        name: 'Decisoes',
        data: decisions.map(d => ({
          'ID': d.id,
          'Texto': d.text,
          'Tipo': d.type,
          'Criticidade': d.criticality,
          'Data': formatDate(d.date),
          'Modo Votação': d.vote_mode,
          'Votos a Favor': d.votes_for ?? '',
          'Votos Contra': d.votes_against ?? '',
          'Abstenções': d.abstentions ?? '',
          'Enquadramento': d.background || '',
          'Deliberação': d.deliberation || '',
          'Tem Followup': formatBoolean(d.has_followup),
          'Ponto Agenda ID': d.agenda_point_id,
          'Ponto Agenda Título': (d.agenda_point as any)?.title || '',
          'Ponto Agenda Assunto': (d.agenda_point as any)?.subject || '',
          'Reunião Tipo': (d.agenda_point as any)?.meeting?.type || '',
          'Reunião Data': formatDate((d.agenda_point as any)?.meeting?.date),
          'Reunião Ref': (d.agenda_point as any)?.meeting?.reference_id || '',
          'Criado em': formatDate(d.created_at),
          'Atualizado em': formatDate(d.updated_at),
        }))
      });
    }

    // 4. Actions with related data
    console.log('[export-data] Fetching actions...');
    const { data: actions } = await supabase
      .from('actions')
      .select(`
        *,
        pelouro:pelouros(name),
        decision:decisions(
          text,
          agenda_point:agenda_points(
            title,
            meeting:meetings(date, type, reference_id)
          )
        )
      `)
      .order('deadline', { ascending: true });

    if (actions && actions.length > 0) {
      sheets.push({
        name: 'Acoes',
        data: actions.map(a => ({
          'ID': a.id,
          'Descrição': a.description,
          'Responsável': a.responsible_name || '',
          'Departamento': (a.pelouro as any)?.name || '',
          'Data Início': formatDate(a.start_date),
          'Prazo': formatDate(a.deadline),
          'Estado': a.status,
          'Progresso (%)': a.progress,
          'Criticidade': a.criticality,
          'Decisão ID': a.decision_id,
          'Decisão Texto': (a.decision as any)?.text || '',
          'Ponto Agenda Título': (a.decision as any)?.agenda_point?.title || '',
          'Reunião Tipo': (a.decision as any)?.agenda_point?.meeting?.type || '',
          'Reunião Data': formatDate((a.decision as any)?.agenda_point?.meeting?.date),
          'Reunião Ref': (a.decision as any)?.agenda_point?.meeting?.reference_id || '',
          'Criado em': formatDate(a.created_at),
          'Atualizado em': formatDate(a.updated_at),
        }))
      });
    }

    // 5. Administrators
    console.log('[export-data] Fetching administrators...');
    const { data: administrators } = await supabase
      .from('administrators')
      .select(`
        *,
        administrator_pelouros(pelouro:pelouros(name))
      `)
      .order('name');

    if (administrators && administrators.length > 0) {
      sheets.push({
        name: 'Administradores',
        data: administrators.map(a => ({
          'ID': a.id,
          'Nome': a.name,
          'Email': a.email,
          'Departamentos': (a.administrator_pelouros as any[])?.map((ap: any) => ap.pelouro?.name).filter(Boolean).join(', ') || '',
          'Criado em': formatDate(a.created_at),
          'Atualizado em': formatDate(a.updated_at),
        }))
      });
    }

    // 6. Pelouros (Departments)
    console.log('[export-data] Fetching pelouros...');
    const { data: pelouros } = await supabase
      .from('pelouros')
      .select('*')
      .order('name');

    if (pelouros && pelouros.length > 0) {
      sheets.push({
        name: 'Departamentos',
        data: pelouros.map(p => ({
          'ID': p.id,
          'Nome': p.name,
          'Descrição': p.description || '',
          'Criado em': formatDate(p.created_at),
        }))
      });
    }

    // 7. Protocols
    console.log('[export-data] Fetching protocols...');
    const { data: protocols } = await supabase
      .from('protocols')
      .select(`
        *,
        departamento:pelouros(name),
        meeting:meetings(date, type, reference_id),
        agenda_point:agenda_points(title),
        decision:decisions(text)
      `)
      .order('created_at', { ascending: false });

    if (protocols && protocols.length > 0) {
      sheets.push({
        name: 'Protocolos',
        data: protocols.map(p => ({
          'ID': p.id,
          'Nome': p.nome,
          'Tema': p.tema || '',
          'Objeto': p.objeto || '',
          'Tipo/Âmbito': p.tipo_ambito || '',
          'Versão': p.versao || '',
          'Decisor': p.decisor || '',
          'Em Vigor': formatBoolean(p.em_vigor),
          'Renovação Automática': formatBoolean(p.renovacao_automatica),
          'Data Aprovação': p.data_aprovacao || '',
          'Data Celebração': p.data_celebracao || '',
          'Data Produção Efeitos': p.data_producao_efeitos || '',
          'Data Termo': p.data_termo || '',
          'Divulgação Existência': formatBoolean(p.divulgacao_existencia),
          'Divulgação Conteúdo': formatBoolean(p.divulgacao_conteudo),
          'ID DOC+': p.id_doc_plus || '',
          'Link DOC+': p.link_doc_plus || '',
          'Departamento Responsável': (p.departamento as any)?.name || '',
          'Observações': p.observacoes || '',
          'Alterações': p.alteracoes || '',
          'Reunião Tipo': (p.meeting as any)?.type || '',
          'Reunião Data': formatDate((p.meeting as any)?.date),
          'Reunião Ref': (p.meeting as any)?.reference_id || '',
          'Ponto Agenda': (p.agenda_point as any)?.title || '',
          'Decisão': (p.decision as any)?.text || '',
          'Criado em': formatDate(p.created_at),
          'Atualizado em': formatDate(p.updated_at),
        }))
      });
    }

    // 8. Work Groups
    console.log('[export-data] Fetching work groups...');
    const { data: gruposTrabalho } = await supabase
      .from('grupos_trabalho')
      .select(`
        *,
        criacao_meeting:meetings!grupos_trabalho_criacao_meeting_id_fkey(date, type, reference_id),
        criacao_agenda_point:agenda_points!grupos_trabalho_criacao_agenda_point_id_fkey(title),
        criacao_decision:decisions!grupos_trabalho_criacao_decision_id_fkey(text),
        fecho_meeting:meetings!grupos_trabalho_fecho_meeting_id_fkey(date, type, reference_id),
        fecho_agenda_point:agenda_points!grupos_trabalho_fecho_agenda_point_id_fkey(title),
        fecho_decision:decisions!grupos_trabalho_fecho_decision_id_fkey(text)
      `)
      .order('created_at', { ascending: false });

    if (gruposTrabalho && gruposTrabalho.length > 0) {
      sheets.push({
        name: 'Grupos de Trabalho',
        data: gruposTrabalho.map(g => ({
          'ID': g.id,
          'Código': g.codigo,
          'Designação': g.designacao,
          'Tema': g.tema || '',
          'Estado': g.status,
          'Divulgar Existência': formatBoolean(g.divulgar_existencia),
          'Observações SECAP': g.observacoes_secap || '',
          'Criação - Reunião Tipo': (g.criacao_meeting as any)?.type || '',
          'Criação - Reunião Data': formatDate((g.criacao_meeting as any)?.date),
          'Criação - Reunião Ref': (g.criacao_meeting as any)?.reference_id || '',
          'Criação - Ponto Agenda': (g.criacao_agenda_point as any)?.title || '',
          'Criação - Decisão': (g.criacao_decision as any)?.text || '',
          'Fecho - Reunião Tipo': (g.fecho_meeting as any)?.type || '',
          'Fecho - Reunião Data': formatDate((g.fecho_meeting as any)?.date),
          'Fecho - Reunião Ref': (g.fecho_meeting as any)?.reference_id || '',
          'Fecho - Ponto Agenda': (g.fecho_agenda_point as any)?.title || '',
          'Fecho - Decisão': (g.fecho_decision as any)?.text || '',
          'Criado em': formatDate(g.created_at),
          'Atualizado em': formatDate(g.updated_at),
        }))
      });
    }

    // 9. Deliverables (Entregáveis)
    console.log('[export-data] Fetching deliverables...');
    const { data: entregaveis } = await supabase
      .from('entregaveis')
      .select(`
        *,
        grupo_trabalho:grupos_trabalho(codigo, designacao)
      `)
      .order('created_at', { ascending: false });

    if (entregaveis && entregaveis.length > 0) {
      sheets.push({
        name: 'Entregaveis',
        data: entregaveis.map(e => ({
          'ID': e.id,
          'Código': e.codigo || '',
          'Descrição': e.descricao,
          'Estado': e.status,
          'Data Entregável': formatDate(e.data_entregavel),
          'Ponto de Situação': e.ponto_situacao || '',
          'Decisor': e.decisor || '',
          'Nº DOC+': e.num_doc_plus || '',
          'Link DOC': e.link_doc || '',
          'Criação': formatBoolean(e.criacao),
          'Encerramento': formatBoolean(e.encerramento),
          'Divulgar': formatBoolean(e.divulgar_entregavel),
          'Notas SECAP': e.notas_secap || '',
          'Grupo Trabalho Código': (e.grupo_trabalho as any)?.codigo || '',
          'Grupo Trabalho Designação': (e.grupo_trabalho as any)?.designacao || '',
          'Criado em': formatDate(e.created_at),
          'Atualizado em': formatDate(e.updated_at),
        }))
      });
    }

    // 10. User Roles
    console.log('[export-data] Fetching user roles...');
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        *,
        profile:profiles!inner(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (userRoles && userRoles.length > 0) {
      sheets.push({
        name: 'Utilizadores',
        data: userRoles.map(ur => ({
          'ID': ur.id,
          'User ID': ur.user_id,
          'Nome': (ur.profile as any)?.full_name || '',
          'Email': (ur.profile as any)?.email || '',
          'Role': ur.role,
          'Criado em': formatDate(ur.created_at),
        }))
      });
    }

    // 11. Meeting Participants
    console.log('[export-data] Fetching meeting participants...');
    const { data: participants } = await supabase
      .from('meeting_participants')
      .select(`
        *,
        meeting:meetings(date, type, reference_id),
        administrator:administrators(name, email)
      `)
      .order('created_at', { ascending: false });

    if (participants && participants.length > 0) {
      sheets.push({
        name: 'Participantes Reunioes',
        data: participants.map(p => ({
          'ID': p.id,
          'Reunião ID': p.meeting_id,
          'Reunião Tipo': (p.meeting as any)?.type || '',
          'Reunião Data': formatDate((p.meeting as any)?.date),
          'Reunião Ref': (p.meeting as any)?.reference_id || '',
          'Administrador': (p.administrator as any)?.name || '',
          'Email': (p.administrator as any)?.email || '',
          'Observador': formatBoolean(p.is_observer),
          'Criado em': formatDate(p.created_at),
        }))
      });
    }

    console.log('[export-data] Generating Excel file with', sheets.length, 'sheets');

    // Generate Excel XML
    const excelContent = createExcelXML(sheets);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `export_dados_${timestamp}.xls`;

    console.log('[export-data] Export complete:', filename);

    return new Response(excelContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[export-data] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
