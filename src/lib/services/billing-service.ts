import { getPlanLimits } from "@/lib/constants/mena-curriculum";
import type { PricingPlan, School } from "@/lib/types/database";

export interface BillingPlan {
  id: PricingPlan;
  name: string;
  price_fcfa: number;
  price_label: string;
  max_teachers: number;
  max_classes: number;
  features: string[];
  stripe_price_id: string;
}

/** Mock Stripe billing structure — ready for real Stripe integration */
export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price_fcfa: 15000,
    price_label: "15 000 FCFA/mois",
    max_teachers: 30,
    max_classes: 20,
    features: [
      "Génération automatique",
      "Export PDF",
      "Jusqu'à 20 classes",
      "Support email",
    ],
    stripe_price_id: "price_mock_starter_monthly",
  },
  {
    id: "pro",
    name: "Pro",
    price_fcfa: 35000,
    price_label: "35 000 FCFA/mois",
    max_teachers: 80,
    max_classes: 60,
    features: [
      "Tout Starter",
      "Modification drag-and-drop",
      "Multi-sites",
      "Support prioritaire",
    ],
    stripe_price_id: "price_mock_pro_monthly",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price_fcfa: 0,
    price_label: "Sur devis",
    max_teachers: 999,
    max_classes: 999,
    features: [
      "Classes illimitées",
      "API & intégrations",
      "Formation sur site",
      "SLA garanti",
    ],
    stripe_price_id: "price_mock_enterprise",
  },
];

export function getCurrentPlan(school: School): BillingPlan {
  return BILLING_PLANS.find((p) => p.id === school.plan) ?? BILLING_PLANS[0];
}

export function canAddTeacher(school: School, currentCount: number): boolean {
  const limits = getPlanLimits(school.plan);
  return currentCount < limits.max_teachers;
}

export function canAddClass(school: School, currentCount: number): boolean {
  const limits = getPlanLimits(school.plan);
  return currentCount < limits.max_classes;
}

/**
 * Mock checkout session — replace with Stripe Checkout in production.
 * POST /api/billing/checkout { planId: 'pro' }
 */
export async function createCheckoutSession(planId: PricingPlan): Promise<{
  url: string;
  session_id: string;
}> {
  return {
    url: `/dashboard/settings?upgraded=${planId}`,
    session_id: `cs_mock_${planId}_${Date.now()}`,
  };
}

export async function getSubscriptionStatus(school: School): Promise<{
  status: "active" | "trialing" | "past_due" | "canceled";
  plan: BillingPlan;
  current_period_end: string;
}> {
  const plan = getCurrentPlan(school);
  return {
    status: "active",
    plan,
    current_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  };
}
