<!-- editorconfig-checker-disable-file -->
<!-- This file contains YAML examples with 2-space indentation per YAML standard -->

# IP Core Specification

This document defines the YAML format for IPCraft IP core definitions (`*.ip.yml`).

## File Conventions

| Extension | Purpose | Detection |
|-----------|---------|-----------|
| `*.ip.yml` | IP Core definition | Contains `vlnv` |

---

## IP Core Structure

### Minimal Example

```yaml
vlnv:
  vendor: ipcraft
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

parameters:
  - name: NUM_CHANNELS
    value: 4
    dataType: integer

clocks:
  - name: i_clk_sys
    logicalName: CLK
    direction: in
    frequency: 100MHz
    associatedReset: i_rst_n_sys

resets:
  - name: i_rst_n_sys
    logicalName: RESET_N
    direction: in
    polarity: activeLow
    associatedClock: i_clk_sys

ports:
  - name: o_data_valid
    direction: out
    width: 1
    description: Data valid flag

interrupts:
  - name: o_irq
    logicalName: IRQ_OUT
    direction: out
    sensitivity: LEVEL_HIGH
    description: Interrupt request output

busInterfaces:
  - name: S_AXI_LITE
    type: ipcraft.busif.axi4_lite.1.0
    mode: slave
    physicalPrefix: s_axi_
    associatedClock: i_clk_sys
    associatedReset: i_rst_n_sys
    memoryMapRef: CSR_MAP
    portWidthOverrides:
      AWADDR: 12
      ARADDR: 12

memoryMaps:
  import: my_ip_core.mm.yml

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
  name: ip_core            # Core name (snake_case preferred)
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
    associatedReset: i_rst_n  # Logical name of associated reset

resets:
  - name: i_rst_n
    logicalName: RESET_N
    direction: in
    polarity: activeLow       # activeLow | activeHigh
    associatedClock: i_clk_sys
```

`associatedClock` and `associatedReset` reference each other by **logical name** (`logicalName`), not the physical port name.

---

## Ports

Generic (non-bus) ports that do not belong to a standard bus interface:

```yaml
ports:
  - name: o_irq
    direction: out          # in | out | inout
    width: 1
    description: Interrupt output
```

---

## Interrupts

Interrupt outputs follow the same port structure but carry additional metadata used by platform tools to wire up interrupt controllers.

```yaml
interrupts:
  - name: o_irq
    logicalName: IRQ_OUT        # Logical name for platform wiring
    direction: out
    sensitivity: LEVEL_HIGH     # LEVEL_HIGH | LEVEL_LOW | EDGE_RISING | EDGE_FALLING | EDGE_BOTH
    description: Interrupt request output
```

---

## Bus Interfaces

```yaml
busInterfaces:
  - name: S_AXI_LITE
    type: ipcraft.busif.axi4_lite.1.0   # vendor.library.name.version
    mode: slave             # slave | master | source | sink | conduit
    physicalPrefix: s_axi_  # Generates: s_axi_awaddr, s_axi_wdata, etc.
    associatedClock: i_clk  # References clock by physical port name
    associatedReset: i_rst_n
    memoryMapRef: CSR_MAP   # Links to a memory map by name
    portWidthOverrides:     # Override default signal widths from the bus definition
      AWADDR: 12
      ARADDR: 12
    description: Control interface
```

### Bus Interface Modes

| Mode | Description |
|------|-------------|
| `slave` | Responds to transactions initiated by a master (e.g. AXI-Lite slave) |
| `master` | Initiates transactions (e.g. AXI-Lite master, DMA engine) |
| `source` | Produces streaming data (e.g. AXI-Stream transmitter) |
| `sink` | Consumes streaming data (e.g. AXI-Stream receiver) |
| `conduit` | Pass-through or non-standard signals grouped as an interface |

### `portWidthOverrides`

Override the default signal widths defined in the bus definition. Common use: narrowing the address bus of an AXI-Lite slave to match the actual register space.

```yaml
portWidthOverrides:
  AWADDR: 12    # address bus is 12 bits wide, not the default 32
  ARADDR: 12
```

### `useOptionalPorts`

Bus definitions mark some signals as optional. By default these are excluded from the generated port list. List them here to include them. Example for AXI-Stream sideband signals:

```yaml
useOptionalPorts:
  - TLAST
  - TUSER
  - TID
```

Refer to the relevant file in `bus_definitions/` to see which signals are optional for a given bus type.

### Bus Interface Arrays

For multiple similar interfaces (e.g. 4 AXI-Stream output channels):

```yaml
- name: M_AXIS_EVENTS
  type: ipcraft.busif.axi_stream.1.0
  mode: source
  array:
    count: 4
    indexStart: 0
    namingPattern: M_AXIS_CH{index}_EVENTS
    physicalPrefixPattern: m_axis_ch{index}_evt_
```

### Available Bus Types

| Type string | Protocol |
|-------------|----------|
| `ipcraft.busif.axi4_lite.1.0` | AXI4-Lite |
| `ipcraft.busif.axi4_full.1.0` | AXI4 (full, with bursts) |
| `ipcraft.busif.axi_stream.1.0` | AXI4-Stream |
| `ipcraft.busif.avalon_mm.1.0` | Avalon Memory-Mapped |
| `ipcraft.busif.avalon_st.1.0` | Avalon Streaming |

Full port lists for each bus type are in `bus_definitions/`.

---

## Memory Maps

IP cores reference memory maps using the `memoryMaps` key.

### Import (Recommended)

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

See the [Memory Map Specification](memory_map_spec.md) for register and field details.

---

## Parameters

Parameters map to HDL generics/parameters and can be referenced in `portWidthOverrides`.

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

  - name: Integration
    files:
      - path: altera/core_hw.tcl
        type: tcl
      - path: xilinx/component.xml
        type: xml
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

The `managed` flag controls whether `ipcraft generate` will overwrite a file that already exists on disk.

| `managed` | File exists on disk | Behaviour |
|-----------|---------------------|-----------|
| `true` (default) | no | File is **created** |
| `true` (default) | yes | File is **overwritten** |
| `false` | no | File is **created** (first run only) |
| `false` | yes | File is **skipped** — your edits are preserved |

`ipcraft generate` automatically sets `managed: false` on `{name}_core.vhd` (the bus-agnostic core logic stub) so user implementations are never overwritten when registers or bus widths change.

### Supported File Types

`vhdl`, `verilog`, `systemverilog`, `xdc`, `sdc`, `ucf`, `cHeader`, `cSource`,
`cppHeader`, `cppSource`, `python`, `makefile`, `pdf`, `markdown`, `text`,
`tcl`, `yaml`, `json`, `xml`, `unknown`.

---

## Sub-cores

IP cores can declare dependencies on other IP cores using `subcores`. This is used by platform tools to resolve and include required sub-components.

```yaml
subcores:
  - vendor: ipcraft
    library: primitives
    name: fifo_sync
    version: 1.0.0
```

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

- `minimal/` — Bare minimum IP core (VLNV only)
- `basic_peripheral/` — AXI4-Lite slave with interrupt and register map
- `multi_interface_accelerator/` — Multiple interfaces (AXI-L + AXI-S), async clocks, complex memory map
- `system_controller/` — Many clocks, resets, and diverse bus interfaces
