import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    isMainCard?: boolean;
    color?: string; // Re-adding to fix lint error
    delay?: number; // Re-adding to fix lint error
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = '#2563eb', delay = 0, trend, isMainCard }) => {

    if (isMainCard) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: '24px',
                        bgcolor: 'common.white',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="body1" color="text.secondary" fontWeight="600">
                            {title}
                        </Typography>
                        {trend && (
                            <Box
                                sx={{
                                    bgcolor: '#dcfce7',
                                    color: '#166534',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>↗</span> {trend}
                            </Box>
                        )}
                    </Box>
                    <Box display="flex" alignItems="baseline" justifyContent="space-between">
                        <Typography variant="h3" fontWeight="800" sx={{ fontFamily: "'Poppins', sans-serif", color: '#0f172a' }}>
                            {value}
                        </Typography>
                        {trend && (
                            <Typography variant="caption" color="text.secondary" fontWeight="500">
                                vs last month
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </motion.div>
        );
    }

    // Fallback or secondary cards (if used elsewhere, though currently only Main is prominent in my plan)
    // Actually the design only shows one big card, so I might not even need the old design.
    // But keeping it for safety/compatibility.
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    height: '100%',
                    borderRadius: '24px',
                    bgcolor: 'common.white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    },
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            bgcolor: `${color}10`, // Even lighter background
                            color: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {React.cloneElement(icon as React.ReactElement<any>, { fontSize: 'medium' })}
                    </Box>
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5, fontFamily: "'Poppins', sans-serif", color: '#0f172a', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                        {title}
                    </Typography>
                </Box>
            </Paper>
        </motion.div>
    );
};

export default StatCard;
