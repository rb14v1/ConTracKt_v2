import { ReportProblem } from '@mui/icons-material';
import { ContractAlertLayout } from '../layout/AlertLayout';
import { useAlerts } from '../hooks/useAlerts';

export const Alerts = () => {
  const { alerts, loading, page, totalPages, nextPage, prevPage } = useAlerts('critical');

  return (
    <ContractAlertLayout
      variant="critical"
      title="Critical Actions"
      description="Contracts expiring within 20 days requiring immediate attention."
      headerIcon={<ReportProblem className="!w-6 !h-6" />}
      filterFn={() => true}
      badgeLabel="Critical Priority"
      actionTitle="Recommended Action"
      actionText="This contract is approaching its expiration date. Please review the terms for renewal or prepare termination notices immediately to avoid service disruption."
      listTitle="Incoming Alerts"
      emptyMessage="No critical alerts."
      
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