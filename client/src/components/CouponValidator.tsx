import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, Percent } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CouponValidatorProps {
  onCouponApplied?: (coupon: { code: string; discount: number; description: string }) => void;
  onCouponRemoved?: () => void;
  disabled?: boolean;
}

export function CouponValidator({ 
  onCouponApplied, 
  onCouponRemoved,
  disabled = false 
}: CouponValidatorProps) {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    description: string;
  } | null>(null);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    
    try {
      const response = await apiRequest("POST", "/api/subscription/validate-coupon", {
        couponCode: couponCode.trim()
      });

      if (response?.valid) {
        const couponData = {
          code: couponCode.trim(),
          discount: response.discount || 0,
          description: response.description || "Desconto aplicado"
        };
        
        setAppliedCoupon(couponData);
        onCouponApplied?.(couponData);
        
        toast({
          title: "Cupom aplicado!",
          description: `${couponData.description}`,
        });
      } else {
        toast({
          title: "Cupom inválido",
          description: response?.message || "Este cupom não é válido ou expirou",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao validar cupom",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    onCouponRemoved?.();
    
    toast({
      title: "Cupom removido",
      description: "Desconto removido do pedido"
    });
  };

  if (appliedCoupon) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800">
                    Cupom: {appliedCoupon.code}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Percent className="w-3 h-3 mr-1" />
                    {appliedCoupon.discount}% OFF
                  </Badge>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {appliedCoupon.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeCoupon}
              disabled={disabled}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Percent className="w-4 h-4" />
            <span>Tem um cupom de desconto?</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código"
              disabled={disabled || isValidating}
              onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
              className="flex-1"
            />
            <Button
              onClick={validateCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              variant="outline"
              className="px-6"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Aplicar"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}