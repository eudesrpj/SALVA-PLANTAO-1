import { useState } from "react";
import { usePrescriptions, useCreatePrescription, useDeletePrescription } from "@/hooks/use-resources";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Trash2, FileText, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Prescriptions() {
  const { data: prescriptions, isLoading } = usePrescriptions();
  const { mutate: create } = useCreatePrescription();
  const { mutate: remove } = useDeletePrescription();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const filtered = prescriptions?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    create({ title: newTitle, content: newContent, isPublic: false }); // User creates private by default
    setIsDialogOpen(false);
    setNewTitle("");
    setNewContent("");
    toast({ title: "Sucesso", description: "Prescrição salva com sucesso." });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Prescrições</h1>
          <p className="text-slate-500">Modelos prontos para agilizar seu atendimento.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Nova Prescrição
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Prescrição</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Pneumonia Adquirida na Comunidade" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Digite a prescrição completa..." className="h-48 rounded-xl" />
              </div>
              <Button onClick={handleCreate} className="w-full rounded-xl h-12">Salvar Prescrição</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm text-lg" 
          placeholder="Buscar por doença, medicamento..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-6 rounded-2xl border-slate-100 hover:border-primary/50 hover:shadow-lg transition-all group h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  {item.userId === user?.id && (
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 -mt-2 -mr-2" onClick={() => remove(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-4 flex-1 whitespace-pre-line mb-4 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  {item.content}
                </p>

                <Button variant="outline" className="w-full rounded-xl border-slate-200 group-hover:border-primary group-hover:text-primary transition-colors" onClick={() => handleCopy(item.content)}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar Texto
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
