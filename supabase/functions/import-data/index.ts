import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Table schemas for validation and mapping
const tableSchemas: Record<string, {
  columns: Record<string, { type: string; required: boolean; }>;
  primaryKey: string;
  conflictColumn?: string;
}> = {
  administrators: {
    columns: {
      id: { type: 'uuid', required: false },
      name: { type: 'text', required: true },
      email: { type: 'text', required: true },
      avatar_url: { type: 'text', required: false },
    },
    primaryKey: 'id',
    conflictColumn: 'email',
  },
  pelouros: {
    columns: {
      id: { type: 'uuid', required: false },
      name: { type: 'text', required: true },
      description: { type: 'text', required: false },
    },
    primaryKey: 'id',
    conflictColumn: 'name',
  },
  meetings: {
    columns: {
      id: { type: 'uuid', required: false },
      date: { type: 'timestamp', required: true },
      type: { type: 'text', required: true },
      location: { type: 'text', required: true },
      status: { type: 'text', required: false },
      reference_id: { type: 'text', required: false },
    },
    primaryKey: 'id',
  },
  agenda_points: {
    columns: {
      id: { type: 'uuid', required: false },
      meeting_id: { type: 'uuid', required: true },
      title: { type: 'text', required: true },
      subject: { type: 'text', required: true },
      description: { type: 'text', required: false },
      background: { type: 'text', required: false },
      point_type: { type: 'text', required: false },
      priority: { type: 'text', required: false },
      status: { type: 'text', required: false },
      order: { type: 'integer', required: false },
      is_confidential: { type: 'boolean', required: false },
    },
    primaryKey: 'id',
  },
  decisions: {
    columns: {
      id: { type: 'uuid', required: false },
      agenda_point_id: { type: 'uuid', required: true },
      text: { type: 'text', required: true },
      type: { type: 'text', required: false },
      criticality: { type: 'text', required: false },
      vote_mode: { type: 'text', required: false },
      votes_for: { type: 'integer', required: false },
      votes_against: { type: 'integer', required: false },
      abstentions: { type: 'integer', required: false },
      background: { type: 'text', required: false },
      deliberation: { type: 'text', required: false },
      has_followup: { type: 'boolean', required: false },
    },
    primaryKey: 'id',
  },
  actions: {
    columns: {
      id: { type: 'uuid', required: false },
      decision_id: { type: 'uuid', required: true },
      description: { type: 'text', required: true },
      responsible_name: { type: 'text', required: false },
      start_date: { type: 'timestamp', required: false },
      deadline: { type: 'timestamp', required: true },
      status: { type: 'text', required: false },
      progress: { type: 'integer', required: false },
      criticality: { type: 'text', required: false },
    },
    primaryKey: 'id',
  },
  protocols: {
    columns: {
      id: { type: 'uuid', required: false },
      nome: { type: 'text', required: true },
      tema: { type: 'text', required: false },
      objeto: { type: 'text', required: false },
      versao: { type: 'text', required: false },
      decisor: { type: 'text', required: false },
      data_aprovacao: { type: 'date', required: false },
      data_celebracao: { type: 'date', required: false },
      data_producao_efeitos: { type: 'date', required: false },
      data_termo: { type: 'date', required: false },
      renovacao_automatica: { type: 'boolean', required: false },
      em_vigor: { type: 'boolean', required: false },
      divulgacao_existencia: { type: 'boolean', required: false },
      divulgacao_conteudo: { type: 'boolean', required: false },
      tipo_ambito: { type: 'text', required: false },
      alteracoes: { type: 'text', required: false },
      observacoes: { type: 'text', required: false },
      id_doc_plus: { type: 'text', required: false },
      link_doc_plus: { type: 'text', required: false },
    },
    primaryKey: 'id',
  },
  grupos_trabalho: {
    columns: {
      id: { type: 'uuid', required: false },
      codigo: { type: 'text', required: true },
      designacao: { type: 'text', required: true },
      tema: { type: 'text', required: false },
      status: { type: 'text', required: false },
      divulgar_existencia: { type: 'boolean', required: false },
      observacoes_secap: { type: 'text', required: false },
    },
    primaryKey: 'id',
  },
  entregaveis: {
    columns: {
      id: { type: 'uuid', required: false },
      grupo_trabalho_id: { type: 'uuid', required: true },
      descricao: { type: 'text', required: true },
      codigo: { type: 'text', required: false },
      status: { type: 'text', required: false },
      data_entregavel: { type: 'timestamp', required: false },
      divulgar_entregavel: { type: 'boolean', required: false },
      ponto_situacao: { type: 'text', required: false },
      notas_secap: { type: 'text', required: false },
      decisor: { type: 'text', required: false },
      num_doc_plus: { type: 'text', required: false },
      link_doc: { type: 'text', required: false },
      criacao: { type: 'boolean', required: false },
      encerramento: { type: 'boolean', required: false },
    },
    primaryKey: 'id',
  },
};

function validateRow(row: Record<string, unknown>, schema: typeof tableSchemas[string], rowIndex: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [colName, colDef] of Object.entries(schema.columns)) {
    const value = row[colName];
    
    // Check required fields
    if (colDef.required && (value === undefined || value === null || value === '')) {
      errors.push(`Linha ${rowIndex + 1}: Campo obrigatório "${colName}" está vazio`);
    }
    
    // Type validation
    if (value !== undefined && value !== null && value !== '') {
      switch (colDef.type) {
        case 'uuid':
          if (typeof value === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            errors.push(`Linha ${rowIndex + 1}: Campo "${colName}" deve ser um UUID válido`);
          }
          break;
        case 'integer':
          if (isNaN(Number(value))) {
            errors.push(`Linha ${rowIndex + 1}: Campo "${colName}" deve ser um número inteiro`);
          }
          break;
        case 'boolean':
          const boolStr = String(value).toLowerCase();
          if (!['true', 'false', '1', '0', 'sim', 'não', 'nao', 'yes', 'no'].includes(boolStr)) {
            errors.push(`Linha ${rowIndex + 1}: Campo "${colName}" deve ser verdadeiro/falso`);
          }
          break;
        case 'timestamp':
        case 'date':
          if (typeof value === 'string' && isNaN(Date.parse(value))) {
            errors.push(`Linha ${rowIndex + 1}: Campo "${colName}" deve ser uma data válida`);
          }
          break;
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function transformValue(value: unknown, type: string): unknown {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  switch (type) {
    case 'integer':
      return parseInt(String(value), 10);
    case 'boolean':
      const boolStr = String(value).toLowerCase();
      return ['true', '1', 'sim', 'yes'].includes(boolStr);
    case 'timestamp':
    case 'date':
      return new Date(String(value)).toISOString();
    default:
      return value;
  }
}

function transformRow(row: Record<string, unknown>, schema: typeof tableSchemas[string]): Record<string, unknown> {
  const transformed: Record<string, unknown> = {};
  
  for (const [colName, colDef] of Object.entries(schema.columns)) {
    if (row[colName] !== undefined) {
      transformed[colName] = transformValue(row[colName], colDef.type);
    }
  }
  
  return transformed;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify user and get their role
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or sec role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!roleData || !['admin', 'sec'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas Admin e SEC podem importar dados.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, tableName, data, fileName, importId, columnMapping } = body;

    console.log(`Import action: ${action}, table: ${tableName}, rows: ${data?.length || 0}`);

    // Get available tables
    if (action === 'get-tables') {
      return new Response(
        JSON.stringify({ 
          tables: Object.keys(tableSchemas).map(name => ({
            name,
            columns: Object.entries(tableSchemas[name].columns).map(([colName, colDef]) => ({
              name: colName,
              type: colDef.type,
              required: colDef.required,
            })),
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get template for a specific table
    if (action === 'get-template') {
      const schema = tableSchemas[tableName];
      if (!schema) {
        return new Response(
          JSON.stringify({ error: `Tabela "${tableName}" não suportada` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const template = {
        columns: Object.entries(schema.columns).map(([name, def]) => ({
          name,
          type: def.type,
          required: def.required,
        })),
        sampleRow: Object.fromEntries(
          Object.entries(schema.columns).map(([name, def]) => {
            switch (def.type) {
              case 'uuid': return [name, name === 'id' ? '' : '00000000-0000-0000-0000-000000000000'];
              case 'text': return [name, `Exemplo ${name}`];
              case 'integer': return [name, '0'];
              case 'boolean': return [name, 'false'];
              case 'timestamp': return [name, new Date().toISOString()];
              case 'date': return [name, new Date().toISOString().split('T')[0]];
              default: return [name, ''];
            }
          })
        ),
      };

      return new Response(
        JSON.stringify({ template }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate data before import
    if (action === 'validate') {
      const schema = tableSchemas[tableName];
      if (!schema) {
        return new Response(
          JSON.stringify({ error: `Tabela "${tableName}" não suportada` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Apply column mapping if provided
      let mappedData = data;
      if (columnMapping && Object.keys(columnMapping).length > 0) {
        mappedData = data.map((row: Record<string, unknown>) => {
          const mappedRow: Record<string, unknown> = {};
          for (const [fileCol, dbCol] of Object.entries(columnMapping)) {
            if (dbCol && row[fileCol] !== undefined) {
              mappedRow[dbCol as string] = row[fileCol];
            }
          }
          return mappedRow;
        });
      }

      const allErrors: string[] = [];
      const validRows: Record<string, unknown>[] = [];

      for (let i = 0; i < mappedData.length; i++) {
        const { valid, errors } = validateRow(mappedData[i], schema, i);
        if (valid) {
          validRows.push(transformRow(mappedData[i], schema));
        } else {
          allErrors.push(...errors);
        }
      }

      return new Response(
        JSON.stringify({ 
          valid: allErrors.length === 0,
          totalRows: data.length,
          validRows: validRows.length,
          errorCount: allErrors.length,
          errors: allErrors.slice(0, 50), // Limit errors to prevent huge responses
          previewData: validRows.slice(0, 10),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute import
    if (action === 'import') {
      const schema = tableSchemas[tableName];
      if (!schema) {
        return new Response(
          JSON.stringify({ error: `Tabela "${tableName}" não suportada` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Apply column mapping if provided
      let mappedData = data;
      if (columnMapping && Object.keys(columnMapping).length > 0) {
        mappedData = data.map((row: Record<string, unknown>) => {
          const mappedRow: Record<string, unknown> = {};
          for (const [fileCol, dbCol] of Object.entries(columnMapping)) {
            if (dbCol && row[fileCol] !== undefined) {
              mappedRow[dbCol as string] = row[fileCol];
            }
          }
          return mappedRow;
        });
      }

      // Create import history record
      const { data: historyRecord, error: historyError } = await supabaseAdmin
        .from('import_history')
        .insert({
          user_id: user.id,
          table_name: tableName,
          file_name: fileName || 'import.csv',
          total_rows: mappedData.length,
          status: 'processing',
        })
        .select()
        .single();

      if (historyError) {
        console.error('Error creating history record:', historyError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar registo de histórico' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const importedIds: string[] = [];
      const errors: string[] = [];
      let successCount = 0;

      // Process rows in batches
      const batchSize = 50;
      for (let i = 0; i < mappedData.length; i += batchSize) {
        const batch = mappedData.slice(i, i + batchSize);
        const transformedBatch = batch.map((row: Record<string, unknown>, idx: number) => {
          const { valid, errors: rowErrors } = validateRow(row, schema, i + idx);
          if (!valid) {
            errors.push(...rowErrors);
            return null;
          }
          return transformRow(row, schema);
        }).filter(Boolean);

        if (transformedBatch.length > 0) {
          let query;
          if (schema.conflictColumn) {
            // Use upsert for tables with conflict column
            query = supabaseAdmin
              .from(tableName)
              .upsert(transformedBatch, { onConflict: schema.conflictColumn })
              .select('id');
          } else {
            // Regular insert
            query = supabaseAdmin
              .from(tableName)
              .insert(transformedBatch)
              .select('id');
          }

          const { data: insertedRows, error: insertError } = await query;

          if (insertError) {
            console.error(`Batch insert error:`, insertError);
            errors.push(`Erro ao inserir lote ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
          } else if (insertedRows) {
            successCount += insertedRows.length;
            importedIds.push(...insertedRows.map(r => r.id));
          }
        }
      }

      // Update history record
      const finalStatus = errors.length === 0 ? 'completed' : (successCount > 0 ? 'completed' : 'failed');
      
      await supabaseAdmin
        .from('import_history')
        .update({
          success_count: successCount,
          error_count: errors.length,
          status: finalStatus,
          errors: errors.slice(0, 100),
          imported_ids: importedIds,
          completed_at: new Date().toISOString(),
        })
        .eq('id', historyRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          importId: historyRecord.id,
          totalRows: mappedData.length,
          successCount,
          errorCount: errors.length,
          errors: errors.slice(0, 50),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rollback import
    if (action === 'rollback') {
      if (!importId) {
        return new Response(
          JSON.stringify({ error: 'ID de importação não fornecido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get import history record
      const { data: historyRecord, error: fetchError } = await supabaseAdmin
        .from('import_history')
        .select('*')
        .eq('id', importId)
        .single();

      if (fetchError || !historyRecord) {
        return new Response(
          JSON.stringify({ error: 'Registo de importação não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const importedIds = historyRecord.imported_ids as string[];
      if (!importedIds || importedIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum registo para reverter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete imported rows
      const { error: deleteError } = await supabaseAdmin
        .from(historyRecord.table_name)
        .delete()
        .in('id', importedIds);

      if (deleteError) {
        console.error('Rollback error:', deleteError);
        return new Response(
          JSON.stringify({ error: `Erro ao reverter: ${deleteError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update history record
      await supabaseAdmin
        .from('import_history')
        .update({
          status: 'rolled_back',
          rolled_back_at: new Date().toISOString(),
        })
        .eq('id', importId);

      return new Response(
        JSON.stringify({ 
          success: true,
          rolledBackCount: importedIds.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get import history
    if (action === 'history') {
      const { data: history, error: historyError } = await supabaseAdmin
        .from('import_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) {
        return new Response(
          JSON.stringify({ error: 'Erro ao obter histórico' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ history }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
