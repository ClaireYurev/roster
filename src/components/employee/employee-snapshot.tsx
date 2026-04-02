import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span>{value}</span>
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
              <div>
                <CardTitle className="text-2xl">{employee.currentName}</CardTitle>
                {/* Show legal name as a subtitle only when it differs from the display name */}
                {(employee.legalFirstName || employee.legalLastName) && (() => {
                  const legal = [employee.legalFirstName, employee.legalLastName].filter(Boolean).join(' ')
                  return legal !== employee.currentName ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Legal name: {legal}
                    </p>
                  ) : null
                })()}
                <p className="text-muted-foreground mt-0.5">{employee.currentRole}</p>
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>{employee.currentDepartment}</span>
        </div>

        {/* Two-column grid for contact + HR details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 pt-1">
          {/* Contact info */}
          {employee.workEmail && (
            <ProfileRow icon={Mail} label="Work email" value={employee.workEmail} />
          )}
          {employee.personalEmail && (
            <ProfileRow icon={Mail} label="Personal email" value={employee.personalEmail} />
          )}
          {employee.workPhone && (
            <ProfileRow icon={Phone} label="Work phone" value={employee.workPhone} />
          )}
          {employee.mobilePhone && (
            <ProfileRow icon={Smartphone} label="Mobile" value={employee.mobilePhone} />
          )}

          {/* Location */}
          {employee.workLocation && (
            <ProfileRow icon={MapPin} label="Location" value={employee.workLocation} />
          )}
          {employee.workLocationType && WorkLocIcon && (
            <ProfileRow
              icon={WorkLocIcon}
              label="Work type"
              value={WORK_LOCATION_TYPE_LABELS[employee.workLocationType]}
            />
          )}

          {/* Org */}
          {employee.managerName && (
            <ProfileRow icon={User} label="Manager" value={employee.managerName} />
          )}
          {employee.costCenter && (
            <ProfileRow icon={Landmark} label="Cost center" value={employee.costCenter} />
          )}
          {employee.jobBand && (
            <ProfileRow icon={Briefcase} label="Job band" value={employee.jobBand} />
          )}

          {/* Start date */}
          {startDate && (
            <ProfileRow icon={Layers} label="Start date" value={formatDate(startDate)} />
          )}

          {/* Contract end date — only shown for contractors */}
          {employee.employmentType === 'CONTRACTOR' && employee.contractEndDate && (() => {
            const end = employee.contractEndDate instanceof Date
              ? employee.contractEndDate
              : new Date(employee.contractEndDate)
            const today = new Date(); today.setHours(0,0,0,0)
            end.setHours(0,0,0,0)
            const diff = Math.round((end.getTime() - today.getTime()) / 86400000)
            const isUrgent = diff <= 14
            const isExpired = diff < 0
            return (
              <div className={`flex items-start gap-2 text-sm col-span-2 ${isExpired ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                {isExpired || isUrgent
                  ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  : <CalendarX2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                }
                <div>
                  <span className={isUrgent || isExpired ? '' : 'text-muted-foreground'}>Contract end: </span>
                  <span className="font-medium">{formatDate(employee.contractEndDate)}</span>
                  {isExpired && <span className="ml-1 font-semibold">(EXPIRED {Math.abs(diff)}d ago)</span>}
                  {!isExpired && isUrgent && <span className="ml-1 font-semibold">(in {diff} day{diff !== 1 ? 's' : ''})</span>}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Mailing address */}
        {employee.mailingAddress && (
          <div className="flex items-start gap-2 text-muted-foreground pt-1">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line text-sm">{employee.mailingAddress}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
