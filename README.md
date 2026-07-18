# ipcraft-spec

YAML specifications for FPGA IP cores and memory maps.  
Used as a local package by [IPCraft for VS Code](https://github.com/bleviet/ipcraft-vscode).

## Directory Structure

```
ipcraft-spec/
├── schemas/         # JSON schemas (source of truth for *.ip.yml / *.mm.yml)
│   ├── ip_core.schema.json
│   └── memory_map.schema.json
├── bus_definitions/ # Shared bus type definitions
│   ├── axi4_lite.yml
│   ├── axi4_full.yml
│   ├── axi_stream.yml
│   ├── avalon_mm.yml
│   └── avalon_st.yml
├── templates/       # Starter templates
├── examples/        # Reference implementations
│   ├── minimal/                     # Bare minimum IP core
│   ├── basic_peripheral/            # AXI4-Lite slave + simple memory map
│   ├── data_inspector/               # Reusable Data Inspector recipes
│   ├── multi_interface_accelerator/ # AXI4-Lite + AXI-Stream + complex memory map
│   └── system_controller/           # Many clocks, resets, and bus interfaces
└── docs/
    ├── ip_spec.md          # Format reference for *.ip.yml files
    └── memory_map_spec.md  # Format reference for *.mm.yml files
```

Generated output (`rtl/`, `tb/`, `altera/`, `xilinx/`) is produced by the VS Code extension and is not tracked here.

## Quick Start

1. **New IP Core:** Copy `templates/axi_slave.ip.yml`
2. **New Memory Map:** Copy `templates/axi_slave.mm.yml`
3. **Setup VS Code Validation:** See below.

## Documentation

📘 **[IP Core Specification](docs/ip_spec.md)** — Format reference for `*.ip.yml` files.  
📘 **[Memory Map Specification](docs/memory_map_spec.md)** — Format reference for `*.mm.yml` files.

## Schemas

The JSON schemas in `schemas/` are the **single source of truth** for both the YAML format and the TypeScript types used by the extension.

### TypeScript Type Generation

The extension generates `src/webview/types/memoryMap.d.ts` and `src/webview/types/ipCore.d.ts` directly from these schemas. Re-run after any schema change:

```bash
npm run generate-types
```

> **Warning:** Never edit the generated `src/webview/types/*.d.ts` files by hand — they are overwritten by `generate-types`.

### VS Code YAML Validation Setup

Install the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
by Red Hat, then add the following to your `.vscode/settings.json`:

```jsonc
{
  "yaml.schemas": {
    "./schemas/ip_core.schema.json": "*.ip.yml",
    "./schemas/memory_map.schema.json": "*.mm.yml"
  }
}
```

This gives you:
- **Autocomplete** for field names
- **Inline validation**
- **Hover documentation**

> **Tip:** The IPCraft for VS Code extension provides visual editing on top of this — YAML validation is a useful complement when editing files directly.

## Templates

| Template | Description |
|----------|-------------|
| `minimal.ip.yml` | Bare minimum IP core |
| `basic.ip.yml` | Clock, reset, ports |
| `axi_slave.ip.yml` | AXI-Lite slave with registers |
| `avalon_peripheral.ip.yml` | Avalon-MM slave and Avalon-ST interfaces |
| `minimal.mm.yml` | Bare minimum memory map |
| `basic.mm.yml` | Simple memory map |
| `axi_slave.mm.yml` | AXI-Lite slave registers |
| `array.mm.yml` | Register arrays |
| `multi_block.mm.yml` | Multiple address blocks |

## File Naming

| Extension | Purpose |
|-----------|---------|
| `*.ip.yml` | IP Core definition |
| `*.mm.yml` | Memory map definition |
| `*.ipci.yml` | Data Inspector recipe |
