"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { CalendarIcon, DownloadIcon, RefreshCw } from "lucide-react";
import { createClient } from "../../supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CampaignData {
  campaign_id: string;
  campaign_name: string;
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  cpc: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function CampaignReports() {
  const supabase = createClient();
  const [platform, setPlatform] = useState<string>("google_ads");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaign data
  const fetchCampaignData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const startDate = dateRange.from.toISOString().split("T")[0];
      const endDate = dateRange.to.toISOString().split("T")[0];

      const response = await fetch(
        `/api/campaigns?platform=${platform}&startDate=${startDate}&endDate=${endDate}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch campaign data");
      }

      const { data } = await response.json();
      setCampaignData(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching campaign data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [platform]);

  // Process data for charts
  const processDataForSpendChart = () => {
    if (!campaignData.length) return [];

    // Group by date and sum spend for each campaign
    const groupedByDate = campaignData.reduce(
      (acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = {};
        }
        acc[item.date][item.campaign_name] =
          (acc[item.date][item.campaign_name] || 0) + item.spend;
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    );

    // Convert to array format for recharts
    return Object.entries(groupedByDate)
      .map(([date, campaigns]) => {
        return {
          date,
          ...campaigns,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processDataForClicksChart = () => {
    if (!campaignData.length) return [];

    // Group by campaign and sum clicks and conversions
    const groupedByCampaign = campaignData.reduce(
      (acc, item) => {
        if (!acc[item.campaign_name]) {
          acc[item.campaign_name] = { clicks: 0, conversions: 0 };
        }
        acc[item.campaign_name].clicks += item.clicks;
        acc[item.campaign_name].conversions += item.conversions;
        return acc;
      },
      {} as Record<string, { clicks: number; conversions: number }>,
    );

    // Convert to array format for recharts
    return Object.entries(groupedByCampaign).map(([campaign, data]) => {
      return {
        campaign,
        clicks: data.clicks,
        conversions: data.conversions,
      };
    });
  };

  const processDataForBudgetChart = () => {
    if (!campaignData.length) return [];

    // Group by campaign and sum spend
    const groupedByCampaign = campaignData.reduce(
      (acc, item) => {
        if (!acc[item.campaign_name]) {
          acc[item.campaign_name] = 0;
        }
        acc[item.campaign_name] += item.spend;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Convert to array format for recharts
    return Object.entries(groupedByCampaign).map(([campaign, spend]) => {
      return {
        campaign,
        spend,
      };
    });
  };

  const spendChartData = processDataForSpendChart();
  const clicksChartData = processDataForClicksChart();
  const budgetChartData = processDataForBudgetChart();

  // Get unique campaign names for the line chart
  const campaignNames = [
    ...new Set(campaignData.map((item) => item.campaign_name)),
  ];

  // Calculate summary metrics
  const totalSpend = campaignData.reduce((sum, item) => sum + item.spend, 0);
  const totalClicks = campaignData.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = campaignData.reduce(
    (sum, item) => sum + item.impressions,
    0,
  );
  const totalConversions = campaignData.reduce(
    (sum, item) => sum + item.conversions,
    0,
  );
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_ads">Google Ads</SelectItem>
              <SelectItem value="meta_ads">Meta Ads</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange(range as DateRange);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCampaignData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="icon">
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              For selected date range
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (totalClicks /
                  (dateRange.to.getTime() - dateRange.from.getTime())) *
                86400000
              ).toFixed(1)}{" "}
              per day
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {((totalConversions / totalClicks) * 100).toFixed(2)}% conversion
              rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. CPC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCPC.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalImpressions.toLocaleString()} impressions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="spend" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spend">Spend Over Time</TabsTrigger>
          <TabsTrigger value="performance">Campaign Performance</TabsTrigger>
          <TabsTrigger value="budget">Budget Distribution</TabsTrigger>
        </TabsList>

        {/* Spend Over Time Chart */}
        <TabsContent value="spend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spend Over Time</CardTitle>
              <CardDescription>
                Daily spend by campaign for the selected date range
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                {spendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {campaignNames.map((campaign, index) => (
                        <Line
                          key={campaign}
                          type="monotone"
                          dataKey={campaign}
                          stroke={COLORS[index % COLORS.length]}
                          activeDot={{ r: 8 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Performance Chart */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Clicks and conversions by campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                {clicksChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clicksChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="campaign" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="clicks"
                        name="Clicks"
                        fill="#8884d8"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="conversions"
                        name="Conversions"
                        fill="#82ca9d"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Distribution Chart */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Distribution</CardTitle>
              <CardDescription>Total spend by campaign</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px]">
                {budgetChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="spend"
                        nameKey="campaign"
                      >
                        {budgetChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`$${value.toFixed(2)}`, "Spend"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
