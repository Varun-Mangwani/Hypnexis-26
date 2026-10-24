import json
from pathlib import Path


def main() -> None:
    from ragdoctor.api.main import app
    schema = app.openapi()
    out_path = Path(__file__).parent.parent.parent.parent.parent / "contract" / "openapi.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(schema, indent=2))
    print(f"Exported OpenAPI schema to {out_path}")


if __name__ == "__main__":
    main()
