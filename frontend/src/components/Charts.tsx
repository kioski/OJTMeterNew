import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { TimeLog } from '../types/index';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartsProps {
  timeLogs: TimeLog[];
  totalHours: number;
}

const Charts: React.FC<ChartsProps> = ({ timeLogs, totalHours }) => {
  // Process data for charts
  const processChartData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyHours = last30Days.map(date => {
      const logs = timeLogs.filter(log => log.date.startsWith(date));
      return logs.reduce((sum, log) => sum + log.hours, 0);
    });

    const weeklyHours = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (7 * (3 - i)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const logs = timeLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      });
      
      return logs.reduce((sum, log) => sum + log.hours, 0);
    });

    return { dailyHours, weeklyHours };
  };

  const { dailyHours, weeklyHours } = processChartData();

  // Daily hours line chart
  const dailyChartData = {
    labels: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Hours Worked',
        data: dailyHours,
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.1,
      },
    ],
  };

  // Weekly hours bar chart
  const weeklyChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Weekly Hours',
        data: weeklyHours,
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(37, 99, 235)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Monthly breakdown doughnut chart
  const monthlyBreakdown = {
    labels: ['This Month', 'Last Month', 'Previous Month'],
    datasets: [
      {
        data: [
          timeLogs.filter(log => {
            const logDate = new Date(log.date);
            const now = new Date();
            return logDate.getMonth() === now.getMonth() && 
                   logDate.getFullYear() === now.getFullYear();
          }).reduce((sum, log) => sum + log.hours, 0),
          timeLogs.filter(log => {
            const logDate = new Date(log.date);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return logDate.getMonth() === lastMonth.getMonth() && 
                   logDate.getFullYear() === lastMonth.getFullYear();
          }).reduce((sum, log) => sum + log.hours, 0),
          timeLogs.filter(log => {
            const logDate = new Date(log.date);
            const prevMonth = new Date();
            prevMonth.setMonth(prevMonth.getMonth() - 2);
            return logDate.getMonth() === prevMonth.getMonth() && 
                   logDate.getFullYear() === prevMonth.getFullYear();
          }).reduce((sum, log) => sum + log.hours, 0),
        ],
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(37, 99, 235)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'OJT Hours Tracking',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Monthly Breakdown',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Daily Hours Line Chart */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Hours (Last 30 Days)</h3>
        <div style={{ height: '300px' }}>
          <Line data={dailyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Weekly Hours Bar Chart */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Hours (Last 4 Weeks)</h3>
        <div style={{ height: '300px' }}>
          <Bar data={weeklyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Monthly Breakdown Doughnut Chart */}
      <div className="card lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Breakdown</h3>
        <div style={{ height: '300px' }}>
          <Doughnut data={monthlyBreakdown} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
