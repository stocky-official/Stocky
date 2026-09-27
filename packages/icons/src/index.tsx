import React from 'react';
import {
  Package,
  Warehouse,
  Barcode,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Search,
  Filter,
  RefreshCw,
  Layers,
  Tag,
  Truck,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Bell,
  Settings,
  ShieldAlert,
  LayoutDashboard,
  Boxes,
  Archive,
  FolderOpen,
  Pencil,
  Trash2,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CloudUpload,
  CloudDownload,
  Users,
  Shield,
  Camera,
  Zap,
  ZapOff,
  Check,
  Activity,
  Sparkles,
  Timer,
  RotateCcw,
  SlidersHorizontal,
  BarChart3,
  Calendar,
  LogOut,
  Mail,
  MessageCircle,
  Kanban,
  Table,
  QrCode,
  FileSpreadsheet,
  Network,
  ListTodo,
  Globe2,
  type LucideIcon,
} from 'lucide-react';
import { StockyIcon } from './StockyIcon';
import type { StockyIconProps } from './types';

export * from './types';
export * from './StockyIcon';
export * from './StockyLogoIcon';

function createIcon(icon: LucideIcon, displayName: string) {
  const Component = (props: StockyIconProps) => (
    <StockyIcon icon={icon} {...props} />
  );
  Component.displayName = displayName;
  return Component;
}

// Domain & Semantic Icon Exports
export const BoxIcon = createIcon(Package, 'BoxIcon');
export const WarehouseIcon = createIcon(Warehouse, 'WarehouseIcon');
export const BarcodeIcon = createIcon(Barcode, 'BarcodeIcon');
export const AlertTriangleIcon = createIcon(AlertTriangle, 'AlertTriangleIcon');
export const AlertCircleIcon = createIcon(AlertCircle, 'AlertCircleIcon');
export const InfoIcon = createIcon(Info, 'InfoIcon');
export const CheckCircleIcon = createIcon(CheckCircle2, 'CheckCircleIcon');
export const TrendingUpIcon = createIcon(TrendingUp, 'TrendingUpIcon');
export const TrendingDownIcon = createIcon(TrendingDown, 'TrendingDownIcon');
export const ArrowUpDownIcon = createIcon(ArrowUpDown, 'ArrowUpDownIcon');
export const ArrowUpRightIcon = createIcon(ArrowUpRight, 'ArrowUpRightIcon');
export const ArrowDownLeftIcon = createIcon(ArrowDownLeft, 'ArrowDownLeftIcon');
export const PlusIcon = createIcon(Plus, 'PlusIcon');
export const MinusIcon = createIcon(Minus, 'MinusIcon');
export const SearchIcon = createIcon(Search, 'SearchIcon');
export const FilterIcon = createIcon(Filter, 'FilterIcon');
export const RefreshIcon = createIcon(RefreshCw, 'RefreshIcon');
export const LayersIcon = createIcon(Layers, 'LayersIcon');
export const TagIcon = createIcon(Tag, 'TagIcon');
export const TruckIcon = createIcon(Truck, 'TruckIcon');
export const ClockIcon = createIcon(Clock, 'ClockIcon');
export const DollarSignIcon = createIcon(DollarSign, 'DollarSignIcon');
export const ChevronDownIcon = createIcon(ChevronDown, 'ChevronDownIcon');
export const ChevronRightIcon = createIcon(ChevronRight, 'ChevronRightIcon');
export const MoreHorizontalIcon = createIcon(MoreHorizontal, 'MoreHorizontalIcon');
export const BellIcon = createIcon(Bell, 'BellIcon');
export const SettingsIcon = createIcon(Settings, 'SettingsIcon');
export const ShieldAlertIcon = createIcon(ShieldAlert, 'ShieldAlertIcon');
export const DashboardIcon = createIcon(LayoutDashboard, 'DashboardIcon');
export const BoxesIcon = createIcon(Boxes, 'BoxesIcon');
export const ArchiveIcon = createIcon(Archive, 'ArchiveIcon');
export const FolderOpenIcon = createIcon(FolderOpen, 'FolderOpenIcon');
export const EditIcon = createIcon(Pencil, 'EditIcon');
export const TrashIcon = createIcon(Trash2, 'TrashIcon');
export const ChevronLeftIcon = createIcon(ChevronLeft, 'ChevronLeftIcon');
export const PanelLeftCloseIcon = createIcon(PanelLeftClose, 'PanelLeftCloseIcon');
export const PanelLeftOpenIcon = createIcon(PanelLeftOpen, 'PanelLeftOpenIcon');
export const XIcon = createIcon(X, 'XIcon');
export const ArrowUpIcon = createIcon(ArrowUp, 'ArrowUpIcon');
export const ArrowDownIcon = createIcon(ArrowDown, 'ArrowDownIcon');
export const ArrowRightIcon = createIcon(ArrowRight, 'ArrowRightIcon');
export const CloudUploadIcon = createIcon(CloudUpload, 'CloudUploadIcon');
export const CloudDownloadIcon = createIcon(CloudDownload, 'CloudDownloadIcon');
export const UsersIcon = createIcon(Users, 'UsersIcon');
export const ShieldIcon = createIcon(Shield, 'ShieldIcon');
export const CameraIcon = createIcon(Camera, 'CameraIcon');
export const ZapIcon = createIcon(Zap, 'ZapIcon');
export const ZapOffIcon = createIcon(ZapOff, 'ZapOffIcon');
export const CheckIcon = createIcon(Check, 'CheckIcon');
export const ActivityIcon = createIcon(Activity, 'ActivityIcon');
export const SparklesIcon = createIcon(Sparkles, 'SparklesIcon');
export const TimerIcon = createIcon(Timer, 'TimerIcon');
export const RotateCcwIcon = createIcon(RotateCcw, 'RotateCcwIcon');
export const SlidersIcon = createIcon(SlidersHorizontal, 'SlidersIcon');
export const BarChartIcon = createIcon(BarChart3, 'BarChartIcon');
export const CalendarIcon = createIcon(Calendar, 'CalendarIcon');
export const LogOutIcon = createIcon(LogOut, 'LogOutIcon');
export const MailIcon = createIcon(Mail, 'MailIcon');
export const MessageCircleIcon = createIcon(MessageCircle, 'MessageCircleIcon');
export const KanbanIcon = createIcon(Kanban, 'KanbanIcon');
export const TableIcon = createIcon(Table, 'TableIcon');
export const QrCodeIcon = createIcon(QrCode, 'QrCodeIcon');
export const FileSpreadsheetIcon = createIcon(FileSpreadsheet, 'FileSpreadsheetIcon');
export const NetworkIcon = createIcon(Network, 'NetworkIcon');
export const ListTodoIcon = createIcon(ListTodo, 'ListTodoIcon');
export const GlobeIcon = createIcon(Globe2, 'GlobeIcon');

/** Brand mark used for the Google sign-in action. Kept in the shared icon package
 * so product components never need to embed provider SVG paths themselves. */
export function GoogleIcon({ size = 'md', className = '', ...props }: StockyIconProps) {
  const pixelSize = typeof size === 'number' ? size : 20;
  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 inline-block align-middle ${className}`}
      {...props}
    >
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}
