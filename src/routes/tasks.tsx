import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useTasks } from '@/hooks/use-tasks'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { TaskFormSheet } from '@/components/tasks/task-form-sheet'

export function Tasks() {
  const { data: tasks, isLoading } = useTasks()
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Manage your tasks and to-dos"
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        }
      />

      <TaskFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode="create"
      />

      {isLoading && <Skeleton className="h-64 w-full" />}

      {tasks && tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first task
            </p>
          </CardContent>
        </Card>
      )}

      {tasks && tasks.length > 0 && (
        <div className="text-sm">Found {tasks.length} tasks</div>
      )}
    </PageContainer>
  )
}
