# TD-05: Licensing & Payments

**Paddle Subscription Integration for ChangeoverOptimizer**

---

## Purpose

This document specifies how ChangeoverOptimizer handles licensing, payments, and feature gating using Paddle as the payment processor.

---

## Business Model

### Pricing Tiers

| Tier | Price | Billing | Limits |
|------|-------|---------|--------|
| **Free** | €0 | — | 50 orders, 3 attributes |
| **Pro Monthly** | €19 | Per month | Unlimited |
| **Pro Annual** | €149 | Per year | Unlimited (Save 35%) |

### Philosophy

- **Free tier IS the trial** — No separate trial period, no credit card games
- **Cancel anytime** — No refunds needed, just stop subscribing
- **Simple pricing** — Two options, clear value

### Pro Features

| Feature | Free | Pro |
|---------|------|-----|
| Orders per file | 50 | ∞ |
| Attributes | 3 | ∞ |
| Excel export | ✅ | ✅ |
| CSV export | ✅ | ✅ |
| Clipboard copy | ✅ | ✅ |
| PDF export | ❌ | ✅ |
| Templates | ❌ | ✅ |
| Summary statistics | ❌ | ✅ |

### Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SUBSCRIPTION LIFECYCLE                                                    │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   NEW USER                                                                  │
│   ────────                                                                  │
│   Install → Free tier (50 orders, 3 attributes) → Use forever OR upgrade   │
│                              │                                              │
│                              │ (needs more capacity)                        │
│                              ▼                                              │
│                         Subscribe                                           │
│                              │                                              │
│                              ▼                                              │
│   ACTIVE SUBSCRIBER                                                         │
│   ─────────────────                                                         │
│   Pro features → Renewal → Pro continues                                    │
│                     │                                                       │
│                     │ (payment fails / cancels)                             │
│                     ▼                                                       │
│              Grace period (7 days)                                          │
│                     │                                                       │
│                     │ (still no payment)                                    │
│                     ▼                                                       │
│              Falls back to Free                                             │
│                     │                                                       │
│                     │ (resubscribes)                                        │
│                     ▼                                                       │
│              Pro restored                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SUBSCRIPTION ARCHITECTURE                                                 │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   ┌─────────────────┐          ┌─────────────────┐                         │
│   │                 │          │                 │                         │
│   │   ChangeoverOptimizer  │◀────────▶│     Paddle      │                         │
│   │   (Desktop App) │          │  (Subscriptions)│                         │
│   │                 │          │                 │                         │
│   └────────┬────────┘          └─────────────────┘                         │
│            │                                                                │
│            │ Subscription status                                            │
│            │ cached locally                                                 │
│            ▼                                                                │
│   ┌─────────────────┐                                                      │
│   │                 │                                                      │
│   │  electron-store │  Encrypted local storage                             │
│   │  (subscription) │                                                      │
│   │                 │                                                      │
│   └─────────────────┘                                                      │
│                                                                             │
│                                                                             │
│   FLOW                                                                      │
│   ─────────────────────────────────────────────────────────────────────────│
│                                                                             │
│   1. User clicks "Subscribe" → Opens Paddle checkout (browser)             │
│   2. User completes payment → Subscription active                          │
│   3. App polls Paddle API → Verifies subscription status                   │
│   4. Active → Pro features unlocked                                        │
│   5. On app start → Check cached status + verify online                    │
│   6. Subscription expires → Falls back to Free tier                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Paddle Setup

### Products Configuration

```
Paddle Products:
├── ChangeoverOptimizer Pro Monthly
│   ├── Type: Subscription
│   ├── Price: €19/month
│   ├── Product ID: pro_monthly_xxxxx
│   └── Billing: Monthly recurring
│
└── ChangeoverOptimizer Pro Annual
    ├── Type: Subscription
    ├── Price: €149/year
    ├── Product ID: pro_annual_xxxxx
    └── Billing: Annual recurring
```

---

## 2. Data Model

### Subscription Status

```typescript
// types/subscription.ts

export type Tier = 'free' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionInfo {
  tier: Tier;
  subscriptionId: string | null;
  email: string | null;
  billingCycle: BillingCycle | null;
  periodStart: string | null;
  periodEnd: string | null;
  willRenew: boolean;
  lastVerified: string;
}
```

---

## 3. Subscription Service

```typescript
// main/services/subscription-service.ts

const GRACE_PERIOD_DAYS = 7;
const VERIFICATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export async function getSubscriptionStatus(forceVerify = false): Promise<SubscriptionInfo> {
  const cached = subscriptionStore.get('subscription');
  
  // Active subscription
  if (cached?.subscriptionId) {
    const needsVerification = forceVerify || 
      Date.now() - new Date(cached.lastVerified).getTime() > VERIFICATION_INTERVAL;
    
    if (needsVerification) {
      try {
        return await verifyWithPaddle(cached.subscriptionId);
      } catch (e) {
        // Trust cache within grace period
        if (isWithinGracePeriod(cached)) {
          return { tier: 'pro', ...cached };
        }
        return getFreeStatus();
      }
    }
    return { tier: 'pro', ...cached };
  }
  
  return getFreeStatus();
}

export function openCheckout(cycle: BillingCycle): void {
  const priceId = cycle === 'monthly' ? PADDLE_MONTHLY_PRICE_ID : PADDLE_ANNUAL_PRICE_ID;
  shell.openExternal(`https://checkout.paddle.com/checkout/custom/${priceId}`);
}

export async function linkSubscription(email: string): Promise<SubscriptionValidationResult> {
  const subscription = await findSubscriptionByEmail(email);
  if (!subscription) return { valid: false, tier: 'free', error: 'NOT_FOUND' };
  
  // Store and return
  const stored = mapPaddleToStored(subscription);
  subscriptionStore.set('subscription', stored);
  return { valid: true, tier: 'pro', subscription: stored };
}

export async function openCustomerPortal(): Promise<void> {
  const cached = subscriptionStore.get('subscription');
  if (!cached?.subscriptionId) throw new Error('No subscription');
  
  const portalUrl = await getPortalUrl(cached.subscriptionId);
  shell.openExternal(portalUrl);
}
```

---

## 4. Zustand Store

```typescript
// stores/subscription-store.ts

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  email: null,
  billingCycle: null,
  periodEnd: null,
  isLoading: true,
  error: null,
  
  initialize: async () => {
    const status = await window.api.getSubscriptionStatus();
    set({
      tier: status.tier,
      email: status.email,
      billingCycle: status.billingCycle,
      periodEnd: status.periodEnd,
      isLoading: false,
    });
  },
  
  openCheckout: (cycle) => window.api.openCheckout(cycle),
  
  linkSubscription: async (email) => {
    const result = await window.api.linkSubscription(email);
    if (result.valid) set({ tier: 'pro', email });
    return result.valid;
  },
  
  isPro: () => get().tier === 'pro',
  
  checkOrderLimit: (count) => get().isPro() || count <= 50,
  checkAttributeLimit: (count) => get().isPro() || count <= 3,
}));

// Selectors
export const useIsPro = () => useSubscriptionStore((s) => s.tier === 'pro');
export const useTier = () => useSubscriptionStore((s) => s.tier);
```

---

## 5. UI Components

### Upgrade Modal

Shows pricing options when user hits a limit:

```typescript
// components/modals/UpgradeModal.tsx

export function UpgradeModal({ open, onClose, trigger }: UpgradeModalProps) {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('annual');
  const { openCheckout } = useSubscriptionStore();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            {trigger === 'orders' && 'Your file has more than 50 orders.'}
            {trigger === 'attributes' && 'You need more than 3 attributes.'}
            {' '}Upgrade for unlimited capacity.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Pro features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Unlimited orders</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Unlimited attributes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>PDF export</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Save & load templates</span>
            </div>
          </div>
          
          {/* Pricing options */}
          <RadioGroup value={selectedCycle} onValueChange={setSelectedCycle}>
            <Label className={cn(
              "flex items-center justify-between p-4 border rounded-lg cursor-pointer",
              selectedCycle === 'annual' && "border-primary bg-primary/5"
            )}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="annual" />
                <div>
                  <div className="font-medium">Annual — €149/year</div>
                  <div className="text-sm text-muted-foreground">€12.42/month</div>
                </div>
              </div>
              <Badge className="bg-green-600">Save 35%</Badge>
            </Label>
            
            <Label className={cn(
              "flex items-center justify-between p-4 border rounded-lg cursor-pointer",
              selectedCycle === 'monthly' && "border-primary bg-primary/5"
            )}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="monthly" />
                <div>
                  <div className="font-medium">Monthly — €19/month</div>
                  <div className="text-sm text-muted-foreground">Cancel anytime</div>
                </div>
              </div>
            </Label>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Maybe later</Button>
          <Button onClick={() => { openCheckout(selectedCycle); onClose(); }}>
            Subscribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Subscription Status (Settings)

```typescript
// components/features/SubscriptionStatus.tsx

export function SubscriptionStatus() {
  const { tier, email, billingCycle, periodEnd, openCheckout, openPortal } = useSubscriptionStore();
  const [showLink, setShowLink] = useState(false);
  
  // Pro subscriber
  if (tier === 'pro') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600">Pro</Badge>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {billingCycle === 'annual' ? 'Annual' : 'Monthly'} •
          {periodEnd && <> Renews {new Date(periodEnd).toLocaleDateString()}</>}
        </div>
        
        <Button variant="outline" size="sm" onClick={openPortal}>
          Manage Subscription
        </Button>
      </div>
    );
  }
  
  // Free user
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Free</Badge>
        <span className="text-sm text-muted-foreground">
          50 orders, 3 attributes
        </span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => openCheckout('annual')}>
          Upgrade — €149/year
          <Badge className="ml-2 bg-green-600">Save 35%</Badge>
        </Button>
        <Button variant="outline" onClick={() => setShowLink(true)}>
          I already subscribed
        </Button>
      </div>
      
      <LinkSubscriptionModal open={showLink} onClose={() => setShowLink(false)} />
    </div>
  );
}
```

---

## 6. Feature Gating

```typescript
// components/features/ProFeatureGate.tsx

interface ProFeatureGateProps {
  children: React.ReactNode;
  trigger: 'orders' | 'attributes' | 'pdf' | 'templates';
}

export function ProFeatureGate({ children, trigger }: ProFeatureGateProps) {
  const isPro = useSubscriptionStore((s) => s.tier === 'pro');
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  if (isPro) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <Button onClick={() => setShowUpgrade(true)}>
          <Lock className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </Button>
      </div>
      
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        trigger={trigger}
      />
    </div>
  );
}
```

### Limit Checks

```typescript
// hooks/useFeatureCheck.ts

export function useFeatureCheck() {
  const { checkOrderLimit, checkAttributeLimit, tier } = useSubscriptionStore();
  const orderCount = useDataStore((s) => s.sourceFile?.rowCount ?? 0);
  const attributeCount = useDataStore((s) => s.config.attributes.length);
  
  return {
    isWithinOrderLimit: checkOrderLimit(orderCount),
    isWithinAttributeLimit: checkAttributeLimit(attributeCount),
    canUsePdf: tier === 'pro',
    canUseTemplates: tier === 'pro',
    orderCount,
    attributeCount,
  };
}
```

---

## 7. Summary

### Pricing

| Plan | Price | Annual Equivalent |
|------|-------|-------------------|
| Monthly | €19/month | €228/year |
| Annual | €149/year | €12.42/month |
| **Savings** | | **35%** |

### Free Tier Limits

| Limit | Value | Upgrade Trigger |
|-------|-------|-----------------|
| Orders | 50 | Import file with >50 rows |
| Attributes | 3 | Try to add 4th attribute |

### User Flows

| Flow | Steps |
|------|-------|
| **New User** | Install → Free tier → Use (50 orders, 3 attr) → Hit limit → Subscribe |
| **Direct Subscribe** | Free → Subscribe → Pro |
| **Manage** | Pro → Customer Portal → Update/Cancel |
| **Lapsed** | Pro → Payment fails → 7-day grace → Free |
| **Resubscribe** | Free → Subscribe → Pro restored |

### Key Components

| Component | Purpose |
|-----------|---------|
| `subscription-service.ts` | Paddle API, status management |
| `subscription-store.ts` | Zustand state |
| `UpgradeModal` | Pricing options |
| `SubscriptionStatus` | Current plan in settings |
| `ProFeatureGate` | Lock features |
| `useFeatureCheck` | Check limits |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2024-12-20 | Initial (one-time €99) |
| 0.2 | 2024-12-20 | Subscription model: €19/mo, €149/yr |
| 0.3 | 2024-12-20 | Simplified: no trial, no refunds, 3 attributes |

---

*Simple model: Free tier IS the trial. Cancel anytime. Paddle handles billing.*
