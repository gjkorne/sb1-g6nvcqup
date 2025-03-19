export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'timeline' | 'taskList' | 'timeTracking' | 'calendar' | 'focus';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: number;
  settings?: {
    [key: string]: any;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
}

export interface DashboardState {
  layouts: DashboardLayout[];
  activeLayout: string;
  availableWidgets: DashboardWidget[];
  isEditing: boolean;
}