import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, X, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AttributeDefinition, AgendaPointAttribute } from '@/types/database';
import { cn } from '@/lib/utils';

interface DynamicAttributeFieldProps {
  definition?: AttributeDefinition;
  attribute?: AgendaPointAttribute;
  readOnly?: boolean;
  onChange?: (value: unknown) => void;
}

export function DynamicAttributeField({ 
  definition, 
  attribute, 
  readOnly = false,
  onChange 
}: DynamicAttributeFieldProps) {
  const def = definition || attribute?.attribute_definition;
  if (!def) return null;

  const getValue = () => {
    if (!attribute) return null;
    
    switch (def.attribute_type) {
      case 'text':
      case 'textarea':
      case 'url':
      case 'email':
        return attribute.value_text;
      case 'number':
      case 'currency':
        return attribute.value_number;
      case 'boolean':
        return attribute.value_boolean;
      case 'date':
      case 'datetime':
        return attribute.value_date;
      case 'select':
        return attribute.value_text;
      case 'multi_select':
        return attribute.value_json;
      default:
        return attribute.value_text;
    }
  };

  const value = getValue();
  const hasValue = value !== null && value !== undefined && value !== '';

  if (readOnly) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          {def.label}
          {def.is_required && <span className="text-status-critical ml-1">*</span>}
        </Label>
        <div className="text-sm text-foreground">
          {renderReadOnlyValue(def, value)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={def.id} className="text-sm">
        {def.label}
        {def.is_required && <span className="text-status-critical ml-1">*</span>}
      </Label>
      {def.description && (
        <p className="text-xs text-muted-foreground">{def.description}</p>
      )}
      {renderEditableField(def, value, onChange)}
    </div>
  );
}

function renderReadOnlyValue(def: AttributeDefinition, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic">Não preenchido</span>;
  }

  switch (def.attribute_type) {
    case 'boolean':
      return value ? (
        <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
          <Check className="w-3 h-3 mr-1" />
          Sim
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          <X className="w-3 h-3 mr-1" />
          Não
        </Badge>
      );

    case 'currency':
      return (
        <span className="font-medium">
          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value as number)}
        </span>
      );

    case 'number':
      return <span className="font-medium">{String(value)}</span>;

    case 'date':
      return format(new Date(value as string), "dd/MM/yyyy", { locale: pt });

    case 'datetime':
      return format(new Date(value as string), "dd/MM/yyyy HH:mm", { locale: pt });

    case 'url':
      return (
        <a 
          href={value as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {(value as string).replace(/^https?:\/\//, '').slice(0, 40)}...
          <ExternalLink className="w-3 h-3" />
        </a>
      );

    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {value as string}
        </a>
      );

    case 'select':
      const option = def.options?.options?.find(o => o.value === value);
      return option ? (
        <Badge variant="secondary">{option.label}</Badge>
      ) : (
        <span>{String(value)}</span>
      );

    case 'multi_select':
      const selectedValues = value as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues?.map(v => {
            const opt = def.options?.options?.find(o => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="text-xs">
                {opt?.label || v}
              </Badge>
            );
          })}
        </div>
      );

    case 'textarea':
      return <p className="whitespace-pre-wrap">{String(value)}</p>;

    default:
      return <span>{String(value)}</span>;
  }
}

function renderEditableField(
  def: AttributeDefinition, 
  value: unknown, 
  onChange?: (value: unknown) => void
): React.ReactNode {
  const handleChange = (newValue: unknown) => {
    onChange?.(newValue);
  };

  switch (def.attribute_type) {
    case 'textarea':
      return (
        <Textarea
          id={def.id}
          value={(value as string) || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Introduza ${def.label.toLowerCase()}`}
        />
      );

    case 'number':
      return (
        <Input
          id={def.id}
          type="number"
          value={(value as number) || ''}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          placeholder="0"
        />
      );

    case 'currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          <Input
            id={def.id}
            type="number"
            step="0.01"
            className="pl-8"
            value={(value as number) || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            placeholder="0,00"
          />
        </div>
      );

    case 'date':
      return (
        <Input
          id={def.id}
          type="date"
          value={value ? format(new Date(value as string), 'yyyy-MM-dd') : ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case 'datetime':
      return (
        <Input
          id={def.id}
          type="datetime-local"
          value={value ? format(new Date(value as string), "yyyy-MM-dd'T'HH:mm") : ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={def.id}
            checked={value as boolean || false}
            onCheckedChange={(checked) => handleChange(checked)}
          />
          <Label htmlFor={def.id} className="text-sm font-normal">
            {def.label}
          </Label>
        </div>
      );

    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Selecione ${def.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {def.options?.options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'url':
      return (
        <Input
          id={def.id}
          type="url"
          value={(value as string) || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://..."
        />
      );

    case 'email':
      return (
        <Input
          id={def.id}
          type="email"
          value={(value as string) || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="email@exemplo.pt"
        />
      );

    default:
      return (
        <Input
          id={def.id}
          type="text"
          value={(value as string) || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Introduza ${def.label.toLowerCase()}`}
        />
      );
  }
}
