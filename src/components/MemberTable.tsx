import { Member } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface MemberTableProps {
  members: Member[];
  isManagerMode?: boolean;
  onStatusChange?: (id: string, status: Member['status']) => void;
  onEdit?: (member: Member) => void;
  onDelete?: (id: string) => void;
  emptyTitle?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

const MemberTable = ({ members, isManagerMode = false, onStatusChange, onEdit, onDelete, emptyTitle, emptyActionLabel, onEmptyAction }: MemberTableProps) => {
  const sortedMembers = [...members].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th', { sensitivity: 'base' }));
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 sm:w-auto">รูปภาพ</TableHead>
              <TableHead className="min-w-[120px]">ชื่อสมาชิก</TableHead>
              <TableHead className="w-24 sm:w-auto">สถานะ</TableHead>
              {isManagerMode && <TableHead className="w-16 sm:w-auto">จัดการ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={isManagerMode ? 4 : 3}>
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-sm text-muted-foreground mb-3">
                      {emptyTitle || 'ยังไม่มีรายชื่อสมาชิก'}
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
            {sortedMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="w-16 sm:w-auto">
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium truncate max-w-[120px] sm:max-w-none">
                  <span className="truncate block" title={member.name}>
                    {member.name}
                  </span>
                </TableCell>
                <TableCell className="w-24 sm:w-auto">
                  {isManagerMode ? (
                    <Select 
                      value={member.status} 
                      onValueChange={(value) => onStatusChange?.(member.id, value as Member['status'])}
                    >
                      <SelectTrigger className="w-full min-w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ยังไม่ส่ง">ยังไม่ส่ง</SelectItem>
                        <SelectItem value="ส่งแล้ว">ส่งแล้ว</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      className={`text-xs px-2 py-0.5 text-white transition-none ${member.status === 'ส่งแล้ว' ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-600'}`}
                    >
                      {member.status}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => onEdit?.(member)}>แก้ไข</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete?.(member.id)} className="text-red-600 focus:text-red-600">ลบ</DropdownMenuItem>
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

export default MemberTable;