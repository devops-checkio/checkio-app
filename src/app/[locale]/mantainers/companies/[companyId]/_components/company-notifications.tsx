"use client";

import ModalDelete from "@/app/[locale]/_components/modal-delete";
import {
  CHEKIOActionButton,
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOLoading,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCell,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { useGetRoles } from "@/service/auths.service";
import {
  useCreateCompanyNotification,
  useDeleteCompanyNotification,
  useGetCompanyNotificationsByPublicId,
  useUpdateCompanyNotification,
} from "@/service/mantainer.service";
import axios from "axios";
import { Plus, Save, Trash2, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

enum NotificationTo {
  TO_MANAGER = "TO_MANAGER",
  TO_MAILS = "TO_MAILS",
  TO_ROLE = "TO_ROLE",
}

interface NotificationTemplate {
  name: string;
  description: string;
  code: string;
}

interface CompanyNotification {
  publicId?: string;
  tempId?: string; // Temporary ID for new notifications
  name: string;
  description: string;
  code?: string; // Code to identify the notification process
  enabled: boolean;
  notificationTo: NotificationTo;
  mails: string[] | string;
  roleId?: string;
  days?: string; // Days of week: "LuMi" = Lunes y Miércoles
  executionTime?: string; // Execution time: "8:00", "12:00", "15:00", "17:00"
}

// Email Input Component (Gmail style)
interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function EmailInput({ value, onChange, placeholder }: EmailInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [emailList, setEmailList] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");

  useEffect(() => {
    // Parse existing value (support both comma and semicolon separated)
    if (value) {
      const emails = value
        .split(/[;,\n]/)
        .map((email) => email.trim())
        .filter((email) => email && isValidEmail(email));
      setEmailList(emails);
    } else {
      setEmailList([]);
    }
  }, [value]);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCurrentInput(inputValue);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ";" || e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addEmail(currentInput.trim());
    } else if (
      e.key === "Backspace" &&
      currentInput === "" &&
      emailList.length > 0
    ) {
      // Remove last email if backspace is pressed on empty input
      removeEmail(emailList.length - 1);
    }
  };

  const handleInputBlur = () => {
    // Add email when input loses focus
    if (currentInput.trim()) {
      addEmail(currentInput.trim());
    }
  };

  const addEmail = (email: string) => {
    if (!email) return;

    const trimmedEmail = email.trim();
    if (isValidEmail(trimmedEmail) && !emailList.includes(trimmedEmail)) {
      const newEmailList = [...emailList, trimmedEmail];
      setEmailList(newEmailList);
      onChange(newEmailList.join("; "));
      setCurrentInput("");
    }
  };

  const removeEmail = (index: number) => {
    const newEmailList = emailList.filter((_, i) => i !== index);
    setEmailList(newEmailList);
    onChange(newEmailList.join("; "));
  };

  return (
    <div className="w-full min-h-[42px] border border-gray-300 rounded-none bg-white p-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {emailList.map((email, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-sm text-sm"
        >
          <span>{email}</span>
          <button
            type="button"
            onClick={() => removeEmail(index)}
            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
          >
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onBlur={handleInputBlur}
        placeholder={emailList.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] border-0 outline-none text-sm bg-transparent"
      />
    </div>
  );
}

// Helper function to get notification templates
const getNotificationTemplates = (
  tNotifications: any
): NotificationTemplate[] => [
  {
    name: tNotifications("templates.ALERT_2_CONSECUTIVE_ABSENCES.name"),
    code: "ALERT_2_CONSECUTIVE_ABSENCES",
    description: tNotifications(
      "templates.ALERT_2_CONSECUTIVE_ABSENCES.description"
    ),
  },
  {
    name: tNotifications("templates.ALERT_3_CONSECUTIVE_DAYS_IN_MONTH.name"),
    code: "ALERT_3_CONSECUTIVE_DAYS_IN_MONTH",
    description: tNotifications(
      "templates.ALERT_3_CONSECUTIVE_DAYS_IN_MONTH.description"
    ),
  },
  {
    name: tNotifications("templates.ALERT_2_MONDAYS_IN_MONTH.name"),
    code: "ALERT_2_MONDAYS_IN_MONTH",
    description: tNotifications(
      "templates.ALERT_2_MONDAYS_IN_MONTH.description"
    ),
  },
];

// Helper function to get days of week
const getDaysOfWeek = (tNotifications: any) => [
  {
    code: "Lu",
    label: tNotifications("daysOfWeek.Lu.label"),
    fullName: tNotifications("daysOfWeek.Lu.fullName"),
  },
  {
    code: "Ma",
    label: tNotifications("daysOfWeek.Ma.label"),
    fullName: tNotifications("daysOfWeek.Ma.fullName"),
  },
  {
    code: "Mi",
    label: tNotifications("daysOfWeek.Mi.label"),
    fullName: tNotifications("daysOfWeek.Mi.fullName"),
  },
  {
    code: "Ju",
    label: tNotifications("daysOfWeek.Ju.label"),
    fullName: tNotifications("daysOfWeek.Ju.fullName"),
  },
  {
    code: "Vi",
    label: tNotifications("daysOfWeek.Vi.label"),
    fullName: tNotifications("daysOfWeek.Vi.fullName"),
  },
  {
    code: "Sa",
    label: tNotifications("daysOfWeek.Sa.label"),
    fullName: tNotifications("daysOfWeek.Sa.fullName"),
  },
  {
    code: "Do",
    label: tNotifications("daysOfWeek.Do.label"),
    fullName: tNotifications("daysOfWeek.Do.fullName"),
  },
];

// Execution time options
const EXECUTION_TIMES = ["8:00", "12:00", "15:00", "17:00"];

// Helper functions for days
const parseDays = (
  daysString: string | undefined,
  daysOfWeek: Array<{ code: string }>
): string[] => {
  if (!daysString) return [];
  const days: string[] = [];
  for (let i = 0; i < daysString.length; i += 2) {
    const dayCode = daysString.substring(i, i + 2);
    if (daysOfWeek.some((d) => d.code === dayCode)) {
      days.push(dayCode);
    }
  }
  return days;
};

const formatDays = (selectedDays: string[]): string => {
  return selectedDays.join("");
};

const toggleDay = (
  currentDays: string[],
  dayCode: string,
  daysOfWeek: Array<{ code: string }>
): string[] => {
  if (currentDays.includes(dayCode)) {
    return currentDays.filter((d) => d !== dayCode);
  } else {
    return [...currentDays, dayCode].sort((a, b) => {
      const indexA = daysOfWeek.findIndex((d) => d.code === a);
      const indexB = daysOfWeek.findIndex((d) => d.code === b);
      return indexA - indexB;
    });
  }
};

function CompanyNotifications({
  companyId,
  company,
  canUpdate,
}: {
  companyId: string;
  company: any;
  canUpdate: boolean;
}) {
  const t = useTranslations("mantainers.companies");
  const tNotifications = useTranslations(
    "mantainers.companies.detail.notifications"
  );
  const { toast } = useToast();
  const { data: roles } = useGetRoles();

  const NOTIFICATION_TEMPLATES = getNotificationTemplates(tNotifications);
  const DAYS_OF_WEEK = getDaysOfWeek(tNotifications);

  const {
    data: existingNotifications,
    isLoading,
    refetch,
  } = useGetCompanyNotificationsByPublicId(companyId);
  const { mutate: createNotification, isPending: isCreating } =
    useCreateCompanyNotification();
  const { mutate: updateNotification, isPending: isUpdating } =
    useUpdateCompanyNotification();
  const { mutate: deleteNotification, isPending: isDeleting } =
    useDeleteCompanyNotification();

  // Local state for notifications (API + new ones being created)
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  const [editingForms, setEditingForms] = useState<
    Record<string, CompanyNotification>
  >({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<
    string | null
  >(null);

  // Sync with API data
  useEffect(() => {
    if (existingNotifications) {
      const normalized = existingNotifications.map(
        (n: CompanyNotification) => ({
          ...n,
          mails: Array.isArray(n.mails) ? n.mails.join("; ") : n.mails || "",
          roleId: n.roleId ? String(n.roleId) : undefined,
        })
      );
      setNotifications(normalized);
    }
  }, [existingNotifications]);

  // Add new notification from template
  const handleAddNotification = () => {
    if (!selectedTemplate || !canUpdate) return;

    const template = NOTIFICATION_TEMPLATES.find(
      (t) => t.name === selectedTemplate
    );
    if (!template) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newNotification: CompanyNotification = {
      tempId,
      name: template.name,
      description: template.description,
      code: template.code,
      enabled: false,
      notificationTo: NotificationTo.TO_MANAGER,
      mails: "",
      roleId: undefined,
      days: "",
      executionTime: undefined,
    };

    setNotifications([...notifications, newNotification]);
    setEditingForms({
      ...editingForms,
      [tempId]: { ...newNotification },
    });
    setSelectedTemplate("");
  };

  const handleEdit = (notification: CompanyNotification) => {
    if (!canUpdate) return;
    const id = notification.publicId || notification.tempId || "";
    setEditingForms({
      ...editingForms,
      [id]: {
        ...notification,
      },
    });
  };

  const handleCancel = (notification: CompanyNotification) => {
    const id = notification.publicId || notification.tempId || "";
    const newEditingForms = { ...editingForms };
    delete newEditingForms[id];
    setEditingForms(newEditingForms);

    // If it's a new notification (tempId), remove it from the list
    if (notification.tempId) {
      setNotifications(
        notifications.filter((n) => n.tempId !== notification.tempId)
      );
    }
  };

  const handleFormChange = (
    notification: CompanyNotification,
    field: keyof CompanyNotification,
    value: any
  ) => {
    const id = notification.publicId || notification.tempId || "";
    setEditingForms({
      ...editingForms,
      [id]: {
        ...editingForms[id],
        [field]: value,
      },
    });
  };

  const handleSave = (notification: CompanyNotification) => {
    if (!canUpdate) return;

    const id = notification.publicId || notification.tempId || "";
    const formData = editingForms[id];
    if (!formData) return;

    const notificationData: any = {
      name: formData.name,
      description: formData.description,
      enabled: formData.enabled,
      notificationTo: formData.notificationTo,
      mails:
        formData.notificationTo === NotificationTo.TO_MAILS
          ? typeof formData.mails === "string"
            ? formData.mails
                .split(/[;,\n]/)
                .map((m) => m.trim())
                .filter((m) => m && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m))
            : Array.isArray(formData.mails)
            ? formData.mails.filter(
                (m) => m && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)
              )
            : []
          : [],
      roleId:
        formData.notificationTo === NotificationTo.TO_ROLE && formData.roleId
          ? typeof formData.roleId === "string"
            ? parseInt(formData.roleId, 10)
            : Number(formData.roleId)
          : undefined,
      days: formData.days || undefined,
      executionTime: formData.executionTime || undefined,
    };

    if (notification.publicId) {
      // Update existing - don't include companyId or code
      updateNotification(
        { publicId: notification.publicId, data: notificationData },
        {
          onSuccess: () => {
            toast({
              title: t("notificationUpdateSuccess"),
              description: t("notificationUpdateSuccessDescription"),
            });
            handleCancel(notification);
            refetch();
          },
          onError: (error: any) => {
            if (axios.isAxiosError(error)) {
              toast({
                title: t("notificationUpdateError"),
                description:
                  error.response?.data.message ||
                  t("notificationUpdateErrorDescription"),
              });
            }
          },
        }
      );
    } else {
      // Create new - include companyId and code
      const createData = {
        ...notificationData,
        companyId: companyId,
      };

      // Include code only when creating
      if (formData.code) {
        createData.code = formData.code;
      }

      createNotification(createData, {
        onSuccess: () => {
          toast({
            title: t("notificationCreateSuccess"),
            description: t("notificationCreateSuccessDescription"),
          });
          handleCancel(notification);
          setSelectedTemplate(""); // Clear selector after successful creation
          refetch();
        },
        onError: (error: any) => {
          if (axios.isAxiosError(error)) {
            toast({
              title: t("notificationCreateError"),
              description:
                error.response?.data.message ||
                t("notificationCreateErrorDescription"),
            });
          }
        },
      });
    }
  };

  const handleDeleteClick = (publicId: string) => {
    if (!canUpdate) return;
    setNotificationToDelete(publicId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    return new Promise<void>((resolve, reject) => {
      deleteNotification(notificationToDelete, {
        onSuccess: () => {
          toast({
            title: t("notificationDeleteSuccess"),
            description: t("notificationDeleteSuccessDescription"),
          });
          refetch();
          resolve();
        },
        onError: (error: any) => {
          if (axios.isAxiosError(error)) {
            const errorMessage =
              error.response?.data?.message ||
              t("notificationDeleteErrorDescription");
            toast({
              title: t("notificationDeleteError"),
              description: errorMessage,
            });
            reject(new Error(errorMessage));
          } else {
            reject(error);
          }
        },
      });
    });
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setNotificationToDelete(null);
  };

  const notificationToOptions = [
    { value: NotificationTo.TO_MANAGER, label: t("notificationToManager") },
    { value: NotificationTo.TO_MAILS, label: t("notificationToMails") },
    { value: NotificationTo.TO_ROLE, label: t("notificationToRole") },
  ];

  // Helper function to normalize mails to string
  const getMailsAsString = (mails: string | string[] | undefined): string => {
    if (!mails) return "";
    if (typeof mails === "string") return mails;
    if (Array.isArray(mails)) return mails.join("; ");
    return "";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <CHEKIOLoading
          size="lg"
          variant="modern"
          text={t("loadingNotifications")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("notificationsConfiguration")}
          </h3>
        </div>
        <div className="p-6">
        {canUpdate && (
          <div
            className="mb-6 flex gap-4 items-end"
            data-tour="company-detail-tab-notifications-add"
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("selectNotificationTemplate")}
              </label>
              <CHEKIOSelect
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <CHEKIOSelectTrigger className="w-full">
                  <CHEKIOSelectValue
                    placeholder={t("selectNotificationToAdd")}
                  />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {NOTIFICATION_TEMPLATES.map((template) => (
                    <CHEKIOSelectItem key={template.name} value={template.name}>
                      {template.name} - {template.description}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
            </div>
            <CHEKIOButton
              type="button"
              variant="primary"
              onClick={handleAddNotification}
              disabled={!selectedTemplate}
            >
              <Plus className="h-4 w-4" />
              {t("add") || "Agregar"}
            </CHEKIOButton>
          </div>
        )}

        {notifications.length === 0 ? (
          <div
            className="text-center py-10"
            data-tour="company-detail-tab-notifications-table"
          >
            <p className="text-gray-600 font-medium">
              {t("noNotificationsFound")}
            </p>
          </div>
        ) : (
          <div data-tour="company-detail-tab-notifications-table">
          <CHEKIOTable>
            <CHEKIOTableHeader>
              <tr>
                <CHEKIOTableHead>{t("notificationName")}</CHEKIOTableHead>
                <CHEKIOTableHead>{t("notificationType")}</CHEKIOTableHead>
                <CHEKIOTableHead>
                  {t("notificationDestination")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>
                  {tNotifications("table.daysOfWeek")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>
                  {tNotifications("table.executionTime")}
                </CHEKIOTableHead>
                <CHEKIOTableHead>{t("notificationEnabled")}</CHEKIOTableHead>
                {canUpdate && <CHEKIOTableHead>{t("actions")}</CHEKIOTableHead>}
              </tr>
            </CHEKIOTableHeader>
            <CHEKIOTableBody>
              {notifications.map((notification, index) => {
                const id = notification.publicId || notification.tempId || "";
                const isEditing = !!editingForms[id];
                const formData = editingForms[id] || notification;

                return (
                  <CHEKIOTableRow key={id} index={index}>
                    <CHEKIOTableCell className="font-medium">
                      {isEditing ? (
                        <div className="space-y-2">
                          <CHEKIOInput
                            value={formData.name}
                            onChange={(e) =>
                              handleFormChange(
                                notification,
                                "name",
                                e.target.value
                              )
                            }
                            disabled
                            className="w-full"
                          />
                          <CHEKIOInput
                            value={formData.description}
                            onChange={(e) =>
                              handleFormChange(
                                notification,
                                "description",
                                e.target.value
                              )
                            }
                            disabled
                            className="w-full text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{notification.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {notification.description}
                          </div>
                        </div>
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {isEditing ? (
                        <CHEKIOSelect
                          value={formData.notificationTo}
                          onValueChange={(value) =>
                            handleFormChange(
                              notification,
                              "notificationTo",
                              value as NotificationTo
                            )
                          }
                        >
                          <CHEKIOSelectTrigger className="w-full">
                            <CHEKIOSelectValue />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            {notificationToOptions.map((option) => (
                              <CHEKIOSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </CHEKIOSelectItem>
                            ))}
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                      ) : (
                        notificationToOptions.find(
                          (opt) => opt.value === notification.notificationTo
                        )?.label || notification.notificationTo
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {isEditing ? (
                        <>
                          {formData.notificationTo ===
                            NotificationTo.TO_MAILS && (
                            <EmailInput
                              value={getMailsAsString(formData.mails)}
                              onChange={(value: string) =>
                                handleFormChange(notification, "mails", value)
                              }
                              placeholder={tNotifications("emailPlaceholder")}
                            />
                          )}
                          {formData.notificationTo ===
                            NotificationTo.TO_ROLE && (
                            <CHEKIOSelect
                              value={
                                formData.roleId ? String(formData.roleId) : ""
                              }
                              onValueChange={(value) =>
                                handleFormChange(notification, "roleId", value)
                              }
                            >
                              <CHEKIOSelectTrigger className="w-full">
                                <CHEKIOSelectValue
                                  placeholder={t("selectRole")}
                                />
                              </CHEKIOSelectTrigger>
                              <CHEKIOSelectContent>
                                {roles?.map((role) => (
                                  <CHEKIOSelectItem
                                    key={role.publicId}
                                    value={String(
                                      (role as any).id || role.publicId
                                    )}
                                  >
                                    {role.name}
                                  </CHEKIOSelectItem>
                                ))}
                              </CHEKIOSelectContent>
                            </CHEKIOSelect>
                          )}
                          {formData.notificationTo ===
                            NotificationTo.TO_MANAGER && (
                            <span className="text-gray-500 text-sm">
                              {t("notificationToManagerDescription")}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {notification.notificationTo ===
                            NotificationTo.TO_MAILS && (
                            <div className="text-sm">
                              {Array.isArray(notification.mails) &&
                              notification.mails.length > 0
                                ? notification.mails.join("; ")
                                : typeof notification.mails === "string" &&
                                  notification.mails
                                ? notification.mails
                                : t("noEmailsConfigured")}
                            </div>
                          )}
                          {notification.notificationTo ===
                            NotificationTo.TO_ROLE && (
                            <div className="text-sm">
                              {roles?.find(
                                (r) =>
                                  (r as any).id ===
                                    Number(notification.roleId) ||
                                  r.publicId === String(notification.roleId) ||
                                  r.publicId === notification.roleId
                              )?.name || t("noRoleSelected")}
                            </div>
                          )}
                          {notification.notificationTo ===
                            NotificationTo.TO_MANAGER && (
                            <span className="text-sm text-gray-500">
                              {t("notificationToManagerDescription")}
                            </span>
                          )}
                        </>
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {isEditing ? (
                        <div className="flex gap-1 flex-wrap">
                          {DAYS_OF_WEEK.map((day) => {
                            const selectedDays = parseDays(
                              formData.days,
                              DAYS_OF_WEEK
                            );
                            const isSelected = selectedDays.includes(day.code);
                            return (
                              <CHEKIOButton
                                key={day.code}
                                type="button"
                                variant={
                                  isSelected ? "primary" : "secondaryBlue"
                                }
                                onClick={() => {
                                  const currentDays = parseDays(
                                    formData.days,
                                    DAYS_OF_WEEK
                                  );
                                  const newDays = toggleDay(
                                    currentDays,
                                    day.code,
                                    DAYS_OF_WEEK
                                  );
                                  handleFormChange(
                                    notification,
                                    "days",
                                    formatDays(newDays)
                                  );
                                }}
                                className="min-w-[32px] h-8 px-2 text-xs"
                              >
                                {day.label}
                              </CHEKIOButton>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {DAYS_OF_WEEK.map((day) => {
                            const selectedDays = parseDays(
                              notification.days,
                              DAYS_OF_WEEK
                            );
                            const isSelected = selectedDays.includes(day.code);
                            return (
                              <div
                                key={day.code}
                                className={`min-w-[32px] h-8 px-2 flex items-center justify-center text-xs rounded border ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-gray-100 text-gray-600 border-gray-300"
                                }`}
                              >
                                {day.label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {isEditing ? (
                        <CHEKIOSelect
                          value={formData.executionTime || ""}
                          onValueChange={(value) =>
                            handleFormChange(
                              notification,
                              "executionTime",
                              value
                            )
                          }
                        >
                          <CHEKIOSelectTrigger className="w-full">
                            <CHEKIOSelectValue
                              placeholder={tNotifications("selectTime")}
                            />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            {EXECUTION_TIMES.map((time) => (
                              <CHEKIOSelectItem key={time} value={time}>
                                {time}
                              </CHEKIOSelectItem>
                            ))}
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                      ) : (
                        <div className="text-sm">
                          {notification.executionTime ||
                            tNotifications("notConfigured")}
                        </div>
                      )}
                    </CHEKIOTableCell>
                    <CHEKIOTableCell>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={formData.enabled}
                          onChange={(e) =>
                            handleFormChange(
                              notification,
                              "enabled",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      ) : (
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center ${
                              notification.enabled
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          >
                            {notification.enabled && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </CHEKIOTableCell>
                    {canUpdate && (
                      <CHEKIOTableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <CHEKIOButton
                              type="button"
                              variant="primary"
                              onClick={() => handleSave(notification)}
                              disabled={isUpdating || isCreating}
                            >
                              <Save className="h-4 w-4" />
                            </CHEKIOButton>
                            <CHEKIOButton
                              type="button"
                              variant="secondaryBlue"
                              onClick={() => handleCancel(notification)}
                            >
                              <X className="h-4 w-4" />
                            </CHEKIOButton>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <CHEKIOButton
                              type="button"
                              variant="secondaryBlue"
                              onClick={() => handleEdit(notification)}
                            >
                              {t("edit")}
                            </CHEKIOButton>
                            {notification.publicId && (
                              <CHEKIOActionButton
                                variant="delete"
                                onClick={() =>
                                  handleDeleteClick(notification.publicId!)
                                }
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </CHEKIOActionButton>
                            )}
                          </div>
                        )}
                      </CHEKIOTableCell>
                    )}
                  </CHEKIOTableRow>
                );
              })}
            </CHEKIOTableBody>
          </CHEKIOTable>
          </div>
        )}
        </div>
      </div>

      <ModalDelete
        isOpen={deleteModalOpen}
        onClose={handleDeleteModalClose}
        onDelete={handleDeleteConfirm}
        title={t("notificationDeleteConfirm")}
        message={t("notificationDeleteConfirm")}
        buttonText={tNotifications("delete.button")}
        buttonLoadingText={tNotifications("delete.buttonLoading")}
      />
    </div>
  );
}

export default CompanyNotifications;
