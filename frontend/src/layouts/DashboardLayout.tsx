import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Workflow,
    Settings,
    Menu,
    Zap,
    LogOut,
    BarChart3,
    HelpCircle,
    Search,
    Bell,
    ChevronDown,
    Cable,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workflows", href: "/dashboard/workflows", icon: Workflow },
    { label: "Connections", href: "/dashboard/connections", icon: Cable },
    { label: "Templates", href: "/dashboard/templates", icon: Zap },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
    const { pathname } = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const NavContent = () => (
        <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/50">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-zinc-800/50 flex items-center gap-2.5">
                <Link to="/" className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Zap className="h-4 w-4 text-white" />
                </Link>
                <Link to="/" className="font-bold text-lg text-zinc-100 hover:text-white transition-colors">AgentFlow</Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                isActive
                                    ? "bg-zinc-800/80 text-zinc-100"
                                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive && "text-indigo-400")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-zinc-800/50 space-y-1">
                <Link
                    to="/help"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
                >
                    <HelpCircle className="h-4 w-4" />
                    Help & Support
                </Link>
                <Link
                    to="/"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Back to Home
                </Link>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-zinc-950">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-56 shrink-0">
                <NavContent />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50 bg-zinc-950">
                    {/* Mobile menu */}
                    <div className="md:hidden">
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-60 bg-zinc-950 border-zinc-800">
                                <NavContent />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Search */}
                    <div className="hidden md:flex items-center flex-1 max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Search workflows..."
                                className="w-full h-9 pl-9 pr-3 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                            />
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-zinc-300">John Doe</p>
                                <p className="text-xs text-zinc-600">Pro Plan</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-zinc-600" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-5 md:p-8 bg-zinc-950">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
