import React from 'react';
import { Paper, Typography, Box, Avatar, List, ListItem, ListItemText, ListItemAvatar, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface Debtor {
    id: string;
    name: string;
    due_amount: number;
}

interface DebtorsListProps {
    debtors: Debtor[];
}

const DebtorsList: React.FC<DebtorsListProps> = ({ debtors }) => {
    const maxDue = Math.max(...debtors.map(d => d.due_amount), 0);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                borderRadius: '24px',
                height: '100%',
                bgcolor: 'common.white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            }}
        >
            <Typography variant="h6" fontWeight="800" mb={3} sx={{ fontFamily: "'Poppins', sans-serif", color: '#0f172a' }}>
                Top Debtors
            </Typography>
            <List disablePadding>
                {debtors.map((debtor, index) => (
                    <motion.div
                        key={debtor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <ListItem
                            disableGutters
                            sx={{
                                py: 2,
                                borderBottom: index < debtors.length - 1 ? '1px dashed' : 'none',
                                borderColor: 'divider',
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    variant="rounded"
                                    sx={{
                                        bgcolor: `hsl(${340 - index * 20}, 85%, 96%)`,
                                        color: `hsl(${340 - index * 20}, 85%, 45%)`,
                                        fontWeight: 800,
                                        borderRadius: '12px',
                                        width: 48,
                                        height: 48,
                                        fontSize: '1.2rem'
                                    }}
                                >
                                    {debtor.name[0]}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                        <Typography variant="subtitle1" fontWeight="700" color="#1e293b">
                                            {debtor.name}
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight="800" color="error.main">
                                            ₹{debtor.due_amount.toLocaleString('en-IN')}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <LinearProgress
                                        variant="determinate"
                                        value={(debtor.due_amount / maxDue) * 100}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'grey.50',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: `hsl(${340 - index * 20}, 85%, 60%)`,
                                                borderRadius: 3,
                                            },
                                        }}
                                    />
                                }
                            />
                        </ListItem>
                    </motion.div>
                ))}
                {debtors.length === 0 && (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
                        <Box width={48} height={48} borderRadius="50%" bgcolor="grey.50" display="flex" alignItems="center" justifyContent="center">
                            <Typography variant="h4" color="text.secondary">₹</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                            No debtors found
                        </Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
};

export default DebtorsList;
