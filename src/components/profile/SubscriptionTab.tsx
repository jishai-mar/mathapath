import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Check, 
  Download,
  Plus,
  Pencil,
  HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionTab() {
  const [currentPlan] = useState('pro');
  
  const invoices = [
    { id: '#0024', date: 'Sep 24, 2023', amount: '$29.00' },
    { id: '#0023', date: 'Aug 24, 2023', amount: '$29.00' },
    { id: '#0022', date: 'Jul 24, 2023', amount: '$29.00' },
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      period: '',
      features: ['Basic Algebra', '5 Practice Problems/day'],
      buttonText: 'Downgrade',
      buttonVariant: 'outline' as const,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: '/mo',
      features: ['Everything in Starter', 'Calculus I & II', 'Unlimited Practice'],
      buttonText: 'Current Plan',
      buttonVariant: 'default' as const,
      current: true,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      price: '$49',
      period: '/mo',
      features: ['Everything in Pro', '1-on-1 Tutoring (2hrs/mo)', 'Advanced Linear Algebra'],
      buttonText: 'Upgrade',
      buttonVariant: 'outline' as const,
    },
  ];

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
              <h3 className="text-xl font-bold text-foreground">Pro Plan</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">Active</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              You have full access to all calculus, linear algebra, and discrete math modules. Your next billing date is <strong className="text-foreground">October 24, 2023</strong>.
            </p>
            <div className="flex gap-3 mt-4">
              <Button>Change Plan</Button>
              <Button variant="outline">Cancel Subscription</Button>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-foreground">$29</span>
            <span className="text-muted-foreground">/mo</span>
          </div>
        </div>
      </div>

      {/* Payment Method & Billing History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
          
          <div className="flex items-center justify-between p-4 rounded-lg border border-border mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center">
                <div className="flex">
                  <div className="w-4 h-4 rounded-full bg-red-600 -mr-1" />
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">Mastercard ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expiry 12/24</p>
              </div>
            </div>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <Button variant="ghost" className="text-primary hover:text-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        {/* Billing History */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Billing History</h3>
            <Button variant="link" className="text-primary p-0">View All</Button>
          </div>
          
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
                disabled={plan.current}
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
