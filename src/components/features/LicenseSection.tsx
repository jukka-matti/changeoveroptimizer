import { useState } from "react";
import { Tier, LicenseInfo } from "@/stores/license-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface LicenseSectionProps {
  tier: Tier;
  license: LicenseInfo | null;
  onActivate: (licenseData: LicenseInfo) => void;
  onDeactivate: () => void;
  isValidating: boolean;
  setValidating: (value: boolean) => void;
}

export function LicenseSection({
  tier,
  license,
  onActivate: _onActivate,
  onDeactivate,
  isValidating,
  setValidating,
}: LicenseSectionProps) {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState("");

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;

    try {
      setValidating(true);
      // TODO: Implement real Paddle license validation
      // For now, license activation is disabled until Paddle integration is complete
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: "License activation is not available yet. Please check back soon.",
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className={tier === "pro" ? "border-primary shadow-md" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown
              className={`h-5 w-5 ${tier === "pro" ? "text-primary fill-current" : ""}`}
            />
            Subscription & License
          </CardTitle>
          {tier === "pro" && (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> PRO
            </Badge>
          )}
        </div>
        <CardDescription>
          {tier === "pro"
            ? "You're currently using the Pro version."
            : "Unlock the full potential of ChangeoverOptimizer."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {tier === "pro" ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Licensed to:</span>
                <span className="font-medium">{license?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">License Key:</span>
                <span className="font-mono">
                  ••••••••-{license?.key.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Activated:</span>
                <span>
                  {license?.activatedAt
                    ? new Date(license.activatedAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/5"
                onClick={onDeactivate}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deactivate License
              </Button>
              <Button variant="outline" disabled>
                Manage Subscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 normal:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-bold">Free</h4>
                <p className="text-xs text-muted-foreground">
                  For small schedules and testing.
                </p>
                <ul className="text-xs space-y-1 pt-2">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600" /> Up to 50
                    orders
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600" /> Max 3
                    attributes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />{" "}
                    Excel/CSV Export
                  </li>
                </ul>
              </div>
              <div className="border-2 border-primary rounded-lg p-4 space-y-2 relative">
                <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  RECOMMENDED
                </div>
                <h4 className="font-bold">Pro</h4>
                <p className="text-xs text-muted-foreground">
                  For professional manufacturing planning.
                </p>
                <ul className="text-xs space-y-1 pt-2">
                  <li className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary fill-current" />{" "}
                    Unlimited orders
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary fill-current" />{" "}
                    Unlimited attributes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary fill-current" /> Custom
                    PDF Export
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-primary fill-current" /> Config
                    Templates
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="license-key">Activate License</Label>
              <div className="flex gap-2">
                <Input
                  id="license-key"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                />
                <Button
                  onClick={handleActivate}
                  disabled={isValidating || !licenseKey.trim()}
                >
                  {isValidating ? "Validating..." : "Activate"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Don't have a key?{" "}
                <a href="#" className="text-primary underline">
                  Get one at our website
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
