"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTrendingReactions, type ReactionTrend } from "@/lib/trending-reactions-data"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function TrendingReactions() {
  const [trendingData, setTrendingData] = useState<{
    daily: ReactionTrend[]
    weekly: ReactionTrend[]
    mostUsed: ReactionTrend[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrendingReactions = async () => {
      try {
        const data = await getTrendingReactions()
        setTrendingData(data)
      } catch (error) {
        console.error("Error fetching trending reactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrendingReactions()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending Reactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trendingData) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <TrendingUp className="h-4 w-4 mr-2" />
          Trending Reactions
        </CardTitle>
        <CardDescription>See what reactions are popular right now</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="mostUsed">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <ReactionTrendList trends={trendingData.daily} />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <ReactionTrendList trends={trendingData.weekly} />
          </TabsContent>

          <TabsContent value="mostUsed" className="space-y-4">
            <ReactionTrendList trends={trendingData.mostUsed} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ReactionTrendList({ trends }: { trends: ReactionTrend[] }) {
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {trends.map((trend, index) => (
          <motion.div
            key={trend.emoji}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center text-xl">{trend.emoji}</div>
              <div className="ml-2">
                <div className="text-sm font-medium">{trend.count.toLocaleString()}</div>
                <div className="text-xs text-gray-500">reactions</div>
              </div>
            </div>
            {trend.percentChange !== 0 && (
              <div
                className={`flex items-center text-xs font-medium ${
                  trend.percentChange > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {trend.percentChange > 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend.percentChange)}%
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {trends[0]?.posts.length > 0 && (
        <div className="pt-2 mt-2 border-t">
          <p className="text-xs text-gray-500 mb-2">Popular posts with {trends[0].emoji}</p>
          <div className="flex flex-wrap gap-1">
            {trends[0].posts.map((postId) => (
              <Link
                key={postId}
                href={`/post/${postId}`}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Post #{postId}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
