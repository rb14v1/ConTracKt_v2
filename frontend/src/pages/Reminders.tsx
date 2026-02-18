import { AccessTime } from '@mui/icons-material';
import { ContractAlertLayout } from '../layout/AlertLayout';
import { useAlerts } from '../hooks/useAlerts';

export const Reminders = () => {
  const { alerts, loading, page, totalPages, nextPage, prevPage } = useAlerts('upcoming');

  return (
    <ContractAlertLayout
      variant="warning"
      title="Upcoming Renewals"
      description="Contracts expiring in 21-60 days. Plan ahead."
      headerIcon={<AccessTime className="!w-6 !h-6" />}
      filterFn={() => true}
      badgeLabel="Upcoming Reminder"
      actionTitle="Early Warning"
      actionText="You have over 3 weeks before this contract expires. Now is a good time to review performance metrics and decide on renewal terms."
      listTitle="Upcoming"
      emptyMessage="No upcoming reminders."
      
      // Pass Pagination Props
      alerts={alerts}
      loading={loading}
      page={page}
      totalPages={totalPages}
      nextPage={nextPage}
      prevPage={prevPage}
    />
  );
};