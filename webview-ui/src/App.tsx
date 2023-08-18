import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { Bar } from "react-chartjs-2";
import "./App.css";
import { Chart, registerables } from "chart.js";
import { useReceiveMessage } from "./hooks/messageRecive";
import { useMemo, useState } from "react";
import ChartDataLabels from "chartjs-plugin-datalabels";

const labelColor = "white";
const backgroundColor = ["#3366FF", "#008F72", "#006FD6", "#DB8B00", "#DB2C66"];

Chart.register(...registerables);
export default function App() {
  const style = getComputedStyle(document.body);
  const textColor = style.getPropertyValue(
    "--vscode-sideBarSectionHeader-foreground"
  );

  const [data, setData] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  // TODO: send back a message toextension to let it know its mounted
  const handleHowdyClick = () => {
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  };

  useReceiveMessage((message) => {
    if (message.command === "TDsByLevel") {
      setData(message.payload);
    }
    if (message.command === "TDsOverview") {
      setOverview(message.payload);
    }
  });

  const overviewChartData = useMemo(() => {
    if (overview === null) {
      return undefined;
    }

    return {
      labels: ["All files", "Files with TDs"],
      datasets: [
        {
          label: "How much file has TDs",
          formatter: (value: any) => {
            return value + " Files";
          },
          data: [overview.totalFiles, overview.filesWithTD],
          backgroundColor,
        },
      ],
    };
  }, [overview]);

  const chartData = useMemo(() => {
    if (data === null) {
      return undefined;
    }
    const labels = Object.keys(data).map((el) => `Level ${el}`);
    const values = Object.values(data).map((el: any) => {
      return el.length || 0;
    }) as string[];
    return {
      labels,
      datasets: [
        {
          label: "Level of TDs",
          formatter: (value: any) => {
            return value + " TDs";
          },
          data: values,

          backgroundColor,
          borderWidth: 0,
        },
      ],
    };
  }, [data]);
  return (
    <main>
      {overviewChartData && (
        <div style={{ minHeight: 100, minWidth:100 }}>
          <Bar
            plugins={[ChartDataLabels]}
            options={{
              scales: {
                x: {
                  stacked: true,
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    color: textColor,
                    textStrokeColor: textColor,
                  },
                  grid: {
                    display: false,
                  },
                },
                y: {
                  stacked: true,
                  ticks: {
                    color: textColor,
                    textStrokeColor: textColor,
                  },
                  grid: {
                    display: false,
                  },
                },
              },
              maintainAspectRatio: false,
              indexAxis: "y",
              color: textColor,
              elements: {
                line: {
                  borderWidth: 0,
                  tension: 0.4,
                },
                bar: {
                  borderWidth: 0,
                  borderColor: "var(--vscode-editor-foreground)",
                },
              },
              plugins: {
                datalabels: {
                  formatter(value, context) {
                    return value + " Files";
                  },
                  color: labelColor,
                  textAlign: "center",
                  align: "end",
                },
                legend: {
                  display: false,
                },
                title: {
                  color: textColor,
                  align: "start",
                  display: true,
                  text: "Files with TDs",
                },
              },
            }}
            data={overviewChartData as any}
          />
        </div>
      )}
      {chartData && (
        <div style={{ minHeight: "200px", minWidth: "100px" }}>
          <Bar
            plugins={[ChartDataLabels]}
            options={{
              scales: {
                x: {
                  stacked: true,
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                  },
                  grid: {
                    display: false,
                  },
                },
                y: {
                  stacked: true,
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: textColor,
                    textStrokeColor: textColor,
                  },
                },
              },
              color: textColor,
              maintainAspectRatio: false,
              indexAxis: "y",

              elements: {
                line: {
                  borderWidth: 0,
                  tension: 0.4,
                },
                bar: {
                  borderWidth: 0,
                  borderColor: "var(--vscode-editor-foreground)",
                },
              },

              plugins: {
                datalabels: {
                  formatter(value, context) {
                    return value + " TDs";
                  },
                  color: labelColor,
                },
                legend: {
                  display: false,
                },
                title: {
                  color: textColor,
                  align: "start",
                  display: true,
                  text: "TDs by level",
                },
              },
            }}
            // TODO: fix this type
            data={chartData as any}
          />
        </div>
      )}
    </main>
  );
}
