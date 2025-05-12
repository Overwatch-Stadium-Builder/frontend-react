import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Loader2, Wifi, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExternalLinkConfirm from "@/components/ExternalLinkConfirm";

type Monitor = {
  id: number;
  name: string;
  endpoint: string;
};

type HeartbeatData = {
  time: string;
  ping: number;
};

type MonitorData = {
  name: string;
  heartbeats: HeartbeatData[];
};

const Status = () => {
  // Fetch all monitor info (ids and names)
  const { data: monitorInfo } = useQuery({
    queryKey: ["monitor-info"],
    queryFn: async () => {
      const res = await fetch("https://owapi.luciousdev.nl/api/status/monitors");
      if (!res.ok) throw new Error("Failed to fetch monitor info");
      const data = await res.json();
      return data.monitors as Monitor[];
    },
  });

  // Fetch ping data for all monitors
  const { data: pingData, isLoading, isError, error } = useQuery({
    queryKey: ["ping-data"],
    queryFn: async () => {
      const res = await fetch("https://owapi.luciousdev.nl/api/status/ping");
      if (!res.ok) throw new Error("Failed to fetch ping data");
      const data = await res.json();
      return {
        ...data,
        last_updated: new Date().toISOString(),
      };
    },
    refetchInterval: 1000 * 60 * 1, // Refresh every minute
  });

  // Fetch health status of services
  const { data: healthData } = useQuery({
    queryKey: ["health-data"],
    queryFn: async () => {
      const res = await fetch("https://owapi.luciousdev.nl/api/health");
      if (!res.ok) throw new Error("Failed to fetch health data");
      return res.json();
    },
    refetchInterval: 1000 * 60 * 1, // Refresh every minute
  });

  const formatTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), "HH:mm");
    } catch {
      return timestamp;
    }
  };

  const getServiceStatus = (key: string) => {
    const value = healthData?.[key];
    return value === "connected" || value === "available" || typeof value === "string";
  };

  const serviceKeys = ["api", "database", "frontend", "redis"];

  const totalServices = serviceKeys.length;
  const operationalCount = serviceKeys.filter(getServiceStatus).length;

  let overallStatusMessage = "Checking system status...";
  let overallStatusColor = "bg-gray-500";

  if (operationalCount === totalServices) {
    overallStatusMessage = "✅ All systems operational";
    overallStatusColor = "bg-green-600";
  } else if (operationalCount === 0) {
    overallStatusMessage = "❌ All services are down";
    overallStatusColor = "bg-red-600";
  } else {
    overallStatusMessage = "⚠️ Some services are experiencing issues";
    overallStatusColor = "bg-yellow-500";
  }

  const renderStatus = (label: string, key: string) => {
    const isUp = getServiceStatus(key);
    const pulseColor = isUp ? "bg-green-500" : "bg-red-500";

    return (
      <div key={key} className="flex items-center justify-between">
        <span>{label}</span>
        <span className="flex items-center">
          <span
            className={`relative h-2 w-2 mr-2 rounded-full ${pulseColor} animate-pulse`}
          >
            <span
              className={`absolute inset-0 rounded-full opacity-50 ${pulseColor} animate-ping`}
            />
          </span>
          {isUp ? "Operational" : "Down"}
        </span>
      </div>
    );
  };

  // Create tabs for each monitor
  const renderMonitorTabs = () => {
    if (!monitorInfo || !pingData?.data) return null;
    
    return (
      <Tabs defaultValue={(monitorInfo[0]?.id || "13").toString()} className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          {monitorInfo.map((monitor) => (
            <TabsTrigger key={monitor.id} value={monitor.id.toString()} className="mb-1">
              {monitor.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {monitorInfo.map((monitor) => {
          const monitorData = pingData.data[monitor.id];
          const heartbeats = monitorData?.heartbeats || [];
          
          return (
            <TabsContent key={monitor.id} value={monitor.id.toString()}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Endpoint: {monitor.endpoint}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2">Loading ping data...</span>
                    </div>
                  ) : isError ? (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {(error as Error).message || "Failed to load ping data"}
                      </AlertDescription>
                    </Alert>
                  ) : !heartbeats.length ? (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Data</AlertTitle>
                      <AlertDescription>
                        No ping data available for this monitor.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ChartContainer
                      config={{
                        ping: {
                          label: "Ping",
                          color: "#F97316"
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={heartbeats}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            tickFormatter={formatTime}
                            tick={{ fontSize: 12 }}
                            interval={4} // Show ticks every 5 minutes
                          />
                          <YAxis
                            label={{ value: "Ping (ms)", angle: -90, position: "insideLeft" }}
                            tick={{ fontSize: 12 }}
                          />
                          <CartesianGrid vertical={true} strokeDasharray="3 3" />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent formatter={(value) => `${value}ms`} />
                            }
                          />
                          <Line
                            type="linear"
                            dataKey="ping"
                            stroke="var(--color-ping)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    );
  };

  return (
    <div className="container-fluid mx-auto py-8 px-4">
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="info" style={{ marginBottom: "1rem" }}>
        <div className="container mx-auto px-4">
          <p className="font-bold">INFO</p>
          <p>
            Would you like to use our API in your own project? Reach out to us via our <a
              href="https://discord.gg/yHQEugWXWg"
              className="font-semibold underline text-blue-800 hover:text-blue-600"
            >
              Discord server
            </a>. Also check out our <a
              href="https://owapi.luciousdev.nl/api/docs"
              className="font-semibold underline text-blue-800 hover:text-blue-600"
            >
            swagger
            </a> for more information about the available endpoints.
          </p>
        </div>
      </div>
      {/* System banner */}
      <div
        className={`text-white text-center py-2 px-4 rounded mb-6 font-medium shadow ${overallStatusColor}`}
      >
        {overallStatusMessage}
      </div>

      <h1 className="text-4xl font-bold mb-8">System Status</h1>

      {/* Ping charts for multiple monitors */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            API Endpoint Status
          </CardTitle>
          <CardDescription>
            Ping response times over the last few hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderMonitorTabs()}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Last updated:{" "}
            {pingData?.last_updated
              ? format(parseISO(pingData.last_updated), "PPpp")
              : "N/A"}
          </p>
        </CardFooter>
      </Card>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>Current status of our services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renderStatus("API Endpoint", "api")}
            {renderStatus("Database", "database")}
            {renderStatus("Authentication", "frontend")}
            {renderStatus("Redis", "redis")}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Last updated:{" "}
            {pingData?.last_updated
              ? format(parseISO(pingData.last_updated), "PPpp")
              : "N/A"}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Status;
