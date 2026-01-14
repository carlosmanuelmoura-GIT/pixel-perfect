import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'warning' | 'success';
  className?: string;
}

const variantStyles = {
  default: 'border-border/50',
  accent: 'border-l-4 border-l-accent border-border/50',
  warning: 'border-l-4 border-l-status-warning border-border/50',
  success: 'border-l-4 border-l-status-success border-border/50',
};

export function MetricCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  trend,
  variant = 'default',
  className 
}: MetricCardProps) {
  return (
    <div className={cn(
      "metric-card animate-slide-up",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {trend && (
              <span className={cn(
                "inline-flex items-center text-xs font-medium",
                trend.isPositive ? "text-status-success" : "text-status-critical"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-muted/50">
          {icon}
        </div>
      </div>
    </div>
  );
}
