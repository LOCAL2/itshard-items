import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types';
import { ItemSchedule } from '@/utils/schedules';

type ViewMode = 'month' | 'week';

interface ScheduleCalendarProps {
	items: Item[];
	schedules: Record<string, ItemSchedule>;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeekMon = (d: Date) => {
	const date = startOfDay(d);
	const day = date.getDay(); // 0 Sun ... 6 Sat
	const diff = (day === 0 ? -6 : 1) - day; // move to Monday
	return addDays(date, diff);
};

const ScheduleCalendar = ({ items, schedules }: ScheduleCalendarProps) => {
	const [mode, setMode] = useState<ViewMode>('month');
	const [selected, setSelected] = useState<Date>(new Date());

	const events = useMemo(() => {
		return items
			.filter((it) => Boolean(schedules[it.id]))
			.map((it) => ({
				item: it,
				start: new Date(schedules[it.id].startISO),
				end: new Date(schedules[it.id].endISO),
			}));
	}, [items, schedules]);

	const dayEvents = useMemo(() => {
		return events.filter((ev) => selected >= startOfDay(ev.start) && selected <= startOfDay(ev.end));
	}, [events, selected]);

	const weekRange = useMemo(() => {
		const start = startOfWeekMon(selected);
		const end = addDays(start, 6);
		return { start, end };
	}, [selected]);

	const weekEvents = useMemo(() => {
		return events.filter((ev) => ev.end >= weekRange.start && ev.start <= weekRange.end);
	}, [events, weekRange]);

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CardTitle>ตารางรายการ</CardTitle>
				<div className="flex items-center gap-2">
					<Button variant={mode === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setMode('month')}>มุมมองเดือน</Button>
					<Button variant={mode === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setMode('week')}>มุมมองสัปดาห์</Button>
				</div>
			</CardHeader>
			<CardContent>
				{mode === 'month' ? (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<Calendar
							mode="single"
							selected={selected}
							onSelect={(d) => d && setSelected(d)}
							modifiers={{
								busy: events.flatMap((ev) => {
									const days: Date[] = [];
									for (let dt = startOfDay(ev.start); dt <= startOfDay(ev.end); dt = addDays(dt, 1)) days.push(new Date(dt));
									return days;
								}),
							}}
							modifiersClassNames={{ busy: 'bg-emerald-100 text-emerald-800' }}
						/>
						<div>
							<div className="text-sm text-muted-foreground mb-2">เหตุการณ์วันที่ {selected.toLocaleDateString('th-TH')}</div>
							<div className="space-y-2">
								{dayEvents.length === 0 ? (
									<div className="text-sm italic text-muted-foreground">ไม่มีรายการในวันนี้</div>
								) : (
									dayEvents.map((ev) => (
										<div key={ev.item.id} className="flex items-center justify-between rounded border p-2">
											<div className="truncate pr-2">{ev.item.item_name}</div>
											<Badge variant="secondary" className="whitespace-nowrap">
												{ev.start.toLocaleDateString('th-TH', { dateStyle: 'medium' })} - {ev.end.toLocaleDateString('th-TH', { dateStyle: 'medium' })}
											</Badge>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">
								สัปดาห์ {weekRange.start.toLocaleDateString('th-TH', { dateStyle: 'medium' })} - {weekRange.end.toLocaleDateString('th-TH', { dateStyle: 'medium' })}
							</div>
							<div className="flex items-center gap-2">
								<Button size="sm" variant="outline" onClick={() => setSelected(addDays(weekRange.start, -1))}>ก่อนหน้า</Button>
								<Button size="sm" variant="outline" onClick={() => setSelected(addDays(weekRange.end, 1))}>ถัดไป</Button>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
							{Array.from({ length: 7 }).map((_, i) => {
								const day = addDays(weekRange.start, i);
								const list = events.filter((ev) => isSameDay(day, ev.start) || (day >= startOfDay(ev.start) && day <= startOfDay(ev.end)));
								return (
									<div key={i} className="rounded border p-2">
										<div className="text-xs font-medium mb-2">{day.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
										<div className="space-y-1">
											{list.length === 0 ? (
												<div className="text-[11px] italic text-muted-foreground">ไม่มี</div>
											) : (
												list.map((ev) => (
													<div key={ev.item.id} className="text-[11px] truncate">
														• {ev.item.item_name}
													</div>
												))
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default ScheduleCalendar;

