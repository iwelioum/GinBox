use ptt_rs::parse_title;
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <title>", args[0]);
        process::exit(1);
    }

    let title = &args[1];

    let meta = parse_title(title);

    if let Ok(json) = serde_json::to_string_pretty(&meta) {
        println!("{}", json);
    } else {
        println!("{:#?}", meta);
    }
}
