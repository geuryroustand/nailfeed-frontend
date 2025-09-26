"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ReactionService,
  type ReactionLike,
  type ReactionType,
  REACTION_TYPES,
} from "@/lib/services/reaction-service";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";

interface ReactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  totalCount: number;
  initialCounts?: Partial<Record<ReactionType, number>>;
  onSummaryUpdate?: (
    counts: Record<ReactionType, number>,
    total: number
  ) => void;
}

type TabKey = "all" | ReactionType;

interface ReactionListUser {
  id: string | number;
  username: string;
  displayName: string;
  profileImage?: any;
  reactionType: ReactionType;
}

interface TabState {
  users: ReactionListUser[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

const PAGE_SIZE = 20;

const reactionLabels: Record<ReactionType, string> = {
  like: "Like",
  love: "Love",
  haha: "Haha",
  wow: "Wow",
  sad: "Sad",
  angry: "Angry",
};

const buildEmptyCounts = (): Record<ReactionType, number> =>
  REACTION_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<ReactionType, number>);

const createInitialTabState = (): Record<TabKey, TabState> =>
  REACTION_TYPES.reduce(
    (state, type) => {
      state[type] = { users: [], page: 0, hasMore: false, loading: false };
      return state;
    },
    {
      all: { users: [], page: 0, hasMore: false, loading: false },
    } as Record<TabKey, TabState>
  );

const mapLikeToUser = (like: ReactionLike): ReactionListUser => {
  const baseUser = like.user;
  const displayName =
    baseUser?.displayName || baseUser?.username || "Unknown User";

  return {
    id: baseUser?.id ?? like.id,
    username: baseUser?.username || "unknown",
    displayName,
    profileImage: baseUser?.profileImage,
    reactionType: like.type,
  };
};

const formatUserDisplayName = (user: ReactionListUser) =>
  user.displayName || user.username;

// Remove getAvatarUrl function - we'll use EnhancedAvatar instead

const getReactionEmoji = (type: ReactionType) => ReactionService.getEmoji(type);

export function ReactionModal({
  open,
  onOpenChange,
  postId,
  totalCount,
  initialCounts,
  onSummaryUpdate,
}: ReactionModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [counts, setCounts] = useState<Record<ReactionType, number>>(() => {
    const base = buildEmptyCounts();
    if (initialCounts) {
      REACTION_TYPES.forEach((type) => {
        if (typeof initialCounts[type] === "number") {
          base[type] = initialCounts[type] as number;
        }
      });
    }
    return base;
  });
  const [tabState, setTabState] = useState<Record<TabKey, TabState>>(
    createInitialTabState
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveTab("all");
      setTabState(createInitialTabState());
      setErrorMessage(null);
      if (initialCounts) {
        const base = buildEmptyCounts();
        REACTION_TYPES.forEach((type) => {
          if (typeof initialCounts[type] === "number") {
            base[type] = initialCounts[type] as number;
          }
        });
        setCounts(base);
      }
    }
  }, [open, initialCounts]);

  const totalsSum = useMemo(
    () => Object.values(counts).reduce((acc, value) => acc + value, 0),
    [counts]
  );

  const initializeData = useCallback(async () => {
    if (!postId) return;

    setIsInitializing(true);
    setErrorMessage(null);
    setTabState(createInitialTabState());

    try {
      const initialPage = await ReactionService.fetchPostLikes(postId, {
        page: 1,
        pageSize: PAGE_SIZE,
      });

      const baseCounts = buildEmptyCounts();

      // Use backend's countsByType data directly
      if (initialPage.countsByType) {
        Object.entries(initialPage.countsByType).forEach(([key, value]) => {
          const reactionType = key as ReactionType;
          baseCounts[reactionType] = value ?? 0;
        });
      }

      const derivedTotal = Object.values(baseCounts).reduce(
        (acc, value) => acc + value,
        0
      );

      setCounts(baseCounts);
      onSummaryUpdate?.(
        baseCounts,
        derivedTotal || initialPage.pagination.total || 0
      );

      setTabState((prev) => ({
        ...prev,
        all: {
          users: initialPage.likes.map(mapLikeToUser),
          page: initialPage.pagination.page,
          hasMore:
            initialPage.pagination.page < initialPage.pagination.pageCount,
          loading: false,
        },
      }));
    } catch (error) {
      console.error("[ReactionModal] Failed to load reactions:", error);
      setErrorMessage("Failed to load reactions. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  }, [postId, onSummaryUpdate]);

  useEffect(() => {
    if (open) {
      initializeData().catch((error) => {
        console.error(
          "[ReactionModal] Unexpected initialization error:",
          error
        );
        setErrorMessage("Failed to load reactions. Please try again.");
        setIsInitializing(false);
      });
    }
  }, [open, initializeData]);

  const loadTabPage = useCallback(
    async (tab: TabKey, pageToLoad: number) => {
      if (!postId) return;

      setTabState((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: true },
      }));

      try {
        const response = await ReactionService.fetchPostLikes(postId, {
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          reactionType: tab === "all" ? undefined : tab,
        });

        setTabState((prev) => ({
          ...prev,
          [tab]: {
            users:
              pageToLoad === 1
                ? response.likes.map(mapLikeToUser)
                : [...prev[tab].users, ...response.likes.map(mapLikeToUser)],
            page: response.pagination.page,
            hasMore: response.pagination.page < response.pagination.pageCount,
            loading: false,
          },
        }));

        // Only update counts if we're loading the "all" tab, because individual
        // reaction type requests won't have complete count data for all types
        if (tab === "all" && response.countsByType) {
          const normalized = buildEmptyCounts();
          Object.entries(response.countsByType).forEach(([key, value]) => {
            const reactionType = key as ReactionType;
            normalized[reactionType] = value ?? 0;
          });

          setCounts(normalized);
          const total = Object.values(normalized).reduce(
            (acc, value) => acc + value,
            0
          );
          onSummaryUpdate?.(normalized, total);
        }
      } catch (error) {
        console.error(
          "[ReactionModal] Failed to load reactions for tab:",
          tab,
          error
        );
        setErrorMessage("Failed to load reactions. Please try again.");
        setTabState((prev) => ({
          ...prev,
          [tab]: { ...prev[tab], loading: false },
        }));
      }
    },
    [postId, onSummaryUpdate]
  );

  useEffect(() => {
    if (!open || !postId) return;
    if (activeTab === "all") return;

    const state = tabState[activeTab];
    if (counts[activeTab] > 0 && state.page === 0 && !state.loading) {
      loadTabPage(activeTab, 1);
    }
  }, [activeTab, counts, tabState, loadTabPage, open, postId]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const tab = activeTab;
      const state = tabState[tab];
      if (!postId || state.loading || !state.hasMore) return;

      const target = event.currentTarget;
      const threshold = 48;
      if (
        target.scrollTop + target.clientHeight >=
        target.scrollHeight - threshold
      ) {
        loadTabPage(tab, state.page + 1);
      }
    },
    [activeTab, tabState, loadTabPage, postId]
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const availableReactionTabs = useMemo(
    () => REACTION_TYPES.filter((type) => (counts[type] ?? 0) > 0),
    [counts]
  );

  const activeTabState = tabState[activeTab];
  const showAllTab = totalCount > 0 || totalsSum > 0 || isInitializing;

  const renderUsers = (tab: TabKey, state: TabState, isActive: boolean) => {
    if (state.users.length === 0) {
      if (isActive && (state.loading || (tab === "all" && isInitializing))) {
        return (
          <div className="flex justify-center py-6 text-sm text-gray-500">
            Loading reactions…
          </div>
        );
      }
      return (
        <p className="text-center text-gray-500 py-8">
          No {tab === "all" ? "reactions" : reactionLabels[tab]} to display yet.
        </p>
      );
    }

    return (
      <>
        {state.users.map((user) => (
          <Link
            href={`/profile/${user.username}`}
            key={`${tab}-${user.id}-${user.username}`}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <EnhancedAvatar
              src={user.profileImage?.url || user.profileImage?.formats?.small?.url || user.profileImage?.formats?.thumbnail?.url}
              alt={formatUserDisplayName(user)}
              fallbackText={formatUserDisplayName(user)}
              size="sm"
              className="w-10 h-10"
            />
            <span className="font-medium">{formatUserDisplayName(user)}</span>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 ml-auto">
              <span
                className="text-xl"
                role="img"
                aria-label={reactionLabels[user.reactionType]}
              >
                {getReactionEmoji(user.reactionType)}
              </span>
            </div>
          </Link>
        ))}
        {isActive && state.loading && (
          <div className="flex justify-center py-4 text-sm text-gray-500">
            Loading more…
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold">Reactions</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="border-b overflow-x-auto">
            <TabsList className="h-auto p-1 w-full bg-gray-50 flex">
              {showAllTab && (
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white rounded-md px-3 py-1.5 flex items-center gap-1"
                >
                  All{" "}
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.max(totalCount, totalsSum)})
                  </span>
                </TabsTrigger>
              )}

              {availableReactionTabs.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="data-[state=active]:bg-white rounded-md px-3 py-1.5 flex items-center gap-1"
                >
                  <span className="text-lg">{getReactionEmoji(type)}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({counts[type]})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent
            value="all"
            className="mt-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <div
              className="h-[50vh] max-h-[400px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {errorMessage && (
                <p className="text-center text-sm text-red-500 py-2">
                  {errorMessage}
                </p>
              )}
              {renderUsers("all", tabState.all, activeTab === "all")}
            </div>
          </TabsContent>

          {REACTION_TYPES.map((type) => (
            <TabsContent
              key={type}
              value={type}
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div
                className="h-[50vh] max-h-[400px] overflow-y-auto"
                onScroll={handleScroll}
              >
                {errorMessage && (
                  <p className="text-center text-sm text-red-500 py-2">
                    {errorMessage}
                  </p>
                )}
                {renderUsers(type, tabState[type], type === activeTab)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
