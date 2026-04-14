import React from 'react';
import { Users, MessageSquare, Activity, Settings, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isUser = user?.role === 'User';
  const isAdmin = user?.role === 'Admin';

  const stats = [
    { title: "Total Chats", value: isAdmin ? "3,240" : "12", icon: MessageSquare, color: "#60A5FA", bg: "rgba(96, 165, 250, 0.2)" },
    { title: "Total Messages", value: isAdmin ? "142,593" : "485", icon: Activity, color: "#10B981", bg: "rgba(16, 185, 129, 0.2)" },
    { title: "Connections", value: isAdmin ? "12,942" : "8", icon: Users, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.2)" },
    { title: "AI Translations", value: isAdmin ? "84,000" : "128", icon: BarChart2, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.2)" },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {user.name}!</h2>
          <p>Here is what's happening in your account today.</p>
        </div>
        <div className="user-role-badge">
            <Settings size={16} /> {user.role} Dashboard
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
            <div className="stat-card" key={idx}>
                <div className="stat-icon" style={{ color: stat.color, backgroundColor: stat.bg }}>
                    <stat.icon size={24} />
                </div>
                <div className="stat-info">
                    <p className="stat-title">{stat.title}</p>
                    <h3 className="stat-value">{stat.value}</h3>
                </div>
            </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="activity-feed">
            <div className="panel-header">
                <h3>Recent Activity</h3>
                <button className="btn-secondary">View All</button>
            </div>
            <div className="activity-list">
                <div className="activity-item">
                    <div className="activity-dot blue"></div>
                    <div className="activity-text">
                        <p><strong>You</strong> joined the Global Community Chat.</p>
                        <span>2 hours ago</span>
                    </div>
                </div>
                <div className="activity-item">
                    <div className="activity-dot green"></div>
                    <div className="activity-text">
                        <p><strong>System</strong> updated AI Sign Recognition model to v2.1.</p>
                        <span>Yesterday</span>
                    </div>
                </div>
                <div className="activity-item">
                    <div className="activity-dot orange"></div>
                    <div className="activity-text">
                        <p><strong>Sarah Smith</strong> sent you a message.</p>
                        <span>Yesterday</span>
                    </div>
                </div>
            </div>
        </div>

        {isAdmin && (
            <div className="admin-panel">
                <div className="panel-header">
                    <h3>User Management</h3>
                </div>
                <div className="table-responsive">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><span className="badge admin">Admin</span></td>
                                <td><span className="status-indicator online">Online</span></td>
                                <td><button className="btn-link">Edit</button></td>
                            </tr>
                            <tr>
                                <td>Sarah Smith</td>
                                <td>sarah@example.com</td>
                                <td><span className="badge user">User</span></td>
                                <td><span className="status-indicator offline">Offline</span></td>
                                <td><button className="btn-link">Edit</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      <style jsx="true">{`
        .dashboard-container { display: flex; flex-direction: column; gap: 2rem; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .dashboard-header h2 { font-size: 2rem; color: white; margin-bottom: 0.5rem; }
        .dashboard-header p { color: var(--text-secondary); }
        .user-role-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; background: rgba(30,58,138,0.2); color: #60A5FA; border: 1px solid rgba(30,58,138,0.5); font-weight: 500; font-size: 0.9rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
        .stat-card { background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 16px; display: flex; align-items: center; gap: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: 0.3s; }
        .stat-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.2); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-title { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; margin-bottom: 0.25rem; }
        .stat-value { font-size: 1.5rem; color: white; font-weight: 700; }

        .dashboard-content { display: grid; grid-template-columns: ${isAdmin ? '1fr 2fr' : '1fr'}; gap: 1.5rem; }
        .activity-feed, .admin-panel { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; }
        
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
        .panel-header h3 { color: white; font-size: 1.1rem; }
        
        .btn-secondary { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; transition: 0.2s; cursor: pointer; }
        .btn-secondary:hover { background: rgba(255,255,255,0.05); }

        .activity-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .activity-item { display: flex; gap: 1rem; align-items: flex-start; }
        .activity-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .activity-dot.blue { background: #3B82F6; box-shadow: 0 0 10px rgba(59,130,246,0.5); }
        .activity-dot.green { background: #10B981; box-shadow: 0 0 10px rgba(16,185,129,0.5); }
        .activity-dot.orange { background: #F59E0B; box-shadow: 0 0 10px rgba(245,158,11,0.5); }
        .activity-text p { color: var(--text-primary); font-size: 0.95rem; line-height: 1.4; margin-bottom: 0.25rem; }
        .activity-text span { color: var(--text-secondary); font-size: 0.8rem; }

        .table-responsive { overflow-x: auto; }
        .user-table { width: 100%; border-collapse: collapse; }
        .user-table th, .user-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
        .user-table th { color: var(--text-secondary); font-weight: 500; font-size: 0.9rem; }
        .user-table td { color: var(--text-primary); font-size: 0.95rem; }
        .user-table tbody tr:hover { background: rgba(255,255,255,0.02); }
        
        .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .badge.admin { background: rgba(139,92,246,0.2); color: #C4B5FD; border: 1px solid rgba(139,92,246,0.5); }
        .badge.user { background: rgba(59,130,246,0.2); color: #93C5FD; border: 1px solid rgba(59,130,246,0.5); }

        .status-indicator { display: inline-flex; align-items: center; gap: 6px; }
        .status-indicator::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
        .status-indicator.online::before { background: var(--success); }
        .status-indicator.offline::before { background: var(--text-secondary); }
        
        .btn-link { color: var(--primary); background: none; border: none; cursor: pointer; font-weight: 500; }
        .btn-link:hover { text-decoration: underline; color: var(--primary-hover); }

        @media(max-width: 900px) {
          .dashboard-content { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
