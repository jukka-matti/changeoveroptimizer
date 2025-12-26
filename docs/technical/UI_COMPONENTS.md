# TD-04: UI Components

**React Component Library for ChangeoverOptimizer**

---

## Purpose

This document specifies the React components needed for ChangeoverOptimizer MVP and V1.0, mapping UX wireframes (UX-04) to concrete implementations using shadcn/ui + Tailwind CSS 4.

---

## Component Overview

### shadcn/ui Components (Install)

```bash
npx shadcn@latest add button card dialog input select table progress toast badge tooltip dropdown-menu checkbox radio-group label
```

### Custom Components (Build)

| Component | Purpose | Screen(s) |
|-----------|---------|-----------|
| `AppShell` | Layout wrapper | All |
| `Header` | Top bar with steps | All |
| `Footer` | Navigation buttons | All except Welcome |
| `FileDropzone` | Drag-and-drop file input | Welcome |
| `DataTable` | Preview data rows | Data Preview |
| `ColumnSelector` | Map columns | Column Mapping |
| `AttributeList` | Configure changeover times | Changeover Config |
| `ResultsCard` | Show savings metrics | Results |
| `SequenceTable` | Optimized order list | Results |
| `ExportOptions` | Format selection | Export |

---

## 1. Layout Components

### Application Layout

The app uses a **sidebar navigation pattern** with a flexible content area:

```
┌──────────┬──────────────────────────────────────────────────────────────────┐
│   [CO]   │                                                                  │
│ Optimizer│  Header: App Title                                       [Info]  │
│          ├──────────────────────────────────────────────────────────────────┤
│  ○ Home  │  Progress Stepper (only during workflow)                         │
│  ● Optim ├──────────────────────────────────────────────────────────────────┤
│  ○ SMED  │                                                                  │
│  ○ Stats │  Main Content Area                                               │
│          │                                                                  │
├──────────┤                                                                  │
│  ⚙ Set   │  Footer                                                          │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

### ScreenContainer

Main layout wrapper that combines sidebar, header, and content.

```tsx
// components/layout/ScreenContainer.tsx

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const { currentScreen, navigateTo } = useAppStore();
  const showStepper = isWorkflowScreen(currentScreen);

  return (
    <div className="flex min-h-screen min-w-[800px]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        {showStepper && <ProgressStepper currentStep={currentScreen} />}
        <main className="flex-1 py-8">
          <div className="max-w-container-normal mx-auto px-6">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
```

**Specs:**
- Sidebar: Fixed 200px width
- Content area: Flexible width
- Min app width: 800px
- Progress stepper: Shown only for workflow screens

### Sidebar

Enterprise-grade navigation sidebar with module links.

```tsx
// components/layout/Sidebar.tsx

const mainNavItems = [
  { id: "home", label: "Home", icon: Home, screen: "welcome" },
  { id: "optimizer", label: "Optimizer", icon: LineChart, screen: "data-preview" },
  { id: "smed", label: "SMED", icon: ClipboardList, screen: "smed" },
  { id: "analytics", label: "Analytics", icon: BarChart3, screen: "analytics" },
];

export function Sidebar() {
  const { currentScreen, navigateTo } = useAppStore();

  return (
    <aside className="w-[200px] border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Logo and Brand */}
      <div className="p-4 border-b">
        <Logo size="md" onClick={() => navigateTo("welcome")} />
        <span className="font-semibold">Optimizer</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {mainNavItems.map((item) => (
          <NavItemButton key={item.id} item={item} />
        ))}
      </nav>

      {/* Settings (bottom) */}
      <div className="p-3 border-t">
        <NavItemButton item={{ id: "settings", label: "Settings", icon: Settings }} />
      </div>
    </aside>
  );
}
```

**Specs:**
- Fixed 200px width
- Full viewport height, sticky positioning
- Logo at top (clickable to go home)
- Main nav items with icons
- Settings separated at bottom
- Active state: `bg-primary/10 text-primary border-l-2 border-primary`

### Logo

Brand mark component with size variants.

```tsx
// components/ui/logo.tsx

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';  // 24px, 32px, 48px
  onClick?: () => void;
}

export function Logo({ size = "md", onClick }: LogoProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-primary flex items-center justify-center
                 text-primary-foreground font-bold shadow-md
                 hover:scale-105 transition-transform"
    >
      CO
    </button>
  );
}
```

**Specs:**
- Sizes: sm (24px), md (32px), lg (48px)
- Primary blue background, white text
- Rounded corners, subtle shadow
- Click to navigate home

### Header

Simplified header with app title and info button.

```tsx
// components/layout/Header.tsx

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur h-14">
      <div className="flex items-center justify-between px-6">
        <span className="font-semibold text-lg text-muted-foreground">
          ChangeoverOptimizer
        </span>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          {/* About dialog content */}
        </Dialog>
      </div>
    </header>
  );
}
```

**Specs:**
- Height: 56px (h-14)
- App title on left (muted text)
- Info button on right (opens about dialog)
- Navigation handled by sidebar (not in header)

### ProgressStepper

Visual progress through the 5-step optimization workflow.

```tsx
// components/ui/progress-stepper.tsx

const WORKFLOW_STEPS = [
  { id: "data-preview", label: "Preview Data" },
  { id: "column-mapping", label: "Map Columns" },
  { id: "changeover-config", label: "Configure" },
  { id: "results", label: "Results" },
  { id: "export", label: "Export" },
];

export function ProgressStepper({ currentStep, onStepClick }) {
  return (
    <div className="border-b bg-muted/30 py-4">
      {WORKFLOW_STEPS.map((step, i) => (
        <button
          key={step.id}
          onClick={() => isCompleted && onStepClick(step.id)}
          disabled={!isCompleted}
        >
          <div className={cn(
            "w-8 h-8 rounded-full",
            isCompleted && "bg-primary text-primary-foreground",
            isCurrent && "ring-2 ring-primary/30",
            isFuture && "bg-muted text-muted-foreground"
          )}>
            {isCompleted ? <Check /> : index + 1}
          </div>
          <span>{step.label}</span>
        </button>
      ))}
    </div>
  );
}
```

**Specs:**
- Shows only for workflow screens
- Clickable completed steps (allows going back)
- Current step has ring highlight
- Connecting lines between steps

### Footer

Copyright and links at bottom of content area.

```tsx
// components/layout/Footer.tsx

export function Footer() {
  return (
    <footer className="border-t py-4 text-center text-sm text-muted-foreground">
      © 2024 RDMAIC Oy | Privacy | Support | v1.0.0
    </footer>
  );
}
```

---

## 2. Feature Components

### FileDropzone

Drag-and-drop file upload for Welcome screen.

```tsx
// components/features/FileDropzone.tsx

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function FileDropzone({ onFileSelected, disabled }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };
  
  const handleClick = () => inputRef.current?.click();
  
  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={cn(
        "w-full max-w-md h-48 border-2 border-dashed rounded-xl",
        "flex flex-col items-center justify-center gap-3 cursor-pointer",
        "transition-colors",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-muted-foreground/25 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Upload className={cn(
        "h-10 w-10",
        isDragging ? "text-primary" : "text-muted-foreground"
      )} />
      
      <div className="text-center">
        <p className="font-medium">Drop your file here</p>
        <p className="text-sm text-muted-foreground">
          or click to browse (.xlsx, .csv)
        </p>
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => e.target.files?.[0] && onFileSelected(e.target.files[0])}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
```

**Behavior:**
- Visual feedback on drag over
- Click to open file picker
- Accepts: .xlsx, .xls, .csv
- Disabled state for loading

### DataTable

Preview table for imported data.

```tsx
// components/features/DataTable.tsx

interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  maxRows?: number;
  highlightColumn?: string;
}

export function DataTable({ columns, rows, maxRows = 10, highlightColumn }: DataTableProps) {
  const displayRows = rows.slice(0, maxRows);
  
  return (
    <div className="border rounded-lg overflow-auto max-h-80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            {columns.map((col) => (
              <TableHead
                key={col}
                className={cn(highlightColumn === col && "bg-primary/10")}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="text-center text-muted-foreground">
                {i + 1}
              </TableCell>
              {columns.map((col) => (
                <TableCell
                  key={col}
                  className={cn(highlightColumn === col && "bg-primary/5")}
                >
                  {String(row[col] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {rows.length > maxRows && (
        <div className="p-2 text-center text-sm text-muted-foreground border-t">
          Showing {maxRows} of {rows.length} rows
        </div>
      )}
    </div>
  );
}
```

### ColumnSelector

Dropdown for selecting columns (Order ID, attributes).

```tsx
// components/features/ColumnSelector.tsx

interface ColumnSelectorProps {
  label: string;
  description?: string;
  columns: string[];
  value: string | null;
  onChange: (value: string) => void;
  excludeColumns?: string[];
  placeholder?: string;
}

export function ColumnSelector({
  label,
  description,
  columns,
  value,
  onChange,
  excludeColumns = [],
  placeholder = "Select column..."
}: ColumnSelectorProps) {
  const availableColumns = columns.filter(c => !excludeColumns.includes(c));
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableColumns.map((col) => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### AttributeList

Configure changeover times for selected attributes.

```tsx
// components/features/AttributeList.tsx

interface AttributeListProps {
  attributes: AttributeConfig[];
  onUpdateTime: (column: string, time: number) => void;
  onRemove: (column: string) => void;
}

export function AttributeList({ attributes, onUpdateTime, onRemove }: AttributeListProps) {
  return (
    <div className="space-y-3">
      {attributes.map((attr, index) => (
        <div
          key={attr.column}
          className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
        >
          <span className="text-muted-foreground w-6 text-center">
            {index + 1}
          </span>
          
          <div className="flex-1 font-medium">{attr.column}</div>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={9999}
              value={attr.changeoverTime}
              onChange={(e) => onUpdateTime(attr.column, parseInt(e.target.value) || 1)}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground w-8">min</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(attr.column)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      {attributes.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No attributes selected. Add columns that cause changeovers.
        </p>
      )}
    </div>
  );
}
```

### ResultsCard

Display key metrics on Results screen.

```tsx
// components/features/ResultsCard.tsx

interface ResultsCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  variant?: 'default' | 'highlight';
  badge?: string;
}

export function ResultsCard({ label, value, suffix, variant = 'default', badge }: ResultsCardProps) {
  return (
    <Card className={cn(
      variant === 'highlight' && "bg-green-50 dark:bg-green-950 border-green-200"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          variant === 'highlight' ? "text-green-600" : "text-muted-foreground"
        )}>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-2xl font-bold",
            variant === 'highlight' && "text-green-600"
          )}>
            {value}{suffix}
          </span>
          {badge && (
            <Badge variant="outline" className={cn(
              variant === 'highlight' && "border-green-600 text-green-600"
            )}>
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Usage:**
```tsx
<div className="grid grid-cols-3 gap-4">
  <ResultsCard label="Before" value={120} suffix=" min" />
  <ResultsCard label="After" value={45} suffix=" min" />
  <ResultsCard 
    label="Savings" 
    value={75} 
    suffix=" min" 
    badge="63%"
    variant="highlight" 
  />
</div>
```

### SequenceTable

Display optimized order sequence.

```tsx
// components/features/SequenceTable.tsx

interface SequenceTableProps {
  orders: OptimizedOrder[];
  showChangeover?: boolean;
}

export function SequenceTable({ orders, showChangeover = true }: SequenceTableProps) {
  const columns = orders[0] ? Object.keys(orders[0].values) : [];
  
  return (
    <div className="border rounded-lg overflow-auto max-h-96">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Order ID</TableHead>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
            {showChangeover && (
              <>
                <TableHead className="text-right">Changeover</TableHead>
                <TableHead>Changed</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="text-center font-medium">
                {order.sequenceNumber}
              </TableCell>
              <TableCell className="font-mono text-sm">{order.id}</TableCell>
              {columns.map((col) => (
                <TableCell key={col}>{order.values[col]}</TableCell>
              ))}
              {showChangeover && (
                <>
                  <TableCell className="text-right">
                    {order.changeoverTime > 0 ? (
                      <span className="text-orange-600">{order.changeoverTime} min</span>
                    ) : (
                      <span className="text-green-600">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.changeoverReasons.join(', ') || '—'}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### ExportOptions

Format selection for export.

```tsx
// components/features/ExportOptions.tsx

interface ExportOptionsProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  includeOriginal: boolean;
  onIncludeOriginalChange: (value: boolean) => void;
  includeSummary: boolean;
  onIncludeSummaryChange: (value: boolean) => void;
  isPro: boolean;
}

export function ExportOptions({
  format,
  onFormatChange,
  includeOriginal,
  onIncludeOriginalChange,
  includeSummary,
  onIncludeSummaryChange,
  isPro,
}: ExportOptionsProps) {
  return (
    <div className="space-y-6">
      {/* Format selection */}
      <RadioGroup value={format} onValueChange={onFormatChange}>
        <div className="grid grid-cols-2 gap-3">
          <Label
            htmlFor="xlsx"
            className={cn(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer",
              format === 'xlsx' && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="xlsx" id="xlsx" />
            <FileSpreadsheet className="h-5 w-5" />
            <div>
              <div className="font-medium">Excel</div>
              <div className="text-sm text-muted-foreground">.xlsx</div>
            </div>
          </Label>
          
          <Label
            htmlFor="csv"
            className={cn(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer",
              format === 'csv' && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="csv" id="csv" />
            <FileText className="h-5 w-5" />
            <div>
              <div className="font-medium">CSV</div>
              <div className="text-sm text-muted-foreground">.csv</div>
            </div>
          </Label>
          
          <Label
            htmlFor="pdf"
            className={cn(
              "flex items-center gap-3 p-4 border rounded-lg",
              !isPro && "opacity-50 cursor-not-allowed",
              isPro && "cursor-pointer",
              format === 'pdf' && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="pdf" id="pdf" disabled={!isPro} />
            <FileText className="h-5 w-5" />
            <div>
              <div className="font-medium">
                PDF {!isPro && <Badge variant="secondary" className="ml-2">Pro</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">.pdf</div>
            </div>
          </Label>
          
          <Label
            htmlFor="clipboard"
            className={cn(
              "flex items-center gap-3 p-4 border rounded-lg cursor-pointer",
              format === 'clipboard' && "border-primary bg-primary/5"
            )}
          >
            <RadioGroupItem value="clipboard" id="clipboard" />
            <Copy className="h-5 w-5" />
            <div>
              <div className="font-medium">Clipboard</div>
              <div className="text-sm text-muted-foreground">Paste to Excel</div>
            </div>
          </Label>
        </div>
      </RadioGroup>
      
      {/* Options */}
      {format !== 'clipboard' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-original"
              checked={includeOriginal}
              onCheckedChange={onIncludeOriginalChange}
            />
            <Label htmlFor="include-original">Include original data sheet</Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-summary"
              checked={includeSummary}
              onCheckedChange={onIncludeSummaryChange}
              disabled={!isPro}
            />
            <Label htmlFor="include-summary">
              Include summary statistics
              {!isPro && <Badge variant="secondary" className="ml-2">Pro</Badge>}
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
```

### FirstTimeHint

Dismissible hint banner for first-time users on key screens.

```tsx
// components/ui/first-time-hint.tsx

interface FirstTimeHintProps {
  hintKey: string;     // Unique key for localStorage persistence
  message: string;     // Hint message to display
}

export function FirstTimeHint({ hintKey, message }: FirstTimeHintProps) {
  const { showHint, dismissHint } = useFirstTimeHint(hintKey);

  if (!showHint) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <p className="flex-1 text-muted-foreground">{message}</p>
      <Button variant="ghost" size="sm" onClick={dismissHint}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
```

**Usage:**
```tsx
<FirstTimeHint
  hintKey="welcome"
  message="Import your production schedule (Excel or CSV) to get started."
/>
```

**Screens with Hints:**
- WelcomeScreen: "Import your production schedule..."
- ColumnMappingScreen: "Select the column that identifies each order..."
- ChangeoverConfigScreen: "Enter how long each type of change takes..."

**Behavior:**
- Shows on first visit (localStorage: `hint_dismissed_{key}`)
- Dismiss button persists dismissal permanently
- Lightbulb icon, subtle primary-tinted background

---

## 3. Modal Components

### UpgradeModal

Prompt to upgrade when hitting free tier limits.

```tsx
// components/modals/UpgradeModal.tsx

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
}

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            {feature} is a Pro feature. Upgrade to unlock unlimited access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Unlimited orders (Free: 50)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Unlimited attributes (Free: 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>PDF export</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Save & load templates</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Summary statistics</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold">€19<span className="text-lg font-normal">/mo</span></div>
            <div className="text-sm text-muted-foreground">or €149/year (save 35%)</div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Maybe later</Button>
          <Button onClick={() => window.open('https://changeoveroptimizer.com/buy')}>
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### SettingsModal

Application settings.

```tsx
// components/modals/SettingsModal.tsx

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language, theme, setLanguage, setTheme } = useSettingsStore();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fi">Suomi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex gap-4">
                <Label className="flex items-center gap-2">
                  <RadioGroupItem value="light" />
                  Light
                </Label>
                <Label className="flex items-center gap-2">
                  <RadioGroupItem value="dark" />
                  Dark
                </Label>
                <Label className="flex items-center gap-2">
                  <RadioGroupItem value="system" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. Component Index

### By Screen

| Screen | Components Used |
|--------|-----------------|
| **Welcome** | FileDropzone, RecentFilesList, FirstTimeHint |
| **Data Preview** | DataTable, Alert (for warnings) |
| **Column Mapping** | ColumnSelector, Badge (selected attrs), FirstTimeHint |
| **Changeover Config** | AttributeList, FirstTimeHint |
| **Optimizing** | Progress, Loader |
| **Results** | ResultsCard (×3), SequenceTable |
| **Export** | ExportOptions, Button |

### By Type

| Type | Components |
|------|------------|
| **shadcn/ui** | Button, Card, Dialog, Input, Select, Table, Progress, Toast, Badge, Tooltip, Checkbox, RadioGroup, Label |
| **Layout** | ScreenContainer, Sidebar, Header, Footer, ProgressStepper, Logo |
| **Features** | FileDropzone, DataTable, ColumnSelector, AttributeList, ResultsCard, SequenceTable, ExportOptions, FirstTimeHint |
| **Modals** | SettingsModal, UpgradeModal, AboutModal |

---

## 5. Styling Notes

### Tailwind CSS 4 Classes Used

```css
/* Layout */
.flex .flex-col .items-center .justify-between .gap-4

/* Sizing */
.h-14 .w-full .max-w-4xl .max-h-80

/* Spacing */
.p-4 .px-6 .py-8 .space-y-4

/* Borders */
.border .border-2 .border-dashed .rounded-lg .rounded-xl

/* Colors */
.bg-background .bg-muted .bg-primary/5 .text-primary .text-muted-foreground

/* States */
.hover:border-primary .disabled:opacity-50 .cursor-pointer .cursor-not-allowed

/* Responsive */
.hidden .md:inline .grid-cols-1 .md:grid-cols-3
```

### Color Usage

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | white | slate-950 |
| Muted | slate-100 | slate-800 |
| Primary | blue-600 | blue-500 |
| Success | green-600 | green-500 |
| Warning | amber-500 | amber-400 |
| Error | red-600 | red-500 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-20 | Initial component specifications |
| 0.2 | 2024-12-26 | Added sidebar navigation layout, Logo, Sidebar components |
| 0.3 | 2024-12-27 | Added FirstTimeHint component for onboarding hints |

---

*Components are implemented using shadcn/ui primitives + custom feature components. See UX-04 for wireframes and UX-06 for design system.*
