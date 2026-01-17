import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Info, 
  Banknote, 
  FileText, 
  BarChart3,
  Folder,
  Calendar,
  User,
  Lock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAgendaPointAttributes } from '@/hooks/useSupabaseData';
import { DynamicAttributeField } from './DynamicAttributeField';
import type { AgendaPoint, AttributeFamily } from '@/types/database';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof Info> = {
  'info': Info,
  'banknote': Banknote,
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  'folder': Folder,
};

interface AgendaPointDetailProps {
  point: AgendaPoint;
  families: AttributeFamily[];
}

export function AgendaPointDetail({ point, families }: AgendaPointDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: attributes = [] } = useAgendaPointAttributes(point.id);

  // Group attributes by family
  const attributesByFamily = attributes.reduce((acc, attr) => {
    const familyId = attr.attribute_definition?.family_id;
    if (familyId) {
      if (!acc[familyId]) acc[familyId] = [];
      acc[familyId].push(attr);
    }
    return acc;
  }, {} as Record<string, typeof attributes>);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {point.point_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Prioridade: {point.priority}
              </Badge>
              {point.is_confidential && (
                <Badge variant="outline" className="text-xs bg-status-warning/10 text-status-warning border-status-warning/20">
                  <Lock className="w-3 h-3 mr-1" />
                  Confidencial
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-medium text-foreground">{point.subject}</h3>
            {point.description && (
              <p className="text-sm text-muted-foreground mt-2">{point.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Proponente: {point.proposer?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Reunião: {point.meeting?.type} - {point.meeting?.date ? format(new Date(point.meeting.date), "dd/MM/yyyy", { locale: pt }) : 'N/A'}</span>
          </div>
        </div>

        {point.background && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Enquadramento</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{point.background}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Tabs for attribute families */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-sm">
            <Info className="w-4 h-4 mr-2" />
            Resumo
          </TabsTrigger>
          {families.map(family => {
            const Icon = iconMap[family.icon] || Folder;
            const hasAttributes = attributesByFamily[family.id]?.length > 0;
            return (
              <TabsTrigger 
                key={family.id} 
                value={family.id}
                className={cn("text-sm", !hasAttributes && "opacity-50")}
              >
                <Icon className="w-4 h-4 mr-2" />
                {family.name}
                {hasAttributes && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {attributesByFamily[family.id].length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab point={point} families={families} attributesByFamily={attributesByFamily} />
        </TabsContent>

        {families.map(family => (
          <TabsContent key={family.id} value={family.id} className="mt-4">
            <FamilyAttributesTab 
              family={family} 
              attributes={attributesByFamily[family.id] || []} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function OverviewTab({ 
  point, 
  families, 
  attributesByFamily 
}: { 
  point: AgendaPoint; 
  families: AttributeFamily[];
  attributesByFamily: Record<string, ReturnType<typeof useAgendaPointAttributes>['data']>;
}) {
  const filledFamilies = families.filter(f => attributesByFamily[f.id]?.length > 0);

  return (
    <div className="space-y-6">
      {filledFamilies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum atributo adicional preenchido</p>
          <p className="text-sm mt-2">Os atributos podem ser adicionados nas tabs acima</p>
        </div>
      ) : (
        filledFamilies.map(family => {
          const Icon = iconMap[family.icon] || Folder;
          const familyAttrs = attributesByFamily[family.id] || [];
          
          return (
            <div key={family.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-foreground">{family.name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                {familyAttrs.map(attr => (
                  <DynamicAttributeField 
                    key={attr.id} 
                    attribute={attr} 
                    readOnly 
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function FamilyAttributesTab({ 
  family, 
  attributes 
}: { 
  family: AttributeFamily;
  attributes: ReturnType<typeof useAgendaPointAttributes>['data'];
}) {
  const definitions = family.definitions || [];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        {family.description}
      </div>

      {definitions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum campo definido para esta família</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {definitions.map(def => {
            const existingAttr = attributes?.find(a => a.attribute_definition_id === def.id);
            
            return (
              <DynamicAttributeField
                key={def.id}
                definition={def}
                attribute={existingAttr}
                readOnly
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
