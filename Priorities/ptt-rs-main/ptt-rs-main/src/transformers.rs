use chrono::NaiveDate;
use fancy_regex::Regex;
use once_cell::sync::Lazy;

pub fn none(input: &str) -> String {
    input.to_string()
}

pub fn value(val: &str) -> String {
    val.to_string()
}

pub fn boolean(_: &str) -> bool {
    true
}

pub fn integer(input: &str) -> Option<i32> {
    input.parse::<i32>().ok()
}

pub fn first_integer(input: &str) -> Option<i32> {
    static RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d+").unwrap());
    RE.find(input)
        .ok()
        .flatten()
        .and_then(|m| m.as_str().parse::<i32>().ok())
}

pub fn lowercase(input: &str) -> String {
    input.to_lowercase()
}

pub fn uppercase(input: &str) -> String {
    input.to_uppercase()
}

static MONTH_MAPPING: Lazy<Vec<(Regex, &str)>> = Lazy::new(|| {
    vec![
        (Regex::new(r"(?i)\bJanu\b").unwrap(), "Jan"),
        (Regex::new(r"(?i)\bFebr\b").unwrap(), "Feb"),
        (Regex::new(r"(?i)\bMarc\b").unwrap(), "Mar"),
        (Regex::new(r"(?i)\bApri\b").unwrap(), "Apr"),
        (Regex::new(r"(?i)\bMay\b").unwrap(), "May"),
        (Regex::new(r"(?i)\bJune\b").unwrap(), "Jun"),
        (Regex::new(r"(?i)\bJuly\b").unwrap(), "Jul"),
        (Regex::new(r"(?i)\bAugu\b").unwrap(), "Aug"),
        (Regex::new(r"(?i)\bSept\b").unwrap(), "Sep"),
        (Regex::new(r"(?i)\bOcto\b").unwrap(), "Oct"),
        (Regex::new(r"(?i)\bNove\b").unwrap(), "Nov"),
        (Regex::new(r"(?i)\bDece\b").unwrap(), "Dec"),
    ]
});

pub fn convert_months(date_str: &str) -> String {
    let mut result = date_str.to_string();
    for (re, short) in MONTH_MAPPING.iter() {
        result = re.replace_all(&result, *short).to_string();
    }
    result
}

pub fn date(input: &str, formats: &[&str]) -> Option<String> {
    let sanitized = Regex::new(r"\W+")
        .unwrap()
        .replace_all(input, " ")
        .trim()
        .to_string();
    let sanitized = convert_months(&sanitized);

    for fmt in formats {
        if let Ok(dt) = NaiveDate::parse_from_str(&sanitized, fmt) {
            return Some(dt.format("%Y-%m-%d").to_string());
        }
    }
    None
}

pub fn range_func(input: &str) -> Option<Vec<i32>> {
    static RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d+").unwrap());
    let numbers: Vec<i32> = RE
        .find_iter(input)
        .filter_map(|m| m.ok().and_then(|mat| mat.as_str().parse().ok()))
        .collect();

    if numbers.len() == 2 && numbers[0] < numbers[1] {
        return Some((numbers[0]..=numbers[1]).collect());
    }
    match numbers.len() {
        len if len > 2 => {
            if numbers.windows(2).all(|w| w[0] + 1 == w[1]) {
                Some(numbers)
            } else {
                None
            }
        }
        1 => Some(numbers),
        _ => None,
    }
}

pub fn range_x_of_y_func(input: &str) -> Option<Vec<i32>> {
    static RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\d+").unwrap());
    let numbers: Vec<i32> = RE
        .find_iter(input)
        .filter_map(|m| m.ok().and_then(|mat| mat.as_str().parse().ok()))
        .collect();

    if numbers.len() != 1 {
        return None;
    }
    Some((1..=numbers[0]).collect())
}

pub fn transform_resolution(input: &str) -> String {
    let lower = input.to_lowercase();
    if lower.contains("2160") || lower.contains("4k") {
        return "2160p".to_string();
    }
    if lower.contains("1440") || lower.contains("2k") {
        return "1440p".to_string();
    }
    if lower.contains("1080") {
        return "1080p".to_string();
    }
    if lower.contains("720") {
        return "720p".to_string();
    }
    if lower.contains("480") {
        return "480p".to_string();
    }
    if lower.contains("360") {
        return "360p".to_string();
    }
    if lower.contains("240") {
        return "240p".to_string();
    }
    input.to_string()
}
