import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  ShieldCheck,
  Timer,
  Car,
  Mail,
  Flag,
  Clock,
  X,
  Copy,
  ExternalLink,
  Package,
} from 'lucide-react';

// Status configuration
interface StatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
  bg: string;
  icon: any;
}

interface PriorityConfig {
  color: string;
  icon: any;
}

const statusConfig: Record<string, StatusConfig> = {
  draft: { variant: 'outline' as const, color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  submitted: { variant: 'outline' as const, color: 'text-blue-600', bg: 'bg-blue-50', icon: Mail },
  pending_supervisor: { variant: 'secondary' as const, color: 'text-amber-600', bg: 'bg-amber-50', icon: Timer },
  pending_department_head: { variant: 'secondary' as const, color: 'text-orange-600', bg: 'bg-orange-50', icon: Building2 },
  pending_hr: { variant: 'secondary' as const, color: 'text-purple-600', bg: 'bg-purple-50', icon: Users },
  pending_security: { variant: 'secondary' as const, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: ShieldCheck },
  approved: { variant: 'default' as const, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  released: { variant: 'default' as const, color: 'text-blue-600', bg: 'bg-blue-50', icon: Car },
  completed: { variant: 'default' as const, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  rejected: { variant: 'destructive' as const, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  cancelled: { variant: 'outline' as const, color: 'text-gray-500', bg: 'bg-gray-50', icon: X },
  expired: { variant: 'destructive' as const, color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
};

const priorityConfig: Record<string, PriorityConfig> = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: Flag },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
  normal: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText },
  low: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
};

export const Route = createFileRoute('/_authenticated/employee/gate-passes')({
  component: GatePassesPage,
});

function GatePassesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const queryClient = useQueryClient();

  // Fetch gate passes
  const { data: gatePassesData, isLoading: gatePassesLoading } = useQuery({
    queryKey: ['gate-passes', searchQuery, selectedStatus, selectedDepartment, selectedType, selectedPriority, page, limit, sortConfig],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedStatus !== 'all') params.append('status_filter', selectedStatus);
      if (selectedDepartment !== 'all') params.append('department_id', selectedDepartment);
      if (selectedType !== 'all') params.append('type_id', selectedType);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sort_by', sortConfig.key);
      params.append('sort_order', sortConfig.direction);

      const response = await apiClient.get(`/gate-passes?${params}`);
      return response.data as any;
    },
  });

  // Fetch gate pass types
  const { data: typesData } = useQuery({
    queryKey: ['gate-pass-types'],
    queryFn: async () => {
      const response = await apiClient.get('/gate-passes/types');
      return (response.data as any).types as any[];
    },
  });

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/departments');
      return response.data as any[];
    },
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    const statusText = status.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
    return (
      <Badge variant={config.variant} className={`${config.bg} ${config.color} border px-2 py-1`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusText}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority] || priorityConfig.normal;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} border px-2 py-1`}>
        <Icon className="h-3 w-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredData = gatePassesData?.gatePasses || [];

  const tableHeaders = [
    { key: 'controlNumber', label: 'Control Number' },
    { key: 'employee', label: 'Employee' },
    { key: 'department', label: 'Department' },
    { key: 'type', label: 'Type' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'destination', label: 'Destination' },
    { key: 'departure', label: 'Departure' },
    { key: 'expectedReturn', label: 'Expected Return' },
    { key: 'approver', label: 'Current Approver' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/shared/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Gate Pass</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-500" />
                  Gate Pass Management
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  View and manage gate pass requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['gate-passes'] })}>
                  <RefreshCw className={`h-4 w-4 ${gatePassesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="container mx-auto px-4 py-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">Gate Pass Requests</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 p-3 bg-muted/50 rounded-lg border">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.keys(statusConfig).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departmentsData?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {typesData?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.keys(priorityConfig).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              {gatePassesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded animate-pulse flex-1" />
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                      <div className="h-4 bg-muted rounded animate-pulse w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Gate Pass Requests Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? `No results matching "${searchQuery}"` : 'No gate pass requests available'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {tableHeaders.map((header) => (
                            <TableHead
                              key={header.key}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort(header.key)}
                            >
                              <div className="flex items-center gap-1">
                                {header.label}
                                {sortConfig.key === header.key && (
                                  sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((gp: any) => (
                          <TableRow key={gp.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{gp.control_number}</TableCell>
                            <TableCell>{gp.employee?.full_name}</TableCell>
                            <TableCell>{gp.employee?.department?.name}</TableCell>
                            <TableCell>{gp.gate_pass_type?.name}</TableCell>
                            <TableCell className="max-w-xs truncate">{gp.purpose}</TableCell>
                            <TableCell className="max-w-xs truncate">{gp.destination}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {gp.departure_date}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {gp.expected_return_date || '-'}
                              </div>
                            </TableCell>
                            <TableCell>{gp.current_approver?.full_name || 'N/A'}</TableCell>
                            <TableCell>{getPriorityBadge(gp.priority)}</TableCell>
                            <TableCell>{getStatusBadge(gp.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(gp.control_number); }}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Control Number
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredData.length)} of {filteredData.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {page} of {gatePassesData?.totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(gatePassesData?.totalPages || 1, p + 1))}
                        disabled={page >= (gatePassesData?.totalPages || 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}