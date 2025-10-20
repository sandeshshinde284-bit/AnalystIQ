<!-- C:\Google-Hack\Projects\AnalystIQ\frontend\src\components\Molecules\MarketBenchmarkChart.vue -->
<!-- UPDATED: Uses real analysis data instead of hardcoded mock data -->

<template>
  <div class="benchmark-charts">
    <!-- Competitive Analysis Chart -->
    <div class="chart-section">
      <h4><i class="ri-bar-chart-line"></i> Competitive Analysis</h4>
      <div class="chart-wrapper">
        <BaseChart
          type="bar"
          :data="competitorData"
          :options="barChartOptions"
          :height="250"
        />
      </div>
    </div>

    <!-- Market Growth Trajectory Chart -->
    <div class="chart-section">
      <h4><i class="ri-line-chart-line"></i> Market Growth Trajectory</h4>
      <div class="chart-wrapper">
        <BaseChart
          type="line"
          :data="marketGrowthData"
          :options="lineChartOptions"
          :height="250"
        />
      </div>
    </div>

    <!-- Performance Radar Chart -->
    <div class="chart-section">
      <h4><i class="ri-radar-chart-line"></i> Performance Radar</h4>
      <div class="chart-wrapper">
        <BaseChart
          type="radar"
          :data="radarData"
          :options="radarChartOptions"
          :height="300"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseChart from "../Atoms/BaseChart.vue";
import { useAnalysisStore } from "@/stores/analysisStore";

interface Props {
  startupName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  startupName: "Your Startup",
});

const analysisStore = useAnalysisStore();
const analysisData = computed(() => analysisStore.analysisResult);

// ✅ COMPETITIVE ANALYSIS - from analysisStore chart data
const competitorData = computed(() => {
  const chartData = analysisStore.getAllChartsData();
  const compAnalysis = chartData.competitiveAnalysis;

  return {
    labels: compAnalysis.map((c: any) => c.company),
    datasets: [
      {
        label: "Revenue ($M)",
        data: compAnalysis.map((c: any) => c.revenue),
        backgroundColor: [
          "rgba(0, 212, 255, 0.8)", // Target company - highlighted
          "rgba(255, 255, 255, 0.2)",
          "rgba(255, 255, 255, 0.2)",
          "rgba(255, 255, 255, 0.2)",
          "rgba(255, 255, 255, 0.2)",
        ],
        borderColor: [
          "#00d4ff",
          "rgba(255, 255, 255, 0.5)",
          "rgba(255, 255, 255, 0.5)",
          "rgba(255, 255, 255, 0.5)",
          "rgba(255, 255, 255, 0.5)",
        ],
        borderWidth: 2,
      },
    ],
  };
});

// ✅ MARKET GROWTH - from analysisStore chart data
const marketGrowthData = computed(() => {
  const chartData = analysisStore.getAllChartsData();
  const marketGrowth = chartData.marketGrowth;

  return {
    labels: marketGrowth.map((m: any) => m.year),
    datasets: [
      {
        label: "Total Addressable Market ($B)",
        data: marketGrowth.map((m: any) => m.value),
        borderColor: "#00d4ff",
        backgroundColor: "rgba(0, 212, 255, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#00d4ff",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };
});

// ✅ PERFORMANCE RADAR - from analysisStore chart data
const radarData = computed(() => {
  const chartData = analysisStore.getAllChartsData();
  const performanceRadar = chartData.performanceRadar;

  const labels = Object.keys(performanceRadar);
  const values = Object.values(performanceRadar) as number[];

  return {
    labels: labels,
    datasets: [
      {
        label: analysisData.value?.startupName || "Your Startup",
        data: values,
        backgroundColor: "rgba(0, 212, 255, 0.2)",
        borderColor: "#00d4ff",
        borderWidth: 3,
        pointBackgroundColor: "#00d4ff",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
      },
      {
        label: "Industry Average",
        data: [65, 65, 65, 65, 65], // Fixed industry average
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(255, 255, 255, 0.3)",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 1,
        pointRadius: 4,
      },
    ],
  };
});

// ✅ CHART OPTIONS - styling
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: "#8b93a7",
        callback: function (value: any) {
          return "$" + value + "M";
        },
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
    x: {
      ticks: {
        color: "#8b93a7",
      },
      grid: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "#ffffff",
        usePointStyle: true,
        padding: 20,
      },
    },
  },
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: "#8b93a7",
        callback: function (value: any) {
          return "$" + value + "B";
        },
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
    x: {
      ticks: {
        color: "#8b93a7",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "#ffffff",
        usePointStyle: true,
        padding: 20,
      },
    },
  },
};

const radarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        color: "#8b93a7",
        backdropColor: "transparent",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      angleLines: {
        color: "rgba(255, 255, 255, 0.1)",
      },
      pointLabels: {
        color: "#ffffff",
        font: {
          size: 12,
        },
      },
    },
  },
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "#ffffff",
        usePointStyle: true,
        padding: 20,
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.benchmark-charts {
  display: grid;
  gap: 30px;
}

.chart-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(0, 212, 255, 0.1);

  h4 {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ffffff;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;

    i {
      color: #00d4ff;
      font-size: 18px;
    }
  }
}

.chart-wrapper {
  width: 100%;
  height: 300px;
  position: relative;
  border-radius: 8px;
}
</style>
