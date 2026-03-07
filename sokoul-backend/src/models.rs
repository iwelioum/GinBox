use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ContentType {
    Movie,
    Series,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BehaviorHints {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub not_web_ready: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub binge_group: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ParsedStreamMeta {
    #[serde(default)]
    pub quality: String,
    #[serde(default)]
    pub size_gb: f32,
    #[serde(default)]
    pub seeders: u32,
    #[serde(default)]
    pub language: String,
    #[serde(default)]
    pub codec: String,
    /// Raw French variant tag: TRUEFRENCH, VFF, VF, VOSTFR, MULTi, FRENCH
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub language_variant: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Stream {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub info_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_idx: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default)]
    pub parsed_meta: ParsedStreamMeta,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub behavior_hints: Option<BehaviorHints>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Source {
    pub title: String,
    pub quality: String,
    pub size_gb: f32,
    pub seeders: u32,
    pub language: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub language_variant: Option<String>,
    pub info_hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub magnet: Option<String>,
    pub source: String,
    pub cached_rd: bool,
    pub playable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rd_link: Option<String>,
    pub score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Video {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub season: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub episode: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub released: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overview: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "still_path")]
    pub still_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Meta {
    pub id: String,
    #[serde(rename = "type")]
    pub content_type: ContentType,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub poster: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub genres: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub videos: Option<Vec<Video>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogItem {
    pub id: String,
    #[serde(rename = "type")]
    pub content_type: ContentType,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub poster: Option<String>,
    // Raw TMDB path (e.g. /abc123.jpg) — the frontend builds the quality URL /original/
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "backdrop_path")]
    pub backdrop_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub release_info: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub genres: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub imdb_rating: Option<f32>,
    // ── Filtering fields (enriched from TMDB list responses) ──
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "vote_average")]
    pub vote_average: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "original_language")]
    pub original_language: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    #[serde(rename = "origin_country")]
    pub origin_country: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "vote_count")]
    pub vote_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "popularity")]
    pub popularity: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Catalog {
    pub metas: Vec<CatalogItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_more: Option<bool>,
}

// ── Unified images (endpoint /images) ───────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedImages {
    pub scenes:  Vec<String>,  // backdrops 16:9
    pub posters: Vec<String>,  // posters 2:3
    pub logos:   Vec<String>,  // transparent logos
    pub banners: Vec<String>,  // banners + horizontal clearart
    pub seasons: Vec<String>,  // season posters (TV)
}

// ── Credits (cast) ────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CastMember {
    pub id: u32,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub character: Option<String>,
    /// Full URL Fanart.tv or TMDB p/w185
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile_path: Option<String>,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Credits {
    pub cast: Vec<CastMember>,
}

impl std::fmt::Display for ContentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ContentType::Movie => write!(f, "movie"),
            ContentType::Series => write!(f, "series"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: i64,
    pub name: String,
    pub avatar_url: Option<String>,
    pub is_kids: bool,
    #[serde(skip_serializing)]
    #[allow(dead_code)]
    pub trakt_access_token: Option<String>,
    #[serde(skip_serializing)]
    #[allow(dead_code)]
    pub trakt_refresh_token: Option<String>,
    pub trakt_expires_at: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackEntry {
    pub id: i64,
    pub profile_id: i64,
    pub content_id: String,
    pub content_type: String,
    pub season: Option<u32>,
    pub episode: Option<u32>,
    pub position_ms: i64,
    pub duration_ms: i64,
    pub progress_pct: f32,
    pub watched: bool,
    pub updated_at: i64,
    pub episode_title: Option<String>,
    pub still_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktTokens {
    #[serde(skip_serializing)]
    #[allow(dead_code)]
    pub access_token: String,
    #[serde(skip_serializing)]
    #[allow(dead_code)]
    pub refresh_token: String,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktMovie {
    pub ids: TraktIds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktShow {
    pub ids: TraktIds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktEpisode {
    pub ids: TraktIds,
    pub season: u32,
    pub number: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktIds {
    pub trakt: u32,
    pub slug: Option<String>,
    pub imdb: Option<String>,
    pub tmdb: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktScrobblePayload {
    pub movie: Option<TraktMovie>,
    pub show: Option<TraktShow>,
    pub episode: Option<TraktEpisode>,
    pub progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceAuthResponse {
    pub device_code: String,
    pub user_code: String,
    pub verification_url: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub refresh_token: String,
    pub scope: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct UserList {
    pub id: i64,
    pub profile_id: i64,
    pub name: String,
    pub list_type: String,
    pub is_default: bool,
    pub trakt_list_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ListItem {
    pub id: i64,
    pub list_id: i64,
    pub content_id: String,
    pub content_type: String,
    pub title: String,
    pub poster_url: Option<String>,
    pub added_at: i64,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProwlarrRelease {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub info_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub download_url: Option<String>,
    pub indexer: String,
    pub size: u64,
    pub seeders: u32,
    pub publish_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddMagnetResponse { pub id: String }

// ── Progression utilisateur ───────────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct UserProgress {
    pub id:         i64,
    pub profile_id: i64,
    pub content_id: String,
    pub status:     String, // 'plan_to_watch'|'in_progress'|'completed'|'on_hold'|'dropped'|'to_resume'
    pub progress:   f32,    // 0.0–100.0
    pub rating:     Option<f32>,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetProgressRequest {
    pub profile_id: i64,
    pub content_id: String,
    pub status:     String,
    pub progress:   Option<f32>,
    pub rating:     Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TorrentInfo {
    pub id: String,
    pub status: String,
    pub links: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub progress: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnrestrictedLink {
    pub download: String,
    pub filename: String,
    pub filesize: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
}

// ── Trakt reviews ────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraktRatingResponse {
    pub rating: f32,
    pub votes: u32,
    pub distribution: std::collections::HashMap<String, u32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TraktCommentUser {
    pub username: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TraktCommentRaw {
    pub id: u64,
    pub comment: String,
    pub spoiler: bool,
    pub likes: u32,
    pub created_at: String,
    pub user: TraktCommentUser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraktComment {
    pub id: u64,
    pub comment: String,
    pub spoiler: bool,
    pub likes: u32,
    pub created_at: String,
    pub author: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraktReviewsResponse {
    pub rating: f32,
    pub votes: u32,
    pub pct_liked: u32,
    pub comments: Vec<TraktComment>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct InstantAvailability {
    #[serde(flatten)]
    pub hashes: std::collections::HashMap<String, serde_json::Value>,
}

impl InstantAvailability {
    pub fn is_cached(&self) -> bool {
        self.hashes.values().any(|val| {
            if let Some(obj) = val.as_object() {
                if let Some(rd) = obj.get("rd") {
                    return rd.as_array().is_some_and(|arr| !arr.is_empty());
                }
            }
            false
        })
    }
}
