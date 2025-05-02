"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getTrendingReactions } from "@/lib/trending-reactions-data"
import { useQuery } from "@tanstack/react-query"

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#118AB2", "#073B4C"]

export default function ReactionAnalytics() {
  const [timeRange, setTimeRange] = useState("daily")

  const { data: trendingData, isLoading } = useQuery({
    queryKey: ["trendingReactions"],
    queryFn: getTrendingReactions,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reaction Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </CardContent>
      </Card>
    )
  }

  if (!trendingData) return null

  const currentData = trendingData[timeRange as keyof typeof trendingData]

  // Format data for charts
  const barChartData = currentData.map((item) => ({
    name: item.emoji,
    value: item.count,
  }))

  const pieChartData = currentData.map((item) => ({
    name: item.emoji,
    value: item.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reaction Analytics</CardTitle>
        <CardDescription>Detailed breakdown of reaction trends</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <div className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily" onClick={() => setTimeRange("daily")}>
                Today
              </TabsTrigger>
              <TabsTrigger value="weekly" onClick={() => setTimeRange("weekly")}>
                This Week
              </TabsTrigger>
              <TabsTrigger value="mostUsed" onClick={() => setTimeRange("mostUsed")}>
                All Time
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="distribution" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
