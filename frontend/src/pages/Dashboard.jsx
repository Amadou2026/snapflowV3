import React, { useState, useEffect } from 'react';
import HeaderAdmin from '../components/admin/HeaderAdmin';
import FooterAdmin from '../components/admin/FooterAdmin';
import SidebarAdmin from '../components/admin/SidebarAdmin';
import api from '../services/api';

const Dashboard = ({ user, logout }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentActivities: [],
    projects: [],
    recentOrders: [],
    analytics: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simuler le chargement des données du dashboard
      setTimeout(() => {
        setDashboardData({
          stats: {
            totalPageViews: 442236,
            totalUsers: 78250,
            totalOrders: 18800,
            totalSales: 35078
          },
          recentActivities: [
            { id: 1, user: 'John Doe', action: 'added new task', time: '4 mins ago' },
            { id: 2, user: 'Tarah Shropshire', action: 'changed task name', time: '6 mins ago' },
            { id: 3, user: 'Misty Tison', action: 'added team members', time: '8 mins ago' }
          ],
          projects: [
            { id: 1, name: 'Office Management', progress: 65 },
            { id: 2, name: 'Project Management', progress: 85 },
            { id: 3, name: 'Video Calling App', progress: 45 }
          ],
          recentOrders: [
            { id: '84564564', product: 'Camera Lens', quantity: 40, status: 'Rejected', amount: 40570, statusClass: 'danger' },
            { id: '84564565', product: 'Laptop', quantity: 300, status: 'Pending', amount: 180139, statusClass: 'warning' },
            { id: '84564566', product: 'Mobile', quantity: 355, status: 'Approved', amount: 180139, statusClass: 'success' },
            { id: '84564567', product: 'Tablet', quantity: 120, status: 'Approved', amount: 95000, statusClass: 'success' },
            { id: '84564568', product: 'Headphones', quantity: 200, status: 'Pending', amount: 75000, statusClass: 'warning' }
          ],
          analytics: [
            { label: 'Company Finance Growth', value: '+45.14%' },
            { label: 'Company Expenses Ratio', value: '0.58%' },
            { label: 'Business Risk Cases', value: 'Low' }
          ],
          transactions: [
            { id: '#002434', title: 'Order #002434', time: 'Today, 2:00 AM', amount: '+$1,430', percentage: '78%', icon: 'ti-gift', color: 'success' },
            { id: '#984947', title: 'Order #984947', time: '5 August, 1:45 PM', amount: '-$302', percentage: '8%', icon: 'ti-message-circle', color: 'primary' },
            { id: '#988784', title: 'Order #988784', time: '7 hours ago', amount: '-$682', percentage: '16%', icon: 'ti-settings', color: 'danger' }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pc-container">
        <HeaderAdmin user={user} logout={logout} />
        <div className="pc-content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading Dashboard...</p>
            </div>
          </div>
        </div>
        <FooterAdmin />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <HeaderAdmin user={user} logout={logout} />
      
      <div className="main-container">
        <SidebarAdmin />
        
        <div className="pc-container">
          <div className="pc-content">
            {/* Breadcrumb */}
            <div className="page-header">
              <div className="page-block">
                <div className="row align-items-center">
                  <div className="col-md-12">
                    <div className="page-header-title">
                      <h5 className="m-b-10">Welcome {user?.first_name} {user?.last_name}</h5>
                    </div>
                    <ul className="breadcrumb">                      
                      <li className="breadcrumb-item"><a href="#!">Dashboard</a></li>
                      
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="row">
              {/* Stats Cards */}
              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total Page Views</h6>
                    <h4 className="mb-3">
                      {dashboardData.stats.totalPageViews?.toLocaleString()} 
                      <span className="badge bg-light-primary border border-primary">
                        <i className="ti ti-trending-up"></i> 59.3%
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      You made an extra <span className="text-primary">35,000</span> this year
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total Users</h6>
                    <h4 className="mb-3">
                      {dashboardData.stats.totalUsers?.toLocaleString()} 
                      <span className="badge bg-light-success border border-success">
                        <i className="ti ti-trending-up"></i> 70.5%
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      You made an extra <span className="text-success">8,900</span> this year
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total Order</h6>
                    <h4 className="mb-3">
                      {dashboardData.stats.totalOrders?.toLocaleString()} 
                      <span className="badge bg-light-warning border border-warning">
                        <i className="ti ti-trending-down"></i> 27.4%
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      You made an extra <span className="text-warning">1,943</span> this year
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total Sales</h6>
                    <h4 className="mb-3">
                      ${dashboardData.stats.totalSales?.toLocaleString()} 
                      <span className="badge bg-light-danger border border-danger">
                        <i className="ti ti-trending-down"></i> 27.4%
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      You made an extra <span className="text-danger">$20,395</span> this year
                    </p>
                  </div>
                </div>
              </div>

              {/* Unique Visitor Chart */}
              <div className="col-md-12 col-xl-8">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Unique Visitor</h5>
                  <ul className="nav nav-pills justify-content-end mb-0" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link ${activeTab === 'month' ? 'active' : ''}`}
                        onClick={() => setActiveTab('month')}
                        type="button" 
                        role="tab"
                      >
                        Month
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link ${activeTab === 'week' ? 'active' : ''}`}
                        onClick={() => setActiveTab('week')}
                        type="button" 
                        role="tab"
                      >
                        Week
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="tab-content">
                      <div className={`tab-pane ${activeTab === 'month' ? 'show active' : ''}`}>
                        <div className="text-center py-4">
                          <p className="text-muted">Monthly visitor chart would be displayed here</p>
                        </div>
                      </div>
                      <div className={`tab-pane ${activeTab === 'week' ? 'show active' : ''}`}>
                        <div className="text-center py-4">
                          <p className="text-muted">Weekly visitor chart would be displayed here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Income Overview */}
              <div className="col-md-12 col-xl-4">
                <h5 className="mb-3">Income Overview</h5>
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">This Week Statistics</h6>
                    <h3 className="mb-3">$7,650</h3>
                    <div className="text-center py-3">
                      <p className="text-muted">Income overview chart would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="col-md-12 col-xl-8">
                <h5 className="mb-3">Recent Orders</h5>
                <div className="card tbl-card">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover table-borderless mb-0">
                        <thead>
                          <tr>
                            <th>TRACKING NO.</th>
                            <th>PRODUCT NAME</th>
                            <th>TOTAL ORDER</th>
                            <th>STATUS</th>
                            <th className="text-end">TOTAL AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                <a href="#" className="text-muted">{order.id}</a>
                              </td>
                              <td>{order.product}</td>
                              <td>{order.quantity}</td>
                              <td>
                                <span className="d-flex align-items-center gap-2">
                                  <i className={`fas fa-circle text-${order.statusClass} f-10 m-r-5`}></i>
                                  {order.status}
                                </span>
                              </td>
                              <td className="text-end">${order.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Report */}
              <div className="col-md-12 col-xl-4">
                <h5 className="mb-3">Analytics Report</h5>
                <div className="card">
                  <div className="list-group list-group-flush">
                    {dashboardData.analytics.map((item, index) => (
                      <a 
                        href="#" 
                        key={index}
                        className="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
                      >
                        {item.label}
                        <span className="h5 mb-0">{item.value}</span>
                      </a>
                    ))}
                  </div>
                  <div className="card-body px-2">
                    <div className="text-center py-3">
                      <p className="text-muted">Analytics report chart would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales Report */}
              <div className="col-md-12 col-xl-8">
                <h5 className="mb-3">Sales Report</h5>
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">This Week Statistics</h6>
                    <h3 className="mb-0">$7,650</h3>
                    <div className="text-center py-4">
                      <p className="text-muted">Sales report chart would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="col-md-12 col-xl-4">
                <h5 className="mb-3">Transaction History</h5>
                <div className="card">
                  <div className="list-group list-group-flush">
                    {dashboardData.transactions.map((transaction) => (
                      <a href="#" key={transaction.id} className="list-group-item list-group-item-action">
                        <div className="d-flex">
                          <div className="flex-shrink-0">
                            <div className={`avtar avtar-s rounded-circle text-${transaction.color} bg-light-${transaction.color}`}>
                              <i className={`ti ${transaction.icon} f-18`}></i>
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <h6 className="mb-1">{transaction.title}</h6>
                            <p className="mb-0 text-muted">{transaction.time}</p>
                          </div>
                          <div className="flex-shrink-0 text-end">
                            <h6 className="mb-1">{transaction.amount}</h6>
                            <p className="mb-0 text-muted">{transaction.percentage}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FooterAdmin />
    </div>
  );
};

export default Dashboard;