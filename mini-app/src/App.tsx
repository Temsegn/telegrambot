import { useEffect, useState } from 'react';
import { Wallet, Users, TrendingUp, Settings, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';

interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  referralCode: string;
  walletBalance: number;
  isActive: boolean;
  status: string;
}

interface ReferralStats {
  totalInvited: number;
  joinedChannel: number;
  activeMembers: number;
  leftChannel: number;
  neverJoined: number;
  conversionRate: string;
}

interface Referral {
  id: string;
  invited: {
    username: string | null;
    firstName: string | null;
    status: string;
  };
  joinedAt: string | null;
  leftAt: string | null;
  activeStatus: boolean;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallet' | 'referrals' | 'settings'>('wallet');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tg = window.Telegram?.WebApp;
      // Use Telegram user ID if available, else fall back to URL param for browser testing
      const telegramId = tg?.initDataUnsafe?.user?.id
        || new URLSearchParams(window.location.search).get('telegramId');

      if (!telegramId) {
        setLoading(false);
        return;
      }

      // Fetch user data
      const userResponse = await axios.get(`${BACKEND_URL}/users/${telegramId}`);
      if (userResponse.data?.error) {
        setLoading(false);
        return;
      }
      setUser(userResponse.data);

      // Fetch referral stats
      const statsResponse = await axios.get(`${BACKEND_URL}/referrals/stats/${telegramId}`);
      setReferralStats(statsResponse.data);

      // Fetch referrals
      const referralsResponse = await axios.get(`${BACKEND_URL}/referrals/user/${telegramId}`);
      setReferrals(referralsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!user) return;
    
    const link = `https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'your_bot'}?start=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE_MEMBER':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'LEFT_CHANNEL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
        <div className="text-center">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
          <p style={{ color: '#f87171', marginBottom: 8, fontWeight: 600, fontSize: 18 }}>Unable to load user data</p>
          <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>Please open this app from Telegram</p>
          <button onClick={fetchData}
            style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.firstName || 'User'}!</h1>
            <p className="text-blue-100">@{user.username || 'unknown'}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${user.isActive ? 'bg-green-500' : 'bg-yellow-500'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 ${
            activeTab === 'wallet' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
        >
          <Wallet className="w-5 h-5" />
          Wallet
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 ${
            activeTab === 'referrals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
        >
          <Users className="w-5 h-5" />
          Referrals
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 ${
            activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Total Balance</h2>
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">{user.walletBalance}</div>
              <p className="text-gray-600">Points</p>
            </div>

            {/* Stats Grid */}
            {referralStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Total Invited</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.totalInvited}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Active Members</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.activeMembers}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.conversionRate}%</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-600">Left Channel</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.leftChannel}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-4">
            {/* Referral Link */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Referral Link</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://t.me/${window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'your_bot'}?start=${user.referralCode}`}
                  className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Share this link to invite friends and earn 5 points when they join the channel!
              </p>
            </div>

            {/* Referral List */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Invited Users</h2>
              </div>
              <div className="divide-y">
                {referrals.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No referrals yet</p>
                    <p className="text-sm">Share your referral link to start inviting!</p>
                  </div>
                ) : (
                  referrals.map((referral) => (
                    <div key={referral.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(referral.invited.status)}
                        <div>
                          <p className="font-medium">
                            {referral.invited.firstName || referral.invited.username || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {referral.invited.status.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${referral.activeStatus ? 'text-green-600' : 'text-gray-600'}`}>
                          {referral.activeStatus ? 'Active' : 'Inactive'}
                        </p>
                        {referral.joinedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(referral.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Telegram ID</p>
                  <p className="font-medium">{user.telegramId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-medium">@{user.username || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{user.status.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Referral Code</p>
                  <p className="font-medium">{user.referralCode}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Channel Status</h2>
              <div className="flex items-center gap-3">
                {user.isActive ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {user.isActive ? 'You are a channel member' : 'Not a channel member'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user.isActive
                      ? 'You are eligible to earn points'
                      : 'Join the channel to start earning points'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
