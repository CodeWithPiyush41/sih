import type { TopicScore, Topic } from '@/lib/types';

/**
 * Given a student's topic scores and the course's topic graph,
 * returns an ordered list of topic names to review, sorted prerequisite-first.
 * Only includes topics scoring below 75%.
 */
export function computeRecommendedReviewOrder(
  topicScores: TopicScore[],
  topics: Topic[]
): string[] {
  const weakTopicIds = new Set(
    topicScores.filter((ts) => ts.scorePercent < 75).map((ts) => ts.topicId)
  );

  if (weakTopicIds.size === 0) return [];

  const topicMap = new Map(topics.map((t) => [t.id, t]));

  // Topological sort: prerequisites before dependents
  const visited = new Set<string>();
  const ordered: string[] = [];

  function visit(topicId: string) {
    if (visited.has(topicId)) return;
    visited.add(topicId);

    const topic = topicMap.get(topicId);
    if (!topic) return;

    for (const prereqId of topic.prerequisiteTopicIds) {
      if (weakTopicIds.has(prereqId)) {
        visit(prereqId);
      }
    }

    ordered.push(topicId);
  }

  for (const topicId of weakTopicIds) {
    visit(topicId);
  }

  return ordered
    .map((id) => topicMap.get(id)?.name)
    .filter((name): name is string => name !== undefined);
}
