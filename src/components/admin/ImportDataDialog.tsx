import { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  Table as TableIcon,
  Columns,
  Eye,
  Play,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useImportData, TableSchema, ValidationResult } from '@/hooks/useImportData';
import { cn } from '@/lib/utils';

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

const tableLabels: Record<string, string> = {
  administrators: 'Administradores',
  pelouros: 'Departamentos',
  meetings: 'Reuniões',
  agenda_points: 'Pontos de Agenda',
  decisions: 'Decisões',
  actions: 'Ações',
  protocols: 'Protocolos',
  grupos_trabalho: 'Grupos de Trabalho',
  entregaveis: 'Entregáveis',
};

export function ImportDataDialog({ open, onOpenChange }: ImportDataDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; importId: string } | null>(null);

  const { 
    isLoading, 
    tables, 
    fetchTables, 
    getTemplate, 
    validateData, 
    importData 
  } = useImportData();

  useEffect(() => {
    if (open) {
      fetchTables();
      resetState();
    }
  }, [open]);

  const resetState = () => {
    setStep('upload');
    setSelectedTable('');
    setFile(null);
    setParsedData([]);
    setFileColumns([]);
    setColumnMapping({});
    setValidationResult(null);
    setImportProgress(0);
    setImportResult(null);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileName = selectedFile.name.toLowerCase();

    try {
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel file
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, unknown>[];
        
        if (jsonData.length > 0) {
          setParsedData(jsonData);
          setFileColumns(Object.keys(jsonData[0]));
        }
      } else if (fileName.endsWith('.csv')) {
        // Parse CSV file
        const text = await selectedFile.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = result.data as Record<string, unknown>[];
            if (data.length > 0) {
              setParsedData(data);
              setFileColumns(Object.keys(data[0]));
            }
          },
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  }, []);

  const handleDownloadTemplate = async () => {
    if (!selectedTable) return;

    const template = await getTemplate(selectedTable);
    if (!template) return;

    // Create workbook with sample data
    const ws = XLSX.utils.json_to_sheet([template.sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedTable);

    // Add column info as second sheet
    const infoData = template.columns.map((col: { name: string; type: string; required: boolean }) => ({
      'Coluna': col.name,
      'Tipo': col.type,
      'Obrigatório': col.required ? 'Sim' : 'Não',
    }));
    const wsInfo = XLSX.utils.json_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Info Colunas');

    XLSX.writeFile(wb, `template_${selectedTable}.xlsx`);
  };

  const autoMapColumns = useCallback(() => {
    if (!selectedTable || !tables.length || !fileColumns.length) return;

    const tableSchema = tables.find(t => t.name === selectedTable);
    if (!tableSchema) return;

    const mapping: Record<string, string> = {};
    
    for (const fileCol of fileColumns) {
      const normalizedFileCol = fileCol.toLowerCase().trim().replace(/[_\s-]/g, '');
      
      // Try exact match first
      const exactMatch = tableSchema.columns.find(
        c => c.name.toLowerCase() === fileCol.toLowerCase()
      );
      
      if (exactMatch) {
        mapping[fileCol] = exactMatch.name;
        continue;
      }

      // Try normalized match
      const normalizedMatch = tableSchema.columns.find(
        c => c.name.toLowerCase().replace(/[_\s-]/g, '') === normalizedFileCol
      );
      
      if (normalizedMatch) {
        mapping[fileCol] = normalizedMatch.name;
      }
    }

    setColumnMapping(mapping);
  }, [selectedTable, tables, fileColumns]);

  useEffect(() => {
    if (step === 'mapping') {
      autoMapColumns();
    }
  }, [step, autoMapColumns]);

  const handleValidate = async () => {
    if (!selectedTable || parsedData.length === 0) return;

    const result = await validateData(selectedTable, parsedData, columnMapping);
    if (result) {
      setValidationResult(result);
      setStep('preview');
    }
  };

  const handleImport = async () => {
    if (!selectedTable || parsedData.length === 0 || !file) return;

    setStep('importing');
    setImportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    const result = await importData(selectedTable, parsedData, file.name, columnMapping);
    
    clearInterval(progressInterval);
    setImportProgress(100);

    if (result) {
      setImportResult({
        successCount: result.successCount,
        errorCount: result.errorCount,
        importId: result.importId,
      });
      setStep('complete');
    } else {
      setStep('preview');
    }
  };

  const selectedTableSchema = tables.find(t => t.name === selectedTable);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Dados
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
          {[
            { key: 'upload', label: 'Upload', icon: Upload },
            { key: 'mapping', label: 'Mapeamento', icon: Columns },
            { key: 'preview', label: 'Preview', icon: Eye },
            { key: 'importing', label: 'Importar', icon: Play },
            { key: 'complete', label: 'Concluído', icon: CheckCircle2 },
          ].map((s, idx) => (
            <div key={s.key} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                step === s.key ? "bg-primary text-primary-foreground" : 
                  ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > idx
                    ? "text-primary"
                    : "text-muted-foreground"
              )}>
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < 4 && <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 px-1">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Selecionar Tabela</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a tabela de destino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.name} value={table.name}>
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-4 h-4" />
                          {tableLabels[table.name] || table.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTable && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadTemplate}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Template XLSX
                  </Button>

                  <div className="space-y-2">
                    <Label>Upload Ficheiro</Label>
                    <div className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {file ? (
                          <div className="space-y-2">
                            <FileSpreadsheet className="w-12 h-12 mx-auto text-primary" />
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {parsedData.length} linhas encontradas
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">
                              Arraste um ficheiro ou clique para selecionar
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Formatos suportados: XLSX, XLS, CSV
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && selectedTableSchema && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mapeie as colunas do ficheiro para as colunas da tabela
                </p>
                <Button variant="outline" size="sm" onClick={autoMapColumns}>
                  Auto-mapear
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coluna no Ficheiro</TableHead>
                    <TableHead>Coluna na Base de Dados</TableHead>
                    <TableHead>Obrigatório</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fileColumns.map(fileCol => (
                    <TableRow key={fileCol}>
                      <TableCell className="font-medium">{fileCol}</TableCell>
                      <TableCell>
                        <Select
                          value={columnMapping[fileCol] || ''}
                          onValueChange={(value) => 
                            setColumnMapping(prev => ({ ...prev, [fileCol]: value }))
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Ignorar coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Ignorar</SelectItem>
                            {selectedTableSchema.columns.map(col => (
                              <SelectItem key={col.name} value={col.name}>
                                {col.name} ({col.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {columnMapping[fileCol] && (
                          <Badge variant={
                            selectedTableSchema.columns.find(c => c.name === columnMapping[fileCol])?.required
                              ? 'default'
                              : 'secondary'
                          }>
                            {selectedTableSchema.columns.find(c => c.name === columnMapping[fileCol])?.required
                              ? 'Sim'
                              : 'Não'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Unmapped required columns warning */}
              {selectedTableSchema.columns.filter(c => 
                c.required && !Object.values(columnMapping).includes(c.name)
              ).length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-status-warning/10 text-status-warning rounded-lg">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Colunas obrigatórias não mapeadas:</p>
                    <p className="text-sm">
                      {selectedTableSchema.columns
                        .filter(c => c.required && !Object.values(columnMapping).includes(c.name))
                        .map(c => c.name)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && validationResult && (
            <div className="space-y-4 py-4">
              {/* Validation Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{validationResult.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total de linhas</p>
                </div>
                <div className="p-4 bg-status-success/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-status-success">{validationResult.validRows}</p>
                  <p className="text-sm text-muted-foreground">Linhas válidas</p>
                </div>
                <div className="p-4 bg-status-critical/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-status-critical">{validationResult.errorCount}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>

              {/* Errors List */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-status-critical">Erros de Validação</Label>
                  <ScrollArea className="h-32 border rounded-lg p-3">
                    <ul className="space-y-1 text-sm">
                      {validationResult.errors.map((error, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-status-critical">
                          <X className="w-4 h-4 shrink-0 mt-0.5" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {/* Preview Data */}
              {validationResult.previewData.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview dos Dados (primeiras 10 linhas)</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(validationResult.previewData[0]).map(col => (
                              <TableHead key={col}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.previewData.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.values(row).map((val, colIdx) => (
                                <TableCell key={colIdx} className="max-w-[200px] truncate">
                                  {String(val ?? '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">A importar dados...</p>
                <p className="text-sm text-muted-foreground">Por favor aguarde</p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={importProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground mt-2">{importProgress}%</p>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && importResult && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                importResult.errorCount === 0 
                  ? "bg-status-success/10" 
                  : "bg-status-warning/10"
              )}>
                <CheckCircle2 className={cn(
                  "w-10 h-10",
                  importResult.errorCount === 0 
                    ? "text-status-success" 
                    : "text-status-warning"
                )} />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Importação Concluída!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {importResult.successCount} registos importados com sucesso
                </p>
                {importResult.errorCount > 0 && (
                  <p className="text-sm text-status-critical mt-1">
                    {importResult.errorCount} erros encontrados
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="p-4 bg-status-success/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-status-success">{importResult.successCount}</p>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                </div>
                <div className="p-4 bg-status-critical/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-status-critical">{importResult.errorCount}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          {step !== 'complete' && step !== 'importing' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          
          {step === 'upload' && (
            <Button 
              onClick={() => setStep('mapping')} 
              disabled={!selectedTable || parsedData.length === 0}
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleValidate} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Validar e Preview
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!validationResult?.valid || isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {validationResult?.validRows} Registos
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
