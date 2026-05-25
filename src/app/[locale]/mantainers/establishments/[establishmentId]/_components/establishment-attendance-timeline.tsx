"use client";

import { Clock, LogIn, LogOut } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import {
  EstablishmentAttendanceMarkType,
  EstablishmentAttendanceTimelineEventDto,
} from "../../_components/establishment.dto";

interface EstablishmentAttendanceTimelineProps {
  events?: EstablishmentAttendanceTimelineEventDto[];
}

export default function EstablishmentAttendanceTimeline({
  events = [],
}: EstablishmentAttendanceTimelineProps) {
  const t = useTranslations("mantainers.establishments.attendance.timeline");

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Clock className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
          <p className="text-xs text-gray-500">{t("subtitle")}</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-10 text-center text-sm text-gray-500">
          {t("empty")}
        </div>
      ) : (
        <div className="max-h-96 space-y-3 overflow-auto pr-2">
          {events.map((event, index) => {
            const isCheckIn = event.type === EstablishmentAttendanceMarkType.CHECK_IN;
            const Icon = isCheckIn ? LogIn : LogOut;
            return (
              <div
                key={`${event.publicId ?? event.employeePublicId}-${index}`}
                className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3"
              >
                <div
                  className={`mt-0.5 rounded-full p-2 ${
                    isCheckIn
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {event.employeeName}
                    </p>
                    <span className="text-xs font-medium text-gray-500">
                      {DateTime.fromISO(event.timestamp).toFormat("dd/MM HH:mm")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white px-2 py-0.5 text-gray-700">
                      {isCheckIn ? t("checkIn") : t("checkOut")}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-gray-700">
                      {event.status}
                    </span>
                    {event.isManual && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                        {t("manual")}
                      </span>
                    )}
                    {event.isAditional && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
                        {t("additional")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
