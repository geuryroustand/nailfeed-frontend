"use client";

import { useState, useEffect } from "react";
import {
  ReactionService,
  type ReactionType,
} from "@/lib/services/reaction-service";
import { Card, CardContent } from "@/components/ui/card";
import { ReactionSummary } from "./reaction-summary";
import { Skeleton } from "@/components/ui/skeleton";

interface ReactionDetailsProps {
  postId: string | number;
  className?: string;
  compact?: boolean;
}

interface ReactionUser {
  id: string;
  username: string;
  displayName?: string;
  profileImage?: string;
}

interface ReactionWithUser {
  id: string;
  type: ReactionType;
  user: ReactionUser;
}

export function ReactionDetails({
  postId,
  className,
  compact = false,
}: ReactionDetailsProps) {
  const [reactions, setReactions] = useState<ReactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReactions = async () => {
      try {
        setLoading(true);

        // In a real implementation, you would fetch actual reaction data with user info
        // This is a mock implementation
        const response = await ReactionService.getPostReactions(postId);

        // Create mock reaction data with users
        const mockReactions: ReactionWithUser[] = [];

        // Define reaction types with consistent emojis
        const reactionTypes: { type: ReactionType; count: number }[] = [
          { type: "haha", count: 6 },
          { type: "love", count: 5 },
          { type: "wow", count: 3 },
          { type: "like", count: 3 },
          { type: "angry", count: 2 },
          { type: "sad", count: 1 },
        ];

        // Generate users for each reaction type
        let userCounter = 0;
        reactionTypes.forEach(({ type, count }) => {
          for (let i = 0; i < count; i++) {
            userCounter++;
            mockReactions.push({
              id: `reaction-${type}-${i}`,
              type,
              user: {
                id: `user-${userCounter}`,
                username: `user${userCounter}`,
                displayName: `User ${userCounter}`,
                // profileImage: `/placeholder.svg?height=40&width=40&query=user+${userCounter}`,
              },
            });
          }
        });

        setReactions(mockReactions);
      } catch (error) {
        console.error("Error loading reactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReactions();
  }, [postId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className={compact ? "p-2" : "p-4"}>
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-24 h-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reactions.length === 0) {
    return null;
  }

  // Count reactions by type and prepare data for ReactionSummary
  const reactionCounts = reactions.reduce((counts, reaction) => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const getReactionEmoji = (type: ReactionType) => {
    switch (type) {
      case "like":
        return "👍";
      case "love":
        return "❤️";
      case "haha":
        return "😂";
      case "wow":
        return "😮";
      case "sad":
        return "😢";
      case "angry":
        return "😡";
      default:
        return "👍";
    }
  };

  // Format data for ReactionSummary
  const formattedReactions = Object.entries(reactionCounts).map(
    ([type, count]) => {
      const users = reactions
        .filter((r) => r.type === type)
        .map((r) => ({
          id: r.user.id,
          username: r.user.username,
          displayName: r.user.displayName,
          avatar: r.user.profileImage,
        }));

      return {
        emoji: getReactionEmoji(type as ReactionType),
        label: type,
        count,
        users,
      };
    }
  );

  return (
    <Card className={className}>
      <CardContent className={compact ? "p-2" : "p-4"}>
        <ReactionSummary
          reactions={formattedReactions}
          totalCount={reactions.length}
          compact={compact}
          postId={postId}
          showViewButton={!compact}
        />
      </CardContent>
    </Card>
  );
}
