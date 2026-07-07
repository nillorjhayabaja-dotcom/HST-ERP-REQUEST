import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, User, Car, FileText } from 'lucide-react';

const createGatePassSchema = z.object({
  gate_pass_type_id: z.string().min(1, 'Gate pass type is required'),
  departure_date: z.string().min(1, 'Departure date is required'),
  departure_time: z.string().min(1, 'Departure time is required'),
  expected_return_date: z.string().optional(),
  expected_return_time: z.string().optional(),
  destination: z.string().min(1, 'Destination is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  remarks: z.string().optional(),
  vehicle_type: z.enum(['company', 'private', 'public_transport', 'walking']),
  private_vehicle_plate: z.string().optional(),
  driver_name: z.string().optional(),
  driver_license: z.string().optional(),
  mileage_start: z.string().optional(),
});

type CreateGatePassForm = z.infer<typeof createGatePassSchema>;

export const Route = createFileRoute('/_authenticated/gate-passes')({
  component: GatePassesPage,
});

function GatePassesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGatePass, setSelectedGatePass] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue } = useForm<CreateGatePassForm>({
    resolver: zodResolver(createGatePassSchema),
    defaultValues: {
      vehicle_type: 'private',
    },
  });

  const vehicleType = watch('vehicle_type');

  // Fetch gate passes
  const { data: gatePassesData, isLoading } = useQuery({
    queryKey: ['gate-passes', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      const response = await apiClient.get(`/gate-passes?${params}`);
      return response.data as { gatePasses: any[]; total: number; page: number; limit: number; totalPages: number };
    },
  });

  // Fetch gate pass types
  const { data: typesData } = useQuery({
    queryKey: ['gate-pass-types'],
    queryFn: async () => {
      const response = await apiClient.get('/gate-passes/types');
      return response.data as any[];
    },
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['gate-passes-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/gate-passes/dashboard/stats');
      return response.data as {
        pendingRequests: number;
        approvedToday: number;
        rejectedToday: number;
        released: number;
        returned: number;
        pendingApprovals: number;
        vehicleUsage: number;
      };
    },
  });

  // Create gate pass mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGatePassForm) => {
      const response = await apiClient.post('/gate-passes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
      queryClient.invalidateQueries({ queryKey: ['gate-passes-dashboard'] });
      setIsDialogOpen(false);
      reset();
      toast.success('Gate pass created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create gate pass');
    },
  });

  // Submit gate pass mutation
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/gate-passes/${id}/submit`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
      toast.success('Gate pass submitted for approval');
    },
  });

  const onSubmit = (data: CreateGatePassForm) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      submitted: 'outline',
      approved: 'default',
      rejected: 'destructive',
      released: 'default',
      completed: 'default',
      returned: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      company: 'Company Vehicle',
      private: 'Private Vehicle',
      public_transport: 'Public Transportation',
      walking: 'Walking',
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gate Pass Management</h1>
          <p className="text-muted-foreground">Manage employee gate passes and approvals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Gate Pass</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Gate Pass</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new gate pass request
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate_pass_type_id">Gate Pass Type</Label>
                <Select onValueChange={(value) => setValue('gate_pass_type_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gate pass type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesData?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure_date">Departure Date</Label>
                  <Input type="date" {...register('departure_date')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Departure Time</Label>
                  <Input type="time" {...register('departure_time')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_return_date">Expected Return Date</Label>
                  <Input type="date" {...register('expected_return_date')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_return_time">Expected Return Time</Label>
                  <Input type="time" {...register('expected_return_time')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input {...register('destination')} placeholder="Enter destination" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea {...register('purpose')} placeholder="Enter purpose of visit" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Select onValueChange={(value) => setValue('vehicle_type', value as any)} defaultValue="private">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private Vehicle</SelectItem>
                    <SelectItem value="company">Company Vehicle</SelectItem>
                    <SelectItem value="public_transport">Public Transportation</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {vehicleType === 'private' && (
                <div className="space-y-2">
                  <Label htmlFor="private_vehicle_plate">Vehicle Plate Number</Label>
                  <Input {...register('private_vehicle_plate')} placeholder="ABC-1234" />
                </div>
              )}

              {vehicleType === 'company' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Driver Name</Label>
                    <Input {...register('driver_name')} placeholder="Enter driver name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver_license">Driver License Number</Label>
                    <Input {...register('driver_license')} placeholder="Enter license number" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea {...register('remarks')} placeholder="Any additional remarks" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create Gate Pass
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvedToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.released || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gate Passes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gate Passes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="released">Released</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Control Number</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gatePassesData?.gatePasses?.map((gp: any) => (
                      <TableRow key={gp.id}>
                        <TableCell className="font-medium">{gp.control_number}</TableCell>
                        <TableCell>{gp.employee?.full_name}</TableCell>
                        <TableCell>{gp.gate_pass_type?.name}</TableCell>
                        <TableCell>{gp.destination}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {gp.departure_date}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(gp.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGatePass(gp)}
                            >
                              View
                            </Button>
                            {gp.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => submitMutation.mutate(gp.id)}
                              >
                                Submit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Gate Pass Dialog */}
      {selectedGatePass && (
        <Dialog open={!!selectedGatePass} onOpenChange={() => setSelectedGatePass(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Gate Pass Details</DialogTitle>
              <DialogDescription>
                Control Number: {selectedGatePass.control_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <p className="text-sm">{selectedGatePass.employee?.full_name}</p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm">{selectedGatePass.employee?.department?.name}</p>
                </div>
                <div>
                  <Label>Destination</Label>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedGatePass.destination}
                  </p>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <p className="text-sm">{selectedGatePass.purpose}</p>
                </div>
                <div>
                  <Label>Departure</Label>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedGatePass.departure_date} {selectedGatePass.departure_time}
                  </p>
                </div>
                <div>
                  <Label>Vehicle Type</Label>
                  <p className="text-sm flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {getVehicleTypeLabel(selectedGatePass.vehicle_type)}
                  </p>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedGatePass.status)}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}