import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export interface Notification {
  id: number;
  notificationId: string;
  userId: number;
  trainingId?: number;
  notificationType: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  isRead: boolean;
  metadata?: string;
  createdAt: Date;
  readAt?: Date;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        notificationId: "notif_1",
        userId: 1,
        trainingId: 1,
        notificationType: "training_completed",
        title: "학습 완료",
        message: "Training 1이(가) 완료되었습니다. 최종 Loss: 0.1234, 정확도: 92.50%",
        severity: "success",
        isRead: false,
        metadata: JSON.stringify({
          finalLoss: 0.1234,
          finalAccuracy: 92.5,
          finalEpoch: 20,
        }),
        createdAt: new Date(Date.now() - 5 * 60000),
      },
      {
        id: 2,
        notificationId: "notif_2",
        userId: 1,
        trainingId: 2,
        notificationType: "loss_threshold",
        title: "Loss 임계값 도달",
        message: "Training 2의 Loss가 0.1000에 도달했습니다. (현재: 0.0956)",
        severity: "success",
        isRead: false,
        metadata: JSON.stringify({
          metricType: "loss_threshold",
          threshold: 0.1,
          currentValue: 0.0956,
          epoch: 15,
        }),
        createdAt: new Date(Date.now() - 10 * 60000),
      },
      {
        id: 3,
        notificationId: "notif_3",
        userId: 1,
        trainingId: 3,
        notificationType: "accuracy_target",
        title: "정확도 목표 달성",
        message: "Training 3의 정확도가 90.00%에 도달했습니다. (현재: 92.34%)",
        severity: "success",
        isRead: true,
        metadata: JSON.stringify({
          metricType: "accuracy_target",
          threshold: 90,
          currentValue: 92.34,
          epoch: 12,
        }),
        createdAt: new Date(Date.now() - 30 * 60000),
      },
      {
        id: 4,
        notificationId: "notif_4",
        userId: 1,
        trainingId: 4,
        notificationType: "training_started",
        title: "학습 시작",
        message: 'Training "WISE LLM Advanced"이(가) 시작되었습니다.',
        severity: "info",
        isRead: true,
        metadata: JSON.stringify({
          trainingName: "WISE LLM Advanced",
        }),
        createdAt: new Date(Date.now() - 60 * 60000),
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-500/20 text-green-300";
      case "warning":
        return "bg-yellow-500/20 text-yellow-300";
      case "error":
        return "bg-red-500/20 text-red-300";
      case "info":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "success":
        return "성공";
      case "warning":
        return "경고";
      case "error":
        return "오류";
      case "info":
        return "정보";
      default:
        return severity;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.notificationId !== notificationId)
    );
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
          <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">알림</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                읽지 않은 알림: {unreadCount}개
              </p>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">알림이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`p-4 hover:bg-white/5 transition-colors ${
                    !notification.isRead ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {notification.title}
                        </h4>
                        <Badge className={getSeverityColor(notification.severity)}>
                          {getSeverityLabel(notification.severity)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() =>
                            handleMarkAsRead(notification.notificationId)
                          }
                          className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                          title="읽음 표시"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notification.notificationId)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="닫기"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-3">
              <Button
                variant="outline"
                className="w-full text-xs border-white/10 hover:bg-white/10"
              >
                모든 알림 보기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
