// ─── Enums ───────────────────────────────────────────────────────────────────
export type Role = 'ROLE_SUPER_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_OVERDUE' | 'REMINDER_SENT' | 'TASK_COMPLETED' | 'ESCALATION'
export type ReminderType = 'ONE_TIME' | 'RECURRING' | 'DEADLINE'
export type ReminderFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  userId: number
  fullName: string
  email: string
  role: Role
  emailVerified: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phone?: string
  role?: Role
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  fullName: string
  email: string
  phone?: string
  role: Role
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

// ─── Department ───────────────────────────────────────────────────────────────
export interface Department {
  id: number
  name: string
  description?: string
  isActive: boolean
  manager?: User
  createdAt: string
}

// ─── Employee ─────────────────────────────────────────────────────────────────
export interface Employee {
  id: number
  user: User
  department?: Department
  employeeCode: string
  designation?: string
  joiningDate?: string
  status: EmployeeStatus
  createdAt: string
}

// ─── Task ─────────────────────────────────────────────────────────────────────
export interface Task {
  id: number
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo?: Employee
  assignedBy?: User
  department?: Department
  dueDate: string
  reminderDate?: string
  estimatedHours?: number
  progressPercent: number
  reminderActive: boolean
  completedAt?: string
  updates?: TaskUpdate[]
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface TaskUpdate {
  id: number
  task?: Task
  updatedBy: User
  comment: string
  progressPercent?: number
  createdAt: string
}

export interface Attachment {
  id: number
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  uploadedAt: string
}

// ─── Reminder ─────────────────────────────────────────────────────────────────
export interface ReminderSchedule {
  id: number
  task: Task
  reminderType: ReminderType
  frequency: ReminderFrequency
  daysBefore?: number
  isActive: boolean
  nextRun?: string
  lastRun?: string
}

export interface ReminderLog {
  id: number
  task: Task
  employee?: Employee
  emailTo: string
  emailSubject: string
  status: 'SENT' | 'FAILED'
  errorMessage?: string
  sentAt: string
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: number
  user?: User
  title: string
  message: string
  type: NotificationType
  relatedEntityId?: number
  isRead: boolean
  createdAt: string
}

// ─── API wrappers ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  timestamp: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export interface AdminStats {
  totalEmployees: number
  activeEmployees: number
  totalTasks: number
  pendingTasks: number
  completedTasks: number
  overdueTasks: number
  remindersSent: number
  remindersFailed: number
}

export interface TaskStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  awaitingReview: number
}

export interface EmployeeStats {
  total: number
  active: number
  inactive: number
  onLeave: number
}
