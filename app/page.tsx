import { ContentForm } from '@/components/ContentForm';
import { DraggablePanel } from '@/components/DraggablePanel';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <DraggablePanel
        dragHandle={
          <div className="flex items-center gap-2 w-full">
            <span className="text-gray-400 select-none" aria-hidden>
              ⋮⋮
            </span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Academy Content Planner
              </h1>
              <p className="text-gray-500 text-xs">
                Generate polished content for lessons, tricks, and combos
              </p>
            </div>
          </div>
        }
      >
        <ContentForm />
      </DraggablePanel>
    </main>
  );
}
