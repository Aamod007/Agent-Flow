import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Workflow,
    Settings,
    Menu,
    Zap,
    LogOut,
    BarChart3,
    HelpCircle,
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Cable,
    User,
    CreditCard,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { User as UserType } from "@/lib/api";

const NAV_ITEMS = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workflows", href: "/dashboard/workflows", icon: Workflow },
    { label: "Connections", href: "/dashboard/connections", icon: Cable },
    { label: "Templates", href: "/dashboard/templates", icon: Zap },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const BOTTOM_ITEMS = [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
    { label: "Help", href: "/help", icon: HelpCircle },
];

export default function DashboardLayout() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await api.getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error('Failed to load user:', error);
            }
        };
        loadUser();
    }, []);

    const getInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const NavItem = ({ item, isBottom = false }: { item: typeof NAV_ITEMS[0]; isBottom?: boolean }) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        
        const content = (
            <Link
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
                    isCollapsed ? "justify-center" : "",
                    isActive
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
            >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-indigo-400")} />
                {!isCollapsed && <span>{item.label}</span>}
            </Link>
        );

        if (isCollapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-zinc-700">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return content;
    };

    const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
        <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/50">
            {/* Logo */}
            <div className={cn(
                "flex items-center border-b border-zinc-800/50 h-14",
                isCollapsed && !mobile ? "justify-center px-2" : "px-4 gap-3"
            )}>
                <Link 
                    to="/" 
                    className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
                >
                    <Zap className="h-4 w-4 text-white" />
                </Link>
                {(!isCollapsed || mobile) && (
                    <Link to="/" className="font-semibold text-lg text-zinc-100 hover:text-zinc-300 transition-colors">
                        AgentFlow
                    </Link>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
                <TooltipProvider>
                    {NAV_ITEMS.map((item) => (
                        <NavItem key={item.href} item={item} />
                    ))}
                </TooltipProvider>
            </nav>

            {/* Bottom Section */}
            <div className="px-2 py-3 border-t border-zinc-800/50 space-y-1">
                <TooltipProvider>
                    {BOTTOM_ITEMS.map((item) => (
                        <NavItem key={item.href} item={item} isBottom />
                    ))}
                </TooltipProvider>
                
                {/* Back to Home */}
                {isCollapsed && !mobile ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Link
                                to="/"
                                className="flex items-center justify-center px-3 py-2 rounded-md text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-zinc-800 text-zinc-200 border-zinc-700">
                            Back to Home
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        {(!isCollapsed || mobile) && <span>Back to Home</span>}
                    </Link>
                )}
            </div>

            {/* Collapse Toggle - Desktop Only */}
            {!mobile && (
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors z-10"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </button>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-zinc-950">
            {/* Desktop Sidebar */}
            <div 
                className={cn(
                    "hidden md:block shrink-0 relative transition-all duration-200",
                    isCollapsed ? "w-16" : "w-52"
                )}
            >
                <SidebarContent />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar - Minimal n8n style */}
                <header className="flex items-center justify-between px-4 h-14 border-b border-zinc-800/50 bg-zinc-950">
                    {/* Mobile menu */}
                    <div className="md:hidden">
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-60 bg-zinc-950 border-zinc-800">
                                <SidebarContent mobile />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        >
                            <Bell className="h-4 w-4" />
                        </Button>
                        
                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="h-7 w-7 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <span className="hidden sm:block text-sm text-zinc-300">{user?.name || 'User'}</span>
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium text-zinc-100">{user?.name || 'User'}</p>
                                        <p className="text-xs text-zinc-500">{user?.email || 'user@example.com'}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Billing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Security
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-800" />
                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content - Full width, no padding for editor pages */}
                <main className={cn(
                    "flex-1 overflow-hidden",
                    pathname.includes('/editor/') 
                        ? "bg-transparent" 
                        : "overflow-auto bg-zinc-900/50"
                )}>
                    {pathname.includes('/editor/') ? (
                        <Outlet />
                    ) : (
                        <div className="p-4 md:p-6 h-full overflow-auto">
                            <Outlet />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
