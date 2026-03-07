pub mod handlers;
pub mod models;
pub mod parser;
pub mod transformers;

pub use models::TorrentMetadata;
pub use parser::Parser;

use once_cell::sync::Lazy;

static PARSER: Lazy<Parser> = Lazy::new(|| {
    let mut parser = Parser::new();
    handlers::add_defaults(&mut parser);
    parser
});

pub fn parse_title(title: &str) -> TorrentMetadata {
    PARSER.parse(title, false)
}
