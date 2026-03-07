import ast
import glob
import json
import os


def safe_eval(node):
    if isinstance(node, ast.Constant):
        return node.value
    elif isinstance(node, ast.List):
        return [safe_eval(el) for el in node.elts]
    elif isinstance(node, ast.Tuple):
        return tuple(safe_eval(el) for el in node.elts)
    elif isinstance(node, ast.Dict):
        return {safe_eval(k): safe_eval(v) for k, v in zip(node.keys, node.values)}
    elif isinstance(node, ast.Set):
        return {safe_eval(el) for el in node.elts}
    elif isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -safe_eval(node.operand)
    elif isinstance(node, ast.Call):
        # Handle list(range(...)) pattern
        func_name = None
        if isinstance(node.func, ast.Name):
            func_name = node.func.id

        if func_name == "list" and len(node.args) == 1:
            inner = node.args[0]
            if (
                isinstance(inner, ast.Call)
                and isinstance(inner.func, ast.Name)
                and inner.func.id == "range"
            ):
                range_args = [safe_eval(arg) for arg in inner.args]
                return list(range(*range_args))
        elif func_name == "range":
            range_args = [safe_eval(arg) for arg in node.args]
            return list(range(*range_args))

        raise ValueError(f"Unsupported function call: {ast.dump(node)}")
    elif isinstance(node, ast.Name):
        raise ValueError(f"Unsupported name: {node.id}")
    else:
        raise ValueError(f"Unsupported node type: {type(node).__name__}")


def extract_parametrize_data(filename):
    with open(filename, "r") as f:
        try:
            tree = ast.parse(f.read(), filename=filename)
        except Exception as e:
            print(f"Failed to parse {filename}: {e}")
            return []

    collected_cases = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_name = node.name
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Call):
                    # Check if decorator is pytest.mark.parametrize
                    is_parametrize = False
                    if (
                        isinstance(decorator.func, ast.Attribute)
                        and decorator.func.attr == "parametrize"
                    ):
                        is_parametrize = True

                    if is_parametrize:
                        # args[0] is keys string, args[1] is values list
                        if len(decorator.args) >= 2:
                            keys_node = decorator.args[0]
                            values_node = decorator.args[1]

                            if isinstance(keys_node, ast.Constant):  # Python 3.8+
                                keys_str = keys_node.value
                            else:
                                continue

                            try:
                                values = safe_eval(values_node)
                            except Exception as e:
                                print(f"Failed to eval values in {filename}: {e}")
                                continue

                            keys = [k.strip() for k in keys_str.split(",")]
                            if len(keys) < 2:
                                continue

                            expected_key_name = keys[1]

                            # Map common field names to their expected output keys
                            field_mapping = {
                                "expected_output": None,  # Full dict
                                "expected_episode": "episodes",
                                "expected_episodes": "episodes",
                                "expected_season": "seasons",
                                "expected_seasons": "seasons",
                                "expected_title": "title",
                                "expected_year": "year",
                                "expected_quality": "quality",
                                "expected_resolution": "resolution",
                                "expected_codec": "codec",
                                "expected_audio": "audio",
                                "expected_languages": "languages",
                                "expected_group": "group",
                                "expected_edition": "edition",
                                "expected_hdr": "hdr",
                                "expected_network": "network",
                                "expected_site": "site",
                                "expected_size": "size",
                                "expected_bitrate": "bitrate",
                                "expected_channels": "channels",
                                "expected_container": "container",
                                "expected_extension": "extension",
                                "expected_adult": "adult",
                                "expected_anime": "anime",
                                "expected_collection": "collection",
                                "expected_complete": "complete",
                                "expected_date": "date",
                                "expected_dubbed": "dubbed",
                                "expected_subbed": "subbed",
                                "expected_episode_code": "episode_code",
                                "expected_extras": "extras",
                                "expected_hardcoded": "hardcoded",
                                "expected_proper": "proper",
                                "expected_region": "region",
                                "expected_repack": "repack",
                                "expected_retail": "retail",
                                "expected_scene": "scene",
                                "expected_sports": "sports",
                                "expected_trash": "trash",
                                "expected_unrated": "unrated",
                                "expected_volume": "volume",
                                "expected_volumes": "volumes",
                                "expected_bit_depth": "bit_depth",
                                "expected_documentary": "documentary",
                                "expected_transliteration": "title",
                            }

                            for item in values:
                                if isinstance(item, tuple) and len(item) >= 2:
                                    title = item[0]
                                    expected_val = item[1]

                                    expected_dict = {}

                                    if expected_key_name in ("expected_output", "expected"):
                                        # Full dict expected
                                        if isinstance(expected_val, dict):
                                            expected_dict = expected_val
                                    elif expected_key_name in field_mapping:
                                        # Known field with expected_ prefix
                                        field = field_mapping[expected_key_name]
                                        expected_dict = {field: expected_val}
                                    elif expected_key_name.startswith("expected_"):
                                        # Generic expected_ field
                                        field = expected_key_name.replace(
                                            "expected_", ""
                                        )
                                        expected_dict = {field: expected_val}
                                    else:
                                        # Direct field name without expected_ prefix
                                        # Skip common non-output fields
                                        if expected_key_name in (
                                            "parser",
                                            "options",
                                            "config",
                                        ):
                                            continue
                                        expected_dict = {
                                            expected_key_name: expected_val
                                        }

                                    if not expected_dict:
                                        continue

                                    options = {}
                                    if func_name == "test_translate_languages":
                                        options["translate_languages"] = True

                                    collected_cases.append(
                                        {
                                            "source": os.path.basename(filename),
                                            "title": title,
                                            "expected": expected_dict,
                                            "options": options,
                                        }
                                    )
    return collected_cases


def convert_all():
    src_dir = "PTT/tests"
    all_cases = []

    for file_path in glob.glob(os.path.join(src_dir, "*.py")):
        all_cases.extend(extract_parametrize_data(file_path))

    out_path = "tests/fixtures/all_tests.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    with open(out_path, "w") as f:
        json.dump(all_cases, f, indent=2)
    print(f"Converted {len(all_cases)} test cases.")


if __name__ == "__main__":
    convert_all()
