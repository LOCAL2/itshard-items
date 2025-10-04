export interface Member {
  id: string;
  name: string;
  status: 'ยังไม่ส่ง' | 'ส่งแล้ว';
  avatar: string;
}

export interface Item {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  display_order?: number;
}