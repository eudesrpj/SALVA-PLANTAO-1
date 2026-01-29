import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme, Theme, ColorScheme, FontSize } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Monitor, Palette, Type, LayoutGrid, Check, Bell, Lock, RotateCcw, Zap } from "lucide-react";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const COLOR_OPTIONS: { value: ColorScheme; label: string; color: string }[] = [
  { value: "blue", label: "Azul Médico", color: "bg-sky-600" },
  { value: "green", label: "Verde Saúde", color: "bg-emerald-600" },
  { value: "purple", label: "Roxo Premium", color: "bg-violet-600" },
  { value: "orange", label: "Laranja Energia", color: "bg-orange-500" },
  { value: "rose", label: "Rosa Cuidado", color: "bg-rose-500" },
];

const FONT_OPTIONS: { value: FontSize; label: string; preview: string }[] = [
  { value: "small", label: "Pequeno", preview: "Aa" },
  { value: "medium", label: "Médio", preview: "Aa" },
  { value: "large", label: "Grande", preview: "Aa" },
];

export default function Settings() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  
  const { 
    theme, 
    colorScheme, 
    fontSize, 
    compactMode, 
    setTheme, 
    setColorScheme, 
    setFontSize, 
    setCompactMode 
  } = useTheme();

  const handleThemeChange = (value: Theme) => {
    try {
      setTheme(value);
      toast({ title: "✅ Tema alterado", description: `Tema ${value} aplicado com sucesso` });
    } catch (error) {
      toast({ title: "❌ Erro", description: "Falha ao alterar tema", variant: "destructive" });
    }
  };

  const handleColorChange = (value: ColorScheme) => {
    try {
      setColorScheme(value);
      toast({ title: "✅ Cor alterada", description: `Cor ${value} aplicada com sucesso` });
    } catch (error) {
      toast({ title: "❌ Erro", description: "Falha ao alterar cor", variant: "destructive" });
    }
  };

  const handleFontChange = (value: FontSize) => {
    try {
      setFontSize(value);
      toast({ title: "✅ Fonte alterada", description: `Tamanho ${value} aplicado com sucesso` });
    } catch (error) {
      toast({ title: "❌ Erro", description: "Falha ao alterar fonte", variant: "destructive" });
    }
  };

  const handleCompactModeChange = (value: boolean) => {
    try {
      setCompactMode(value);
      toast({ 
        title: "✅ Layout alterado", 
        description: value ? "Modo compacto ativado" : "Modo normal ativado" 
      });
    } catch (error) {
      toast({ title: "❌ Erro", description: "Falha ao alterar layout", variant: "destructive" });
    }
  };

  const handleResetSettings = () => {
    try {
      setTheme("system");
      setColorScheme("blue");
      setFontSize("medium");
      setCompactMode(false);
      setNotificationsEnabled(true);
      setSoundEnabled(true);
      setAutoSaveEnabled(true);
      setAnalyticsEnabled(false);
      toast({ title: "✅ Reset concluído", description: "Todas as configurações foram restauradas" });
    } catch (error) {
      toast({ title: "❌ Erro", description: "Falha ao resetar configurações", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">⚙️ Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência no Salva Plantão</p>
      </div>

      {/* Aparência */}
      <Card className="border-2 hover:border-primary/20 transition">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle className="text-lg">🌓 Aparência</CardTitle>
              <CardDescription>Escolha o tema do aplicativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className="flex flex-col h-auto py-4 gap-2 transition-all hover:scale-105"
                  onClick={() => handleThemeChange(option.value)}
                  data-testid={`button-theme-${option.value}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cor do Tema */}
      <Card className="border-2 hover:border-primary/20 transition">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-500" />
            <div>
              <CardTitle className="text-lg">🎨 Cor do Tema</CardTitle>
              <CardDescription>Escolha a cor principal do aplicativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {COLOR_OPTIONS.map((option) => {
              const isSelected = colorScheme === option.value;
              return (
                <button
                  key={option.value}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all transform hover:scale-110 ${
                    isSelected ? "border-primary ring-2 ring-primary/30 scale-105" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleColorChange(option.value)}
                  data-testid={`button-color-${option.value}`}
                  title={`Clique para usar ${option.label}`}
                >
                  <div className={`w-10 h-10 rounded-full shadow-lg ${option.color}`} />
                  <span className="text-xs font-medium text-center">{option.label}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tamanho da Fonte */}
      <Card className="border-2 hover:border-primary/20 transition">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-lg">📝 Tamanho da Fonte</CardTitle>
              <CardDescription>Ajuste o tamanho do texto para melhor leitura</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {FONT_OPTIONS.map((option) => {
              const isSelected = fontSize === option.value;
              const sizeClass = option.value === "small" ? "text-sm" : option.value === "large" ? "text-lg" : "text-base";
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className="flex flex-col h-auto py-4 gap-2 transition-all hover:scale-105"
                  onClick={() => handleFontChange(option.value)}
                  data-testid={`button-font-${option.value}`}
                >
                  <span className={`font-bold ${sizeClass}`}>{option.preview}</span>
                  <span className="text-sm">{option.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">Preview: <span className={fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"}>
              Este é o tamanho de fonte selecionado
            </span></p>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card className="border-2 hover:border-primary/20 transition">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-lg">📐 Layout</CardTitle>
              <CardDescription>Ajuste o layout do aplicativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="compact-mode" className="font-medium">Modo Compacto</Label>
              <p className="text-sm text-muted-foreground">Reduz espaçamentos para exibir mais conteúdo</p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={handleCompactModeChange}
              data-testid="switch-compact-mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="border-2 hover:border-primary/20 transition">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle className="text-lg">🔔 Notificações</CardTitle>
              <CardDescription>Controle como você recebe alertas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="notifications" className="font-medium">Notificações Ativadas</Label>
              <p className="text-sm text-muted-foreground">Receba alertas de tarefas e lembretes</p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="sound" className="font-medium">Som das Notificações</Label>
              <p className="text-sm text-muted-foreground">Reproduz som ao receber alertas</p>
            </div>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              disabled={!notificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados e Privacidade */}
      <Card className="border-2 hover:border-primary/20 transition">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            <div>
              <CardTitle className="text-lg">🔒 Dados e Privacidade</CardTitle>
              <CardDescription>Gerencia seus dados e preferências</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="autosave" className="font-medium">Salvamento Automático</Label>
              <p className="text-sm text-muted-foreground">Salva suas alterações automaticamente</p>
            </div>
            <Switch
              id="autosave"
              checked={autoSaveEnabled}
              onCheckedChange={setAutoSaveEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="analytics" className="font-medium">Dados de Uso Anônimos</Label>
              <p className="text-sm text-muted-foreground">Ajuda-nos a melhorar o aplicativo</p>
            </div>
            <Switch
              id="analytics"
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <div>
              <CardTitle className="text-lg">⚡ Ações Rápidas</CardTitle>
              <CardDescription>Gerencie suas configurações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleResetSettings}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button
            variant="default"
            className="flex-1"
          >
            <Lock className="h-4 w-4 mr-2" />
            Segurança
          </Button>
        </CardContent>
      </Card>

      {/* Rodapé */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>💡 Dica: Suas configurações são salvas automaticamente</p>
      </div>
    </div>
  );
}
