import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { MainLayout } from './MainLayout';
import type { Alert } from '../api/types';
import { NotificationsOutlined, CheckCircleOutline } from '@mui/icons-material';
import { clsx } from 'clsx';
import { AlertListItem } from '../components/alert/ListItem';
import { AlertDetailView } from '../components/alert/DetailView';
import { ListPagination } from '../components/alert/ListPagination';

// --- Theme Config ---
const THEMES = {
    critical: {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        badge: 'bg-red-50 text-red-700 border-red-100',
        daysText: 'text-red-600',
        listSelected: 'border-red-200 shadow-md ring-1 ring-red-100',
        listHover: 'hover:border-red-200',
        listBadge: 'bg-red-50 text-red-600',
        getBarColor: (days: number) => (days <= 7 ? 'bg-red-600' : 'bg-red-400'),
    },
    warning: {
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        badge: 'bg-orange-50 text-orange-700 border-orange-100',
        daysText: 'text-orange-500',
        listSelected: 'border-orange-200 shadow-md ring-1 ring-orange-100',
        listHover: 'hover:border-orange-200',
        listBadge: 'bg-orange-50 text-orange-600',
        getBarColor: () => 'bg-orange-300',
    },
};

interface ContractAlertLayoutProps {
    variant: 'critical' | 'warning';
    title: string;
    description: string;
    headerIcon: ReactNode;
    filterFn: (alert: Alert) => boolean;
    badgeLabel: string;
    actionTitle: string;
    actionText: string;
    listTitle: string;
    emptyMessage: string;

    // Data Props
    alerts: Alert[];
    loading: boolean;
    page: number;
    totalPages: number;
    nextPage: () => void;
    prevPage: () => void;
}

export const ContractAlertLayout = ({
    variant,
    title,
    description,
    headerIcon,
    badgeLabel,
    actionTitle,
    actionText,
    listTitle,
    emptyMessage,
    // Data Props
    alerts,
    loading,
    page,
    totalPages,
    nextPage,
    prevPage
}: ContractAlertLayoutProps) => {
    const [selected, setSelected] = useState<Alert | null>(null);
    const theme = THEMES[variant];

    useEffect(() => {
        if (alerts.length > 0) {
            setSelected(alerts[0]); // Select first item of new page
        } else {
            setSelected(null);
        }
    }, [alerts]);

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-72px)] bg-gray-50 font-sans">

                {/* --- LEFT PANEL --- */}
                <div className="flex-[2] bg-white border-r border-gray-200 p-8 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                            <span className={clsx("p-2 rounded-lg flex items-center justify-center", theme.iconBg, theme.iconColor)}>
                                {headerIcon}
                            </span>
                            {title}
                        </h1>
                        <p className="text-sm text-gray-500 mb-8 ml-12">{description}</p>

                        {selected ? (
                            <AlertDetailView
                                selected={selected}
                                theme={theme}
                                badgeLabel={badgeLabel}
                                actionTitle={actionTitle}
                                actionText={actionText}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                                {variant === 'critical' ? (
                                    <NotificationsOutlined className="!w-16 !h-16 !mb-4 !opacity-20" />
                                ) : (
                                    <CheckCircleOutline className="!w-16 !h-16 !mb-4 !opacity-20" />
                                )}
                                <p>Select an item from the list to view details.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANEL --- */}
                <div className="flex-1 bg-gray-50/50 border-l border-gray-200 overflow-y-auto min-w-[320px]">
                    <div className="p-6 h-full flex flex-col">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                            {listTitle} ({alerts.length})
                        </h3>

                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {alerts.map((alert) => (
                                <AlertListItem
                                    key={alert.id}
                                    alert={alert}
                                    isSelected={selected?.id === alert.id}
                                    theme={theme}
                                    onClick={() => setSelected(alert)}
                                />
                            ))}

                            {alerts.length === 0 && !loading && (
                                <div className="text-center py-10 text-gray-400 text-sm">{emptyMessage}</div>
                            )}
                        </div>

                        {/* 🔥 CLEAN COMPONENT HERE */}
                        <ListPagination 
                            page={page}
                            totalPages={totalPages}
                            onNext={nextPage}
                            onPrev={prevPage}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};