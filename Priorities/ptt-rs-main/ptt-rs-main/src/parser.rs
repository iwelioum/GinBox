use crate::models::TorrentMetadata;
use fancy_regex::Regex as FancyRegex;
use once_cell::sync::Lazy;
use regex::Regex as StdRegex;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct MatchInfo {
    pub raw_match: String,
    pub match_index: usize,
    pub remove: bool,
    pub skip_from_title: bool,
}

pub struct ParseContext {
    pub title: String,
    pub result: TorrentMetadata,
    pub matched: HashMap<String, MatchInfo>,
}

pub type HandlerFn = Box<dyn Fn(&mut ParseContext) -> Option<MatchInfo> + Send + Sync>;

#[derive(Default)]
pub struct Parser {
    handlers: Vec<(String, HandlerFn)>,
}

impl Parser {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_handler_fn(&mut self, name: &str, handler: HandlerFn) {
        self.handlers.push((name.to_string(), handler));
    }

    pub fn add_handler<T, F, S>(
        &mut self,
        name: &str,
        regex: FancyRegex,
        transformer: F,
        setter: S,
        options: HandlerOptions,
    ) where
        T: Clone + Send + Sync + 'static,
        F: Fn(&str) -> T + Send + Sync + 'static,
        S: Fn(&mut TorrentMetadata, T) + Send + Sync + 'static,
    {
        let name_owned = name.to_string();
        let name_clone = name.to_string();

        let handler = Box::new(move |context: &mut ParseContext| -> Option<MatchInfo> {
            if options.skip_if_already_found && context.matched.contains_key(&name_owned) {
                return None;
            }

            let match_result = regex.find(&context.title).ok().flatten();

            if let Some(m) = match_result {
                let raw_match = m.as_str().to_string();
                let match_index = m.start();

                let clean_match = if regex.captures_len() > 1 {
                    regex
                        .captures(&context.title)
                        .ok()
                        .flatten()
                        .and_then(|c| c.get(1).map(|g| g.as_str().to_string()))
                        .unwrap_or_else(|| raw_match.clone())
                } else {
                    raw_match.clone()
                };

                let before_match_opt = BEFORE_TITLE_MATCH_REGEX.find(&context.title);
                let before_title_matched = if let Some(bm) = before_match_opt {
                    let bm_str = bm.as_str();
                    if bm_str.len() > 2 && bm_str.starts_with('[') && bm_str.ends_with(']') {
                        let content = &bm_str[1..bm_str.len() - 1];
                        content.contains(&raw_match)
                    } else {
                        false
                    }
                } else {
                    false
                };

                let current_skip_from_title = before_title_matched || options.skip_from_title;

                let transformed_value = transformer(&clean_match);

                if options.skip_if_first {
                    let other_matches_exist = !context.matched.is_empty();
                    if other_matches_exist {
                        let current_start = match_index;
                        let is_before_all = context
                            .matched
                            .values()
                            .all(|m| current_start < m.match_index);
                        if is_before_all {
                            return None;
                        }
                    }
                }

                setter(&mut context.result, transformed_value);

                let info = MatchInfo {
                    raw_match,
                    match_index,
                    remove: options.remove,
                    skip_from_title: current_skip_from_title,
                };
                context.matched.insert(name_owned.clone(), info.clone());

                return Some(info);
            }
            None
        });

        self.handlers.push((name_clone, handler));
    }

    pub fn parse(&self, raw_title: &str, _translate_languages: bool) -> TorrentMetadata {
        let cleaned_title = raw_title.to_string();
        let mut context = ParseContext {
            title: cleaned_title,
            result: TorrentMetadata::default(),
            matched: HashMap::new(),
        };

        static SUB_PATTERN: Lazy<StdRegex> = Lazy::new(|| StdRegex::new(r"_+").unwrap());
        context.title = SUB_PATTERN.replace_all(raw_title, " ").to_string();

        let mut end_of_title = context.title.len();

        for (_name, handler) in &self.handlers {
            if let Some(match_info) = handler(&mut context) {
                let match_index = match_info.match_index;
                let raw_len = match_info.raw_match.len();

                if match_info.remove && match_index + raw_len <= context.title.len() {
                    context
                        .title
                        .replace_range(match_index..match_index + raw_len, "");
                }

                if !match_info.skip_from_title && match_index > 1 && match_index < end_of_title {
                    end_of_title = match_index;
                }
                if match_info.remove
                    && match_info.skip_from_title
                    && match_index < end_of_title
                    && end_of_title >= raw_len
                {
                    end_of_title -= raw_len;
                }
            }
        }

        let mut result = context.result;

        result.seasons.sort();
        result.seasons.dedup();
        result.episodes.sort();
        result.episodes.dedup();
        result.languages.dedup();

        let final_title = if end_of_title <= context.title.len() {
            context.title[..end_of_title].to_string()
        } else {
            context.title
        };

        result.title = clean_title(&final_title);

        result
    }
}

pub struct HandlerOptions {
    pub skip_if_already_found: bool,
    pub skip_from_title: bool,
    pub skip_if_first: bool,
    pub remove: bool,
}

impl Default for HandlerOptions {
    fn default() -> Self {
        Self {
            skip_if_already_found: true,
            skip_from_title: false,
            skip_if_first: false,
            remove: false,
        }
    }
}

static BRACKETS: &[(&str, &str)] = &[("{", "}"), ("[", "]"), ("(", ")")];

const NON_ENGLISH_RANGES: &str = "\u{3040}-\u{30ff}\u{3400}-\u{4dbf}\u{4e00}-\u{9fff}\u{f900}-\u{faff}\u{ff66}-\u{ff9f}\u{0400}-\u{04ff}\u{0600}-\u{06ff}\u{0750}-\u{077f}\u{0c80}-\u{0cff}\u{0d00}-\u{0d7f}\u{0e00}-\u{0e7f}";

static MOVIE_REGEX: Lazy<StdRegex> = Lazy::new(|| StdRegex::new(r"(?i)[\[(]movie[)\]]").unwrap());
static RUSSIAN_CAST_REGEX_FANCY: Lazy<FancyRegex> =
    Lazy::new(|| FancyRegex::new(r"(?i)\([^)]*[\u0400-\u04ff][^)]*\)$|(?<=\/.*)\(.*\)$").unwrap());

static ALT_TITLES_REGEX: Lazy<StdRegex> = Lazy::new(|| {
    StdRegex::new(&format!(
        r"(?i)[^/|(]*[{}][^/|]*[/|]|[/|][^/|(]*[{}][^/|]*",
        NON_ENGLISH_RANGES, NON_ENGLISH_RANGES
    ))
    .unwrap()
});

static BEFORE_TITLE_MATCH_REGEX: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"^(?:\[([^\]]+)\])").unwrap());

static NOT_ONLY_NON_ENGLISH_REGEX: Lazy<FancyRegex> = Lazy::new(|| {
    FancyRegex::new(&format!(
        r"(?i)([a-zA-Z][^{0}]+)([{0}].*[{0}])|[{0}].*[{0}](?=[^{0}]+[a-zA-Z])",
        NON_ENGLISH_RANGES
    ))
    .unwrap()
});

static NOT_ALLOWED_SYMBOLS_AT_START_AND_END: Lazy<StdRegex> = Lazy::new(|| {
    StdRegex::new(&format!(
        r"(?i)^[^\w{}#\x5B【★]+|[ \-:/\x5C\x5B|{{(#$&^]+$",
        NON_ENGLISH_RANGES
    ))
    .unwrap()
});

static REMAINING_NOT_ALLOWED_SYMBOLS_AT_START_AND_END: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(&format!(r"^[^\w{}#]+|]$", NON_ENGLISH_RANGES)).unwrap());

static REDUNDANT_SYMBOLS_AT_END: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"[ \-:./\\]+$").unwrap());
static EMPTY_BRACKETS_REGEX: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"\(\s*\)|\[\s*\]|\{\s*\}").unwrap());
static PARANTHESES_WITHOUT_CONTENT: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"\(\W*\)|\[\W*\]|\{\W*\}").unwrap());
static STAR_REGEX_1: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"^[\[【★].*[\]】★][ .]?(.+)").unwrap());
static STAR_REGEX_2: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"(.+)[ .]?[\[【★].*[\]】★]$").unwrap());
static MP3_REGEX: Lazy<StdRegex> = Lazy::new(|| StdRegex::new(r"(?i)\bmp3$").unwrap());
static SPACING_REGEX: Lazy<StdRegex> = Lazy::new(|| StdRegex::new(r"\s+").unwrap());
static SPECIAL_CHAR_SPACING: Lazy<StdRegex> =
    Lazy::new(|| StdRegex::new(r"[\-\+\_\{\}\[\]]\W{2,}").unwrap());

pub fn clean_title(raw_title: &str) -> String {
    let mut title = raw_title.replace('_', " ");

    title = MOVIE_REGEX.replace_all(&title, "").to_string();
    title = NOT_ALLOWED_SYMBOLS_AT_START_AND_END
        .replace_all(&title, "")
        .to_string();
    title = RUSSIAN_CAST_REGEX_FANCY.replace_all(&title, "").to_string();
    title = STAR_REGEX_1.replace_all(&title, "$1").to_string();
    title = STAR_REGEX_2.replace_all(&title, "$1").to_string();
    title = ALT_TITLES_REGEX.replace_all(&title, "").to_string();
    title = NOT_ONLY_NON_ENGLISH_REGEX
        .replace_all(&title, "$1")
        .to_string();
    title = REMAINING_NOT_ALLOWED_SYMBOLS_AT_START_AND_END
        .replace_all(&title, "")
        .to_string();
    title = EMPTY_BRACKETS_REGEX.replace_all(&title, "").to_string();
    title = MP3_REGEX.replace_all(&title, "").to_string();
    title = PARANTHESES_WITHOUT_CONTENT
        .replace_all(&title, "")
        .to_string();
    title = SPECIAL_CHAR_SPACING.replace_all(&title, "").to_string();

    for (open, close) in BRACKETS {
        let open_count = title.matches(open).count();
        let close_count = title.matches(close).count();
        if open_count != close_count {
            title = title.replace(open, "").replace(close, "");
        }
    }

    if !title.trim().contains(' ') && title.contains('.') {
        static DOT_REGEX: Lazy<StdRegex> = Lazy::new(|| StdRegex::new(r"\.").unwrap());
        title = DOT_REGEX.replace_all(&title, " ").to_string();
    }

    title = REDUNDANT_SYMBOLS_AT_END.replace_all(&title, "").to_string();
    title = SPACING_REGEX.replace_all(&title, " ").trim().to_string();

    title
}
