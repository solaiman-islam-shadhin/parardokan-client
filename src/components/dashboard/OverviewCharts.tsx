import { BarChart3, Activity } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface OverviewChartsProps {
  orders: { createdAt: string; status: string }[];
  values: { createdAt: string; amount: number }[];
  valueLabel: string;
}

function days() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
}

export default function OverviewCharts({ orders, values, valueLabel }: OverviewChartsProps) {
  const { lang, t } = useTheme();
  const dates = days();
  const chart = dates.map((date) => {
    const key = date.toDateString();
    return {
      label: date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { weekday: "short" }),
      orders: orders.filter((item) => new Date(item.createdAt).toDateString() === key).length,
      value: values
        .filter((item) => new Date(item.createdAt).toDateString() === key)
        .reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const maxOrders = Math.max(...chart.map((item) => item.orders), 1);
  const maxValue = Math.max(...chart.map((item) => item.value), 1);
  const points = chart
    .map((item, index) => `${index * 50 + 10},${88 - (item.value / maxValue) * 68}`)
    .join(" ");

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <section className="chart-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="matrix-label"><Activity size={14} /> {t("overview.activity_trend")}</p>
            <h2 className="mt-2 text-lg font-bold">{t("overview.last_seven_days")}</h2>
          </div>
          <span className="chart-legend"><i /> {valueLabel}</span>
        </div>
        <div className="chart-line-wrap mt-6">
          <svg viewBox="0 0 320 100" role="img" aria-label={`${valueLabel} trend`}>
            <path className="chart-line-grid" d="M0 20H320M0 54H320M0 88H320" />
            <polyline className="chart-line" points={points} />
            {chart.map((item, index) => (
              <circle key={item.label} className="chart-dot" cx={index * 50 + 10} cy={88 - (item.value / maxValue) * 68} r="2.5" />
            ))}
          </svg>
          <div className="chart-axis">{chart.map((item) => <span key={item.label}>{item.label}</span>)}</div>
        </div>
      </section>

      <section className="chart-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="matrix-label"><BarChart3 size={14} /> {t("overview.order_pulse")}</p>
            <h2 className="mt-2 text-lg font-bold">{t("overview.daily_volume")}</h2>
          </div>
          <span className="text-xs text-base-content/50">{t("overview.orders")}</span>
        </div>
        <div className="chart-bars mt-7">
          {chart.map((item) => (
            <div key={item.label} className="chart-bar-column">
              <div className="chart-bar-track"><span style={{ height: `${Math.max(8, (item.orders / maxOrders) * 100)}%` }} /></div>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
