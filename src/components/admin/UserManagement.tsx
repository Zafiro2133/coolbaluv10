import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserX, Search, Eye, Shield, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'customer';
  created_at: string;
}

interface UserWithDetails extends UserProfile {
  user_roles?: UserRole[];
  reservations_count?: number;
  total_spent?: number;
  last_reservation?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Fetch user profiles with roles and reservation statistics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get reservation statistics for each user
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: reservations } = await supabase
            .from('reservations')
            .select('total, created_at')
            .eq('user_id', profile.user_id);

          // Find user roles for this profile
          const profileRoles = userRoles?.filter(role => role.user_id === profile.user_id) || [];

          const reservations_count = reservations?.length || 0;
          const total_spent = reservations?.reduce((sum, r) => sum + r.total, 0) || 0;
          const last_reservation = reservations?.length 
            ? reservations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null;

          return {
            ...profile,
            user_roles: profileRoles,
            reservations_count,
            total_spent,
            last_reservation,
          };
        })
      );

      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRole = user.user_roles?.[0]?.role || 'customer';
        return userRole === roleFilter;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const updateUserRole = async (userId: string, newRole: 'admin' | 'customer') => {
    try {
      // First, check if user has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ha sido actualizado a ${newRole}.`,
      });
      
      fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario.",
        variant: "destructive",
      });
    }
  };

  const getUserRole = (user: UserWithDetails): 'admin' | 'customer' => {
    return user.user_roles?.[0]?.role || 'customer';
  };

  const getRoleBadge = (role: 'admin' | 'customer') => {
    return (
      <Badge variant={role === 'admin' ? "default" : "secondary"}>
        {role === 'admin' ? (
          <>
            <Shield className="h-3 w-3 mr-1" />
            Administrador
          </>
        ) : (
          <>
            <UserCheck className="h-3 w-3 mr-1" />
            Cliente
          </>
        )}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 md:w-64"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="customer">Clientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => getUserRole(u) === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => getUserRole(u) === 'customer').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Con Reservas</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => (u.reservations_count || 0) > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Reservas</TableHead>
                  <TableHead>Total Gastado</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(getUserRole(user))}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {user.reservations_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${(user.total_spent || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.last_reservation ? (
                          format(new Date(user.last_reservation), 'dd MMM yyyy', { locale: es })
                        ) : (
                          <span className="text-muted-foreground">Sin reservas</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Usuario</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <UserDetails 
                                user={selectedUser}
                                onRoleUpdate={updateUserRole}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Select
                          value={getUserRole(user)}
                          onValueChange={(newRole: 'admin' | 'customer') => 
                            updateUserRole(user.user_id, newRole)
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron usuarios con los filtros seleccionados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserDetails({ 
  user, 
  onRoleUpdate 
}: { 
  user: UserWithDetails; 
  onRoleUpdate: (userId: string, role: 'admin' | 'customer') => void;
}) {
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserReservations = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            reservation_items(*)
          `)
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          setUserReservations(data);
        }
      } catch (error) {
        console.error('Error fetching user reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserReservations();
  }, [user.user_id]);

  const getUserRole = (): 'admin' | 'customer' => {
    return user.user_roles?.[0]?.role || 'customer';
  };

  return (
    <div className="space-y-6">
      {/* Información Personal */}
      <div>
        <h3 className="font-semibold mb-3">Información Personal</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Nombre:</span> {user.first_name} {user.last_name}
          </div>
          <div>
            <span className="font-medium">Rol:</span> 
            <Badge variant={getUserRole() === 'admin' ? "default" : "secondary"} className="ml-2">
              {getUserRole() === 'admin' ? 'Administrador' : 'Cliente'}
            </Badge>
          </div>
          {user.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span className="font-medium">Teléfono:</span> {user.phone}
            </div>
          )}
          {user.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Dirección:</span> {user.address}
            </div>
          )}
          <div>
            <span className="font-medium">Registrado:</span> {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: es })}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div>
        <h3 className="font-semibold mb-3">Estadísticas</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Reservas</p>
              <p className="text-xl font-bold">{user.reservations_count || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-primary text-xl mb-2">$</div>
              <p className="text-sm text-muted-foreground">Total Gastado</p>
              <p className="text-xl font-bold">${(user.total_spent || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Promedio</p>
              <p className="text-xl font-bold">
                ${user.reservations_count && user.reservations_count > 0 
                  ? Math.round((user.total_spent || 0) / user.reservations_count).toLocaleString()
                  : '0'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Últimas Reservas */}
      <div>
        <h3 className="font-semibold mb-3">Últimas Reservas</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : userReservations.length > 0 ? (
          <div className="space-y-2">
            {userReservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {format(new Date(reservation.event_date), 'dd MMM yyyy', { locale: es })} - {reservation.event_time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.event_address}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {reservation.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${reservation.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.reservation_items?.length || 0} productos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No hay reservas registradas
          </p>
        )}
      </div>

      {/* Cambiar Rol */}
      <div>
        <h3 className="font-semibold mb-3">Gestión de Rol</h3>
        <div className="flex items-center gap-4">
          <Select
            value={getUserRole()}
            onValueChange={(newRole: 'admin' | 'customer') => 
              onRoleUpdate(user.user_id, newRole)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Cambiar el rol del usuario en el sistema
          </p>
        </div>
      </div>
    </div>
  );
}