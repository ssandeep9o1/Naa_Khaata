import React from 'react';
import { Paper, Typography, Box, useTheme, Grid as Grid } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';

interface ChartData {
    date: string;
    Credit: number;
    Collected: number;
}

interface PieData {
    name: string;
    value: number;
    color: string;
}

interface AnalyticsChartsProps {
    data: ChartData[];
    pieData: PieData[];
    debtorsData?: { name: string; due_amount: number }[];
    busyDaysData?: { name: string; count: number }[];
    type: 'trend' | 'donut' | 'activity' | 'debtors' | 'volume' | 'creditVsCollected' | 'busyDays';
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: '24px',
                bgcolor: 'common.white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            <Typography variant="h6" fontWeight="700" color="text.primary">
                {title}
            </Typography>
            {children}
        </Paper>
    );
};

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, pieData, debtorsData = [], busyDaysData = [], type }) => {
    const theme = useTheme();

    if (type === 'trend') {
        return (
            <ChartCard title="Weekly Sales Trend">
                <Box height={200} width="100%">
                    <ResponsiveContainer>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                                dy={10}
                                minTickGap={20}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="Collected"
                                stroke={theme.palette.primary.main}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </ChartCard>
        );
    }

    if (type === 'donut') {
        return (
            <ChartCard title="Credit Ratio">
                <Box height={200} width="100%" position="relative">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span style={{ color: theme.palette.text.secondary, fontSize: '12px' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <Box
                        position="absolute"
                        top="40%"
                        left="50%"
                        sx={{ transform: 'translate(-50%, -50%)', textAlign: 'center' }}
                    >
                        {/* Optional center text if needed */}
                    </Box>
                </Box>
            </ChartCard>
        );
    }

    if (type === 'activity') {
        const activityData = [
            { name: 'New', value: 45, fill: '#64748b' },
            { name: 'Returning', value: 65, fill: '#475569' }
        ];

        return (
            <ChartCard title="Customer Activity">
                <Box height={200} width="100%">
                    <ResponsiveContainer>
                        <BarChart data={activityData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {activityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </ChartCard>
        );
    }

    if (type === 'creditVsCollected') {
        return (
            <ChartCard title="Credit vs Collected">
                <Box height={250} width="100%">
                    <ResponsiveContainer>
                        <BarChart data={data} barSize={10}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                                dy={10}
                                minTickGap={20}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="Credit" name="Given Credit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Collected" name="Received Cash" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </ChartCard>
        );
    }

    if (type === 'debtors') {
        // Use real data passed via props, fallback to empty if generic
        const chartData = debtorsData.length > 0 ? debtorsData : [];

        return (
            <ChartCard title="Top Debtors">
                <Box height={250} width="100%">
                    <ResponsiveContainer>
                        <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={80}
                                tick={{ fill: theme.palette.text.primary, fontWeight: 500, fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="due_amount" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                                <LabelList dataKey="due_amount" position="right" fill="#64748b" fontSize={11} formatter={(val: any) => `₹${val}`} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </ChartCard>
        );
    }

    if (type === 'busyDays') {
        return (
            <ChartCard title="Busy Days">
                <Box height={200} width="100%">
                    <ResponsiveContainer>
                        <BarChart data={busyDaysData} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </ChartCard>
        );
    }

    if (type === 'volume') {
        // Use real data (count) passed via props
        return (
            <ChartCard title="Transaction Volume">
                <Box height={200} width="100%">
                    <ResponsiveContainer>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} strokeOpacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                                dy={10}
                                minTickGap={20}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="#8b5cf6"
                                fillOpacity={0.1}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </ChartCard>
        );
    }

    return null;
};

export default AnalyticsCharts;
