import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Store, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const profileSchema = z.object({
  business_name: z.string().min(3, 'Business name must be at least 3 characters'),
  owner_name: z.string().min(3, 'Owner name must be at least 3 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  city: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { vendor, refreshVendor } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      business_name: vendor?.business_name || '',
      owner_name: vendor?.owner_name || '',
      phone: vendor?.phone || '',
      city: vendor?.city || '',
      address: vendor?.address || '',
      logo_url: vendor?.logo_url || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!vendor) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: data.business_name,
          owner_name: data.owner_name,
          phone: data.phone,
          city: data.city || null,
          address: data.address || null,
          logo_url: data.logo_url || null,
        })
        .eq('id', vendor.id);

      if (error) throw error;

      await refreshVendor();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your vendor profile information</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Store className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{vendor.business_name}</h2>
                <p className="text-sm text-gray-500">{vendor.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={vendor.is_verified ? 'success' : 'warning'}>
                {vendor.is_verified ? 'Verified' : 'Not Verified'}
              </Badge>
              <Badge variant={vendor.is_active ? 'success' : 'destructive'}>
                {vendor.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business Name"
              placeholder="Enter business name"
              error={errors.business_name?.message}
              {...register('business_name')}
              required
            />
            <Input
              label="Logo URL"
              type="url"
              placeholder="https://example.com/logo.png"
              error={errors.logo_url?.message}
              {...register('logo_url')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Owner Name"
              placeholder="Enter owner name"
              error={errors.owner_name?.message}
              {...register('owner_name')}
              required
            />
            <Input
              label="Email"
              type="email"
              value={vendor.email}
              disabled
              className="bg-gray-50"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contact & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Phone"
              type="tel"
              placeholder="05XXXXXXXX"
              error={errors.phone?.message}
              {...register('phone')}
              required
            />
            <Input
              label="City"
              placeholder="Enter city"
              error={errors.city?.message}
              {...register('city')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 min-h-20"
                placeholder="Enter full address"
                {...register('address')}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
