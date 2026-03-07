use crate::models::ParsedStreamMeta;
use regex::Regex;
use std::sync::OnceLock;

// ══════════════════════════════════════════════════════════
// Lazy-compiled regex (compiled once, reused forever)
// Patterns extracted & refined from PTT (Python) handlers.py
// ══════════════════════════════════════════════════════════

/// Pixel-dimension resolution (3840x2160, 1920x1080, 1280x720)
fn pixel_resolution_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)\[?\]?(?:(3840)x\d{4}|(1920)x\d{3,4}|(1280)x\d{3})[\])]?")
            .expect("pixel resolution regex")
    })
}

fn resolution_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(concat!(
            r"(?i)",
            r"(?:Full[ .]?HD|FHD)",                     // Full HD → 1080p
            r"|(?:BD|HD|M)(2160p?|4[Kk])",              // BD2160p, HD4K
            r"|(?:BD|HD|M)(1080p?)",                     // BD1080p
            r"|(?:BD|HD|M)(720p?)",                      // BD720p
            r"|(?:BD|HD|M)(480p?)",                      // BD480p
            r"|\b(2160[pi]|4[Kk]|UHD)\b",               // standalone
            r"|\b(1440[pi]|2[Kk])\b",
            r"|\b(1080[pi])\b",
            r"|\b(720[pi])\b",
            r"|\b(480[pi])\b",
            r"|\b(360[pi])\b",
            r"|\b(240[pi])\b",
        ))
        .expect("resolution regex")
    })
}

/// Quality/source type detection (REMUX, BluRay, WEB-DL, etc.)
/// Available for future use in enhanced scoring.
fn codec_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)\b(x\.?265|[Hh]\.?265|HEVC|x\.?264|[Hh]\.?264|AVC|AV1|MPEG[24]?|XviD|DivX|VP9|VC-?1)\b")
            .expect("codec regex")
    })
}

/// Extracts the raw French language variant tag before ISO normalization.
/// Covers: TRUEFRENCH, TRUE-FRENCH, TRUE.FRENCH, SUB-FRENCH, SUB.FRENCH,
///         VFF, VFQ, VFI, VFB, VFR, VF2, VF, FRENCH, VOSTFR, VOST, MULTi
fn language_variant_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)\b(TRUE[.\-]?FRENCH|SUB[.\-]?FRENCH|VFF|VFQ|VFI|VFB|VFR|VF2|VF|FRENCH|VOSTFR|VOST|MULTi)\b")
            .expect("language variant regex")
    })
}

fn language_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(concat!(
            r"(?i)",
            r"🌐\s*([A-Za-z]{2,})",                              // emoji prefix
            r"|\b(TRUE[.\-]?FRENCH|SUB[.\-]?FRENCH)\b",          // → FR
            r"|\b(VF[FQRIB2]?)\b",                                // VF variants → FR (incl. VFR)
            r"|\b(VOSTFR|VOST)\b",                                // VOSTFR
            r"|\b(FRENCH)\b",                                      // FRENCH → FR
            r"|\b(MULTi)\b",                                       // MULTi
            r"|\b(ENGLISH|ENG)\b",                                 // EN
            r"|\b(SPANISH|ESP|SPA)\b",                             // ES
            r"|\b(GERMAN|GER|DEU)\b",                              // DE
            r"|\b(ITALIAN|ITA)\b",                                 // IT
            r"|\b(PORTUGUESE|POR)\b",                              // PT
            r"|\b(RUSSIAN|RUS)\b",                                 // RU
            r"|\b(JAPANESE|JPN|JAP)\b",                            // JA
            r"|\b(KOREAN|KOR)\b",                                  // KO
            r"|\b(CHINESE|CHI|ZHO)\b",                             // ZH
            r"|\b(ARABIC|ARA)\b",                                  // AR
            r"|\b(HINDI|HIN)\b",                                   // HI
            r"|\b(TURKISH|TUR)\b",                                 // TR
            r"|\b(POLISH|POL)\b",                                  // PL
            r"|\b(DUTCH|NLD|DUT|FLEMISH)\b",                       // NL (incl. Flemish)
            r"|\b(SWEDISH|SWE)\b",                                 // SV
            r"|\b(NORWEGIAN|NOR)\b",                               // NO
            r"|\b(DANISH|DAN)\b",                                  // DA
            r"|\b(FINNISH|FIN)\b",                                 // FI
            r"|\b(CZECH|CZE|CES)\b",                              // CS
            r"|\b(THAI|THA)\b",                                    // TH
            r"|\b(ROMANIAN|RON|RUM|ROM)\b",                        // RO
            r"|\b(HEBREW|HEB)\b",                                  // HE
            r"|\b(HUNGARIAN|HUN)\b",                               // HU
            r"|\b(BULGARIAN|BUL)\b",                               // BG
            r"|\b(SERBIAN|SRP)\b",                                 // SR
            r"|\b(CROATIAN|HRV)\b",                                // HR
            r"|\b(SLOVENIAN)\b",                                   // SL
            r"|\b(SLOVAK)\b",                                      // SK
            r"|\b(UKRAINIAN|UKR)\b",                               // UK
            r"|\b(VIETNAMESE|VIE)\b",                              // VI
            r"|\b(INDONESIAN|IND)\b",                              // ID
            r"|\b(PERSIAN|PERSA)\b",                               // FA
            r"|\b(GREEK)\b",                                       // EL
            r"|\b(LITHUANIAN)\b",                                  // LT
            r"|\b(LATVIAN)\b",                                     // LV
            r"|\b(ESTONIAN)\b",                                    // ET
            r"|\b(BENGALI)\b",                                     // BN
            r"|\b(MALAYALAM)\b",                                   // ML
            r"|\b(TAMIL|TAM)\b",                                   // TA
            r"|\b(TELUGU|TEL)\b",                                  // TE
            r"|\b(FR[E]?)\b",                                      // FR/FRE
            r"|\b(EN)\b",                                           // EN shortcode
            r"|\b(PT)\b",                                           // PT shortcode
        ))
        .expect("language regex")
    })
}

fn dubbed_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)\b(MULTi(?:ple)?[ .\-]*(?:lang(?:uages?)?|audio|VF2)?|DUAL[ .\-]*(?:audio|line)?|DUBBED|DUBLADO|DUBBING|DUBS?|FAN[ .]?DUB)\b")
            .expect("dubbed regex")
    })
}

fn size_gb_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)(\d+(?:\.\d+)?)\s*(GB|GiB|Go)")
            .expect("size_gb regex")
    })
}

fn size_mb_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)(\d+(?:\.\d+)?)\s*(MB|MiB|Mo)")
            .expect("size_mb regex")
    })
}

fn seeders_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"👤\s*(\d+)|[Ss]eeds?:?\s*(\d+)")
            .expect("seeders regex")
    })
}

// ══════════════════════════════════════════════════════════
// Normalization helpers
// ══════════════════════════════════════════════════════════

fn normalize_resolution(raw: &str) -> String {
    let lower = raw.to_lowercase();
    if lower.contains("2160") || lower.contains("4k") || lower == "uhd" {
        "2160p".to_string()
    } else if lower.contains("1440") || lower.contains("2k") {
        "1440p".to_string()
    } else if lower.contains("1080") || lower == "fhd" || lower.contains("full") {
        "1080p".to_string()
    } else if lower.contains("720") {
        "720p".to_string()
    } else if lower.contains("480") {
        "480p".to_string()
    } else if lower.contains("360") {
        "360p".to_string()
    } else if lower.contains("240") {
        "240p".to_string()
    } else {
        raw.to_string()
    }
}

fn normalize_codec(raw: &str) -> String {
    let lower = raw.to_lowercase().replace('.', "");
    match lower.as_str() {
        "x265" | "h265" | "hevc" => "HEVC".to_string(),
        "x264" | "h264" | "avc" => "H.264".to_string(),
        "av1" => "AV1".to_string(),
        "xvid" => "XviD".to_string(),
        "divx" => "DivX".to_string(),
        "vp9" => "VP9".to_string(),
        "vc1" | "vc-1" => "VC-1".to_string(),
        s if s.starts_with("mpeg") => "MPEG".to_string(),
        _ => raw.to_string(),
    }
}

fn normalize_language(raw: &str) -> String {
    let upper = raw.to_uppercase().replace(['.', '-'], "");
    match upper.as_str() {
        "TRUEFRENCH" | "SUBFRENCH" => "FR".to_string(),
        "VFF" | "VFQ" | "VFI" | "VFB" | "VFR" | "VF2" | "VF" | "FRENCH" | "FR" | "FRE" => "FR".to_string(),
        "VOSTFR" | "VOST" => "VOSTFR".to_string(),
        "MULTI" => "MULTI".to_string(),
        "EN" | "ENGLISH" | "ENG" => "EN".to_string(),
        "SPANISH" | "ESP" | "SPA" => "ES".to_string(),
        "GERMAN" | "GER" | "DEU" => "DE".to_string(),
        "ITALIAN" | "ITA" => "IT".to_string(),
        "PORTUGUESE" | "POR" | "PT" => "PT".to_string(),
        "RUSSIAN" | "RUS" => "RU".to_string(),
        "JAPANESE" | "JPN" | "JAP" => "JA".to_string(),
        "KOREAN" | "KOR" => "KO".to_string(),
        "CHINESE" | "CHI" | "ZHO" => "ZH".to_string(),
        "ARABIC" | "ARA" => "AR".to_string(),
        "HINDI" | "HIN" => "HI".to_string(),
        "TURKISH" | "TUR" => "TR".to_string(),
        "POLISH" | "POL" => "PL".to_string(),
        "DUTCH" | "NLD" | "DUT" | "FLEMISH" => "NL".to_string(),
        "SWEDISH" | "SWE" => "SV".to_string(),
        "NORWEGIAN" | "NOR" => "NO".to_string(),
        "DANISH" | "DAN" => "DA".to_string(),
        "FINNISH" | "FIN" => "FI".to_string(),
        "CZECH" | "CZE" | "CES" => "CS".to_string(),
        "THAI" | "THA" => "TH".to_string(),
        "ROMANIAN" | "RON" | "RUM" | "ROM" => "RO".to_string(),
        "HEBREW" | "HEB" => "HE".to_string(),
        "HUNGARIAN" | "HUN" => "HU".to_string(),
        "BULGARIAN" | "BUL" => "BG".to_string(),
        "SERBIAN" | "SRP" => "SR".to_string(),
        "CROATIAN" | "HRV" => "HR".to_string(),
        "SLOVENIAN" => "SL".to_string(),
        "SLOVAK" => "SK".to_string(),
        "UKRAINIAN" | "UKR" => "UK".to_string(),
        "VIETNAMESE" | "VIE" => "VI".to_string(),
        "INDONESIAN" | "IND" => "ID".to_string(),
        "PERSIAN" | "PERSA" => "FA".to_string(),
        "GREEK" => "EL".to_string(),
        "LITHUANIAN" => "LT".to_string(),
        "LATVIAN" => "LV".to_string(),
        "ESTONIAN" => "ET".to_string(),
        "BENGALI" => "BN".to_string(),
        "MALAYALAM" => "ML".to_string(),
        "TAMIL" | "TAM" => "TA".to_string(),
        "TELUGU" | "TEL" => "TE".to_string(),
        _ => upper,
    }
}

fn extract_language_variant(title: &str) -> Option<String> {
    let caps = language_variant_regex().captures(title)?;
    let raw = caps.get(1)?.as_str().to_uppercase().replace(['.', '-'], "");
    let variant = match raw.as_str() {
        "TRUEFRENCH" | "SUBFRENCH" => "TRUEFRENCH",
        "VFF" => "VFF",
        "VFQ" => "VFQ",
        "VFI" => "VFI",
        "VFB" => "VFB",
        "VFR" => "VFR",
        "VF2" | "VF" => "VF",
        "FRENCH" => "FRENCH",
        "VOSTFR" | "VOST" => "VOSTFR",
        "MULTI" => "MULTI",
        _ => return None,
    };
    Some(variant.to_string())
}

// ══════════════════════════════════════════════════════════
// Public API — signature unchanged
// ══════════════════════════════════════════════════════════

pub fn parse_stream_title(title: &str) -> ParsedStreamMeta {
    // ── Resolution (quality field) ──
    // Try pixel dimensions first (3840x2160, 1920x1080, 1280x720)
    let quality = pixel_resolution_regex()
        .captures(title)
        .and_then(|caps| {
            if caps.get(1).is_some() { Some("2160p".to_string()) }
            else if caps.get(2).is_some() { Some("1080p".to_string()) }
            else if caps.get(3).is_some() { Some("720p".to_string()) }
            else { None }
        })
        .or_else(|| {
            // Then try named resolution patterns
            resolution_regex()
                .captures(title)
                .and_then(|caps| {
                    (0..caps.len()).find_map(|i| caps.get(i))
                })
                .map(|m| normalize_resolution(m.as_str()))
        })
        .unwrap_or_else(|| "unknown".to_string());

    // ── Codec ──
    let codec = codec_regex()
        .captures(title)
        .and_then(|caps| caps.get(1))
        .map(|m| normalize_codec(m.as_str()))
        .unwrap_or_else(|| "unknown".to_string());

    // ── Language variant (raw FR tag, extracted before normalization) ──
    let language_variant = extract_language_variant(title);

    // ── Language (normalized ISO-style) ──
    let language = {
        let from_regex = language_regex()
            .captures(title)
            .and_then(|caps| {
                // Find the first non-None capture group
                (1..caps.len()).find_map(|i| caps.get(i))
            })
            .map(|m| normalize_language(m.as_str()));

        // If language regex found something, use it
        // Otherwise, infer from language_variant
        from_regex.unwrap_or_else(|| {
            match language_variant.as_deref() {
                Some("TRUEFRENCH" | "VFF" | "VFQ" | "VFI" | "VFB" | "VFR" | "VF" | "FRENCH") => "FR".to_string(),
                Some("VOSTFR") => "VOSTFR".to_string(),
                Some("MULTI") => "MULTI".to_string(),
                _ => "unknown".to_string(),
            }
        })
    };

    // ── If dubbed/MULTI and language is unknown → default to FR ──
    let is_dubbed = dubbed_regex().is_match(title);
    let language = if is_dubbed && language == "unknown" {
        "FR".to_string()
    } else {
        language
    };

    // ── Size (GB) ──
    let size_gb = size_gb_regex()
        .captures(title)
        .and_then(|caps| caps.get(1))
        .and_then(|m| m.as_str().parse::<f32>().ok())
        .unwrap_or_else(|| {
            // Fallback: try MB and convert
            size_mb_regex()
                .captures(title)
                .and_then(|caps| caps.get(1))
                .and_then(|m| m.as_str().parse::<f32>().ok())
                .map(|mb| mb / 1024.0)
                .unwrap_or(0.0)
        });

    // ── Seeders ──
    let seeders = seeders_regex()
        .captures(title)
        .and_then(|caps| caps.get(1).or(caps.get(2)))
        .and_then(|m| m.as_str().parse::<u32>().ok())
        .unwrap_or(0);

    ParsedStreamMeta {
        quality,
        size_gb,
        seeders,
        language,
        codec,
        language_variant,
    }
}

// ══════════════════════════════════════════════════════════
// Language-variant-aware scoring helper
// Used by stream.rs compute_score for finer FR language ranking
// ══════════════════════════════════════════════════════════

/// Returns a language score bonus based on the parsed variant.
/// TRUEFRENCH > VFF > VF/VFR/FRENCH > MULTI > VOSTFR > EN > unknown
pub fn language_score(language: &str, variant: Option<&str>) -> u32 {
    match variant {
        Some("TRUEFRENCH") => 600,
        Some("VFF") => 550,
        Some("VFQ" | "VFI" | "VFB" | "VFR" | "VF" | "FRENCH") => 500,
        Some("MULTI") => 300,
        Some("VOSTFR") => 100,
        _ => match language.to_uppercase().as_str() {
            "FR" => 500,
            "MULTI" => 300,
            "VOSTFR" => 100,
            "EN" => 50,
            _ => 0,
        },
    }
}
