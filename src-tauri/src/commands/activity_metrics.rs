use crate::models::activity_metrics::{ActivityMetrics, YearHeatmapData, WeekData, DayData};
use chrono::{Utc, DateTime, Datelike, Weekday, Duration, IsoWeek, TimeZone};
use sqlx::{SqlitePool, Row};
use tauri::State;
use std::collections::HashMap;

fn calculate_heatmap_data(buy_transactions: &[sqlx::sqlite::SqliteRow]) -> Vec<YearHeatmapData> {
    let mut years_data: HashMap<i32, Vec<(DateTime<Utc>, i64)>> = HashMap::new();
    
    // Group transactions by year
    for row in buy_transactions {
        let timestamp: DateTime<Utc> = row.get("timestamp");
        let amount_sats: i64 = row.get("amount_sats");
        let year = timestamp.year();
        
        years_data.entry(year).or_insert_with(Vec::new).push((timestamp, amount_sats));
    }
    
    // Add current year if no transactions
    let current_year = Utc::now().year();
    if !years_data.contains_key(&current_year) {
        years_data.insert(current_year, Vec::new());
    }
    
    let mut result = Vec::new();
    
    for (year, transactions) in years_data {
        let heatmap_data = generate_year_heatmap_data(year, &transactions);
        result.push(heatmap_data);
    }
    
    // Sort by year descending (most recent first)
    result.sort_by(|a, b| b.year.cmp(&a.year));
    
    result
}

fn generate_year_heatmap_data(year: i32, transactions: &[(DateTime<Utc>, i64)]) -> YearHeatmapData {
    // Calculate daily sats for this year
    let mut daily_sats: HashMap<String, i64> = HashMap::new();
    
    for (timestamp, amount_sats) in transactions {
        if timestamp.year() == year {
            // Use local date components to avoid timezone issues
            let date_key = format!("{:04}-{:02}-{:02}", 
                timestamp.year(), 
                timestamp.month(), 
                timestamp.day()
            );
            *daily_sats.entry(date_key).or_insert(0) += amount_sats;
        }
    }
    
    // Find max sats for intensity calculation
    let max_sats = daily_sats.values().max().copied().unwrap_or(1);
    
    // Generate 52 weeks of data
    let mut weeks = Vec::new();
    
    // Start from January 1st of the year
    let start_date = Utc.with_ymd_and_hms(year, 1, 1, 0, 0, 0).unwrap();
    
    // Find the first Sunday (or use Jan 1 if it's Sunday)
    let mut first_sunday = start_date;
    while first_sunday.weekday() != Weekday::Sun {
        first_sunday = first_sunday - Duration::days(1);
    }
    
    for week in 0..52 {
        let mut week_data = WeekData { days: Vec::new() };
        
        for day in 0..7 {
            let current_date = first_sunday + Duration::weeks(week) + Duration::days(day);
            let date_key = format!("{:04}-{:02}-{:02}", 
                current_date.year(), 
                current_date.month(), 
                current_date.day()
            );
            
            let sats = daily_sats.get(&date_key).copied().unwrap_or(0);
            let level = get_intensity_level(sats, max_sats);
            
            week_data.days.push(DayData {
                date: date_key,
                sats,
                level,
            });
        }
        
        weeks.push(week_data);
    }
    
    YearHeatmapData {
        year,
        weeks,
        max_sats,
    }
}

fn get_intensity_level(sats: i64, max_sats: i64) -> i32 {
    if sats == 0 {
        return 0;
    }
    if max_sats == 0 {
        return 1;
    }
    
    let ratio = sats as f64 / max_sats as f64;
    if ratio <= 0.25 {
        1
    } else if ratio <= 0.5 {
        2
    } else if ratio <= 0.75 {
        3
    } else {
        4
    }
}

#[tauri::command]
pub async fn get_activity_metrics(
    pool: State<'_, SqlitePool>,
) -> Result<ActivityMetrics, String> {
    let now = Utc::now();
    let current_year = now.year();
    
    // Get all buy transactions ordered by timestamp
    let buy_transactions = sqlx::query(
        "SELECT timestamp, amount_sats FROM bitcoin_transactions WHERE type = 'buy' ORDER BY timestamp ASC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| format!("Database error: {}", e))?;

    if buy_transactions.is_empty() {
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
            heatmap_data: Vec::new(),
        });
    }

    // Parse timestamps and calculate metrics
    let mut transaction_dates: Vec<DateTime<Utc>> = Vec::new();
    let mut sats_this_year = 0i64;
    let current_year = Utc::now().year();

    for row in &buy_transactions {
        let timestamp: DateTime<Utc> = row.get("timestamp");
        let amount_sats: i64 = row.get("amount_sats");
        
        transaction_dates.push(timestamp);
        
        if timestamp.year() == current_year {
            sats_this_year += amount_sats;
        }
    }

    // Calculate streaks
    let (current_streak, longest_streak) = calculate_weekly_streaks(&transaction_dates);

    // Calculate best stacking day
    let (best_day, best_day_percentage) = calculate_best_stacking_day(&transaction_dates);

    // Calculate consistency score (weighted percentage of weeks with purchases in rolling 52-week period)
    let consistency_score = calculate_weekly_consistency_score(&transaction_dates);

    // Determine consistency rating
    let consistency_rating = match consistency_score {
        score if score >= 80.0 => "Excellent",
        score if score >= 60.0 => "Good", 
        score if score >= 40.0 => "Fair",
        _ => "Poor",
    }.to_string();

    // Calculate next milestone
    let (weeks_to_milestone, milestone_desc) = calculate_next_weekly_milestone(current_streak);

    // Calculate heatmap data
    let heatmap_data = calculate_heatmap_data(&buy_transactions);

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
        heatmap_data,
    })
}

fn calculate_weekly_streaks(transaction_dates: &[DateTime<Utc>]) -> (i32, i32) {
    if transaction_dates.is_empty() {
        return (0, 0);
    }

    // Group transactions by ISO week (year + week number)
    let mut unique_weeks: Vec<IsoWeek> = transaction_dates
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

fn calculate_best_stacking_day(transaction_dates: &[DateTime<Utc>]) -> (Option<String>, f64) {
    if transaction_dates.is_empty() {
        return (None, 0.0);
    }

    let mut day_counts = [0; 7]; // Monday = 0, Sunday = 6
    
    for date in transaction_dates {
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

    let total_transactions = transaction_dates.len() as f64;
    let max_count = *day_counts.iter().max().unwrap();
    let max_percentage = (max_count as f64 / total_transactions) * 100.0;

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

fn calculate_weekly_consistency_score(transaction_dates: &[DateTime<Utc>]) -> f64 {
    if transaction_dates.is_empty() {
        return 0.0;
    }

    let now = Utc::now();
    
    // Determine the period to analyze - up to 52 weeks or all available data if less
    let earliest_transaction = transaction_dates.iter().min().unwrap();
    let weeks_of_data = ((now - *earliest_transaction).num_weeks() + 1).min(52);
    
    if weeks_of_data <= 0 {
        return 0.0;
    }

    let period_start = now - Duration::weeks(weeks_of_data - 1);
    let recent_transactions: Vec<_> = transaction_dates
        .iter()
        .filter(|&&date| date >= period_start)
        .collect();

    if recent_transactions.is_empty() {
        return 0.0;
    }

    // Get unique weeks with purchases in the period
    let mut unique_weeks = std::collections::HashSet::new();
    for date in recent_transactions {
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
    
    // If past all initial milestones, calculate next yearly milestone
    if current_streak >= 52 {
        let current_year = (current_streak / 52) + 1;
        let next_year = current_year + 1;
        let weeks_into_current_year = current_streak % 52;
        let weeks_to_next_year = 52 - weeks_into_current_year;
        
        let description = format!("{}-year streak", next_year);
        return (Some(weeks_to_next_year), Some(description));
    }
    
    // Fallback (shouldn't reach here)
    (Some(52 - (current_streak % 52)), Some("Next yearly milestone".to_string()))
}
