use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityMetrics {
    pub current_streak_weeks: i32,
    pub longest_streak_weeks: i32,
    pub sats_stacked_this_year: i64,
    pub consistency_score_percent: f64,
    pub best_stacking_day: Option<String>,
    pub best_day_percentage: f64,
    pub consistency_rating: String,
    pub weeks_to_next_milestone: Option<i32>,
    pub next_milestone_description: Option<String>,
    pub heatmap_data: Vec<YearHeatmapData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YearHeatmapData {
    pub year: i32,
    pub weeks: Vec<WeekData>,
    pub max_sats: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeekData {
    pub days: Vec<DayData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayData {
    pub date: String, // ISO date string (YYYY-MM-DD)
    pub sats: i64,
    pub level: i32, // 0-4 for color intensity
}
