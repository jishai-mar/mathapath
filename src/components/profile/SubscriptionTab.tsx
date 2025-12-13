import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Check, 
  Download,
  Plus,
  Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SubscriptionTab() {
  const [currentPlan] = useState('starter');
  
  const invoices: { id: string; date: string; amount: string }[] = [];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      period: '',
      features: ['All Math Topics', 'Unlimited Practice', 'AI Feedback'],
      buttonText: 'Current Plan',
      buttonVariant: 'default' as const,
      current: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: '/mo',
      features: ['Everything in Starter', 'Priority AI Responses', 'Advanced Analytics'],
      buttonText: 'Coming Soon',
      buttonVariant: 'outline' as const,
      disabled: true,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      price: '$49',
      period: '/mo',
      features: ['Everything in Pro', '1-on-1 Tutoring (2hrs/mo)', 'Custom Learning Paths'],
      buttonText: 'Coming Soon',
      buttonVariant: 'outline' as const,
      disabled: true,
    },
  ];

  const handlePlanAction = (planId: string) => {
    if (planId === 'starter') return;
    toast.info('Premium plans coming soon!');
  };

  const handleAddPaymentMethod = () => {
    toast.info('Payment methods will be available when premium plans launch');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your billing information and subscription plan.</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-card rounded-2xl border border-border p-6 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-foreground">Free Plan</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">Active</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              You have full access to all math topics and unlimited practice with AI-powered feedback. Upgrade to Pro for advanced features.
            </p>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => toast.info('Premium plans coming soon!')}>
                Upgrade Plan
              </Button>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-foreground">Free</span>
          </div>
        </div>
      </div>

      {/* Payment Method & Billing History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
          
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No payment method on file</p>
            <Button variant="outline" onClick={handleAddPaymentMethod}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Billing History</h3>
          </div>
          
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No billing history yet</p>
              <p className="text-sm text-muted-foreground">Invoices will appear here when you upgrade</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Invoice {invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-foreground">{invoice.amount}</span>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-6">Available Plans</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-xl border p-6 ${
                plan.current 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
            >
              {plan.current && (
                <span className="absolute -top-3 right-4 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  CURRENT
                </span>
              )}
              
              <div className="mb-4">
                <p className={`text-sm ${plan.current ? 'text-primary' : 'text-muted-foreground'}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.buttonVariant}
                className={`w-full ${plan.current ? '' : plan.id === 'scholar' ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground' : ''}`}
                disabled={plan.current || plan.disabled}
                onClick={() => handlePlanAction(plan.id)}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
