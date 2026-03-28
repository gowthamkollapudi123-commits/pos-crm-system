/**
 * ScheduledReports Component
 *
 * UI for configuring and managing automated report schedules.
 * Schedules are stored in localStorage (frontend-only, no actual automation).
 *
 * Requirements: 12.10
 */

'use client';

import { useState } from 'react';
import { useReportSchedules } from '@/hooks/useReportSchedules';
import { ReportSchedule } from '@/types/entities';
import { format, parseISO } from 'date-fns';
import { PlusIcon, TrashIcon, ClockIcon, ToggleLeftIcon, ToggleRightIcon } from 'lucide-react';

const REPORT_TYPE_LABELS: Record<ReportSchedule['reportType'], string> = {
  sales: 'Sales Report',
  inventory: 'Inventory Report',
  customer: 'Customer Report',
  'product-performance': 'Product Performance',
  'payment-method': 'Payment Method Report',
  'profit-loss': 'Profit & Loss Report',
};

const FREQUENCY_LABELS: Record<ReportSchedule['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ScheduleFormData {
  reportType: ReportSchedule['reportType'];
  frequency: ReportSchedule['frequency'];
  dayOfWeek: number;
  dayOfMonth: number;
  time: string;
  email: string;
}

const DEFAULT_FORM: ScheduleFormData = {
  reportType: 'sales',
  frequency: 'daily',
  dayOfWeek: 1,
  dayOfMonth: 1,
  time: '08:00',
  email: '',
};

export function ScheduledReports() {
  const { schedules, addSchedule, deleteSchedule, toggleSchedule } = useReportSchedules();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ScheduleFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<ScheduleFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<ScheduleFormData> = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Valid email is required' as unknown as string;
    }
    if (!form.time) {
      newErrors.time = 'Time is required' as unknown as string;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addSchedule({
      reportType: form.reportType,
      frequency: form.frequency,
      dayOfWeek: form.frequency === 'weekly' ? form.dayOfWeek : undefined,
      dayOfMonth: form.frequency === 'monthly' ? form.dayOfMonth : undefined,
      time: form.time,
      email: form.email,
    });

    setShowModal(false);
    setForm(DEFAULT_FORM);
    setErrors({});
  };

  const formatNextRun = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'MMM dd, yyyy HH:mm');
    } catch {
      return isoString;
    }
  };

  const getFrequencyDetail = (schedule: ReportSchedule) => {
    if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
      return `Every ${DAY_NAMES[schedule.dayOfWeek]} at ${schedule.time}`;
    }
    if (schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined) {
      return `Day ${schedule.dayOfMonth} of each month at ${schedule.time}`;
    }
    return `Daily at ${schedule.time}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
          <p className="mt-1 text-sm text-gray-600">
            Configure automated report delivery to your email
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Add schedule"
        >
          <PlusIcon className="h-4 w-4" />
          Add Schedule
        </button>
      </div>

      {/* Schedule List */}
      <div className="p-6">
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-base font-medium text-gray-900 mb-1">No schedules configured</h4>
            <p className="text-sm text-gray-500">
              Click &quot;Add Schedule&quot; to set up automated report delivery.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="table">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {REPORT_TYPE_LABELS[schedule.reportType]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="font-medium">{FREQUENCY_LABELS[schedule.frequency]}</span>
                      <br />
                      <span className="text-xs text-gray-500">{getFrequencyDetail(schedule)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{schedule.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatNextRun(schedule.nextRunAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleSchedule(schedule.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={schedule.isActive ? 'Deactivate schedule' : 'Activate schedule'}
                          title={schedule.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {schedule.isActive
                            ? <ToggleRightIcon className="h-5 w-5 text-blue-600" />
                            : <ToggleLeftIcon className="h-5 w-5" />
                          }
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label="Delete schedule"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h4 id="schedule-modal-title" className="text-lg font-semibold text-gray-900">
                Add Report Schedule
              </h4>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="p-6 space-y-4">
                {/* Report Type */}
                <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    id="reportType"
                    value={form.reportType}
                    onChange={(e) => setForm({ ...form, reportType: e.target.value as ReportSchedule['reportType'] })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    id="frequency"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value as ReportSchedule['frequency'] })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Day of Week (weekly only) */}
                {form.frequency === 'weekly' && (
                  <div>
                    <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      id="dayOfWeek"
                      value={form.dayOfWeek}
                      onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DAY_NAMES.map((day, i) => (
                        <option key={day} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Day of Month (monthly only) */}
                {form.frequency === 'monthly' && (
                  <div>
                    <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Month
                    </label>
                    <select
                      id="dayOfMonth"
                      value={form.dayOfMonth}
                      onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Time */}
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                    Time (HH:mm)
                  </label>
                  <input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-describedby={errors.time ? 'time-error' : undefined}
                  />
                  {errors.time && (
                    <p id="time-error" className="mt-1 text-xs text-red-600" role="alert">{errors.time}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="reports@example.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(DEFAULT_FORM); setErrors({}); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
