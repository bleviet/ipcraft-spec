# IPCraft Specifications

YAML specifications for FPGA IP cores and memory maps.

## Directory Structure

```
ipcraft-spec/
├── schemas/        # JSON schemas (auto-generated)
│   ├── ip_core.schema.json
│   └── memory_map.schema.json
├── templates/      # Starter templates
├── examples/       # Real-world examples
└── common/         # Shared definitions (bus types)
```

## Quick Start

1. **New IP Core:** Copy `templates/axi_slave.ip.yml`
2. **Setup VS Code Validation:** See below.

## Documentation

📘 **[IP YAML Specification](docs/IP_YAML_SPEC.md)** - Complete format reference

## Schemas

The JSON schemas in `schemas/` are the single source of truth for the YAML format.

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

## Templates

| Template | Description |
|----------|-------------|
| `minimal.ip.yml` | Bare minimum IP core |
| `basic.ip.yml` | Clock, reset, ports |
| `axi_slave.ip.yml` | AXI-Lite slave with registers |
| `basic.mm.yml` | Simple memory map |
| `array.mm.yml` | Register arrays |

## File Naming

- `*.ip.yml` - IP Core definitions
- `*.mm.yml` - Memory map definitions
- `*.fileset.yml` - File set definitions
