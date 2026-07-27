"""Charts — Chart data generation for frontend visualization."""

import math
from datetime import datetime, timedelta, timezone


class ChartDataService:
    """Generate chart data formatted for recharts (Next.js)."""

    def generate_line_chart_data(self, metric: str, time_range_hours: int = 24, data_points: int = 24) -> list[dict]:
        """Generate line chart data points."""
        data = []
        now = datetime.now(timezone.utc)
        for i in range(data_points):
            hour_ago = (data_points - i) * (time_range_hours / data_points)
            ts = now - timedelta(hours=hour_ago)
            # Simulated data (in production, query DB)
            base_value = {"messages_sent": 15, "engagements": 45, "conversions": 3}.get(metric, 10)
            noise = (hash(ts.isoformat()) % 20) - 10
            value = max(0, base_value + noise)
            data.append({
                "time": ts.strftime("%H:%M"),
                "value": round(value, 1),
            })
        return data

    def generate_bar_chart_data(self, categories: list[str], values: list[float]) -> list[dict]:
        """Generate bar chart data."""
        return [
            {"category": cat, "value": round(val, 1)}
            for cat, val in zip(categories, values)
        ]

    def generate_pie_chart_data(self, categories: list[str], values: list[float]) -> list[dict]:
        """Generate pie chart data with percentages."""
        total = sum(values) or 1
        return [
            {"name": cat, "value": round(val, 1), "percentage": round(val / total * 100, 1)}
            for cat, val in zip(categories, values)
        ]

    def generate_heatmap_data(self, hours: int = 24, days: int = 7) -> list[dict]:
        """Generate activity heatmap data (hour x day)."""
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        data = []
        for day_idx, day_name in enumerate(day_names):
            for hour in range(0, 24, 3):  # Every 3 hours
                # Simulated heat intensity
                base = 0.3 if 9 <= hour <= 22 else 0.05
                day_boost = 1.5 if day_idx >= 5 else 1.0  # Weekends busier
                noise = (hash(f"{day_idx}-{hour}") % 50) / 100
                intensity = min(1.0, max(0, base * day_boost + noise))
                data.append({
                    "day": day_name,
                    "hour": hour,
                    "intensity": round(intensity, 2),
                })
        return data

    def generate_sankey_data(self, funnel_stages: list[str], values: list[int]) -> dict:
        """Generate Sankey diagram data for conversion funnel."""
        nodes = []
        links = []
        for i, (stage, value) in enumerate(zip(funnel_stages, values)):
            nodes.append({"id": f"node_{i}", "name": stage, "value": value})
            if i > 0:
                links.append({
                    "source": f"node_{i-1}",
                    "target": f"node_{i}",
                    "value": value,
                })
        return {"nodes": nodes, "links": links}

    def generate_scatter_data(self, x_values: list[float], y_values: list[float], labels: list[str] | None = None) -> list[dict]:
        """Generate scatter plot data."""
        data = []
        for i in range(len(x_values)):
            entry = {
                "x": round(x_values[i], 1),
                "y": round(y_values[i], 1),
            }
            if labels and i < len(labels):
                entry["name"] = labels[i]
            data.append(entry)
        return data
