# ipcraft-spec

YAML specifications for FPGA IP cores and memory maps.

## Directory Structure

```
ipcraft-spec/
├── schemas/        # JSON schemas
│   ├── ip_core.schema.json
│   └── memory_map.schema.json
├── templates/      # Starter templates
├── examples/       # Reference implementations
│   ├── minimal/    # Bare minimum IP core
│   ├── basic_peripheral/ # AXI4L + Simple Memory Map
│   ├── multi_interface_accelerator/ # AXI4L + AXIS + Complex Memory Map
│   └── system_controller/ # Many clocks/resets/interfaces
└── bus_definitions/ # Shared definitions (bus types)
```

## Quick Start

1. **New IP Core:** Copy `templates/axi_slave.ip.yml`
2. **Setup VS Code Validation:** See below.

## Documentation

📘 **[IP Core Specification](docs/ip_spec.md)** - Format for `*.ip.yml` files.
📘 **[Memory Map Specification](docs/memory_map_spec.md)** - Format for `*.mm.yml` files.

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
| `avalon_peripheral.ip.yml` | Avalon-MM slave and Avalon-ST interfaces |
| `minimal.mm.yml` | Bare minimum memory map |
| `basic.mm.yml` | Simple memory map |
| `axi_slave.mm.yml` | AXI-Lite slave registers |
| `array.mm.yml` | Register arrays |
| `multi_block.mm.yml` | Multiple address blocks |

## File Naming

- `*.ip.yml` - IP Core definitions
- `*.mm.yml` - Memory map definitions
- `*.fileset.yml` - File set definitions

