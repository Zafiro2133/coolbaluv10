import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useAdmin';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Package
} from 'lucide-react';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
            <p className="text-xs text-muted-foreground">
              Todas las reservas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Esperando confirmación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmedReservations}</div>
            <p className="text-xs text-muted-foreground">
              Eventos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Solo reservas confirmadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ingresos del Mes
            </CardTitle>
            <CardDescription>
              Comparativa de ingresos mensuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Este mes:</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(stats.thisMonthRevenue)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total acumulado:</span>
                <span className="text-lg font-bold text-muted-foreground">
                  {formatPrice(stats.totalRevenue)}
                </span>
              </div>

              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((stats.thisMonthRevenue / stats.totalRevenue) * 100, 100)}%` 
                  }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                {stats.thisMonthRevenue > 0 
                  ? `${((stats.thisMonthRevenue / stats.totalRevenue) * 100).toFixed(1)}% del total`
                  : 'Aún no hay ingresos este mes'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos Más Populares
            </CardTitle>
            <CardDescription>
              Los productos más contratados este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularProducts.length > 0 ? (
                stats.popularProducts.map((product, index) => (
                  <div key={product.product_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {product.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.total_quantity} contrataciones
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatPrice(product.total_revenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay datos de productos este mes
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Tareas pendientes y acciones importantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Pagos Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</p>
              <p className="text-xs text-amber-700">Reservas esperando confirmación</p>
            </div>

            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Próximos Eventos</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.confirmedReservations}
              </p>
              <p className="text-xs text-blue-700">Eventos próximos confirmados</p>
            </div>

            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Este Mes</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatPrice(stats.thisMonthRevenue)}
              </p>
              <p className="text-xs text-green-700">Ingresos confirmados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};