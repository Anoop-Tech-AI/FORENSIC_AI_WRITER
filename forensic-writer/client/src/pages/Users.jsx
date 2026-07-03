import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, Search, Mail, Calendar, Activity, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${API_URL}/users`);
                setUsers(response.data.users || response.data || []);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                // Mock data for development
                setUsers([
                    { _id: '1', name: 'John Doe', username: 'john_doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-15', lastLogin: '2024-04-15' },
                    { _id: '2', name: 'Jane Smith', username: 'jane_smith', email: 'jane@example.com', role: 'investigator', createdAt: '2024-01-20', lastLogin: '2024-04-14' },
                    { _id: '3', name: 'Mike Johnson', username: 'mike_j', email: 'mike@example.com', role: 'legal_adviser', createdAt: '2024-02-01', lastLogin: '2024-04-13' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        const map = {
            admin: { label: 'ADMIN', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
            investigator: { label: 'INVESTIGATOR', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            legal_adviser: { label: 'LEGAL', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        };
        const r = map[role] || { label: role?.toUpperCase() || 'USER', cls: 'bg-gray-500/20 text-gray-400' };
        return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${r.cls}`}>{r.label}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white mb-2 flex items-center gap-3">
                            <UsersIcon className="text-blue-400" />
                            User Management
                        </h1>
                        <p className="text-gray-400">Manage system users and permissions</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Users</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{users.length}</p>
                            </div>
                            <UsersIcon className="text-blue-400 w-8 h-8" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Admins</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                            </div>
                            <Shield className="text-red-400 w-8 h-8" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Investigators</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{users.filter(u => u.role === 'investigator').length}</p>
                            </div>
                            <Activity className="text-green-400 w-8 h-8" />
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Legal Advisors</p>
                                <p className="text-black dark:text-white text-2xl font-bold">{users.filter(u => u.role === 'legal_adviser').length}</p>
                            </div>
                            <Shield className="text-purple-400 w-8 h-8" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:border-blue-500/50 outline-none"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-black dark:text-white focus:border-blue-500/50 outline-none"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="investigator">Investigator</option>
                        <option value="legal_adviser">Legal Advisor</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left p-4 text-gray-400 font-medium text-sm">User</th>
                                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Role</th>
                                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Email</th>
                                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Joined</th>
                                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Last Login</th>
                                    <th className="text-center p-4 text-gray-400 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="border-b border-gray-200 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <span className="text-blue-300 font-bold">
                                                        {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-black dark:text-white font-medium">{user.name}</p>
                                                    <p className="text-gray-400 text-sm">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <Activity className="w-4 h-4 text-gray-500" />
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4 text-gray-400" />
                                                </button>
                                                <button className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No users found matching your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
