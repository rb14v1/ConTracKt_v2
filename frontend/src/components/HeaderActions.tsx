import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../hooks/useAlerts';
import { NotificationButton, ReminderButton } from './ActionButtons'; // Ensure this path is correct

export const HeaderActions = () => {
    const navigate = useNavigate();

    // 🔥 Fetch strict counts for the badges
    const { totalCount: criticalCount } = useAlerts('critical');
    const { totalCount: reminderCount } = useAlerts('upcoming');

    return (
        <div className="flex items-center gap-4">
            <NotificationButton
                count={criticalCount}
                onClick={() => navigate('/alerts')}
            />
            <ReminderButton
                count={reminderCount}
                onClick={() => navigate('/reminders')}
            />
        </div>
    );
};