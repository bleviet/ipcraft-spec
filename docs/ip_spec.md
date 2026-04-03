<!-- editorconfig-checker-disable-file -->
<!-- This file contains YAML examples with 2-space indentation per YAML standard -->

# IP Core Specification

This document defines the YAML format for IPCraft IP core definitions (`*.ip.yml`).

## File Conventions

| Extension | Purpose | Detection |
|-----------|---------|-----------|
| `*.ip.yml` | IP Core definition | Contains `apiVersion` + `vlnv` |

---

## IP Core Structure

### Minimal Example

```yaml
vlnv:
  vendor: ipcraft.io
  library: examples
  name: minimal_ip
  version: 1.0.0
```

### Complete Example

```yaml
vlnv:
  vendor: my-company.com
  library: processing
  name: my_timer_core
  version: 1.2.0


description: A 4-channel timer IP with AXI-Lite interface

clocks:
  - name: i_clk_sys           # Physical HDL port name
    logicalName: CLK          # Logical name for associations
    direction: in
    frequency: 100MHz

resets:
  - name: i_rst_n_sys
    logicalName: RESET_N
    direction: in
    polarity: activeLow       # or activeHigh

ports:
  - name: o_irq
    direction: out
    width: 1
    description: Interrupt request output

busInterfaces:
  - name: S_AXI_LITE
    type: ipcraft.busif.axi4_lite.1.0
    mode: slave
    physicalPrefix: s_axi_
    associatedClock: i_clk_sys
    associatedReset: i_rst_n_sys
    memoryMapRef: CSR_MAP
    useOptionalPorts:
      - AWPROT
      - ARPROT
    portWidthOverrides:
      AWADDR: 12
      ARADDR: 12

memoryMaps:
  import: my_ip_core.mm.yml

parameters:
  - name: NUM_CHANNELS
    value: 4
    dataType: integer

fileSets:
  - name: RTL_Sources
    files:
      - path: rtl/my_core.vhd
        type: vhdl
```

---

## VLNV (Required)

Every IP core requires a **Vendor-Library-Name-Version** identifier:

```yaml
vlnv:
  vendor: ipcraft          # Your organization name or domain
  library: peripherals     # IP category
  name: ip_core         # Core name (snake_case preferred)
  version: 1.0.0           # Semantic version
```

---

## Clocks & Resets

```yaml
clocks:
  - name: i_clk_sys         # Physical port name in HDL
    logicalName: CLK        # Used by associatedClock references
    direction: in
    frequency: 100MHz

resets:
  - name: i_rst_n
    logicalName: RESET_N
    direction: in
    polarity: activeLow     # activeLow | activeHigh
```

---

## Ports

Generic (non-bus) ports:

```yaml
ports:
  - name: o_irq
    direction: out          # in | out | inout
    width: 1
    description: Interrupt output
```

---

## Bus Interfaces

```yaml
busInterfaces:
  - name: S_AXI_LITE
    type: ipcraft.busif.axi4_lite.1.0   # vendor.library.name.version
    mode: slave             # slave | master | source | sink
    physicalPrefix: s_axi_  # Generates: s_axi_awaddr, s_axi_wdata, etc.
    associatedClock: i_clk  # References clock by physical port name
    associatedReset: i_rst_n
    memoryMapRef: CSR_MAP   # Links to memory map name
    useOptionalPorts:       # Include optional bus signals
      - AWPROT
      - ARPROT
    portWidthOverrides:     # Override default signal widths
      AWADDR: 12
      ARADDR: 12
    description: Control interface
```

### Bus Interface Arrays

For multiple similar interfaces (e.g., 4 AXI-Stream channels):

```yaml
- name: M_AXIS_EVENTS
  type: ipcraft.busif.axi_stream.1.0
  mode: master
  array:
    count: 4
    indexStart: 0
    namingPattern: M_AXIS_CH{index}_EVENTS
    physicalPrefixPattern: m_axis_ch{index}_evt_
```

---

## Connectivity: Memory Maps

IP cores reference memory maps using the `memoryMaps` key.

### Import (Recommended)

Memory maps can be imported from external `*.mm.yml` files. See the [Memory Map Specification](memory_map_spec.md) for details on the format.

```yaml
memoryMaps:
  import: my_core.mm.yml
```

### Inline

```yaml
memoryMaps:
  - name: CSR_MAP
    addressBlocks:
      - name: REGS
        baseAddress: 0
        range: 4096
        usage: register
        registers: [...]
```

---

## Parameters

```yaml
parameters:
  - name: DATA_WIDTH
    value: 32
    dataType: integer        # integer | natural | positive | real | string | boolean
    description: Data bus width
```

---

## File Sets

```yaml
fileSets:
  - name: RTL_Sources
    files:
      - path: rtl/core_pkg.vhd
        type: vhdl
      - path: rtl/core.vhd         # managed: true (default) — regenerated each time
        type: vhdl
      - path: rtl/core_core.vhd    # user implementation — never overwritten
        type: vhdl
        managed: false

  - name: Simulation
    files:
      - path: tb/test.py
        type: python
```

### File Properties

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `path` | string | required | File path relative to the `.ip.yml` |
| `type` | string | required | File type (see below) |
| `managed` | boolean | `true` | Whether `ipcraft generate` may overwrite this file |
| `description` | string | `""` | Human-readable description |
| `isIncludeFile` | boolean | `false` | Mark as a VHDL/Verilog include file |
| `logicalName` | string | `""` | Library name (e.g. VHDL work library) |

### The `managed` flag

The `managed` flag controls whether `ipcraft generate` will overwrite a file
that already exists on disk.

| `managed` | File exists on disk | Behaviour |
|-----------|---------------------|-----------|
| `true` (default) | no | File is **created** |
| `true` (default) | yes | File is **overwritten** |
| `false` | no | File is **created** (first run only) |
| `false` | yes | File is **skipped** — your edits are preserved |

`ipcraft generate` automatically sets `managed: false` on `{name}_core.vhd`
(the bus-agnostic core logic stub) so user implementations are never
overwritten when registers or bus widths change.

You can protect any other file the same way — for example, if you have
hand-edited the generated AXI-Lite wrapper:

```yaml
fileSets:
  - name: RTL_Sources
    files:
      - path: rtl/my_core_axil.vhd
        type: vhdl
        managed: false   # customised — preserve across regeneration
```

### Supported File Types

`vhdl`, `verilog`, `systemverilog`, `xdc`, `sdc`, `ucf`, `cHeader`, `cSource`,
`cppHeader`, `cppSource`, `python`, `makefile`, `pdf`, `markdown`, `text`,
`tcl`, `yaml`, `json`, `xml`.

---

## Templates

| Template | Use Case |
|----------|----------|
| `minimal.ip.yml` | Bare minimum valid IP core |
| `basic.ip.yml` | Clock, reset, and simple ports |
| `axi_slave.ip.yml` | AXI-Lite slave with register map |
| `avalon_peripheral.ip.yml` | Avalon-MM slave and Avalon-ST interfaces |

---

## Examples

Reference examples in `examples/`:

- `minimal/` - Bare minimum IP core
- `basic_peripheral/` - Single AXI4-Lite slave with registers
- `multi_interface_accelerator/` - Multiple interfaces (AXI-L + AXI-S) and complex memory map
- `system_controller/` - Many clocks, resets, and divers bus interfaces

---

## CLI Usage

```bash
# Generate VHDL from IP core
ipcraft generate my_core.ip.yml --output ./generated

# Parse VHDL to create IP core YAML
ipcraft parse entity.vhd

# List available bus types
ipcraft list-buses
```
