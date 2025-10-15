import { useEffect, useState } from 'react';
import { Copy, Share2, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Tables } from '../lib/database.types';

type Referral = Tables<'referrals'>;

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
}

export default function Referrals() {
  const { vendor } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor) {
      fetchReferrals();
    }
  }, [vendor]);

  const fetchReferrals = async () => {
    if (!vendor) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const referralData = data || [];
      setReferrals(referralData);

      // Calculate stats
      const activeReferrals = referralData.filter((r) => r.status === 'active').length;
      const totalCommission = referralData.reduce(
        (sum, r) => sum + (r.commission_earned || 0),
        0
      );

      setStats({
        totalReferrals: referralData.length,
        activeReferrals,
        totalCommission,
      });
    } catch (error: any) {
      toast.error('Failed to fetch referrals');
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (vendor?.referral_code) {
      navigator.clipboard.writeText(vendor.referral_code);
      toast.success('Referral code copied to clipboard');
    }
  };

  const shareReferralLink = () => {
    if (vendor?.referral_code) {
      const referralLink = `https://rimmarsa.com/register?ref=${vendor.referral_code}`;
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-600 mt-1">Earn commissions by referring new vendors</p>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Referral Code</h3>
              <div className="flex items-center gap-3">
                <code className="px-4 py-2 bg-white rounded-lg text-2xl font-mono font-bold text-blue-600 border-2 border-blue-300">
                  {vendor?.referral_code || 'N/A'}
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyReferralCode}>
                <Copy className="h-4 w-4" />
                Copy Code
              </Button>
              <Button onClick={shareReferralLink}>
                <Share2 className="h-4 w-4" />
                Share Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold mt-2">{stats.totalReferrals}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-2xl font-bold mt-2">{stats.activeReferrals}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(stats.totalCommission)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No referrals yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Share your referral code to start earning commissions
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(referral.created_at || '')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.referred_customer_email || 'Vendor'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            referral.status === 'active'
                              ? 'success'
                              : referral.status === 'pending'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {referral.status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(referral.commission_earned || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
