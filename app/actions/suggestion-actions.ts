"use server";

import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getApiUrl } from "@/lib/api-helpers";
import { getCurrentUser } from "@/app/actions/auth-actions";

const API_URL = getApiUrl();
const API_TOKEN = process.env.API_TOKEN || "";

export interface Suggestion {
  id: number;
  documentId: string;
  title: string;
  description: string;
  votes: number;
  status: "in-review" | "planned" | "in-development" | "released";
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  suggestion_votes: Array<{
    id: number;
    user: {
      id: number;
      username: string;
    };
  }>;
  voteCount?: number;
  userHasVoted?: boolean;
  isCreator?: boolean;
}

const getVoteCounts = cache(
  async (
    userId?: number
  ): Promise<{
    [suggestionId: string]: { count: number; userHasVoted: boolean };
  }> => {
    try {
      const response = await fetch(
        `${API_URL}/api/suggestion-votes?populate[0]=suggestion&populate[1]=user`,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
          next: {
            revalidate: 30,
            tags: ["suggestion-votes"],
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch vote counts:",
          response.status,
          response.statusText
        );
        return {};
      }

      const data = await response.json();
      const voteCounts: {
        [suggestionId: string]: { count: number; userHasVoted: boolean };
      } = {};

      // Group votes by suggestion
      data.data?.forEach((vote: any) => {
        const suggestionId = vote.suggestion?.documentId;
        if (suggestionId) {
          if (!voteCounts[suggestionId]) {
            voteCounts[suggestionId] = { count: 0, userHasVoted: false };
          }
          voteCounts[suggestionId].count++;

          // Check if current user has voted
          if (userId && vote.user?.id === userId) {
            voteCounts[suggestionId].userHasVoted = true;
          }
        }
      });

      return voteCounts;
    } catch (error) {
      console.error("Error fetching vote counts:", error);
      return {};
    }
  }
);

export const getBasicSuggestions = cache(async (): Promise<Suggestion[]> => {
  try {
    const response = await fetch(
      `${API_URL}/api/suggestions?populate[0]=user&sort=createdAt:desc`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        next: {
          revalidate: 60,
          tags: ["suggestions"],
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch suggestions:",
        response.status,
        response.statusText
      );
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching basic suggestions:", error);
    return [];
  }
});

export const getSuggestions = cache(
  async (userId?: number): Promise<Suggestion[]> => {
    try {
      let currentUserId: number | undefined = userId;

      // Get current user in parallel with data fetching
      const userPromise = getCurrentUser().catch(() => null);

      const [suggestionsResponse, votesResponse, currentUser] =
        await Promise.allSettled([
          fetch(
            `${API_URL}/api/suggestions?populate[0]=user&sort=createdAt:desc`,
            {
              headers: {
                Authorization: `Bearer ${API_TOKEN}`,
              },
              next: {
                revalidate: 60,
                tags: ["suggestions"],
              },
            }
          ),
          fetch(
            `${API_URL}/api/suggestion-votes?populate[0]=suggestion&populate[1]=user`,
            {
              headers: {
                Authorization: `Bearer ${API_TOKEN}`,
              },
              next: {
                revalidate: 30,
                tags: ["suggestion-votes"],
              },
            }
          ),
          userPromise,
        ]);

      // Handle user result
      if (currentUser.status === "fulfilled" && currentUser.value) {
        currentUserId = currentUser.value.id;
      }

      // Handle suggestions result
      let suggestions: any[] = [];
      if (
        suggestionsResponse.status === "fulfilled" &&
        suggestionsResponse.value.ok
      ) {
        const suggestionsData = await suggestionsResponse.value.json();
        suggestions = suggestionsData.data || [];
      }

      // Handle votes result
      const voteCounts: {
        [suggestionId: string]: { count: number; userHasVoted: boolean };
      } = {};
      if (votesResponse.status === "fulfilled" && votesResponse.value.ok) {
        const votesData = await votesResponse.value.json();

        // Process vote counts
        votesData.data?.forEach((vote: any) => {
          const suggestionId = vote.suggestion?.documentId;
          if (suggestionId) {
            if (!voteCounts[suggestionId]) {
              voteCounts[suggestionId] = { count: 0, userHasVoted: false };
            }
            voteCounts[suggestionId].count++;

            if (currentUserId && vote.user?.id === currentUserId) {
              voteCounts[suggestionId].userHasVoted = true;
            }
          }
        });
      }

      const suggestionsWithVotes = suggestions.map((suggestion: any) => {
        const voteData = voteCounts[suggestion.documentId] || {
          count: 0,
          userHasVoted: false,
        };
        return {
          ...suggestion,
          voteCount: voteData.count,
          userHasVoted: currentUserId ? voteData.userHasVoted : false,
          isCreator: currentUserId
            ? suggestion.user?.id === currentUserId
            : false,
          suggestion_votes: Array(voteData.count).fill({
            id: 0,
            user: { id: 0, username: "" },
          }),
        };
      });

      // Sort by vote count
      suggestionsWithVotes.sort(
        (a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0)
      );

      return suggestionsWithVotes;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return [];
    }
  }
);

export async function createSuggestion(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!title || !description) {
      return { success: false, error: "Title and description are required" };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "You must be logged in to create a suggestion",
      };
    }

    console.log(
      "[v0] Creating suggestion for user:",
      currentUser.id,
      currentUser.username
    );

    const response = await fetch(`${API_URL}/api/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          title,
          description,
          votes: 0,
          suggestionStatus: "in-review",
          user: {
            connect: [currentUser.documentId || currentUser.id],
          },
        },
      }),
    });

    if (!response.ok) {
      console.error(
        "Failed to create suggestion:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    console.log(
      "[v0] Successfully created suggestion:",
      result.data?.documentId
    );
    revalidatePath("/suggestions");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error creating suggestion:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create suggestion",
    };
  }
}

export async function voteSuggestion(
  suggestionId: string,
  action: "vote" | "unvote"
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "You must be logged in to vote" };
    }

    const userId = currentUser.id;
    console.log(
      "[v0] Vote action:",
      action,
      "for suggestion:",
      suggestionId,
      "by user:",
      userId
    );

    if (action === "vote") {
      const response = await fetch(`${API_URL}/api/suggestion-votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            suggestion: {
              connect: [suggestionId],
            },
            user: {
              connect: [currentUser.documentId || currentUser.id],
            },
          },
        }),
      });

      if (!response.ok) {
        console.error("Failed to vote:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Vote error response body:", errorText);
        throw new Error(
          `Vote failed with status ${response.status}: ${errorText}`
        );
      }
    } else {
      const votesResponse = await fetch(
        `${API_URL}/api/suggestion-votes?filters[suggestion][documentId][$eq]=${suggestionId}&filters[user][id][$eq]=${userId}&populate=*`,
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
        }
      );

      if (votesResponse.ok) {
        const votesData = await votesResponse.json();
        if (votesData.data.length > 0) {
          const voteId = votesData.data[0].documentId;
          const deleteResponse = await fetch(
            `${API_URL}/api/suggestion-votes/${voteId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${API_TOKEN}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            console.error(
              "Failed to delete vote:",
              deleteResponse.status,
              deleteResponse.statusText
            );
            const errorText = await deleteResponse.text();
            console.error("Delete vote error response body:", errorText);
            throw new Error(
              `Delete vote failed with status ${deleteResponse.status}: ${errorText}`
            );
          }
        }
      }
    }

    revalidatePath("/suggestions");
    return { success: true };
  } catch (error) {
    console.error("Error voting on suggestion:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to vote on suggestion",
    };
  }
}

export async function updateSuggestion(
  suggestionId: string,
  formData: FormData
) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!title || !description) {
      return { success: false, error: "Title and description are required" };
    }

    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (error) {
      console.error("[v0] Auth error during update:", error);
      return {
        success: false,
        error: "Authentication failed. Please try logging in again.",
      };
    }

    if (!currentUser) {
      return {
        success: false,
        error: "You must be logged in to update suggestions",
      };
    }

    console.log(
      "[v0] Updating suggestion:",
      suggestionId,
      "by user:",
      currentUser.id
    );

    const response = await fetch(`${API_URL}/api/suggestions/${suggestionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          title,
          description,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        "Failed to update suggestion:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    console.log(
      "[v0] Successfully updated suggestion:",
      result.data?.documentId
    );

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error updating suggestion:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update suggestion",
    };
  }
}
