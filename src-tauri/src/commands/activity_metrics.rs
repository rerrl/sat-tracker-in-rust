use crate::models::activity_metrics::ActivityMetrics;
use chrono::{Utc, DateTime, Datelike, Weekday, Duration, IsoWeek};
use sqlx::{SqlitePool, Row};
use tauri::State;

#[tauri::command]
pub async fn get_activity_metrics(
    pool: State<'_, SqlitePool>,
) -> Result<ActivityMetrics, String> {
    let now = Utc::now();
    let current_year = now.year();
    
    // Get all buy events ordered by timestamp
    let buy_events = sqlx::query(
        "SELECT timestamp, amount_sats FROM balance_change_events WHERE event_type = 'Buy' ORDER BY timestamp ASC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    if buy_events.is_empty() {
        return Ok(ActivityMetrics {
            current_streak_weeks: 0,
            longest_streak_weeks: 0,
            sats_stacked_this_year: 0,
            consistency_score_percent: 0.0,
            best_stacking_day: None,
            best_day_percentage: 0.0,
            consistency_rating: "No Data".to_string(),
            weeks_to_next_milestone: None,
            next_milestone_description: None,
        });
    }

    // Parse timestamps and calculate metrics
    let mut event_dates: Vec<DateTime<Utc>> = Vec::new();
    let mut sats_this_year = 0i64;
    let current_year = Utc::now().year();

    for row in &buy_events {
        let timestamp: DateTime<Utc> = row.get("timestamp");
        let amount_sats: i64 = row.get("amount_sats");
        
        event_dates.push(timestamp);
        
        if timestamp.year() == current_year {
            sats_this_year += amount_sats;
        }
    }

    // Calculate streaks
    let (current_streak, longest_streak) = calculate_weekly_streaks(&event_dates);

    // Calculate best stacking day
    let (best_day, best_day_percentage) = calculate_best_stacking_day(&event_dates);

    // Calculate consistency score (weighted percentage of weeks with purchases in rolling 52-week period)
    let consistency_score = calculate_weekly_consistency_score(&event_dates);

    // Determine consistency rating
    let consistency_rating = match consistency_score {
        score if score >= 80.0 => "Excellent",
        score if score >= 60.0 => "Good", 
        score if score >= 40.0 => "Fair",
        _ => "Poor",
    }.to_string();

    // Calculate next milestone
    let (weeks_to_milestone, milestone_desc) = calculate_next_weekly_milestone(current_streak);

    Ok(ActivityMetrics {
        current_streak_weeks: current_streak,
        longest_streak_weeks: longest_streak,
        sats_stacked_this_year: sats_this_year,
        consistency_score_percent: consistency_score,
        best_stacking_day: best_day,
        best_day_percentage,
        consistency_rating,
        weeks_to_next_milestone: weeks_to_milestone,
        next_milestone_description: milestone_desc,
    })
}

fn calculate_weekly_streaks(event_dates: &[DateTime<Utc>]) -> (i32, i32) {
    if event_dates.is_empty() {
        return (0, 0);
    }

    // Group events by ISO week (year + week number)
    let mut unique_weeks: Vec<IsoWeek> = event_dates
        .iter()
        .map(|dt| dt.iso_week())
        .collect();
    unique_weeks.sort_by_key(|week| (week.year(), week.week()));
    unique_weeks.dedup();

    let mut current_streak = 0;
    let mut longest_streak = 0;
    let mut temp_streak = 1;

    let current_week = Utc::now().iso_week();
    
    // Check if current streak is active (last purchase within current or previous week)
    if let Some(last_week) = unique_weeks.last() {
        let weeks_since_last = week_difference(&current_week, last_week);
        
        if weeks_since_last <= 1 {
            current_streak = 1;
            
            // Calculate current streak backwards from the most recent week
            for i in (0..unique_weeks.len().saturating_sub(1)).rev() {
                let current_week_item = unique_weeks[i];
                let next_week_item = unique_weeks[i + 1];
                let gap = week_difference(&next_week_item, &current_week_item);
                
                if gap <= 1 {
                    current_streak += 1;
                } else {
                    break;
                }
            }
        }
    }

    // Calculate longest streak
    for i in 1..unique_weeks.len() {
        let prev_week = unique_weeks[i - 1];
        let current_week_item = unique_weeks[i];
        let gap = week_difference(&current_week_item, &prev_week);
        
        if gap <= 1 {
            temp_streak += 1;
        } else {
            longest_streak = longest_streak.max(temp_streak);
            temp_streak = 1;
        }
    }
    longest_streak = longest_streak.max(temp_streak);

    (current_streak, longest_streak)
}

fn week_difference(week1: &IsoWeek, week2: &IsoWeek) -> i32 {
    // Calculate the difference in weeks between two ISO weeks
    let year_diff = week1.year() - week2.year();
    let week_diff = week1.week() as i32 - week2.week() as i32;
    
    // Approximate calculation (assumes 52 weeks per year)
    year_diff * 52 + week_diff
}

fn calculate_best_stacking_day(event_dates: &[DateTime<Utc>]) -> (Option<String>, f64) {
    if event_dates.is_empty() {
        return (None, 0.0);
    }

    let mut day_counts = [0; 7]; // Monday = 0, Sunday = 6
    
    for date in event_dates {
        let weekday_index = match date.weekday() {
            Weekday::Mon => 0,
            Weekday::Tue => 1,
            Weekday::Wed => 2,
            Weekday::Thu => 3,
            Weekday::Fri => 4,
            Weekday::Sat => 5,
            Weekday::Sun => 6,
        };
        day_counts[weekday_index] += 1;
    }

    let total_events = event_dates.len() as f64;
    let max_count = *day_counts.iter().max().unwrap();
    let max_percentage = (max_count as f64 / total_events) * 100.0;

    let best_day = day_counts
        .iter()
        .position(|&count| count == max_count)
        .map(|index| {
            match index {
                0 => "Monday",
                1 => "Tuesday", 
                2 => "Wednesday",
                3 => "Thursday",
                4 => "Friday",
                5 => "Saturday",
                6 => "Sunday",
                _ => "Unknown",
            }.to_string()
        });

    (best_day, max_percentage)
}

fn calculate_weekly_consistency_score(event_dates: &[DateTime<Utc>]) -> f64 {
    if event_dates.is_empty() {
        return 0.0;
    }

    let now = Utc::now();
    
    // Determine the period to analyze - up to 52 weeks or all available data if less
    let earliest_event = event_dates.iter().min().unwrap();
    let weeks_of_data = ((now - *earliest_event).num_weeks() + 1).min(52);
    
    if weeks_of_data <= 0 {
        return 0.0;
    }

    let period_start = now - Duration::weeks(weeks_of_data - 1);
    let recent_events: Vec<_> = event_dates
        .iter()
        .filter(|&&date| date >= period_start)
        .collect();

    if recent_events.is_empty() {
        return 0.0;
    }

    // Get unique weeks with purchases in the period
    let mut unique_weeks = std::collections::HashSet::new();
    for date in recent_events {
        unique_weeks.insert(date.iso_week());
    }

    // Calculate weighted score with heavier weight towards recent weeks
    let mut weighted_score = 0.0;
    let mut total_weight = 0.0;
    
    for week_offset in 0..weeks_of_data {
        let week_date = now - Duration::weeks(week_offset);
        let week = week_date.iso_week();
        
        // Weight decreases exponentially as we go back in time
        // Recent weeks have weight close to 1.0, older weeks approach 0.5
        let weight = 0.5 + 0.5 * (-0.05 * week_offset as f64).exp();
        
        if unique_weeks.contains(&week) {
            weighted_score += weight;
        }
        total_weight += weight;
    }

    if total_weight == 0.0 {
        return 0.0;
    }

    (weighted_score / total_weight) * 100.0
}

fn calculate_next_weekly_milestone(current_streak: i32) -> (Option<i32>, Option<String>) {
    let milestones = [4, 8, 12, 26, 52]; // 1 month, 2 months, 3 months, 6 months, 1 year
    
    for &milestone in &milestones {
        if current_streak < milestone {
            let weeks_to_go = milestone - current_streak;
            let description = match milestone {
                4 => "1-month streak".to_string(),
                8 => "2-month streak".to_string(),
                12 => "3-month streak".to_string(),
                26 => "6-month streak".to_string(),
                52 => "1-year streak".to_string(),
                _ => format!("{}-week streak", milestone),
            };
            return (Some(weeks_to_go), Some(description));
        }
    }
    
    // If past all milestones, suggest next year milestone
    (Some(52 - (current_streak % 52)), Some("Next yearly milestone".to_string()))
}
