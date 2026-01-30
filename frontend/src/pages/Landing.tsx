import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Zap,
    ArrowRight,
    Sparkles,
    Check,
    Github,
    Twitter,
    Linkedin,
    Mail,
    Slack,
    GitBranch,
    MessageSquare,
    Calendar,
    Webhook,
    Bot,
    FileText,
    Database,
    BarChart3,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Spotlight effect component
function Spotlight() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Main spotlight from top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px]">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent" 
                     style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)' }} />
            </div>
            
            {/* Layered depth glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[180px] rounded-full" />
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/15 blur-[150px] rounded-full" />
            <div className="absolute top-40 left-1/3 w-[500px] h-[250px] bg-purple-600/12 blur-[140px] rounded-full" />
            <div className="absolute top-60 right-1/3 w-[450px] h-[220px] bg-blue-500/10 blur-[120px] rounded-full" />
            
            {/* Deep accent glows */}
            <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full" />
            <div className="absolute top-[40%] right-[25%] w-[250px] h-[250px] bg-pink-500/5 blur-[80px] rounded-full" />
            
            {/* Subtle grid overlay for depth */}
            <div className="absolute inset-0 opacity-[0.02]" 
                 style={{ 
                     backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                     backgroundSize: '100px 100px'
                 }} />
            
            {/* Ambient noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
            
            {/* Vignette effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/80" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,11,0.4)_70%)]" />
        </div>
    );
}

// Navigation component
function Navbar() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <nav className="relative z-50 flex items-center justify-between px-8 lg:px-16 py-5">
            <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
                    <Zap className="h-5 w-5 text-white drop-shadow-sm" />
                </div>
                <span className="font-bold text-xl tracking-tight">AgentFlow</span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
                <button 
                    onClick={() => scrollToSection('features')} 
                    className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                >
                    Features
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 group-hover:w-full transition-all duration-300" />
                </button>
                <button 
                    onClick={() => scrollToSection('pricing')} 
                    className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                >
                    Pricing
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 group-hover:w-full transition-all duration-300" />
                </button>
                <button 
                    onClick={() => scrollToSection('clients')} 
                    className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                >
                    Showcase
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 group-hover:w-full transition-all duration-300" />
                </button>
                <button 
                    onClick={() => scrollToSection('resources')} 
                    className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                >
                    Resources
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 group-hover:w-full transition-all duration-300" />
                </button>
                <button 
                    onClick={() => scrollToSection('documentation')} 
                    className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                >
                    Docs
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 group-hover:w-full transition-all duration-300" />
                </button>
                <button 
                    onClick={() => scrollToSection('enterprise')} 
                    className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
                >
                    Enterprise
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500 group-hover:w-full transition-all duration-300" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                >
                    <Link to="/dashboard/settings">
                        Sign In
                    </Link>
                </Button>
                <Button
                    asChild
                    size="sm"
                    className="h-10 px-5 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-300"
                >
                    <Link to="/dashboard">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </Button>
            </div>
        </nav>
    );
}

// Pricing card component
function PricingCard({
    title,
    price,
    period = "/month",
    description,
    features,
    highlighted = false,
    ctaText = "Get Started"
}: {
    title: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    ctaText?: string;
}) {
    return (
        <div className={cn(
            "relative flex flex-col p-8 rounded-2xl border transition-all duration-300 backdrop-blur-sm",
            highlighted 
                ? "bg-gradient-to-b from-indigo-950/50 to-zinc-900/90 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 ring-1 ring-indigo-500/20 scale-105" 
                : "bg-zinc-900/60 border-zinc-800 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-950/30"
        )}>
            {highlighted && (
                <>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-medium text-white shadow-lg">
                        Most Popular
                    </div>
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
                </>
            )}
            <div className="mb-6 relative">
                <h3 className="text-base font-medium text-zinc-300">{title}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{price}</span>
                    {price !== "Custom" && <span className="text-sm text-zinc-500">{period}</span>}
                </div>
                <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{description}</p>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center",
                            highlighted ? "bg-indigo-500/20" : "bg-zinc-800"
                        )}>
                            <Check className={cn("w-3 h-3", highlighted ? "text-indigo-400" : "text-emerald-400")} />
                        </div>
                        <span className="text-sm text-zinc-400">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                asChild
                className={cn(
                    "w-full h-11 text-sm rounded-lg transition-all duration-300",
                    highlighted
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
                )}
            >
                <Link to="/dashboard">
                    {ctaText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </Button>
        </div>
    );
}

// Action item in sidebar
function ActionItem({ icon: Icon, label, description }: { 
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500 truncate">{description}</p>
            </div>
        </div>
    );
}

// Product showcase mockup
function ProductShowcase() {
    return (
        <div className="relative max-w-6xl mx-auto mt-20 px-6">
            {/* Multi-layer glow effect behind */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/25 via-purple-500/15 to-transparent blur-[80px] -z-10" />
            <div className="absolute inset-x-10 top-10 bottom-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 blur-[60px] -z-10" />
            
            {/* Main product frame */}
            <div className="relative rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-950 shadow-2xl shadow-black/50 ring-1 ring-white/5">
                {/* Inner glow at top */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                {/* Browser chrome */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-700" />
                        <div className="w-3 h-3 rounded-full bg-zinc-700" />
                        <div className="w-3 h-3 rounded-full bg-zinc-700" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="px-4 py-1 rounded bg-zinc-800 text-xs text-zinc-500">
                            app.agentflow.ai
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Credits</span>
                        <span className="text-xs text-emerald-400 font-medium">7/10</span>
                    </div>
                </div>

                {/* Content area */}
                <div className="flex">
                    {/* Mini sidebar */}
                    <div className="w-14 border-r border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center",
                                i === 0 ? "bg-indigo-600" : "bg-zinc-800 hover:bg-zinc-700"
                            )}>
                                <div className="w-4 h-4 rounded-sm bg-zinc-600" />
                            </div>
                        ))}
                    </div>

                    {/* Canvas area */}
                    <div className="flex-1 p-6 min-h-[420px] relative" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}>
                        {/* Mock workflow nodes */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <path d="M120 60 Q180 60 180 100 Q180 140 240 140" stroke="rgba(99,102,241,0.4)" strokeWidth="2" fill="none" />
                            <path d="M120 200 Q180 200 180 160 Q180 140 240 140" stroke="rgba(99,102,241,0.4)" strokeWidth="2" fill="none" />
                            <path d="M340 140 L400 140" stroke="rgba(99,102,241,0.4)" strokeWidth="2" fill="none" />
                            <path d="M500 140 Q540 140 540 100" stroke="rgba(99,102,241,0.4)" strokeWidth="2" fill="none" />
                            <path d="M500 140 Q540 140 540 180" stroke="rgba(99,102,241,0.4)" strokeWidth="2" fill="none" />
                        </svg>

                        {/* Start node */}
                        <div className="absolute left-6 top-10 w-28 rounded-lg border border-zinc-700/50 bg-zinc-900/90 p-3 shadow-lg shadow-black/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
                                    <Database className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">Google Drive</span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Connect to trigger</p>
                        </div>

                        {/* Condition node 1 */}
                        <div className="absolute left-6 top-48 w-28 rounded-lg border border-zinc-700/50 bg-zinc-900/90 p-3 shadow-lg shadow-black/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center shadow-md shadow-orange-600/30">
                                    <Slack className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">Slack</span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Send notification</p>
                        </div>

                        {/* Center condition node */}
                        <div className="absolute left-[220px] top-28 w-32 rounded-lg border border-purple-500/50 bg-zinc-900/90 p-3 shadow-lg shadow-purple-500/10 backdrop-blur-sm ring-1 ring-purple-500/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center shadow-md shadow-purple-600/30">
                                    <GitBranch className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">Condition</span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Route based on rules</p>
                        </div>

                        {/* AI node */}
                        <div className="absolute left-[400px] top-28 w-32 rounded-lg border border-emerald-500/50 bg-zinc-900/90 p-3 shadow-lg shadow-emerald-500/10 backdrop-blur-sm ring-1 ring-emerald-500/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/30">
                                    <Bot className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">AI Agent</span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Summarize & respond</p>
                        </div>

                        {/* Output nodes */}
                        <div className="absolute right-24 top-14 w-28 rounded-lg border border-zinc-700/50 bg-zinc-900/90 p-3 shadow-lg shadow-black/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded bg-pink-600 flex items-center justify-center shadow-md shadow-pink-600/30">
                                    <MessageSquare className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">Discord</span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Post message</p>
                        </div>

                        <div className="absolute right-24 top-44 w-28 rounded-lg border border-zinc-700/50 bg-zinc-900/90 p-3 shadow-lg shadow-black/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-5 h-5 rounded bg-cyan-600 flex items-center justify-center shadow-md shadow-cyan-600/30">
                                    <FileText className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-zinc-300">Notion</span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Create entry</p>
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="w-60 border-l border-zinc-800 bg-zinc-900/50 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <Button size="sm" variant="outline" className="h-8 px-3 text-xs rounded border-zinc-700">
                                Save
                            </Button>
                            <Button size="sm" className="h-8 px-3 text-xs rounded bg-indigo-600 hover:bg-indigo-700">
                                Publish
                            </Button>
                        </div>

                        <div className="flex gap-3 mb-4 text-xs">
                            <button className="text-zinc-200 border-b-2 border-indigo-500 pb-1.5">Actions</button>
                            <button className="text-zinc-500 hover:text-zinc-300 pb-1.5">Settings</button>
                        </div>

                        <div className="space-y-1">
                            <ActionItem icon={Mail} label="Email" description="Send an email to a user" />
                            <ActionItem icon={GitBranch} label="Condition" description="Boolean operator for branching" />
                            <ActionItem icon={Bot} label="AI" description="Use AI to summarize, respond" />
                            <ActionItem icon={Slack} label="Slack" description="Send a notification to slack" />
                            <ActionItem icon={FileText} label="Notion" description="Create entries directly in notion" />
                            <ActionItem icon={Webhook} label="Custom Webhook" description="Connect any app with API" />
                            <ActionItem icon={MessageSquare} label="Discord" description="Post messages to your discord" />
                            <ActionItem icon={Calendar} label="Google Calendar" description="Create a calendar invite" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reflection/shadow effect */}
            <div className="absolute -bottom-20 left-0 right-0 h-20 bg-gradient-to-t from-transparent via-zinc-950/50 to-transparent blur-sm" />
        </div>
    );
}

// Client logos/showcase section
function ClientShowcase() {
    const showcaseItems = [
        { 
            title: "Workflow Editor", 
            description: "Visual drag-and-drop builder for creating complex automation flows", 
            icon: GitBranch,
            featured: true 
        },
        { 
            title: "AI Agents", 
            description: "GPT-4, Claude & more", 
            icon: Bot,
            featured: false 
        },
        { 
            title: "Analytics", 
            description: "Real-time insights", 
            icon: BarChart3,
            featured: false 
        },
        { 
            title: "Templates", 
            description: "100+ pre-built workflows ready to deploy instantly", 
            icon: Layers,
            featured: true 
        },
        { 
            title: "Connections", 
            description: "500+ integrations", 
            icon: Webhook,
            featured: false 
        },
        { 
            title: "Executions", 
            description: "Live monitoring", 
            icon: Zap,
            featured: false 
        },
    ];

    return (
        <section id="clients" className="relative z-10 py-24 px-8">
            {/* Background depth effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full" />
            </div>
            
            <div className="max-w-6xl mx-auto relative">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-400">Product Showcase</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">Built for </span>
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Modern Teams</span>
                    </h2>
                    <p className="text-sm text-zinc-500 mt-3 max-w-lg mx-auto">
                        A complete platform for building, deploying, and managing AI-powered automation workflows.
                    </p>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {showcaseItems.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <Link 
                                key={i}
                                to="/dashboard"
                                className={cn(
                                    "group relative rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden backdrop-blur-sm",
                                    "hover:border-indigo-500/40 transition-all duration-500",
                                    "hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1",
                                    item.featured ? "md:col-span-1 md:row-span-2" : ""
                                )}
                            >
                                {/* Gradient overlay */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                                    i % 2 === 0 
                                        ? "bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/5" 
                                        : "bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/5"
                                )} />
                                
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                                
                                {/* Content */}
                                <div className={cn(
                                    "relative p-6 flex flex-col",
                                    item.featured ? "h-full min-h-[280px] justify-between" : "h-[140px]"
                                )}>
                                    {/* Icon */}
                                    <div className={cn(
                                        "rounded-xl flex items-center justify-center transition-all duration-300",
                                        "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20",
                                        "group-hover:border-indigo-500/40 group-hover:shadow-lg group-hover:shadow-indigo-500/20",
                                        item.featured ? "w-14 h-14 mb-6" : "w-12 h-12 mb-4"
                                    )}>
                                        <Icon className={cn(
                                            "text-indigo-400 group-hover:text-indigo-300 transition-colors",
                                            item.featured ? "w-7 h-7" : "w-5 h-5"
                                        )} />
                                    </div>
                                    
                                    {/* Text */}
                                    <div className={item.featured ? "mt-auto" : ""}>
                                        <h3 className={cn(
                                            "font-semibold text-white mb-2 group-hover:text-indigo-100 transition-colors",
                                            item.featured ? "text-xl" : "text-base"
                                        )}>
                                            {item.title}
                                        </h3>
                                        <p className={cn(
                                            "text-zinc-500 group-hover:text-zinc-400 transition-colors",
                                            item.featured ? "text-sm leading-relaxed" : "text-xs"
                                        )}>
                                            {item.description}
                                        </p>
                                    </div>
                                    
                                    {/* Arrow indicator */}
                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        <ArrowRight className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                
                {/* CTA */}
                <div className="mt-12 text-center">
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 px-6 rounded-full border-zinc-700 text-zinc-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-white transition-all duration-300"
                    >
                        <Link to="/dashboard">
                            Explore All Features
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default function Landing() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Spotlight />
            
            {/* Fixed navbar with blur on scroll */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled && "bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50"
            )}>
                <Navbar />
            </div>

            {/* Hero Section */}
            <section className="relative z-10 pt-28 pb-10 px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 mb-8 backdrop-blur-sm shadow-lg shadow-black/20 ring-1 ring-white/5 hover:border-zinc-700 transition-colors">
                        <div className="relative">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <div className="absolute inset-0 animate-ping">
                                <Sparkles className="w-4 h-4 text-indigo-400 opacity-40" />
                            </div>
                        </div>
                        <span className="text-sm text-zinc-400">Start For Free Today</span>
                    </div>

                    {/* Main headline */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
                        <span className="text-white drop-shadow-lg">Automate Your Work</span>
                        <br />
                        <span className="bg-gradient-to-r from-zinc-400 via-zinc-500 to-zinc-400 bg-clip-text text-transparent">With AgentFlow</span>
                    </h1>

                    <p className="text-base text-zinc-500 max-w-xl mx-auto mb-10">
                        Build intelligent AI-powered automation workflows with our visual canvas. 
                        Connect agents, automate tasks, and deploy in minutes.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            asChild
                            className="h-12 px-7 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 ring-1 ring-white/10"
                        >
                            <Link to="/dashboard">
                                Start Building Free
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="h-12 px-7 text-sm rounded-full bg-zinc-900/50 backdrop-blur-sm border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 shadow-lg shadow-black/20 transition-all duration-300"
                        >
                            <a href="https://github.com/Aamod007/Agent-Flow" target="_blank" rel="noopener noreferrer">
                                <Github className="w-4 h-4 mr-2" />
                                View on GitHub
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Product showcase */}
            <ProductShowcase />

            {/* Features Section */}
            <section id="features" className="relative z-10 py-24 px-8">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full" />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full" />
                </div>
                
                <div className="max-w-6xl mx-auto relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-indigo-400">Powerful Features</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="text-white">Everything You Need</span>
                            <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">To Automate Workflows</span>
                        </h2>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Build sophisticated AI workflows with our intuitive visual editor and powerful integrations.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                    <GitBranch className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Visual Workflow Builder</h3>
                                <p className="text-sm text-zinc-500">Drag-and-drop interface to build complex automation flows without writing code.</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Agents</h3>
                                <p className="text-sm text-zinc-500">Connect to GPT-4, Claude, Gemini and more to power intelligent automation.</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                    <Webhook className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">500+ Integrations</h3>
                                <p className="text-sm text-zinc-500">Connect with Slack, Discord, Notion, Google Workspace, and hundreds more.</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Scheduled Triggers</h3>
                                <p className="text-sm text-zinc-500">Run workflows on a schedule with cron expressions or webhook triggers.</p>
                            </div>
                        </div>

                        {/* Feature 5 */}
                        <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                    <Database className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Data Transformation</h3>
                                <p className="text-sm text-zinc-500">Transform and map data between services with powerful expression engine.</p>
                            </div>
                        </div>

                        {/* Feature 6 */}
                        <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Real-Time Execution</h3>
                                <p className="text-sm text-zinc-500">Watch your workflows execute in real-time with detailed logs and debugging.</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-12 text-center">
                        <Button
                            asChild
                            className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-xl shadow-indigo-500/25"
                        >
                            <Link to="/dashboard/workflows">
                                Explore All Features
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 py-28 px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Spotlight effect for pricing */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" 
                             style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }} />
                    </div>

                    <div className="text-center mb-16 relative">
                        {/* Platform visual */}
                        <div className="w-48 h-2.5 mx-auto mb-10 rounded-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 shadow-lg shadow-white/5" />
                        
                        <h2 className="text-4xl md:text-5xl font-bold mb-3">
                            <span className="text-white">Plans That</span>
                            <br />
                            <span className="text-zinc-400">Fit You Best</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5 relative">
                        <PricingCard
                            title="Starter"
                            price="$0"
                            description="Perfect for getting started with AI workflow automation."
                            features={[
                                "5 Active workflows",
                                "1,000 executions/month",
                                "Basic AI models",
                                "Community support",
                                "7-day execution logs"
                            ]}
                            ctaText="Start Free"
                        />
                        <PricingCard
                            title="Pro"
                            price="$29"
                            description="For teams that need more power and advanced features."
                            features={[
                                "Unlimited workflows",
                                "50,000 executions/month",
                                "All AI models (GPT-4, Claude)",
                                "Priority support",
                                "30-day execution logs",
                                "Webhooks & API access"
                            ]}
                            highlighted
                            ctaText="Start Pro Trial"
                        />
                        <PricingCard
                            title="Enterprise"
                            price="Custom"
                            period=""
                            description="Custom solutions for large-scale automation needs."
                            features={[
                                "Unlimited everything",
                                "Custom AI models",
                                "Dedicated support",
                                "SLA guarantee",
                                "SSO & SAML",
                                "On-premise deployment"
                            ]}
                            ctaText="Contact Sales"
                        />
                    </div>
                </div>
            </section>

            {/* Client showcase / development studio */}
            <ClientShowcase />

            {/* Resources Section */}
            <section id="resources" className="relative z-10 py-24 px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm text-indigo-400">Resources</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Learn & Grow</span>
                        </h2>
                        <p className="text-zinc-500 max-w-xl mx-auto">
                            Explore our guides, tutorials, and best practices to master AI workflow automation.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Resource Card 1 */}
                        <Link to="/dashboard" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Getting Started Guide</h3>
                                <p className="text-sm text-zinc-500 mb-4">Learn the basics of creating your first AI workflow in under 10 minutes.</p>
                                <span className="inline-flex items-center text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                    Read Guide <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </Link>

                        {/* Resource Card 2 */}
                        <Link to="/dashboard/templates" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">AI Agent Templates</h3>
                                <p className="text-sm text-zinc-500 mb-4">Pre-built agent configurations for common automation scenarios.</p>
                                <span className="inline-flex items-center text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                                    Browse Templates <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </Link>

                        {/* Resource Card 3 */}
                        <Link to="/dashboard/connections" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                    <Webhook className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Integration Guides</h3>
                                <p className="text-sm text-zinc-500 mb-4">Connect AgentFlow to your favorite tools and services.</p>
                                <span className="inline-flex items-center text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                    View Integrations <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </Link>

                        {/* Resource Card 4 */}
                        <a href="https://github.com/Aamod007/Agent-Flow/discussions" target="_blank" rel="noopener noreferrer" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Community Forum</h3>
                                <p className="text-sm text-zinc-500 mb-4">Connect with other users, share workflows, and get help.</p>
                                <span className="inline-flex items-center text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                                    Join Community <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </a>

                        {/* Resource Card 5 */}
                        <Link to="/dashboard/analytics" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Analytics & Reports</h3>
                                <p className="text-sm text-zinc-500 mb-4">Track workflow performance with detailed analytics and insights.</p>
                                <span className="inline-flex items-center text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                    View Analytics <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </Link>

                        {/* Resource Card 6 */}
                        <a href="https://github.com/Aamod007/Agent-Flow" target="_blank" rel="noopener noreferrer" className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all duration-300 backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            <div className="relative">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                    <Github className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Open Source</h3>
                                <p className="text-sm text-zinc-500 mb-4">Contribute to AgentFlow and build custom extensions.</p>
                                <span className="inline-flex items-center text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                                    View on GitHub <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            {/* Documentation Section */}
            <section id="documentation" className="relative z-10 py-24 px-8 border-t border-zinc-800/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left - Info */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                                <Database className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm text-indigo-400">Documentation</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                <span className="text-white">Comprehensive</span>
                                <br />
                                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">API Documentation</span>
                            </h2>
                            <p className="text-zinc-500 mb-8 leading-relaxed">
                                Everything you need to integrate AgentFlow into your applications. 
                                Full API reference, SDKs, and code examples in multiple languages.
                            </p>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-indigo-400" />
                                    <span className="text-zinc-300">RESTful API with OpenAPI spec</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-indigo-400" />
                                    <span className="text-zinc-300">WebSocket support for real-time updates</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-indigo-400" />
                                    <span className="text-zinc-300">SDKs for JavaScript, Python, and Go</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-indigo-400" />
                                    <span className="text-zinc-300">Interactive API playground</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-8">
                                <Button
                                    asChild
                                    className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-lg shadow-indigo-600/20"
                                >
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        View Documentation
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 px-6 rounded-lg border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                >
                                    <a href="#" target="_blank" rel="noopener noreferrer">
                                        API Reference
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Right - Code Preview */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-[60px] -z-10" />
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-2xl shadow-black/50">
                                {/* Code header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs text-zinc-500 ml-2">workflow.ts</span>
                                </div>
                                {/* Code content */}
                                <div className="p-4 font-mono text-sm overflow-x-auto">
                                    <pre className="text-zinc-300">
<span className="text-purple-400">import</span> {'{'}  AgentFlow {'}'} <span className="text-purple-400">from</span> <span className="text-emerald-400">'@agentflow/sdk'</span>;{'\n\n'}
<span className="text-zinc-500">// Initialize client</span>{'\n'}
<span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-cyan-400">AgentFlow</span>({'{'}
  apiKey: process.env.<span className="text-orange-400">AGENTFLOW_API_KEY</span>
{'}'});{'\n\n'}
<span className="text-zinc-500">// Create workflow</span>{'\n'}
<span className="text-purple-400">const</span> workflow = <span className="text-purple-400">await</span> client.<span className="text-cyan-400">workflows</span>.<span className="text-yellow-400">create</span>({'{'}
  name: <span className="text-emerald-400">'My Automation'</span>,
  agents: [
    {'{'} type: <span className="text-emerald-400">'researcher'</span>, model: <span className="text-emerald-400">'gpt-4'</span> {'}'},
    {'{'} type: <span className="text-emerald-400">'writer'</span>, model: <span className="text-emerald-400">'claude-3'</span> {'}'}
  ]
{'}'});{'\n\n'}
<span className="text-zinc-500">// Execute</span>{'\n'}
<span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> workflow.<span className="text-yellow-400">run</span>({'{'}
  input: <span className="text-emerald-400">'Analyze market trends'</span>
{'}'});
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enterprise Section */}
            <section id="enterprise" className="relative z-10 py-24 px-8 border-t border-zinc-800/50">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-400">Enterprise</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Scale With</span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Enterprise Features</span>
                    </h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto mb-10">
                        Advanced security, dedicated support, and custom integrations for teams that need more.
                    </p>

                    <div className="grid md:grid-cols-4 gap-4 mb-10">
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">99.9%</p>
                            <p className="text-sm text-zinc-500">Uptime SLA</p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SOC 2</p>
                            <p className="text-sm text-zinc-500">Compliant</p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">24/7</p>
                            <p className="text-sm text-zinc-500">Support</p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SSO</p>
                            <p className="text-sm text-zinc-500">Authentication</p>
                        </div>
                    </div>

                    <Button
                        asChild
                        className="h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-xl shadow-indigo-500/20"
                    >
                        <a href="mailto:enterprise@agentflow.ai">
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Sales
                        </a>
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-8 py-12 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
                {/* Subtle glow at footer */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-500/5 blur-[100px] pointer-events-none" />
                
                <div className="max-w-6xl mx-auto relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-semibold text-base">AgentFlow</span>
                        </Link>

                        <div className="flex items-center gap-6 text-sm text-zinc-500">
                            <Link to="/dashboard/workflows" className="hover:text-white transition-colors">Workflows</Link>
                            <Link to="/dashboard/templates" className="hover:text-white transition-colors">Templates</Link>
                            <Link to="/dashboard/connections" className="hover:text-white transition-colors">Connections</Link>
                            <Link to="/dashboard/analytics" className="hover:text-white transition-colors">Analytics</Link>
                            <Link to="/dashboard/settings" className="hover:text-white transition-colors">Settings</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <a href="https://github.com/Aamod007/Agent-Flow" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-zinc-600">
                            © 2026 AgentFlow. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-xs text-zinc-600">
                            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-zinc-400 transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
