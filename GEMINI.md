# GEMINI.md

## Project Overview
**IPCraft Specifications** (`ipcraft-spec`) provides the foundational YAML specifications and JSON schemas for defining FPGA Intellectual Property (IP) cores and memory maps. This project serves as the "single source of truth" for the IPCraft ecosystem, enabling consistent hardware descriptions that can be parsed, validated, and used for code generation (e.g., VHDL/Verilog) or documentation.

- **Primary Technologies:** YAML, JSON Schema.
- **Package Support:** Node.js (npm) and Python (pip/hatch).
- **Core Formats:**
    - `*.ip.yml`: IP Core definitions (VLNV, ports, clocks, bus interfaces).
    - `*.mm.yml`: Memory map and register definitions.
    - `*.fileset.yml`: File set definitions for RTL and simulation sources.

## Directory Structure
- `schemas/`: JSON schemas (`ip_core.schema.json`, `memory_map.schema.json`) used for IDE validation and automated tools.
- `bus_definitions/`: Shared definitions, with each bus interface in its own file (e.g., `axi4_lite.yml`).
- `templates/`: Starter templates for various IP and memory map configurations.
- `examples/`: Reference implementations covering various feature sets:
    - `minimal`: Bare minimum IP core.
    - `basic_peripheral`: Single bus interface (AXI4-Lite), single clock, simple memory map.
    - `multi_interface_accelerator`: Multiple interfaces (AXI-Lite + AXI-Stream), asynchronous clocks, and complex memory map (register arrays, local memory).
    - `system_controller`: Complex IP with many clocks, resets, and diverse bus interfaces.
- `docs/`: Technical documentation (`ip_spec.md` and `memory_map_spec.md`).

## Tooling & Integration
### VS Code Validation
To enable autocomplete and real-time validation, use the [Red Hat YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) with the following `settings.json` configuration:
```json
{
  "yaml.schemas": {
    "./schemas/ip_core.schema.json": "*.ip.yml",
    "./schemas/memory_map.schema.json": "*.mm.yml"
  }
}
```

### CLI Tooling
While this repository primarily contains specifications, it is intended to be used with an `ipcore` CLI tool (likely provided by a separate package) for:
- Generating HDL (VHDL/Verilog) from YAML.
- Parsing existing HDL to create YAML definitions.
- Validating YAML files against the schemas.

## Development Conventions
- **Naming:** Use `snake_case` for names and physical port names.
- **Versioning:** Use Semantic Versioning (SemVer) for IP versions.
- **Modularity:** Prefer importing memory maps (`memoryMaps.import`) rather than inlining them to keep files manageable.
- **Bus Standards:** Use types defined in the `bus_definitions/` directory using the `vendor.library.name.version` format (e.g., `ipcraft.busif.axi4_lite.1.0`).

## Key Files
- `docs/ip_spec.md`: Format reference for IP core definitions.
- `docs/memory_map_spec.md`: Format reference for memory map definitions.
- `bus_definitions/`: Directory containing standard bus interface definitions.
- `schemas/ip_core.schema.json`: The technical definition of the IP core YAML format.
