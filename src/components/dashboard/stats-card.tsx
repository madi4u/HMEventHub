import Link from 'next/link'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
    label?: string
  }
  href?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  href,
  className,
}: StatsCardProps) {
  const CardWrapper = href ? Link : 'div'

  return (
    <CardWrapper href={href ?? '#'} className={cn(href && 'cursor-pointer')}>
      <Card className={cn(
        'border-border bg-card transition-colors',
        href && 'hover:bg-accent/50',
        className
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {(description || trend) && (
            <div className="flex items-center gap-1 mt-1">
              {trend && (
                <>
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
                  )}>
                    {trend.value > 0 ? '+' : ''}{trend.value}%
                  </span>
                  {trend.label && (
                    <span className="text-xs text-muted-foreground">{trend.label}</span>
                  )}
                </>
              )}
              {description && !trend && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
