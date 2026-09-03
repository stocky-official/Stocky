import React from 'react';
import {
  Package,
  Warehouse,
  Barcode,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
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
  Users,
  Shield,
  Camera,
  Zap,
  ZapOff,
  type LucideIcon,
} from 'lucide-react';
import { StockyIcon } from './StockyIcon';
import type { StockyIconProps } from './types';

export * from './types';
export * from './StockyIcon';

function createIcon(icon: any, displayName: string) {
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
export const CheckCircleIcon = createIcon(CheckCircle2, 'CheckCircleIcon');
export const TrendingUpIcon = createIcon(TrendingUp, 'TrendingUpIcon');
export const TrendingDownIcon = createIcon(TrendingDown, 'TrendingDownIcon');
export const ArrowUpDownIcon = createIcon(ArrowUpDown, 'ArrowUpDownIcon');
export const ArrowUpRightIcon = createIcon(ArrowUpRight, 'ArrowUpRightIcon');
export const ArrowDownLeftIcon = createIcon(ArrowDownLeft, 'ArrowDownLeftIcon');
export const PlusIcon = createIcon(Plus, 'PlusIcon');
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
export const UsersIcon = createIcon(Users, 'UsersIcon');
export const ShieldIcon = createIcon(Shield, 'ShieldIcon');
export const CameraIcon = createIcon(Camera, 'CameraIcon');
export const ZapIcon = createIcon(Zap, 'ZapIcon');
export const ZapOffIcon = createIcon(ZapOff, 'ZapOffIcon');
