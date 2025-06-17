import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Edit, Trash2, Search, MapPin, Building } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { queryClient } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import type { User, InsertUser, Store, Warehouse } from '../../../shared/schema';

// Form schemas
const userSchema = z.object({
  username: z.string().min(3, 'Имя пользователя должно содержать минимум 3 символа'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').optional(),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email адрес'),
  role: z.enum(['admin', 'manager', 'storekeeper', 'cashier']),
  locationId: z.number().optional(),
  locationType: z.enum(['store', 'warehouse']).optional(),
});

const createUserSchema = userSchema.extend({
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

const updateUserSchema = userSchema.extend({
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').optional(),
});

type UserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

const ROLE_NAMES = {
  admin: 'Администратор',
  manager: 'Менеджер',
  storekeeper: 'Кладовщик',
  cashier: 'Кассир',
};

const LOCATION_TYPE_NAMES = {
  store: 'Магазин',
  warehouse: 'Склад',
};

const Employees = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users'),
  });

  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
    queryFn: () => apiRequest('/api/stores'),
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiRequest('/api/warehouses'),
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => 
      apiRequest('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddModalOpen(false);
      toast({ title: 'Пользователь создан успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при создании пользователя', variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserFormData }) => {
      // Remove password from data if it's empty
      const { password, ...restData } = data;
      const finalData = password ? data : restData;
      
      return apiRequest(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditModalOpen(false);
      setEditingUser(null);
      toast({ title: 'Пользователь обновлен успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при обновлении пользователя', variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/users/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: 'Пользователь удален успешно' });
    },
    onError: () => {
      toast({ title: 'Ошибка при удалении пользователя', variant: 'destructive' });
    },
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getLocationName = (user: User) => {
    if (!user.locationId || !user.locationType) return 'Не назначено';
    
    if (user.locationType === 'store') {
      const store = stores.find(s => s.id === user.locationId);
      return store ? `${store.name} (${store.region})` : 'Неизвестный магазин';
    } else {
      const warehouse = warehouses.find(w => w.id === user.locationId);
      return warehouse ? `${warehouse.name} (${warehouse.city})` : 'Неизвестный склад';
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление сотрудниками</h1>
          <p className="text-gray-600 mt-1">Управление учетными записями и правами доступа</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Добавить сотрудника
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Поиск сотрудников..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="manager">Менеджер</option>
          <option value="storekeeper">Кладовщик</option>
          <option value="cashier">Кассир</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          {usersLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка сотрудников...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || selectedRole ? 'Сотрудники не найдены' : 'Нет зарегистрированных сотрудников'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Роль</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Локация</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Контакты</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Создан</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'storekeeper' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ROLE_NAMES[user.role as keyof typeof ROLE_NAMES]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        {user.locationType === 'store' ? (
                          <Building size={16} className="mr-1" />
                        ) : user.locationType === 'warehouse' ? (
                          <MapPin size={16} className="mr-1" />
                        ) : null}
                        {getLocationName(user)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <UserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(data) => createUserMutation.mutate(data as UserFormData)}
          title="Добавить сотрудника"
          stores={stores}
          warehouses={warehouses}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <UserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={(data) => updateUserMutation.mutate({ id: editingUser.id, data: data as UpdateUserFormData })}
          title="Редактировать сотрудника"
          initialData={editingUser}
          stores={stores}
          warehouses={warehouses}
          isLoading={updateUserMutation.isPending}
        />
      )}
    </div>
  );
};

// User Modal Component
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData | UpdateUserFormData) => void;
  title: string;
  initialData?: User;
  stores: Store[];
  warehouses: Warehouse[];
  isLoading?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  stores,
  warehouses,
  isLoading = false
}) => {
  const isEditing = !!initialData;
  const schema = isEditing ? updateUserSchema : createUserSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: initialData?.username || '',
      password: '',
      name: initialData?.name || '',
      email: initialData?.email || '',
      role: initialData?.role || 'cashier',
      locationId: initialData?.locationId || undefined,
      locationType: initialData?.locationType || undefined,
    },
  });

  const watchedLocationType = form.watch('locationType');

  const handleSubmit = (data: any) => {
    if (!data.locationType) {
      data.locationId = undefined;
    }
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя
            </label>
            <input
              {...form.register('username')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {initialData ? 'Новый пароль (оставьте пустым, чтобы не изменять)' : 'Пароль'}
            </label>
            <input
              {...form.register('password')}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Полное имя
            </label>
            <input
              {...form.register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...form.register('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              {...form.register('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cashier">Кассир</option>
              <option value="storekeeper">Кладовщик</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </select>
            {form.formState.errors.role && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип локации
            </label>
            <select
              {...form.register('locationType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Не назначено</option>
              <option value="store">Магазин</option>
              <option value="warehouse">Склад</option>
            </select>
          </div>

          {watchedLocationType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {watchedLocationType === 'store' ? 'Магазин' : 'Склад'}
              </label>
              <select
                {...form.register('locationId', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите {watchedLocationType === 'store' ? 'магазин' : 'склад'}</option>
                {(watchedLocationType === 'store' ? stores : warehouses).map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {watchedLocationType === 'store' ? (location as Store).region : (location as Warehouse).city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Employees;