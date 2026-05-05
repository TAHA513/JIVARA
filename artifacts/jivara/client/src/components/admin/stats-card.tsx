import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
  gradient: string;
}

export default function StatsCard({ title, value, change, changeType, icon, gradient }: StatsCardProps) {
  return (
    <Card className="admin-card overflow-hidden">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-r ${gradient} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm arabic-text">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              <div className="flex items-center gap-1 mt-2">
                {changeType === "positive" ? (
                  <TrendingUp className="w-4 h-4 text-white/80" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-white/80" />
                )}
                <span className="text-white/80 text-sm">
                  {change} من الشهر الماضي
                </span>
              </div>
            </div>
            <div className="text-white/60">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
