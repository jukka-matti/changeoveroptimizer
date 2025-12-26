import { useAppStore } from '@/stores/app-store';
import { useLicenseStore } from '@/stores/license-store';
import { useSettingsStore, Theme } from '@/stores/settings-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LicenseSection } from '@/components/features/LicenseSection';
import {
  Moon,
  Sun,
  Monitor,
  Languages,
  Clock,
  ChevronRight,
} from 'lucide-react';

export function SettingsScreen() {
  const { navigateTo } = useAppStore();
  const { tier, license, setLicense, clearLicense, isValidating, setValidating } = useLicenseStore();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-fluid-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-fluid-base text-muted-foreground">Manage your app preferences and subscription.</p>
      </div>

      <div className="grid gap-8">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <RadioGroup 
                value={theme} 
                onValueChange={(v) => setTheme(v as Theme)}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                    <Sun className="h-4 w-4" /> Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="h-4 w-4" /> Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4" /> System
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full max-w-[200px]">
                  <Languages className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fi">Suomi (Coming Soon)</SelectItem>
                  <SelectItem value="de">Deutsch (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* License */}
        <LicenseSection
          tier={tier}
          license={license}
          onActivate={setLicense}
          onDeactivate={clearLicense}
          isValidating={isValidating}
          setValidating={setValidating}
        />

        {/* Changeover Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Changeover Times
            </CardTitle>
            <CardDescription>
              Define specific changeover times between product values for more accurate optimization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigateTo('changeover-matrix')}
            >
              <span>Edit Changeover Times</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
