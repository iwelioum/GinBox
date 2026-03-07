use ptt_rs::parse_title;
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashMap;

static LANGUAGES_TRANSLATION_TABLE: once_cell::sync::Lazy<HashMap<&'static str, &'static str>> =
    once_cell::sync::Lazy::new(|| {
        let mut m = HashMap::new();
        m.insert("en", "English");
        m.insert("ja", "Japanese");
        m.insert("zh", "Chinese");
        m.insert("ru", "Russian");
        m.insert("ar", "Arabic");
        m.insert("pt", "Portuguese");
        m.insert("es", "Spanish");
        m.insert("fr", "French");
        m.insert("de", "German");
        m.insert("it", "Italian");
        m.insert("ko", "Korean");
        m.insert("hi", "Hindi");
        m.insert("bn", "Bengali");
        m.insert("pa", "Punjabi");
        m.insert("mr", "Marathi");
        m.insert("gu", "Gujarati");
        m.insert("ta", "Tamil");
        m.insert("te", "Telugu");
        m.insert("kn", "Kannada");
        m.insert("ml", "Malayalam");
        m.insert("th", "Thai");
        m.insert("vi", "Vietnamese");
        m.insert("id", "Indonesian");
        m.insert("tr", "Turkish");
        m.insert("he", "Hebrew");
        m.insert("fa", "Persian");
        m.insert("uk", "Ukrainian");
        m.insert("el", "Greek");
        m.insert("lt", "Lithuanian");
        m.insert("lv", "Latvian");
        m.insert("et", "Estonian");
        m.insert("pl", "Polish");
        m.insert("cs", "Czech");
        m.insert("sk", "Slovak");
        m.insert("hu", "Hungarian");
        m.insert("ro", "Romanian");
        m.insert("bg", "Bulgarian");
        m.insert("sr", "Serbian");
        m.insert("hr", "Croatian");
        m.insert("sl", "Slovenian");
        m.insert("nl", "Dutch");
        m.insert("da", "Danish");
        m.insert("fi", "Finnish");
        m.insert("sv", "Swedish");
        m.insert("no", "Norwegian");
        m.insert("ms", "Malay");
        m.insert("la", "Latin");
        m
    });

#[derive(Debug, Deserialize)]
struct TestCase {
    source: String,
    title: String,
    expected: Value,
    #[serde(default)]
    options: HashMap<String, Value>,
}

#[test]
fn test_all_cases() {
    let data = include_str!("fixtures/all_tests.json");
    let cases: Vec<TestCase> = serde_json::from_str(data).unwrap();

    let mut passed = 0;
    let mut failed = 0;
    let mut failures = Vec::new();

    for test_case in cases {
        let mut metadata = parse_title(&test_case.title);

        if let Some(Value::Bool(true)) = test_case.options.get("translate_languages") {
            let mut translated_langs = Vec::new();
            for lang_code in &metadata.languages {
                let code = lang_code.as_str();
                let name = LANGUAGES_TRANSLATION_TABLE
                    .get(code)
                    .copied()
                    .unwrap_or(code);
                translated_langs.push(name.to_string());
            }
            metadata.languages = translated_langs;
        }

        let expected = test_case.expected.clone();
        let mut reasons = Vec::new();
        let result_json = serde_json::to_value(&metadata).unwrap();

        let mut case_failed = false;

        if let Some(obj) = expected.as_object() {
            for (key, exp_val) in obj {
                let mut res_val = result_json.get(key).unwrap_or(&Value::Null);

                if key == "network" && res_val.is_null() {
                    res_val = result_json.get("networks").unwrap_or(&Value::Null);
                }
                if key == "genre" && res_val.is_null() {
                    res_val = result_json.get("genres").unwrap_or(&Value::Null);
                }

                if !compare_values(res_val, exp_val) {
                    case_failed = true;
                    reasons.push(format!(
                        "Key '{}': expected {:?}, got {:?}",
                        key, exp_val, res_val
                    ));
                }
            }
        }

        if case_failed {
            failed += 1;
            failures.push(format!(
                "File: {}\nTitle: {}\nFailures:\n{}",
                test_case.source,
                test_case.title,
                reasons.join("\n")
            ));
        } else {
            passed += 1;
        }
    }

    println!("Passed: {}, Failed: {}", passed, failed);

    if failed > 0 {
        for f in failures.iter() {
            println!("---------------------------------------------------");
            println!("{}", f);
        }
        panic!("{} tests failed out of {}", failed, passed + failed);
    }
}

fn compare_values(res: &Value, exp: &Value) -> bool {
    if res == exp {
        return true;
    }

    if (res.is_null() && exp.as_bool() == Some(false))
        || (exp.is_null() && res.as_bool() == Some(false))
    {
        return true;
    }
    if (res.is_null() && exp.as_array().is_some_and(|a| a.is_empty()))
        || (exp.is_null() && res.as_array().is_some_and(|a| a.is_empty()))
    {
        return true;
    }

    if let Some(res_arr) = res.as_array() {
        if let Some(exp_arr) = exp.as_array() {
            if res_arr.len() != exp_arr.len() {
                return false;
            }

            let mut r_s: Vec<String> = res_arr.iter().map(|v| v.to_string()).collect();
            let mut e_s: Vec<String> = exp_arr.iter().map(|v| v.to_string()).collect();
            r_s.sort();
            e_s.sort();

            if r_s == e_s {
                return true;
            }
        } else if res_arr.len() == 1 && &res_arr[0] == exp {
            return true;
        }
    }

    if let (Some(rn), Some(en)) = (res.as_number(), exp.as_number())
        && let (Some(rf), Some(ef)) = (rn.as_f64(), en.as_f64())
        && (rf - ef).abs() < 1e-9
    {
        return true;
    }

    false
}
