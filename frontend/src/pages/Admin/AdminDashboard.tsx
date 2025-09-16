import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, Briefcase, FileText, BarChart2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: <Users className="h-6 w-6 text-primary" />,
      change: "+12% from last month",
    },
    {
      title: "Active Clients",
      value: "89",
      icon: <Briefcase className="h-6 w-6 text-blue-500" />,
      change: "+5% from last month",
    },
    {
      title: "Pending Requests",
      value: "24",
      icon: <FileText className="h-6 w-6 text-amber-500" />,
      change: "-2% from last month",
    },
    {
      title: "Total Revenue",
      value: "$12,345",
      icon: <BarChart2 className="h-6 w-6 text-green-500" />,
      change: "+18% from last month",
    },
  ];

  return (
    <div className="space-y-6">
      <PageMeta
        title="Admin Dashboard | FillDMS"
        description="Administrative dashboard for managing users, clients, and system settings"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="h-6 w-6">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">Chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      New user registered
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2 hours ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}