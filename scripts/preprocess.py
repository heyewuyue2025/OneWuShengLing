"""
Dataset C preprocessing for scrollytelling narrative visualization.
Generates lightweight JSON files for offline web rendering.
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUT_DIR = ROOT / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

YEAR_COLS = [str(y) for y in range(1950, 2021)]


def save_json(name: str, payload) -> None:
    path = OUT_DIR / name
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"  -> {path.name} ({path.stat().st_size // 1024} KB)")


def parse_range(value) -> float | None:
    if pd.isna(value):
        return None
    text = str(value).strip().replace(",", "")
    if not text or text.lower() in {"not applicable", "varies", "unknown"}:
        return None
    nums = re.findall(r"\d+\.?\d*", text)
    if not nums:
        return None
    floats = [float(n) for n in nums]
    return sum(floats) / len(floats)


def parse_population(text) -> dict:
    if pd.isna(text):
        return {"raw": None, "value": None, "qualifier": "unknown"}
    raw = str(text).strip()
    lower = raw.lower()
    if lower == "unknown" or not raw:
        return {"raw": raw, "value": None, "qualifier": "unknown"}
    qualifier = "exact"
    if "<" in raw:
        qualifier = "less_than"
    elif ">" in raw:
        qualifier = "greater_than"
    nums = re.findall(r"\d[\d,]*", raw)
    value = float(nums[0].replace(",", "")) if nums else None
    return {"raw": raw, "value": value, "qualifier": qualifier}


def normalize_threats(text) -> list[str]:
    if pd.isna(text):
        return []
    parts = re.split(r"[,;]", str(text))
    return [p.strip() for p in parts if p.strip()]


def compute_trend(series: pd.Series) -> dict:
    valid = series.dropna()
    if len(valid) < 2:
        return {"direction": "insufficient", "change_pct": None, "start": None, "end": None}
    first_idx, last_idx = valid.index[0], valid.index[-1]
    start, end = float(valid.iloc[0]), float(valid.iloc[-1])
    if start == 0:
        change_pct = None
    else:
        change_pct = round((end - start) / abs(start) * 100, 1)
    if end > start * 1.05:
        direction = "increase"
    elif end < start * 0.95:
        direction = "decrease"
    else:
        direction = "stable"
    return {
        "direction": direction,
        "change_pct": change_pct,
        "start": start,
        "end": end,
        "start_year": int(first_idx),
        "end_year": int(last_idx),
    }


def index_series(series: pd.Series, baseline_year: str = "1970") -> list[dict]:
    valid = series.dropna()
    if valid.empty:
        return []
    baseline = valid.get(baseline_year)
    if baseline is None or baseline == 0:
        first_val = float(valid.iloc[0])
        first_year = str(valid.index[0])
        if first_val == 0:
            return []
        baseline = first_val
        baseline_year = first_year
    points = []
    for year, val in valid.items():
        points.append({
            "year": int(year),
            "value": round(float(val) / float(baseline) * 100, 2),
        })
    return points


def process_lpi() -> dict:
    path = DATA_DIR / "LPI 2016. Living Planet Index database" / "LPD_2024_public.csv"
    df = pd.read_csv(path, low_memory=False)
    df = df[df["Included in LPR2024"] == 1].copy()

    for col in YEAR_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Per-population trends
    trends = []
    for _, row in df.iterrows():
        series = row[YEAR_COLS]
        trend = compute_trend(series)
        if trend["direction"] == "insufficient":
            continue
        trends.append({
            **trend,
            "common_name": row.get("Common_name"),
            "class": row.get("Class"),
            "region": row.get("Region"),
            "country": row.get("Country"),
            "latitude": row.get("Latitude"),
            "longitude": row.get("Longitude"),
            "system": row.get("System"),
        })

    trend_df = pd.DataFrame(trends)
    direction_counts = trend_df["direction"].value_counts().to_dict()
    class_direction = (
        trend_df.groupby(["class", "direction"]).size().reset_index(name="count")
    )
    class_summary = []
    for cls, grp in trend_df.groupby("class"):
        total = len(grp)
        dec = int((grp["direction"] == "decrease").sum())
        inc = int((grp["direction"] == "increase").sum())
        class_summary.append({
            "class": cls,
            "total": total,
            "decrease_pct": round(dec / total * 100, 1) if total else 0,
            "increase_pct": round(inc / total * 100, 1) if total else 0,
        })

    # Regional aggregated index (median of indexed series per year)
    region_indices = {}
    for region, grp in df.groupby("Region"):
        yearly_vals = defaultdict(list)
        for _, row in grp.iterrows():
            indexed = index_series(row[YEAR_COLS])
            for pt in indexed:
                yearly_vals[pt["year"]].append(pt["value"])
        if not yearly_vals:
            continue
        series = [
            {"year": y, "value": round(float(pd.Series(v).median()), 2)}
            for y, v in sorted(yearly_vals.items())
        ]
        if len(series) >= 2:
            region_indices[region] = series

    # Global index
    yearly_global = defaultdict(list)
    for _, row in df.iterrows():
        indexed = index_series(row[YEAR_COLS])
        for pt in indexed:
            yearly_global[pt["year"]].append(pt["value"])
    global_index = [
        {"year": y, "value": round(float(pd.Series(v).median()), 2)}
        for y, v in sorted(yearly_global.items())
    ]

    # Region change 1970-2020
    region_change = []
    for region, series in region_indices.items():
        by_year = {p["year"]: p["value"] for p in series}
        v1970 = by_year.get(1970) or next((by_year[y] for y in sorted(by_year) if y >= 1970), None)
        v2020 = by_year.get(2020) or by_year.get(max(by_year))
        if v1970 and v2020:
            region_change.append({
                "region": region,
                "value_1970": v1970,
                "value_2020": v2020,
                "change_pct": round((v2020 - v1970) / v1970 * 100, 1),
            })
    region_change.sort(key=lambda x: x["change_pct"])

    # Geo scatter sample (decreasing populations)
    geo_sample = (
        trend_df[trend_df["direction"] == "decrease"]
        .dropna(subset=["latitude", "longitude"])
        .head(200)
        .to_dict(orient="records")
    )

    # Notable recovery stories
    recoveries = (
        trend_df[trend_df["direction"] == "increase"]
        .dropna(subset=["change_pct"])
        .nlargest(8, "change_pct")
        [["common_name", "class", "region", "country", "change_pct", "start", "end"]]
        .to_dict(orient="records")
    )

    return {
        "global_index": global_index,
        "region_indices": region_indices,
        "region_change": region_change,
        "direction_counts": direction_counts,
        "class_summary": sorted(class_summary, key=lambda x: -x["decrease_pct"]),
        "geo_sample": geo_sample,
        "recoveries": recoveries,
        "total_populations": len(trend_df),
    }


def process_endangered() -> dict:
    path = DATA_DIR / "Top 100 Most Endangered Species" / "Species.csv"
    df = pd.read_csv(path)
    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    records = []
    threat_counter = Counter()
    type_counter = Counter()

    for _, row in df.iterrows():
        pop = parse_population(row.get("Estimated Population"))
        threats = normalize_threats(row.get("Threats"))
        for t in threats:
            threat_counter[t] += 1
        type_name = str(row.get("Type", "Unknown"))
        type_counter[type_name] += 1
        records.append({
            "species_name": row.get("Species Name"),
            "common_name": row.get("Common Name") if pd.notna(row.get("Common Name")) else None,
            "type": type_name,
            "location": row.get("Location(s)"),
            "population": pop,
            "threats": threats,
        })

    records.sort(key=lambda r: (r["population"]["value"] is None, r["population"]["value"] or 999999))

    lowest = [r for r in records if r["population"]["value"] is not None][:10]
    unknown_count = sum(1 for r in records if r["population"]["qualifier"] == "unknown")

    return {
        "species": records,
        "lowest_population": lowest,
        "threat_counts": [{"threat": k, "count": v} for k, v in threat_counter.most_common(15)],
        "type_counts": [{"type": k, "count": v} for k, v in type_counter.most_common()],
        "total": len(records),
        "unknown_population_count": unknown_count,
    }


def process_animals() -> dict:
    path = DATA_DIR / "Animal Information Dataset" / "Animal Dataset.csv"
    df = pd.read_csv(path)

    status_order = [
        "Extinct", "Critically Endangered", "Endangered", "Vulnerable",
        "Near Threatened", "Least Concern", "Not Evaluated", "Not Applicable",
    ]
    status_counts = df["Conservation Status"].value_counts().to_dict()
    status_data = [
        {"status": s, "count": status_counts.get(s, 0)}
        for s in status_order if status_counts.get(s, 0) > 0
    ]

    diet_habitat = (
        df.groupby(["Diet", "Conservation Status"]).size().reset_index(name="count")
        .to_dict(orient="records")
    )

    # Top endangered animals in this dataset
    endangered = df[df["Conservation Status"].isin(
        ["Critically Endangered", "Endangered", "Vulnerable"]
    )].copy()

    animals = []
    for _, row in df.iterrows():
        animals.append({
            "name": row["Animal"],
            "status": row["Conservation Status"],
            "diet": row["Diet"],
            "habitat": row["Habitat"],
            "lifespan": row["Lifespan (years)"],
            "countries": row["Countries Found"],
            "height_cm": parse_range(row["Height (cm)"]),
            "weight_kg": parse_range(row["Weight (kg)"]),
            "speed_kmh": parse_range(row.get("Average Speed (km/h)")),
        })

    return {
        "status_distribution": status_data,
        "diet_status_matrix": diet_habitat,
        "endangered_highlight": endangered[["Animal", "Conservation Status", "Habitat", "Countries Found"]]
            .to_dict(orient="records"),
        "animals": animals,
        "total": len(df),
    }


def process_penguins() -> dict:
    path = DATA_DIR / "Palmer Penguins Dataset" / "palmerpenguins_extended.csv"
    df = pd.read_csv(path)

    health_by_species = (
        df.groupby(["species", "health_metrics"]).size().reset_index(name="count")
    )
    health_pct = []
    for species, grp in health_by_species.groupby("species"):
        total = grp["count"].sum()
        for _, row in grp.iterrows():
            health_pct.append({
                "species": species,
                "health": row["health_metrics"],
                "count": int(row["count"]),
                "pct": round(row["count"] / total * 100, 1),
            })

    mass_by_diet = (
        df.groupby(["species", "diet"])["body_mass_g"]
        .agg(["mean", "median", "count"])
        .reset_index()
    )
    mass_by_diet.columns = ["species", "diet", "mean_mass", "median_mass", "count"]
    mass_by_diet["mean_mass"] = mass_by_diet["mean_mass"].round(0)
    mass_by_diet["median_mass"] = mass_by_diet["median_mass"].round(0)

    island_health = (
        df.groupby(["island", "health_metrics"]).size().reset_index(name="count")
        .to_dict(orient="records")
    )

    # Individual mass distribution sample for beeswarm
    sample = df.sample(min(400, len(df)), random_state=42)
    mass_points = sample[["species", "diet", "health_metrics", "body_mass_g", "island"]].to_dict(orient="records")

    overweight_rate = (
        df.groupby("species")
        .apply(lambda g: round((g["health_metrics"] == "overweight").sum() / len(g) * 100, 1))
        .reset_index(name="overweight_pct")
        .to_dict(orient="records")
    )

    return {
        "health_distribution": health_pct,
        "mass_by_diet": mass_by_diet.to_dict(orient="records"),
        "island_health": island_health,
        "mass_points": mass_points,
        "overweight_rate": overweight_rate,
        "total": len(df),
        "year": int(df["year"].iloc[0]) if "year" in df.columns else None,
    }


def main():
    print("Processing Dataset C...")
    lpi = process_lpi()
    save_json("lpi.json", lpi)

    endangered = process_endangered()
    save_json("endangered.json", endangered)

    animals = process_animals()
    save_json("animals.json", animals)

    penguins = process_penguins()
    save_json("penguins.json", penguins)

    meta = {
        "title": "沉默的计数：从全球种群曲线到最后一只",
        "datasets": [
            "Living Planet Index (LPD_2024_public.csv)",
            "Top 100 Most Endangered Species (Species.csv)",
            "Animal Information Dataset (Animal Dataset.csv)",
            "Palmer Penguins Extended (palmerpenguins_extended.csv)",
        ],
        "generated": True,
    }
    save_json("meta.json", meta)
    print("Done.")


if __name__ == "__main__":
    main()
