import { getDailyCore } from '@/lib/engines-server';
import { DailyBrief }   from '@/components/DailyBrief';

export default function DailyPage() {
  const core = getDailyCore();
  return <DailyBrief core={core} />;
}
