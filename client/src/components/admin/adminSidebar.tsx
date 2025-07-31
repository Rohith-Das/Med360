// Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Users,LayoutDashboard,Calendar,Stethoscope,FileText,Settings,LogOut,X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface AdminSidebarProps{
  isOpen:boolean;
  onClose:()=>void;
  activeItem?:string;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Patients", path: "/admin/patients", active: true },
  { icon: Calendar, label: "Appointments", path: "/admin/appointments" },
  { icon: Stethoscope, label: "Specializations", path: "/admin/specializations", active: true},
  { icon: FileText, label: "Applications", path: "/admin/applications" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

function AdminSidebar({isOpen,onClose,activeItem="patients"}:AdminSidebarProps) {
const navigate=useNavigate()
return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-gradient-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border lg:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sidebar-primary rounded-md">
              <LayoutDashboard className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sidebar-foreground font-semibold">Menu</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label.toLowerCase();
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                 onClick={() => navigate(item.path)}
                className={cn(
                  "w-full justify-start gap-3 h-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-smooth",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </nav>
      </aside>
    </>
  );
}

export default AdminSidebar;
