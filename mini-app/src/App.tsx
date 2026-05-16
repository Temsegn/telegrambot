import { useEffect, useState } from 'react';
import { Wallet, Users, TrendingUp, Copy, CheckCircle, XCircle, Clock, UserPlus, Share2 } from 'lucide-react';
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




export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallet' | 'invited' | 'active' | 'referral'>('wallet');
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
      const userResponse = await axios.get(`${'https://telegrambot-backend-37gb.onrender.com'}/users/${telegramId}`);
      if (userResponse.data?.error) {
        setLoading(false);
        return;
      }
      setUser(userResponse.data);

      // Fetch referral stats
      const statsResponse = await axios.get(`${'https://telegrambot-backend-37gb.onrender.com'}/referrals/stats/${telegramId}`);
      setReferralStats(statsResponse.data);

      // Fetch referrals
      const referralsResponse = await axios.get(`${'https://telegrambot-backend-37gb.onrender.com'}/referrals/user/${telegramId}`);
      setReferrals(referralsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!user) return;
    const link = `https://t.me/${'userdejenbot'}?start=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkChannelMembership = () => {
    if (!user || !user.isActive) {
      alert('Please join the channel first to perform this action!');
      return false;
    }
    return true;
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
          <p style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14 }}>Please open this app from Telegram</p>
          <p style={{ color: '#64748b', marginBottom: 24, fontSize: 12 }}>
            Or add <code style={{ color: '#a5b4fc' }}>?telegramId=YOUR_ID</code> to the URL for testing
          </p>
          <button onClick={fetchData}
            style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.firstName || 'User'}!</h1>
            <p className="text-blue-100">@{user.username || 'unknown'}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${user.isActive ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 relative">
        {activeTab === 'wallet' && (
          <div className="space-y-4 animate-fade-in">
            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Total Balance</h2>
                <Wallet className="w-6 h-6 text-blue-600 animate-bounce" />
              </div>
              <div className="text-5xl font-bold text-blue-600 mb-2">{user.walletBalance}</div>
              <p className="text-gray-600">Points</p>
            </div>

            {/* Stats Grid */}
            {referralStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Total Invited</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.totalInvited}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Active Members</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.activeMembers}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{referralStats.conversionRate}%</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md transform hover:scale-105 transition-transform duration-300">
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

        {activeTab === 'invited' && (
          <div className="space-y-4 animate-fade-in">
            {/* Referral List */}
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl">
                <h2 className="text-lg font-semibold text-white">Invited Users</h2>
              </div>
              <div className="divide-y">
                {referrals.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400 animate-bounce" />
                    <p>No referrals yet</p>
                    <p className="text-sm">Share your referral link to start inviting!</p>
                  </div>
                ) : (
                  referrals.map((referral) => (
                    <div key={referral.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
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

        {activeTab === 'active' && (
          <div className="space-y-4 animate-fade-in">
            {/* Active Users Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
                <h2 className="text-xl font-semibold text-gray-800">Active Members</h2>
              </div>
              {referralStats && (
                <div className="text-5xl font-bold text-green-600 mb-2">{referralStats.activeMembers}</div>
              )}
              <p className="text-gray-600">Users currently in the channel</p>
            </div>

            {/* Active Users List */}
            <div className="bg-white rounded-2xl shadow-lg">
              <div className="p-4 border-b bg-gradient-to-r from-green-500 to-teal-500 rounded-t-2xl">
                <h2 className="text-lg font-semibold text-white">Active Users List</h2>
              </div>
              <div className="divide-y">
                {referrals.filter(r => r.activeStatus).length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No active members yet</p>
                  </div>
                ) : (
                  referrals.filter(r => r.activeStatus).map((referral) => (
                    <div key={referral.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">
                            {referral.invited.firstName || referral.invited.username || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">Active Member</p>
                        </div>
                      </div>
                      {referral.joinedAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(referral.joinedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="space-y-4 animate-fade-in">
            {/* Referral Link Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="w-8 h-8 text-blue-600 animate-bounce" />
                <h2 className="text-xl font-semibold text-gray-800">Your Referral Link</h2>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={`https://t.me/${'userdejenbot'}?start=${user.referralCode}`}
                  className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    if (checkChannelMembership()) {
                      copyReferralLink();
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Share this link to invite friends and earn 5 points when they join the channel!
              </p>
            </div>

            {/* Share Buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Share</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (checkChannelMembership()) {
                      const link = `https://t.me/${'userdejenbot'}?start=${user.referralCode}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, '_blank');
                    }
                  }}
                  className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  <Share2 className="w-5 h-5" />
                  Share on Telegram
                </button>
                <button
                  onClick={() => {
                    if (checkChannelMembership()) {
                      copyReferralLink();
                    }
                  }}
                  className="flex items-center justify-center gap-2 p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-300 transform hover:scale-105"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
              </div>
            </div>

            {/* Channel Status */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                {user.isActive ? (
                  <CheckCircle className="w-6 h-6 text-green-600 animate-pulse" />
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

      {/* Channel Membership Block Overlay */}
      {!user.isActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Channel First</h2>
            <p className="text-gray-600 mb-6">
              You must be a member of the channel to use this app. Please join the channel to continue earning points and using all features.
            </p>
            <button
              onClick={() => {
                window.open('https://t.me/userdejendejen', '_blank');
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Join Channel
            </button>
            <button
              onClick={fetchData}
              className="w-full mt-3 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Curved Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200">
          <div className="flex justify-around items-center py-4 px-2">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                activeTab === 'wallet'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white transform scale-110'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Wallet className={`w-6 h-6 ${activeTab === 'wallet' ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium">Wallet</span>
            </button>
            <button
              onClick={() => setActiveTab('invited')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                activeTab === 'invited'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white transform scale-110'
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <UserPlus className={`w-6 h-6 ${activeTab === 'invited' ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium">Invited</span>
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white transform scale-110'
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <CheckCircle className={`w-6 h-6 ${activeTab === 'active' ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium">Active</span>
            </button>
            <button
              onClick={() => setActiveTab('referral')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                activeTab === 'referral'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white transform scale-110'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Share2 className={`w-6 h-6 ${activeTab === 'referral' ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-medium">Referral</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
