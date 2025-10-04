// Session Info Component - ItsHard Items Management System
// Component สำหรับแสดงข้อมูล session และเวลาที่เหลือ

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { SessionManager } from '@/utils/sessionManager';

interface SessionInfoProps {
  onLogout: () => void;
  onExtendSession: () => void;
}

const SessionInfo = ({ onLogout, onExtendSession }: SessionInfoProps) => {
  const [sessionInfo, setSessionInfo] = useState(SessionManager.getSessionInfo());
  const [timeLeft, setTimeLeft] = useState(SessionManager.getTimeUntilExpiry());

  // อัปเดตข้อมูล session ทุกนาที
  useEffect(() => {
    const interval = setInterval(() => {
      const info = SessionManager.getSessionInfo();
      const hours = SessionManager.getTimeUntilExpiry();
      
      setSessionInfo(info);
      setTimeLeft(hours);

      // ถ้า session หมดอายุแล้ว ให้ logout อัตโนมัติ
      if (!info.isValid) {
        onLogout();
      }
    }, 60000); // อัปเดตทุกนาที

    return () => clearInterval(interval);
  }, [onLogout]);

  if (!sessionInfo.isValid) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          สถานะการเข้าสู่ระบบ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">เวลาที่เหลือ:</span>
          <Badge variant={sessionInfo.isNearExpiry ? 'destructive' : 'default'}>
            {sessionInfo.timeLeft}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">หมดอายุ:</span>
          <span className="text-sm font-medium">{sessionInfo.expiresAt}</span>
        </div>

        {sessionInfo.isNearExpiry && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Session จะหมดอายุในอีกไม่นาน กรุณาขยายเวลาหรือเข้าสู่ระบบใหม่
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExtendSession}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            ขยายเวลา
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogout}
            className="flex-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionInfo;
