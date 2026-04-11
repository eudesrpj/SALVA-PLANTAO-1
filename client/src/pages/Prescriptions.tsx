
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Search, Plus, Copy, Trash2, Lock, FileText, Baby, User, ChevronDown, ChevronRight,
  Pill, FolderPlus, PlusCircle, Edit, X, Printer, CheckSquare, Square, Star,
  UserCheck, Heart, ArrowUp, ArrowDown, Shield, BookOpen, Loader2, Save, CheckCircle2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SUSPrescriptionPrint } from "@/components/SUSPrescriptionPrint";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PatientContextForm } from "@/components/PatientContextForm";
import { usePatientContextStore, PatientContextState } from "@/stores/usePatientContextStore";
import { apiRequest } from "@/lib/queryClient";
import type { Pathology, PathologyMedication, PrescriptionFavorite, PrescriptionModel, PrescriptionModelMedication } from "shared/schema";

const INTERVALS = ["6/6h", "8/8h", "12/12h", "1x/dia", "2x/dia", "3x/dia", "Dose única", "SOS"];
const DURATIONS = ["3 dias", "5 dias", "7 dias", "10 dias", "14 dias", "Uso contínuo", "Uso indeterminado"];
const ROUTES = ["VO", "IV", "IM", "SC", "Tópico", "Retal", "Sublingual", "Inalatório"];
const TIMINGS = ["Jejum", "Com alimentação", "Antes de dormir", "Longe das refeições"];
const PATHOLOGY_CATEGORIES = ["Infectologia", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia", "Ortopedia", "Dermatologia", "Endocrinologia", "Nefrologia", "Outros"];

const COMMON_WARNING_SIGNS = [
  "Febre persistente (>72h) ou febre alta (>39°C)", "Dificuldade para respirar ou falta de ar", "Dor torácica ou palpitações",
  "Vômitos persistentes ou incoercíveis", "Sinais de desidratação (boca seca, urina escura, tontura)", "Alteração do nível de consciência ou confusão mental",
  "Convulsões", "Dor abdominal intensa", "Piora significativa dos sintomas", "Recusa alimentar (crianças)",
];

const ALLERGY_CLASSES: Record<string, string[]> = {
  penicillin: ["amoxicilina", "ampicilina", "penicilina", "piperacilina", "benzilpenicilina"],
  sulfa: ["sulfametoxazol", "sulfadiazina", "sulfassalazina", "bactrim", "cotrimoxazol"],
  nsaid: ["ibuprofeno", "diclofenaco", "naproxeno", "cetoprofeno", "nimesulida", "aas", "ácido acetilsalicílico"],
  dypirone: ["dipirona", "metamizol", "novalgina"],
  macrolide: ["azitromicina", "claritromicina", "eritromicina"],
  quinolone: ["ciprofloxacino", "levofloxacino", "moxifloxacino"],
  iodine: ["contraste iodado", "iodo", "povidine"],
};

const MED_CONTRAINDICATIONS = {
  pregnancy: ["methotrexate", "misoprostol", "isotretinoína", "varfarina", "estatinas", "ieca", "bra"],
  renal: ["acv", "aciclovir", "ganciclovir", "anfotericina", "aminoglicosídeo", "gentamicina", "amicacina", "vancomicina", "tenofovir", "metformina"],
};

function checkMedicationRisks(medicationName: string, context: PatientContextState) {
  const risks = { isAllergic: false, pregnancyRisk: false, renalRisk: false };
  if (!medicationName || !context.isActive) return risks;

  const medLower = medicationName.toLowerCase();

  const allAllergies = [...context.allergies, ...context.otherAllergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)];
  for (const allergy of allAllergies) {
    if (allergy && medLower.includes(allergy)) {
      risks.isAllergic = true;
      break;
    }
    const allergyClass = ALLERGY_CLASSES[allergy as keyof typeof ALLERGY_CLASSES];
    if (allergyClass && allergyClass.some(med => medLower.includes(med))) {
      risks.isAllergic = true;
      break;
    }
  }

  if (context.isPregnant) {
    if (MED_CONTRAINDICATIONS.pregnancy.some(med => medLower.includes(med))) {
      risks.pregnancyRisk = true;
    }
  }

  if (context.keyConditions.includes('renal')) {
    if (MED_CONTRAINDICATIONS.renal.some(med => medLower.includes(med))) {
      risks.renalRisk = true;
    }
  }

  return risks;
}

type SelectionItem = { id: number; type: "medication" | "model"; pathologyName: string; data: PathologyMedication | any; };

function formatPrescriptionToText(items: SelectionItem[]): string {
    return items.map(item => `${item.data.medication} - ${item.data.dose}`).join('\n');
}

function PatientContextBanner() {
    const context = usePatientContextStore();
    const { resetPatientContext } = usePatientContextStore.getState();

    if (!context.isActive) return null;

    const parts = [
        context.ageGroup === 'pediatric' ? `Pediatria (${context.pediatricWeightKg}kg)` : 'Adulto',
        context.isPregnant ? 'GESTANTE' : null,
        context.allergies.length > 0 ? `Alergias: ${context.allergies.join(', ')}` : null,
        context.keyConditions.length > 0 ? `Condições: ${context.keyConditions.join(', ')}` : null,
    ].filter(Boolean);

    return (
        <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4 dark:bg-blue-950/30 dark:border-blue-800">
            <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">Contexto Ativo:</span> {parts.join(' | ')}
                </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetPatientContext} className="text-blue-600 dark:text-blue-400">
                <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
        </div>
    );
}

export default function Prescriptions() {
  const [mainTab, setMainTab] = useState<"contexto" | "patologias" | "minhas" | "favoritos">("contexto");
  const [ageGroup, setAgeGroup] = useState<"adulto" | "pediatrico">("adulto");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const patientContext = usePatientContextStore();
  const { resetPatientContext } = usePatientContextStore.getState();

  const handleActionWithReset = (action: () => void, message: string) => {
    action();
    toast({ title: message });
    if (patientContext.isActive) {
      resetPatientContext();
      toast({
        title: "Contexto do Paciente foi limpo",
        description: "Para segurança, os dados do paciente foram resetados após a ação.",
        duration: 5000,
      });
    }
  };

  const toggleSelection = (item: SelectionItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) return prev.filter(i => !(i.id === item.id && i.type === item.type));
      return [...prev, item];
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setSelectionMode(false);
  };
  
  const copySelectedItems = () => {
    if (selectedItems.length === 0) return;
    const text = formatPrescriptionToText(selectedItems);
    handleActionWithReset(() => navigator.clipboard.writeText(text), `${selectedItems.length} prescrição(ões) copiada(s).`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Prescrições</h1>
          <p className="text-slate-500">Modelos e contexto do paciente para agilizar seu plantão.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={ageGroup} onValueChange={(v) => setAgeGroup(v as "adulto" | "pediatrico")} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="adulto" className="gap-1"><User className="h-4 w-4" /> Adulto</TabsTrigger>
              <TabsTrigger value="pediatrico" className="gap-1"><Baby className="h-4 w-4" /> Pediátrico</TabsTrigger>
            </TabsList>
          </Tabs>
          {isAdmin && mainTab === "patologias" && <PathologyDialog ageGroup={ageGroup} isAdmin={true} />}
          {mainTab === "minhas" && <UserPathologyDialog ageGroup={ageGroup} />}
        </div>
      </header>
      
      <PatientContextBanner />

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b">
            <TabsList className="w-auto">
                <TabsTrigger value="contexto" className="gap-1"><UserCheck className="h-4 w-4" /> Paciente Atual</TabsTrigger>
                <TabsTrigger value="patologias" className="gap-1"><FileText className="h-4 w-4" /> Por Patologia</TabsTrigger>
                <TabsTrigger value="minhas" className="gap-1"><Heart className="h-4 w-4" /> Minhas</TabsTrigger>
                <TabsTrigger value="favoritos" className="gap-1"><Star className="h-4 w-4" /> Favoritos</TabsTrigger>
            </TabsList>
            
            {mainTab === "patologias" && (
            <Button
                variant={selectionMode ? "default" : "outline"}
                onClick={() => selectionMode ? clearSelection() : setSelectionMode(true)}
                className="gap-2"
            >
                {selectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectionMode ? `Selecionados (${selectedItems.length})` : "Selecionar Múltiplos"}
            </Button>
            )}
        </div>
        <TabsContent value="contexto" className="mt-6">
            <PatientContextForm />
        </TabsContent>
        <TabsContent value="patologias" className="mt-6">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar patologia..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
            </div>
            <PathologiesView 
                ageGroup={ageGroup} 
                searchQuery={searchQuery} 
                isAdmin={isAdmin} 
                patientContext={patientContext}
                selectionMode={selectionMode}
                selectedItems={selectedItems}
                onToggleSelection={toggleSelection}
                onAction={handleActionWithReset}
            />
        </TabsContent>
         <TabsContent value="minhas" className="mt-6">
             <UserPathologiesView ageGroup={ageGroup} searchQuery={searchQuery} patientContext={patientContext} onAction={handleActionWithReset} />
        </TabsContent>
         <TabsContent value="favoritos" className="mt-6">
             <FavoritesView searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
      
      {selectionMode && selectedItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border shadow-lg rounded-lg p-3 flex items-center gap-3 z-50">
          <span className="text-sm font-medium">{selectedItems.length} selecionado(s)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copySelectedItems} className="gap-1">
              <Copy className="h-3 w-3" /> Copiar
            </Button>
            <SUSPrescriptionPrint
              prescriptions={selectedItems.map(item => item.data)}
              trigger={<Button size="sm" variant="outline" className="gap-1"><Printer className="h-3 w-3" /> Imprimir</Button>}
              onPrintComplete={() => handleActionWithReset(() => {}, 'Prescrições enviadas para impressão.')}
            />
            <Button size="sm" variant="ghost" onClick={clearSelection}><X className="h-3 w-3" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PathologiesView({ ageGroup, searchQuery, isAdmin, patientContext, selectionMode, selectedItems, onToggleSelection, onAction }: { ageGroup: string; searchQuery: string; isAdmin: boolean; patientContext: PatientContextState; selectionMode: boolean; selectedItems: SelectionItem[]; onToggleSelection: (item: SelectionItem) => void; onAction: (action: () => void, message: string) => void; }) {
  const { data: pathologies, isLoading } = useQuery<Pathology[]>({
    queryKey: ["/api/pathologies", ageGroup],
    queryFn: () => apiRequest("GET", `/api/pathologies?ageGroup=${ageGroup}`)
  });
  const filtered = useMemo(() => pathologies?.filter(p => (p.isPublic || p.isLocked) && (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))), [pathologies, searchQuery]);
  if (isLoading) return <PageLoader text="Carregando patologias..." />;
  if (!filtered?.length) return (
    <div className="text-center py-12 text-slate-400">
      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>{searchQuery ? "Nenhuma patologia encontrada." : "Nenhuma patologia cadastrada."}</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {filtered.map((pathology) => (
        <PathologyCard key={pathology.id} pathology={pathology} isAdmin={isAdmin}
          patientContext={patientContext} selectionMode={selectionMode} selectedItems={selectedItems}
          onToggleSelection={onToggleSelection} onAction={onAction}
        />
      ))}
    </div>
  );
}

function UserPathologiesView({ ageGroup, searchQuery, patientContext, onAction }: { ageGroup: string; searchQuery: string; patientContext: PatientContextState; onAction: (action: () => void, message: string) => void; }) {
  const { data: pathologies, isLoading } = useQuery<Pathology[]>({
    queryKey: ["/api/pathologies/mine", ageGroup],
    queryFn: () => apiRequest("GET", `/api/pathologies?scope=mine&ageGroup=${ageGroup}`)
  });
  const filtered = useMemo(() => pathologies?.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())), [pathologies, searchQuery]);
  if (isLoading) return <PageLoader text="Carregando suas patologias..." />;
  if (!filtered?.length) return (
    <div className="text-center py-12 text-slate-400">
      <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Nenhuma patologia pessoal cadastrada.</p>
      <p className="text-sm mt-1">Crie suas próprias patologias e medicamentos no botão acima.</p>
    </div>
  );
  return <div className="space-y-3">{filtered.map(p => <UserPathologyCard key={p.id} pathology={p} patientContext={patientContext} onAction={onAction} />)}</div>;
}

function UserPathologyCard({ pathology, patientContext, onAction }: { pathology: Pathology; patientContext: PatientContextState; onAction: (action: () => void, message: string) => void; }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: medications, isLoading } = useQuery<PathologyMedication[]>({
    queryKey: ["/api/pathologies", pathology.id, "medications"],
    enabled: isExpanded,
    queryFn: () => apiRequest("GET", `/api/pathologies/${pathology.id}/medications`)
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/pathologies/${pathology.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pathologies/mine"] }); toast({ title: "Patologia excluída" }); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" })
  });
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <CollapsibleTrigger className="flex-1 flex items-center gap-3 text-left">
            {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            <h3 className="font-bold text-slate-900">{pathology.name}</h3>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Excluir esta patologia pessoal?")) deleteMutation.mutate(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
            <Badge variant="outline" className="text-xs">Pessoal</Badge>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-muted/20">
            {isLoading && <div className="py-4 text-center text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...</div>}
            {medications?.map(med => {
              const risks = checkMedicationRisks(med.medication, patientContext);
              return (
                <div key={med.id} className={`p-3 mt-2 bg-background rounded-md border flex items-start gap-3 ${risks.isAllergic ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Pill className="h-4 w-4 text-primary" />
                      <span className="font-medium">{med.medication}</span>
                      {risks.isAllergic && <Badge variant="destructive" className="text-xs">ALERGIA</Badge>}
                      {risks.pregnancyRisk && <Badge variant="destructive" className="text-xs">RISCO GESTAÇÃO</Badge>}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                      <p>{[med.dose, med.route, med.interval, med.duration].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => onAction(() => navigator.clipboard.writeText(`${med.medication} - ${med.dose}`), `${med.medication} copiado!`)}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function FavoritesView({ searchQuery }: { searchQuery: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: favorites, isLoading } = useQuery<PrescriptionFavorite[]>({
    queryKey: ["/api/prescription-favorites"],
    queryFn: () => apiRequest("GET", "/api/prescription-favorites")
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/prescription-favorites/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-favorites"] }); toast({ title: "Favorito removido" }); },
    onError: () => toast({ title: "Erro ao remover favorito", variant: "destructive" })
  });
  const filtered = useMemo(() => favorites?.filter(f => !searchQuery || f.medication.toLowerCase().includes(searchQuery.toLowerCase())), [favorites, searchQuery]);
  if (isLoading) return <PageLoader text="Carregando favoritos..." />;
  if (!filtered?.length) return (
    <div className="text-center py-12 text-slate-400">
      <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Nenhum favorito salvo.</p>
      <p className="text-sm mt-1">Salve prescrições frequentes como favoritos para acesso rápido.</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {filtered.map(fav => (
        <div key={fav.id} className="p-3 bg-background rounded-md border flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Pill className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">{fav.medication}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-5">{[fav.dose, fav.route, fav.interval, fav.duration].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigator.clipboard.writeText(`${fav.medication} - ${fav.dose}`).then(() => toast({ title: "Copiado!" }))} title="Copiar"><Copy className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover este favorito?")) deleteMutation.mutate(fav.id); }} title="Remover"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PathologyCard({ pathology, isAdmin, patientContext, selectionMode, selectedItems, onToggleSelection, onAction }: { pathology: Pathology; isAdmin: boolean; patientContext: PatientContextState; selectionMode: boolean; selectedItems: SelectionItem[]; onToggleSelection: (item: SelectionItem) => void; onAction: (action: () => void, message: string) => void; }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMedDialog, setShowAddMedDialog] = useState(false);
  const [editingMed, setEditingMed] = useState<PathologyMedication | null>(null);
  const [showModels, setShowModels] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: medications, isLoading: medsLoading } = useQuery<PathologyMedication[]>({
    queryKey: ["/api/pathologies", pathology.id, "medications"],
    enabled: isExpanded,
    queryFn: () => apiRequest("GET", `/api/pathologies/${pathology.id}/medications`)
  });
  const { data: models, isLoading: modelsLoading } = useQuery<PrescriptionModel[]>({
    queryKey: ["/api/prescription-models", pathology.id],
    enabled: isAdmin && isExpanded && showModels,
    queryFn: () => apiRequest("GET", `/api/prescription-models?pathologyId=${pathology.id}`)
  });
  const deletePathologyMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/pathologies/${pathology.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pathologies"] }); toast({ title: "Patologia excluída" }); },
    onError: () => toast({ title: "Erro ao excluir patologia", variant: "destructive" })
  });
  const deleteMedMutation = useMutation({
    mutationFn: (medId: number) => apiRequest("DELETE", `/api/pathology-medications/${medId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pathologies", pathology.id, "medications"] }); toast({ title: "Medicamento removido" }); },
    onError: () => toast({ title: "Erro ao remover medicamento", variant: "destructive" })
  });
  const reorderMedMutation = useMutation({
    mutationFn: ({ medId, newOrder }: { medId: number; newOrder: number }) => apiRequest("PUT", `/api/pathology-medications/${medId}`, { order: newOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pathologies", pathology.id, "medications"] })
  });
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <CollapsibleTrigger className="flex-1 flex items-center gap-3 text-left">
            {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            <h3 className="font-bold text-slate-900">{pathology.name}</h3>
            {pathology.isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" />}
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowEditDialog(true)} title="Editar patologia"><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("Excluir esta patologia?")) deletePathologyMutation.mutate(); }} title="Excluir patologia"><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
            <Badge variant="secondary" className="text-xs">Oficial</Badge>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-muted/20">
            {medsLoading && <div className="py-4 text-center text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...</div>}
            {medications?.map((med, idx) => {
              const risks = checkMedicationRisks(med.medication, patientContext);
              const isSelected = selectedItems.some(i => i.id === med.id && i.type === "medication");
              return (
                <div key={med.id} className={`p-3 mt-2 bg-background rounded-md border flex items-start gap-3 ${isSelected ? "ring-2 ring-primary" : ""} ${risks.isAllergic ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}`}>
                  {selectionMode && (
                    <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection({ id: med.id, type: "medication", pathologyName: pathology.name, data: med })} className="mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Pill className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{med.medication}</span>
                      {risks.isAllergic && <Badge variant="destructive" className="text-xs">ALERGIA</Badge>}
                      {risks.pregnancyRisk && <Badge variant="destructive" className="text-xs">RISCO GESTAÇÃO</Badge>}
                      {risks.renalRisk && <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800">AJUSTE RENAL</Badge>}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                      <p>{[med.dose, med.route, med.interval, med.duration].filter(Boolean).join(" · ")}</p>
                      {med.observations && <p className="text-xs mt-1 italic">{med.observations}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorderMedMutation.mutate({ medId: med.id, newOrder: (med.order ?? idx) - 1 })} disabled={idx === 0} title="Mover para cima"><ArrowUp className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorderMedMutation.mutate({ medId: med.id, newOrder: (med.order ?? idx) + 1 })} disabled={idx === (medications?.length ?? 0) - 1} title="Mover para baixo"><ArrowDown className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingMed(med)} title="Editar"><Edit className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover este medicamento?")) deleteMedMutation.mutate(med.id); }} title="Remover"><Trash2 className="h-3 w-3" /></Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAction(() => navigator.clipboard.writeText(`${med.medication} - ${med.dose}`), `${med.medication} copiado!`)} title="Copiar"><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
            {isAdmin && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAddMedDialog(true)}><PlusCircle className="h-3 w-3" /> Adicionar Medicamento</Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowModels(v => !v)}><BookOpen className="h-3 w-3" /> {showModels ? "Ocultar Modelos" : "Modelos de Prescrição"}</Button>
              </div>
            )}
            {isAdmin && showModels && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-semibold flex items-center gap-1 mb-2"><Shield className="h-3.5 w-3.5 text-primary" /> Modelos Oficiais de Prescrição</h4>
                {modelsLoading && <div className="text-sm text-slate-500 text-center py-2"><Loader2 className="h-3 w-3 animate-spin inline mr-1" />Carregando modelos...</div>}
                {models?.map(model => <PrescriptionModelCard key={model.id} model={model} pathologyId={pathology.id} />)}
                <PrescriptionModelForm pathologyId={pathology.id} />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      {isAdmin && <PathologyFormDialog pathology={pathology} ageGroup={pathology.ageGroup || "adulto"} open={showEditDialog} onOpenChange={setShowEditDialog} />}
      {isAdmin && <MedicationFormDialog pathologyId={pathology.id} open={showAddMedDialog} onOpenChange={setShowAddMedDialog} />}
      {isAdmin && editingMed && <MedicationFormDialog pathologyId={pathology.id} medication={editingMed} open={!!editingMed} onOpenChange={(open) => { if (!open) setEditingMed(null); }} />}
    </Card>
  );
}

function PrescriptionModelCard({ model, pathologyId }: { model: PrescriptionModel; pathologyId: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMed, setEditingMed] = useState<PrescriptionModelMedication | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: modelMeds, isLoading } = useQuery<PrescriptionModelMedication[]>({
    queryKey: ["/api/prescription-models", model.id, "medications"],
    enabled: isExpanded,
    queryFn: () => apiRequest("GET", `/api/prescription-models/${model.id}/medications`)
  });
  const deleteModelMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/prescription-models/${model.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", pathologyId] }); toast({ title: "Modelo excluído" }); },
    onError: () => toast({ title: "Erro ao excluir modelo", variant: "destructive" })
  });
  const deleteMedMutation = useMutation({
    mutationFn: (medId: number) => apiRequest("DELETE", `/api/admin/prescription-model-medications/${medId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", model.id, "medications"] }); toast({ title: "Medicamento removido do modelo" }); },
    onError: () => toast({ title: "Erro ao remover medicamento", variant: "destructive" })
  });
  const reorderMutation = useMutation({
    mutationFn: ({ medId, newOrder }: { medId: number; newOrder: number }) => apiRequest("PATCH", `/api/admin/prescription-model-medications/${medId}`, { order: newOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", model.id, "medications"] })
  });
  return (
    <div className="border rounded-md mb-2 bg-background">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-2.5 flex items-center justify-between hover:bg-muted/50 rounded-md">
          <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{model.title}</span>
            {model.ageGroup && <Badge variant="outline" className="text-xs">{model.ageGroup}</Badge>}
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowEditDialog(true)} title="Editar modelo"><Edit className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm("Excluir este modelo?")) deleteModelMutation.mutate(); }} title="Excluir modelo"><Trash2 className="h-3 w-3" /></Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t">
            {isLoading && <div className="text-sm text-slate-500 py-2 text-center"><Loader2 className="h-3 w-3 animate-spin inline mr-1" />Carregando...</div>}
            {modelMeds?.map((med, idx) => (
              <div key={med.id} className="p-2 mt-1.5 bg-muted/30 rounded border flex items-start gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{med.medication}</span>
                  <span className="text-muted-foreground ml-2">{[med.dose, med.route, med.interval, med.duration].filter(Boolean).join(" · ")}</span>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorderMutation.mutate({ medId: med.id, newOrder: (med.order ?? idx) - 1 })} disabled={idx === 0}><ArrowUp className="h-2.5 w-2.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorderMutation.mutate({ medId: med.id, newOrder: (med.order ?? idx) + 1 })} disabled={idx === (modelMeds?.length ?? 0) - 1}><ArrowDown className="h-2.5 w-2.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingMed(med)}><Edit className="h-2.5 w-2.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive hover:text-destructive" onClick={() => { if (confirm("Remover este medicamento?")) deleteMedMutation.mutate(med.id); }}><Trash2 className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            ))}
            <ModelMedicationForm modelId={model.id} />
          </div>
        </CollapsibleContent>
      </Collapsible>
      <PrescriptionModelFormDialog model={model} pathologyId={pathologyId} open={showEditDialog} onOpenChange={setShowEditDialog} />
      {editingMed && <ModelMedicationFormDialog medication={editingMed} modelId={model.id} open={!!editingMed} onOpenChange={(open) => { if (!open) setEditingMed(null); }} />}
    </div>
  );
}

function PrescriptionModelForm({ pathologyId }: { pathologyId: number }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("adulto");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/prescription-models", { pathologyId, title, description, ageGroup, isActive: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", pathologyId] }); setShow(false); setTitle(""); setDescription(""); toast({ title: "Modelo criado" }); },
    onError: () => toast({ title: "Erro ao criar modelo", variant: "destructive" })
  });
  if (!show) return (
    <Button size="sm" variant="ghost" className="gap-1 text-xs mt-2 w-full border-dashed border" onClick={() => setShow(true)}><PlusCircle className="h-3 w-3" /> Novo Modelo</Button>
  );
  return (
    <div className="mt-2 p-3 border rounded-md bg-muted/10 space-y-2">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold">Novo Modelo</span><Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShow(false)}><X className="h-3 w-3" /></Button></div>
      <Input placeholder="Título do modelo *" value={title} onChange={e => setTitle(e.target.value)} className="h-7 text-xs" />
      <Input placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} className="h-7 text-xs" />
      <Select value={ageGroup} onValueChange={setAgeGroup}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="adulto">Adulto</SelectItem><SelectItem value="pediatrico">Pediátrico</SelectItem><SelectItem value="ambos">Ambos</SelectItem></SelectContent></Select>
      <Button size="sm" className="w-full gap-1 h-7 text-xs" onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending}>{createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Criar Modelo</Button>
    </div>
  );
}

function ModelMedicationForm({ modelId }: { modelId: number }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ medication: "", dose: "", route: "VO", interval: "12/12h", duration: "7 dias", quantity: "", timing: "", dosePerKg: "", maxDose: "", observations: "", pharmaceuticalForm: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/prescription-model-medications", { prescriptionModelId: modelId, ...form }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", modelId, "medications"] }); setShow(false); setForm({ medication: "", dose: "", route: "VO", interval: "12/12h", duration: "7 dias", quantity: "", timing: "", dosePerKg: "", maxDose: "", observations: "", pharmaceuticalForm: "" }); toast({ title: "Medicamento adicionado ao modelo" }); },
    onError: () => toast({ title: "Erro ao adicionar medicamento", variant: "destructive" })
  });
  if (!show) return (
    <Button size="sm" variant="ghost" className="gap-1 text-xs mt-1.5 w-full border-dashed border" onClick={() => setShow(true)}><PlusCircle className="h-3 w-3" /> Adicionar Medicamento ao Modelo</Button>
  );
  return (
    <div className="mt-2 p-3 border rounded-md bg-muted/10 space-y-2">
      <div className="flex items-center justify-between"><span className="text-xs font-semibold">Novo Medicamento no Modelo</span><Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShow(false)}><X className="h-3 w-3" /></Button></div>
      <MedicationFields form={form} onChange={setForm} compact />
      <Button size="sm" className="w-full gap-1 h-7 text-xs" onClick={() => createMutation.mutate()} disabled={!form.medication.trim() || createMutation.isPending}>{createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Adicionar</Button>
    </div>
  );
}

function MedicationFields({ form, onChange, compact = false }: { form: { medication: string; dose: string; route: string; interval: string; duration: string; quantity: string; timing: string; dosePerKg?: string; maxDose?: string; observations?: string; pharmaceuticalForm?: string }; onChange: (f: typeof form) => void; compact?: boolean }) {
  const set = (key: string, value: string) => onChange({ ...form, [key]: value });
  const cls = compact ? "h-7 text-xs" : "";
  return (
    <div className="space-y-2">
      <Input placeholder="Medicamento *" value={form.medication} onChange={e => set("medication", e.target.value)} className={cls} />
      <Input placeholder="Dose *" value={form.dose} onChange={e => set("dose", e.target.value)} className={cls} />
      <div className="grid grid-cols-2 gap-2">
        <Select value={form.route} onValueChange={v => set("route", v)}><SelectTrigger className={cls}><SelectValue placeholder="Via" /></SelectTrigger><SelectContent>{ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        <Select value={form.interval} onValueChange={v => set("interval", v)}><SelectTrigger className={cls}><SelectValue placeholder="Intervalo" /></SelectTrigger><SelectContent>{INTERVALS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={form.duration} onValueChange={v => set("duration", v)}><SelectTrigger className={cls}><SelectValue placeholder="Duração" /></SelectTrigger><SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Quantidade" value={form.quantity} onChange={e => set("quantity", e.target.value)} className={cls} />
      </div>
      {!compact && (
        <>
          <Select value={form.timing || ""} onValueChange={v => set("timing", v)}><SelectTrigger><SelectValue placeholder="Momento de uso" /></SelectTrigger><SelectContent>{TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Dose/kg (pediátrico)" value={form.dosePerKg || ""} onChange={e => set("dosePerKg", e.target.value)} />
            <Input placeholder="Dose máxima" value={form.maxDose || ""} onChange={e => set("maxDose", e.target.value)} />
          </div>
          <Textarea placeholder="Observações" value={form.observations || ""} onChange={e => set("observations", e.target.value)} rows={2} />
        </>
      )}
    </div>
  );
}

function UserPathologyDialog({ ageGroup }: { ageGroup: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addMed, setAddMed] = useState(false);
  const [medForm, setMedForm] = useState({ medication: "", dose: "", route: "VO", interval: "12/12h", duration: "7 dias", quantity: "", timing: "", dosePerKg: "", maxDose: "", observations: "", pharmaceuticalForm: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: async () => {
      const newPathology = await apiRequest("POST", "/api/pathologies", { name, description, ageGroup, isPublic: false, isLocked: false }) as Pathology;
      if (addMed && medForm.medication.trim()) {
        try { await apiRequest("POST", `/api/pathologies/${newPathology.id}/medications`, medForm); } catch {}
      }
      return newPathology;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pathologies/mine"] }); toast({ title: "Patologia pessoal criada" }); setOpen(false); setName(""); setDescription(""); setAddMed(false); },
    onError: () => toast({ title: "Erro ao criar patologia", variant: "destructive" })
  });
  return (
    <>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}><PlusCircle className="h-4 w-4" /> Nova Patologia Pessoal</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Patologia Pessoal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Amigdalite de repetição" /></div>
            <div className="space-y-1"><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Notas pessoais..." rows={2} /></div>
            <div className="flex items-center gap-2"><Checkbox id="addMed" checked={addMed} onCheckedChange={(v) => setAddMed(!!v)} /><Label htmlFor="addMed" className="cursor-pointer">Adicionar medicamento agora</Label></div>
            {addMed && <MedicationFields form={medForm} onChange={setMedForm} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PathologyDialog({ ageGroup, isAdmin }: { ageGroup: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" className="gap-1" onClick={() => setOpen(true)}><FolderPlus className="h-4 w-4" /> Nova Patologia Oficial</Button>
      <PathologyFormDialog ageGroup={ageGroup} open={open} onOpenChange={setOpen} />
    </>
  );
}

function PathologyFormDialog({ pathology, ageGroup, open, onOpenChange }: { pathology?: Pathology; ageGroup: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState(pathology?.name || "");
  const [description, setDescription] = useState(pathology?.description || "");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(pathology?.ageGroup || ageGroup);
  const [specialty, setSpecialty] = useState(pathology?.specialty || "");
  const [isPublic, setIsPublic] = useState(pathology?.isPublic ?? true);
  const [isLocked, setIsLocked] = useState(pathology?.isLocked ?? true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => {
      const body = { name, description, ageGroup: selectedAgeGroup, specialty, isPublic, isLocked };
      return pathology ? apiRequest("PUT", `/api/pathologies/${pathology.id}`, body) : apiRequest("POST", "/api/pathologies", body);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pathologies"] }); toast({ title: pathology ? "Patologia atualizada" : "Patologia criada" }); onOpenChange(false); },
    onError: () => toast({ title: "Erro ao salvar patologia", variant: "destructive" })
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{pathology ? "Editar Patologia" : "Nova Patologia Oficial"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da patologia" /></div>
          <div className="space-y-1"><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição breve" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Faixa Etária</Label><Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="adulto">Adulto</SelectItem><SelectItem value="pediatrico">Pediátrico</SelectItem><SelectItem value="ambos">Ambos</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label>Especialidade</Label><Select value={specialty} onValueChange={setSpecialty}><SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{PATHOLOGY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Checkbox id="isPublic" checked={isPublic} onCheckedChange={(v) => setIsPublic(!!v)} /><Label htmlFor="isPublic" className="cursor-pointer">Pública</Label></div>
            <div className="flex items-center gap-2"><Checkbox id="isLocked" checked={isLocked} onCheckedChange={(v) => setIsLocked(!!v)} /><Label htmlFor="isLocked" className="cursor-pointer">Bloqueada</Label></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{pathology ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MedicationFormDialog({ pathologyId, medication, open, onOpenChange }: { pathologyId: number; medication?: PathologyMedication; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ medication: medication?.medication || "", dose: medication?.dose || "", route: medication?.route || "VO", interval: medication?.interval || "12/12h", duration: medication?.duration || "7 dias", quantity: medication?.quantity || "", timing: medication?.timing || "", dosePerKg: medication?.dosePerKg || "", maxDose: medication?.maxDose || "", observations: medication?.observations || "", pharmaceuticalForm: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => {
      const { pharmaceuticalForm: _pf, ...body } = form;
      return medication ? apiRequest("PUT", `/api/pathology-medications/${medication.id}`, body) : apiRequest("POST", `/api/pathologies/${pathologyId}/medications`, body);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pathologies", pathologyId, "medications"] }); toast({ title: medication ? "Medicamento atualizado" : "Medicamento adicionado" }); onOpenChange(false); },
    onError: () => toast({ title: "Erro ao salvar medicamento", variant: "destructive" })
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{medication ? "Editar Medicamento" : "Adicionar Medicamento"}</DialogTitle></DialogHeader>
        <div className="py-2"><MedicationFields form={form} onChange={setForm} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.medication.trim() || mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{medication ? "Salvar" : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrescriptionModelFormDialog({ model, pathologyId, open, onOpenChange }: { model: PrescriptionModel; pathologyId: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState(model.title);
  const [description, setDescription] = useState(model.description || "");
  const [ageGroup, setAgeGroup] = useState(model.ageGroup || "adulto");
  const [orientations, setOrientations] = useState(model.orientations || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/prescription-models/${model.id}`, { title, description, ageGroup, orientations }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", pathologyId] }); toast({ title: "Modelo atualizado" }); onOpenChange(false); },
    onError: () => toast({ title: "Erro ao atualizar modelo", variant: "destructive" })
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Editar Modelo de Prescrição</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1"><Label>Título *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-1"><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div className="space-y-1"><Label>Faixa Etária</Label><Select value={ageGroup} onValueChange={setAgeGroup}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="adulto">Adulto</SelectItem><SelectItem value="pediatrico">Pediátrico</SelectItem><SelectItem value="ambos">Ambos</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label>Orientações</Label><Textarea value={orientations} onChange={e => setOrientations(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModelMedicationFormDialog({ medication, modelId, open, onOpenChange }: { medication: PrescriptionModelMedication; modelId: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ medication: medication.medication, dose: medication.dose || "", route: medication.route || "VO", interval: medication.interval || "12/12h", duration: medication.duration || "7 dias", quantity: medication.quantity || "", timing: medication.timing || "", dosePerKg: medication.dosePerKg || "", maxDose: medication.maxDose || "", observations: medication.observations || "", pharmaceuticalForm: medication.pharmaceuticalForm || "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/prescription-model-medications/${medication.id}`, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/prescription-models", modelId, "medications"] }); toast({ title: "Medicamento atualizado" }); onOpenChange(false); },
    onError: () => toast({ title: "Erro ao atualizar medicamento", variant: "destructive" })
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Medicamento do Modelo</DialogTitle></DialogHeader>
        <div className="py-2"><MedicationFields form={form} onChange={setForm} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.medication.trim() || mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
