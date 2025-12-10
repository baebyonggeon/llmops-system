import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Trash2, Bell } from "lucide-react";

interface Notification {
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

export default function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Mock notifications
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
      {
        id: 5,
        notificationId: "notif_5",
        userId: 1,
        trainingId: 5,
        notificationType: "training_failed",
        title: "학습 실패",
        message: "Training 5이(가) 실패했습니다. 사유: GPU 메모리 부족",
        severity: "error",
        isRead: true,
        metadata: JSON.stringify({
          failureReason: "GPU 메모리 부족",
        }),
        createdAt: new Date(Date.now() - 120 * 60000),
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "training_completed":
        return "✓";
      case "loss_threshold":
        return "📉";
      case "accuracy_target":
        return "📈";
      case "training_failed":
        return "✕";
      case "training_started":
        return "▶";
      default:
        return "•";
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const handleDelete = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((n) => n.notificationId !== notificationId)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          알림 센터
        </h1>
        <p className="text-sm text-gray-400">
          학습 완료, Loss 임계값, 정확도 목표 달성 등의 알림을 관리하세요.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-gray-400">전체 알림</p>
            <p className="text-2xl font-bold text-white">{notifications.length}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-gray-400">읽지 않은 알림</p>
            <p className="text-2xl font-bold text-yellow-400">{unreadCount}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-gray-400">읽은 알림</p>
            <p className="text-2xl font-bold text-green-400">
              {notifications.length - unreadCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Notifications */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">알림 목록</CardTitle>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-white/10"
              >
                <Check className="h-4 w-4 mr-2" />
                모두 읽음 표시
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="all">
                모든 알림 ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                읽지 않은 ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                읽은 ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4 space-y-2">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">알림이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.notificationId}
                      className={`p-4 rounded-lg border transition-all ${
                        !notification.isRead
                          ? "border-white/20 bg-white/10"
                          : "border-white/5 bg-white/5 opacity-75"
                      } hover:border-white/30`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-2xl mt-1">
                          {getNotificationIcon(notification.notificationType)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {notification.title}
                            </h3>
                            <Badge className={getSeverityColor(notification.severity)}>
                              {getSeverityLabel(notification.severity)}
                            </Badge>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 ml-auto" />
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString("ko-KR")}
                            {notification.trainingId && (
                              <span className="ml-2 text-gray-600">
                                • Training ID: {notification.trainingId}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() =>
                                handleMarkAsRead(notification.notificationId)
                              }
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded transition-colors"
                              title="읽음 표시"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDelete(notification.notificationId)
                            }
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
