@@ .. @@
   private taskCache: Map<string, Task> = new Map();
   private userId: string | null = null;
   
+  // Singleton instance
+  private static instance: TaskService;
+  
+  public static getInstance(): TaskService {
+    if (!TaskService.instance) {
+      TaskService.instance = new TaskService();
+    }
+    return TaskService.instance;
+  }
+  
   constructor() {
+    if (TaskService.instance) {
+      return TaskService.instance;
+    }
+    TaskService.instance = this;
+    
     // Initialize user ID on service creation
     this.initializeUserId();
   }
@@ .. @@
     return newTask;
   }
   
-  // Add more methods for updating, deleting, etc.
+  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
+    if (!this.userId) {
+      const { data } = await supabase.auth.getUser();
+      this.userId = data.user?.id || null;
+      if (!this.userId) throw new Error('User must be authenticated');
+    }
+    
+    const task = this.taskCache.get(taskId);
+    if (!task) throw new Error('Task not found');
+    
+    const updatedTask = {
+      ...task,
+      ...updates,
+      updatedAt: new Date()
+    };
+    
+    const { error } = await supabase
+      .from('tasks')
+      .update({
+        title: updatedTask.title,
+        description: updatedTask.description,
+        category: updatedTask.category,
+        tags: updatedTask.tags,
+        priority: updatedTask.priority,
+        time_estimate: updatedTask.timeEstimate?.value,
+        recurrence: updatedTask.recurrence,
+        progress: updatedTask.progress,
+        status: updatedTask.status,
+        due_date: updatedTask.dueDate?.toISOString(),
+        time_spent: updatedTask.timeSpent,
+        updated_at: updatedTask.updatedAt.toISOString()
+      })
+      .eq('id', taskId);
+      
+    if (error) throw error;
+    
+    // Update cache
+    this.taskCache.set(taskId, updatedTask);
+    
+    return updatedTask;
+  }
+  
+  async deleteTask(taskId: string): Promise<void> {
+    if (!this.userId) {
+      const { data } = await supabase.auth.getUser();
+      this.userId = data.user?.id || null;
+      if (!this.userId) throw new Error('User must be authenticated');
+    }
+    
+    // Soft delete by setting deleted_at
+    const { error } = await supabase
+      .from('tasks')
+      .update({ deleted_at: new Date().toISOString() })
+      .eq('id', taskId);
+      
+    if (error) throw error;
+    
+    // Remove from cache
+    this.taskCache.delete(taskId);
+  }
+  
+  async restoreTask(taskId: string): Promise<Task> {
+    if (!this.userId) {
+      const { data } = await supabase.auth.getUser();
+      this.userId = data.user?.id || null;
+      if (!this.userId) throw new Error('User must be authenticated');
+    }
+    
+    const { data: task, error } = await supabase
+      .from('tasks')
+      .update({ deleted_at: null })
+      .eq('id', taskId)
+      .select()
+      .single();
+      
+    if (error) throw error;
+    
+    const restoredTask = this.formatTasks([task])[0];
+    this.taskCache.set(taskId, restoredTask);
+    
+    return restoredTask;
+  }
+  
+  async addDependency(taskId: string, dependencyId: string): Promise<void> {
+    if (!this.userId) {
+      const { data } = await supabase.auth.getUser();
+      this.userId = data.user?.id || null;
+      if (!this.userId) throw new Error('User must be authenticated');
+    }
+    
+    const { error } = await supabase
+      .from('task_dependencies')
+      .insert({
+        dependent_task_id: taskId,
+        dependency_task_id: dependencyId
+      });
+      
+    if (error) throw error;
+    
+    // Update cache
+    const task = this.taskCache.get(taskId);
+    if (task) {
+      task.dependencies = [...(task.dependencies || []), dependencyId];
+      this.taskCache.set(taskId, task);
+    }
+  }
+  
+  async removeDependency(taskId: string, dependencyId: string): Promise<void> {
+    if (!this.userId) {
+      const { data } = await supabase.auth.getUser();
+      this.userId = data.user?.id || null;
+      if (!this.userId) throw new Error('User must be authenticated');
+    }
+    
+    const { error } = await supabase
+      .from('task_dependencies')
+      .delete()
+      .eq('dependent_task_id', taskId)
+      .eq('dependency_task_id', dependencyId);
+      
+    if (error) throw error;
+    
+    // Update cache
+    const task = this.taskCache.get(taskId);
+    if (task) {
+      task.dependencies = task.dependencies?.filter(id => id !== dependencyId) || [];
+      this.taskCache.set(taskId, task);
+    }
+  }
+  
+  async updateProgress(taskId: string, progress: number): Promise<Task> {
+    if (progress < 0 || progress > 100) {
+      throw new Error('Progress must be between 0 and 100');
+    }
+    
+    return this.updateTask(taskId, { progress });
+  }
+  
+  async completeTask(taskId: string): Promise<Task> {
+    const task = await this.updateTask(taskId, {
+      status: 'completed',
+      progress: 100,
+      completedAt: new Date()
+    });
+    
+    // Mark all subtasks as completed
+    if (task.subtasks.length > 0) {
+      const { error } = await supabase
+        .from('subtasks')
+        .update({ completed: true })
+        .eq('task_id', taskId);
+        
+      if (error) throw error;
+      
+      task.subtasks = task.subtasks.map(subtask => ({
+        ...subtask,
+        completed: true
+      }));
+      
+      this.taskCache.set(taskId, task);
+    }
+    
+    return task;
+  }
 }
 
-// Export a singleton instance
-export const taskService = new TaskService();
+// Export the singleton instance
+export const taskService = TaskService.getInstance();