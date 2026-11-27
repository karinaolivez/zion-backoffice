'use client';

import { ResponsiveBar } from '@nivo/bar';

interface BarChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  title: string;
  color?: string;
  height?: number;
}

const BarChart = ({ data, title, color, height = 400 }: BarChartProps) => {
  // Tema dark personalizado para o Nivo
  const darkTheme = {
    background: 'transparent',
    text: {
      fontSize: 10,
      fill: 'rgba(255, 255, 255, 0.8)',
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    axis: {
      domain: {
        line: {
          stroke: 'rgba(255, 255, 255, 0.1)',
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 10,
          fill: 'rgba(255, 255, 255, 0.8)',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
      ticks: {
        line: {
          stroke: 'rgba(255, 255, 255, 0.1)',
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: 'rgba(255, 255, 255, 0.6)',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
    },
    grid: {
      line: {
        stroke: 'rgba(255, 255, 255, 0.05)',
        strokeWidth: 1,
      },
    },
    legends: {
      title: {
        text: {
          fontSize: 11,
          fill: 'rgba(255, 255, 255, 0.8)',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
      text: {
        fontSize: 11,
        fill: 'rgba(255, 255, 255, 0.8)',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
      ticks: {
        line: {},
        text: {
          fontSize: 10,
          fill: 'rgba(255, 255, 255, 0.8)',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
    },
    labels: {
      text: {
        fontSize: 10,
        fill: 'rgba(255, 255, 255, 0.9)',
        outlineWidth: 2,
        outlineColor: 'rgba(0, 0, 0, 0.5)',
        outlineOpacity: 1,
      },
    },
    tooltip: {
      container: {
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 10,
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    },
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="name"
        margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={color}
        theme={darkTheme}
        borderRadius={4}
        borderWidth={0}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: '',
          legendPosition: 'middle',
          legendOffset: 32,
          truncateTickAt: 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Quantidade',
          legendPosition: 'middle',
          legendOffset: -40,
          truncateTickAt: 0,
        }}
        enableGridY={true}
        enableGridX={false}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="rgba(255, 255, 255, 0.9)"
        animate={true}
        motionConfig="gentle"
        role="application"
        ariaLabel={`Gráfico de barras: ${title}`}
        barAriaLabel={(e) => `${e.id}: ${e.formattedValue} em ${e.indexValue}`}
        tooltip={({ value, color, indexValue }) => (
          <div className="bg-black/90 text-white p-3 rounded-lg border border-white/10 shadow-xl">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">{indexValue}</span>
            </div>
            <div className="text-sm text-white/80 mt-1">
              Valor: <span className="font-semibold text-white">{value}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default BarChart;