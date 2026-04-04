'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EMPLOYMENT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Employee } from '@/types'
import {
  Building2,
  MapPin,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Smartphone,
  User,
  Layers,
  Briefcase,
  Landmark,
  Wifi,
  WifiOff,
  Home,
  CalendarX2,
  AlertTriangle,
  PauseCircle,
} from 'lucide-react'
import { EditableCell } from '@/components/shared/editable-cell'
import { updateEmployeeProfile } from '@/actions/employees'

const WORK_LOCATION_TYPE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}

const WORK_LOCATION_TYPE_ICONS: Record<string, React.ElementType> = {
  REMOTE: Home,
  HYBRID: Wifi,
  ONSITE: WifiOff,
}

function EditableProfileRow({
  icon: Icon,
  label,
  value,
  display,
  onSave,
  type = 'text',
  options,
  placeholder,
  multiline,
}: {
  icon: React.ElementType
  label: string
  value: string | Date | null | undefined
  display?: string
  onSave: (v: string) => Promise<void | { error?: string }>
  type?: 'text' | 'date' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 mt-1 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground text-xs">{label}</span>
        <EditableCell
          value={value}
          display={display ?? (type === 'date' && value ? formatDate(value instanceof Date ? value : new Date(value as string)) : undefined)}
          onSave={onSave}
          type={type}
          options={options}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          emptyLabel="—"
          multiline={multiline}
          className="w-full"
        />
      </div>
    </div>
  )
}

export function EmployeeSnapshot({
  employee,
  startDate,
}: {
  employee: Employee
  startDate: Date | null
}) {
  function save(field: Parameters<typeof updateEmployeeProfile>[1]) {
    return updateEmployeeProfile(employee.id, field, 'MANUAL').then((r) =>
      'error' in r ? { error: r.error as string } : undefined,
    )
  }

  const WorkLocIcon = employee.workLocationType
    ? (WORK_LOCATION_TYPE_ICONS[employee.workLocationType] ?? Layers)
    : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Profile photo */}
          {employee.photoUrl && (
            <img
              src={employee.photoUrl}
              alt={employee.currentName}
              className="h-16 w-16 rounded-full object-cover shrink-0 border"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Display name — editable */}
                <EditableCell
                  value={employee.currentName}
                  onSave={(v) => save({ currentName: v })}
                  className="text-2xl font-bold w-full"
                />
                {/* Legal name subtitle */}
                {(employee.legalFirstName || employee.legalLastName) && (() => {
                  const legal = [employee.legalFirstName, employee.legalLastName].filter(Boolean).join(' ')
                  return legal !== employee.currentName ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Legal: {legal}
                    </p>
                  ) : null
                })()}
                {/* Role — editable */}
                <EditableCell
                  value={employee.currentRole}
                  onSave={(v) => save({ currentRole: v })}
                  className="text-muted-foreground mt-0.5"
                  placeholder="Add role…"
                  emptyLabel="No role set"
                />
                {employee.freshserviceId && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ID: {employee.freshserviceId}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-end shrink-0">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLOYEE_STATUS_COLORS[employee.status] ?? 'bg-gray-100 text-gray-800'}`}>
                  {employee.status === 'ACTIVE' && <UserCheck className="h-3 w-3" />}
                  {employee.status === 'LOA' && <PauseCircle className="h-3 w-3" />}
                  {(employee.status === 'DISABLED_VOLUNTARY' || employee.status === 'DISABLED_INVOLUNTARY') && <UserX className="h-3 w-3" />}
                  {EMPLOYEE_STATUS_LABELS[employee.status] ?? employee.status}
                </span>
                <Badge variant="outline">
                  {EMPLOYMENT_TYPE_LABELS[employee.employmentType] ?? employee.employmentType}
                </Badge>
                {employee.workLocationType && (
                  <Badge variant="outline">
                    {WORK_LOCATION_TYPE_LABELS[employee.workLocationType] ?? employee.workLocationType}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 text-sm">
        {/* Department */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <EditableCell
            value={employee.currentDepartment}
            onSave={(v) => save({ currentDepartment: v })}
            className="flex-1 text-muted-foreground"
            placeholder="Add department…"
            emptyLabel="No department"
          />
        </div>

        {/* Two-column grid for contact + HR details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 pt-1">
          <EditableProfileRow
            icon={Mail}
            label="Work email"
            value={employee.workEmail}
            onSave={(v) => save({ workEmail: v })}
          />
          <EditableProfileRow
            icon={Mail}
            label="Personal email"
            value={employee.personalEmail}
            onSave={(v) => save({ personalEmail: v })}
          />
          <EditableProfileRow
            icon={Phone}
            label="Work phone"
            value={employee.workPhone}
            onSave={(v) => save({ workPhone: v })}
          />
          <EditableProfileRow
            icon={Smartphone}
            label="Mobile"
            value={employee.mobilePhone}
            onSave={(v) => save({ mobilePhone: v })}
          />
          <EditableProfileRow
            icon={MapPin}
            label="Location"
            value={employee.workLocation}
            onSave={(v) => save({ workLocation: v })}
          />
          <EditableProfileRow
            icon={WorkLocIcon ?? Layers}
            label="Work type"
            value={employee.workLocationType}
            display={employee.workLocationType ? WORK_LOCATION_TYPE_LABELS[employee.workLocationType] : undefined}
            onSave={(v) => save({ workLocationType: v as 'REMOTE' | 'HYBRID' | 'ONSITE' })}
            type="select"
            options={[
              { value: 'REMOTE', label: 'Remote' },
              { value: 'HYBRID', label: 'Hybrid' },
              { value: 'ONSITE', label: 'On-site' },
            ]}
          />
          <EditableProfileRow
            icon={User}
            label="Manager"
            value={employee.managerName}
            onSave={(v) => save({ managerName: v })}
          />
          <EditableProfileRow
            icon={Landmark}
            label="Cost center"
            value={employee.costCenter}
            onSave={(v) => save({ costCenter: v })}
          />
          <EditableProfileRow
            icon={Briefcase}
            label="Job band"
            value={employee.jobBand}
            onSave={(v) => save({ jobBand: v })}
          />

          {/* Start date — read-only (set via lifecycle event) */}
          {startDate && (
            <div className="flex items-start gap-2 text-sm">
              <Layers className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Start date: </span>
                <span>{formatDate(startDate)}</span>
              </div>
            </div>
          )}

          {/* Contract end date */}
          {employee.employmentType === 'CONTRACTOR' && (() => {
            const end = employee.contractEndDate
              ? (employee.contractEndDate instanceof Date ? employee.contractEndDate : new Date(employee.contractEndDate))
              : null
            const today = new Date(); today.setHours(0,0,0,0)
            if (end) end.setHours(0,0,0,0)
            const diff = end ? Math.round((end.getTime() - today.getTime()) / 86400000) : null
            const isUrgent = diff != null && diff <= 14
            const isExpired = diff != null && diff < 0
            return (
              <div className={`flex items-start gap-2 text-sm col-span-2 ${isExpired ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                {isExpired || isUrgent
                  ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  : <CalendarX2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                }
                <div className="flex-1 min-w-0">
                  <span className={isUrgent || isExpired ? '' : 'text-muted-foreground'}>Contract end: </span>
                  <EditableCell
                    value={employee.contractEndDate}
                    display={employee.contractEndDate ? formatDate(employee.contractEndDate) : undefined}
                    type="date"
                    emptyLabel="Not set"
                    onSave={(v) => save({ contractEndDate: v || undefined })}
                    className={`inline-flex font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-orange-600 dark:text-orange-400' : ''}`}
                  />
                  {isExpired && diff != null && <span className="ml-1 font-semibold">(EXPIRED {Math.abs(diff)}d ago)</span>}
                  {!isExpired && isUrgent && diff != null && <span className="ml-1 font-semibold">(in {diff} day{diff !== 1 ? 's' : ''})</span>}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Mailing address */}
        <div className="flex items-start gap-2 pt-1">
          <MapPin className="h-4 w-4 shrink-0 mt-1 text-muted-foreground" />
          <EditableCell
            value={employee.mailingAddress}
            onSave={(v) => save({ mailingAddress: v })}
            placeholder="Add mailing address…"
            emptyLabel="—"
            multiline
            className="flex-1 text-muted-foreground"
          />
        </div>
      </CardContent>
    </Card>
  )
}
