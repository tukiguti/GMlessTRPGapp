// components/battle/common/DiceRollDisplay.tsx
import { Box, Typography, Grid, Paper } from '@mui/material';
import { DiceRoll } from '../../../models/types';

interface DiceRollDisplayProps {
    attackRoll?: DiceRoll;
    defenseRoll?: DiceRoll;
    isSuccess?: boolean;
    showResult?: boolean;
}

const DiceRollDisplay = ({
    attackRoll,
    defenseRoll,
    isSuccess,
    showResult = true
}: DiceRollDisplayProps) => {
    if (!attackRoll && !defenseRoll) return null;

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={1}>
                {attackRoll && (
                    <Grid item xs={defenseRoll ? 6 : 12}>
                        <Paper sx={{ p: 1, bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
                            <Typography variant="body2">攻撃</Typography>
                            <Typography variant="h6" color="error.main" fontWeight="bold">
                                {attackRoll.total}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                                {attackRoll.values?.map((val, idx) => (
                                    <Box key={idx} sx={{
                                        width: 24,
                                        height: 24,
                                        border: '1px solid',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {val}
                                    </Box>
                                ))}
                            </Box>
                            <Typography variant="h6" color="error.main">{attackRoll.total}</Typography>
                        </Paper>
                    </Grid>
                )}

                {defenseRoll && (
                    <Grid item xs={attackRoll ? 6 : 12}>
                        <Paper sx={{ p: 1, bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                            <Typography variant="body2">回避</Typography>
                            <Typography variant="body2">{defenseRoll.dice}</Typography>
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                                {defenseRoll.values?.map((val, idx) => (
                                    <Box key={idx} sx={{
                                        width: 24,
                                        height: 24,
                                        border: '1px solid',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {val}
                                    </Box>
                                ))}
                            </Box>
                            <Typography variant="h6" color="primary.main">{defenseRoll.total}</Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {showResult && isSuccess !== undefined && attackRoll && defenseRoll && (
                <Box sx={{
                    mt: 2,
                    p: 1,
                    border: `2px solid ${isSuccess ? 'green' : 'red'}`,
                    borderRadius: 1,
                    bgcolor: isSuccess ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                }}>
                    <Typography variant="body1" fontWeight="bold" color={isSuccess ? 'success.main' : 'error.main'}>
                        攻撃{isSuccess ? '成功' : '失敗'}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default DiceRollDisplay;