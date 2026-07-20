# IPCraft Specification

This repository contains the shared file formats used by
[IPCraft for VS Code](https://github.com/bleviet/ipcraft-vscode). Use it when
you want to create or validate an IP core, memory map, or Data Inspector recipe
without relying on the visual editor.

## Choose a file type

| File | Purpose | Schema |
|---|---|---|
| `*.ip.yml` | Describe an FPGA IP core and its interfaces | `schemas/ip_core.schema.json` |
| `*.mm.yml` | Describe address blocks, registers, and fields | `schemas/memory_map.schema.json` |
| `*.ipci.yml` | Save a reusable Data Inspector layout | `schemas/data_inspector.schema.json` |

The JSON schemas are the source of truth. The documents explain the common
fields and show readable examples.

## Start from a template

1. Copy a file from `templates/`.
2. Rename it with the matching extension.
3. Edit the YAML directly or open it with IPCraft for VS Code.
4. Keep related `.ip.yml` and `.mm.yml` files in the same project directory.

| Template | Start here when you need |
|---|---|
| `minimal.ip.yml` | Only a valid IP core identity |
| `basic.ip.yml` | A clock, reset, and plain ports |
| `axi_slave.ip.yml` | An AXI4-Lite slave with registers |
| `avalon_peripheral.ip.yml` | Avalon-MM and Avalon-ST interfaces |
| `minimal.mm.yml` | An empty memory map |
| `basic.mm.yml` | A small register block |
| `axi_slave.mm.yml` | AXI4-Lite control and status registers |
| `array.mm.yml` | Repeated registers |
| `multi_block.mm.yml` | Several address blocks |

## Read the format references

- [Define an IP core](docs/ip_spec.md)
- [Define a memory map](docs/memory_map_spec.md)
- [Define a Data Inspector recipe](docs/data_inspector_spec.md)

## Enable YAML validation in VS Code

Install the
[YAML extension by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml),
then add this configuration to `.vscode/settings.json`:

```jsonc
{
  "yaml.schemas": {
    "./schemas/ip_core.schema.json": "*.ip.yml",
    "./schemas/memory_map.schema.json": "*.mm.yml",
    "./schemas/data_inspector.schema.json": "*.ipci.yml"
  }
}
```

This adds completion, inline validation, and field descriptions when editing
YAML. IPCraft for VS Code adds visual editors on top of the same schemas.

## Explore complete examples

| Directory | What it demonstrates |
|---|---|
| `examples/minimal/` | The smallest valid IP core |
| `examples/basic_peripheral/` | An AXI4-Lite peripheral and memory map |
| `examples/comprehensive_axi/` | AXI interfaces and broad schema coverage |
| `examples/comprehensive_avalon/` | Avalon interfaces and register generation |
| `examples/data_inspector/` | Reusable decode and transform recipes |
| `examples/daq_controller/` | A data-acquisition controller |
| `examples/multi_interface_accelerator/` | Several interfaces and clock domains |
| `examples/system_controller/` | A larger system-level IP core |
| `examples/xcvr_loopback/` | A project-local custom bus definition |

Generated output such as `rtl/`, `tb/`, `altera/`, and `xilinx/` is not stored
in this repository.

## Understand the repository layout

| Directory | Contents |
|---|---|
| `schemas/` | JSON schemas for the three IPCraft file types |
| `bus_definitions/` | Built-in AXI and Avalon interface definitions |
| `templates/` | Small files to copy into a new project |
| `examples/` | Complete files that exercise common and advanced features |
| `docs/` | Human-readable format references |

## Regenerate extension types after a schema change

When this repository is used as the `ipcraft-spec` submodule of IPCraft for VS
Code, run this command from the extension repository root:

```bash
npm run generate-types
```

It regenerates the domain types for IP cores, memory maps, and Data Inspector
recipes. Do not edit generated type files by hand.
