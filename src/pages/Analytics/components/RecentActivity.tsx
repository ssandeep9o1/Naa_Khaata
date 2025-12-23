import React from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import ReceiptIcon from '@mui/icons-material/Receipt';

interface Transaction {
    shop_id: string;
    total_amount: number;
    amount_paid: number;
    created_at: string;
}

interface RecentActivityProps {
    transactions: Transaction[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ transactions }) => {
    // Sort transactions by date desc and take top 5
    const recent = [...transactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                bgcolor: 'background.paper',
            }}
        >
            <Typography variant="h6" fontWeight="600" mb={3} sx={{ fontFamily: "'Poppins', sans-serif" }}>
                Recent Activity
            </Typography>
            <List disablePadding>
                {recent.map((txn, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <ListItem
                            disableGutters
                            sx={{
                                py: 1.5,
                                borderBottom: index < recent.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                    }}
                                >
                                    <ReceiptIcon fontSize="small" />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle2" fontWeight="600">
                                        Payment Received
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" color="text.secondary">
                                        {getTimeAgo(txn.created_at)}
                                    </Typography>
                                }
                            />
                            <Box textAlign="right">
                                <Typography variant="subtitle2" fontWeight="700" color="success.main">
                                    +₹{txn.amount_paid}
                                </Typography>
                                {txn.total_amount > txn.amount_paid && (
                                    <Typography variant="caption" color="error.main">
                                        Due: ₹{txn.total_amount - txn.amount_paid}
                                    </Typography>
                                )}
                            </Box>
                        </ListItem>
                    </motion.div>
                ))}
                {recent.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" py={4}>
                        No recent activity.
                    </Typography>
                )}
            </List>
        </Paper>
    );
};

export default RecentActivity;
