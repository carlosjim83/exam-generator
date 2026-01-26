import { Card, CardContent } from "@/components/ui/card";
import { FileText, ClipboardCheck, Zap, TrendingUp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold tracking-tight mb-2">
              {value}
            </h3>
            {change && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">{change}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${iconBgColor}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="TOTAL DOCUMENTS"
        value={128}
        change="+12% this month"
        icon={FileText}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />
      <StatCard
        title="TOTAL EXAMS"
        value={42}
        change="+5% from last term"
        icon={ClipboardCheck}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />
      <div className="relative">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  RECENT ACTIVITY
                </p>
                <h3 className="text-3xl font-bold tracking-tight mb-2">
                  Active Now
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Last edit 4 mins ago</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
