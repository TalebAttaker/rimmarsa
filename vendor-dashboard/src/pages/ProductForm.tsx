import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/database.types';

type Category = Tables<'categories'>;

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  name_ar: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  compare_at_price: z.number().optional(),
  category_id: z.string().min(1, 'Category is required'),
  city: z.string().optional(),
  stock_quantity: z.number().min(0, 'Stock cannot be negative'),
  is_active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendor } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const isEditing = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_active: true,
      stock_quantity: 0,
    },
  });

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setValue('name', data.name);
        setValue('name_ar', data.name_ar || '');
        setValue('description', data.description || '');
        setValue('price', data.price);
        setValue('compare_at_price', data.compare_at_price || undefined);
        setValue('category_id', data.category_id || '');
        setValue('city', data.city || '');
        setValue('stock_quantity', data.stock_quantity || 0);
        setValue('is_active', data.is_active || false);
        setImageUrls(data.images || []);
      }
    } catch (error: any) {
      toast.error('Failed to fetch product');
      console.error('Error fetching product:', error);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!vendor) return;

    setLoading(true);
    try {
      const productData = {
        ...data,
        vendor_id: vendor.id,
        images: imageUrls,
        compare_at_price: data.compare_at_price || null,
        name_ar: data.name_ar || null,
        description: data.description || null,
        city: data.city || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert(productData);

        if (error) throw error;
        toast.success('Product created successfully');
      }

      navigate('/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setImageUrls([...imageUrls, url]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update product details' : 'Create a new product listing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Product Name"
              placeholder="Enter product name"
              error={errors.name?.message}
              {...register('name')}
              required
            />
            <Input
              label="Product Name (Arabic)"
              placeholder="اسم المنتج بالعربي"
              error={errors.name_ar?.message}
              {...register('name_ar')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 min-h-24"
                placeholder="Enter product description"
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
                required
              />
              <Input
                label="Compare at Price"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.compare_at_price?.message}
                {...register('compare_at_price', { valueAsNumber: true })}
              />
            </div>
            <Input
              label="Stock Quantity"
              type="number"
              placeholder="0"
              error={errors.stock_quantity?.message}
              {...register('stock_quantity', { valueAsNumber: true })}
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                {...register('category_id')}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
            </div>
            <Input
              label="City"
              placeholder="Enter city"
              error={errors.city?.message}
              {...register('city')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button type="button" variant="outline" onClick={handleImageUrlAdd}>
                <Upload className="h-4 w-4" />
                Add Image URL
              </Button>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleImageRemove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                {...register('is_active')}
              />
              <span className="text-sm font-medium text-gray-700">
                Active (visible to customers)
              </span>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
