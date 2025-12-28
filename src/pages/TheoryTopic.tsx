import { useParams, Navigate } from 'react-router-dom';
import { TheoryPage } from '@/components/theory';
import { getTheoryTopic, TOPIC_IDS } from '@/data/theoryTopics';

export default function TheoryTopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  
  // Default to first-degree-equations if no topicId
  const effectiveTopicId = topicId || TOPIC_IDS.FIRST_DEGREE_EQUATIONS;
  const topic = getTheoryTopic(effectiveTopicId);
  
  if (!topic) {
    return <Navigate to={`/theory/${TOPIC_IDS.FIRST_DEGREE_EQUATIONS}`} replace />;
  }
  
  return <TheoryPage topic={topic} />;
}
