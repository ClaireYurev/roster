import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Employee } from '@/types'
import { Building2, MapPin, UserCheck, UserX } from 'lucide-react'

export function EmployeeSnapshot({
  employee,
  startDate,
}: {
  employee: Employee
  startDate: Date | null
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{employee.currentName}</CardTitle>
            <p className="text-muted-foreground mt-1">{employee.currentRole}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Badge variant={employee.isActive ? 'default' : 'secondary'}>
              {employee.isActive ? (
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <UserX className="h-3 w-3" />
                  Inactive
                </span>
              )}
            </Badge>
            <Badge variant="outline">
              {EMPLOYMENT_TYPE_LABELS[employee.employmentType] ?? employee.employmentType}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>{employee.currentDepartment}</span>
        </div>
        {employee.mailingAddress && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line">{employee.mailingAddress}</span>
          </div>
        )}
        {startDate && (
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">Started:</span> {formatDate(startDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
