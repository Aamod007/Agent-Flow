import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    Download,
    ChevronDown,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Analytics as AnalyticsData, type AnalyticsHistory } from "@/lib/api";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface MetricCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    loading?: boolean;
}

function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, iconColor, loading }: MetricCardProps) {
    return (
        <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-zinc-400">{title}</p>
                        {loading ? (
                            <div className="flex items-center mt-2">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            </div>
                        ) : (
                            <>
                                <p className="text-2xl font-bold text-zinc-100 mt-2">{value}</p>
                                {change && (
                                    <div className={cn(
                                        "flex items-center gap-1 mt-2 text-sm",
                                        changeType === "positive" && "text-emerald-400",
                                        changeType === "negative" && "text-red-400",
                                        changeType === "neutral" && "text-zinc-500"
                                    )}>
                                        {changeType === "positive" && <TrendingUp className="w-4 h-4" />}
                                        {changeType === "negative" && <TrendingDown className="w-4 h-4" />}
                                        <span>{change}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className={cn("p-2.5 rounded-lg", iconColor)}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ExecutionsChart({ data, loading }: { data: AnalyticsHistory | null; loading: boolean }) {
    if (loading) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-200">Executions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px]">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const chartData = data?.history || [];

    if (chartData.length === 0) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-200">Executions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px] rounded-lg bg-zinc-950 border border-dashed border-zinc-800">
                        <div className="text-center text-zinc-500">
                            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No execution data yet</p>
                            <p className="text-xs mt-1">Run workflows to see trends</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-200">Executions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={11}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#71717a" fontSize={11} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#18181b',
                                border: '1px solid #27272a',
                                borderRadius: '8px',
                                color: '#e4e4e7',
                                fontSize: '12px'
                            }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        />
                        <Area
                            type="monotone"
                            dataKey="completed"
                            name="Completed"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#completedGradient)"
                        />
                        <Area
                            type="monotone"
                            dataKey="failed"
                            name="Failed"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#failedGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function ExecutionDistributionChart({ analytics, loading }: { analytics: AnalyticsData | null; loading: boolean }) {
    if (loading) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-200">Execution Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px]">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const total = analytics?.totalExecutions || 0;
    if (total === 0) {
        return (
            <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-zinc-200">Execution Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px] rounded-lg bg-zinc-950 border border-dashed border-zinc-800">
                        <div className="text-center text-zinc-500">
                            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No execution data yet</p>
                            <p className="text-xs mt-1">Run workflows to see distribution</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const pieData = [
        { name: 'Completed', value: analytics?.successfulExecutions || 0, color: '#10b981' },
        { name: 'Failed', value: analytics?.failedExecutions || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);

    return (
        <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-200">Execution Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                labelLine={{ stroke: '#71717a' }}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    color: '#e4e4e7',
                                    fontSize: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-3">
                    {pieData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-zinc-400">{item.name}: {item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityItem({
    icon: Icon,
    iconColor,
    title,
    description,
    time
}: {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    title: string;
    description: string;
    time: string;
}) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className={cn("p-1.5 rounded-lg shrink-0", iconColor)}>
                <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{title}</p>
                <p className="text-xs text-zinc-500 truncate">{description}</p>
            </div>
            <span className="text-xs text-zinc-500 shrink-0">{time}</span>
        </div>
    );
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export default function Analytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [historyData, setHistoryData] = useState<AnalyticsHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState(7);

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const [analyticsData, history] = await Promise.all([
                api.getAnalytics(),
                api.getAnalyticsHistory(dateRange)
            ]);
            setAnalytics(analyticsData);
            setHistoryData(history);
        } catch (err) {
            console.error("Failed to load analytics:", err);
            setError("Failed to load analytics. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle2, color: "bg-emerald-600" };
            case 'failed':
                return { icon: XCircle, color: "bg-red-600" };
            case 'running':
                return { icon: Activity, color: "bg-indigo-600" };
            default:
                return { icon: Clock, color: "bg-zinc-800" };
        }
    };

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">
                        Analytics
                    </h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        Track performance and usage across your workflows
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
                            onClick={() => setDateRange(dateRange === 7 ? 14 : dateRange === 14 ? 30 : 7)}
                        >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Last {dateRange} days
                            <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-sm text-red-400">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadAnalytics}
                            className="ml-auto text-red-400 hover:text-red-300 h-7"
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Workflows"
                    value={analytics?.totalWorkflows?.toString() || "0"}
                    icon={Activity}
                    iconColor="bg-indigo-600"
                    loading={loading}
                />
                <MetricCard
                    title="Total Executions"
                    value={analytics?.totalExecutions?.toString() || "0"}
                    icon={CheckCircle2}
                    iconColor="bg-purple-600"
                    loading={loading}
                />
                <MetricCard
                    title="Success Rate"
                    value={analytics ? `${analytics.successRate}%` : "0%"}
                    change={analytics && analytics.successRate >= 90 ? "Good performance" : undefined}
                    changeType={analytics && analytics.successRate >= 90 ? "positive" : "neutral"}
                    icon={TrendingUp}
                    iconColor="bg-emerald-600"
                    loading={loading}
                />
                <MetricCard
                    title="Failed Executions"
                    value={analytics?.failedExecutions?.toString() || "0"}
                    icon={XCircle}
                    iconColor="bg-red-600"
                    loading={loading}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ExecutionsChart data={historyData} loading={loading} />
                <ExecutionDistributionChart analytics={analytics} loading={loading} />
            </div>

            {/* Bottom Row */}
            <div className="grid gap-5 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-200">
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-zinc-800">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            </div>
                        ) : analytics?.recentExecutions && analytics.recentExecutions.length > 0 ? (
                            analytics.recentExecutions.map((execution) => {
                                const { icon, color } = getStatusIcon(execution.status);
                                return (
                                    <ActivityItem
                                        key={execution.id}
                                        icon={icon}
                                        iconColor={color}
                                        title={`${execution.workflowName} ${execution.status}`}
                                        description={`Execution ID: ${execution.id.substring(0, 8)}...`}
                                        time={formatTimeAgo(execution.startedAt)}
                                    />
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-zinc-500">
                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                                <p className="text-xs mt-1">Execute a workflow to see activity here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Execution Stats */}
                <Card className="bg-zinc-900/50 border-zinc-800/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-200">
                            Execution Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Total</span>
                                    <span className="text-base font-semibold text-zinc-100">
                                        {analytics?.totalExecutions || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Successful</span>
                                    <span className="text-base font-semibold text-emerald-400">
                                        {analytics?.successfulExecutions || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Failed</span>
                                    <span className="text-base font-semibold text-red-400">
                                        {analytics?.failedExecutions || 0}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Success Rate</span>
                                        <span className={cn(
                                            "text-base font-semibold",
                                            (analytics?.successRate || 0) >= 90
                                                ? "text-emerald-400"
                                                : (analytics?.successRate || 0) >= 70
                                                    ? "text-amber-400"
                                                    : "text-red-400"
                                        )}>
                                            {analytics?.successRate || 0}%
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-2 h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                (analytics?.successRate || 0) >= 90
                                                    ? "bg-emerald-500"
                                                    : (analytics?.successRate || 0) >= 70
                                                        ? "bg-amber-500"
                                                        : "bg-red-500"
                                            )}
                                            style={{ width: `${analytics?.successRate || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
