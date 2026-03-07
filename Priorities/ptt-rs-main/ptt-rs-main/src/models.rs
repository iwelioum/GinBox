use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct TorrentMetadata {
    pub title: String,
    pub seasons: Vec<i32>,
    pub episodes: Vec<i32>,
    pub languages: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quality: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub codec: Option<String>,
    pub audio: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub region: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub container: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<String>,
    pub networks: Vec<String>,

    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub extended: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub hardcoded: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub proper: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub repack: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub retail: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub remastered: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub unrated: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub uncensored: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub documentary: bool,
    #[serde(default)]
    pub episode_code: Option<String>,
    #[serde(default)]
    pub date: Option<String>,

    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub adult: bool,
    #[serde(default)]
    pub site: Option<String>,
    #[serde(default)]
    pub bit_depth: Option<String>,
    #[serde(default)]
    pub hdr: Vec<String>,
    #[serde(default)]
    pub channels: Vec<String>,
    #[serde(default)]
    pub volumes: Vec<i32>,
    #[serde(default)]
    pub edition: Option<String>,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub trash: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub upscaled: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub convert: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub commentary: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub subbed: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub dubbed: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub is_3d: bool,

    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub complete: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub ppv: bool,
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub scene: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub country: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bitrate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extension: Option<String>,
}
