
import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

interface ChartRendererProps {
  chartData: string;
  chartType: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData, chartType }) => {
  console.log('📊 ChartRenderer received:', { chartType, chartData });

  if (!chartData) {
    console.warn('❌ No chart data provided');
    return null;
  }

  try {
    console.log('🔄 Parsing chart data...');
    const data = JSON.parse(chartData);
    console.log('✅ Parsed chart data:', data);

    const COLORS = [
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#8884D8",
      "#82CA9D",
      "#A4DE6C",
      "#D0ED57"
    ];

    if (!Array.isArray(data)) {
      console.error('❌ Chart data is not an array:', data);
      throw new Error('Chart data must be an array');
    }

    const renderChart = () => {
      console.log(`🎨 Rendering ${chartType} chart...`);
      
      switch (chartType) {
        case "line_chart":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );

        case "bar_chart":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );

        case "pie_chart":
          return (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );

        default:
          console.warn('⚠️ Unsupported chart type:', chartType);
          return <div>Unsupported chart type</div>;
      }
    };

    return (
      <div className="w-full p-4 bg-white rounded-lg shadow-sm">
        {renderChart()}
      </div>
    );
  } catch (error) {
    console.error("🚨 Error rendering chart:", error);
    console.error("📊 Problematic chart data:", chartData);
    return (
      <div className="text-red-500 p-4">
        Failed to render chart. Please check the data format.
      </div>
    );
  }
};

export default ChartRenderer;