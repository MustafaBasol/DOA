// Analytics Dashboard with Chart.js
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

class AnalyticsDashboard {
  constructor() {
    this.charts = {};
    this.currentPeriod = 'last7days';
    this.customStartDate = null;
    this.customEndDate = null;
  }

  // Initialize dashboard
  async init() {
    this.setupEventListeners();
    await this.loadDashboard();
  }

  // Setup event listeners
  setupEventListeners() {
    // Period selector
    document.getElementById('periodSelector')?.addEventListener('change', (e) => {
      this.currentPeriod = e.target.value;
      if (this.currentPeriod !== 'custom') {
        this.loadDashboard();
      }
    });

    // Custom date range
    document.getElementById('applyDateRange')?.addEventListener('click', () => {
      this.customStartDate = document.getElementById('startDate').value;
      this.customEndDate = document.getElementById('endDate').value;
      if (this.customStartDate && this.customEndDate) {
        this.loadDashboard();
      }
    });

    // Refresh button
    document.getElementById('refreshAnalytics')?.addEventListener('click', () => {
      this.loadDashboard();
    });
  }

  // Build query params for API
  getQueryParams() {
    const params = new URLSearchParams();
    
    if (this.currentPeriod === 'custom' && this.customStartDate && this.customEndDate) {
      params.append('startDate', this.customStartDate);
      params.append('endDate', this.customEndDate);
    } else {
      params.append('period', this.currentPeriod);
    }
    
    return params.toString();
  }

  // Load all dashboard data
  async loadDashboard() {
    try {
      this.showLoading();
      const params = this.getQueryParams();
      
      await Promise.all([
        this.loadOverview(params),
        this.loadMessageTrends(params),
        this.loadCustomerGrowth(params),
        this.loadRevenueAnalysis(params),
        this.loadTopCustomers(params),
        this.loadPeakHours(params)
      ]);
      
      this.hideLoading();
    } catch (error) {
      console.error('Dashboard load error:', error);
      this.showError('Analitik veriler yüklenirken hata oluştu');
    }
  }

  // Load overview stats
  async loadOverview(params) {
    const response = await fetch(`/api/analytics/overview?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Overview fetch failed');
    
    const data = await response.json();
    this.renderOverview(data);
  }

  // Render overview cards
  renderOverview(data) {
    document.getElementById('totalMessages').textContent = data.totalMessages.toLocaleString('tr-TR');
    document.getElementById('inboundMessages').textContent = data.inboundMessages.toLocaleString('tr-TR');
    document.getElementById('outboundMessages').textContent = data.outboundMessages.toLocaleString('tr-TR');
    document.getElementById('totalCustomers').textContent = data.totalCustomers.toLocaleString('tr-TR');
    document.getElementById('newCustomers').textContent = data.newCustomers.toLocaleString('tr-TR');
    document.getElementById('activeCustomers').textContent = data.activeCustomers.toLocaleString('tr-TR');
    document.getElementById('totalRevenue').textContent = `${data.totalRevenue.toLocaleString('tr-TR')} ₺`;
    document.getElementById('totalPayments').textContent = data.totalPayments.toLocaleString('tr-TR');
    document.getElementById('averagePayment').textContent = `${data.averagePayment.toLocaleString('tr-TR')} ₺`;
  }

  // Load message trends
  async loadMessageTrends(params) {
    const response = await fetch(`/api/analytics/message-trends?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Message trends fetch failed');
    
    const data = await response.json();
    this.renderMessageTrendsChart(data);
  }

  // Render message trends chart
  renderMessageTrendsChart(data) {
    const ctx = document.getElementById('messageTrendsChart');
    if (!ctx) return;

    if (this.charts.messageTrends) {
      this.charts.messageTrends.destroy();
    }

    this.charts.messageTrends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => format(new Date(d.date), 'dd MMM')),
        datasets: [
          {
            label: 'Gelen Mesajlar',
            data: data.map(d => d.inbound),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Giden Mesajlar',
            data: data.map(d => d.outbound),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  // Load customer growth
  async loadCustomerGrowth(params) {
    const response = await fetch(`/api/analytics/customer-growth?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Customer growth fetch failed');
    
    const data = await response.json();
    this.renderCustomerGrowthChart(data);
  }

  // Render customer growth chart
  renderCustomerGrowthChart(data) {
    const ctx = document.getElementById('customerGrowthChart');
    if (!ctx) return;

    if (this.charts.customerGrowth) {
      this.charts.customerGrowth.destroy();
    }

    this.charts.customerGrowth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => format(new Date(d.date), 'dd MMM')),
        datasets: [
          {
            label: 'Toplam Müşteri',
            data: data.map(d => d.cumulative),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Yeni Müşteriler',
            data: data.map(d => d.new),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Toplam Müşteri'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Yeni Müşteriler'
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
  }

  // Load revenue analysis
  async loadRevenueAnalysis(params) {
    const response = await fetch(`/api/analytics/revenue?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Revenue fetch failed');
    
    const data = await response.json();
    this.renderRevenueChart(data);
  }

  // Render revenue chart
  renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (this.charts.revenue) {
      this.charts.revenue.destroy();
    }

    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => format(new Date(d.date), 'dd MMM')),
        datasets: [
          {
            label: 'Gelir (₺)',
            data: data.map(d => d.amount),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'İşlem Sayısı',
            data: data.map(d => d.count),
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Gelir (₺)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'İşlem Sayısı'
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
  }

  // Load top customers
  async loadTopCustomers(params) {
    const response = await fetch(`/api/analytics/top-customers?${params}&limit=10`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Top customers fetch failed');
    
    const data = await response.json();
    this.renderTopCustomersChart(data);
  }

  // Render top customers chart
  renderTopCustomersChart(data) {
    const ctx = document.getElementById('topCustomersChart');
    if (!ctx) return;

    if (this.charts.topCustomers) {
      this.charts.topCustomers.destroy();
    }

    this.charts.topCustomers = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.name || d.phoneNumber),
        datasets: [{
          label: 'Mesaj Sayısı',
          data: data.map(d => d.messageCount),
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  // Load peak hours
  async loadPeakHours(params) {
    const response = await fetch(`/api/analytics/peak-hours?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (!response.ok) throw new Error('Peak hours fetch failed');
    
    const data = await response.json();
    this.renderPeakHoursChart(data);
  }

  // Render peak hours chart
  renderPeakHoursChart(data) {
    const ctx = document.getElementById('peakHoursChart');
    if (!ctx) return;

    if (this.charts.peakHours) {
      this.charts.peakHours.destroy();
    }

    // Ensure we have data for all 24 hours
    const hourlyData = Array(24).fill(0);
    data.forEach(d => {
      hourlyData[d.hour] = d.count;
    });

    this.charts.peakHours = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hourlyData.map((_, i) => `${i}:00`),
        datasets: [{
          label: 'Mesaj Sayısı',
          data: hourlyData,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Yoğun Saatler (24 Saat)'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  // Show loading state
  showLoading() {
    document.getElementById('analyticsLoading')?.classList.remove('hidden');
  }

  // Hide loading state
  hideLoading() {
    document.getElementById('analyticsLoading')?.classList.add('hidden');
  }

  // Show error message
  showError(message) {
    alert(message);
    this.hideLoading();
  }

  // Destroy all charts
  destroy() {
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }
}

// Initialize when DOM is ready
let analyticsInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  const analyticsContainer = document.getElementById('analyticsContainer');
  if (analyticsContainer) {
    analyticsInstance = new AnalyticsDashboard();
    analyticsInstance.init();
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (analyticsInstance) {
    analyticsInstance.destroy();
  }
});

export default AnalyticsDashboard;
