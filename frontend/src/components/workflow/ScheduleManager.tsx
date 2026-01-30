/**
 * ScheduleManager Component
 * 
 * Manages cron-based scheduled triggers for workflows.
 * Similar to n8n's schedule trigger configuration.
 */

import React, { useState, useEffect } from 'react';
import { Clock, Trash2, ToggleLeft, ToggleRight, Plus, Play, RefreshCw, Calendar, Info } from 'lucide-react';
import { api } from '@/lib/api';
import type { Schedule } from '@/lib/api';

interface ScheduleManagerProps {
    workflowId: string;
    isOpen: boolean;
    onClose: () => void;
}

const TIMEZONE_OPTIONS = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
];

const CRON_PRESETS: Record<string, { label: string; cron: string; description: string }> = {
    'every-minute': { label: 'Every Minute', cron: '* * * * *', description: 'Runs every minute' },
    'every-5-minutes': { label: 'Every 5 Minutes', cron: '*/5 * * * *', description: 'Runs every 5 minutes' },
    'every-15-minutes': { label: 'Every 15 Minutes', cron: '*/15 * * * *', description: 'Runs every 15 minutes' },
    'every-30-minutes': { label: 'Every 30 Minutes', cron: '*/30 * * * *', description: 'Runs every 30 minutes' },
    'every-hour': { label: 'Every Hour', cron: '0 * * * *', description: 'Runs at the start of every hour' },
    'every-day-9am': { label: 'Daily at 9 AM', cron: '0 9 * * *', description: 'Runs every day at 9:00 AM' },
    'every-day-midnight': { label: 'Daily at Midnight', cron: '0 0 * * *', description: 'Runs every day at midnight' },
    'every-monday-9am': { label: 'Every Monday at 9 AM', cron: '0 9 * * 1', description: 'Runs every Monday at 9:00 AM' },
    'every-weekday-9am': { label: 'Weekdays at 9 AM', cron: '0 9 * * 1-5', description: 'Runs Mon-Fri at 9:00 AM' },
    'every-month-1st': { label: 'Monthly (1st)', cron: '0 0 1 * *', description: 'Runs on the 1st of each month' },
};

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
    workflowId,
    isOpen,
    onClose
}) => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [triggering, setTriggering] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Create form state
    const [selectedPreset, setSelectedPreset] = useState<string>('');
    const [customCron, setCustomCron] = useState<string>('');
    const [timezone, setTimezone] = useState<string>('UTC');
    const [useCustom, setUseCustom] = useState(false);

    useEffect(() => {
        if (isOpen && workflowId) {
            loadSchedules();
        }
    }, [isOpen, workflowId]);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await api.getSchedules(workflowId);
            setSchedules(data);
        } catch (error) {
            console.error('Failed to load schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSchedule = async () => {
        const cronExpr = useCustom ? customCron : CRON_PRESETS[selectedPreset]?.cron;
        if (!cronExpr) return;

        setCreating(true);
        try {
            const schedule = await api.createSchedule(workflowId, {
                cronExpr,
                timezone
            });
            setSchedules(prev => [schedule, ...prev]);
            resetForm();
        } catch (error) {
            console.error('Failed to create schedule:', error);
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setShowCreateForm(false);
        setSelectedPreset('');
        setCustomCron('');
        setTimezone('UTC');
        setUseCustom(false);
    };

    const deleteSchedule = async (id: string) => {
        try {
            await api.deleteSchedule(id);
            setSchedules(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete schedule:', error);
        }
    };

    const toggleSchedule = async (id: string) => {
        try {
            const result = await api.toggleSchedule(id);
            setSchedules(prev => prev.map(s => 
                s.id === id ? { ...s, isActive: result.isActive } : s
            ));
        } catch (error) {
            console.error('Failed to toggle schedule:', error);
        }
    };

    const triggerSchedule = async (id: string) => {
        setTriggering(id);
        try {
            await api.triggerSchedule(id);
            // Reload to get updated stats
            await loadSchedules();
        } catch (error) {
            console.error('Failed to trigger schedule:', error);
        } finally {
            setTriggering(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    const describeCron = (cronExpr: string): string => {
        // Find matching preset
        const preset = Object.values(CRON_PRESETS).find(p => p.cron === cronExpr);
        if (preset) return preset.description;

        // Parse basic cron expressions
        const parts = cronExpr.split(' ');
        if (parts.length !== 5) return 'Custom schedule';

        const [minute, hour] = parts;
        
        if (minute === '*' && hour === '*') return 'Every minute';
        if (minute.startsWith('*/')) return `Every ${minute.slice(2)} minutes`;
        if (hour === '*') return `At minute ${minute}`;
        
        return `At ${hour}:${minute.padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                            <Clock className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Schedule Triggers</h2>
                            <p className="text-xs text-zinc-500">Run this workflow on a schedule</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto bg-zinc-900/30">
                    {/* Create New Schedule */}
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Schedule
                        </button>
                    ) : (
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-4">
                            <h3 className="text-sm font-medium text-zinc-200">New Schedule</h3>
                            
                            {/* Schedule Type Toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUseCustom(false)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                                        !useCustom 
                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                    }`}
                                >
                                    Preset
                                </button>
                                <button
                                    onClick={() => setUseCustom(true)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                                        useCustom 
                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                    }`}
                                >
                                    Custom Cron
                                </button>
                            </div>

                            {!useCustom ? (
                                /* Preset Selection */
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(CRON_PRESETS).map(([key, preset]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedPreset(key)}
                                            className={`p-3 text-left rounded-lg border transition-all ${
                                                selectedPreset === key
                                                    ? 'bg-orange-500/20 border-orange-500/50 text-zinc-100'
                                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className="text-sm font-medium">{preset.label}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5 font-mono">{preset.cron}</div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                /* Custom Cron Input */
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Cron Expression</label>
                                    <input
                                        type="text"
                                        value={customCron}
                                        onChange={e => setCustomCron(e.target.value)}
                                        placeholder="* * * * * (minute hour day month weekday)"
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm font-mono focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none"
                                    />
                                    <div className="mt-2 p-2 bg-zinc-900/50 rounded-lg text-xs text-zinc-500">
                                        <div className="grid grid-cols-5 gap-2 text-center mb-1">
                                            <span>min</span>
                                            <span>hour</span>
                                            <span>day</span>
                                            <span>month</span>
                                            <span>weekday</span>
                                        </div>
                                        <div className="text-center text-zinc-600">
                                            * = any, */n = every n, n = specific value
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timezone */}
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Timezone</label>
                                <select
                                    value={timezone}
                                    onChange={e => setTimezone(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:border-orange-500/50 outline-none"
                                >
                                    {TIMEZONE_OPTIONS.map(tz => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={resetForm}
                                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createSchedule}
                                    disabled={creating || (!useCustom && !selectedPreset) || (useCustom && !customCron)}
                                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {creating && <RefreshCw className="w-3 h-3 animate-spin" />}
                                    Create Schedule
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Schedules List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No schedules configured</p>
                            <p className="text-sm">Create a schedule to run this workflow automatically</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {schedules.map(schedule => (
                                <div 
                                    key={schedule.id}
                                    className={`p-4 rounded-xl border transition-all ${
                                        schedule.isActive 
                                            ? 'bg-zinc-900/50 border-zinc-800' 
                                            : 'bg-zinc-950/50 border-zinc-800/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Cron expression */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <code className="px-2 py-0.5 bg-zinc-800 text-orange-400 rounded text-sm font-mono">
                                                    {schedule.cronExpr}
                                                </code>
                                                {!schedule.isActive && (
                                                    <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded">
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm text-zinc-400 mb-2">
                                                {describeCron(schedule.cronExpr)}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span>Timezone: {schedule.timezone}</span>
                                                <span>Runs: {schedule.runCount || 0}</span>
                                                <span>Last run: {formatDate(schedule.lastRunAt)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 ml-4">
                                            <button
                                                onClick={() => triggerSchedule(schedule.id)}
                                                disabled={triggering === schedule.id}
                                                className="p-2 text-zinc-500 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                title="Run Now"
                                            >
                                                {triggering === schedule.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => toggleSchedule(schedule.id)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    schedule.isActive 
                                                        ? 'text-green-400 hover:bg-green-500/20' 
                                                        : 'text-zinc-500 hover:bg-zinc-800'
                                                }`}
                                                title={schedule.isActive ? 'Disable' : 'Enable'}
                                            >
                                                {schedule.isActive ? (
                                                    <ToggleRight className="w-5 h-5" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteSchedule(schedule.id)}
                                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-orange-400 mt-0.5" />
                            <div className="text-xs text-orange-300">
                                <strong>Schedule Tips:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-orange-300/80">
                                    <li>Schedules run in the specified timezone</li>
                                    <li>Use "Run Now" to test without waiting</li>
                                    <li>Disable schedules when not needed to save resources</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
