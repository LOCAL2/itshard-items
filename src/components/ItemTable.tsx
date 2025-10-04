import { Item } from '@/types';
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreVertical } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';
import { ItemSchedule, formatThaiDateTime } from '@/utils/schedules';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ItemTableProps {
  items: Item[];
  isManagerMode?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (id: string) => void;
  schedules?: Record<string, ItemSchedule>;
  showSelection?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, checked: boolean) => void;
  onScheduleClick?: (item: Item) => void;
  onClearScheduleClick?: (item: Item) => void;
  emptyTitle?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

const ItemTable = ({
  items,
  isManagerMode = false,
  onEdit,
  onDelete,
  schedules,
  showSelection = false,
  selectedIds,
  onToggleSelect,
  onScheduleClick,
  onClearScheduleClick,
  emptyTitle,
  emptyActionLabel,
  onEmptyAction
}: ItemTableProps) => {
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const getRemainingLabel = (endISO: string): string => {
    const end = new Date(endISO).getTime();
    const delta = end - nowTick;
    if (!Number.isFinite(end)) return '';
    if (delta <= 0) return 'หมดเวลา';
    const minutes = Math.floor(delta / 60000);
    const days = Math.floor(minutes / (60 * 24));
    if (days >= 1) return `เหลือ ${days} วัน`;
    const hours = Math.floor(minutes / 60);
    if (hours >= 1) return `เหลือ ${hours} ชม.`;
    return `เหลือ ${minutes} นาที`;
  };
  const allSelectableIds = isManagerMode && showSelection ? items.map(i => i.id) : [];
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds?.has(id));
  const someSelected = allSelectableIds.some(id => selectedIds?.has(id));

  const handleToggleAll = (checked: boolean) => {
    if (!onToggleSelect) return;
    allSelectableIds.forEach(id => onToggleSelect(id, checked));
  };
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sm:min-w-[160px]">
                <div className="flex items-center gap-2">
                  {isManagerMode && showSelection && (
                    <Checkbox
                      checked={allSelected ? true : (someSelected ? 'indeterminate' : false)}
                      onCheckedChange={(c) => handleToggleAll(Boolean(c))}
                      aria-label="เลือกทั้งหมด"
                    />
                  )}
                  <span>ชื่อสิ่งของ</span>
                </div>
              </TableHead>
              <TableHead className="w-20 sm:w-auto text-right">จำนวน</TableHead>
              <TableHead className="w-16 sm:w-auto">หน่วย</TableHead>
              <TableHead className="sm:min-w-[200px] hidden sm:table-cell">ช่วงเวลา</TableHead>
              {isManagerMode && <TableHead className="sm:w-28">จัดการ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={isManagerMode ? 5 : 4}>
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-sm text-muted-foreground mb-3">
                      {emptyTitle || 'ยังไม่มีของต้องส่งเว้ยสบายจัด'}
                    </div>
                    {emptyActionLabel && (
                      <Button size="sm" onClick={onEmptyAction} className="whitespace-nowrap">
                        {emptyActionLabel}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium sm:truncate sm:max-w-[200px] align-top">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate block" title={item.item_name}>
                      <span className="inline-flex items-center gap-2">
                        {isManagerMode && showSelection && (
                          <Checkbox
                            checked={selectedIds?.has(item.id) ?? false}
                            onCheckedChange={(checked) => onToggleSelect?.(item.id, Boolean(checked))}
                          />
                        )}
                        <span className="truncate">{item.item_name}</span>
                        {(schedules && schedules[item.id]) && (
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {getRemainingLabel(schedules[item.id].endISO)}
                          </Badge>
                        )}
                      </span>
                    </span>
                    {/* Mobile-only schedule inline on the right */}
                    <span className="sm:hidden text-xs text-muted-foreground whitespace-nowrap">
                      {(schedules && schedules[item.id]) ? (
                        'กำหนดเวลา'
                      ) : (
                        <span className="italic">ยังไม่ตั้งค่า</span>
                      )}
                    </span>
                  </div>
                  {/* Mobile-only detailed schedule (second line) when exists */}
                  {(schedules && schedules[item.id]) && (
                    <div className="sm:hidden text-[11px] text-muted-foreground mt-1 leading-snug">
                      <div>เริ่ม: {formatThaiDateTime(new Date(schedules[item.id].startISO))}</div>
                      <div>ถึง: {formatThaiDateTime(new Date(schedules[item.id].endISO))}</div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="w-20 sm:w-auto text-right font-mono text-sm">
                  {formatNumberWithCommas(item.quantity)}
                </TableCell>
                <TableCell className="w-16 sm:w-auto text-sm">{item.unit}</TableCell>
                <TableCell className="text-xs text-muted-foreground align-top pt-3 sm:whitespace-normal whitespace-pre-wrap break-words hidden sm:table-cell">
                  {(schedules && schedules[item.id]) ? (
                    <div className="space-y-0.5">
                      <div>เริ่ม: {formatThaiDateTime(new Date(schedules[item.id].startISO))}</div>
                      <div>ถึง: {formatThaiDateTime(new Date(schedules[item.id].endISO))}</div>
                    </div>
                  ) : (
                    <span className="italic">ยังไม่ตั้งค่า</span>
                  )}
                </TableCell>
                {isManagerMode && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit?.(item)}>แก้ไข</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onScheduleClick?.(item)}>ตั้งเวลา</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onClearScheduleClick?.(item)}>ล้างเวลา</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete?.(item.id)} className="text-red-600 focus:text-red-600">ลบ</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ItemTable;