import { IconButton } from '@mui/material';
import { OpenInNew, AccessTime } from '@mui/icons-material';
import { clsx } from 'clsx';
import type { Alert } from '../../api/types';

interface AlertListItemProps {
    alert: Alert;
    isSelected: boolean;
    theme: any; 
    onClick: () => void;
}

export const AlertListItem = ({ alert, isSelected, theme, onClick }: AlertListItemProps) => (
    <div
        onClick={onClick}
        className={clsx(
            "p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden font-sans",
            isSelected
                ? `bg-white ${theme.listSelected}`
                : `bg-white border-gray-200 ${theme.listHover} hover:shadow-sm`
        )}
    >
        <div className={clsx("absolute left-0 top-0 bottom-0 w-1", theme.getBarColor(alert.days_remaining))} />

        <div className="pl-3">
            <div className="flex justify-between items-start mb-1">
                <h4 className={clsx("font-bold text-sm line-clamp-1", isSelected ? "text-gray-900" : "text-gray-700")}>
                    {alert.title}
                </h4>

                <div className="flex items-center gap-2 ml-2">
                    {alert.file_url && (
                        <IconButton
                            href={alert.file_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="!text-gray-400 hover:!text-[#21b0be] hover:!bg-cyan-50 !p-1.5 !rounded-md !transition-all"
                            title="Open Contract PDF"
                            size="small"
                        >
                            <OpenInNew className="!w-3.5 !h-3.5" />
                        </IconButton>
                    )}
                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", theme.listBadge)}>
                        {alert.days_remaining}d
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <AccessTime className="!w-3 !h-3" />
                <span>Due {alert.expiry_date}</span>
            </div>
        </div>
    </div>
);