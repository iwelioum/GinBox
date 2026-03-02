use crate::models::ParsedStreamMeta;
use regex::Regex;
use std::sync::OnceLock;

fn quality_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)(4K|2160p|1080p|720p|480p)").expect("quality regex invalid"))
}

fn size_gb_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(\d+(\.\d+)?)\s*(GB|GiB)").expect("size_gb regex invalid"))
}

fn seeders_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"👤\s*(\d+)|Seeds:\s*(\d+)").expect("seeders regex invalid"))
}

fn language_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)🌐\s*([A-Z]{2,})|\b(TRUEFRENCH|VFF|VF|FRENCH|FR|EN|VOSTFR|MULTI)\b")
            .expect("language regex invalid")
    })
}

fn normalize_language(raw: &str) -> String {
    let upper = raw.to_uppercase();
    match upper.as_str() {
        "TRUEFRENCH" | "VFF" => upper,
        "VF" | "FRENCH" | "FR" => "FR".to_string(),
        "EN" => "EN".to_string(),
        "VOSTFR" => "VOSTFR".to_string(),
        "MULTI" => "MULTI".to_string(),
        _ => upper,
    }
}

fn codec_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\b(x265|x264|HEVC|AV1|H\.264)\b").expect("codec regex invalid"))
}

pub fn parse_stream_title(title: &str) -> ParsedStreamMeta {
    let quality = quality_regex()
        .captures(title)
        .and_then(|caps| caps.get(1))
        .map_or("unknown".to_string(), |m| m.as_str().to_string());

    let size_gb = size_gb_regex()
        .captures(title)
        .and_then(|caps| caps.get(1))
        .and_then(|m| m.as_str().parse::<f32>().ok())
        .unwrap_or(0.0);

    let seeders = seeders_regex()
        .captures(title)
        .and_then(|caps| caps.get(1).or(caps.get(2)))
        .and_then(|m| m.as_str().parse::<u32>().ok())
        .unwrap_or(0);

    let language = language_regex()
        .captures(title)
        .and_then(|caps| caps.get(1).or(caps.get(2)))
        .map_or("unknown".to_string(), |m| normalize_language(m.as_str()));
    
    let codec = codec_regex()
        .captures(title)
        .and_then(|caps| caps.get(1))
        .map_or("unknown".to_string(), |m| m.as_str().to_string());

    ParsedStreamMeta {
        quality,
        size_gb,
        seeders,
        language,
        codec,
    }
}
